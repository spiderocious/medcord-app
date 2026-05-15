import { useHealth } from '@solon/api';
import { AppText } from '@solon/ui';

export function AdminHome() {
  const { data, isLoading, isError } = useHealth();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <AppText variant="caption">solon · admin</AppText>
      <AppText variant="heading-1" className="mt-2 text-forest-900">
        Platform operations
      </AppText>
      <AppText variant="body" className="mt-4 text-charcoal-700">
        Manage users, races, model versions, audit logs and platform-level configuration.
      </AppText>

      <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Tile label="users" value="—" hint="connect once auth lands" />
        <Tile label="races" value="—" hint="connect once data-layer lands" />
        <Tile
          label="backend"
          value={isLoading ? '…' : isError ? 'down' : (data?.status ?? '—')}
          hint="from /api/v1/health"
        />
      </section>
    </main>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-forest-900/10 bg-white p-4 shadow-sm">
      <AppText variant="caption">{label}</AppText>
      <p className="mt-2 font-serif text-2xl text-forest-900">{value}</p>
      <p className="mt-1 text-xs text-charcoal-700">{hint}</p>
    </div>
  );
}
