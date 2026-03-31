import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useMarket } from '../../contexts/MarketContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { MarketMessage } from '../../lib/marketTypes';

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${minutes} ${ampm}`;
}

export default function ChatScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { sendMessage, fetchMessages, fetchListing } = useMarket();
  const { user } = useAuth();

  const listingId = route.params?.listingId as string;
  const otherUserId = route.params?.otherUserId as string;

  const [messages, setMessages] = useState<MarketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [listingTitle, setListingTitle] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Load messages and listing title
  useEffect(() => {
    if (!user || !listingId || !otherUserId) return;

    setLoading(true);
    Promise.all([
      fetchMessages(listingId, otherUserId),
      fetchListing(listingId),
    ])
      .then(([msgs, listing]) => {
        setMessages(msgs);
        setListingTitle(listing?.title ?? 'Listing');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, listingId, otherUserId, fetchMessages, fetchListing]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!user || !listingId) return;

    const channel = supabase
      .channel(`market-chat-${listingId}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cc_market_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newMsg = payload.new as MarketMessage;
          // Only add if it involves the current conversation
          if (
            (newMsg.sender_id === user.id && newMsg.recipient_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.recipient_id === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            // Mark incoming as read
            if (newMsg.sender_id === otherUserId) {
              supabase
                .from('cc_market_messages')
                .update({ read: true })
                .eq('id', newMsg.id)
                .then(() => {});
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, listingId, otherUserId]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !user || sending) return;

    setSending(true);
    setInputText('');
    try {
      await sendMessage(listingId, otherUserId, text);
      // Optimistic add
      const optimistic: MarketMessage = {
        id: `temp-${Date.now()}`,
        listing_id: listingId,
        sender_id: user.id,
        sender_name: 'You',
        recipient_id: otherUserId,
        text,
        read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
    } catch {
      setInputText(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }, [inputText, user, sending, sendMessage, listingId, otherUserId]);

  const renderMessage = ({ item }: { item: MarketMessage }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleRight, { backgroundColor: colors.accentGold + '30' }]
              : [styles.bubbleLeft, { backgroundColor: colors.bgCard }],
          ]}
        >
          <Text style={[styles.msgText, { color: colors.textPrimary }]}>{item.text}</Text>
          <Text style={[styles.msgTime, { color: colors.textSecondary }]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const styles = makeStyles(colors);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Sign in to chat</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {listingTitle}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accentGold} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Start a conversation
                </Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.bgCard, borderTopColor: colors.borderColor }]}>
          <TextInput
            style={[styles.chatInput, { backgroundColor: colors.bgPrimary, borderColor: colors.borderColor, color: colors.textPrimary }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.accentGold, opacity: (!inputText.trim() || sending) ? 0.5 : 1 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: 32,
    },
    emptyText: { fontSize: 15, textAlign: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { marginRight: 12 },
    headerInfo: { flex: 1 },
    headerTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    messageList: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexGrow: 1,
    },
    msgRow: {
      marginBottom: 8,
    },
    msgRowLeft: {
      alignItems: 'flex-start',
    },
    msgRowRight: {
      alignItems: 'flex-end',
    },
    bubble: {
      maxWidth: '80%',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    bubbleLeft: {
      borderTopLeftRadius: 4,
    },
    bubbleRight: {
      borderTopRightRadius: 4,
    },
    msgText: {
      fontSize: 15,
      lineHeight: 20,
    },
    msgTime: {
      fontSize: 10,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      gap: 8,
    },
    chatInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 100,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
