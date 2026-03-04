import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInMonths, format } from 'date-fns';
import type { AssetStatus, TicketPriority, TicketStatus, UserRole } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "Failed to fetch" 등 네트워크/연결 오류일 때 사용자에게 보여줄 메시지 */
export const NETWORK_ERROR_MESSAGE =
  '서버에 연결할 수 없습니다. 인터넷 연결을 확인하고, .env에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 올바른지 확인해 주세요.';

/** 에러 객체에서 사용자에게 보여줄 메시지를 반환 (Failed to fetch 시 안내 문구) */
export function getErrorMessage(error: unknown): string {
  const msg =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
      : String(error ?? '');
  if (msg.includes('Failed to fetch') || msg === 'Load failed') return NETWORK_ERROR_MESSAGE;
  return msg || '오류가 발생했습니다.';
}

// Date formatting
export function formatDate(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

// Asset depreciation calculation (STRAIGHT_LINE method)
export function calculateCurrentValue(
  purchasePrice: number,
  purchaseDate: Date,
  usefulLifeMonths: number,
  salvageValue: number = 0
): number {
  const monthsElapsed = differenceInMonths(new Date(), new Date(purchaseDate));
  const depreciableAmount = purchasePrice - salvageValue;
  const monthlyDepreciation = depreciableAmount / usefulLifeMonths;
  const totalDepreciation = Math.min(monthlyDepreciation * monthsElapsed, depreciableAmount);
  return Math.max(purchasePrice - totalDepreciation, salvageValue);
}

// Status badge colors
export function getAssetStatusColor(status: AssetStatus): string {
  const colors: Record<AssetStatus, string> = {
    InUse: 'bg-green-100 text-green-800',
    InStock: 'bg-blue-100 text-blue-800',
    Repair: 'bg-yellow-100 text-yellow-800',
    Lost: 'bg-red-100 text-red-800',
    Retired: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getTicketStatusColor(status: TicketStatus): string {
  const colors: Record<TicketStatus, string> = {
    Open: 'bg-blue-100 text-blue-800',
    InProgress: 'bg-yellow-100 text-yellow-800',
    Resolved: 'bg-green-100 text-green-800',
    Closed: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getTicketPriorityColor(priority: TicketPriority): string {
  const colors: Record<TicketPriority, string> = {
    Low: 'bg-gray-100 text-gray-800',
    Medium: 'bg-blue-100 text-blue-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    Admin: 'bg-purple-100 text-purple-800',
    Manager: 'bg-blue-100 text-blue-800',
    Member: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

// Format currency (KRW)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

// Check if expiration is soon (within days)
export function isExpiringSoon(expiresAt: Date, days: number = 30): boolean {
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  const daysUntilExpiration = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return daysUntilExpiration <= days && daysUntilExpiration >= 0;
}

// Generate QR payload
export function generateQRPayload(assetId: string): string {
  return `${window.location.origin}/assets/${assetId}`;
}
