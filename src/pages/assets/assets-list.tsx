import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Plus, Search, Edit } from 'lucide-react';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Asset, Category, User, AssetStatus, AssetKind } from '../../lib/types';
import { formatDate, formatCurrency, getAssetStatusColor } from '../../lib/utils';

export function AssetsList() {
  const { company } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [kindFilter, setKindFilter] = useState<AssetKind | 'all'>('all');

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      try {
        const [assetsData, categoriesData, usersData] = await Promise.all([
          db.getAssets(company.id),
          db.getCategories(company.id),
          db.getUsers(company.id),
        ]);
        setAssets(assetsData);
        setCategories(categoriesData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading assets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id]);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    const matchesKind = kindFilter === 'all' || asset.kind === kindFilter;

    return matchesSearch && matchesStatus && matchesKind;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="mt-2 text-gray-600">Manage your company assets</p>
        </div>
        <Link to="/assets/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name, code, or serial..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as AssetKind | 'all')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Types</option>
              <option value="TANGIBLE">Tangible</option>
              <option value="INTANGIBLE">Intangible</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as AssetStatus | 'all')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="InUse">In Use</option>
              <option value="InStock">In Stock</option>
              <option value="Repair">Repair</option>
              <option value="Lost">Lost</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Assets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Purchase
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredAssets.map((asset) => {
                const category = categories.find((c) => c.id === asset.categoryId);
                const assignee = asset.currentAssigneeId
                  ? users.find((u) => u.id === asset.currentAssigneeId)
                  : null;

                return (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/assets/${asset.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {asset.name}
                      </Link>
                      {asset.model && (
                        <p className="text-sm text-gray-500">{asset.model}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-700">
                        {asset.assetCode}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={asset.kind === 'TANGIBLE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                        {asset.kind === 'TANGIBLE' ? 'Tangible' : 'Intangible'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {category?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getAssetStatusColor(asset.status)}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assignee?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {asset.purchaseDate ? (
                        <div>
                          <div>{formatDate(asset.purchaseDate)}</div>
                          {asset.purchasePrice && (
                            <div className="text-xs text-gray-500">
                              {formatCurrency(asset.purchasePrice)}
                            </div>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Link to={`/assets/${asset.id}`}>
                          <Button variant="ghost" size="sm" title="View Details">
                            View
                          </Button>
                        </Link>
                        <Link to={`/assets/${asset.id}/edit`}>
                          <Button variant="ghost" size="sm" title="Edit Asset">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAssets.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">No assets found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredAssets.length} of {assets.length} assets
      </div>
    </div>
  );
}