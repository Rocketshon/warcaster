import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Edit, CheckCircle, Archive, Trash2, Loader2, Package } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import { STATUS_LABELS, CONDITION_LABELS, type MarketListing, type ListingStatus } from '../../../lib/marketTypes';
import { toast } from 'sonner';

function ListingRow({ listing, onStatusChange, onDelete }: {
  listing: MarketListing;
  onStatusChange: (id: string, status: ListingStatus) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const photoUrl = listing.photo_urls?.[0] ?? listing.photos?.[0] ?? null;

  const statusColors: Record<ListingStatus, string> = {
    active: 'text-green-400 border-green-500/30 bg-green-500/10',
    sold: 'text-red-400 border-red-500/30 bg-red-500/10',
    reserved: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    archived: 'text-[var(--text-secondary)] border-[var(--border-color)] bg-[var(--bg-primary)]',
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg p-3">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex-shrink-0 overflow-hidden flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <Package className="w-6 h-6 text-[var(--text-secondary)]" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{listing.title}</p>
          <p className="text-sm font-bold text-[var(--accent-gold)]">${listing.price}</p>
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border mt-1 ${statusColors[listing.status]}`}>
            {STATUS_LABELS[listing.status]}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => navigate(`/market/edit/${listing.id}`)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 transition-colors"
        >
          <Edit className="w-3 h-3" /> Edit
        </button>
        {listing.status === 'active' && (
          <button
            onClick={() => onStatusChange(listing.id, 'sold')}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors"
          >
            <CheckCircle className="w-3 h-3" /> Sold
          </button>
        )}
        {listing.status === 'active' && (
          <button
            onClick={() => onStatusChange(listing.id, 'archived')}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-yellow-500/30 transition-colors"
          >
            <Archive className="w-3 h-3" /> Archive
          </button>
        )}
        <button
          onClick={() => onDelete(listing.id)}
          className="flex items-center justify-center px-2 py-1.5 rounded text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function MyListings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myListings, listingsLoading: loading, fetchMyListings, updateListing, deleteListing } = useMarket();

  useEffect(() => {
    if (!user) { navigate('/login?returnTo=/market/my-listings'); return; }
    fetchMyListings();
  }, [user, navigate, fetchMyListings]);

  const handleStatusChange = async (id: string, status: ListingStatus) => {
    await updateListing(id, { status } as any);
    toast.success(`Listing marked as ${STATUS_LABELS[status].toLowerCase()}`);
    fetchMyListings();
  };

  const handleDelete = async (id: string) => {
    await deleteListing(id);
    toast.success('Listing deleted');
    fetchMyListings();
  };

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

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 tracking-wider">My Listings</h1>

        {loading && myListings.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
          </div>
        )}

        {!loading && myListings.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No listings yet</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Tap the + button on the Market page to create one</p>
          </div>
        )}

        <div className="space-y-3">
          {myListings.map(listing => (
            <ListingRow
              key={listing.id}
              listing={listing}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
