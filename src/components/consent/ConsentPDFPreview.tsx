'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileDown, AlertCircle, Loader2 } from 'lucide-react';

interface ConsentPDFPreviewProps {
  consentId: string;
}

export function ConsentPDFPreview({ consentId }: ConsentPDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPdfUrl() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/consents/${consentId}/pdf`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? 'Failed to load PDF.');
          return;
        }

        const data = await res.json();
        setPdfUrl(data.url ?? null);
      } catch {
        setError('An unexpected error occurred while loading the PDF.');
      } finally {
        setLoading(false);
      }
    }

    fetchPdfUrl();
  }, [consentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
          <span className="ml-2 text-sm text-[#8b919a]">Loading PDF preview...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !pdfUrl) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-8 w-8 text-[#b5b5ae] mb-3" />
          <p className="text-sm text-[#8b919a] mb-4">
            {error ?? 'PDF is not available for this consent.'}
          </p>
          {pdfUrl && (
            <Button variant="outline" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
                <FileDown className="h-4 w-4" />
                Download PDF
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">Consent PDF</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer" download>
            <FileDown className="h-4 w-4" />
            Download
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden border border-[#e8e8e3] bg-[#fafaf8]">
          <iframe
            src={pdfUrl}
            title="Consent PDF Preview"
            className="h-[600px] w-full"
            style={{ border: 'none' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
