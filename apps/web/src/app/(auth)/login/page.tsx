'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'individual' | 'company'>('individual');

  const redirectTo = searchParams.get('redirect') || '/studies';

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Store user info in localStorage for demo purposes
    localStorage.setItem('user', JSON.stringify({ name, userType }));

    router.push(redirectTo);
  }

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
          Enter your name to get started
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
                <span>Individual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="userType"
                  checked={userType === 'company'}
                  onChange={() => setUserType('company')}
                  className="w-4 h-4 text-primary"
                />
                <span>Company</span>
              </label>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </CardFooter>
      </form>
      </Card>
    </div>
  );
}
