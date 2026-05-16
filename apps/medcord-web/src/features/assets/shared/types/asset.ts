export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface AssetPhoto {
  readonly fileKey: string;
  readonly caption?: string;
}

export interface AssetLocationHistory {
  readonly location: string;
  readonly movedAt: string;
  readonly movedBy: string;
  readonly note?: string;
}

export interface Asset {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly assetTag?: string;
  readonly category: string;
  readonly manufacturer?: string;
  readonly modelName?: string;
  readonly serialNumber?: string;
  readonly purchaseDate?: string;
  readonly purchasePrice?: number;
  readonly warrantyExpiresAt?: string;
  readonly status: AssetStatus;
  readonly condition: AssetCondition;
  readonly currentLocation?: string;
  readonly locationHistory: readonly AssetLocationHistory[];
  readonly assignedTo?: string;
  readonly photos: readonly AssetPhoto[];
  readonly notes?: string;
  readonly lastMaintenanceAt?: string;
  readonly nextMaintenanceDue?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AssetListResult {
  readonly items: readonly Asset[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
