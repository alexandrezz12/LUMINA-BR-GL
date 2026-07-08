import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBequSEim2FzBbWv-wxnrx6kIYwLwogmqw",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "lumina-agendamentos.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "lumina-agendamentos",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "lumina-agendamentos.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "628645924284",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:628645924284:web:3772574f1357bbdd84efb9",
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || "G-2KXN5TLLV0",
};

const databaseId = metaEnv.VITE_FIREBASE_DATABASE_ID || "(default)";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);
export const auth = getAuth();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { OperationType };
