import { supabase } from './supabase';
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

// Helper function to get current user's company ID
async function getCurrentUserCompanyId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('memberships')
    .select('company_id')
    .eq('user_id', user.id)
    .single();

  if (error || !data) return null;
  return data.company_id;
}

// Helper function to convert database rows to our types
const mapCompany = (row: any): Company => ({
  id: row.id,
  name: row.name,
  plan: row.plan,
  createdAt: new Date(row.created_at),
});

const mapUser = (row: any): User => ({
  id: row.id,
  email: row.email,
  name: row.name,
  status: row.status,
});

const mapMembership = (row: any): Membership => ({
  companyId: row.company_id,
  userId: row.user_id,
  role: row.role,
  createdAt: new Date(row.created_at),
});

const mapCategory = (row: any): Category => ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  type: row.type,
  parentId: row.parent_id,
});

const mapOrgUnit = (row: any): OrgUnit => ({
  id: row.id,
  companyId: row.company_id,
  name: row.name,
  parentId: row.parent_id,
  path: row.path,
});

const mapAsset = (row: any): Asset => ({
  id: row.id,
  companyId: row.company_id,
  assetCode: row.asset_code,
  name: row.name,
  kind: row.kind,
  categoryId: row.category_id,
  orgUnitId: row.org_unit_id,
  manufacturer: row.manufacturer,
  model: row.model,
  serialNumber: row.serial_number,
  purchaseDate: row.purchase_date ? new Date(row.purchase_date) : undefined,
  purchasePrice: row.purchase_price ? Number(row.purchase_price) : undefined,
  status: row.status,
  qrPayload: row.qr_payload,
  currentAssigneeId: row.current_assignee_id,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapAssetAssignment = (row: any): AssetAssignment => ({
  id: row.id,
  companyId: row.company_id,
  assetId: row.asset_id,
  assigneeUserId: row.assignee_user_id,
  assignedAt: new Date(row.assigned_at),
  unassignedAt: row.unassigned_at ? new Date(row.unassigned_at) : null,
  note: row.note,
});

const mapDepreciationPolicy = (row: any): DepreciationPolicy => ({
  assetId: row.asset_id,
  method: row.method,
  usefulLifeMonths: row.useful_life_months,
  salvageValue: row.salvage_value ? Number(row.salvage_value) : undefined,
});

const mapIntangibleSchedule = (row: any): IntangibleSchedule => ({
  id: row.id,
  assetId: row.asset_id,
  scheduleType: row.schedule_type,
  expiresAt: new Date(row.expires_at),
  renewalCycle: row.renewal_cycle,
  autoRenew: row.auto_renew,
  vendor: row.vendor,
  cost: row.cost ? Number(row.cost) : undefined,
  reminderDays: row.reminder_days || [],
});

const mapTicket = (row: any): Ticket => ({
  id: row.id,
  companyId: row.company_id,
  title: row.title,
  description: row.description,
  assetId: row.asset_id,
  requesterUserId: row.requester_user_id,
  assigneeUserId: row.assignee_user_id,
  status: row.status,
  priority: row.priority,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Database query functions
export const db = {
  // Company
  async getCompany(id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return mapCompany(data);
  },

  // Users
  async getUsers(companyId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('company_id', companyId);
    
    if (error || !data) return [];
    
    const userIds = data.map(m => m.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);
    
    if (usersError || !users) return [];
    return users.map(mapUser);
  },

  async getUser(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return mapUser(data);
  },

  // Memberships
  async getMemberships(companyId: string): Promise<Membership[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('company_id', companyId);
    
    if (error || !data) return [];
    return data.map(mapMembership);
  },

  // Categories
  async getCategories(companyId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    
    if (error || !data) return [];
    return data.map(mapCategory);
  },

  // Org Units
  async getOrgUnits(companyId: string): Promise<OrgUnit[]> {
    const { data, error } = await supabase
      .from('org_units')
      .select('*')
      .eq('company_id', companyId)
      .order('path');
    
    if (error || !data) return [];
    return data.map(mapOrgUnit);
  },

  // Assets
  async getAssets(companyId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(mapAsset);
  },

  async getAsset(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return mapAsset(data);
  },

  async createAsset(companyId: string, assetData: {
    assetCode: string;
    name: string;
    kind: 'TANGIBLE' | 'INTANGIBLE';
    categoryId: string;
    orgUnitId?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    status: string;
    qrPayload?: string;
    currentAssigneeId?: string;
  }): Promise<{ asset: Asset | null; error: string | null }> {
    // Prepare insert data - ensure all required fields are present
    const insertData: any = {
      company_id: companyId,
      asset_code: assetData.assetCode?.trim() || '',
      name: assetData.name?.trim() || '',
      kind: assetData.kind,
      category_id: assetData.categoryId,
      status: assetData.status,
    };

    // Validate required fields
    if (!insertData.asset_code) {
      return { asset: null, error: 'Asset code is required' };
    }
    if (!insertData.name) {
      return { asset: null, error: 'Asset name is required' };
    }
    if (!insertData.category_id) {
      return { asset: null, error: 'Category is required' };
    }

    // Only include optional fields if they have values
    if (assetData.orgUnitId && assetData.orgUnitId.trim() !== '') {
      insertData.org_unit_id = assetData.orgUnitId.trim();
    } else {
      insertData.org_unit_id = null;
    }

    if (assetData.manufacturer && assetData.manufacturer.trim() !== '') {
      insertData.manufacturer = assetData.manufacturer.trim();
    } else {
      insertData.manufacturer = null;
    }

    if (assetData.model && assetData.model.trim() !== '') {
      insertData.model = assetData.model.trim();
    } else {
      insertData.model = null;
    }

    if (assetData.serialNumber && assetData.serialNumber.trim() !== '') {
      insertData.serial_number = assetData.serialNumber.trim();
    } else {
      insertData.serial_number = null;
    }

    if (assetData.purchaseDate && assetData.purchaseDate.trim() !== '') {
      // Ensure date is in YYYY-MM-DD format
      insertData.purchase_date = assetData.purchaseDate.trim();
    } else {
      insertData.purchase_date = null;
    }

    if (assetData.purchasePrice !== undefined && assetData.purchasePrice !== null && assetData.purchasePrice !== '') {
      const price = Number(assetData.purchasePrice);
      if (!isNaN(price) && price >= 0) {
        insertData.purchase_price = price;
      } else {
        insertData.purchase_price = null;
      }
    } else {
      insertData.purchase_price = null;
    }

    // QR payload defaults to asset code
    insertData.qr_payload = assetData.qrPayload?.trim() || assetData.assetCode.trim();

    if (assetData.currentAssigneeId && assetData.currentAssigneeId.trim() !== '') {
      insertData.current_assignee_id = assetData.currentAssigneeId.trim();
    } else {
      insertData.current_assignee_id = null;
    }

    const { data, error } = await supabase
      .from('assets')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating asset:', error);
      console.error('Insert data:', insertData);
      return { asset: null, error: error.message || 'Failed to create asset' };
    }
    return { asset: mapAsset(data), error: null };
  },

  async updateAsset(id: string, assetData: Partial<{
    assetCode: string;
    name: string;
    kind: 'TANGIBLE' | 'INTANGIBLE';
    categoryId: string;
    orgUnitId?: string;
    manufacturer?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    status: string;
    qrPayload?: string;
    currentAssigneeId?: string;
  }>): Promise<Asset | null> {
    const updateData: any = {};
    
    if (assetData.assetCode !== undefined) updateData.asset_code = assetData.assetCode;
    if (assetData.name !== undefined) updateData.name = assetData.name;
    if (assetData.kind !== undefined) updateData.kind = assetData.kind;
    if (assetData.categoryId !== undefined) updateData.category_id = assetData.categoryId;
    if (assetData.orgUnitId !== undefined) updateData.org_unit_id = assetData.orgUnitId || null;
    if (assetData.manufacturer !== undefined) updateData.manufacturer = assetData.manufacturer || null;
    if (assetData.model !== undefined) updateData.model = assetData.model || null;
    if (assetData.serialNumber !== undefined) updateData.serial_number = assetData.serialNumber || null;
    if (assetData.purchaseDate !== undefined) updateData.purchase_date = assetData.purchaseDate || null;
    if (assetData.purchasePrice !== undefined) updateData.purchase_price = assetData.purchasePrice || null;
    if (assetData.status !== undefined) updateData.status = assetData.status;
    if (assetData.qrPayload !== undefined) updateData.qr_payload = assetData.qrPayload || null;
    if (assetData.currentAssigneeId !== undefined) updateData.current_assignee_id = assetData.currentAssigneeId || null;

    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating asset:', error);
      return null;
    }
    return mapAsset(data);
  },

  async createDepreciationPolicy(assetId: string, policy: {
    method: string;
    usefulLifeMonths: number;
    salvageValue?: number;
  }): Promise<DepreciationPolicy | null> {
    const { data, error } = await supabase
      .from('depreciation_policies')
      .insert({
        asset_id: assetId,
        method: policy.method,
        useful_life_months: policy.usefulLifeMonths,
        salvage_value: policy.salvageValue || null,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating depreciation policy:', error);
      return null;
    }
    return mapDepreciationPolicy(data);
  },

  async createIntangibleSchedule(assetId: string, schedule: {
    scheduleType: string;
    expiresAt: string;
    renewalCycle: string;
    autoRenew: boolean;
    vendor?: string;
    cost?: number;
    reminderDays?: number[];
  }): Promise<IntangibleSchedule | null> {
    const { data, error } = await supabase
      .from('intangible_schedules')
      .insert({
        asset_id: assetId,
        schedule_type: schedule.scheduleType,
        expires_at: schedule.expiresAt,
        renewal_cycle: schedule.renewalCycle,
        auto_renew: schedule.autoRenew,
        vendor: schedule.vendor || null,
        cost: schedule.cost || null,
        reminder_days: schedule.reminderDays || [],
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating intangible schedule:', error);
      return null;
    }
    return mapIntangibleSchedule(data);
  },

  // Asset Assignments
  async getAssetAssignments(companyId: string, assetId?: string): Promise<AssetAssignment[]> {
    let query = supabase
      .from('asset_assignments')
      .select('*')
      .eq('company_id', companyId);
    
    if (assetId) {
      query = query.eq('asset_id', assetId);
    }
    
    const { data, error } = await query.order('assigned_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(mapAssetAssignment);
  },

  // Depreciation Policies
  async getDepreciationPolicy(assetId: string): Promise<DepreciationPolicy | null> {
    const { data, error } = await supabase
      .from('depreciation_policies')
      .select('*')
      .eq('asset_id', assetId)
      .single();
    
    if (error || !data) return null;
    return mapDepreciationPolicy(data);
  },

  async getDepreciationPolicies(assetIds: string[]): Promise<DepreciationPolicy[]> {
    const { data, error } = await supabase
      .from('depreciation_policies')
      .select('*')
      .in('asset_id', assetIds);
    
    if (error || !data) return [];
    return data.map(mapDepreciationPolicy);
  },

  // Intangible Schedules
  async getIntangibleSchedules(assetIds?: string[]): Promise<IntangibleSchedule[]> {
    let query = supabase
      .from('intangible_schedules')
      .select('*');
    
    if (assetIds && assetIds.length > 0) {
      query = query.in('asset_id', assetIds);
    }
    
    const { data, error } = await query;
    
    if (error || !data) return [];
    return data.map(mapIntangibleSchedule);
  },

  // Tickets
  async getTickets(companyId: string): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    return data.map(mapTicket);
  },

  async getTicket(id: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return mapTicket(data);
  },

  async createTicket(ticketData: {
    company_id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    requester_user_id: string;
    asset_id?: string | null;
    assignee_user_id?: string | null;
  }): Promise<{ ticket: Ticket | null; error: string | null }> {
    const insertData: any = {
      company_id: ticketData.company_id,
      title: ticketData.title.trim(),
      description: ticketData.description.trim(),
      priority: ticketData.priority,
      status: ticketData.status,
      requester_user_id: ticketData.requester_user_id,
      asset_id: ticketData.asset_id && ticketData.asset_id.trim() !== '' ? ticketData.asset_id : null,
      assignee_user_id: ticketData.assignee_user_id || null,
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating ticket:', error);
      console.error('Insert data:', insertData);
      return { ticket: null, error: error.message || 'Failed to create ticket' };
    }
    return { ticket: mapTicket(data), error: null };
  },

  // Asset Assignment operations
  async createAssignment(data: {
    companyId: string;
    assetId: string;
    assigneeUserId: string;
    note?: string;
  }): Promise<{ error: string | null }> {
    // Step 1: Close any existing active assignment for this asset
    const { error: closeError } = await supabase
      .from('asset_assignments')
      .update({ unassigned_at: new Date().toISOString() })
      .eq('asset_id', data.assetId)
      .is('unassigned_at', null);

    if (closeError) {
      console.error('Error closing previous assignment:', closeError);
      // Not a fatal error — might mean no previous assignment exists
    }

    // Step 2: Create new assignment record
    const { error: insertError } = await supabase
      .from('asset_assignments')
      .insert({
        company_id: data.companyId,
        asset_id: data.assetId,
        assignee_user_id: data.assigneeUserId,
        note: data.note?.trim() || null,
      });

    if (insertError) {
      console.error('Error creating assignment:', insertError);
      return { error: insertError.message };
    }

    // Step 3: Update the asset's current_assignee_id and status
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        current_assignee_id: data.assigneeUserId,
        status: 'InUse',
      })
      .eq('id', data.assetId);

    if (updateError) {
      console.error('Error updating asset assignee:', updateError);
      return { error: updateError.message };
    }

    return { error: null };
  },

  async unassignAsset(assetId: string): Promise<{ error: string | null }> {
    // Step 1: Close active assignment
    const { error: closeError } = await supabase
      .from('asset_assignments')
      .update({ unassigned_at: new Date().toISOString() })
      .eq('asset_id', assetId)
      .is('unassigned_at', null);

    if (closeError) {
      console.error('Error closing assignment:', closeError);
      return { error: closeError.message };
    }

    // Step 2: Clear the asset's current_assignee_id and set status to InStock
    const { error: updateError } = await supabase
      .from('assets')
      .update({
        current_assignee_id: null,
        status: 'InStock',
      })
      .eq('id', assetId);

    if (updateError) {
      console.error('Error clearing asset assignee:', updateError);
      return { error: updateError.message };
    }

    return { error: null };
  },

  // Company update
  async updateCompanyName(companyId: string, name: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('companies')
      .update({ name: name.trim() })
      .eq('id', companyId);

    if (error) {
      console.error('Error updating company:', error);
      return { error: error.message };
    }
    return { error: null };
  },

  // User profile update
  async updateUserName(userId: string, name: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user name:', error);
      return { error: error.message };
    }
    return { error: null };
  },

  // Invitations
  async createInvitation(companyId: string, email: string, role: string): Promise<{ invitation: any | null; error: string | null }> {
    // Generate a unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Check if there's already a pending invitation for this email in this company
    const { data: existing } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', companyId)
      .eq('email', email.trim().toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existing) {
      return { invitation: null, error: 'An active invitation already exists for this email.' };
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      const { data: existingMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', existingUser.id)
        .maybeSingle();

      if (existingMembership) {
        return { invitation: null, error: 'This user is already a member of your company.' };
      }
    }

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        company_id: companyId,
        email: email.trim().toLowerCase(),
        role,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return { invitation: null, error: error.message };
    }
    return { invitation: data, error: null };
  },

  async getInvitations(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async getPendingInvitationsForEmail(email: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, companies(name)')
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async acceptInvitationById(invitationId: string, userId: string): Promise<{ companyId: string | null; error: string | null }> {
    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .is('accepted_at', null)
      .single();

    if (fetchError || !invitation) {
      return { companyId: null, error: 'Invitation not found or has expired.' };
    }

    // Check if user already has a membership in this company
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('company_id', invitation.company_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingMembership) {
      // Create membership
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          company_id: invitation.company_id,
          user_id: userId,
          role: invitation.role,
        });

      if (membershipError) {
        console.error('Error creating membership:', membershipError);
        return { companyId: null, error: membershipError.message };
      }
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return { companyId: invitation.company_id, error: null };
  },

  async declineInvitation(invitationId: string): Promise<{ error: string | null }> {
    // Just mark it as expired by setting accepted_at to null and expires_at to past
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error declining invitation:', error);
      return { error: error.message };
    }
    return { error: null };
  },

  async getInvitationByToken(token: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, companies(name)')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  async acceptInvitation(token: string, userId: string): Promise<{ error: string | null }> {
    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !invitation) {
      return { error: 'Invitation not found or has expired.' };
    }

    // Check if user already has a membership in this company
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('company_id', invitation.company_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMembership) {
      // Mark invitation as accepted anyway
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);
      return { error: null };
    }

    // Create membership
    const { error: membershipError } = await supabase
      .from('memberships')
      .insert({
        company_id: invitation.company_id,
        user_id: userId,
        role: invitation.role,
      });

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return { error: membershipError.message };
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return { error: null };
  },

  async cancelInvitation(invitationId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    if (error) {
      console.error('Error canceling invitation:', error);
      return { error: error.message };
    }
    return { error: null };
  },

  // Category CRUD
  async createCategory(companyId: string, categoryData: { name: string; type: string; parentId: string | null }): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        company_id: companyId,
        name: categoryData.name.trim(),
        type: categoryData.type,
        parent_id: categoryData.parentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      return null;
    }
    return mapCategory(data);
  },

  async deleteCategory(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting category:', error);
      return { error: error.message };
    }
    return { error: null };
  },
};

// Default company ID for demo (from seed data)
export const DEFAULT_COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000';

