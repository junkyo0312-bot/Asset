import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Mail, UserX, Copy, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../lib/auth-context';
import { getRoleBadgeColor, formatDate } from '../lib/utils';
import { toast } from 'sonner';
import type { User, Membership, UserRole } from '../lib/types';
import { Loading } from '../components/ui/loading';

export function TeamPage() {
  const { company } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Member');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      try {
        const [usersData, membershipsData, invitationsData] = await Promise.all([
          db.getUsers(company.id),
          db.getMemberships(company.id),
          db.getInvitations(company.id),
        ]);
        setUsers(usersData);
        setMemberships(membershipsData);
        setInvitations(invitationsData);
      } catch (error) {
        console.error('Error loading team data:', error);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id]);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('이메일 주소를 입력해주세요');
      return;
    }
    if (!company?.id) return;

    setSendingInvite(true);
    try {
      const { invitation, error } = await db.createInvitation(company.id, inviteEmail, inviteRole);

      if (error) {
        toast.error(error);
        return;
      }

      if (invitation) {
        setInvitations((prev) => [invitation, ...prev]);

        // Copy invite link to clipboard
        const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
        try {
          await navigator.clipboard.writeText(inviteLink);
          toast.success('초대가 생성되었습니다! 초대 링크가 클립보드에 복사되었습니다.');
        } catch {
          toast.success('초대가 생성되었습니다! 아래 초대 목록에서 링크를 복사해주세요.');
        }

        setInviteEmail('');
        setInviteRole('Member');
        setIsInviting(false);
      }
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      toast.error(error.message || '초대 생성에 실패했습니다.');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('초대 링크가 복사되었습니다!');
    } catch {
      // Fallback: show link in a prompt
      window.prompt('초대 링크를 복사하세요:', link);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!window.confirm('이 초대를 취소하시겠습니까?')) return;

    try {
      const { error } = await db.cancelInvitation(invitationId);
      if (error) {
        toast.error(`초대 취소 실패: ${error}`);
        return;
      }
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      toast.success('초대가 취소되었습니다.');
    } catch (error: any) {
      toast.error(error.message || '초대 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return <Loading className="h-full" text="Loading team data..." />;
  }

  const pendingInvitations = invitations.filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) > new Date()
  );
  const acceptedInvitations = invitations.filter((inv) => inv.accepted_at);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team</h1>
          <p className="mt-2 text-gray-600">Manage team members and their permissions</p>
        </div>
        <Button onClick={() => setIsInviting(true)}>
          <Mail className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Invite Form */}
      {isInviting && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                disabled={sendingInvite}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={sendingInvite}
              >
                <option value="Member">Member</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
              <Button onClick={handleSendInvite} disabled={sendingInvite}>
                {sendingInvite ? '생성 중...' : 'Send Invite'}
              </Button>
              <Button variant="outline" onClick={() => setIsInviting(false)} disabled={sendingInvite}>
                Cancel
              </Button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              초대 링크가 생성됩니다. 링크를 상대방에게 직접 공유해주세요. (7일간 유효)
            </p>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Full access to all resources. Can manage team members, assign permissions, and
              configure company settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Can manage assets and tickets within assigned scope. Cannot manage team members or
              company settings.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800">Member</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Read-only access to assigned assets. Can view asset details and history.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Name</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Role</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Joined</th>
                  <th className="pb-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const membership = memberships.find((m) => m.userId === user.id);
                  
                  return (
                    <tr key={user.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="py-4">
                        {membership && (
                          <Badge className={getRoleBadgeColor(membership.role)}>
                            {membership.role}
                          </Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <Badge
                          className={
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-gray-700">
                        {membership ? formatDate(membership.createdAt) : '-'}
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            Edit Role
                          </Button>
                          {membership?.role !== 'Admin' && (
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-500">No team members found</p>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Invitations ({pendingInvitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length > 0 ? (
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-sm font-semibold text-yellow-700">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{inv.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(inv.role)}>{inv.role}</Badge>
                        <span className="text-xs text-gray-500">
                          만료: {formatDate(new Date(inv.expires_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(inv.token)}
                      title="Copy invite link"
                    >
                      <Copy className="h-4 w-4" />
                      링크 복사
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => handleCancelInvitation(inv.id)}
                      title="Cancel invitation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">대기 중인 초대가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* Accepted Invitations (history) */}
      {acceptedInvitations.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Accepted Invitations ({acceptedInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acceptedInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{inv.email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge className={getRoleBadgeColor(inv.role)}>{inv.role}</Badge>
                        <span className="text-xs text-gray-500">
                          수락: {formatDate(new Date(inv.accepted_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
