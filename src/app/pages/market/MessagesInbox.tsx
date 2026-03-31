import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2, MessageCircle, Package } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import type { ConversationSummary } from '../../../lib/marketTypes';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ConversationRow({ convo }: { convo: ConversationSummary }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/market/chat/${convo.listing_id}/${convo.other_user_id}`)}
      className="w-full flex gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg hover:border-[var(--accent-gold)]/40 transition-colors"
    >
      {/* Listing photo */}
      <div className="w-12 h-12 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex-shrink-0 overflow-hidden flex items-center justify-center">
        {convo.listing_photo ? (
          <img src={convo.listing_photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <Package className="w-5 h-5 text-[var(--text-secondary)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{convo.other_user_name}</p>
          <span className="text-[10px] text-[var(--text-secondary)] flex-shrink-0 ml-2">{timeAgo(convo.last_message_at)}</span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] truncate">{convo.listing_title}</p>
        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{convo.last_message}</p>
      </div>

      {/* Unread dot */}
      {convo.unread_count > 0 && (
        <div className="flex-shrink-0 self-center">
          <div className="w-5 h-5 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--bg-primary)]">{convo.unread_count}</span>
          </div>
        </div>
      )}
    </button>
  );
}

export default function MessagesInbox() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, listingsLoading: loading, fetchConversations } = useMarket();

  useEffect(() => {
    if (!user) { navigate('/login?returnTo=/market/messages'); return; }
    fetchConversations();
  }, [user, navigate, fetchConversations]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-6"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 tracking-wider">Messages</h1>

        {loading && conversations.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No messages yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Start a conversation by messaging a seller</p>
          </div>
        )}

        <div className="space-y-2">
          {conversations.map(convo => (
            <ConversationRow key={`${convo.listing_id}-${convo.other_user_id}`} convo={convo} />
          ))}
        </div>
      </div>
    </div>
  );
}
