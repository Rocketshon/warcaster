import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { useAuth } from '../../contexts/AuthContext';
import { STATUS_LABELS, type MarketListing, type ListingStatus } from '../../lib/marketTypes';

const STATUS_COLORS: Record<ListingStatus, string> = {
  active: '#16a34a',
  sold: '#ef4444',
  reserved: '#eab308',
  archived: '#6b7280',
};

export default function MyListingsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { myListings, fetchMyListings, deleteListing, updateListing } = useMarket();
  const { user } = useAuth();

  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchMyListings().catch(() => {}).finally(() => setLoading(false));
  }, [user, fetchMyListings]);

  const handleAction = useCallback((listing: MarketListing, action: string) => {
    switch (action) {
      case 'edit':
        navigation.navigate('CreateListing', { listingId: listing.id });
        break;
      case 'sold':
        Alert.alert('Mark as Sold', 'Mark this listing as sold?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Mark Sold',
            onPress: async () => {
              try {
                await updateListing(listing.id, {} as any);
                await fetchMyListings();
              } catch {}
            },
          },
        ]);
        break;
      case 'delete':
        Alert.alert('Delete Listing', 'This cannot be undone.', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteListing(listing.id);
              } catch {}
            },
          },
        ]);
        break;
    }
  }, [navigation, updateListing, deleteListing, fetchMyListings]);

  const styles = makeStyles(colors);

  // Auth guard
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sign in to manage your listings</Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.accentGold }]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.signInBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: MarketListing }) => {
    const photoUrl = item.photo_urls?.[0];
    const statusColor = STATUS_COLORS[item.status] ?? colors.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.listingRow, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
        onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.thumbContainer, { backgroundColor: colors.bgPrimary }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.rowPrice, { color: colors.accentGold }]}>${item.price.toFixed(2)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[item.status] ?? item.status}
            </Text>
          </View>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => handleAction(item, 'edit')} style={styles.actionIcon}>
            <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAction(item, 'sold')} style={styles.actionIcon}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.accentGold} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAction(item, 'delete')} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      ) : (
        <FlatList
          data={myListings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="pricetag-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No listings yet — tap + to create one
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accentGold }]}
        onPress={() => navigation.navigate('CreateListing')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },
    emptyText: { fontSize: 15, textAlign: 'center' },
    signInBtn: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 32,
      marginTop: 8,
    },
    signInBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      flexGrow: 1,
    },
    listingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      gap: 12,
    },
    thumbContainer: {
      width: 60,
      height: 60,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    thumb: {
      width: 60,
      height: 60,
    },
    rowInfo: {
      flex: 1,
      gap: 4,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    rowPrice: {
      fontSize: 16,
      fontWeight: '800',
    },
    statusBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    rowActions: {
      gap: 8,
    },
    actionIcon: {
      padding: 4,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
  });
}
