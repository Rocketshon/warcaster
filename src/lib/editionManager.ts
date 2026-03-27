// ---------------------------------------------------------------------------
// Edition Manager — Foundation for supporting multiple editions
// ---------------------------------------------------------------------------

export interface EditionConfig {
  id: string;           // '10th' | '11th'
  name: string;         // 'Warhammer 40,000 10th Edition'
  dataVersion: string;  // Semantic version of the data files
  releaseDate: string;
  isActive: boolean;
}

export const EDITIONS: EditionConfig[] = [
  {
    id: '10th',
    name: '10th Edition',
    dataVersion: '1.0.0',
    releaseDate: '2023-06-01',
    isActive: true,
  },
  {
    id: '11th',
    name: '11th Edition',
    dataVersion: '0.0.0',
    releaseDate: '2026-06-01',
    isActive: false,
  },
];

const EDITION_STORAGE_KEY = 'warcaster_active_edition';

/** Get the currently active edition config. */
export function getActiveEdition(): EditionConfig {
  try {
    const stored = localStorage.getItem(EDITION_STORAGE_KEY);
    if (stored) {
      const edition = EDITIONS.find(e => e.id === stored);
      if (edition) return edition;
    }
  } catch {
    // localStorage unavailable
  }
  // Default to the first active edition
  return EDITIONS.find(e => e.isActive) ?? EDITIONS[0];
}

/** Set the active edition by ID. Persists to localStorage. */
export function setActiveEdition(editionId: string): void {
  const edition = EDITIONS.find(e => e.id === editionId);
  if (!edition) {
    throw new Error(`Unknown edition: ${editionId}`);
  }
  try {
    localStorage.setItem(EDITION_STORAGE_KEY, editionId);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Check if data files are available for a given edition.
 * Currently only 10th Edition has data. 11th Edition data
 * will be available after its release in June 2026.
 */
export function isEditionDataAvailable(editionId: string): boolean {
  const edition = EDITIONS.find(e => e.id === editionId);
  if (!edition) return false;
  // Data is available if the version is above 0.0.0
  return edition.dataVersion !== '0.0.0';
}
