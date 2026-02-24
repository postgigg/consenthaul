'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DriverTable } from '@/components/driver/DriverTable';
import { DriverForm } from '@/components/driver/DriverForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Upload } from 'lucide-react';

export default function DriversPage() {
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
    </div>
  );
}
