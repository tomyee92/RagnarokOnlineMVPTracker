import { initializeApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

let _db: Database | null = null;

export function getDb(): Database | null {
  if (_db) return _db;
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const databaseURL = import.meta.env.VITE_FIREBASE_DATABASE_URL;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !databaseURL || !projectId) return null;
  try {
    const app = initializeApp({ apiKey, databaseURL, projectId,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    _db = getDatabase(app);
    return _db;
  } catch {
    return null;
  }
}
