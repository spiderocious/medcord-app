import { AppText } from '@medcord/ui';

interface PlaceholderScreenProps {
  readonly label: string;
}

export function PlaceholderScreen({ label }: PlaceholderScreenProps) {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center">
      <AppText variant="body-sm" className="text-charcoal-700">
        {label} — coming soon
      </AppText>
    </div>
  );
}
