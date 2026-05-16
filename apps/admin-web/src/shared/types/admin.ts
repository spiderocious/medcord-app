export interface PlatformStats {
  readonly hospitals: {
    readonly total: number;
    readonly active: number;
    readonly archived: number;
  };
  readonly users: {
    readonly total: number;
    readonly admins: number;
    readonly twoFactorEnabled: number;
  };
  readonly recentSignups: {
    readonly last7d: number;
    readonly last30d: number;
  };
  readonly recentHospitals: {
    readonly last7d: number;
    readonly last30d: number;
  };
}

export interface HospitalModules {
  readonly emr: boolean;
  readonly labs: boolean;
  readonly assets: boolean;
  readonly onlineConsultation: boolean;
}

export interface AdminHospital {
  readonly id: string;
  readonly name: string;
  readonly type: 'general' | 'specialty' | 'clinic' | 'teaching' | 'other';
  readonly location: string;
  readonly contact?: {
    readonly phone?: string;
    readonly email?: string;
    readonly address?: string;
  };
  readonly logoKey?: string;
  readonly subdomain: string;
  readonly customDomain?: string;
  readonly customDomainVerified: boolean;
  readonly modules: HospitalModules;
  readonly plan: string;
  readonly ownerId: string;
  readonly timezone: string;
  readonly locale: string;
  readonly isArchived: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AdminUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phone?: string;
  readonly photoKey?: string;
  readonly isEmailVerified: boolean;
  readonly isAdmin: boolean;
  readonly twoFactorEnabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MembershipSummary {
  readonly id: string;
  readonly hospitalId: string;
  readonly userId: string;
  readonly role: string;
  readonly status: string;
  readonly joinedAt: string;
}

export interface AdminPaginatedResult<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
