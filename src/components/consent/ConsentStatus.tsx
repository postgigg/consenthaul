import type { ConsentStatus as ConsentStatusType } from '@/types/database';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<
  ConsentStatusType,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'gold' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  sent: { label: 'Sent', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'gold' },
  opened: { label: 'Opened', variant: 'gold' },
  signed: { label: 'Signed', variant: 'success' },
  expired: { label: 'Expired', variant: 'secondary' },
  revoked: { label: 'Revoked', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
};

interface ConsentStatusProps {
  status: ConsentStatusType;
  className?: string;
}

export function ConsentStatusBadge({ status, className }: ConsentStatusProps) {
  const config = statusConfig[status] ?? { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
