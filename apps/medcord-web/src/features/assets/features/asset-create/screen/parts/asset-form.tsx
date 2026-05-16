import { useState, type FormEvent } from 'react';
import { Repeat } from 'meemaw';
import { AppButton } from '@medcord/ui';
import type { AssetCondition, AssetStatus } from '../../../../shared/types/asset.ts';

const CONDITION_OPTIONS: ReadonlyArray<{ readonly value: AssetCondition; readonly label: string }> = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const STATUS_OPTIONS: ReadonlyArray<{ readonly value: AssetStatus; readonly label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'in_use', label: 'In Use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
];

const INPUT_CLS = 'mt-1 block w-full rounded-lg border border-forest-900/20 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder-charcoal-700/50 focus:border-forest-900 focus:outline-none focus:ring-1 focus:ring-forest-900 disabled:cursor-not-allowed disabled:opacity-50';

export interface AssetFormValues {
  readonly name: string;
  readonly category: string;
  readonly condition: AssetCondition;
  readonly status: AssetStatus;
  readonly manufacturer?: string;
  readonly modelName?: string;
  readonly serialNumber?: string;
  readonly assetTag?: string;
  readonly purchaseDate?: string;
  readonly purchasePrice?: number;
  readonly warrantyExpiresAt?: string;
  readonly currentLocation?: string;
  readonly notes?: string;
}

interface AssetFormProps {
  readonly onSubmit: (values: AssetFormValues) => void;
  readonly loading: boolean;
  readonly onCancel: () => void;
}

export function AssetForm({ onSubmit, loading, onCancel }: AssetFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<AssetCondition>('good');
  const [status, setStatus] = useState<AssetStatus>('available');
  const [manufacturer, setManufacturer] = useState('');
  const [modelName, setModelName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assetTag, setAssetTag] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyExpiresAt, setWarrantyExpiresAt] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      category: category.trim(),
      condition,
      status,
      manufacturer: manufacturer.trim() || undefined,
      modelName: modelName.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      assetTag: assetTag.trim() || undefined,
      purchaseDate: purchaseDate || undefined,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      warrantyExpiresAt: warrantyExpiresAt || undefined,
      currentLocation: currentLocation.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Basic information</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-charcoal-900">Name <span className="text-red-500">*</span></label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. Defibrillator AED"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Category <span className="text-red-500">*</span></label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading}
              placeholder="e.g. Cardiac"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Asset tag</label>
            <input
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              disabled={loading}
              placeholder="e.g. AST-0042"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value as AssetCondition)} disabled={loading} className={INPUT_CLS}>
              <Repeat each={CONDITION_OPTIONS as Array<{ value: AssetCondition; label: string }>}>
                {(opt: { value: AssetCondition; label: string }) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )}
              </Repeat>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AssetStatus)} disabled={loading} className={INPUT_CLS}>
              <Repeat each={STATUS_OPTIONS as Array<{ value: AssetStatus; label: string }>}>
                {(opt: { value: AssetStatus; label: string }) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                )}
              </Repeat>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Current location</label>
            <input
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              disabled={loading}
              placeholder="e.g. ICU Room 3"
              className={INPUT_CLS}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-forest-900/10 bg-white p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-700/60">Details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Manufacturer</label>
            <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} disabled={loading} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Model</label>
            <input value={modelName} onChange={(e) => setModelName(e.target.value)} disabled={loading} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Serial number</label>
            <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} disabled={loading} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Purchase date</label>
            <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} disabled={loading} className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Purchase price</label>
            <input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} disabled={loading} placeholder="0.00" className={INPUT_CLS} />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-900">Warranty expires</label>
            <input type="date" value={warrantyExpiresAt} onChange={(e) => setWarrantyExpiresAt(e.target.value)} disabled={loading} className={INPUT_CLS} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-charcoal-900">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={loading} className={INPUT_CLS} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <AppButton type="submit" loading={loading}>Create asset</AppButton>
        <AppButton type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</AppButton>
      </div>
    </form>
  );
}
