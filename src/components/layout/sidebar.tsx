import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Package,
  Ticket,
  Users,
  FolderTree,
  Settings,
  Building2,
  LogOut,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../lib/auth-context';
import { useState, useRef, useEffect } from 'react';

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Package },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'Categories', href: '/categories', icon: FolderTree, adminOnly: false },
  { name: 'Team', href: '/team', icon: Users, adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, company, membership, allMemberships, signOut, switchCompany } = useAuth();
  const isAdmin = membership?.role === 'Admin';
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleSwitchCompany = (companyId: string) => {
    switchCompany(companyId);
    setShowCompanySelector(false);
    // Reload to reflect new company data everywhere
    window.location.reload();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCompanySelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMultipleCompanies = allMemberships.length > 1;

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo / Company selector */}
      <div className="relative border-b border-gray-200" ref={dropdownRef}>
        <button
          onClick={() => hasMultipleCompanies && setShowCompanySelector(!showCompanySelector)}
          className={cn(
            'flex h-16 w-full items-center gap-2 px-6',
            hasMultipleCompanies && 'cursor-pointer hover:bg-gray-50 transition-colors'
          )}
        >
          <Building2 className="h-6 w-6 flex-shrink-0 text-blue-600" />
          <div className="flex-1 min-w-0 text-left">
            <h1 className="truncate text-sm font-semibold text-gray-900">
              {company?.name || 'Loading...'}
            </h1>
            <p className="truncate text-xs text-gray-500">{membership?.role || ''}</p>
          </div>
          {hasMultipleCompanies && (
            <ChevronDown className={cn(
              'h-4 w-4 flex-shrink-0 text-gray-400 transition-transform',
              showCompanySelector && 'rotate-180'
            )} />
          )}
        </button>

        {/* Company dropdown */}
        {showCompanySelector && (
          <div className="absolute left-2 right-2 top-[64px] z-50 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">회사 전환</p>
            {allMemberships.map((m) => (
              <button
                key={m.company.id}
                onClick={() => handleSwitchCompany(m.company.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  m.company.id === company?.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium">{m.company.name}</p>
                  <p className="truncate text-xs text-gray-500">{m.membership.role}</p>
                </div>
                {m.company.id === company?.id && (
                  <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {(user?.user_metadata?.name || user?.email || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
