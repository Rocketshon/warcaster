import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Loader2, Image, X, Camera } from 'lucide-react';
import { useMarket } from '../../../lib/MarketContext';
import { useAuth } from '../../../lib/AuthContext';
import { FACTIONS } from '../../../lib/factions';
import { searchUnits } from '../../../data';
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  type ListingCategory,
  type ListingCondition,
} from '../../../lib/marketTypes';
import { toast } from 'sonner';
import type { FactionId } from '../../../types';

export default function CreateListing() {
  const navigate = useNavigate();
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const { fetchListing, createListing, updateListing } = useMarket();

  const isEdit = !!listingId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [factionId, setFactionId] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [unitName, setUnitName] = useState('');
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [category, setCategory] = useState<ListingCategory>('other');
  const [condition, setCondition] = useState<ListingCondition>('new_on_sprue');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [shipping, setShipping] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect to login if not authed
  useEffect(() => {
    if (!user) {
      navigate(`/login?returnTo=${isEdit ? `/market/edit/${listingId}` : '/market/create'}`);
    }
  }, [user, navigate, isEdit, listingId]);

  // Load existing listing for edit mode
  useEffect(() => {
    if (!isEdit || !listingId) return;
    fetchListing(listingId).then(data => {
      if (data) {
        setTitle(data.title);
        setDescription(data.description);
        setFactionId(data.faction_id ?? '');
        setUnitName(data.unit_name ?? '');
        setUnitSearch(data.unit_name ?? '');
        setCategory(data.category);
        setCondition(data.condition);
        setPrice(String(data.price));
        setLocation(data.location);
        setShipping(data.shipping);
        // Existing photos can't be edited as File objects, show URLs as previews
        setPhotoPreviewUrls(data.photo_urls ?? data.photos ?? []);
      }
      setInitialLoading(false);
    });
  }, [isEdit, listingId, fetchListing]);

  // Unit search results filtered by faction
  const unitResults = useMemo(() => {
    if (unitSearch.length < 2) return [];
    return searchUnits(unitSearch, factionId ? (factionId as FactionId) : undefined).slice(0, 8);
  }, [unitSearch, factionId]);

  // Photo handling
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    // Generate preview URLs
    for (const file of toAdd) {
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrls(prev => [...prev, url]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => {
      const url = prev[index];
      if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!price || Number(price) <= 0) { toast.error('Enter a valid price'); return; }
    setLoading(true);

    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        faction_id: factionId || undefined,
        unit_name: unitName || undefined,
        category,
        price: Number(price),
        condition,
        location: location.trim(),
        shipping,
      };

      if (isEdit && listingId) {
        await updateListing(listingId, input);
        toast.success('Listing updated');
        navigate(`/market/listing/${listingId}`);
      } else {
        const listingResultId = await createListing(input, photos);
        toast.success('Listing created');
        navigate(`/market/listing/${listingResultId}`);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[var(--accent-gold)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-28">
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

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6 tracking-wider">
          {isEdit ? 'Edit Listing' : 'New Listing'}
        </h1>

        <div className="space-y-5">
          {/* Photos */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-2">Photos (max 5)</label>
            <div className="flex gap-2 flex-wrap">
              {photoPreviewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded border border-[var(--border-color)] overflow-hidden bg-[var(--bg-card)]">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-[var(--text-secondary)] hover:border-[var(--accent-gold)]/40 transition-colors"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px]">Add</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Space Marine Intercessor bits"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what's included, condition, etc."
              rows={4}
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)] resize-none"
            />
          </div>

          {/* Faction picker */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Faction (optional)</label>
            <select
              value={factionId}
              onChange={e => { setFactionId(e.target.value); setUnitName(''); setUnitSearch(''); }}
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
            >
              <option value="">No faction</option>
              {FACTIONS.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Unit picker (searchable) */}
          <div className="relative">
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Unit (optional)</label>
            <input
              type="text"
              value={unitSearch}
              onChange={e => { setUnitSearch(e.target.value); setUnitName(''); setShowUnitDropdown(true); }}
              onFocus={() => setShowUnitDropdown(true)}
              placeholder={factionId ? 'Search units...' : 'Select a faction first'}
              disabled={!factionId}
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)] disabled:opacity-50"
            />
            {showUnitDropdown && unitResults.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded shadow-xl max-h-48 overflow-y-auto">
                {unitResults.map(u => (
                  <button
                    key={`${u.faction_id}-${u.name}`}
                    onClick={() => { setUnitName(u.name); setUnitSearch(u.name); setShowUnitDropdown(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--accent-gold)]/10 border-b border-[var(--border-color)] last:border-0"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ListingCategory)}
                className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Condition</label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value as ListingCondition)}
                className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
              >
                {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Price ($)</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-gold)]"
            />
          </div>

          {/* Shipping toggle */}
          <div className="flex items-center justify-between p-3 bg-[var(--bg-card)] border border-[var(--border-color)] rounded">
            <span className="text-sm text-[var(--text-primary)]">Willing to ship</span>
            <button
              onClick={() => setShipping(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                shipping ? 'bg-[var(--accent-gold)]' : 'bg-[var(--border-color)]'
              }`}
              aria-label="Toggle shipping"
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                shipping ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !price}
            className="w-full flex items-center justify-center gap-2 py-3 rounded border border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-semibold text-sm transition-all hover:bg-[var(--accent-gold)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
            {isEdit ? 'Save Changes' : 'Post Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
