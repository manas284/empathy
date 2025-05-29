import type { ReactNode } from 'react';
import { Header } from '@/components/Header';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-20 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground">
            EmpathyAI &copy; {new Date().getFullYear()}. Your mental wellbeing partner.
          </p>
        </div>
      </footer>
    </div>
  );
}
