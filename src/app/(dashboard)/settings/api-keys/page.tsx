'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Key,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
  Shield,
  ShieldOff,
} from 'lucide-react';
import type { Database, UserRole } from '@/types/database';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ApiKeyRow = Database['public']['Tables']['api_keys']['Row'];

const AVAILABLE_SCOPES = [
  { value: 'drivers:read', label: 'Read Drivers' },
  { value: 'drivers:write', label: 'Write Drivers' },
  { value: 'consents:read', label: 'Read Consents' },
  { value: 'consents:write', label: 'Write Consents' },
  { value: 'billing:read', label: 'Read Billing' },
] as const;

export default function ApiKeysPage() {
  const supabase = createClient();
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Newly created key display
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single();
      const profile = profileData as Pick<ProfileRow, 'organization_id' | 'role'> | null;
      if (!profile) return;

      setCurrentRole(profile.role);

      const { data: keysData } = await supabase
        .from('api_keys')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      const keys = (keysData ?? []) as ApiKeyRow[];
      if (keys) setApiKeys(keys);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const isAdmin = currentRole === 'owner' || currentRole === 'admin';

  if (!isAdmin && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">API Keys</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage API keys for programmatic access.
          </p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="mx-auto h-10 w-10 text-[#d4d4cf] mb-3" />
            <p className="text-sm text-[#8b919a]">
              Only administrators and owners can manage API keys.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope],
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) {
      setCreateError('Key name is required.');
      return;
    }
    if (selectedScopes.length === 0) {
      setCreateError('Select at least one scope.');
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Generate the key client-side and send the hash to the server
      // For this implementation, we call a server endpoint
      const res = await fetch('/api/v1/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: keyName.trim(),
          scopes: selectedScopes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error ?? 'Failed to create API key.');
        return;
      }

      // Display the full key once
      setNewKey(data.key);
      fetchApiKeys();
    } catch {
      setCreateError('An unexpected error occurred.');
    } finally {
      setCreating(false);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCreateDialogClose() {
    setCreateOpen(false);
    setNewKey(null);
    setKeyName('');
    setSelectedScopes([]);
    setCreateError(null);
    setCopied(false);
  }

  async function handleToggleActive(keyId: string, isActive: boolean) {
    try {
      await supabase
        .from('api_keys')
        .update({ is_active: !isActive })
        .eq('id', keyId);

      fetchApiKeys();
    } catch {
      // Silently fail
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm('Are you sure you want to permanently delete this API key? This cannot be undone.')) {
      return;
    }

    try {
      await supabase.from('api_keys').delete().eq('id', keyId);
      fetchApiKeys();
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">API Keys</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage API keys for programmatic access to the ConsentHaul API.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Info banner */}
      <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
        <p className="text-sm text-[#0c0f14]">
          API keys provide programmatic access to the ConsentHaul API. Keep your
          keys secure and never share them publicly. Use scopes to limit what
          each key can access.
        </p>
      </div>

      {/* API keys table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="py-16 text-center">
              <Key className="mx-auto h-10 w-10 text-[#d4d4cf] mb-3" />
              <p className="text-sm text-[#8b919a] mb-4">
                No API keys created yet.
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="hidden sm:table-cell">Scopes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Used</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium text-[#0c0f14]">
                      {apiKey.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#8b919a]">
                      {apiKey.key_prefix}...
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apiKey.is_active ? 'success' : 'secondary'}>
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[#8b919a] text-sm">
                      {formatDate(apiKey.last_used_at)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[#8b919a] text-sm">
                      {formatDate(apiKey.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(apiKey.id, apiKey.is_active)
                          }
                          aria-label={
                            apiKey.is_active ? 'Deactivate key' : 'Activate key'
                          }
                        >
                          {apiKey.is_active ? (
                            <ShieldOff className="h-3.5 w-3.5 text-yellow-600" />
                          ) : (
                            <Shield className="h-3.5 w-3.5 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(apiKey.id)}
                          aria-label="Delete key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create API key dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open) handleCreateDialogClose();
          else setCreateOpen(true);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newKey ? 'API Key Created' : 'Create API Key'}
            </DialogTitle>
            <DialogDescription>
              {newKey
                ? 'Copy your API key now. It will not be shown again.'
                : 'Create a new API key for programmatic access.'}
            </DialogDescription>
          </DialogHeader>

          {newKey ? (
            <div className="space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 border border-yellow-200 bg-yellow-50 px-4 py-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Save this key now
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This is the only time your API key will be displayed. Store
                    it securely -- you will not be able to see it again.
                  </p>
                </div>
              </div>

              {/* Key display */}
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={newKey}
                  className="font-mono text-xs bg-[#fafaf8]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyKey}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <DialogFooter>
                <Button onClick={handleCreateDialogClose}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="key-name"
                  className="text-sm font-medium text-[#3a3f49]"
                >
                  Key Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production API, TMS Integration"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>

              {/* Scopes */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">
                  Scopes <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-[#8b919a]">
                  Select what this key can access.
                </p>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <label
                      key={scope.value}
                      className="flex items-center gap-2 text-sm text-[#3a3f49] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.value)}
                        onChange={() => toggleScope(scope.value)}
                        className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                      />
                      {scope.label}
                      <span className="text-xs text-[#b5b5ae] font-mono">
                        ({scope.value})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {createError && (
                <div
                  className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {createError}
                </div>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4" />
                      Create Key
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
