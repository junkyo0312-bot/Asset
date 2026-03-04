import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { ticketCreateSchema, type TicketCreateInput } from '../../lib/schemas';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Asset } from '../../lib/types';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/utils';

export function TicketForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { company, user } = useAuth();
  const preselectedAssetId = searchParams.get('assetId');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!company?.id) return;

    const loadAssets = async () => {
      try {
        const assetsData = await db.getAssets(company.id);
        setAssets(assetsData);
      } catch (error) {
        console.error('Error loading assets:', error);
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [company?.id]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TicketCreateInput>({
    defaultValues: {
      assetId: preselectedAssetId || undefined,
      priority: 'Medium',
    },
  });

  const onSubmit = async (data: TicketCreateInput) => {
    setSubmitting(true);
    try {
      console.log('Ticket data:', data);
      
      if (!company?.id || !user?.id) {
        toast.error('인증 정보를 불러올 수 없습니다.');
        return;
      }

      // Create ticket in database
      const ticketData: any = {
        company_id: company.id,
        title: data.title.trim(),
        description: data.description.trim(),
        priority: data.priority,
        status: 'Open',
        requester_user_id: user.id,
        asset_id: data.assetId && data.assetId.trim() !== '' ? data.assetId : null,
        assignee_user_id: null,
      };

      const { data: ticketResult, error } = await db.createTicket(ticketData);

      if (error) {
        toast.error(getErrorMessage(error));
        console.error('Create ticket error:', error);
        return;
      }

      if (ticketResult) {
        toast.success('Ticket created successfully');
        navigate('/tickets');
      } else {
        toast.error(getErrorMessage(new Error('Failed to create ticket')));
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => navigate('/tickets')} className="mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Tickets
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="mt-2 text-gray-600">Submit a request or report an issue</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('title')}
                placeholder="Brief description of the issue"
                className="mt-1"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Provide detailed information about the issue or request..."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('priority')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Related Asset</label>
                <select
                  {...register('assetId')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">No asset (optional)</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.assetCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Ticket'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/tickets')} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
