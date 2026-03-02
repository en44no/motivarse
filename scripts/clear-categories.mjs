// Script para borrar TODOS los documentos de la colección coupleCategories
// Uso: node scripts/clear-categories.mjs

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA2AM6f9dHOSUoco1CV3a6OQiiXh7fkfx0',
  authDomain: 'motivarse-b5cf8.firebaseapp.com',
  projectId: 'motivarse-b5cf8',
  storageBucket: 'motivarse-b5cf8.firebasestorage.app',
  messagingSenderId: '324978092208',
  appId: '1:324978092208:web:69b2f975495f758cee7375',
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
