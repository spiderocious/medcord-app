import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loadable, Show } from 'meemaw';
import { AppButton, AppText, DrawerService } from '@medcord/ui';
import { IconArrowLeft, IconCheckCircle, IconXCircle, IconAlert } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useReviewItem, useActOnReviewItem } from '../api/use-review-queue.ts';
import type { ReviewItemType, ReviewItemStatus, ReviewItemPriority } from '../shared/types/review.ts';

const TYPE_LABEL: Record<ReviewItemType, string> = {
  lab_result: 'Lab result',
  vitals: 'Vitals',
  medication: 'Medication',
  document: 'Document',
  discharge: 'Discharge',
  transfer: 'Transfer',
};

const TYPE_STYLE: Record<ReviewItemType, string> = {
  lab_result: 'text-[#1e40af] border-[#bfdbfe] bg-[#eff6ff]',
  vitals: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  medication: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  document: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  discharge: 'text-red-700 border-red-200 bg-red-50',
  transfer: 'text-[#6d28d9] border-[#ddd6fe] bg-[#f5f3ff]',
};

const STATUS_LABEL: Record<ReviewItemStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  escalated: 'Escalated',
};

const STATUS_STYLE: Record<ReviewItemStatus, string> = {
  pending: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  approved: 'text-[#166534] border-[#bbf7d0] bg-[#f0fdf4]',
  rejected: 'text-red-700 border-red-200 bg-red-50',
  escalated: 'text-[#6d28d9] border-[#ddd6fe] bg-[#f5f3ff]',
};

const PRIORITY_STYLE: Record<ReviewItemPriority, string> = {
  routine: 'text-charcoal-700 border-forest-900/10 bg-cream-50',
  urgent: 'text-[#92400e] border-[#fde68a] bg-[#fffbeb]',
  stat: 'text-red-700 border-red-200 bg-red-50',
};

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:opacity-50 disabled:cursor-not-allowed';

export function ReviewItemScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const { itemId = '' } = useParams<{ slug: string; itemId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  const hospitalId = activeHospitalId ?? '';
  const { data: item, isLoading, error } = useReviewItem(hospitalId, itemId);
  const mutation = useActOnReviewItem(hospitalId, itemId);

  const canAct = item?.status === 'pending' || item?.status === 'escalated';

  function handleApprove() {
    mutation.mutate({ action: 'approve', note: note.trim() || undefined });
  }

  function handleReject() {
    DrawerService.showConfirmationModal(
      'Reject this item?',
      'This action will mark the item as rejected.',
      { destructive: true, onConfirm: () => { mutation.mutate({ action: 'reject', note: note.trim() || undefined }); } },
    );
  }

  function handleEscalate() {
    DrawerService.showConfirmationModal(
      'Escalate this item?',
      'This will escalate the item for further review.',
      { onConfirm: () => { mutation.mutate({ action: 'escalate', note: note.trim() || undefined }); } },
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <AppButton
          variant="ghost"
          leadingIcon={<IconArrowLeft size={14} />}
          onClick={() => navigate(ROUTES.HOSPITAL_REVIEW_QUEUE(slug))}
        >
          Review Queue
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
            {error instanceof Error ? error.message : 'Failed to load review item.'}
          </p>
        }
      >
        <Show when={item !== undefined}>
          {item && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Left — item detail */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                  <AppText variant="heading-2" className="text-charcoal-900">{item.title}</AppText>
                  <Show when={item.summary !== undefined}>
                    <AppText variant="body" className="text-charcoal-700">{item.summary}</AppText>
                  </Show>

                  <dl className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-forest-900/10">
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Type</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TYPE_STYLE[item.type]}`}>
                          {TYPE_LABEL[item.type]}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Priority</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLE[item.priority]}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Patient ID</dt>
                      <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{item.patientId}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Reference ID</dt>
                      <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{item.referenceId}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Submitted by</dt>
                      <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{item.submittedBy}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-charcoal-700/60">Submitted at</dt>
                      <dd className="mt-0.5 text-sm font-medium text-charcoal-900">{new Date(item.createdAt).toLocaleString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Right — action panel */}
              <div className="space-y-4">
                <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Status</p>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[item.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  <Show when={canAct}>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-charcoal-900">Note <span className="text-charcoal-700/50 font-normal">(optional)</span></label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          rows={3}
                          disabled={mutation.isPending}
                          className={INPUT_CLS}
                          placeholder="Add a review note…"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <AppButton
                          leadingIcon={<IconCheckCircle size={14} />}
                          onClick={handleApprove}
                          loading={mutation.isPending}
                        >
                          Approve
                        </AppButton>
                        <AppButton
                          variant="danger"
                          leadingIcon={<IconXCircle size={14} />}
                          onClick={handleReject}
                          loading={mutation.isPending}
                        >
                          Reject
                        </AppButton>
                        <AppButton
                          variant="secondary"
                          leadingIcon={<IconAlert size={14} />}
                          onClick={handleEscalate}
                          loading={mutation.isPending}
                        >
                          Escalate
                        </AppButton>
                      </div>
                    </div>
                  </Show>

                  <Show when={!canAct}>
                    <div className="space-y-3 pt-2 border-t border-forest-900/10">
                      <Show when={item.reviewedBy !== undefined}>
                        <div>
                          <p className="text-xs text-charcoal-700/60">Reviewed by</p>
                          <p className="mt-0.5 text-sm font-medium text-charcoal-900">{item.reviewedBy}</p>
                        </div>
                      </Show>
                      <Show when={item.reviewedAt !== undefined}>
                        <div>
                          <p className="text-xs text-charcoal-700/60">Reviewed at</p>
                          <p className="mt-0.5 text-sm font-medium text-charcoal-900">
                            {new Date(item.reviewedAt ?? '').toLocaleString()}
                          </p>
                        </div>
                      </Show>
                      <Show when={item.reviewNote !== undefined}>
                        <div>
                          <p className="text-xs text-charcoal-700/60">Note</p>
                          <p className="mt-0.5 text-sm text-charcoal-900">{item.reviewNote}</p>
                        </div>
                      </Show>
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
