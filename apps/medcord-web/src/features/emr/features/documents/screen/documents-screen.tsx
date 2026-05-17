import { useParams } from 'react-router-dom';
import { Loadable, Show, Repeat } from 'meemaw';
import { AppButton, DrawerService } from '@medcord/ui';
import { IconPlus, IconFileText } from '@icons';
import { PERMISSIONS } from '@medcord/rbac';
import { useHospitalSlug } from '@shared/hooks/use-hospital-slug.ts';
import { useAuth } from '@shared/hooks/use-auth.ts';
import { usePermissions } from '@shared/hooks/use-permissions.ts';
import { ChartLayout } from '../../../shared/chart-layout.tsx';
import { useDocuments } from '../api/use-documents.ts';
import type { ChartDocument, ChartDocumentCategory } from '../../../shared/types/emr.ts';
import { UploadDocumentForm } from './parts/upload-document-form.tsx';

const CATEGORY_LABEL: Record<ChartDocumentCategory, string> = {
  referral: 'Referral',
  lab_report: 'Lab report',
  imaging: 'Imaging',
  consent: 'Consent',
  other: 'Other',
};

export function DocumentsScreen() {
  const slug = useHospitalSlug();
  const { activeHospitalId } = useAuth();
  const { code = '' } = useParams<{ slug: string; code: string }>();
  const { can } = usePermissions();

  const { data: documents, isLoading, error } = useDocuments(activeHospitalId ?? '', code);

  return (
    <ChartLayout slug={slug} patientCode={code}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Documents</p>
          <Show when={can(PERMISSIONS.EMR_DOCUMENTS_WRITE)}>
            <AppButton
              variant="secondary"
              leadingIcon={<IconPlus size={14} />}
              onClick={() => DrawerService.showCustomModal('Upload document', () => (
                <UploadDocumentForm hospitalId={activeHospitalId ?? ''} patientId={code} />
              ))}
            >
              Upload document
            </AppButton>
          </Show>
        </div>

        <Loadable
          loading={isLoading}
          error={error ?? undefined}
          loadingComponent={<div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-900/20 border-t-forest-900" /></div>}
          errorComponent={<p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : 'Failed to load documents.'}</p>}
        >
          <Show
            when={(documents?.length ?? 0) > 0}
            fallback={<p className="py-8 text-center text-sm text-charcoal-700/50">No documents uploaded.</p>}
          >
            <div className="divide-y divide-forest-900/10 rounded-xl border border-forest-900/10 overflow-hidden">
              <Repeat each={(documents ?? []) as ChartDocument[]}>
                {(doc: ChartDocument) => (
                  <div key={doc.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3 hover:bg-cream-50/60 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <IconFileText size={16} className="flex-shrink-0 text-charcoal-700/40" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-charcoal-900 truncate">{doc.title}</p>
                        <p className="text-xs text-charcoal-700/60">
                          {CATEGORY_LABEL[doc.category]} · {new Date(doc.createdAt).toLocaleDateString()}
                          {doc.isSensitive ? ' · Sensitive' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Repeat>
            </div>
          </Show>
        </Loadable>
      </div>
    </ChartLayout>
  );
}
