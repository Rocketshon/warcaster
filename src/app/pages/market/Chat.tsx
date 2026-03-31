import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import { supabase } from '../../../lib/supabase';
import type { MarketMessage } from '../../../lib/marketTypes';

function timeStamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const navigate = useNavigate();
  const { listingId, otherUserId } = useParams<{ listingId: string; otherUserId: string }>();
  const { user } = useAuth();
  const { fetchMessages, sendMessage, fetchListing } = useMarket();

  const [messages, setMessages] = useState<MarketMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listingTitle, setListingTitle] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Redirect if not authed
  useEffect(() => {
    if (!user) {
      navigate(`/login?returnTo=/market/chat/${listingId}/${otherUserId}`);
    }
  }, [user, navigate, listingId, otherUserId]);

  // Load listing title
  useEffect(() => {
    if (!listingId) return;
    fetchListing(listingId).then(data => {
      if (data) setListingTitle(data.title);
    });
  }, [listingId, fetchListing]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!listingId || !otherUserId) return;
    const msgs = await fetchMessages(listingId, otherUserId);
    setMessages(msgs);
    setLoading(false);
  }, [listingId, otherUserId, fetchMessages]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!listingId || !user) return;

    const channel = supabase
      .channel(`market_messages:${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'market_messages',
        filter: `listing_id=eq.${listingId}`,
      }, (payload) => {
        const newMsg = payload.new as MarketMessage;
        // Only add if it involves us
        if (newMsg.sender_id === user.id || newMsg.recipient_id === user.id) {
          setMessages(prev => [...prev, newMsg]);
          // Message received from other user
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listingId, user, otherUserId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !listingId || !otherUserId || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText('');
    await sendMessage(listingId, otherUserId, msgText);
    // Optimistic: add to local state
    setMessages(prev => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        listing_id: listingId,
        sender_id: user!.id,
        recipient_id: otherUserId,
        text: msgText,
        read: false,
        created_at: new Date().toISOString(),
      },
    ]);
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors" aria-label="Go back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {listingTitle || 'Chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-[var(--accent-gold)] animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-[var(--text-secondary)]">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map(msg => {
          const isOutgoing = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                  isOutgoing
                    ? 'bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/30 rounded-br-sm'
                    : 'bg-[var(--bg-card)] border border-[var(--border-color)] rounded-bl-sm'
                }`}
              >
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">{msg.text}</p>
                <p className={`text-[9px] mt-1 ${
                  isOutgoing ? 'text-[var(--accent-gold)]/60' : 'text-[var(--text-secondary)]'
                }`}>
                  {timeStamp(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-primary)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message..."
            className="flex-1 px-3.5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
            aria-label="Send message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
