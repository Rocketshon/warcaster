import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { useArmy } from '../../contexts/ArmyContext';
import { CONDITION_LABELS, type MarketListing } from '../../lib/marketTypes';

export default function BitsINeedScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { bitsINeed, fetchBitsINeed } = useMarket();
  const { army, factionId } = useArmy();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBitsINeed().catch(() => {}).finally(() => setLoading(false));
  }, [fetchBitsINeed]);

  const hasArmy = army.length > 0;

  const renderItem = ({ item }: { item: MarketListing }) => {
    const photoUrl = item.photo_urls?.[0];
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Bits I Need</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Army info */}
      {hasArmy && (
        <View style={[styles.armyBanner, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
          <Ionicons name="shield" size={18} color={colors.accentGold} />
          <Text style={[styles.armyBannerText, { color: colors.textSecondary }]}>
            Showing matches for your active army ({army.length} unit{army.length !== 1 ? 's' : ''})
          </Text>
        </View>
      )}

      {/* Content */}
      {!hasArmy ? (
        <View style={styles.centered}>
          <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Build an army first</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Add units to your army to see matching listings here
          </Text>
          <TouchableOpacity
            style={[styles.armyBtn, { backgroundColor: colors.accentGold }]}
            onPress={() => {
              // Navigate to the Army tab
              navigation.getParent()?.navigate('ArmyTab');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.armyBtnText}>Go to Army Builder</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      ) : (
        <FlatList
          data={bitsINeed}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No matching listings found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Check back later for bits matching your army
              </Text>
            </View>
          }
        />
      )}
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
    armyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
    },
    armyBannerText: {
      fontSize: 13,
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
    },
    armyBtn: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 28,
      marginTop: 8,
    },
    armyBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    columnWrapper: {
      paddingHorizontal: 12,
      gap: 8,
    },
    listContent: {
      paddingBottom: 40,
      paddingTop: 4,
      flexGrow: 1,
    },
    card: {
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
  });
}
