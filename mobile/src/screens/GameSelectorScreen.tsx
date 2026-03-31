import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useGameData } from '../contexts/GameDataContext';
import { isExternalDataLoaded } from '../data';
import type { GameManifestEntry } from '../lib/dataManager';

export default function GameSelectorScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const {
    manifest,
    manifestLoading,
    manifestError,
    activeGameId,
    dataLoading,
    dataError,
    refreshManifest,
    selectGame,
    isCached,
  } = useGameData();

  const [cachedMap, setCachedMap] = useState<Record<string, boolean>>({});
  const [selectingId, setSelectingId] = useState<string | null>(null);

  // Build cached status map
  useEffect(() => {
    if (!manifest?.games) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, boolean> = {};
      for (const game of manifest.games) {
        map[game.id] = await isCached(game.id);
      }
      if (!cancelled) setCachedMap(map);
    })();
    return () => { cancelled = true; };
  }, [manifest, isCached]);

  // Refresh manifest on mount if not already loaded
  useEffect(() => {
    if (!manifest && !manifestLoading) {
      refreshManifest();
    }
  }, [manifest, manifestLoading, refreshManifest]);

  const handleSelectGame = useCallback(async (gameId: string) => {
    setSelectingId(gameId);
    await selectGame(gameId);
    setSelectingId(null);
    navigation.goBack();
  }, [selectGame, navigation]);

  const onRefresh = useCallback(async () => {
    await refreshManifest();
  }, [refreshManifest]);

  const styles = makeStyles(colors);

  const renderGameCard = (game: GameManifestEntry) => {
    const isActive = activeGameId === game.id;
    const isCachedGame = cachedMap[game.id] ?? false;
    const isSelecting = selectingId === game.id;

    return (
      <TouchableOpacity
        key={game.id}
        style={[
          styles.gameCard,
          {
            backgroundColor: colors.bgCard,
            borderColor: isActive ? colors.accentGold : colors.borderColor,
            borderWidth: isActive ? 2 : 1,
          },
        ]}
        onPress={() => handleSelectGame(game.id)}
        disabled={dataLoading}
        activeOpacity={0.7}
      >
        <View style={styles.gameCardHeader}>
          <Text style={styles.gameIcon}>{game.icon}</Text>
          <View style={styles.gameCardInfo}>
            <Text style={[styles.gameName, { color: colors.textPrimary }]}>{game.name}</Text>
            <Text style={[styles.gameEdition, { color: colors.textSecondary }]}>
              {game.edition} {'\u00B7'} v{game.version}
            </Text>
          </View>
          <View style={styles.badges}>
            {isActive && (
              <View style={[styles.badge, { backgroundColor: colors.accentGold + '30', borderColor: colors.accentGold }]}>
                <Text style={[styles.badgeText, { color: colors.accentGold }]}>Active</Text>
              </View>
            )}
            {!isActive && isCachedGame && (
              <View style={[styles.badge, { backgroundColor: colors.info + '20', borderColor: colors.info }]}>
                <Text style={[styles.badgeText, { color: colors.info }]}>Cached</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.gameDescription, { color: colors.textSecondary }]}>
          {game.description}
        </Text>
        {isSelecting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={colors.accentGold} />
            <Text style={[styles.loadingText, { color: colors.accentGold }]}>Loading data...</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Select Game</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={manifestLoading}
            onRefresh={onRefresh}
            tintColor={colors.accentGold}
          />
        }
      >
        {/* Error state */}
        {manifestError && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{manifestError}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { borderColor: colors.error }]}
              onPress={refreshManifest}
              activeOpacity={0.7}
            >
              <Text style={[styles.retryText, { color: colors.error }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Data loading error */}
        {dataError && (
          <View style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{dataError}</Text>
          </View>
        )}

        {/* Loading state */}
        {manifestLoading && !manifest && (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accentGold} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading game list...</Text>
          </View>
        )}

        {/* Game list */}
        {manifest?.games.map(renderGameCard)}

        {/* No games */}
        {manifest && manifest.games.length === 0 && (
          <View style={styles.centered}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No games available in the manifest.
            </Text>
          </View>
        )}

        {/* Bundled data notice */}
        <View style={[styles.noticeCard, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}>
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
            {isExternalDataLoaded()
              ? 'External game data is loaded.'
              : 'No game selected \u2014 using bundled data.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    backText: {
      fontSize: 14,
      marginBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      letterSpacing: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 100,
      gap: 12,
    },
    gameCard: {
      borderRadius: 8,
      padding: 16,
      gap: 8,
    },
    gameCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    gameIcon: {
      fontSize: 32,
    },
    gameCardInfo: {
      flex: 1,
    },
    gameName: {
      fontSize: 16,
      fontWeight: '600',
    },
    gameEdition: {
      fontSize: 12,
      marginTop: 2,
    },
    badges: {
      flexDirection: 'row',
      gap: 6,
    },
    badge: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    gameDescription: {
      fontSize: 13,
      lineHeight: 18,
    },
    loadingOverlay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 8,
    },
    errorCard: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      gap: 12,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      textAlign: 'center',
    },
    retryButton: {
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    retryText: {
      fontSize: 14,
      fontWeight: '600',
    },
    centered: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
    noticeCard: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      alignItems: 'center',
    },
    noticeText: {
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
