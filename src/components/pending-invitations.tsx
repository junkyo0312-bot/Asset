import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/db';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Users, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRoleBadgeColor } from '../lib/utils';

export function PendingInvitations() {
  const { user, allMemberships } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const loadInvitations = async () => {
      try {
        const data = await db.getPendingInvitationsForEmail(user.email!);
        // Filter out invitations for companies the user is already a member of
        const memberCompanyIds = new Set(allMemberships.map(m => m.company.id));
        const filtered = data.filter(inv => !memberCompanyIds.has(inv.company_id));
        setInvitations(filtered);
      } catch (error) {
        console.error('Error loading pending invitations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvitations();
  }, [user?.email, allMemberships]);

  const handleAccept = async (invitation: any) => {
    if (!user?.id) return;

    setProcessingId(invitation.id);
    try {
      const { companyId, error } = await db.acceptInvitationById(invitation.id, user.id);

      if (error) {
        toast.error(`초대 수락 실패: ${error}`);
        setProcessingId(null);
        return;
      }

      toast.success(`${invitation.companies?.name || 'Company'}에 참여했습니다! 전환 중...`);

      // Remove from list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));

      // Set the new company as the selected company BEFORE reloading
      if (companyId) {
        localStorage.setItem('selected_company_id', companyId);
      }

      // Reload the page to refresh auth context with the new company
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error(error.message || '초대 수락에 실패했습니다.');
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitation: any) => {
    if (!window.confirm(`${invitation.companies?.name || 'Company'}의 초대를 거절하시겠습니까?`)) return;

    setProcessingId(invitation.id);
    try {
      const { error } = await db.declineInvitation(invitation.id);

      if (error) {
        toast.error(`초대 거절 실패: ${error}`);
        setProcessingId(null);
        return;
      }

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
      toast.success('초대를 거절했습니다.');
    } catch (error: any) {
      console.error('Error declining invitation:', error);
      toast.error(error.message || '초대 거절에 실패했습니다.');
      setProcessingId(null);
    }
  };

  if (loading || invitations.length === 0) {
    return null;
  }

  return (
    <div className="mx-8 mt-4 space-y-3">
      {invitations.map((inv) => {
        const isProcessing = processingId === inv.id;
        const companyName = inv.companies?.name || 'Unknown Company';

        return (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  <span className="font-bold">{companyName}</span>에서 팀원으로 초대했습니다
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={getRoleBadgeColor(inv.role)}>{inv.role}</Badge>
                  <span className="text-xs text-blue-600">
                    {new Date(inv.expires_at) > new Date()
                      ? `${Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}일 후 만료`
                      : '만료됨'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAccept(inv)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                수락
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecline(inv)}
                disabled={isProcessing}
              >
                <X className="h-4 w-4" />
                거절
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


