// Firebase is not used in production. Auth is handled server-side only.
// This file exists as a stub to prevent import errors.

export const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {}
};

export const db = {};

export const storage = {};

export const googleProvider = {};
export const githubProvider = {};
export const facebookProvider = {};

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Firestore unavailable: ', error);
}
