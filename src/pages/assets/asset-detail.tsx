import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  ArrowLeft,
  Edit,
  QrCode,
  Printer,
  UserPlus,
  Ticket as TicketIcon,
  Download,
  AlertCircle,
} from 'lucide-react';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Asset, Category, OrgUnit, User, AssetAssignment, DepreciationPolicy, IntangibleSchedule, Ticket } from '../../lib/types';
import {
  formatDate,
  formatCurrency,
  getAssetStatusColor,
  calculateCurrentValue,
  isExpiringSoon,
} from '../../lib/utils';
import QRCode from 'qrcode';

export function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [asset, setAsset] = useState<Asset | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [orgUnit, setOrgUnit] = useState<OrgUnit | null>(null);
  const [currentAssignee, setCurrentAssignee] = useState<User | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<AssetAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [depreciation, setDepreciation] = useState<DepreciationPolicy | null>(null);
  const [intangibleSchedule, setIntangibleSchedule] = useState<IntangibleSchedule | null>(null);
  const [relatedTickets, setRelatedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !company?.id) return;

    const loadData = async () => {
      try {
        const assetData = await db.getAsset(id);
        if (!assetData) {
          setLoading(false);
          return;
        }
        
        setAsset(assetData);
        
        // Load related data
        const [categoryData, orgUnitData, assigneeData, assignmentsData, usersData, depreciationData, schedulesData, ticketsData] = await Promise.all([
          assetData.categoryId ? db.getCategories(company.id).then(cats => cats.find(c => c.id === assetData.categoryId) || null) : Promise.resolve(null),
          assetData.orgUnitId ? db.getOrgUnits(company.id).then(units => units.find(u => u.id === assetData.orgUnitId) || null) : Promise.resolve(null),
          assetData.currentAssigneeId ? db.getUser(assetData.currentAssigneeId) : Promise.resolve(null),
          db.getAssetAssignments(company.id, id),
          db.getUsers(company.id),
          db.getDepreciationPolicy(id),
          db.getIntangibleSchedules([id]).then(schedules => schedules[0] || null),
          db.getTickets(company.id).then(tickets => tickets.filter(t => t.assetId === id)),
        ]);
        
        setCategory(categoryData);
        setOrgUnit(orgUnitData);
        setCurrentAssignee(assigneeData);
        setAssignmentHistory(assignmentsData.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()));
        setUsers(usersData);
        setDepreciation(depreciationData);
        setIntangibleSchedule(schedulesData);
        setRelatedTickets(ticketsData);
      } catch (error) {
        console.error('Error loading asset:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, company?.id]);

  const currentValue =
    asset?.purchaseDate && asset.purchasePrice && depreciation
      ? calculateCurrentValue(
          asset.purchasePrice,
          asset.purchaseDate,
          depreciation.usefulLifeMonths,
          depreciation.salvageValue
        )
      : null;

  // Generate QR code
  useEffect(() => {
    if (asset) {
      const url = `${window.location.origin}/assets/${asset.id}`;
      QRCode.toDataURL(url, { width: 200 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [asset]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Asset not found</h2>
          <p className="mt-2 text-gray-600">The asset you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/assets')} className="mt-4">
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrDataUrl) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Asset Label - ${asset.assetCode}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .label { border: 2px solid #000; padding: 20px; width: 400px; text-align: center; }
              .qr { margin: 20px 0; }
              .code { font-size: 24px; font-weight: bold; margin: 10px 0; }
              .name { font-size: 18px; margin: 10px 0; }
              .info { font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="code">${asset.assetCode}</div>
              <div class="name">${asset.name}</div>
              <div class="qr"><img src="${qrDataUrl}" alt="QR Code" /></div>
              <div class="info">${asset.model || ''}</div>
              <div class="info">${asset.serialNumber || ''}</div>
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/assets')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assets
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
              <Badge className={getAssetStatusColor(asset.status)}>{asset.status}</Badge>
              <Badge
                className={
                  asset.kind === 'TANGIBLE'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }
              >
                {asset.kind === 'TANGIBLE' ? 'Tangible' : 'Intangible'}
              </Badge>
            </div>
            <p className="mt-2 text-gray-600">
              <code className="rounded bg-gray-100 px-2 py-1">{asset.assetCode}</code>
            </p>
          </div>

          <div className="flex gap-2">
            <Link to={`/assets/${asset.id}/assign`}>
              <Button variant="outline">
                <UserPlus className="h-4 w-4" />
                Assign
              </Button>
            </Link>
            <Link to={`/tickets/new?assetId=${asset.id}`}>
              <Button variant="outline">
                <TicketIcon className="h-4 w-4" />
                Create Ticket
              </Button>
            </Link>
            <Button variant="outline" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4" />
              Print Label
            </Button>
            <Link to={`/assets/${asset.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="mt-1 text-gray-900">{category?.name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Organization Unit</label>
                  <p className="mt-1 text-gray-900">{orgUnit?.name || '-'}</p>
                </div>
                {asset.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                    <p className="mt-1 text-gray-900">{asset.manufacturer}</p>
                  </div>
                )}
                {asset.model && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Model</label>
                    <p className="mt-1 text-gray-900">{asset.model}</p>
                  </div>
                )}
                {asset.serialNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Serial Number</label>
                    <p className="mt-1 text-gray-900">{asset.serialNumber}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Assignee</label>
                  <p className="mt-1 text-gray-900">{currentAssignee?.name || 'Unassigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          {asset.kind === 'TANGIBLE' && asset.purchaseDate && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                    <p className="mt-1 text-gray-900">{formatDate(asset.purchaseDate)}</p>
                  </div>
                  {asset.purchasePrice && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                      <p className="mt-1 text-gray-900">{formatCurrency(asset.purchasePrice)}</p>
                    </div>
                  )}
                  {depreciation && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Useful Life</label>
                        <p className="mt-1 text-gray-900">
                          {depreciation.usefulLifeMonths} months
                        </p>
                      </div>
                      {currentValue !== null && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Current Value (Estimated)
                          </label>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {formatCurrency(currentValue)}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Intangible Schedule */}
          {asset.kind === 'INTANGIBLE' && intangibleSchedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Renewal Schedule
                  {isExpiringSoon(intangibleSchedule.expiresAt, 30) && (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expires At</label>
                    <p className="mt-1 text-gray-900">
                      {formatDate(intangibleSchedule.expiresAt)}
                      {isExpiringSoon(intangibleSchedule.expiresAt, 30) && (
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Expiring Soon</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Renewal Cycle</label>
                    <p className="mt-1 text-gray-900">{intangibleSchedule.renewalCycle}</p>
                  </div>
                  {intangibleSchedule.vendor && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vendor</label>
                      <p className="mt-1 text-gray-900">{intangibleSchedule.vendor}</p>
                    </div>
                  )}
                  {intangibleSchedule.cost && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Annual Cost</label>
                      <p className="mt-1 text-gray-900">
                        {formatCurrency(intangibleSchedule.cost)}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Auto Renew</label>
                    <p className="mt-1 text-gray-900">
                      {intangibleSchedule.autoRenew ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentHistory.length > 0 ? (
                <div className="space-y-4">
                  {assignmentHistory.map((assignment) => {
                    const user = users.find((u) => u.id === assignment.assigneeUserId);
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {user?.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(assignment.assignedAt)} -{' '}
                            {assignment.unassignedAt
                              ? formatDate(assignment.unassignedAt)
                              : 'Present'}
                          </p>
                          {assignment.note && (
                            <p className="mt-1 text-sm text-gray-600">{assignment.note}</p>
                          )}
                        </div>
                        {!assignment.unassignedAt && (
                          <Badge className="bg-green-100 text-green-700">Current</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500">No assignment history</p>
              )}
            </CardContent>
          </Card>

          {/* Related Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Related Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {relatedTickets.length > 0 ? (
                <div className="space-y-3">
                  {relatedTickets.map((ticket) => (
                    <Link
                      key={ticket.id}
                      to={`/tickets/${ticket.id}`}
                      className="block rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{ticket.title}</p>
                          <p className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</p>
                        </div>
                        <Badge className={getAssetStatusColor(asset.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No related tickets</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qrDataUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrDataUrl} alt="Asset QR Code" className="rounded-lg border" />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `${asset.assetCode}-qr.png`;
                      link.href = qrDataUrl;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500">Generating QR code...</p>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(asset.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(asset.updatedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Asset ID</label>
                <p className="mt-1 text-xs font-mono text-gray-600">{asset.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
