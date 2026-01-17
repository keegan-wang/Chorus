'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  organization_id: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  settings: {
    default_guardrail_profile?: string;
    default_max_questions?: number;
    notification_email?: string;
  };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications'>('profile');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
  });

  const [orgForm, setOrgForm] = useState({
    name: '',
    default_guardrail_profile: 'balanced',
    default_max_questions: 10,
  });

  const [notificationForm, setNotificationForm] = useState({
    notification_email: '',
    email_on_completion: true,
    email_on_error: true,
    weekly_summary: true,
  });

  useEffect(() => {
    async function fetchSettings() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userData) {
        setProfile(userData);
        setProfileForm({
          full_name: userData.full_name || '',
          email: user.email || '',
        });

        // Fetch organization
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single();

        if (orgData) {
          setOrganization(orgData);
          setOrgForm({
            name: orgData.name || '',
            default_guardrail_profile: orgData.settings?.default_guardrail_profile || 'balanced',
            default_max_questions: orgData.settings?.default_max_questions || 10,
          });
          setNotificationForm({
            notification_email: orgData.settings?.notification_email || user.email || '',
            email_on_completion: true,
            email_on_error: true,
            weekly_summary: true,
          });
        }
      }

      setIsLoading(false);
    }

    fetchSettings();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileForm.full_name,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });

      setProfile({ ...profile, full_name: profileForm.full_name });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({
          name: orgForm.name,
          settings: {
            ...organization.settings,
            default_guardrail_profile: orgForm.default_guardrail_profile,
            default_max_questions: orgForm.default_max_questions,
          },
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Organization updated',
        description: 'Organization settings have been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update organization settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!organization) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            ...organization.settings,
            notification_email: notificationForm.notification_email,
          },
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Notifications updated',
        description: 'Notification settings have been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update notification settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {(['profile', 'organization', 'notifications'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-1 py-4 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={profile?.role || 'member'} disabled />
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Tab */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Manage your organization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Organization Name</Label>
                <Input
                  id="org_name"
                  value={orgForm.name}
                  onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Study Settings</CardTitle>
              <CardDescription>
                These defaults will be applied to new studies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guardrail_profile">Default Guardrail Profile</Label>
                <select
                  id="guardrail_profile"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={orgForm.default_guardrail_profile}
                  onChange={(e) =>
                    setOrgForm({
                      ...orgForm,
                      default_guardrail_profile: e.target.value,
                    })
                  }
                >
                  <option value="strict">Strict</option>
                  <option value="balanced">Balanced</option>
                  <option value="open">Open</option>
                  <option value="empathetic">Empathetic</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_questions">Default Max Questions</Label>
                <Input
                  id="max_questions"
                  type="number"
                  min={1}
                  max={50}
                  value={orgForm.default_max_questions}
                  onChange={(e) =>
                    setOrgForm({
                      ...orgForm,
                      default_max_questions: parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveOrganization} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Manage how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="notification_email">Notification Email</Label>
              <Input
                id="notification_email"
                type="email"
                value={notificationForm.notification_email}
                onChange={(e) =>
                  setNotificationForm({
                    ...notificationForm,
                    notification_email: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Email Notifications</h3>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationForm.email_on_completion}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      email_on_completion: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Interview Completion</span>
                  <p className="text-sm text-muted-foreground">
                    Receive emails when interviews are completed
                  </p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationForm.email_on_error}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      email_on_error: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Error Alerts</span>
                  <p className="text-sm text-muted-foreground">
                    Get notified when errors occur
                  </p>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={notificationForm.weekly_summary}
                  onChange={(e) =>
                    setNotificationForm({
                      ...notificationForm,
                      weekly_summary: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <div>
                  <span className="font-medium">Weekly Summary</span>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of all study activity
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveNotifications} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
