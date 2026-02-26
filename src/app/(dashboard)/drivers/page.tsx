'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DriverTable } from '@/components/driver/DriverTable';
import { DriverForm } from '@/components/driver/DriverForm';
import { MigrationDialog } from '@/components/driver/MigrationDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Upload, Database } from 'lucide-react';

interface MigrationStatus {
  active_transfer: {
    id: string;
    token: string;
    label: string;
    uploaded_files: unknown[];
    total_bytes: number;
    carrier_count: number | null;
    driver_count: number | null;
    parsed_at: string | null;
    expires_at: string;
    created_at: string;
  } | null;
  is_partner: boolean;
}

export default function DriversPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null);

  const fetchMigrationStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/migration/status');
      if (res.ok) {
        const json = await res.json();
        setMigrationStatus(json.data ?? null);
      }
    } catch {
      // silently fail — non-critical
    }
  }, []);

  useEffect(() => {
    fetchMigrationStatus();
  }, [fetchMigrationStatus]);

  // Auto-open migration dialog on successful payment redirect
  useEffect(() => {
    if (searchParams.get('migration') === 'success') {
      // Small delay to let the webhook process
      const timer = setTimeout(() => {
        fetchMigrationStatus().then(() => setMigrateOpen(true));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, fetchMigrationStatus]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">Drivers</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage your driver roster and send consent requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setMigrateOpen(true)}>
            <Database className="h-4 w-4" />
            Migrate Fleet
          </Button>
          <Button variant="outline" asChild>
            <Link href="/drivers/import">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* Driver table */}
      <DriverTable
        onView={(driverId) => router.push(`/drivers/${driverId}`)}
        onEdit={(driverId) => router.push(`/drivers/${driverId}`)}
        onSendConsent={() => router.push('/consents/new')}
      />

      {/* Add driver dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Driver</DialogTitle>
            <DialogDescription>
              Enter the driver details below. Either phone or email is required.
            </DialogDescription>
          </DialogHeader>
          <DriverForm
            mode="create"
            onSuccess={() => {
              setAddDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Migration dialog */}
      <MigrationDialog
        open={migrateOpen}
        onOpenChange={setMigrateOpen}
        activeTransfer={migrationStatus?.active_transfer ?? null}
        isPartner={migrationStatus?.is_partner ?? false}
        onTransferCreated={() => {
          fetchMigrationStatus();
        }}
      />
    </div>
  );
}
