import type { ApiKeyFull } from '@clerk/node';

// Types
export interface ApiKeyMetadata {
  projectId: string;
  envId: string;
  name: string;
  last4ApiKeyToken: string;

  [key: string]: string;
}

export interface CreateApiKeyInput {
  orgId: string;
  projectId: string;
  envId: string;
  userId: string;
  expiresInDays?: number;
  metadata?: Record<string, string>;
}

export interface ApiKeyResponse extends ApiKeyFull {
  metadata: ApiKeyMetadata;
  lastActiveAt: number;
}

export type Role = 'Owner' | 'Admin' | 'Member';

export interface Member {
  userId: string;
  email: string;
  emailConfirmed: boolean;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  joinedAt: number;
  pictureUrl: string | null;
  lastActiveAt: number;
}

export interface InviteMember {
  email: string;
  role: Role;
}

export interface UpdateMemberRole {
  userId: string;
  role: Role;
}

export interface RemoveMember {
  userId: string;
}
