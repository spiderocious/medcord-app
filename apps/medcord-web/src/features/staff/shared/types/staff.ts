import type { StaffRole } from '@shared/types/hospital.ts';

export interface StaffMember {
  readonly id: string;
  readonly userId: string;
  readonly hospitalId: string;
  readonly role: StaffRole;
  readonly name?: string;
  readonly email?: string;
  readonly department?: string;
  readonly unit?: string;
  readonly specialty?: string;
  readonly managerId?: string;
  readonly status: 'active' | 'suspended';
  readonly joinedAt: string;
  readonly permissions: string[] | null;
}

export interface Invitation {
  readonly id: string;
  readonly hospitalId: string;
  readonly email: string;
  readonly role: StaffRole;
  readonly department?: string;
  readonly unit?: string;
  readonly invitedBy: string;
  readonly token: string;
  readonly status: 'pending' | 'accepted' | 'declined' | 'revoked';
  readonly expiresAt: string;
  readonly createdAt: string;
}

export interface CustomRole {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly slug: string;
  readonly permissions: readonly string[];
  readonly isSystem: boolean;
  readonly createdAt: string;
}

export interface OrgChartNode {
  readonly id: string;
  readonly userId: string;
  readonly role: StaffRole;
  readonly department?: string;
  readonly managerId?: string;
}
