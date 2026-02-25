// ---------------------------------------------------------------------------
// FMCSA SAFER Web Services API client
// ---------------------------------------------------------------------------

const FMCSA_API_BASE = 'https://mobile.fmcsa.dot.gov/qc/services/carriers';

interface FMCSACarrier {
  company_name: string;
  dot_number: string;
  mc_number: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  fleet_size: number | null;
  driver_count: number | null;
  carrier_operation: string | null;
  operating_status: string | null;
}

function getWebKey(): string {
  const key = process.env.FMCSA_API_KEY;
  if (!key) throw new Error('FMCSA_API_KEY is not set');
  return key;
}

export async function lookupByDOT(dotNumber: string): Promise<FMCSACarrier | null> {
  try {
    const res = await fetch(
      `${FMCSA_API_BASE}/${dotNumber}?webKey=${getWebKey()}`,
      { headers: { Accept: 'application/json' } },
    );

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`FMCSA API ${res.status}`);
    }

    const data = await res.json();
    const c = data?.content?.carrier;
    if (!c) return null;

    return {
      company_name: c.legalName || c.dbaName || '',
      dot_number: String(c.dotNumber),
      mc_number: c.mcNumber ? `MC-${c.mcNumber}` : null,
      phone: c.phyPhone || null,
      email: c.email || null,
      address_line1: c.phyStreet || null,
      city: c.phyCity || null,
      state: c.phyState || null,
      zip: c.phyZipcode || null,
      fleet_size: c.totalPowerUnits ? parseInt(c.totalPowerUnits, 10) : null,
      driver_count: c.totalDrivers ? parseInt(c.totalDrivers, 10) : null,
      carrier_operation: c.carrierOperation?.carrierOperationDesc || null,
      operating_status: c.allowedToOperate === 'Y' ? 'AUTHORIZED' : 'NOT AUTHORIZED',
    };
  } catch (err) {
    console.error('[FMCSA lookup]', err);
    return null;
  }
}
