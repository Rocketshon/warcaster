// ---------------------------------------------------------------------------
// Offline-First IndexedDB Wrapper
// ---------------------------------------------------------------------------
// Provides a lightweight IndexedDB backup layer. localStorage remains the
// primary store (fast, synchronous). IndexedDB acts as a backup/mirror:
//
//  1. On load: try localStorage first (fast). If localStorage is empty but
//     IndexedDB has data, restore from IndexedDB.
//  2. On every write: write to both localStorage AND IndexedDB.
//
// This gives us: fast reads from localStorage + crash recovery from
// IndexedDB + larger storage quota (no 5 MB limit).
// ---------------------------------------------------------------------------

const DB_NAME = 'warcaster';
const DB_VERSION = 1;

// Store names
const STORES = ['armies', 'collection', 'games', 'settings'] as const;
export type StoreName = (typeof STORES)[number];

let dbPromise: Promise<IDBDatabase> | null = null;

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

export async function initDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------

export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    const db = await initDB();
    return new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function getById<T>(storeName: StoreName, id: string): Promise<T | null> {
  try {
    const db = await initDB();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function put<T>(storeName: StoreName, item: T): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable — silently ignore, localStorage is primary
  }
}

export async function putAll<T>(storeName: StoreName, items: T[]): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const item of items) {
        store.put(item);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

export async function remove(storeName: StoreName, id: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

export async function clear(storeName: StoreName): Promise<void> {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // IndexedDB unavailable
  }
}

// ---------------------------------------------------------------------------
// Sync helpers — used by ArmyContext to mirror to IndexedDB
// ---------------------------------------------------------------------------

/** Mirror the full saved armies array into IndexedDB (called on every change). */
export async function syncArmiesToIDB<T extends { id: string }>(armies: T[]): Promise<void> {
  try {
    const db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('armies', 'readwrite');
      const store = tx.objectStore('armies');
      store.clear(); // Replace all
      for (const army of armies) {
        store.put(army);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Silent — IndexedDB is a backup only
  }
}

/** Recover armies from IndexedDB when localStorage is empty. */
export async function recoverArmiesFromIDB<T>(): Promise<T[]> {
  return getAll<T>('armies');
}

/** Mirror a settings value into IndexedDB. */
export async function syncSettingToIDB(key: string, value: unknown): Promise<void> {
  await put('settings', { id: key, value });
}

/** Recover a settings value from IndexedDB. */
export async function recoverSettingFromIDB<T>(key: string): Promise<T | null> {
  const record = await getById<{ id: string; value: T }>('settings', key);
  return record?.value ?? null;
}
