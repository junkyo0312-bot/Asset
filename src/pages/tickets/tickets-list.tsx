import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import { Plus, Search } from 'lucide-react';
import { db } from '../../lib/db';
import { useAuth } from '../../lib/auth-context';
import type { Ticket, Asset, User, TicketStatus, TicketPriority } from '../../lib/types';
import { formatDate, getTicketStatusColor, getTicketPriorityColor } from '../../lib/utils';

export function TicketsList() {
  const { company } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      try {
        const [ticketsData, assetsData, usersData] = await Promise.all([
          db.getTickets(company.id),
          db.getAssets(company.id),
          db.getUsers(company.id),
        ]);
        setTickets(ticketsData);
        setAssets(assetsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id]);

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="mt-2 text-gray-600">Manage asset-related requests and issues</p>
        </div>
        <Link to="/tickets/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Ticket
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
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="InProgress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTickets.map((ticket) => {
                const asset = ticket.assetId
                  ? assets.find((a) => a.id === ticket.assetId)
                  : null;
                const requester = users.find((u) => u.id === ticket.requesterUserId);
                const assignee = ticket.assigneeUserId
                  ? users.find((u) => u.id === ticket.assigneeUserId)
                  : null;

                return (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600"
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {ticket.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {asset ? (
                        <Link
                          to={`/assets/${asset.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {asset.name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTicketStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getTicketPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {requester?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {assignee?.name || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">No tickets found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredTickets.length} of {tickets.length} tickets
      </div>
    </div>
  );
}
