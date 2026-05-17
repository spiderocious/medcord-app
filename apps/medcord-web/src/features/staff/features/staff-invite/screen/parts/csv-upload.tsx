import { useState, useRef, type ChangeEvent } from 'react';
import { Show, Repeat } from 'meemaw';

import { AppButton, AppText } from '@medcord/ui';
import { parseApiError } from '@medcord/api';
import { ROLES } from '@medcord/rbac';
import { IconUpload, IconCheckCircle, IconAlert, IconFileText } from '@icons';
import type { BulkInviteEntry } from '../../api/use-invite-staff.ts';
import { useBulkInviteStaff } from '../../api/use-invite-staff.ts';
import { useRoles } from '../../../roles/api/use-roles.ts';

interface ParsedRow {
  readonly email: string;
  readonly role: string;
  readonly department?: string;
  readonly unit?: string;
  readonly valid: boolean;
  readonly errorMsg?: string;
}

function parseCSV(text: string, validRoles: Set<string>): ParsedRow[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const dataLines = lines[0]?.toLowerCase().startsWith('email') ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const email = cols[0] ?? '';
    const role = (cols[1] ?? '').toLowerCase();
    const department = cols[2] !== undefined && cols[2] !== '' ? cols[2] : undefined;
    const unit = cols[3] !== undefined && cols[3] !== '' ? cols[3] : undefined;

    if (email === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { email, role: '', valid: false, errorMsg: 'Invalid email' };
    }
    if (!validRoles.has(role)) {
      return { email, role: '', valid: false, errorMsg: `Unknown role: ${role}` };
    }

    return { email, role, department, unit, valid: true };
  });
}

interface CsvUploadProps {
  readonly hospitalId: string;
}

export function CsvUpload({ hospitalId }: CsvUploadProps) {
  const mutation = useBulkInviteStaff(hospitalId);
  const { data: rolesData } = useRoles(hospitalId);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRoleSlugs = new Set(
    (rolesData?.roles ?? [])
      .filter((r) => r.slug !== ROLES.SUPER_ADMIN)
      .map((r) => r.slug),
  );
  const roleHintText = (rolesData?.roles ?? [])
    .filter((r) => r.slug !== ROLES.SUPER_ADMIN)
    .map((r) => r.slug)
    .join(', ');

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file === undefined) return;
    setFileName(file.name);
    setError(null);
    setSentCount(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRows(parseCSV(text, validRoleSlugs));
    };
    reader.readAsText(file);
  }

  const validRows = rows.filter((r) => r.valid);
  const invalidRows = rows.filter((r) => !r.valid);

  async function handleSend() {
    if (validRows.length === 0) return;
    setError(null);
    setSentCount(null);

    const payload: ReadonlyArray<BulkInviteEntry> = validRows.map((r) => ({
      email: r.email,
      role: r.role,
      ...(r.department !== undefined ? { department: r.department } : {}),
      ...(r.unit !== undefined ? { unit: r.unit } : {}),
    }));

    try {
      const result = await mutation.mutateAsync(payload);
      setSentCount(result.length);
      setRows([]);
      setFileName(null);
      if (fileRef.current !== null) fileRef.current.value = '';
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <AppText variant="heading-3" className="text-charcoal-900">Bulk import via CSV</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Upload a CSV file to invite multiple staff at once.
        </AppText>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4 sm:p-6">
        {/* Format hint */}
        <div className="rounded-lg border border-forest-900/10 bg-cream-50 px-4 py-3">
          <AppText variant="caption" as="p" className="font-semibold normal-case tracking-normal text-charcoal-900">
            CSV format
          </AppText>
          <code className="mt-1 block text-xs text-charcoal-700">
            email,role,department,unit
          </code>
          <AppText variant="caption" as="p" className="mt-1 normal-case tracking-normal text-charcoal-700/70">
            Valid roles: {roleHintText !== '' ? roleHintText : 'loading…'}
          </AppText>
        </div>

        {/* Upload area */}
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="hidden"
            id="csv-file"
          />
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-forest-900/20 bg-cream-50 px-4 py-8 transition-colors hover:border-forest-900/40 hover:bg-forest-900/5"
          >
            <Show
              when={fileName !== null}
              fallback={
                <>
                  <IconUpload size={24} className="text-charcoal-700/40" />
                  <AppText variant="body-sm" as="span" className="font-medium text-charcoal-900">
                    Click to upload CSV
                  </AppText>
                  <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-700">
                    or drag and drop
                  </AppText>
                </>
              }
            >
              <IconFileText size={24} className="text-forest-900/70" />
              <AppText variant="body-sm" as="span" className="font-medium text-charcoal-900">
                {fileName}
              </AppText>
              <AppText variant="caption" as="span" className="normal-case tracking-normal text-charcoal-700">
                {rows.length} rows parsed · Click to change
              </AppText>
            </Show>
          </label>
        </div>

        {/* Parse results */}
        <Show when={rows.length > 0}>
          <div className="space-y-2">
            <Show when={invalidRows.length > 0}>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <IconAlert size={14} />
                  {invalidRows.length} invalid row{invalidRows.length !== 1 ? 's' : ''} (will be skipped)
                </div>
                <Repeat each={invalidRows}>
                  {(row: ParsedRow) => (
                    <AppText key={row.email} variant="caption" as="p" className="normal-case tracking-normal text-amber-700">
                      {row.email}: {row.errorMsg}
                    </AppText>
                  )}
                </Repeat>
              </div>
            </Show>

            <Show when={validRows.length > 0}>
              <div className="flex items-center gap-2 rounded-lg bg-forest-900/5 px-3 py-2 text-sm text-forest-900">
                <IconCheckCircle size={14} />
                {validRows.length} valid invitation{validRows.length !== 1 ? 's' : ''} ready to send
              </div>
            </Show>
          </div>
        </Show>

        <Show when={sentCount !== null}>
          <div className="flex items-center gap-2 rounded-lg bg-forest-900/5 px-3 py-2 text-sm text-forest-900">
            <IconCheckCircle size={14} />
            {sentCount} invitation{sentCount !== 1 ? 's' : ''} sent successfully
          </div>
        </Show>

        <Show when={error !== null}>
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        </Show>

        <Show when={validRows.length > 0}>
          <AppButton
            loading={mutation.isPending}
            onClick={() => { void handleSend(); }}
            leadingIcon={<IconUpload size={14} />}
          >
            Send {validRows.length} invitation{validRows.length !== 1 ? 's' : ''}
          </AppButton>
        </Show>
      </div>
    </div>
  );
}
