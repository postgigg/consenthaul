import Link from 'next/link';
import { DriverImport } from '@/components/driver/DriverImport';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Import Drivers | ConsentHaul',
};

export default function DriverImportPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/drivers"
          className="inline-flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#3a3f49] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Drivers
        </Link>
        <h1 className="text-2xl font-bold text-[#0c0f14]">Import Drivers</h1>
        <p className="mt-1 text-sm text-[#8b919a]">
          Bulk-import your driver roster from a CSV file. The import will create new
          driver records and skip any duplicates based on matching CDL number, phone, or
          email.
        </p>
      </div>

      {/* Instructions */}
      <div className="border border-[#e8e8e3] bg-[#fafaf8] px-4 py-3">
        <h2 className="text-sm font-medium text-[#0c0f14]">CSV Format Requirements</h2>
        <ul className="mt-2 space-y-1 text-xs text-[#3a3f49] list-disc list-inside">
          <li>
            Required columns: <code className="bg-[#f0f0ec] px-1 rounded">first_name</code>,{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">last_name</code>, and either{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">phone</code> or{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">email</code>
          </li>
          <li>
            Optional columns:{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">cdl_number</code>,{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">cdl_state</code>,{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">date_of_birth</code>,{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">hire_date</code>,{' '}
            <code className="bg-[#f0f0ec] px-1 rounded">preferred_language</code> (en/es)
          </li>
          <li>
            Dates should be in <code className="bg-[#f0f0ec] px-1 rounded">YYYY-MM-DD</code> format
          </li>
          <li>
            Phone numbers should include country code (e.g., +10000000000)
          </li>
          <li>Maximum 50 drivers per import. For larger imports, use the Migrate Fleet feature.</li>
        </ul>
      </div>

      {/* Import component */}
      <div className="max-w-2xl">
        <DriverImport />
      </div>
    </div>
  );
}
