// ---------------------------------------------------------------------------
// Starter email templates with {{variable}} placeholders
// ---------------------------------------------------------------------------

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_text: string;
  body_html: string;
  step_type: 'initial' | 'followup' | 'final';
}

export const STARTER_TEMPLATES: EmailTemplate[] = [
  {
    id: 'initial-outreach',
    name: 'Initial Outreach',
    step_type: 'initial',
    subject: '{{company_name}} — quick question about your Clearinghouse consent process',
    body_text: `Hi {{contact_name}},

Quick question — how are you currently handling FMCSA Clearinghouse consent forms for your {{fleet_size}} drivers?

If you're still using paper forms, we built ConsentHaul specifically for carriers your size. Your drivers sign electronically on their phone (takes 30 seconds), and you get compliant records stored for the required 3 years.

Most carriers with {{fleet_size}} trucks save a few hours per month on the paperwork alone.

Worth a quick look? You can try it free at consenthaul.com.

Best,
ConsentHaul Team`,
    body_html: `<p>Hi {{contact_name}},</p>
<p>Quick question — how are you currently handling FMCSA Clearinghouse consent forms for your {{fleet_size}} drivers?</p>
<p>If you're still using paper forms, we built ConsentHaul specifically for carriers your size. Your drivers sign electronically on their phone (takes 30 seconds), and you get compliant records stored for the required 3 years.</p>
<p>Most carriers with {{fleet_size}} trucks save a few hours per month on the paperwork alone.</p>
<p>Worth a quick look? You can try it free at <a href="https://consenthaul.com">consenthaul.com</a>.</p>
<p>Best,<br>ConsentHaul Team</p>`,
  },
  {
    id: 'followup-1',
    name: 'Follow-up (3 days)',
    step_type: 'followup',
    subject: 'Re: {{company_name}} Clearinghouse consent',
    body_text: `Hey {{contact_name}},

Following up on my note from last week. With annual query season coming up, now's a good time to get your consent process streamlined.

A carrier with {{fleet_size}} drivers doing paper consent forms is looking at several hours of admin work each year just for annual queries. ConsentHaul cuts that to minutes — send all your consent requests in one batch, drivers sign on their phones, done.

$2.50 per consent, no monthly fee. Happy to walk you through it if you've got 10 minutes.

— ConsentHaul Team`,
    body_html: `<p>Hey {{contact_name}},</p>
<p>Following up on my note from last week. With annual query season coming up, now's a good time to get your consent process streamlined.</p>
<p>A carrier with {{fleet_size}} drivers doing paper consent forms is looking at several hours of admin work each year just for annual queries. ConsentHaul cuts that to minutes — send all your consent requests in one batch, drivers sign on their phones, done.</p>
<p>$2.50 per consent, no monthly fee. Happy to walk you through it if you've got 10 minutes.</p>
<p>— ConsentHaul Team</p>`,
  },
  {
    id: 'final-touch',
    name: 'Final Touch (7 days)',
    step_type: 'final',
    subject: 'Last note — Clearinghouse consent for {{company_name}}',
    body_text: `{{contact_name}},

Last note on this — didn't want to keep bugging you.

If you're all set with your Clearinghouse consent process, no worries at all. But if paper forms are still a headache (especially with {{fleet_size}} drivers), we're here when you need us.

consenthaul.com — free to try, pay per consent.

All the best,
ConsentHaul Team`,
    body_html: `<p>{{contact_name}},</p>
<p>Last note on this — didn't want to keep bugging you.</p>
<p>If you're all set with your Clearinghouse consent process, no worries at all. But if paper forms are still a headache (especially with {{fleet_size}} drivers), we're here when you need us.</p>
<p><a href="https://consenthaul.com">consenthaul.com</a> — free to try, pay per consent.</p>
<p>All the best,<br>ConsentHaul Team</p>`,
  },
];
