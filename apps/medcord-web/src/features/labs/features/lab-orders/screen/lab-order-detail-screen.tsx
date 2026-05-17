import { useState, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import {
  IconArrowLeft,
  IconFlask,
  IconAlert,
  IconCheckCircle,
  IconClock,
  IconUpload,
} from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import {
  useGetLabOrder,
  useAdvanceLabStatus,
  useRecordLabResult,
} from '../api/use-lab-orders.ts';
import { ResultSignoffPanel } from './parts/result-signoff-panel.tsx';
import type { LabOrder, LabOrderStatus, LabStateHistory } from '../../../shared/types/lab.ts';

const FILE_SERVICE = import.meta.env.VITE_FILE_SERVICE as string ?? 'https://go-file-service-production.up.railway.app';

async function uploadFileToService(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? '';
  const res = await fetch(`${FILE_SERVICE}/get-upload-uri?ext=${ext}`);
  const { key, uri } = await res.json() as { key: string; uri: string };
  const upload = await fetch(uri, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  if (!upload.ok) throw new Error('File upload failed.');
  return key;
}

const STATUS_STEPS: LabOrderStatus[] = [
  'awaiting_sample',
  'sample_received',
  'awaiting_test',
  'in_progress',
  'awaiting_result',
  'result_ready',
  'result_released',
];

const STATUS_LABEL: Record<LabOrderStatus, string> = {
  awaiting_sample: 'Awaiting Sample',
  sample_received: 'Sample Received',
  awaiting_test: 'Awaiting Test',
  in_progress: 'In Progress',
  awaiting_result: 'Awaiting Result',
  result_ready: 'Result Ready',
  result_released: 'Released',
};

const STATUS_STYLE: Record<LabOrderStatus, string> = {
  awaiting_sample: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  sample_received: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  awaiting_test: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  in_progress: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  awaiting_result: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  result_ready: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  result_released: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
};

const PRIORITY_STYLE: Record<string, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed';

interface AdvanceStatusFormProps {
  readonly order: LabOrder;
  readonly hospitalId: string;
}

function AdvanceStatusForm({ order, hospitalId }: AdvanceStatusFormProps) {
  const mutation = useAdvanceLabStatus(hospitalId, order.patientId, order.id);
  const [note, setNote] = useState('');
  const [sampleType, setSampleType] = useState('');
  const [sampleCollectedAt, setSampleCollectedAt] = useState('');

  const showSampleFields = order.status === 'awaiting_sample';
  const isAwaitingResult = order.status === 'awaiting_result';

  function handleSubmit() {
    mutation.mutate(
      {
        note: note.trim() || undefined,
        sampleType: showSampleFields ? (sampleType.trim() || undefined) : undefined,
        sampleCollectedAt: showSampleFields ? (sampleCollectedAt || undefined) : undefined,
      },
      { onSuccess: () => { DrawerService.dismissAllModals(); } },
    );
  }

  return (
    <div className="space-y-4">
      <Show when={isAwaitingResult}>
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Record the result before advancing to &quot;Result Ready&quot;.
        </div>
      </Show>
      <Show when={showSampleFields}>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Sample type</label>
          <input value={sampleType} onChange={(e) => setSampleType(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} placeholder="e.g. Venous blood" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Sample collected at</label>
          <input type="datetime-local" value={sampleCollectedAt} onChange={(e) => setSampleCollectedAt(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
      </Show>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Note <span className="text-charcoal-700/50 font-normal">(optional)</span></label>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} disabled={mutation.isPending} className={INPUT_CLS} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={handleSubmit} loading={mutation.isPending} disabled={isAwaitingResult}>
          Advance status
        </AppButton>
      </div>
    </div>
  );
}

interface RecordResultFormProps {
  readonly order: LabOrder;
  readonly hospitalId: string;
}

function RecordResultForm({ order, hospitalId }: RecordResultFormProps) {
  const mutation = useRecordLabResult(hospitalId, order.patientId, order.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(order.result?.value ?? '');
  const [unit, setUnit] = useState(order.result?.unit ?? '');
  const [referenceRange, setReferenceRange] = useState(order.result?.referenceRange ?? '');
  const [isAbnormal, setIsAbnormal] = useState(order.result?.isAbnormal ?? false);
  const [notes, setNotes] = useState(order.result?.notes ?? '');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleSubmit() {
    if (!value.trim()) return;
    setUploading(true);
    try {
      let fileKey: string | undefined;
      const file = fileRef.current?.files?.[0];
      if (file) {
        fileKey = await uploadFileToService(file);
      }
      mutation.mutate(
        { value: value.trim(), unit: unit.trim() || undefined, referenceRange: referenceRange.trim() || undefined, isAbnormal, notes: notes.trim() || undefined, fileKey },
        { onSuccess: () => { DrawerService.dismissAllModals(); } },
      );
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
        <label className="block text-sm font-medium text-charcoal-900">Result value <span className="text-red-500">*</span></label>
        <input value={value} onChange={(e) => setValue(e.target.value)} required disabled={isLoading} className={INPUT_CLS} placeholder="e.g. 14.2" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Unit</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} disabled={isLoading} className={INPUT_CLS} placeholder="e.g. g/dL" />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Reference range</label>
          <input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} disabled={isLoading} className={INPUT_CLS} placeholder="e.g. 12.0–16.0" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={isLoading} className={INPUT_CLS} />
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isAbnormal} onChange={(e) => setIsAbnormal(e.target.checked)} disabled={isLoading} className="rounded border-forest-900/20" />
        <span className="text-sm text-charcoal-900">Mark as abnormal</span>
      </label>
      <div>
        <label className="block text-sm font-medium text-charcoal-900">Attach result file <span className="text-charcoal-700/50 font-normal">(optional)</span></label>
        <div className="mt-1">
          <input type="file" ref={fileRef} className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} />
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
      <div className="flex justify-end gap-2 pt-2">
        <AppButton variant="ghost" onClick={() => DrawerService.dismissAllModals()}>Cancel</AppButton>
        <AppButton onClick={() => { void handleSubmit(); }} loading={isLoading}>Save result</AppButton>
      </div>
    </div>
  );
}

interface StateStepperProps {
  readonly status: LabOrderStatus;
}

function StateStepper({ status }: StateStepperProps) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center min-w-max gap-0">
        <Repeat each={STATUS_STEPS as LabOrderStatus[]}>
          {(step: LabOrderStatus, idx: number) => {
            const isDone = idx < currentIdx;
            const isActive = idx === currentIdx;
            return (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    isActive
                      ? 'border-forest-900 bg-forest-900 text-white'
                      : isDone
                      ? 'border-forest-900/40 bg-forest-900/10 text-forest-900'
                      : 'border-charcoal-700/20 bg-white text-charcoal-700/40'
                  }`}>
                    <Show when={isDone} fallback={<span>{idx + 1}</span>}>
                      <IconCheckCircle size={14} />
                    </Show>
                  </div>
                  <span className={`text-[9px] text-center font-medium leading-tight max-w-[64px] ${
                    isActive ? 'text-forest-900' : isDone ? 'text-forest-900/60' : 'text-charcoal-700/40'
                  }`}>
                    {STATUS_LABEL[step]}
                  </span>
                </div>
                <Show when={idx < STATUS_STEPS.length - 1}>
                  <div className={`h-px w-6 mb-5 ${idx < currentIdx ? 'bg-forest-900/40' : 'bg-charcoal-700/15'}`} />
                </Show>
              </div>
            );
          }}
        </Repeat>
      </div>
    </div>
  );
}

export function LabOrderDetailScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { orderId = '' } = useParams<{ slug: string; orderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const patientId = searchParams.get('patientId') ?? '';
  const hospitalId = activeHospitalId ?? '';

  const { data: order, isLoading, error } = useGetLabOrder(hospitalId, patientId, orderId);

  const canAdvance = order?.status !== 'result_released' && order?.status !== 'result_ready';
  const showResultPanel =
    order !== undefined &&
    (order.result !== undefined ||
      order.status === 'awaiting_result' ||
      order.status === 'result_ready' ||
      order.status === 'result_released');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_LABS(slug))}
        >
          Lab orders
        </AppButton>
      </div>

      <Loadable
        loading={isLoading}
        error={error ?? undefined}
        loadingComponent={
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" />
          </div>
        }
        errorComponent={
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load lab order.'}
          </p>
        }
      >
        <Show when={order !== undefined}>
          {order && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <AppText variant="heading-2" className="text-charcoal-900">{order.testName}</AppText>
                  <Show when={!!(order.testCode ?? order.category)}>
                    <AppText variant="body-sm" className="mt-1 text-charcoal-700">
                      {[order.testCode, order.category].filter(Boolean).join(' · ')}
                    </AppText>
                  </Show>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLE[order.priority]}`}>
                    {order.priority.toUpperCase()}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[order.status]}`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
              </div>

              {/* State stepper */}
              <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Progress</p>
                  <Show when={canAdvance}>
                    <AppButton
                      variant="secondary"
                      onClick={() => DrawerService.showCustomModal('Advance status', () => (
                        <AdvanceStatusForm order={order} hospitalId={hospitalId} />
                      ))}
                    >
                      Advance status
                    </AppButton>
                  </Show>
                </div>
                <StateStepper status={order.status} />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Order details */}
                  <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60 mb-4">Order details</p>
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-charcoal-700/60">Patient ID</dt>
                        <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{order.patientId}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-charcoal-700/60">Ordered by</dt>
                        <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{order.orderedBy}</dd>
                      </div>
                      <Show when={order.sampleType !== undefined}>
                        <div>
                          <dt className="text-xs text-charcoal-700/60">Sample type</dt>
                          <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{order.sampleType}</dd>
                        </div>
                      </Show>
                      <Show when={order.sampleCollectedAt !== undefined}>
                        <div>
                          <dt className="text-xs text-charcoal-700/60">Sample collected</dt>
                          <dd className="mt-0.5 text-sm font-medium text-charcoal-900">
                            {new Date(order.sampleCollectedAt ?? '').toLocaleString()}
                          </dd>
                        </div>
                      </Show>
                      <Show when={order.sampleCollectedBy !== undefined}>
                        <div>
                          <dt className="text-xs text-charcoal-700/60">Collected by</dt>
                          <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{order.sampleCollectedBy}</dd>
                        </div>
                      </Show>
                      <div>
                        <dt className="text-xs text-charcoal-700/60">Created</dt>
                        <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{new Date(order.createdAt).toLocaleString()}</dd>
                      </div>
                      <Show when={order.notes !== undefined}>
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-charcoal-700/60">Notes</dt>
                          <dd className="mt-0.5 text-sm text-charcoal-900">{order.notes}</dd>
                        </div>
                      </Show>
                    </dl>
                  </div>

                  {/* Sign-off panel */}
                  <ResultSignoffPanel order={order} hospitalId={hospitalId} />

                  {/* Result panel */}
                  <Show when={showResultPanel}>
                    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Result</p>
                        <Show when={order.result === undefined && order.status === 'awaiting_result'}>
                          <AppButton
                            variant="secondary"
                            leadingIcon={<IconFlask size={14} />}
                            onClick={() => DrawerService.showCustomModal('Record result', () => (
                              <RecordResultForm order={order} hospitalId={hospitalId} />
                            ))}
                          >
                            Record result
                          </AppButton>
                        </Show>
                        <Show when={order.result !== undefined && order.status === 'result_ready'}>
                          <AppButton
                            variant="ghost"
                            onClick={() => DrawerService.showCustomModal('Update result', () => (
                              <RecordResultForm order={order} hospitalId={hospitalId} />
                            ))}
                          >
                            Update result
                          </AppButton>
                        </Show>
                      </div>
                      <Show
                        when={order.result !== undefined}
                        fallback={
                          <p className="text-sm text-charcoal-700/50">No result recorded yet.</p>
                        }
                      >
                        {order.result && (
                          <dl className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs text-charcoal-700/60">Value</dt>
                              <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-charcoal-900">
                                {order.result.value}
                                <Show when={order.result.unit !== undefined}>
                                  <span className="text-charcoal-700/60">{order.result.unit}</span>
                                </Show>
                                <Show when={order.result.isAbnormal}>
                                  <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                                    <IconAlert size={10} />
                                    Abnormal
                                  </span>
                                </Show>
                              </dd>
                            </div>
                            <Show when={order.result.referenceRange !== undefined}>
                              <div>
                                <dt className="text-xs text-charcoal-700/60">Reference range</dt>
                                <dd className="mt-0.5 text-sm text-charcoal-900">{order.result.referenceRange}</dd>
                              </div>
                            </Show>
                            <Show when={order.result.notes !== undefined}>
                              <div className="sm:col-span-2">
                                <dt className="text-xs text-charcoal-700/60">Notes</dt>
                                <dd className="mt-0.5 text-sm text-charcoal-900">{order.result.notes}</dd>
                              </div>
                            </Show>
                          </dl>
                        )}
                      </Show>
                    </div>
                  </Show>
                </div>

                {/* State history */}
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">History</p>
                  <Show
                    when={(order.stateHistory.length ?? 0) > 0}
                    fallback={<p className="text-sm text-charcoal-700/50">No history yet.</p>}
                  >
                    <div className="space-y-3">
                      <Repeat each={(order.stateHistory as LabStateHistory[]).slice().reverse()}>
                        {(entry: LabStateHistory) => (
                          <div key={`${entry.changedAt}-${entry.to}`} className="flex gap-3">
                            <div className="mt-1 flex-shrink-0">
                              <IconClock size={12} className="text-charcoal-700/40" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-charcoal-900">
                                {STATUS_LABEL[entry.from]} → {STATUS_LABEL[entry.to]}
                              </p>
                              <p className="text-[10px] text-charcoal-700/60">
                                {new Date(entry.changedAt).toLocaleString()}
                              </p>
                              <Show when={entry.note !== undefined}>
                                <p className="mt-0.5 text-xs text-charcoal-700">{entry.note}</p>
                              </Show>
                            </div>
                          </div>
                        )}
                      </Repeat>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          )}
        </Show>
      </Loadable>
    </div>
  );
}
