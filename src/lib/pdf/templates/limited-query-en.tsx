import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Svg,
  Rect,
  Path,
  Circle,
} from '@react-pdf/renderer';
import { CONSENT_TEXT_EN } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Brand colors
// ---------------------------------------------------------------------------

const brand = {
  dark: '#0c0f14',
  gold: '#C8A75E',
  white: '#ffffff',
  gray: '#3f3f46',
  lightGray: '#e4e4e7',
  midGray: '#52525b',
  textDark: '#18181b',
  textBody: '#27272a',
  footerGray: '#a1a1aa',
  signatureGray: '#71717a',
  borderGray: '#d4d4d8',
  accentBg: '#fdf9f0',
  accentBorder: '#e8dcc4',
  accentText: '#5c4a1e',
};

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
    borderColor: brand.borderGray,
    borderStyle: 'solid',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: brand.dark,
    borderBottomStyle: 'solid',
  },
  headerLogo: {
    width: 64,
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
  },
  qrCode: {
    width: 64,
    height: 64,
  },
  qrPlaceholder: {
    width: 64,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: brand.dark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: brand.gray,
  },

  // Section
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: brand.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: brand.lightGray,
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
    color: brand.midGray,
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: brand.textDark,
  },

  // Body text
  bodyText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: brand.textBody,
    textAlign: 'justify',
  },

  // Acknowledgment
  acknowledgmentBox: {
    backgroundColor: brand.accentBg,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: brand.accentBorder,
    borderStyle: 'solid',
    marginTop: 12,
    marginBottom: 14,
  },
  acknowledgmentText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: brand.accentText,
    fontFamily: 'Helvetica-Oblique',
  },

  // Signature
  signatureSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: brand.borderGray,
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
    borderBottomColor: brand.textDark,
    borderBottomStyle: 'solid',
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 8,
    color: brand.signatureGray,
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
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: brand.lightGray,
    borderTopStyle: 'solid',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: brand.footerGray,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Gold accent bar
  goldBar: {
    height: 3,
    backgroundColor: brand.gold,
    marginBottom: 16,
  },
});

// ---------------------------------------------------------------------------
// Logo SVG component for PDF
// ---------------------------------------------------------------------------

function ConsentHaulLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x="3" y="3" width="42" height="42" rx="9" fill={brand.dark} stroke={brand.dark} strokeWidth={2} />
      <Path d="M32 11 L37 11 L37 16" stroke={brand.white} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.5 26.2 L20.8 31.0 L32.8 18.8" stroke={brand.white} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="35.5" cy="35.5" r="2.6" fill={brand.gold} />
    </Svg>
  );
}

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
  qrCodeDataUrl?: string | null;
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
  qrCodeDataUrl,
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

        {/* Gold accent bar */}
        <View style={styles.goldBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <ConsentHaulLogo size={28} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              FMCSA Drug &amp; Alcohol Clearinghouse
            </Text>
            <Text style={styles.headerSubtitle}>
              General Consent for Limited Queries
            </Text>
          </View>
          {qrCodeDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={qrCodeDataUrl} style={styles.qrCode} />
          ) : (
            <View style={styles.qrPlaceholder} />
          )}
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

        {/* E-Sign Act Disclosure Acknowledgment */}
        <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: brand.lightGray, borderStyle: 'solid', borderRadius: 3 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: brand.midGray, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            Electronic Transaction Disclosure (E-Sign Act)
          </Text>
          <Text style={{ fontSize: 7.5, lineHeight: 1.5, color: brand.signatureGray }}>
            The signer was presented with and acknowledged the E-Sign Act disclosures
            (15 U.S.C. § 7001) prior to signing, including: the right to paper records,
            the right to withdraw consent to electronic transactions, hardware and software
            requirements, scope of consent, how to update contact information, paper copy
            request process, and consequences of withdrawal.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Document ID: {consent.id}
          </Text>
          <Text style={styles.footerText}>
            Generated: {generatedAt}
          </Text>
          <View style={styles.footerBrand}>
            <ConsentHaulLogo size={10} />
            <Text style={styles.footerText}>
              ConsentHaul — consenthaul.com
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default LimitedQueryEn;
