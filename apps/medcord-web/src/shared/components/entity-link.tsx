import { Link } from 'react-router-dom';

interface EntityLinkProps {
  readonly id: string;
  readonly to: string;
  readonly label: string;
  readonly mono?: boolean;
}

export function EntityLink({ id, to, label, mono = true }: EntityLinkProps) {
  return (
    <Link
      to={to}
      title={`Go to ${label}`}
      className={[
        'text-forest-900 underline-offset-2 hover:underline transition-colors',
        mono ? 'font-mono text-sm font-medium' : 'text-sm font-medium',
      ].join(' ')}
    >
      {id}
    </Link>
  );
}
