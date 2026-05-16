import { useParams } from 'react-router-dom';

export function useHospitalSlug(): string {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) throw new Error('useHospitalSlug must be used inside a /h/:slug route');
  return slug;
}
