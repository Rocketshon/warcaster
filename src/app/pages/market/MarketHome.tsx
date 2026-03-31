import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, X, Plus, Mail, User, Loader2, Package, ChevronDown, Sparkles } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import { useArmy } from '../../../lib/ArmyContext';
import { FACTIONS } from '../../../lib/factions';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type ListingCategory,
  type ListingCondition,
  type MarketFilters,
  type MarketListing,
} from '../../../lib/marketTypes';

// ---------------------------------------------------------------------------
// Listing card
// ---------------------------------------------------------------------------

function ListingCard({ listing }: { listing: MarketListing }) {
  const navigate = useNavigate();
  const photoUrl = listing.photo_urls?.[0] ?? listing.photos?.[0] ?? null;
  const factionName = FACTIONS.find(f => f.id === listing.faction_id)?.name ?? listing.faction_id ?? '';

  return (
    <button
      onClick={() => navigate(`/market/listing/${listing.id}`)}
      className="w-full text-left bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg overflow-hidden hover:border-[var(--accent-gold)]/40 transition-colors"
    >
      {/* Photo */}
      <div className="aspect-square bg-[var(--bg-primary)] flex items-center justify-center">
        {photoUrl ? (
          <img src={photoUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-8 h-8 text-[var(--text-secondary)]" />
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{listing.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm font-bold text-[var(--accent-gold)]">${listing.price}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            {CONDITION_LABELS[listing.condition]}
          </span>
        </div>
        {factionName && (
          <p className="text-[10px] text-[var(--text-secondary)] mt-1 truncate">{factionName}</p>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

function FilterChips({
  filters,
  setFilters,
}: {
  filters: MarketFilters;
  setFilters: React.Dispatch<React.SetStateAction<MarketFilters>>;
}) {
  const [showFaction, setShowFaction] = useState(false);

  const categories = Object.entries(CATEGORY_LABELS) as [ListingCategory, string][];
  const conditions = Object.entries(CONDITION_LABELS) as [ListingCondition, string][];

  return (
    <div className="space-y-2">
      {/* Faction dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowFaction(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40"
        >
          {filters.faction_id
            ? FACTIONS.find(f => f.id === filters.faction_id)?.name ?? 'Faction'
            : 'All Factions'}
          <ChevronDown className="w-3 h-3" />
        </button>
        {showFaction && (
          <div className="absolute z-20 top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-xl">
            <button
              onClick={() => { setFilters(f => ({ ...f, faction_id: undefined })); setShowFaction(false); }}
              className="w-full px-3 py-2 text-left text-xs text-[var(--text-primary)] hover:bg-[var(--accent-gold)]/10 border-b border-[var(--border-color)]"
            >
              All Factions
            </button>
            {FACTIONS.map(f => (
              <button
                key={f.id}
                onClick={() => { setFilters(prev => ({ ...prev, faction_id: f.id })); setShowFaction(false); }}
                className={`w-full px-3 py-2 text-left text-xs hover:bg-[var(--accent-gold)]/10 ${
                  filters.faction_id === f.id ? 'text-[var(--accent-gold)] font-semibold' : 'text-[var(--text-primary)]'
                }`}
              >
                {f.icon} {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilters(f => ({ ...f, category: f.category === key ? undefined : key }))}
            className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
              filters.category === key
                ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold'
                : 'border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Condition pills */}
      <div className="flex flex-wrap gap-1.5">
        {conditions.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilters(f => ({ ...f, condition: f.condition === key ? undefined : key }))}
            className={`px-2.5 py-1 rounded-full text-[10px] border transition-colors ${
              filters.condition === key
                ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold'
                : 'border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function MarketHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { listings, listingsLoading: loading, fetchListings } = useMarket();
  const { army: units, factionId } = useArmy();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<MarketFilters>({});

  const hasArmy = units.length > 0 && !!factionId;

  // Build combined filters with search
  const activeFilters = useMemo<MarketFilters>(() => ({
    ...filters,
    query: search.trim() || undefined,
  }), [filters, search]);

  // Fetch on mount and filter change
  useEffect(() => {
    fetchListings(activeFilters);
  }, [fetchListings, activeFilters]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-28">
      {/* Header */}
      <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Market</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(user ? '/market/messages' : '/login?returnTo=/market/messages')}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
              aria-label="Messages"
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate(user ? '/market/my-listings' : '/login?returnTo=/market')}
              className="text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors"
              aria-label={user ? 'My account' : 'Sign in'}
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bits & models..."
            className="w-full pl-9 pr-9 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <FilterChips filters={filters} setFilters={setFilters} />
      </div>

      <div className="px-4 pt-4">
        {/* Bits I Need card */}
        {hasArmy && (
          <button
            onClick={() => navigate('/market/bits-i-need')}
            className="w-full mb-4 p-4 rounded-lg border-2 border-[var(--accent-gold)]/40 bg-[var(--accent-gold)]/5 flex items-center gap-3 hover:bg-[var(--accent-gold)]/10 transition-colors"
          >
            <Sparkles className="w-6 h-6 text-[var(--accent-gold)] flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-semibold text-[var(--accent-gold)]">Bits I Need</p>
              <p className="text-xs text-[var(--text-secondary)]">Find parts matching your active army</p>
            </div>
          </button>
        )}

        {/* Loading */}
        {loading && listings.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
          </div>
        )}

        {/* Listing grid */}
        {!loading && listings.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-3" />
            <p className="text-sm font-medium text-[var(--text-secondary)]">No listings found</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Try adjusting your filters or be the first to post</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>

      {/* FAB — create listing */}
      <button
        onClick={() => navigate(user ? '/market/create' : '/login?returnTo=/market/create')}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-[var(--accent-gold)] text-[var(--bg-primary)] shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-10"
        aria-label="Create listing"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
