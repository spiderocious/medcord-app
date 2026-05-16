import { Link, useParams } from 'react-router-dom';

import { AppButton, AppText } from '@medcord/ui';
import { IconArrowLeft } from '@icons';
import { ROUTES } from '@shared/constants/routes.ts';
import { useHospitalBySlug } from '@shared/api/use-hospital-by-slug.ts';
import { InviteForm } from './parts/invite-form.tsx';
import { CsvUpload } from './parts/csv-upload.tsx';

export function StaffInviteScreen() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: hospital } = useHospitalBySlug(slug);
  const hospitalId = hospital?.id ?? '';

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      {/* Back nav */}
      <div>
        <Link to={ROUTES.HOSPITAL_STAFF(slug)}>
          <AppButton variant="ghost" leadingIcon={<IconArrowLeft size={14} />}>
            Back to staff
          </AppButton>
        </Link>
      </div>

      {/* Page header */}
      <div>
        <AppText variant="heading-1" className="text-charcoal-900">Invite staff</AppText>
        <AppText variant="body-sm" className="mt-1 text-charcoal-700">
          Add team members to {hospital?.name ?? 'your hospital'}.
        </AppText>
      </div>

      {/* Single invite form */}
      <InviteForm hospitalId={hospitalId} />

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-forest-900/10" />
        <AppText variant="caption" className="normal-case tracking-normal text-charcoal-700/60">or</AppText>
        <div className="h-px flex-1 bg-forest-900/10" />
      </div>

      {/* CSV bulk import */}
      <CsvUpload hospitalId={hospitalId} />
    </div>
  );
}
