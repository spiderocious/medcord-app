import mongoose, { type Document, Schema } from 'mongoose';

// ── Invitation ────────────────────────────────────────────────────────────────

export interface IInvitation {
  id: string;
  hospitalId: string;
  email: string;
  role: string;
  department?: string | undefined;
  unit?: string | undefined;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvitationDocument extends IInvitation, Document {}

const invitationSchema = new Schema<IInvitationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    department: String,
    unit: String,
    invitedBy: { type: String, required: true },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'revoked'],
      default: 'pending',
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'invitations' },
);

invitationSchema.index({ hospitalId: 1, email: 1 });
invitationSchema.index({ hospitalId: 1, status: 1 });

export const InvitationModel = mongoose.model<IInvitationDocument>('Invitation', invitationSchema);

// ── Custom Role ───────────────────────────────────────────────────────────────

export interface ICustomRole {
  id: string;
  hospitalId: string;
  name: string;
  slug: string;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomRoleDocument extends ICustomRole, Document {}

const customRoleSchema = new Schema<ICustomRoleDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    hospitalId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    permissions: [{ type: String }],
    isSystem: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'custom_roles' },
);

customRoleSchema.index({ hospitalId: 1, slug: 1 }, { unique: true });

export const CustomRoleModel = mongoose.model<ICustomRoleDocument>('CustomRole', customRoleSchema);
