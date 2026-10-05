const DATABASE_NAME = 'flfc-analysis-cache';
const STORE_NAME = 'entries';
const KOREAN_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const memoryCache = new Map();
const pendingReads = new Map();
const pendingLoads = new Map();
let databasePromise;

export function getAnalysisCachePeriod(now = new Date()) {
  const date = new Date(now);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError('A valid date is required for the analysis cache.');
  }

  const parts = Object.fromEntries(
    KOREAN_DATE.formatToParts(date).map(({ type, value }) => [type, value]),
  );
  const dayStart = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const weekday = new Date(dayStart).getUTCDay();

  return {
    dayKey: new Date(dayStart).toISOString().slice(0, 10),
    sundayKey: new Date(dayStart - weekday * DAY_IN_MS).toISOString().slice(0, 10),
    isSunday: weekday === 0,
  };
}

export function isAnalysisCacheFresh(entry, now = new Date()) {
  if (
    !entry ||
    !Number.isFinite(entry.savedAt) ||
    !Object.prototype.hasOwnProperty.call(entry, 'value')
  ) {
    return false;
  }

  const current = getAnalysisCachePeriod(now);
  if (current.isSunday || entry.savedAt > new Date(now).getTime()) {
    return false;
  }

  const saved = getAnalysisCachePeriod(entry.savedAt);
  return saved.sundayKey === current.sundayKey && !saved.isSunday;
}

function openDatabase() {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);

  databasePromise = new Promise((resolve) => {
    let request;
    try {
      request = indexedDB.open(DATABASE_NAME, 1);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
  return databasePromise;
}

async function readStoredEntry(key) {
  const database = await openDatabase();
  if (!database) return null;

  return new Promise((resolve) => {
    let request;
    let transaction;
    try {
      transaction = database.transaction(STORE_NAME, 'readonly');
      request = transaction.objectStore(STORE_NAME).get(key);
    } catch {
      resolve(null);
      return;
    }
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
    transaction.onabort = () => resolve(null);
    transaction.onerror = () => resolve(null);
  });
}

async function writeStoredEntry(entry) {
  const database = await openDatabase();
  if (!database) return;

  await new Promise((resolve) => {
    let transaction;
    try {
      transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put(entry);
    } catch {
      resolve();
      return;
    }
    transaction.oncomplete = resolve;
    transaction.onerror = resolve;
    transaction.onabort = resolve;
  });
}

async function readEntry(key) {
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (pendingReads.has(key)) return pendingReads.get(key);

  const read = readStoredEntry(key).then((entry) => {
    if (!memoryCache.has(key) && entry) memoryCache.set(key, entry);
    return memoryCache.get(key) ?? null;
  });
  pendingReads.set(key, read);
  try {
    return await read;
  } finally {
    if (pendingReads.get(key) === read) pendingReads.delete(key);
  }
}

// Values should be plain, structured-cloneable objects (not Firestore Snapshot objects).
export async function setCachedAnalysisData(key, value, { now = new Date(), revision } = {}) {
  const savedAt = new Date(now).getTime();
  if (!Number.isFinite(savedAt)) {
    throw new TypeError('A valid date is required for the analysis cache.');
  }
  const entry = { key, savedAt, value, ...(revision ? { revision } : {}) };
  memoryCache.set(key, entry);
  try {
    await writeStoredEntry(entry);
  } catch {
    // A browser storage failure must not discard a successful network response.
  }
  return value;
}

// Sunday callers should use a live subscription and save each snapshot with the setter above.
export async function getCachedAnalysisData(
  key,
  loader,
  { now = new Date(), staleOnError = true, revision } = {},
) {
  const pendingKey = revision ? `${key}:${revision}` : key;
  if (pendingLoads.has(pendingKey)) return pendingLoads.get(pendingKey);

  const load = (async () => {
    let previous;
    try {
      previous = await readEntry(key);
    } catch {
      // Browsers can deny IndexedDB access; continue with the network loader.
      previous = memoryCache.get(key) ?? null;
    }
    if (revision ? previous?.revision === revision : isAnalysisCacheFresh(previous, now)) return previous.value;

    try {
      const value = await loader();
      await setCachedAnalysisData(key, value, { now, revision });
      return value;
    } catch (error) {
      if (staleOnError && previous) return previous.value;
      throw error;
    }
  })();

  pendingLoads.set(pendingKey, load);
  try {
    return await load;
  } finally {
    if (pendingLoads.get(pendingKey) === load) pendingLoads.delete(pendingKey);
  }
}

// Intended for isolated tests; it does not delete the browser's persistent cache.
export function clearAnalysisMemoryCache() {
  memoryCache.clear();
  pendingReads.clear();
  pendingLoads.clear();
}
