import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppText } from '@medcord/ui';
import { IconClipboard } from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { ROUTES } from '@shared/constants/routes.ts';
import { useReviewQueue } from '../api/use-review-queue.ts';
import type { ReviewItem, ReviewItemStatus, ReviewItemType, ReviewItemPriority } from '../shared/types/review.ts';

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

export function ReviewQueueScreen() {
  const { activeHospitalId } = useAuth();
  const slug = useHospitalSlug();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<ReviewItemStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReviewItemType | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<ReviewItemPriority | ''>('');

  const { data, isLoading, error } = useReviewQueue(activeHospitalId ?? '', {
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    priority: priorityFilter || undefined,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Review Queue</AppText>
          <AppText variant="body-sm" className="mt-1 text-charcoal-700">
            {data ? `${data.total} item${data.total !== 1 ? 's' : ''}` : 'Items pending review'}
          </AppText>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReviewItemStatus | '')}
          className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="escalated">Escalated</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReviewItemType | '')}
          className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none"
        >
          <option value="">All types</option>
          <option value="lab_result">Lab result</option>
          <option value="vitals">Vitals</option>
          <option value="medication">Medication</option>
          <option value="document">Document</option>
          <option value="discharge">Discharge</option>
          <option value="transfer">Transfer</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as ReviewItemPriority | '')}
          className="rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 focus:border-forest-900 focus:outline-none"
        >
          <option value="">All priorities</option>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">STAT</option>
        </select>
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
            {error instanceof Error ? error.message : 'Failed to load review queue.'}
          </p>
        }
      >
        <Show
          when={(data?.items?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <IconClipboard size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">No items in the review queue.</AppText>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-xl border border-forest-900/10">
            <table className="min-w-full divide-y divide-forest-900/10 bg-white">
              <thead>
                <tr className="bg-cream-50">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Title</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Type</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Priority</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Patient</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Submitted by</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Date</th>
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-charcoal-700/60">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-900/10">
                <Repeat each={(data?.items ?? []) as ReviewItem[]}>
                  {(item: ReviewItem) => (
                    <tr
                      key={item.id}
                      className="hover:bg-cream-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate(ROUTES.HOSPITAL_REVIEW_ITEM(slug, item.id))}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-charcoal-900">{item.title}</p>
                        <Show when={item.summary !== undefined}>
                          <p className="text-xs text-charcoal-700/60 truncate max-w-[200px]">{item.summary}</p>
                        </Show>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TYPE_STYLE[item.type]}`}>
                          {TYPE_LABEL[item.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${PRIORITY_STYLE[item.priority]}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{item.patientId}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{item.submittedBy}</td>
                      <td className="px-4 py-3 text-sm text-charcoal-700">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[item.status]}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                    </tr>
                  )}
                </Repeat>
              </tbody>
            </table>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
