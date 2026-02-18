import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router';
import {
  Package,
  Ticket,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../lib/auth-context';
import type { Asset, Ticket as TicketType, IntangibleSchedule, AssetAssignment, User } from '../lib/types';
import { formatDate, getAssetStatusColor, getTicketStatusColor, isExpiringSoon } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export function Dashboard() {
  const { company, loading: authLoading } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [intangibleSchedules, setIntangibleSchedules] = useState<IntangibleSchedule[]>([]);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish loading
    if (!company?.id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [assetsData, ticketsData, schedulesData, assignmentsData, usersData] = await Promise.all([
          db.getAssets(company.id),
          db.getTickets(company.id),
          db.getIntangibleSchedules(),
          db.getAssetAssignments(company.id),
          db.getUsers(company.id),
        ]);
        
        setAssets(assetsData);
        setTickets(ticketsData);
        setIntangibleSchedules(schedulesData);
        setAssignments(assignmentsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalAssets = assets.length;
  const assetsByStatus = {
    InUse: assets.filter((a) => a.status === 'InUse').length,
    InStock: assets.filter((a) => a.status === 'InStock').length,
    Repair: assets.filter((a) => a.status === 'Repair').length,
    Lost: assets.filter((a) => a.status === 'Lost').length,
    Retired: assets.filter((a) => a.status === 'Retired').length,
  };

  const expiringSoonCount = intangibleSchedules.filter((s) =>
    isExpiringSoon(s.expiresAt, 30)
  ).length;

  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'InProgress').length;

  // Recent assignments
  const recentAssignments = assignments
    .slice()
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 5);

  // Recent tickets
  const recentTickets = tickets
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Chart data
  const statusChartData = [
    { name: 'In Use', value: assetsByStatus.InUse, color: '#10b981' },
    { name: 'In Stock', value: assetsByStatus.InStock, color: '#3b82f6' },
    { name: 'Repair', value: assetsByStatus.Repair, color: '#eab308' },
    { name: 'Lost', value: assetsByStatus.Lost, color: '#ef4444' },
    { name: 'Retired', value: assetsByStatus.Retired, color: '#6b7280' },
  ];

  // Get category counts (simplified - would need categories data for proper mapping)
  const categoryData = [
    { name: 'Laptops', count: assets.filter((a) => a.name.toLowerCase().includes('laptop') || a.name.toLowerCase().includes('macbook')).length },
    { name: 'Monitors', count: assets.filter((a) => a.name.toLowerCase().includes('monitor')).length },
    { name: 'Software', count: assets.filter((a) => a.kind === 'INTANGIBLE').length },
    { name: 'Furniture', count: assets.filter((a) => a.name.toLowerCase().includes('desk')).length },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your asset management system</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Assets</CardTitle>
            <Package className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalAssets}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">
                {assetsByStatus.InUse} in use
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-600">
                {assetsByStatus.InStock} in stock
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Open Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{openTickets}</div>
            <p className="mt-2 text-xs text-gray-500">
              {tickets.filter((t) => t.status === 'InProgress').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{expiringSoonCount}</div>
            <p className="mt-2 text-xs text-gray-500">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Under Repair</CardTitle>
            <Clock className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{assetsByStatus.Repair}</div>
            <p className="mt-2 text-xs text-gray-500">Assets in repair</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [value, 'Count']}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAssignments.map((assignment) => {
                const asset = assets.find((a) => a.id === assignment.assetId);
                const user = users.find((u) => u.id === assignment.assigneeUserId);
                
                return (
                  <div key={assignment.id} className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <Link
                        to={`/assets/${asset?.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {asset?.name}
                      </Link>
                      <p className="text-sm text-gray-500">
                        Assigned to {user?.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(assignment.assignedAt)}</p>
                    </div>
                    {assignment.unassignedAt ? (
                      <Badge className="bg-gray-100 text-gray-600">Completed</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-start justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {ticket.title}
                    </Link>
                    <p className="text-xs text-gray-400">{formatDate(ticket.createdAt)}</p>
                  </div>
                  <Badge className={getTicketStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
