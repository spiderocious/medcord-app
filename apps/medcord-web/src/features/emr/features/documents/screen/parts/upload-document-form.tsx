import { useState, useRef } from 'react';
import { Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconUpload } from '@icons';
import { useAddDocument, type AddDocumentPayload } from '../../api/use-documents.ts';
import type { ChartDocumentCategory } from '../../../../shared/types/emr.ts';

const CATEGORY_OPTIONS: ReadonlyArray<{ value: ChartDocumentCategory; label: string }> = [
  { value: 'referral', label: 'Referral' },
  { value: 'lab_report', label: 'Lab report' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'consent', label: 'Consent' },
  { value: 'other', label: 'Other' },
];

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none';

const FILE_SERVICE = import.meta.env.VITE_FILE_SERVICE as string ?? 'https://go-file-service-production.up.railway.app';

async function uploadFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? '';
  const res = await fetch(`${FILE_SERVICE}/get-upload-uri?ext=${ext}`);
  const { key, uri } = await res.json() as { key: string; uri: string };
  await fetch(uri, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  return key;
}

interface UploadDocumentFormProps {
  readonly hospitalId: string;
  readonly patientId: string;
}

export function UploadDocumentForm({ hospitalId, patientId }: UploadDocumentFormProps) {
  const mutation = useAddDocument(hospitalId, patientId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChartDocumentCategory>('other');
  const [isSensitive, setIsSensitive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');

  async function handleSubmit() {
    const file = fileRef.current?.files?.[0];
    if (!title.trim() || !file) return;
    setUploading(true);
    try {
      const fileKey = await uploadFile(file);
      const payload: AddDocumentPayload = { title: title.trim(), category, fileKey, isSensitive };
      mutation.mutate(payload, { onSuccess: () => { DrawerService.dismissAllModals(); } });
    } catch {
      DrawerService.toast('File upload failed.', { type: 'error' });
    } finally {
      setUploading(false);
    }
  }

  const isLoading = uploading || mutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Title <span className="text-red-500">*</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isLoading} className={INPUT_CLS} />
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as ChartDocumentCategory)} disabled={isLoading} className={INPUT_CLS}>
          <Repeat each={CATEGORY_OPTIONS as Array<{ value: ChartDocumentCategory; label: string }>}>
            {(opt: { value: ChartDocumentCategory; label: string }) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            )}
          </Repeat>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">File <span className="text-red-500">*</span></label>
        <div className="mt-1">
          <input
            type="file"
            ref={fileRef}
            className="hidden"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-dashed border-forest-900/30 bg-cream-50 px-4 py-3 text-sm text-charcoal-700 hover:border-forest-900/60 transition-colors w-full disabled:opacity-50"
          >
            <IconUpload size={14} />
            {fileName || 'Choose file'}
          </button>
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isSensitive} onChange={(e) => setIsSensitive(e.target.checked)} disabled={isLoading} className="rounded border-forest-900/20" />
        <span className="text-sm text-charcoal-900">Mark as sensitive</span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => { void handleSubmit(); }} loading={isLoading}>Upload</AppButton>
      </div>
    </div>
  );
}
