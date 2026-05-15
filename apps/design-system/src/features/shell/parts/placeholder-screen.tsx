import { Construction } from '@icons';

interface PlaceholderScreenProps {
  readonly name: string;
}

export function PlaceholderScreen({ name }: PlaceholderScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Construction size={32} className="text-[var(--text-tertiary)] mb-4" strokeWidth={1.5} />
      <div className="text-[14px] font-medium text-[var(--text-secondary)] mb-1">{name}</div>
      <div className="text-[12px] text-[var(--text-tertiary)]">Coming up next…</div>
    </div>
  );
}
