import { MessageCircleHeart } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <MessageCircleHeart className="h-8 w-8 text-primary" />
      <h1 className="text-2xl font-bold text-primary">EmpathyAI</h1>
    </Link>
  );
}
