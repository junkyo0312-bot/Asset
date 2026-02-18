import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, Edit } from 'lucide-react';
import { db } from '../../lib/db';
import type { Ticket, Asset, User } from '../../lib/types';
import {
  formatDate,
  formatDateTime,
  getTicketStatusColor,
  getTicketPriorityColor,
} from '../../lib/utils';

export function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [requester, setRequester] = useState<User | null>(null);
  const [assignee, setAssignee] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const ticketData = await db.getTicket(id);
        if (!ticketData) {
          setLoading(false);
          return;
        }
        
        setTicket(ticketData);
        
        // Load related data
        const [assetData, requesterData, assigneeData] = await Promise.all([
          ticketData.assetId ? db.getAsset(ticketData.assetId) : Promise.resolve(null),
          db.getUser(ticketData.requesterUserId),
          ticketData.assigneeUserId ? db.getUser(ticketData.assigneeUserId) : Promise.resolve(null),
        ]);
        
        setAsset(assetData);
        setRequester(requesterData);
        setAssignee(assigneeData);
      } catch (error) {
        console.error('Error loading ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Ticket not found</h2>
          <p className="mt-2 text-gray-600">The ticket you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/tickets')} className="mt-4">
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  // Mock activity log
  const activityLog = [
    {
      id: '1',
      type: 'status_change',
      actor: requester,
      message: 'created the ticket',
      timestamp: ticket.createdAt,
    },
    ...(ticket.assigneeUserId
      ? [
          {
            id: '2',
            type: 'field_change',
            actor: assignee,
            message: `assigned the ticket to ${assignee?.name}`,
            timestamp: new Date(ticket.createdAt.getTime() + 3600000),
          },
        ]
      : []),
    ...(ticket.status === 'InProgress' || ticket.status === 'Resolved' || ticket.status === 'Closed'
      ? [
          {
            id: '3',
            type: 'status_change',
            actor: assignee || requester,
            message: `changed status to ${ticket.status}`,
            timestamp: new Date(ticket.updatedAt),
          },
        ]
      : []),
  ];

  const handleStatusChange = (newStatus: string) => {
    console.log('Changing status to:', newStatus);
    // In real app, this would update the backend
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/tickets')} className="mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{ticket.title}</h1>
              <Badge className={getTicketStatusColor(ticket.status)}>{ticket.status}</Badge>
              <Badge className={getTicketPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
            <p className="mt-2 text-gray-600">
              Created {formatDate(ticket.createdAt)} by {requester?.name}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {activity.actor?.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.actor?.name}</span>{' '}
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <Button size="sm">Add Comment</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Open">Open</option>
                <option value="InProgress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Requester</label>
                <p className="mt-1 text-sm text-gray-900">{requester?.name}</p>
                <p className="text-xs text-gray-500">{requester?.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Assignee</label>
                <p className="mt-1 text-sm text-gray-900">{assignee?.name || 'Unassigned'}</p>
                {assignee && <p className="text-xs text-gray-500">{assignee.email}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Priority</label>
                <p className="mt-1">
                  <Badge className={getTicketPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </p>
              </div>

              {asset && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Related Asset</label>
                  <div className="mt-2 rounded-lg border border-gray-200 p-3">
                    <Link
                      to={`/assets/${asset.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {asset.name}
                    </Link>
                    <p className="text-xs text-gray-500">{asset.assetCode}</p>
                    <p className="mt-1">
                      <Badge className={getTicketStatusColor(ticket.status)}>
                        {asset.status}
                      </Badge>
                    </p>
                  </div>
                </div>
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
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(ticket.updatedAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ticket ID</label>
                <p className="mt-1 text-xs font-mono text-gray-600">{ticket.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
