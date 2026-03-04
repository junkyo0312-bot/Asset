import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { assetCreateSchema, type AssetCreateInput } from '../../lib/schemas';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Category, OrgUnit, Asset } from '../../lib/types';
import { toast } from 'sonner';
import { getErrorMessage } from '../../lib/utils';

export function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const isEdit = !!id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssetCreateInput>({
    defaultValues: {
      kind: 'TANGIBLE',
      status: 'InStock',
      renewalCycle: 'YEARLY',
      autoRenew: false,
    },
  });

  const kind = watch('kind');

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      try {
        const [categoriesData, orgUnitsData] = await Promise.all([
          db.getCategories(company.id),
          db.getOrgUnits(company.id),
        ]);
        setCategories(categoriesData);
        setOrgUnits(orgUnitsData);

        // If editing, load asset data
        if (id) {
          const asset = await db.getAsset(id);
          if (asset) {
            const depreciation = await db.getDepreciationPolicy(id);
            const intangibleSchedule = await db.getIntangibleSchedules([id]).then(s => s[0] || null);
            
            reset({
              name: asset.name,
              assetCode: asset.assetCode,
              kind: asset.kind,
              categoryId: asset.categoryId,
              orgUnitId: asset.orgUnitId || '',
              status: asset.status,
              manufacturer: asset.manufacturer || '',
              model: asset.model || '',
              serialNumber: asset.serialNumber || '',
              purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : '',
              purchasePrice: asset.purchasePrice,
              usefulLifeMonths: depreciation?.usefulLifeMonths,
              salvageValue: depreciation?.salvageValue,
              expiresAt: intangibleSchedule?.expiresAt ? intangibleSchedule.expiresAt.toISOString().split('T')[0] : '',
              renewalCycle: intangibleSchedule?.renewalCycle || 'YEARLY',
              autoRenew: intangibleSchedule?.autoRenew || false,
              vendor: intangibleSchedule?.vendor || '',
              cost: intangibleSchedule?.cost,
            });
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, company?.id]);

  const onSubmit = async (data: AssetCreateInput) => {
    setSubmitting(true);
    console.log('Form data submitted:', data);
    try {
      if (isEdit && id) {
        // Update existing asset
        const updateData: any = {
          name: data.name,
          assetCode: data.assetCode,
          kind: data.kind,
          categoryId: data.categoryId,
          status: data.status,
        };
        
        if (data.orgUnitId && data.orgUnitId.trim() !== '') {
          updateData.orgUnitId = data.orgUnitId;
        }
        if (data.manufacturer) updateData.manufacturer = data.manufacturer;
        if (data.model) updateData.model = data.model;
        if (data.serialNumber) updateData.serialNumber = data.serialNumber;
        if (data.purchaseDate) updateData.purchaseDate = data.purchaseDate;
        if (data.purchasePrice !== undefined) updateData.purchasePrice = data.purchasePrice;

        const updatedAsset = await db.updateAsset(id, updateData);
        
        if (updatedAsset) {
          // Update depreciation policy if provided
          if (data.kind === 'TANGIBLE' && data.usefulLifeMonths) {
            const existingPolicy = await db.getDepreciationPolicy(id);
            if (existingPolicy) {
              // Update policy (would need update function)
            } else if (data.usefulLifeMonths) {
              await db.createDepreciationPolicy(id, {
                method: 'STRAIGHT_LINE',
                usefulLifeMonths: data.usefulLifeMonths,
                salvageValue: data.salvageValue,
              });
            }
          }

          // Update intangible schedule if provided
          if (data.kind === 'INTANGIBLE' && data.expiresAt) {
            const existingSchedule = await db.getIntangibleSchedules([id]);
            if (existingSchedule.length === 0 && data.expiresAt) {
              await db.createIntangibleSchedule(id, {
                scheduleType: 'SUBSCRIPTION',
                expiresAt: new Date(data.expiresAt).toISOString(),
                renewalCycle: data.renewalCycle || 'YEARLY',
                autoRenew: data.autoRenew || false,
                vendor: data.vendor,
                cost: data.cost,
                reminderDays: [30, 7],
              });
            }
          }

          toast.success('Asset updated successfully');
          navigate('/assets');
        } else {
          toast.error('Failed to update asset');
        }
      } else {
        // Create new asset
        const assetData: any = {
          assetCode: data.assetCode.trim(),
          name: data.name.trim(),
          kind: data.kind,
          categoryId: data.categoryId,
          status: data.status,
        };

        if (data.orgUnitId && data.orgUnitId.trim() !== '') {
          assetData.orgUnitId = data.orgUnitId.trim();
        }
        if (data.manufacturer && data.manufacturer.trim() !== '') {
          assetData.manufacturer = data.manufacturer.trim();
        }
        if (data.model && data.model.trim() !== '') {
          assetData.model = data.model.trim();
        }
        if (data.serialNumber && data.serialNumber.trim() !== '') {
          assetData.serialNumber = data.serialNumber.trim();
        }
        if (data.purchaseDate && data.purchaseDate.trim() !== '') {
          assetData.purchaseDate = data.purchaseDate;
        }
        if (data.purchasePrice !== undefined && data.purchasePrice !== null) {
          assetData.purchasePrice = Number(data.purchasePrice);
        }
        assetData.qrPayload = data.assetCode.trim();

        console.log('Asset data to be created:', assetData);
        const result = await db.createAsset(company!.id, assetData);
        console.log('Create asset result:', result);

        if (result.error) {
          toast.error(`Failed to create asset: ${getErrorMessage(result.error)}`);
          console.error('Create asset error details:', result.error);
          return;
        }

        if (result.asset) {
          // Create depreciation policy if provided
          if (data.kind === 'TANGIBLE' && data.usefulLifeMonths) {
            try {
              await db.createDepreciationPolicy(result.asset.id, {
                method: 'STRAIGHT_LINE',
                usefulLifeMonths: data.usefulLifeMonths,
                salvageValue: data.salvageValue,
              });
            } catch (err) {
              console.error('Error creating depreciation policy:', err);
              // Don't fail the whole operation if policy creation fails
            }
          }

          // Create intangible schedule if provided
          if (data.kind === 'INTANGIBLE' && data.expiresAt) {
            try {
              await db.createIntangibleSchedule(result.asset.id, {
                scheduleType: 'SUBSCRIPTION',
                expiresAt: new Date(data.expiresAt).toISOString(),
                renewalCycle: data.renewalCycle || 'YEARLY',
                autoRenew: data.autoRenew || false,
                vendor: data.vendor,
                cost: data.cost,
                reminderDays: [30, 7],
              });
            } catch (err) {
              console.error('Error creating intangible schedule:', err);
              // Don't fail the whole operation if schedule creation fails
            }
          }

          toast.success('Asset created successfully');
          navigate('/assets');
        } else {
          toast.error('Failed to create asset: Unknown error');
        }
      }
    } catch (error) {
      console.error('Error saving asset:', error);
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
      <Button variant="ghost" onClick={() => navigate('/assets')} className="mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Assets
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? 'Edit Asset' : 'Add New Asset'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isEdit ? 'Update asset information' : 'Register a new asset in the system'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <Input {...register('name')} placeholder="e.g., MacBook Pro 16&quot;" className="mt-1" />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Asset Code <span className="text-red-500">*</span>
                </label>
                <Input {...register('assetCode')} placeholder="e.g., LAPTOP-001" className="mt-1" />
                {errors.assetCode && (
                  <p className="mt-1 text-sm text-red-500">{errors.assetCode.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Asset Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('kind')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="TANGIBLE">Tangible (Physical Asset)</option>
                  <option value="INTANGIBLE">Intangible (License/Software)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('status')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="InStock">In Stock</option>
                  <option value="InUse">In Use</option>
                  <option value="Repair">Repair</option>
                  <option value="Lost">Lost</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('categoryId')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-500">{errors.categoryId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Unit
                </label>
                <select
                  {...register('orgUnitId')}
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select an org unit (optional)</option>
                  {orgUnits.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.path}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {kind === 'TANGIBLE' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                  <Input {...register('manufacturer')} placeholder="e.g., Apple" className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <Input
                    {...register('model')}
                    placeholder="e.g., MacBook Pro 16-inch 2023"
                    className="mt-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <Input
                    {...register('serialNumber')}
                    placeholder="e.g., C02Z1234ABCD"
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Information (Tangible only) */}
        {kind === 'TANGIBLE' && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <Input type="date" {...register('purchaseDate')} className="mt-1" />
                  {errors.purchaseDate && (
                    <p className="mt-1 text-sm text-red-500">{errors.purchaseDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purchase Price (₩)
                  </label>
                  <Input
                    type="number"
                    {...register('purchasePrice', { valueAsNumber: true })}
                    placeholder="e.g., 3500000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Useful Life (months)
                  </label>
                  <Input
                    type="number"
                    {...register('usefulLifeMonths', { valueAsNumber: true })}
                    placeholder="e.g., 48"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Salvage Value (₩)
                  </label>
                  <Input
                    type="number"
                    {...register('salvageValue', { valueAsNumber: true })}
                    placeholder="e.g., 500000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Intangible Schedule */}
        {kind === 'INTANGIBLE' && (
          <Card>
            <CardHeader>
              <CardTitle>Renewal Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <Input type="date" {...register('expiresAt')} className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Renewal Cycle</label>
                  <select
                    {...register('renewalCycle')}
                    className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONE_TIME">One Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <Input {...register('vendor')} placeholder="e.g., Microsoft" className="mt-1" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Annual Cost (₩)
                  </label>
                  <Input
                    type="number"
                    {...register('cost', { valueAsNumber: true })}
                    placeholder="e.g., 1440000"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('autoRenew')}
                    id="autoRenew"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="autoRenew" className="text-sm font-medium text-gray-700">
                    Auto-renew enabled
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Asset' : 'Create Asset'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/assets')} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
