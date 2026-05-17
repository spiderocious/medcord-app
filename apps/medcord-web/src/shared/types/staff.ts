export interface CustomRole {
  readonly id: string;
  readonly hospitalId: string;
  readonly name: string;
  readonly slug: string;
  readonly permissions: readonly string[];
  readonly isSystem: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
