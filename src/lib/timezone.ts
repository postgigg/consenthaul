/**
 * E4: Timezone support utilities.
 *
 * Consents are stored in UTC (TIMESTAMPTZ). These helpers format timestamps
 * in the organization's or driver's local timezone for display/export.
 */

/**
 * Format a UTC ISO timestamp in the given IANA timezone.
 *
 * @param isoTimestamp  ISO-8601 string (e.g. from Postgres TIMESTAMPTZ)
 * @param timezone      IANA timezone name (e.g. "America/Chicago")
 * @param options       Intl.DateTimeFormat options override
 */
export function formatInTimezone(
  isoTimestamp: string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(isoTimestamp);
  const defaults: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: timezone,
  };
  return new Intl.DateTimeFormat('en-US', { ...defaults, ...options }).format(date);
}

/**
 * Format a date-only string (YYYY-MM-DD) in the given timezone.
 */
export function formatDateInTimezone(
  dateStr: string,
  timezone: string,
): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone,
  }).format(date);
}

/**
 * Get the current date as YYYY-MM-DD in the given timezone.
 */
export function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === 'year')?.value ?? '2024';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

/**
 * Check if a given timestamp is within business hours (8am-8pm) in the timezone.
 */
export function isBusinessHours(timezone: string): boolean {
  const hour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    }).format(new Date()),
    10,
  );
  return hour >= 8 && hour < 20;
}
