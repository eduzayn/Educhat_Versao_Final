import { Button } from '@/shared/ui/button';
import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'wouter';

export function TeamTransferButton() {
  return (
    <Link href="/teams/transfer">
      <Button variant="outline" className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Transferir Conversas
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  );
}