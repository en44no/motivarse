// Script para borrar TODOS los documentos de la colección coupleCategories
// Uso: node scripts/clear-categories.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Lee variables desde .env.local (nunca commiteado)
function loadEnv() {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8');
  return Object.fromEntries(
    content.split('\n')
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
  );
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const snap = await getDocs(collection(db, 'coupleCategories'));

if (snap.empty) {
  console.log('No hay documentos en coupleCategories.');
  process.exit(0);
}

console.log(`Borrando ${snap.size} categorías...`);

await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'coupleCategories', d.id))));

console.log('Listo. Colección vaciada.');
process.exit(0);
