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
import { useAuth } from '../../contexts/AuthContext';
import type { ConversationSummary } from '../../lib/marketTypes';

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function MessagesInboxScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { conversations, fetchConversations } = useMarket();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchConversations().catch(() => {}).finally(() => setLoading(false));
  }, [user, fetchConversations]);

  const styles = makeStyles(colors);

  // Auth guard
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sign in to view messages</Text>
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

  const renderItem = ({ item }: { item: ConversationSummary }) => {
    return (
      <TouchableOpacity
        style={[styles.convoRow, { backgroundColor: colors.bgCard, borderColor: colors.borderColor }]}
        onPress={() => navigation.navigate('Chat', { listingId: item.listing_id, otherUserId: item.other_user_id })}
        activeOpacity={0.7}
      >
        {/* Listing photo */}
        <View style={[styles.thumbContainer, { backgroundColor: colors.bgPrimary }]}>
          {item.listing_photo ? (
            <Image source={{ uri: item.listing_photo }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          )}
        </View>

        {/* Info */}
        <View style={styles.convoInfo}>
          <Text style={[styles.convoTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.listing_title}
          </Text>
          <Text style={[styles.convoUser, { color: colors.accentGold }]} numberOfLines={1}>
            {item.other_user_name}
          </Text>
          <Text style={[styles.convoLastMsg, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.last_message}
          </Text>
        </View>

        {/* Right side: time + unread */}
        <View style={styles.convoRight}>
          <Text style={[styles.convoTime, { color: colors.textSecondary }]}>
            {formatTime(item.last_message_at)}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.accentGold }]}>
              <Text style={styles.unreadText}>
                {item.unread_count > 9 ? '9+' : item.unread_count}
              </Text>
            </View>
          )}
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
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.listing_id}::${item.other_user_id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No conversations yet
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
      paddingBottom: 40,
      flexGrow: 1,
    },
    convoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
      gap: 12,
    },
    thumbContainer: {
      width: 50,
      height: 50,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    thumb: {
      width: 50,
      height: 50,
    },
    convoInfo: {
      flex: 1,
      gap: 2,
    },
    convoTitle: {
      fontSize: 14,
      fontWeight: '600',
    },
    convoUser: {
      fontSize: 12,
      fontWeight: '500',
    },
    convoLastMsg: {
      fontSize: 13,
    },
    convoRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    convoTime: {
      fontSize: 11,
    },
    unreadBadge: {
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
  });
}
