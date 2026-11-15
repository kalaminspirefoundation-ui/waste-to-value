import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getMessaging, getToken, isSupported, MessagePayload, onMessage } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export const driveGoogleAuthProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  driveGoogleAuthProvider.addScope(scope);
});
driveGoogleAuthProvider.setCustomParameters({ prompt: 'consent select_account' });
const firestoreDbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = firestoreDbId ? getFirestore(app, firestoreDbId) : getFirestore(app);

// Strictly in-memory token cache (never stored in localStorage/sessionStorage)
let cachedDriveAccessToken: string | null = null;
let cachedDriveAccountEmail: string | null = null;
let isDriveSigningIn = false;

onAuthStateChanged(auth, (fbUser) => {
  if (!fbUser && !isDriveSigningIn) {
    cachedDriveAccessToken = null;
    cachedDriveAccountEmail = null;
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on application boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}

export async function signInWithGooglePopup() {
  const credential = await signInWithPopup(auth, googleAuthProvider);
  const idToken = await credential.user.getIdToken();
  return { user: credential.user, idToken };
}

export async function signInAdminGoogleDrivePopup() {
  isDriveSigningIn = true;
  try {
    const result = await signInWithPopup(auth, driveGoogleAuthProvider);
    const oauthCred = GoogleAuthProvider.credentialFromResult(result);
    if (!oauthCred?.accessToken) {
      throw new Error('Google Drive access permission was not granted.');
    }
    cachedDriveAccessToken = oauthCred.accessToken;
    cachedDriveAccountEmail = result.user.email || null;
    const idToken = await result.user.getIdToken();
    return {
      user: result.user,
      idToken,
      accessToken: cachedDriveAccessToken,
      email: cachedDriveAccountEmail,
    };
  } finally {
    isDriveSigningIn = false;
  }
}

export function getDriveAccessToken(): string | null {
  return cachedDriveAccessToken;
}

export function getDriveConnectedEmail(): string | null {
  return cachedDriveAccountEmail;
}

export function clearDriveAccessToken(): void {
  cachedDriveAccessToken = null;
  cachedDriveAccountEmail = null;
}

export async function firebaseSignOut() {
  cachedDriveAccessToken = null;
  cachedDriveAccountEmail = null;
  await signOut(auth);
}

export async function persistDocumentToFirestore(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>,
  merge = true
) {
  const path = `${collectionName}/${docId}`;
  try {
    await setDoc(
      doc(db, collectionName, docId),
      { ...payload, _syncedAt: serverTimestamp() },
      { merge }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function persistStrictDocumentToFirestore(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>,
  merge = true
) {
  const path = `${collectionName}/${docId}`;
  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, v]) => v !== undefined)
  );
  try {
    await setDoc(doc(db, collectionName, docId), cleaned, { merge });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateDocumentInFirestore(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>
) {
  const path = `${collectionName}/${docId}`;
  try {
    await updateDoc(doc(db, collectionName, docId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocumentFromFirestore(collectionName: string, docId: string) {
  const path = `${collectionName}/${docId}`;
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToLiveRates(
  onRates: (rates: Record<string, unknown>[]) => void
): () => void {
  const path = 'scrapRates';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (items.length > 0) onRates(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via FirestoreErrorInfo
      }
    }
  );
}

export type FcmPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export async function showBrowserOrSwNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (reg && reg.active) {
        reg.active.postMessage({ type: 'PNC_LOCAL_PUSH', title, body, data: data || {} });
        return;
      }
    }
    new Notification(title, {
      body,
      icon: '/src/assets/images/punarchakra_brand_logo_1794725975670.jpg',
      tag: data?.orderId || 'punarchakra-status',
    });
  } catch {
    // Some embedded iframes restrict Notification constructor
  }
}

export async function registerFcmPushNotifications(
  uid: string,
  role: 'b2c' | 'b2b' | 'executive' | 'admin',
  idToken?: string | null,
  localUserId?: string
): Promise<{ status: FcmPermissionState; token: string | null }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { status: 'unsupported', token: null };
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      return { status: 'denied', token: null };
    }
  }
  if (permission !== 'granted') {
    return { status: 'denied', token: null };
  }

  let swReg: ServiceWorkerRegistration | undefined;
  if ('serviceWorker' in navigator) {
    try {
      swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch {
      swReg = undefined;
    }
  }

  let fcmToken: string | null = null;
  try {
    const supported = await isSupported();
    if (supported) {
      const messaging = getMessaging(app);
      const vapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined) || undefined;
      fcmToken = await getToken(messaging, {
        vapidKey: vapidKey && vapidKey.trim() ? vapidKey.trim() : undefined,
        serviceWorkerRegistration: swReg,
      });
    }
  } catch {
    // Graceful fallback when VAPID key or PushManager is unavailable in sandboxed iframe
  }

  const effectiveToken = fcmToken || `browser-push-${uid.slice(0, 12)}-${Date.now()}`;

  if (auth.currentUser && auth.currentUser.emailVerified) {
    const tokenId = `tok_${auth.currentUser.uid.slice(0, 24)}_${role}`;
    persistDocumentToFirestore('fcmTokens', tokenId, {
      id: tokenId,
      userId: auth.currentUser.uid,
      localUserId: localUserId || uid,
      role,
      token: effectiveToken,
      platform: navigator.platform || 'web',
      updatedAt: new Date().toISOString(),
    }).catch(() => {});
  }

  if (idToken) {
    fetch('/api/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        token: effectiveToken,
        role,
        localUserId: localUserId || uid,
        platform: navigator.platform || 'web',
      }),
    }).catch(() => {});
  }

  return { status: 'granted', token: effectiveToken };
}

export async function subscribeForegroundFcm(
  onPayload: (payload: { title: string; body: string; data?: Record<string, string> }) => void
): Promise<() => void> {
  try {
    const supported = await isSupported();
    if (!supported) return () => {};
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload: MessagePayload) => {
      const title = payload.notification?.title || payload.data?.title || 'PUNARCHAKRA Update';
      const body = payload.notification?.body || payload.data?.body || 'Real-time pickup status update.';
      onPayload({ title, body, data: payload.data });
    });
  } catch {
    return () => {};
  }
}

export function subscribeUserNotifications(
  userId: string,
  onNotifs: (items: Record<string, unknown>[]) => void
): () => void {
  if (!auth.currentUser) return () => {};
  const path = 'notifications';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (items.length > 0) onNotifs(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via FirestoreErrorInfo
      }
    }
  );
}
