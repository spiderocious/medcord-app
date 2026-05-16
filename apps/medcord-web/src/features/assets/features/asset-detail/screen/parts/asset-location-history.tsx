import { Show, Repeat } from 'meemaw';
import { IconMapPin } from '@icons';
import { AppText } from '@medcord/ui';
import type { AssetLocationHistory } from '../../../../shared/types/asset.ts';

interface AssetLocationHistoryPanelProps {
  readonly history: readonly AssetLocationHistory[];
}

export function AssetLocationHistoryPanel({ history }: AssetLocationHistoryPanelProps) {
  return (
    <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Location history</p>
      <Show
        when={history.length > 0}
        fallback={
          <div className="flex items-center gap-2 py-4 text-charcoal-700/50">
            <IconMapPin size={14} />
            <AppText variant="body-sm">No movement recorded.</AppText>
          </div>
        }
      >
        <ol className="space-y-3">
          <Repeat each={history as AssetLocationHistory[]}>
            {(entry: AssetLocationHistory, idx: number) => (
              <li key={`${entry.movedAt}-${idx}`} className="flex gap-3">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-forest-900/30" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-charcoal-900">{entry.location}</p>
                  <p className="text-xs text-charcoal-700/60">
                    {new Date(entry.movedAt).toLocaleDateString()}
                    <Show when={entry.note !== undefined}>
                      {' · '}{entry.note}
                    </Show>
                  </p>
                </div>
              </li>
            )}
          </Repeat>
        </ol>
      </Show>
    </div>
  );
}
