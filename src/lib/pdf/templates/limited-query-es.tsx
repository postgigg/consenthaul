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
import { CONSENT_TEXT_ES } from '@/lib/constants';

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
    width: 150,
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

export interface LimitedQueryEsProps {
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

export function LimitedQueryEs({
  consent,
  driver,
  organization,
  signatureDataUrl,
  qrCodeDataUrl,
  generatedAt,
}: LimitedQueryEsProps) {
  const frequency = consent.query_frequency ?? 'anual';
  const endDateDisplay =
    consent.consent_end_date ?? 'Duración del Empleo';

  const consentBody = CONSENT_TEXT_ES.body(
    driver.name,
    organization.name,
    consent.consent_start_date,
    consent.consent_end_date ?? '',
    frequency,
  );

  const signedDate = consent.signed_at
    ? new Date(consent.signed_at).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    : 'N/D';

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
              Consentimiento General para Consultas Limitadas
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
          <Text style={styles.sectionTitle}>
            Empleador / Organización
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              Nombre de la Organización:
            </Text>
            <Text style={styles.infoValue}>{organization.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número USDOT:</Text>
            <Text style={styles.infoValue}>
              {organization.dot_number ?? 'N/D'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dirección:</Text>
            <Text style={styles.infoValue}>
              {organization.address ?? 'N/D'}
            </Text>
          </View>
        </View>

        {/* Driver info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Información del Conductor
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre del Conductor:</Text>
            <Text style={styles.infoValue}>{driver.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Número de CDL:</Text>
            <Text style={styles.infoValue}>
              {driver.cdl_number ?? 'N/D'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado de CDL:</Text>
            <Text style={styles.infoValue}>
              {driver.cdl_state ?? 'N/D'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Nacimiento:</Text>
            <Text style={styles.infoValue}>
              {driver.date_of_birth ?? 'N/D'}
            </Text>
          </View>
        </View>

        {/* Consent period */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Período de Consentimiento
          </Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Inicio:</Text>
            <Text style={styles.infoValue}>
              {consent.consent_start_date}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Fin:</Text>
            <Text style={styles.infoValue}>{endDateDisplay}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frecuencia de Consulta:</Text>
            <Text style={styles.infoValue}>
              {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
            </Text>
          </View>
        </View>

        {/* Consent body text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consentimiento</Text>
          <Text style={styles.bodyText}>{consentBody}</Text>
        </View>

        {/* Acknowledgment */}
        <View style={styles.acknowledgmentBox}>
          <Text style={styles.acknowledgmentText}>
            {CONSENT_TEXT_ES.acknowledgment}
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Text style={styles.sectionTitle}>Firma</Text>

          {signatureDataUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image does not support alt
            <Image src={signatureDataUrl} style={styles.signatureImage} />
          ) : (
            <View style={{ height: 60 }} />
          )}

          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>
            {driver.name} — Firma Electrónica
          </Text>

          <View style={styles.signatureMetaRow}>
            <View style={styles.signatureMetaBlock}>
              <Text style={styles.infoLabel}>Fecha de Firma:</Text>
              <Text style={styles.infoValue}>{signedDate}</Text>
            </View>
            <View style={styles.signatureMetaBlock}>
              <Text style={styles.infoLabel}>Dirección IP:</Text>
              <Text style={styles.infoValue}>
                {consent.signer_ip ?? 'N/D'}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            ID del Documento: {consent.id}
          </Text>
          <Text style={styles.footerText}>
            Generado: {generatedAt}
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

export default LimitedQueryEs;
