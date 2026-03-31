import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useArmy } from '../../contexts/ArmyContext';
import { CONDITION_LABELS, type MarketListing } from '../../lib/marketTypes';

export default function MarketHomeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { listings, listingsLoading, fetchListings, unreadCount } = useMarket();
  const { user } = useAuth();
  const { army } = useArmy();

  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchListings().catch(() => {});
  }, [fetchListings]);

  const handleSearch = useCallback(() => {
    fetchListings(search.trim() ? { query: search.trim() } : undefined).catch(() => {});
  }, [search, fetchListings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchListings(search.trim() ? { query: search.trim() } : undefined);
    } catch {}
    setRefreshing(false);
  }, [fetchListings, search]);

  const renderListingCard = ({ item }: { item: MarketListing }) => {
    const photoUrl = item.photo_urls?.[0];
    return (
      <TouchableOpacity
        style={[styles.listingCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
        onPress={() => navigation.navigate('ListingDetail', { listingId: item.id })}
        activeOpacity={0.7}
      >
        <View style={[styles.photoContainer, { backgroundColor: colors.bgPrimary }]}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardPrice, { color: colors.accentGold }]}>
            ${item.price.toFixed(2)}
          </Text>
          <View style={[styles.conditionBadge, { backgroundColor: colors.accentGold + '20', borderColor: colors.accentGold + '40' }]}>
            <Text style={[styles.conditionText, { color: colors.accentGold }]}>
              {CONDITION_LABELS[item.condition] ?? item.condition}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = makeStyles(colors);

  const hasArmy = army.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Market</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => {
              if (user) {
                navigation.navigate('MessagesInbox');
              } else {
                navigation.navigate('Login');
              }
            }}
            style={styles.headerIconButton}
          >
            <Ionicons name="mail-outline" size={24} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (user) {
                navigation.navigate('MyListings');
              } else {
                navigation.navigate('Login');
              }
            }}
            style={styles.headerIconButton}
          >
            <Ionicons name={user ? 'person' : 'person-outline'} size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.bgCard, borderColor: colors.borderColor, color: colors.textPrimary }]}
          placeholder="Search listings..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      {/* Bits I Need Card */}
      {hasArmy && (
        <TouchableOpacity
          style={[styles.bitsCard, { borderColor: colors.accentGold }]}
          onPress={() => navigation.navigate('BitsINeed')}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles" size={20} color={colors.accentGold} />
          <View style={styles.bitsCardText}>
            <Text style={[styles.bitsCardTitle, { color: colors.accentGold }]}>Bits I Need</Text>
            <Text style={[styles.bitsCardSubtitle, { color: colors.textSecondary }]}>
              Listings matching your army
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.accentGold} />
        </TouchableOpacity>
      )}

      {/* Listings */}
      {listingsLoading && listings.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accentGold}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No listings found
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accentGold }]}
        onPress={() => {
          if (user) {
            navigation.navigate('CreateListing');
          } else {
            navigation.navigate('Login');
          }
        }}
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 1,
    },
    headerIcons: {
      flexDirection: 'row',
      gap: 16,
    },
    headerIconButton: {
      position: 'relative',
      padding: 4,
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -4,
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    searchContainer: {
      paddingHorizontal: 16,
      marginBottom: 12,
      position: 'relative',
    },
    searchIcon: {
      position: 'absolute',
      left: 28,
      top: 12,
      zIndex: 1,
    },
    searchInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 40,
      paddingVertical: 10,
      fontSize: 15,
    },
    bitsCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderRadius: 8,
      padding: 14,
      gap: 12,
    },
    bitsCardText: {
      flex: 1,
    },
    bitsCardTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    bitsCardSubtitle: {
      fontSize: 12,
      marginTop: 2,
    },
    columnWrapper: {
      paddingHorizontal: 12,
      gap: 8,
    },
    listContent: {
      paddingBottom: 100,
      paddingTop: 4,
    },
    listingCard: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
    },
    photoContainer: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photo: {
      width: '100%',
      height: '100%',
    },
    cardBody: {
      padding: 10,
      gap: 4,
    },
    cardTitle: {
      fontSize: 13,
      fontWeight: '600',
    },
    cardPrice: {
      fontSize: 16,
      fontWeight: '800',
    },
    conditionBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    conditionText: {
      fontSize: 10,
      fontWeight: '600',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
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
