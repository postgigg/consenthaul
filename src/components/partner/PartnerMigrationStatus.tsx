'use client';

import { Card, CardContent } from '@/components/ui/card';
import { FileText, HardDrive, Truck, Users } from 'lucide-react';

interface PartnerMigrationStatusProps {
  totalBytes: number;
  carrierCount: number | null;
  driverCount: number | null;
  uploadedFiles: Array<{ name: string; size_bytes: number }>;
  parsedAt: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function PartnerMigrationStatus({
  totalBytes,
  carrierCount,
  driverCount,
  uploadedFiles,
  parsedAt,
}: PartnerMigrationStatusProps) {
  const files = Array.isArray(uploadedFiles) ? uploadedFiles : [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-blue-50">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                {files.length}
              </p>
              <p className="text-xs text-[#8b919a]">Files Uploaded</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-purple-50">
              <HardDrive className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                {formatBytes(totalBytes)}
              </p>
              <p className="text-xs text-[#8b919a]">Total Size</p>
            </div>
          </div>

          {carrierCount !== null && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-amber-50">
                <Truck className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                  {carrierCount.toLocaleString()}
                </p>
                <p className="text-xs text-[#8b919a]">Carriers</p>
              </div>
            </div>
          )}

          {driverCount !== null && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-green-50">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[#0c0f14] tabular-nums">
                  {driverCount.toLocaleString()}
                </p>
                <p className="text-xs text-[#8b919a]">Drivers</p>
              </div>
            </div>
          )}
        </div>

        {parsedAt && (
          <p className="mt-4 text-xs text-[#8b919a] border-t border-[#e8e8e3] pt-4">
            Data parsed on {new Date(parsedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
