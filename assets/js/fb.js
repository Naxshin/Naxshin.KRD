// ════════════════════════════════════════════════════════════════
//  Firebase connection. Loaded with a dynamic import by main.js so the
//  shop still opens (read-only) if Google's servers can't be reached.
//  The web config below is public by design — security comes from
//  firestore.rules, not from hiding these values.
// ════════════════════════════════════════════════════════════════
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, updateProfile, updatePassword, verifyBeforeUpdateEmail,
  sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyAj8HjDS80m2POVmbBwNNG1uHlCqJ0DmMQ',
  authDomain: 'naxshin-e5e25.firebaseapp.com',
  projectId: 'naxshin-e5e25',
  storageBucket: 'naxshin-e5e25.firebasestorage.app',
  messagingSenderId: '666973865382',
  appId: '1:666973865382:web:5e284dc80a7f1798f7bb67',
};
export const ROOT_ADMIN_EMAIL = 'naxshinkrd@gmail.com';

// Local testing only: http://localhost/?emulator talks to the Firebase emulators.
const useEmulator = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('emulator');

const app = initializeApp(useEmulator ? { ...firebaseConfig, projectId: 'demo-naxshin' } : firebaseConfig);
export const auth = getAuth(app);

// Keep a copy of data on the device: repeat visits open instantly and the
// shop keeps working through short connection drops.
let firestore;
try {
  firestore = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
} catch (e) {
  console.warn('Offline cache unavailable, using memory only:', e?.message);
  firestore = getFirestore(app);
}
export const db = firestore;

if (useEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

export {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile,
  updatePassword, verifyBeforeUpdateEmail, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, writeBatch,
};
