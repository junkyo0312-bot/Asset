import type {
  Company,
  User,
  Membership,
  Category,
  OrgUnit,
  Asset,
  AssetAssignment,
  Ticket,
  IntangibleSchedule,
  DepreciationPolicy,
} from './types';

// Mock Company
export const mockCompany: Company = {
  id: 'company-1',
  name: 'Acme Corporation',
  plan: 'PRO',
  createdAt: new Date('2025-01-01'),
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@acme.com',
    name: 'Admin User',
    status: 'active',
  },
  {
    id: 'user-2',
    email: 'manager@acme.com',
    name: 'Manager Kim',
    status: 'active',
  },
  {
    id: 'user-3',
    email: 'member@acme.com',
    name: 'Member Lee',
    status: 'active',
  },
  {
    id: 'user-4',
    email: 'dev@acme.com',
    name: 'Developer Park',
    status: 'active',
  },
];

// Mock Memberships
export const mockMemberships: Membership[] = [
  {
    companyId: 'company-1',
    userId: 'user-1',
    role: 'Admin',
    createdAt: new Date('2025-01-01'),
  },
  {
    companyId: 'company-1',
    userId: 'user-2',
    role: 'Manager',
    createdAt: new Date('2025-01-05'),
  },
  {
    companyId: 'company-1',
    userId: 'user-3',
    role: 'Member',
    createdAt: new Date('2025-01-10'),
  },
  {
    companyId: 'company-1',
    userId: 'user-4',
    role: 'Member',
    createdAt: new Date('2025-01-15'),
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    companyId: 'company-1',
    name: 'IT Equipment',
    type: 'IT',
    parentId: null,
  },
  {
    id: 'cat-2',
    companyId: 'company-1',
    name: 'Laptops',
    type: 'IT',
    parentId: 'cat-1',
  },
  {
    id: 'cat-3',
    companyId: 'company-1',
    name: 'Monitors',
    type: 'IT',
    parentId: 'cat-1',
  },
  {
    id: 'cat-4',
    companyId: 'company-1',
    name: 'Software Licenses',
    type: 'IT',
    parentId: null,
  },
  {
    id: 'cat-5',
    companyId: 'company-1',
    name: 'Office Furniture',
    type: 'Furniture',
    parentId: null,
  },
];

// Mock Org Units
export const mockOrgUnits: OrgUnit[] = [
  {
    id: 'org-1',
    companyId: 'company-1',
    name: 'Engineering',
    parentId: null,
    path: '/Engineering',
  },
  {
    id: 'org-2',
    companyId: 'company-1',
    name: 'Frontend Team',
    parentId: 'org-1',
    path: '/Engineering/Frontend Team',
  },
  {
    id: 'org-3',
    companyId: 'company-1',
    name: 'Backend Team',
    parentId: 'org-1',
    path: '/Engineering/Backend Team',
  },
  {
    id: 'org-4',
    companyId: 'company-1',
    name: 'Marketing',
    parentId: null,
    path: '/Marketing',
  },
];

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: 'asset-1',
    companyId: 'company-1',
    assetCode: 'LAPTOP-001',
    name: 'MacBook Pro 16"',
    kind: 'TANGIBLE',
    categoryId: 'cat-2',
    orgUnitId: 'org-2',
    manufacturer: 'Apple',
    model: 'MacBook Pro 16-inch 2023',
    serialNumber: 'C02Z1234ABCD',
    purchaseDate: new Date('2024-03-15'),
    purchasePrice: 3500000,
    status: 'InUse',
    currentAssigneeId: 'user-4',
    qrPayload: 'asset-1',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
  },
  {
    id: 'asset-2',
    companyId: 'company-1',
    assetCode: 'MON-001',
    name: 'Dell UltraSharp 27"',
    kind: 'TANGIBLE',
    categoryId: 'cat-3',
    orgUnitId: 'org-2',
    manufacturer: 'Dell',
    model: 'U2723DE',
    serialNumber: 'CN-0ABC123',
    purchaseDate: new Date('2024-05-10'),
    purchasePrice: 650000,
    status: 'InUse',
    currentAssigneeId: 'user-2',
    qrPayload: 'asset-2',
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: 'asset-3',
    companyId: 'company-1',
    assetCode: 'LAPTOP-002',
    name: 'ThinkPad X1 Carbon',
    kind: 'TANGIBLE',
    categoryId: 'cat-2',
    orgUnitId: 'org-3',
    manufacturer: 'Lenovo',
    model: 'X1 Carbon Gen 11',
    serialNumber: 'PF-ABC456',
    purchaseDate: new Date('2024-01-20'),
    purchasePrice: 2200000,
    status: 'Repair',
    currentAssigneeId: null,
    qrPayload: 'asset-3',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2025-02-10'),
  },
  {
    id: 'asset-4',
    companyId: 'company-1',
    assetCode: 'LIC-FIGMA-001',
    name: 'Figma Professional',
    kind: 'INTANGIBLE',
    categoryId: 'cat-4',
    orgUnitId: 'org-2',
    status: 'InUse',
    currentAssigneeId: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'asset-5',
    companyId: 'company-1',
    assetCode: 'DESK-001',
    name: 'Standing Desk',
    kind: 'TANGIBLE',
    categoryId: 'cat-5',
    orgUnitId: 'org-2',
    manufacturer: 'Herman Miller',
    model: 'Motia Sit-to-Stand',
    purchaseDate: new Date('2023-08-15'),
    purchasePrice: 1200000,
    status: 'InUse',
    currentAssigneeId: 'user-4',
    qrPayload: 'asset-5',
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-08-15'),
  },
  {
    id: 'asset-6',
    companyId: 'company-1',
    assetCode: 'LAPTOP-003',
    name: 'MacBook Air M2',
    kind: 'TANGIBLE',
    categoryId: 'cat-2',
    orgUnitId: 'org-4',
    manufacturer: 'Apple',
    model: 'MacBook Air 13-inch M2',
    serialNumber: 'C02Y5678WXYZ',
    purchaseDate: new Date('2024-07-01'),
    purchasePrice: 1850000,
    status: 'InStock',
    currentAssigneeId: null,
    qrPayload: 'asset-6',
    createdAt: new Date('2024-07-01'),
    updatedAt: new Date('2024-07-01'),
  },
];

// Mock Asset Assignments
export const mockAssignments: AssetAssignment[] = [
  {
    id: 'assign-1',
    companyId: 'company-1',
    assetId: 'asset-1',
    assigneeUserId: 'user-2',
    assignedAt: new Date('2024-03-15'),
    unassignedAt: new Date('2024-08-20'),
    note: 'Initial assignment to manager',
  },
  {
    id: 'assign-2',
    companyId: 'company-1',
    assetId: 'asset-1',
    assigneeUserId: 'user-4',
    assignedAt: new Date('2024-08-20'),
    unassignedAt: null,
    note: 'Transferred to developer',
  },
  {
    id: 'assign-3',
    companyId: 'company-1',
    assetId: 'asset-2',
    assigneeUserId: 'user-2',
    assignedAt: new Date('2024-05-10'),
    unassignedAt: null,
  },
  {
    id: 'assign-4',
    companyId: 'company-1',
    assetId: 'asset-3',
    assigneeUserId: 'user-3',
    assignedAt: new Date('2024-01-20'),
    unassignedAt: new Date('2025-02-10'),
    note: 'Returned for repair',
  },
  {
    id: 'assign-5',
    companyId: 'company-1',
    assetId: 'asset-5',
    assigneeUserId: 'user-4',
    assignedAt: new Date('2023-08-15'),
    unassignedAt: null,
  },
];

// Mock Intangible Schedules
export const mockIntangibleSchedules: IntangibleSchedule[] = [
  {
    id: 'schedule-1',
    assetId: 'asset-4',
    scheduleType: 'SUBSCRIPTION',
    expiresAt: new Date('2025-06-01'),
    renewalCycle: 'YEARLY',
    autoRenew: true,
    vendor: 'Figma Inc.',
    cost: 1440000,
    reminderDays: [30, 7],
  },
];

// Mock Depreciation Policies
export const mockDepreciations: DepreciationPolicy[] = [
  {
    assetId: 'asset-1',
    method: 'STRAIGHT_LINE',
    usefulLifeMonths: 48,
    salvageValue: 500000,
  },
  {
    assetId: 'asset-2',
    method: 'STRAIGHT_LINE',
    usefulLifeMonths: 60,
    salvageValue: 100000,
  },
  {
    assetId: 'asset-3',
    method: 'STRAIGHT_LINE',
    usefulLifeMonths: 48,
    salvageValue: 300000,
  },
];

// Mock Tickets
export const mockTickets: Ticket[] = [
  {
    id: 'ticket-1',
    companyId: 'company-1',
    title: 'Laptop screen flickering',
    description: 'The screen on my MacBook Pro has been flickering intermittently. It started yesterday and is making it difficult to work.',
    assetId: 'asset-1',
    requesterUserId: 'user-4',
    assigneeUserId: 'user-2',
    status: 'InProgress',
    priority: 'High',
    createdAt: new Date('2025-02-15'),
    updatedAt: new Date('2025-02-16'),
  },
  {
    id: 'ticket-2',
    companyId: 'company-1',
    title: 'Request new monitor',
    description: 'Need an additional monitor for dual screen setup.',
    assetId: null,
    requesterUserId: 'user-3',
    assigneeUserId: null,
    status: 'Open',
    priority: 'Medium',
    createdAt: new Date('2025-02-16'),
    updatedAt: new Date('2025-02-16'),
  },
  {
    id: 'ticket-3',
    companyId: 'company-1',
    title: 'ThinkPad keyboard not working',
    description: 'Several keys on the keyboard are unresponsive. Need repair or replacement.',
    assetId: 'asset-3',
    requesterUserId: 'user-3',
    assigneeUserId: 'user-2',
    status: 'Resolved',
    priority: 'Urgent',
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-02-14'),
  },
  {
    id: 'ticket-4',
    companyId: 'company-1',
    title: 'Figma license renewal',
    description: 'Figma subscription expires next month. Please renew.',
    assetId: 'asset-4',
    requesterUserId: 'user-2',
    assigneeUserId: 'user-1',
    status: 'Open',
    priority: 'Medium',
    createdAt: new Date('2025-02-17'),
    updatedAt: new Date('2025-02-17'),
  },
];

// Current user context (for demo)
export const mockCurrentUser = mockUsers[0]; // Admin by default
export const mockCurrentMembership = mockMemberships[0];
