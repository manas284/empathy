'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, BarChart2, Settings, Bot } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/therapy', label: 'Therapy Session', icon: Bot },
  { href: '/progress', label: 'Progress', icon: BarChart2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              asChild
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Link href={item.href} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
        {/* Mobile Menu Trigger (optional) */}
        {/* <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button> */}
      </div>
    </header>
  );
}
