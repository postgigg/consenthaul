'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DriverForm } from '@/components/driver/DriverForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Pencil, FileSignature, UserX } from 'lucide-react';
import type { Database } from '@/types/database';

type DriverRow = Database['public']['Tables']['drivers']['Row'];

interface DriverDetailActionsProps {
  driver: DriverRow;
}

export function DriverDetailActions({ driver }: DriverDetailActionsProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  async function handleDeactivate() {
    if (
      !confirm(
        `Are you sure you want to deactivate ${driver.first_name} ${driver.last_name}? This will prevent new consent requests from being sent to this driver.`,
      )
    ) {
      return;
    }

    setDeactivating(true);
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button asChild>
          <Link href={`/consents/new?driver=${driver.id}`}>
            <FileSignature className="h-4 w-4" />
            Send Consent
          </Link>
        </Button>
        {driver.is_active && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleDeactivate}
            disabled={deactivating}
          >
            <UserX className="h-4 w-4" />
            {deactivating ? 'Deactivating...' : 'Deactivate'}
          </Button>
        )}
      </div>

      {/* Edit driver dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update the driver information below.
            </DialogDescription>
          </DialogHeader>
          <DriverForm
            mode="edit"
            initialData={driver}
            onSuccess={() => {
              setEditDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
