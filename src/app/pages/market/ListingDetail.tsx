import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Heart, MessageCircle, Edit, CheckCircle, Trash2, Loader2, Package, MapPin, Truck } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import { FACTIONS } from '../../../lib/factions';
import { CATEGORY_LABELS, CONDITION_LABELS, type MarketListing } from '../../../lib/marketTypes';
import { toast } from 'sonner';

export default function ListingDetail() {
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const { fetchListing, toggleFavorite, updateListing, deleteListing } = useMarket();

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorited, setFavorited] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetchListing(listingId).then(data => {
      setListing(data);
      setFavorited(data?.is_favorited ?? false);
      setLoading(false);
    });
  }, [listingId, fetchListing]);

  const isOwner = user && listing && user.id === listing.seller_id;
  const factionName = listing?.faction_id
    ? FACTIONS.find(f => f.id === listing.faction_id)?.name ?? listing.faction_id
    : null;

  const handleFavorite = async () => {
    if (!user) { navigate(`/login?returnTo=/market/listing/${listingId}`); return; }
    if (!listingId) return;
    setFavorited(v => !v);
    await toggleFavorite(listingId);
  };

  const handleMessage = () => {
    if (!user) { navigate(`/login?returnTo=/market/listing/${listingId}`); return; }
    if (!listing) return;
    navigate(`/market/chat/${listing.id}/${listing.seller_id}`);
  };

  const handleMarkSold = async () => {
    if (!listingId) return;
    // Mark as sold via updateListing — cast status through since the input type doesn't include it
    await updateListing(listingId, { status: 'sold' } as any);
    toast.success('Listing marked as sold');
    setListing(prev => prev ? { ...prev, status: 'sold' } : null);
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    if (!listingId) return;
    await deleteListing(listingId);
    toast.success('Listing deleted');
    navigate('/market');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </button>
        <div className="text-center py-16">
          <Package className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Listing not found</p>
        </div>
      </div>
    );
  }

  const photos = listing.photo_urls?.length ? listing.photo_urls : listing.photos;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-28">
      {/* Back button */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors">
          <ArrowLeft className="w-5 h-5" /><span className="text-sm">Back</span>
        </button>
      </div>

      {/* Photo gallery — horizontal scroll */}
      {photos && photos.length > 0 ? (
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto snap-x snap-mandatory">
          {photos.map((url, i) => (
            <div key={i} className="flex-shrink-0 w-72 aspect-square rounded-lg overflow-hidden snap-center bg-[var(--bg-card)]">
              <img src={url} alt={`${listing.title} photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-4 mb-4 aspect-video bg-[var(--bg-card)] rounded-lg flex items-center justify-center border border-[var(--border-color)]">
          <Package className="w-12 h-12 text-[var(--text-secondary)]" />
        </div>
      )}

      <div className="px-4">
        {/* Title and price */}
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{listing.title}</h1>
        <p className="text-2xl font-bold text-[var(--accent-gold)] mb-3">${listing.price}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]">
            {CONDITION_LABELS[listing.condition]}
          </span>
          <span className="text-xs px-2 py-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]">
            {CATEGORY_LABELS[listing.category]}
          </span>
          {listing.status !== 'active' && (
            <span className="text-xs px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-semibold">
              {listing.status.toUpperCase()}
            </span>
          )}
        </div>

        {/* Faction + unit */}
        {(factionName || listing.unit_name) && (
          <div className="mb-4 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-card)]">
            {factionName && <p className="text-xs text-[var(--text-secondary)]">Faction: <span className="text-[var(--text-primary)] font-medium">{factionName}</span></p>}
            {listing.unit_name && <p className="text-xs text-[var(--text-secondary)] mt-0.5">Unit: <span className="text-[var(--text-primary)] font-medium">{listing.unit_name}</span></p>}
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <div className="mb-4">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Description</h2>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">{listing.description}</p>
          </div>
        )}

        {/* Seller info */}
        <div className="mb-4 p-3 rounded border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/30 flex items-center justify-center">
            <span className="text-xs font-bold text-[var(--accent-gold)]">
              {(listing.seller_name ?? 'A')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{listing.seller_name ?? 'Anonymous'}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Seller</p>
          </div>
        </div>

        {/* Location + shipping */}
        <div className="flex items-center gap-4 mb-6 text-xs text-[var(--text-secondary)]">
          {listing.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{listing.location}</span>
            </div>
          )}
          {listing.shipping && (
            <div className="flex items-center gap-1 text-[var(--accent-gold)]">
              <Truck className="w-3.5 h-3.5" />
              <span>Ships</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {isOwner ? (
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/market/edit/${listing.id}`)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm"
            >
              <Edit className="w-4 h-4" /> Edit Listing
            </button>
            {listing.status === 'active' && (
              <button
                onClick={handleMarkSold}
                className="w-full flex items-center justify-center gap-2 py-3 rounded border border-green-500/40 bg-green-500/10 text-green-400 font-semibold text-sm"
              >
                <CheckCircle className="w-4 h-4" /> Mark as Sold
              </button>
            )}
            <button
              onClick={handleDelete}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded border text-sm font-semibold ${
                confirmDelete
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
            >
              <Trash2 className="w-4 h-4" /> {confirmDelete ? 'Tap again to confirm' : 'Delete Listing'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" /> Message Seller
            </button>
            <button
              onClick={handleFavorite}
              className={`w-12 flex items-center justify-center rounded border transition-colors ${
                favorited
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)]'
              }`}
              aria-label="Toggle favorite"
            >
              <Heart className={`w-5 h-5 ${favorited ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
