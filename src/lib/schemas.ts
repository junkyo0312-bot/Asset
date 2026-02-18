import { z } from 'zod';

// Asset Schemas
export const assetCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  assetCode: z.string().min(1, 'Asset code is required'),
  kind: z.enum(['TANGIBLE', 'INTANGIBLE']),
  categoryId: z.string().min(1, 'Category is required'),
  orgUnitId: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.enum(['InUse', 'InStock', 'Repair', 'Lost', 'Retired']),
  // Tangible specific
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  usefulLifeMonths: z.number().optional(),
  salvageValue: z.number().optional(),
  // Intangible specific
  expiresAt: z.string().optional(),
  renewalCycle: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME']).optional(),
  vendor: z.string().optional(),
  cost: z.number().optional(),
  autoRenew: z.boolean().optional(),
}).refine((data) => {
  if (data.kind === 'TANGIBLE' && data.purchasePrice && !data.purchaseDate) {
    return false;
  }
  return true;
}, {
  message: 'Purchase date is required when purchase price is provided',
  path: ['purchaseDate'],
});

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;

// Assignment Schema
export const assignmentCreateSchema = z.object({
  assetId: z.string().min(1),
  assigneeUserId: z.string().min(1, 'Assignee is required'),
  note: z.string().optional(),
});

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;

// Ticket Schemas
export const ticketCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  assetId: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
});

export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;

export const ticketUpdateSchema = z.object({
  status: z.enum(['Open', 'InProgress', 'Resolved', 'Closed']).optional(),
  assigneeUserId: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
});

export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;

// Category Schema
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  parentId: z.string().optional(),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

// OrgUnit Schema
export const orgUnitCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  parentId: z.string().optional(),
});

export type OrgUnitCreateInput = z.infer<typeof orgUnitCreateSchema>;

// Invitation Schema
export const invitationCreateSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['Admin', 'Manager', 'Member']),
});

export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Company Schema
export const companyCreateSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminName: z.string().min(1, 'Admin name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
