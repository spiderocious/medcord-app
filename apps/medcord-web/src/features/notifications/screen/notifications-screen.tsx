import { useState } from 'react';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, AppText } from '@medcord/ui';
import {
  IconBell,
  IconFlask,
  IconAlert,
  IconArrowRight,
  IconCheckCircle,
  IconXCircle,
  IconClipboard,
  IconCheck,
  IconHeartPulse,
  IconUser,
  IconActivity,
} from '@icons';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/use-notifications.ts';
import type { Notification, NotificationType } from '../shared/types/notification.ts';

const TYPE_ICON: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  lab_result_ready: IconFlask,
  lab_result_abnormal: IconAlert,
  transfer_request: IconArrowRight,
  transfer_accepted: IconCheckCircle,
  transfer_declined: IconXCircle,
  review_item_submitted: IconClipboard,
  review_item_acted: IconCheck,
  patient_admitted: IconHeartPulse,
  patient_discharged: IconUser,
  vitals_out_of_range: IconActivity,
  general: IconBell,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationsScreen() {
  const { activeHospitalId } = useAuth();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const hospitalId = activeHospitalId ?? '';
  const { data, isLoading, error } = useNotifications(hospitalId, { unread: showUnreadOnly || undefined });
  const markRead = useMarkNotificationRead(hospitalId);
  const markAll = useMarkAllNotificationsRead(hospitalId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <AppText variant="heading-2" className="text-charcoal-900">Notifications</AppText>
          <Show when={data !== undefined}>
            <AppText variant="body-sm" className="mt-1 text-charcoal-700">
              {data?.total} notification{data?.total !== 1 ? 's' : ''}
            </AppText>
          </Show>
        </div>
        <div className="flex items-center gap-2">
          <AppButton
            variant="ghost"
            onClick={() => setShowUnreadOnly((v) => !v)}
          >
            {showUnreadOnly ? 'Show all' : 'Unread only'}
          </AppButton>
          <AppButton
            variant="ghost"
            onClick={() => markAll.mutate()}
            loading={markAll.isPending}
          >
            Mark all as read
          </AppButton>
        </div>
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
            {error instanceof Error ? error.message : 'Failed to load notifications.'}
          </p>
        }
      >
        <Show
          when={(data?.items?.length ?? 0) > 0}
          fallback={
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <IconBell size={32} className="text-charcoal-700/30" />
              <AppText variant="body-sm" className="text-charcoal-700">{"You're all caught up."}</AppText>
            </div>
          }
        >
          <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
            <Repeat each={(data?.items ?? []) as Notification[]}>
              {(notif: Notification) => {
                const Icon = TYPE_ICON[notif.type] ?? IconBell;
                return (
                  <button
                    key={notif.id}
                    type="button"
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-50/60 ${notif.isRead ? 'bg-white opacity-70' : 'bg-white'}`}
                    onClick={() => {
                      if (!notif.isRead) {
                        markRead.mutate(notif.id);
                      }
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0 rounded-full bg-forest-900/5 p-2">
                      <Icon size={14} className="text-forest-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal-900">{notif.title}</p>
                      <p className="text-xs text-charcoal-700/70 truncate">{notif.body}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[10px] text-charcoal-700/50">{formatRelativeTime(notif.createdAt)}</span>
                      <Show when={!notif.isRead}>
                        <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      </Show>
                    </div>
                  </button>
                );
              }}
            </Repeat>
          </div>
        </Show>
      </Loadable>
    </div>
  );
}
