import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { CONSENT_TEXT_EN } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  border: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderStyle: 'solid',
  },

  // Header
  header: {
    textAlign: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#3f3f46',
  },

  // Section
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    borderBottomStyle: 'solid',
  },

  // Info grid
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    width: 130,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#52525b',
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: '#18181b',
  },

  // Body text
  bodyText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: '#27272a',
    textAlign: 'justify',
  },

  // Acknowledgment
  acknowledgmentBox: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'solid',
    marginTop: 12,
    marginBottom: 14,
  },
  acknowledgmentText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#1e3a5f',
    fontFamily: 'Helvetica-Oblique',
  },

  // Signature
  signatureSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#d4d4d8',
    borderTopStyle: 'solid',
  },
  signatureImage: {
    width: 200,
    height: 60,
    objectFit: 'contain',
    marginBottom: 4,
  },
  signatureLine: {
    width: 220,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
    borderBottomStyle: 'solid',
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#71717a',
  },
  signatureMetaRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 24,
  },
  signatureMetaBlock: {
    flex: 1,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#a1a1aa',
  },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LimitedQueryEnProps {
  consent: {
    id: string;
    consent_type: string;
    consent_start_date: string;
    consent_end_date: string | null;
    query_frequency: string | null;
    signed_at: string | null;
    signer_ip: string | null;
  };
  driver: {
    name: string;
    cdl_number: string | null;
    cdl_state: string | null;
    date_of_birth: string | null;
  };
  organization: {
    name: string;
    dot_number: string | null;
    address: string | null;
  };
  signatureDataUrl: string | null;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LimitedQueryEn({
  consent,
  driver,
  organization,
  signatureDataUrl,
  generatedAt,
}: LimitedQueryEnProps) {
  const frequency = consent.query_frequency ?? 'annual';
  const endDateDisplay = consent.consent_end_date ?? 'Duration of Employment';

  const consentBody = CONSENT_TEXT_EN.body(
    driver.name,
    organization.name,
    consent.consent_start_date,
    consent.consent_end_date ?? '',
    frequency,
  );

  const signedDate = consent.signed_at
    ? new Date(consent.signed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'N/A';

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Page border */}
        <View style={styles.border} fixed />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            FMCSA Drug &amp; Alcohol Clearinghouse
          </Text>
          <Text style={styles.headerSubtitle}>
            General Consent for Limited Queries
          </Text>
        </View>

        {/* Organization info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employer / Organization</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organization Name:</Text>
            <Text style={styles.infoValue}>{organization.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>USDOT Number:</Text>
            <Text style={styles.infoValue}>
              {organization.dot_number ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address:</Text>
            <Text style={styles.infoValue}>
              {organization.address ?? 'N/A'}
            </Text>
          </View>
        </View>

        {/* Driver info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver Name:</Text>
            <Text style={styles.infoValue}>{driver.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CDL Number:</Text>
            <Text style={styles.infoValue}>
              {driver.cdl_number ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>CDL State:</Text>
            <Text style={styles.infoValue}>
              {driver.cdl_state ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth:</Text>
            <Text style={styles.infoValue}>
              {driver.date_of_birth ?? 'N/A'}
            </Text>
          </View>
        </View>

        {/* Consent period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consent Period</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date:</Text>
            <Text style={styles.infoValue}>
              {consent.consent_start_date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date:</Text>
            <Text style={styles.infoValue}>{endDateDisplay}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Query Frequency:</Text>
            <Text style={styles.infoValue}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </Text>
          </View>
        </View>

        {/* Consent body text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consent</Text>
          <Text style={styles.bodyText}>{consentBody}</Text>
        </View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgmentBox}>
          <Text style={styles.acknowledgmentText}>
            {CONSENT_TEXT_EN.acknowledgment}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Signature</Text>

          {signatureDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt
            <Image src={signatureDataUrl} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60 }} />
          )}

          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            {driver.name} — Electronic Signature
          </Text>

          <View style={styles.signatureMetaRow}>
            <View style={styles.signatureMetaBlock}>
              <Text style={styles.infoLabel}>Date Signed:</Text>
              <Text style={styles.infoValue}>{signedDate}</Text>
            </View>
            <View style={styles.signatureMetaBlock}>
              <Text style={styles.infoLabel}>IP Address:</Text>
              <Text style={styles.infoValue}>
                {consent.signer_ip ?? 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Document ID: {consent.id}
          </Text>
          <Text style={styles.footerText}>
            Generated: {generatedAt}
          </Text>
          <Text style={styles.footerText}>
            ConsentHaul — consenthaul.com
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default LimitedQueryEn;
