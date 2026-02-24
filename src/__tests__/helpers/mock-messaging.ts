import { vi } from 'vitest';

export function setupMessagingMocks() {
  const sendSMS = vi.fn().mockResolvedValue({ sid: 'SM_test_sid', status: 'queued' });
  const sendWhatsApp = vi.fn().mockResolvedValue({ sid: 'WA_test_sid', status: 'queued' });
  const sendEmail = vi.fn().mockResolvedValue({ messageId: 'msg_test_id' });

  vi.mock('@/lib/messaging/sms', () => ({ sendConsentSMS: sendSMS }));
  vi.mock('@/lib/messaging/whatsapp', () => ({ sendConsentWhatsApp: sendWhatsApp }));
  vi.mock('@/lib/messaging/email', () => ({ sendConsentEmail: sendEmail }));

  return { sendSMS, sendWhatsApp, sendEmail };
}
