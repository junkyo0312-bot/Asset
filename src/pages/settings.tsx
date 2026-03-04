import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/db';
import { supabase } from '../lib/supabase';
import { Building2, User, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/utils';

export function SettingsPage() {
  const { user, company, updateCompanyName } = useAuth();

  // Company settings state
  const [companyName, setCompanyName] = useState(company?.name || '');
  const [savingCompany, setSavingCompany] = useState(false);

  // Profile settings state
  const [profileName, setProfileName] = useState(
    user?.user_metadata?.name || user?.email?.split('@')[0] || ''
  );
  const [savingProfile, setSavingProfile] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    expirationReminders: true,
    ticketUpdates: true,
    assetAssignment: true,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Save Company Settings
  const handleSaveCompany = async () => {
    if (!company?.id) return;
    if (!companyName.trim()) {
      toast.error('Company name cannot be empty');
      return;
    }

    setSavingCompany(true);
    try {
      const { error } = await db.updateCompanyName(company.id, companyName);
      if (error) {
        toast.error(getErrorMessage(error));
      } else {
        updateCompanyName(companyName.trim());
        toast.success('Company settings saved successfully');
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingCompany(false);
    }
  };

  // Save Profile Settings
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    if (!profileName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setSavingProfile(true);
    try {
      // Update user name in users table
      const { error: dbError } = await db.updateUserName(user.id, profileName);
      if (dbError) {
        toast.error(getErrorMessage(dbError));
        return;
      }

      // Also update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: profileName.trim() },
      });

      if (authError) {
        console.error('Auth metadata update error:', authError);
        // Non-critical, DB was already updated
      }

      toast.success('Profile saved successfully');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  // Save Notification Settings
  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      // Store notification preferences in localStorage for now
      localStorage.setItem(
        `notifications_${user?.id}`,
        JSON.stringify(notifications)
      );
      toast.success('Notification settings saved successfully');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingNotifications(false);
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast.error(getErrorMessage(error));
      } else {
        toast.success('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This is your last chance. Type action cannot be reversed. Proceed with account deletion?'
    );
    if (!doubleConfirm) return;

    try {
      // Sign out the user (full account deletion requires server-side admin action)
      await supabase.auth.signOut();
      toast.success('You have been logged out. Contact support to complete account deletion.');
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your account and company preferences</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Company Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Plan</label>
              <div className="mt-1 flex items-center gap-2">
                <Input value={company?.plan || 'FREE'} disabled className="flex-1" />
                <Button
                  variant="outline"
                  onClick={() => toast.info('Plan upgrade feature coming soon!')}
                >
                  Upgrade
                </Button>
              </div>
            </div>
            <Button onClick={handleSaveCompany} disabled={savingCompany}>
              {savingCompany ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <Input value={user?.email || ''} disabled className="mt-1" />
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Asset Expiration Reminders</p>
                <p className="text-sm text-gray-500">
                  Get notified when intangible assets are expiring soon
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.expirationReminders}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    expirationReminders: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Ticket Updates</p>
                <p className="text-sm text-gray-500">
                  Receive notifications when tickets are assigned or updated
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.ticketUpdates}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    ticketUpdates: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Asset Assignment</p>
                <p className="text-sm text-gray-500">
                  Get notified when assets are assigned or unassigned
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.assetAssignment}
                onChange={(e) =>
                  setNotifications((prev) => ({
                    ...prev,
                    assetAssignment: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
            </div>
            <Button onClick={handleSaveNotifications} disabled={savingNotifications}>
              {savingNotifications ? 'Saving...' : 'Save Notification Settings'}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">Change Password</p>
              <p className="text-sm text-gray-500">Update your password regularly for security</p>
              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </Button>
              ) : (
                <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleChangePassword} disabled={savingPassword}>
                      {savingPassword ? 'Changing...' : 'Update Password'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => toast.info('Two-factor authentication feature coming soon!')}
              >
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-gray-900">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
              <Button variant="destructive" className="mt-2" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
