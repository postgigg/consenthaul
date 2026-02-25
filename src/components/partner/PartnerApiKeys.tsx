'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

interface ApiKeyInfo {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface PartnerApiKeysProps {
  apiKeys: ApiKeyInfo[];
}

export function PartnerApiKeys({ apiKeys }: PartnerApiKeysProps) {
  if (apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-[#8b919a]">
            No API keys found. Go to Settings to generate your first key.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-[#f8f8f6] px-2 py-1 text-[#6b6f76]">
                    {key.key_prefix}...
                  </code>
                </TableCell>
                <TableCell className="text-[#8b919a] whitespace-nowrap">
                  {formatDate(key.created_at)}
                </TableCell>
                <TableCell className="text-[#8b919a] whitespace-nowrap">
                  {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                </TableCell>
                <TableCell>
                  <Badge variant={key.is_active ? 'success' : 'destructive'}>
                    {key.is_active ? 'Active' : 'Revoked'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
