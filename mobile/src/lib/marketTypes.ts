// ---------------------------------------------------------------------------
// Bits Market — Type Definitions
// ---------------------------------------------------------------------------

export type ListingCategory = 'weapons' | 'bodies' | 'vehicles' | 'accessories' | 'full_model' | 'sprue' | 'other';
export type ListingCondition = 'new_on_sprue' | 'new_assembled' | 'painted' | 'used' | 'damaged';
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'archived';

export interface MarketListing {
  id: string;
  seller_id: string;
  seller_name?: string;
  title: string;
  description: string;
  faction_id: string | null;
  unit_name: string | null;
  category: ListingCategory;
  price: number;
  condition: ListingCondition;
  photos: string[];
  photo_urls?: string[];
  status: ListingStatus;
  location: string;
  shipping: boolean;
  created_at: string;
  updated_at: string;
  is_favorited?: boolean;
}

export interface CreateListingInput {
  title: string;
  description: string;
  faction_id?: string;
  unit_name?: string;
  category: ListingCategory;
  price: number;
  condition: ListingCondition;
  location: string;
  shipping: boolean;
}

export interface MarketMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  sender_name?: string;
  recipient_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export interface ConversationSummary {
  listing_id: string;
  listing_title: string;
  listing_photo?: string;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export interface MarketFilters {
  query?: string;
  faction_id?: string;
  category?: ListingCategory;
  condition?: ListingCondition;
  min_price?: number;
  max_price?: number;
  shipping_only?: boolean;
}

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  weapons: 'Weapons',
  bodies: 'Bodies / Torsos',
  vehicles: 'Vehicles',
  accessories: 'Accessories / Bits',
  full_model: 'Full Model',
  sprue: 'Sprue / Uncut',
  other: 'Other',
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new_on_sprue: 'New on Sprue',
  new_assembled: 'Assembled (Unpainted)',
  painted: 'Painted',
  used: 'Used',
  damaged: 'Damaged',
};

export const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  sold: 'Sold',
  reserved: 'Reserved',
  archived: 'Archived',
};
