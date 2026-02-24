'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Star,
  FileText,
  Loader2,
} from 'lucide-react';
import type { Database, ConsentType } from '@/types/database';

type TemplateRow = Database['public']['Tables']['consent_templates']['Row'];

const CONSENT_TYPES: { value: ConsentType; label: string }[] = [
  { value: 'limited_query', label: 'Limited Query' },
  { value: 'pre_employment', label: 'Pre-Employment' },
  { value: 'blanket', label: 'Blanket Consent' },
];

export default function TemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateRow | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [consentType, setConsentType] = useState<ConsentType>('limited_query');
  const [bodyText, setBodyText] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('consent_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) setTemplates((data ?? []) as TemplateRow[]);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreateDialog() {
    setEditingTemplate(null);
    setName('');
    setLanguage('en');
    setConsentType('limited_query');
    setBodyText('');
    setIsDefault(false);
    setError(null);
    setDialogOpen(true);
  }

  function openEditDialog(template: TemplateRow) {
    setEditingTemplate(template);
    setName(template.name);
    setLanguage(template.language as 'en' | 'es');
    setConsentType(template.consent_type);
    setBodyText(template.body_text);
    setIsDefault(template.is_default);
    setError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !bodyText.trim()) {
      setError('Name and body text are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingTemplate) {
        // Update
        const { error: updateError } = await supabase
          .from('consent_templates')
          .update({
            name: name.trim(),
            language,
            consent_type: consentType,
            body_text: bodyText.trim(),
            is_default: isDefault,
          })
          .eq('id', editingTemplate.id);

        if (updateError) {
          setError(updateError.message);
          return;
        }
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('consent_templates')
          .insert({
            name: name.trim(),
            language,
            consent_type: consentType,
            body_text: bodyText.trim(),
            is_default: isDefault,
            is_active: true,
            organization_id: '', // RLS will fill this via get_user_org_id()
            created_by: '', // RLS will fill this
          });

        if (insertError) {
          setError(insertError.message);
          return;
        }
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(templateId: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      // Soft-delete by setting is_active to false
      await supabase
        .from('consent_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      fetchTemplates();
    } catch {
      // Silently fail
    }
  }

  const consentTypeLabel: Record<string, string> = {
    limited_query: 'Limited Query',
    pre_employment: 'Pre-Employment',
    blanket: 'Blanket',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0c0f14]">Consent Templates</h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage custom consent form templates for your organization.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Template list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#0c0f14]" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#d4d4cf] mb-3" />
            <p className="text-sm text-[#8b919a] mb-4">
              No custom templates yet. The default FMCSA consent text will be
              used for all consent requests.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.is_default && (
                    <Badge variant="warning" className="shrink-0 ml-2">
                      <Star className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  <span className="inline-flex items-center gap-2">
                    <Badge variant="outline">
                      {consentTypeLabel[template.consent_type] ?? template.consent_type}
                    </Badge>
                    <Badge variant="outline">
                      {template.language === 'es' ? 'Spanish' : 'English'}
                    </Badge>
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <p className="text-xs text-[#8b919a] line-clamp-3">{template.body_text}</p>
                <p className="mt-3 text-xs text-[#b5b5ae]">
                  Created {formatDate(template.created_at)}
                </p>
              </CardContent>
              <div className="border-t border-[#f0f0ec] px-6 py-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? 'Update the template details below.'
                : 'Create a custom consent template for your organization.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="template-name" className="text-sm font-medium text-[#3a3f49]">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="template-name"
                placeholder="e.g., Annual Limited Query - English"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Two-column */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">Consent Type</label>
                <Select
                  value={consentType}
                  onValueChange={(v) => setConsentType(v as ConsentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSENT_TYPES.map((ct) => (
                      <SelectItem key={ct.value} value={ct.value}>
                        {ct.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">Language</label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v as 'en' | 'es')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#3a3f49]">Default</label>
                <label className="flex items-center gap-2 text-sm text-[#6b6f76] mt-2">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d4d4cf] text-[#0c0f14] focus:ring-[#0c0f14]"
                  />
                  Set as default
                </label>
              </div>
            </div>

            {/* Body text */}
            <div className="space-y-1.5">
              <label htmlFor="template-body" className="text-sm font-medium text-[#3a3f49]">
                Body Text <span className="text-red-500">*</span>
              </label>
              <textarea
                id="template-body"
                rows={10}
                placeholder="Enter the consent form body text..."
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="w-full border border-[#d4d4cf] px-3 py-2 text-sm placeholder:text-[#b5b5ae] focus:border-[#0c0f14] focus:outline-none focus:ring-1 focus:ring-[#0c0f14]"
              />
              <p className="text-xs text-[#b5b5ae]">
                Use placeholders: {'{driver_name}'}, {'{company_name}'},{' '}
                {'{start_date}'}, {'{end_date}'}, {'{frequency}'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Saving...'
                  : editingTemplate
                  ? 'Save Changes'
                  : 'Create Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              <span className="inline-flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {previewTemplate
                    ? consentTypeLabel[previewTemplate.consent_type] ?? previewTemplate.consent_type
                    : ''}
                </Badge>
                <Badge variant="outline">
                  {previewTemplate?.language === 'es' ? 'Spanish' : 'English'}
                </Badge>
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="border border-[#e8e8e3] bg-[#fafaf8] p-4">
            <pre className="whitespace-pre-wrap text-sm text-[#3a3f49] font-sans leading-relaxed">
              {previewTemplate?.body_text}
            </pre>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
