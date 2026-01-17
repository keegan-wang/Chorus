'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Studies', href: '/studies', icon: '📊' },
  { name: 'Participants', href: '/participants', icon: '👥' },
  { name: 'Integrations', href: '/integrations', icon: '🔗' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<{ name: string; userType: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  function handleSignOut() {
    localStorage.removeItem('user');
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 lg:static',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/studies" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Chorus</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t p-4 space-y-2">
          {user && (
            <div className="px-3 py-2 text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs capitalize">{user.userType}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <button
        className="fixed bottom-4 left-4 z-50 rounded-full bg-primary p-3 text-primary-foreground shadow-lg lg:hidden"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8">{children}</div>
      </main>
    </div>
  );
}
