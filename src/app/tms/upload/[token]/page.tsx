import { createAdminClient } from '@/lib/supabase/admin';
import { LandingNav } from '@/components/landing/LandingNav';
import { MigrationUploadClient } from './MigrationUploadClient';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function MigrationUploadPage({ params }: Props) {
  const { token } = await params;

  const supabase = createAdminClient();

  const { data: transfer, error } = await supabase
    .from('migration_transfers')
    .select('id, token, label, uploaded_files, total_bytes, carrier_count, driver_count, parsed_at, expires_at, application_id')
    .eq('token', token)
    .single();

  if (error || !transfer) {
    return (
      <>
        <LandingNav />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-xl font-bold text-[#0c0f14]">Invalid Upload Link</h1>
          <p className="mt-2 text-sm text-[#8b919a]">
            This upload link is invalid or has been removed.
          </p>
        </div>
      </>
    );
  }

  if (new Date(transfer.expires_at) < new Date()) {
    return (
      <>
        <LandingNav />
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-xl font-bold text-[#0c0f14]">Link Expired</h1>
          <p className="mt-2 text-sm text-[#8b919a]">
            This upload link expired on {new Date(transfer.expires_at).toLocaleDateString()}.
            Please request a new link from your partner administrator.
          </p>
        </div>
      </>
    );
  }

  // Fetch company name if application_id exists
  let companyName = '';
  if (transfer.application_id) {
    const { data: app } = await supabase
      .from('partner_applications')
      .select('company_name')
      .eq('id', transfer.application_id)
      .single();
    companyName = app?.company_name || '';
  }

  const uploadedFiles = (Array.isArray(transfer.uploaded_files) ? transfer.uploaded_files : []) as Array<{
    path: string;
    name: string;
    size_bytes: number;
    uploaded_at: string;
  }>;

  return (
    <>
      <LandingNav />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <MigrationUploadClient
          token={transfer.token}
          label={transfer.label || 'Migration Upload'}
          companyName={companyName}
          initialFiles={uploadedFiles}
          initialTotalBytes={transfer.total_bytes}
          initialCarrierCount={transfer.carrier_count}
          initialDriverCount={transfer.driver_count}
          expiresAt={transfer.expires_at}
        />
      </div>
    </>
  );
}
