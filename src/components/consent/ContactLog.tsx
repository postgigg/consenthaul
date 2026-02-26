import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Database } from '@/types/database';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

const typeLabels: Record<string, string> = {
  consent_link: 'Initial Send',
  reminder: 'Reminder',
  expiry_warning: 'Expiry Warning',
};

const channelLabels: Record<string, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  email: 'Email',
  manual: 'Manual',
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>;
    case 'failed':
    case 'undeliverable':
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="secondary">Sent</Badge>;
  }
}

export function ContactLog({ notifications }: { notifications: NotificationRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact Log</CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-[#8b919a]">No contact history.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="border-b border-[#fafaf8] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {typeLabels[n.type] ?? n.type}
                  </Badge>
                  <StatusBadge status={n.status} />
                  <span className="text-xs text-[#8b919a]">
                    {channelLabels[n.channel] ?? n.channel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#0c0f14] font-mono">
                  {n.recipient}
                </p>
                <p className="text-xs text-[#8b919a]">
                  {formatDate(n.sent_at ?? n.created_at, {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
