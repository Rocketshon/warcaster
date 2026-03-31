// ---------------------------------------------------------------------------
// Market Context -- Bits Market listings, messaging, and smart suggestions
// ---------------------------------------------------------------------------

import {
  createContext, useContext, useState, useCallback, useMemo,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useArmy } from './ArmyContext';
import { useCollection } from './CollectionContext';
import type {
  MarketListing, MarketFilters, CreateListingInput,
  MarketMessage, ConversationSummary,
} from '../lib/marketTypes';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface MarketState {
  listings: MarketListing[];
  listingsLoading: boolean;
  fetchListings: (filters?: Partial<MarketFilters>) => Promise<void>;
  fetchListing: (id: string) => Promise<MarketListing | null>;
  createListing: (data: CreateListingInput, photoUris: string[]) => Promise<string>;
  updateListing: (id: string, data: Partial<CreateListingInput>) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  myListings: MarketListing[];
  fetchMyListings: () => Promise<void>;
  favorites: MarketListing[];
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (listingId: string) => Promise<void>;
  conversations: ConversationSummary[];
  fetchConversations: () => Promise<void>;
  unreadCount: number;
  sendMessage: (listingId: string, recipientId: string, text: string) => Promise<void>;
  fetchMessages: (listingId: string, otherUserId: string) => Promise<MarketMessage[]>;
  bitsINeed: MarketListing[];
  fetchBitsINeed: () => Promise<void>;
}

const MarketContext = createContext<MarketState | null>(null);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolvePhotoUrls(paths: string[]): string[] {
  return paths.map(p =>
    supabase.storage.from('market-photos').getPublicUrl(p).data.publicUrl,
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function MarketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { army } = useArmy();
  const { items: collectionItems } = useCollection();

  const [listings, setListings] = useState<MarketListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [myListings, setMyListings] = useState<MarketListing[]>([]);
  const [favorites, setFavorites] = useState<MarketListing[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [bitsINeed, setBitsINeed] = useState<MarketListing[]>([]);

  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread_count, 0),
    [conversations],
  );

  // ----- Listings ---------------------------------------------------------

  const fetchListings = useCallback(async (filters?: Partial<MarketFilters>) => {
    setListingsLoading(true);
    try {
      let query = supabase
        .from('cc_market_listings')
        .select('*, cc_profiles!seller_id(display_name)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters?.query) {
        query = query.ilike('title', `%${filters.query}%`);
      }
      if (filters?.faction_id) {
        query = query.eq('faction_id', filters.faction_id);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }
      if (filters?.min_price !== undefined) {
        query = query.gte('price', filters.min_price);
      }
      if (filters?.max_price !== undefined) {
        query = query.lte('price', filters.max_price);
      }
      if (filters?.shipping_only) {
        query = query.eq('shipping', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      const mapped: MarketListing[] = (data ?? []).map((row: any) => ({
        ...row,
        seller_name: row.cc_profiles?.display_name ?? 'Unknown',
        photo_urls: resolvePhotoUrls(row.photos ?? []),
      }));
      setListings(mapped);
    } finally {
      setListingsLoading(false);
    }
  }, []);

  const fetchListing = useCallback(async (id: string): Promise<MarketListing | null> => {
    const { data, error } = await supabase
      .from('cc_market_listings')
      .select('*, cc_profiles!seller_id(display_name)')
      .eq('id', id)
      .single();
    if (error || !data) return null;

    // Check favorite status if logged in
    let isFavorited = false;
    if (user) {
      const { count } = await supabase
        .from('cc_market_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', id)
        .eq('user_id', user.id);
      isFavorited = (count ?? 0) > 0;
    }

    return {
      ...data,
      seller_name: (data as any).cc_profiles?.display_name ?? 'Unknown',
      photo_urls: resolvePhotoUrls(data.photos ?? []),
      is_favorited: isFavorited,
    } as MarketListing;
  }, [user]);

  const createListing = useCallback(async (input: CreateListingInput, photoUris: string[]): Promise<string> => {
    if (!user) throw new Error('Must be logged in to create listings');

    // Insert the listing row first
    const { data: row, error: insertErr } = await supabase
      .from('cc_market_listings')
      .insert({
        seller_id: user.id,
        title: input.title,
        description: input.description,
        faction_id: input.faction_id ?? null,
        unit_name: input.unit_name ?? null,
        category: input.category,
        price: input.price,
        condition: input.condition,
        location: input.location,
        shipping: input.shipping,
        photos: [],
        status: 'active',
      })
      .select('id')
      .single();
    if (insertErr || !row) throw insertErr ?? new Error('Insert failed');

    const listingId = row.id as string;

    // Upload photos from URIs (expo-image-picker handles resize via its options)
    if (photoUris.length > 0) {
      const paths: string[] = [];
      for (let i = 0; i < photoUris.length; i++) {
        const response = await fetch(photoUris[i]);
        const blob = await response.blob();
        const path = `${user.id}/${listingId}/${i}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('market-photos')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        if (uploadErr) throw uploadErr;
        paths.push(path);
      }

      // Update listing with photo paths
      const { error: updateErr } = await supabase
        .from('cc_market_listings')
        .update({ photos: paths })
        .eq('id', listingId);
      if (updateErr) throw updateErr;
    }

    return listingId;
  }, [user]);

  const updateListing = useCallback(async (id: string, data: Partial<CreateListingInput>) => {
    const { error } = await supabase
      .from('cc_market_listings')
      .update(data)
      .eq('id', id);
    if (error) throw error;
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('cc_market_listings')
      .update({ status: 'archived' })
      .eq('id', id);
    if (error) throw error;
    setMyListings(prev => prev.filter(l => l.id !== id));
  }, []);

  // ----- My Listings ------------------------------------------------------

  const fetchMyListings = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cc_market_listings')
      .select('*, cc_profiles!seller_id(display_name)')
      .eq('seller_id', user.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false });
    if (error) throw error;

    setMyListings((data ?? []).map((row: any) => ({
      ...row,
      seller_name: row.cc_profiles?.display_name ?? 'You',
      photo_urls: resolvePhotoUrls(row.photos ?? []),
    })));
  }, [user]);

  // ----- Favorites --------------------------------------------------------

  const fetchFavorites = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('cc_market_favorites')
      .select('listing_id, cc_market_listings!listing_id(*, cc_profiles!seller_id(display_name))')
      .eq('user_id', user.id);
    if (error) throw error;

    const mapped: MarketListing[] = (data ?? []).map((row: any) => {
      const l = row.cc_market_listings;
      return {
        ...l,
        seller_name: l.cc_profiles?.display_name ?? 'Unknown',
        photo_urls: resolvePhotoUrls(l.photos ?? []),
        is_favorited: true,
      };
    });
    setFavorites(mapped);
  }, [user]);

  const toggleFavorite = useCallback(async (listingId: string) => {
    if (!user) return;
    const { count } = await supabase
      .from('cc_market_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)
      .eq('user_id', user.id);

    if ((count ?? 0) > 0) {
      await supabase.from('cc_market_favorites')
        .delete()
        .eq('listing_id', listingId)
        .eq('user_id', user.id);
      setFavorites(prev => prev.filter(f => f.id !== listingId));
    } else {
      await supabase.from('cc_market_favorites')
        .insert({ listing_id: listingId, user_id: user.id });
    }
  }, [user]);

  // ----- Messaging --------------------------------------------------------

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: msgs, error } = await supabase
      .from('cc_market_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!msgs || msgs.length === 0) { setConversations([]); return; }

    // Group by (listing_id, other_user_id)
    const groups = new Map<string, { msgs: any[]; otherUserId: string; listingId: string }>();
    for (const m of msgs) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const key = `${m.listing_id}::${otherId}`;
      if (!groups.has(key)) groups.set(key, { msgs: [], otherUserId: otherId, listingId: m.listing_id });
      groups.get(key)!.msgs.push(m);
    }

    // Fetch listing titles in bulk
    const listingIds = [...new Set([...groups.values()].map(g => g.listingId))];
    const { data: listingRows } = await supabase
      .from('cc_market_listings')
      .select('id, title, photos')
      .in('id', listingIds);
    const listingMap = new Map((listingRows ?? []).map((r: any) => [r.id, r]));

    // Fetch other-user display names
    const otherIds = [...new Set([...groups.values()].map(g => g.otherUserId))];
    const { data: profileRows } = await supabase
      .from('cc_profiles')
      .select('id, display_name')
      .in('id', otherIds);
    const profileMap = new Map((profileRows ?? []).map((r: any) => [r.id, r.display_name]));

    const convos: ConversationSummary[] = [...groups.values()].map(g => {
      const listing = listingMap.get(g.listingId);
      const lastMsg = g.msgs[0];
      const unread = g.msgs.filter((m: any) => m.recipient_id === user.id && !m.read).length;
      return {
        listing_id: g.listingId,
        listing_title: listing?.title ?? 'Unknown Listing',
        listing_photo: listing?.photos?.[0]
          ? supabase.storage.from('market-photos').getPublicUrl(listing.photos[0]).data.publicUrl
          : undefined,
        other_user_id: g.otherUserId,
        other_user_name: profileMap.get(g.otherUserId) ?? 'Unknown',
        last_message: lastMsg.text,
        last_message_at: lastMsg.created_at,
        unread_count: unread,
      };
    });

    convos.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConversations(convos);
  }, [user]);

  const sendMessage = useCallback(async (listingId: string, recipientId: string, text: string) => {
    if (!user) throw new Error('Must be logged in to send messages');
    const { error } = await supabase
      .from('cc_market_messages')
      .insert({
        listing_id: listingId,
        sender_id: user.id,
        recipient_id: recipientId,
        text,
        read: false,
      });
    if (error) throw error;
  }, [user]);

  const fetchMessages = useCallback(async (listingId: string, otherUserId: string): Promise<MarketMessage[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from('cc_market_messages')
      .select('*, cc_profiles!sender_id(display_name)')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Mark unread messages as read
    const unreadIds = (data ?? [])
      .filter((m: any) => m.recipient_id === user.id && !m.read)
      .map((m: any) => m.id);
    if (unreadIds.length > 0) {
      await supabase.from('cc_market_messages')
        .update({ read: true })
        .in('id', unreadIds);
    }

    return (data ?? []).map((row: any) => ({
      ...row,
      sender_name: row.cc_profiles?.display_name ?? 'Unknown',
    }));
  }, [user]);

  // ----- Bits I Need (smart suggestions) ----------------------------------

  const fetchBitsINeed = useCallback(async () => {
    // Get all active listings
    const { data, error } = await supabase
      .from('cc_market_listings')
      .select('*, cc_profiles!seller_id(display_name)')
      .eq('status', 'active');
    if (error) throw error;
    if (!data || data.length === 0) { setBitsINeed([]); return; }

    // Extract army unit names and faction IDs
    const armyUnits = army.map(u => ({
      name: u.datasheet_name.toLowerCase(),
      faction: u.faction_id,
    }));

    // Score each listing against army composition
    const ownedNames = new Set(collectionItems.map(i => i.name.toLowerCase()));

    const scored = data.map((row: any) => {
      let score = 0;
      const titleLower = row.title?.toLowerCase() ?? '';
      const unitLower = row.unit_name?.toLowerCase() ?? '';

      for (const au of armyUnits) {
        // +10 exact unit_name match
        if (unitLower && unitLower === au.name) score += 10;
        // +2 faction match
        if (row.faction_id && row.faction_id === au.faction) score += 2;
        // +3 keyword in title
        const words = au.name.split(/\s+/);
        for (const w of words) {
          if (w.length > 2 && titleLower.includes(w)) { score += 3; break; }
        }
      }

      // Deprioritize items already in collection
      if (ownedNames.has(unitLower) || ownedNames.has(titleLower)) {
        score = Math.max(0, score - 5);
      }

      return {
        ...row,
        seller_name: row.cc_profiles?.display_name ?? 'Unknown',
        photo_urls: resolvePhotoUrls(row.photos ?? []),
        _score: score,
      };
    });

    const filtered = scored
      .filter((s: any) => s._score > 0)
      .sort((a: any, b: any) => b._score - a._score);

    // Strip internal score field
    setBitsINeed(filtered.map(({ _score, ...rest }: any) => rest as MarketListing));
  }, [army, collectionItems]);

  // ----- Context value ----------------------------------------------------

  const value: MarketState = useMemo(() => ({
    listings,
    listingsLoading,
    fetchListings,
    fetchListing,
    createListing,
    updateListing,
    deleteListing,
    myListings,
    fetchMyListings,
    favorites,
    fetchFavorites,
    toggleFavorite,
    conversations,
    fetchConversations,
    unreadCount,
    sendMessage,
    fetchMessages,
    bitsINeed,
    fetchBitsINeed,
  }), [
    listings, listingsLoading, fetchListings, fetchListing,
    createListing, updateListing, deleteListing,
    myListings, fetchMyListings,
    favorites, fetchFavorites, toggleFavorite,
    conversations, fetchConversations, unreadCount,
    sendMessage, fetchMessages,
    bitsINeed, fetchBitsINeed,
  ]);

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket(): MarketState {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within a MarketProvider');
  return ctx;
}
