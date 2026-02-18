import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { type AssignmentCreateInput } from '../../lib/schemas';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Asset, User, AssetAssignment } from '../../lib/types';
import { toast } from 'sonner';

export function AssetAssignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<AssetAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !company?.id) return;

    const loadData = async () => {
      try {
        const [assetData, usersData, assignmentsData] = await Promise.all([
          db.getAsset(id),
          db.getUsers(company.id),
          db.getAssetAssignments(company.id, id),
        ]);
        
        setAsset(assetData);
        setUsers(usersData);
        const activeAssignment = assignmentsData.find(a => !a.unassignedAt);
        setCurrentAssignment(activeAssignment || null);
      } catch (error) {
        console.error('Error loading assignment data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, company?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignmentCreateInput>({
    defaultValues: {
      assetId: id,
      assigneeUserId: '',
    },
  });

  const onSubmit = async (data: AssignmentCreateInput) => {
    if (!company?.id || !id) return;

    if (!data.assigneeUserId || data.assigneeUserId.trim() === '') {
      toast.error('Please select a team member');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await db.createAssignment({
        companyId: company.id,
        assetId: id,
        assigneeUserId: data.assigneeUserId,
        note: data.note,
      });

      if (error) {
        toast.error(`Failed to assign asset: ${error}`);
      } else {
        toast.success('Asset assigned successfully');
        navigate(`/assets/${id}`);
      }
    } catch (err: any) {
      console.error('Error assigning asset:', err);
      toast.error(`Failed to assign asset: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!id) return;

    const confirmed = window.confirm('Are you sure you want to unassign this asset?');
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const { error } = await db.unassignAsset(id);

      if (error) {
        toast.error(`Failed to unassign asset: ${error}`);
      } else {
        toast.success('Asset unassigned successfully');
        navigate(`/assets/${id}`);
      }
    } catch (err: any) {
      console.error('Error unassigning asset:', err);
      toast.error(`Failed to unassign asset: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading assignment form...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Asset not found</h2>
          <Button onClick={() => navigate('/assets')} className="mt-4">
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const currentAssignee = currentAssignment
    ? users.find((u) => u.id === currentAssignment.assigneeUserId)
    : null;

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => navigate(`/assets/${id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Asset
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assign Asset</h1>
        <p className="mt-2 text-gray-600">
          Assign or reassign <span className="font-semibold">{asset.name}</span> to a team member
        </p>
      </div>

      {currentAssignee && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <p className="text-sm text-blue-900">
              <strong>Current Assignee:</strong> {currentAssignee.name} ({currentAssignee.email})
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Assigning a new person will automatically unassign the current assignee.
            </p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Assign To <span className="text-red-500">*</span>
              </label>
              <select
                {...register('assigneeUserId')}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select a team member</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              {errors.assigneeUserId && (
                <p className="mt-1 text-sm text-red-500">{errors.assigneeUserId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Note (Optional)
              </label>
              <textarea
                {...register('note')}
                rows={3}
                placeholder="Add a note about this assignment..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Assigning...' : 'Assign Asset'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(`/assets/${id}`)} disabled={submitting}>
            Cancel
          </Button>
          {currentAssignment && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnassign}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Unassign Current User'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
