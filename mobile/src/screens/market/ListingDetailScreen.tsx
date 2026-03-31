import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { useAuth } from '../../contexts/AuthContext';
import { CONDITION_LABELS, CATEGORY_LABELS, type MarketListing } from '../../lib/marketTypes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { fetchListing, toggleFavorite, deleteListing, updateListing } = useMarket();
  const { user } = useAuth();

  const listingId = route.params?.listingId as string;

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetchListing(listingId)
      .then((l) => {
        setListing(l);
        setFavorited(l?.is_favorited ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId, fetchListing]);

  const handleToggleFavorite = async () => {
    if (!user) { navigation.navigate('Login'); return; }
    try {
      await toggleFavorite(listingId);
      setFavorited((prev) => !prev);
    } catch {}
  };

  const handleMarkSold = () => {
    Alert.alert('Mark as Sold', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Sold',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateListing(listingId, {} as any);
            // Refetch to update status
            const updated = await fetchListing(listingId);
            setListing(updated);
          } catch {}
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteListing(listingId);
            navigation.goBack();
          } catch {}
        },
      },
    ]);
  };

  const styles = makeStyles(colors);
  const isOwner = user && listing?.seller_id === user.id;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Listing not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photos = listing.photo_urls ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back + Favorite header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          {!isOwner && (
            <TouchableOpacity onPress={handleToggleFavorite} style={styles.topBarButton}>
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={24}
                color={favorited ? colors.error : colors.textPrimary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Photos */}
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.photoScroll}
          >
            {photos.map((url, i) => (
              <Image key={i} source={{ uri: url }} style={styles.photoImage} resizeMode="cover" />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.noPhotoContainer, { backgroundColor: colors.bgCard }]}>
            <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.noPhotoText, { color: colors.textSecondary }]}>No photos</Text>
          </View>
        )}

        {/* Title + Price */}
        <View style={styles.section}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>
          <Text style={[styles.price, { color: colors.accentGold }]}>${listing.price.toFixed(2)}</Text>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.accentGold + '20', borderColor: colors.accentGold + '40' }]}>
            <Text style={[styles.badgeText, { color: colors.accentGold }]}>
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {CATEGORY_LABELS[listing.category] ?? listing.category}
            </Text>
          </View>
        </View>

        {/* Faction & Unit */}
        {(listing.faction_id || listing.unit_name) && (
          <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
            {listing.faction_id ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Faction</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.faction_id}</Text>
              </View>
            ) : null}
            {listing.unit_name ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Unit</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.unit_name}</Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Description */}
        {listing.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textPrimary }]}>{listing.description}</Text>
          </View>
        ) : null}

        {/* Seller */}
        <View style={[styles.sellerCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
          <Ionicons name="person-circle-outline" size={40} color={colors.textSecondary} />
          <View style={styles.sellerInfo}>
            <Text style={[styles.sellerName, { color: colors.textPrimary }]}>
              {listing.seller_name ?? 'Unknown'}
            </Text>
            <Text style={[styles.sellerLabel, { color: colors.textSecondary }]}>Seller</Text>
          </View>
        </View>

        {/* Location & Shipping */}
        <View style={[styles.infoCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
          {listing.location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.location}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
              {listing.shipping ? 'Shipping available' : 'Local pickup only'}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {isOwner ? (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
              onPress={() => navigation.navigate('CreateListing', { listingId: listing.id })}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.bgCard, borderColor: colors.accentGold }]}
              onPress={handleMarkSold}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.accentGold} />
              <Text style={[styles.actionButtonText, { color: colors.accentGold }]}>Mark Sold</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.bgCard, borderColor: colors.error }]}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.messageSellButton, { backgroundColor: colors.accentGold }]}
            onPress={() => {
              if (!user) { navigation.navigate('Login'); return; }
              navigation.navigate('Chat', { listingId: listing.id, otherUserId: listing.seller_id });
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.messageSellText}>Message Seller</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    scrollContent: { paddingBottom: 40 },
    backButton: { padding: 16 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    topBarButton: { padding: 4 },
    photoScroll: { height: 280 },
    photoImage: { width: SCREEN_WIDTH, height: 280 },
    noPhotoContainer: {
      height: 200,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    noPhotoText: { fontSize: 14 },
    section: { paddingHorizontal: 16, marginTop: 16 },
    title: { fontSize: 22, fontWeight: '700' },
    price: { fontSize: 28, fontWeight: '800', marginTop: 4 },
    badgeRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 12,
    },
    badge: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    infoCard: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 16,
      gap: 10,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoLabel: { fontSize: 12, width: 60 },
    infoValue: { fontSize: 14, flex: 1 },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    description: { fontSize: 15, lineHeight: 22 },
    sellerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 16,
      gap: 12,
    },
    sellerInfo: { flex: 1 },
    sellerName: { fontSize: 16, fontWeight: '600' },
    sellerLabel: { fontSize: 12, marginTop: 2 },
    ownerActions: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 20,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 12,
    },
    actionButtonText: { fontSize: 13, fontWeight: '600' },
    messageSellButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 20,
      borderRadius: 8,
      paddingVertical: 16,
    },
    messageSellText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    emptyText: { fontSize: 15 },
  });
}
