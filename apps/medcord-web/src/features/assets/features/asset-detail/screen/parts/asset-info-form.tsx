import { useState, type FormEvent } from 'react';
import { Repeat } from 'meemaw';
import { AppButton } from '@medcord/ui';
import { DrawerService } from '@medcord/ui';
import type { Asset, AssetCondition } from '../../../../shared/types/asset.ts';
import { useUpdateAsset } from '../../../asset-list/api/use-assets.ts';

const CONDITION_OPTIONS: ReadonlyArray<{ readonly value: AssetCondition; readonly label: string }> = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

interface AssetInfoFormProps {
  readonly asset: Asset;
  readonly hospitalId: string;
}

export function AssetInfoForm({ asset, hospitalId }: AssetInfoFormProps) {
  const mutation = useUpdateAsset(hospitalId, asset.id);

  const [name, setName] = useState(asset.name);
  const [category, setCategory] = useState(asset.category);
  const [manufacturer, setManufacturer] = useState(asset.manufacturer ?? '');
  const [modelName, setModelName] = useState(asset.modelName ?? '');
  const [serialNumber, setSerialNumber] = useState(asset.serialNumber ?? '');
  const [condition, setCondition] = useState<AssetCondition>(asset.condition);
  const [notes, setNotes] = useState(asset.notes ?? '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await mutation.mutateAsync({
        name: name.trim(),
        category: category.trim(),
        manufacturer: manufacturer.trim() || undefined,
        modelName: modelName.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        condition,
        notes: notes.trim() || undefined,
      });
      DrawerService.toast('Changes saved.', { type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      DrawerService.toast(message, { type: 'error' });
    }
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-charcoal-900">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} required disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Condition</label>
          <select value={condition} onChange={(e) => setCondition(e.target.value as AssetCondition)} disabled={mutation.isPending} className={INPUT_CLS}>
            <Repeat each={CONDITION_OPTIONS as Array<{ value: AssetCondition; label: string }>}>
              {(opt: { value: AssetCondition; label: string }) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              )}
            </Repeat>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Manufacturer</label>
          <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Model</label>
          <input value={modelName} onChange={(e) => setModelName(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
        <div>
          <label className="block text-sm font-medium text-charcoal-900">Serial number</label>
          <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-charcoal-900">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={mutation.isPending} className={INPUT_CLS} />
        </div>
      </div>
      <AppButton type="submit" loading={mutation.isPending}>Save changes</AppButton>
    </form>
  );
}
