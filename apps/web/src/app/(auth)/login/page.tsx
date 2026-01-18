'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getLoginData } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<'individual' | 'company'>('individual');

  // Data State
  const [participants, setParticipants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection State
  const [selectedId, setSelectedId] = useState('');

  const redirectTo = searchParams.get('redirect') || (userType === 'individual' ? '/my-interviews' : '/studies');

  useEffect(() => {
    async function loadData() {
      console.log('[Client] Loading login data...');
      try {
        const data = await getLoginData();
        console.log('[Client] Received data:', {
          success: data.success,
          participantsCount: data.participants?.length || 0,
          usersCount: data.users?.length || 0,
          error: 'error' in data ? data.error : undefined
        });

        if (data.success) {
          setParticipants(data.participants);
          setUsers(data.users);

          // Default selection if available
          if (userType === 'individual' && data.participants.length > 0) {
            setSelectedId(data.participants[0].id);
          } else if (userType === 'company' && data.users.length > 0) {
            setSelectedId(data.users[0].id);
          }
        } else {
          console.error('[Client] Failed to load data:', 'error' in data ? data.error : 'Unknown error');
        }
      } catch (e) {
        console.error("[Client] Failed to load login data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Reset selection when toggling type
  useEffect(() => {
    if (loading) return;

    if (userType === 'individual') {
      if (participants.length > 0) setSelectedId(participants[0].id);
      else setSelectedId('');
    } else {
      if (users.length > 0) setSelectedId(users[0].id);
      else setSelectedId('');
    }
  }, [userType, loading, participants, users]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    let selectedUser;
    if (userType === 'individual') {
      selectedUser = participants.find(p => p.id === selectedId);
    } else {
      selectedUser = users.find(u => u.id === selectedId);
    }

    if (selectedUser) {
      // Store user info in localStorage for demo purposes
      // Augmented with real DB ID
      localStorage.setItem('user', JSON.stringify({
        id: selectedUser.id,
        name: selectedUser.full_name,
        email: selectedUser.email,
        organizationId: selectedUser.organization_id,
        userType
      }));

      router.push(redirectTo);
    }
  }

  const currentList = userType === 'individual' ? participants : users;

  return (
    <div className="w-full max-w-md">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <span>&larr;</span> Back to home
      </Link>
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome to Chorus</CardTitle>
          <CardDescription>
            {loading ? 'Loading users...' : 'Select a user to simulate login'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>I am a...</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'individual'}
                    onChange={() => setUserType('individual')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Individual (Participant)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    checked={userType === 'company'}
                    onChange={() => setUserType('company')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Company (User)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-select">Select User</Label>
              <select
                id="user-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                disabled={loading || currentList.length === 0}
              >
                {currentList.length === 0 && <option>No users found</option>}
                {currentList.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} ({user.email})
                  </option>
                ))}
              </select>
              {currentList.length === 0 && !loading && (
                <p className="text-xs text-red-500">
                  No records found. Did you run seed scripts?
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading || !selectedId}>
              Login as {userType === 'individual' ? 'Participant' : 'User'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
