import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2, Package, Swords, Sparkles } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useArmy } from '../../../lib/ArmyContext';
import { getFactionName } from '../../../lib/factions';
import { CONDITION_LABELS, type MarketListing } from '../../../lib/marketTypes';
import type { FactionId } from '../../../types';

function ListingCard({ listing }: { listing: MarketListing }) {
  const navigate = useNavigate();
  const photoUrl = listing.photo_urls?.[0] ?? listing.photos?.[0] ?? null;

  return (
    <button
      onClick={() => navigate(`/market/listing/${listing.id}`)}
      className="w-full text-left bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent-gold)]/40 transition-colors"
    >
      <div className="aspect-square bg-[var(--bg-primary)] flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-8 h-8 text-[var(--text-secondary)]" />
        )}
      </div>
      <div className="p-2.5">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{listing.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-[var(--accent-gold)]">${listing.price}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            {CONDITION_LABELS[listing.condition]}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function BitsINeed() {
  const navigate = useNavigate();
  const { bitsINeed, listingsLoading: loading, fetchBitsINeed } = useMarket();
  const { army, factionId } = useArmy();

  const hasArmy = army.length > 0 && !!factionId;
  const factionName = factionId ? getFactionName(factionId as FactionId) : '';

  useEffect(() => {
    if (hasArmy) {
      fetchBitsINeed();
    }
  }, [hasArmy, fetchBitsINeed]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-28">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors mb-6"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-[var(--accent-gold)]" />
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-wider">Bits I Need</h1>
      </div>

      {hasArmy ? (
        <>
          <div className="flex items-center gap-2 mb-6 text-sm text-[var(--text-secondary)]">
            <Swords className="w-4 h-4" />
            <span>Matching your <span className="text-[var(--accent-gold)] font-medium">{factionName}</span> army ({army.length} units)</span>
          </div>

          {loading && bitsINeed.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
            </div>
          )}

          {!loading && bitsINeed.length === 0 && (
            <div className="text-center py-16">
              <Package className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
              <p className="text-sm font-medium text-[var(--text-secondary)]">No matching listings found</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Check back later as new listings are posted</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {bitsINeed.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <Swords className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">Build an army first to see matching bits</p>
          <button
            onClick={() => navigate('/army')}
            className="mt-4 px-6 py-2 rounded border border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm"
          >
            Go to Army Builder
          </button>
        </div>
      )}
    </div>
  );
}
