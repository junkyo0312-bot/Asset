// Core Entity Types

export type UserRole = 'Admin' | 'Manager' | 'Member';
export type UserStatus = 'active' | 'invited';

export type AssetKind = 'TANGIBLE' | 'INTANGIBLE';
export type AssetStatus = 'InUse' | 'InStock' | 'Repair' | 'Lost' | 'Retired';

export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type DepreciationMethod = 'STRAIGHT_LINE';
export type RenewalCycle = 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

// Entities

export interface Company {
  id: string;
  name: string;
  plan: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
}

export interface Membership {
  companyId: string;
  userId: string;
  role: UserRole;
  createdAt: Date;
}

export interface OrgUnit {
  id: string;
  companyId: string;
  name: string;
  parentId: string | null;
  path: string;
}

export interface Category {
  id: string;
  companyId: string;
  name: string;
  type: string;
  parentId: string | null;
}

export interface Asset {
  id: string;
  companyId: string;
  assetCode: string;
  name: string;
  kind: AssetKind;
  categoryId: string;
  orgUnitId: string | null;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  status: AssetStatus;
  qrPayload?: string;
  currentAssigneeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetAssignment {
  id: string;
  companyId: string;
  assetId: string;
  assigneeUserId: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  note?: string;
}

export interface DepreciationPolicy {
  assetId: string;
  method: DepreciationMethod;
  usefulLifeMonths: number;
  salvageValue?: number;
}

export interface IntangibleSchedule {
  id: string;
  assetId: string;
  scheduleType: string;
  expiresAt: Date;
  renewalCycle: RenewalCycle;
  autoRenew: boolean;
  vendor?: string;
  cost?: number;
  reminderDays: number[];
}

export interface Ticket {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assetId: string | null;
  requesterUserId: string;
  assigneeUserId: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  ticketId: string;
  actorUserId: string;
  type: 'comment' | 'status_change' | 'field_change';
  payload: any;
  createdAt: Date;
}

export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  role: UserRole;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

// Extended types for UI

export interface AssetWithDetails extends Asset {
  category?: Category;
  orgUnit?: OrgUnit;
  currentAssignee?: User;
  depreciation?: DepreciationPolicy;
  intangibleSchedule?: IntangibleSchedule;
  assignmentHistory?: AssetAssignment[];
}

export interface TicketWithDetails extends Ticket {
  asset?: Asset;
  requester?: User;
  assignee?: User;
  activityLog?: ActivityLog[];
}
