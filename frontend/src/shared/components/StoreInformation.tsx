import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Info, Mail, MapPin, Phone, Save, Trash2, Upload } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Page, type StoreBrand } from '../App';
import { getApiBaseUrl } from '../../auth/services/auth';
import type { AuthenticatedUser } from '../../auth/types/auth';

interface StoreInformationData {
  id: number;
  store_id: number;
  business_name: string;
  business_description: string | null;
  address: string | null;
  contact_number: string | null;
  email: string | null;
  logo: string | null;
  receipt_thank_you_message: string | null;
  receipt_footer_message: string | null;
  operating_hours: string | null;
  currency: string | null;
  theme_color: string | null;
  tax_rate: number | string | null;
  service_charge_rate: number | string | null;
}

interface StoreInformationProps {
  currentUser: AuthenticatedUser | null;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  onUserUpdate: (updates: Partial<AuthenticatedUser>) => void;
  onStoreBrandUpdate: (brand: StoreBrand) => void;
  storeBrand?: StoreBrand;
}

const defaultStoreInfo: StoreInformationData = {
  id: 0,
  store_id: 0,
  business_name: 'Ukay Hub - Main Branch',
  business_description: 'Your one-stop shop for quality ukay-ukay finds! We offer affordable and stylish pre-loved items for the whole family.',
  address: '123 Sampaguita St., Barangay Guadalupe, Cebu City, Cebu, Philippines',
  contact_number: '0917 123 4567',
  email: 'ukayhub.main@gmail.com',
  logo: null,
  receipt_thank_you_message: 'Thank you for shopping with us!',
  receipt_footer_message: 'We appreciate your support. Come again!',
  operating_hours: 'Mon-Sun, 9:00 AM - 8:00 PM',
  currency: 'PHP',
  theme_color: '#10b981',
  tax_rate: 0,
  service_charge_rate: 0,
};

export function StoreInformation({ currentUser, onLogout, onNavigate, onUserUpdate, onStoreBrandUpdate, storeBrand }: StoreInformationProps) {
  const [storeInfo, setStoreInfo] = useState<StoreInformationData>(defaultStoreInfo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStoreInformation = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/admin/store-information?admin_user_id=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load store information.');
        }

        setStoreInfo(normalizeStoreInfo(data));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load store information.');
      } finally {
        setLoading(false);
      }
    };

    void loadStoreInformation();
  }, [currentUser?.id]);

  const currencySymbol = storeInfo.currency === 'PHP' ? 'PHP' : storeInfo.currency || 'PHP';

  const updateField = (field: keyof StoreInformationData, value: string | number | null) => {
    setStoreInfo((current) => ({ ...current, [field]: value }));
    setMessage('');
    setError('');
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField('logo', String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setError('No admin session was found.');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/store-information`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: currentUser.id,
          business_name: storeInfo.business_name,
          business_description: textOrNull(storeInfo.business_description),
          address: textOrNull(storeInfo.address),
          contact_number: textOrNull(storeInfo.contact_number),
          email: textOrNull(storeInfo.email),
          logo: storeInfo.logo,
          receipt_thank_you_message: textOrNull(storeInfo.receipt_thank_you_message),
          receipt_footer_message: textOrNull(storeInfo.receipt_footer_message),
          operating_hours: textOrNull(storeInfo.operating_hours),
          currency: textOrNull(storeInfo.currency),
          theme_color: textOrNull(storeInfo.theme_color),
          tax_rate: numberOrNull(storeInfo.tax_rate),
          service_charge_rate: numberOrNull(storeInfo.service_charge_rate),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to save store information.');
      }

      const normalized = normalizeStoreInfo(data);
      setStoreInfo(normalized);
      onUserUpdate({ store_name: normalized.business_name });
      onStoreBrandUpdate({ name: normalized.business_name, logo: normalized.logo });
      setMessage('Store information saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save store information.');
    } finally {
      setSaving(false);
    }
  };

  const logoPreview = storeInfo.logo ? (
    <img src={storeInfo.logo} alt={storeInfo.business_name} className="h-full w-full object-contain" />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center text-primary">
      <div className="text-3xl font-bold leading-none">UKAY</div>
      <div className="text-3xl font-bold leading-none">HUB</div>
    </div>
  );

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="store-information" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} />

      <div className="flex-1 overflow-auto bg-background">
        <main className="p-6">
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading store information...</div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <h2 className="text-lg text-primary">Business Information</h2>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  {(error || message) && (
                    <div className={`mb-5 rounded-lg border p-3 text-sm ${error ? 'border-destructive/20 bg-destructive/10 text-destructive' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                      {error || message}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Business Name <span className="text-red-500">*</span></label>
                      <input
                        value={storeInfo.business_name}
                        onChange={(event) => updateField('business_name', event.target.value)}
                        required
                        maxLength={150}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Business Description</label>
                      <textarea
                        value={storeInfo.business_description ?? ''}
                        onChange={(event) => updateField('business_description', event.target.value)}
                        rows={4}
                        className="w-full resize-y rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Logo</label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-border bg-white p-4">
                          {logoPreview}
                        </div>
                        <label className="flex h-36 min-w-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-6 text-center transition-colors hover:bg-muted/40">
                          <Upload className="mb-2 h-5 w-5 text-primary" />
                          <span className="text-sm font-medium text-primary">Click to upload logo</span>
                          <span className="mt-1 text-xs text-muted-foreground">PNG, JPG or SVG. Max size 2MB</span>
                          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => updateField('logo', null)}
                          className="self-end rounded-lg border border-border px-4 py-2 text-sm text-primary transition-colors hover:bg-muted"
                        >
                          <span className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Remove Logo</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <TextInput label="Contact Number" value={storeInfo.contact_number ?? ''} onChange={(value) => updateField('contact_number', value)} maxLength={50} />
                      <TextInput label="Email" type="email" value={storeInfo.email ?? ''} onChange={(value) => updateField('email', value)} maxLength={100} />
                    </div>

                    <TextInput label="Address" value={storeInfo.address ?? ''} onChange={(value) => updateField('address', value)} />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-5 text-lg text-primary">Receipt Settings</h2>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Thank You Message</label>
                      <textarea
                        value={storeInfo.receipt_thank_you_message ?? ''}
                        onChange={(event) => updateField('receipt_thank_you_message', event.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Footer Message</label>
                      <textarea
                        value={storeInfo.receipt_footer_message ?? ''}
                        onChange={(event) => updateField('receipt_footer_message', event.target.value)}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-5 text-lg text-primary">Store Settings</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextInput label="Operating Hours" value={storeInfo.operating_hours ?? ''} onChange={(value) => updateField('operating_hours', value)} maxLength={100} />
                    <TextInput label="Currency" value={storeInfo.currency ?? ''} onChange={(value) => updateField('currency', value.toUpperCase())} maxLength={20} />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-primary">Theme Color</label>
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={storeInfo.theme_color || '#10b981'}
                          onChange={(event) => updateField('theme_color', event.target.value)}
                          className="h-10 w-14 rounded-lg border border-border bg-input-background p-1"
                        />
                        <input
                          value={storeInfo.theme_color ?? ''}
                          onChange={(event) => updateField('theme_color', event.target.value)}
                          className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <NumberInput label="Tax Rate (%)" value={storeInfo.tax_rate ?? ''} onChange={(value) => updateField('tax_rate', value)} />
                    <NumberInput label="Service Charge Rate (%)" value={storeInfo.service_charge_rate ?? ''} onChange={(value) => updateField('service_charge_rate', value)} />
                  </div>
                </div>
              </section>

              <aside className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-lg text-primary">Receipt Preview</h2>
                  <p className="mt-2 text-sm text-muted-foreground">This is how your receipt header and footer will look.</p>

                  <div className="mt-5 bg-white p-6 text-primary shadow-lg">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center p-2">
                        {logoPreview}
                      </div>
                      <h3 className="font-semibold">{storeInfo.business_name}</h3>
                      <p className="mt-1 text-xs">{storeInfo.address}</p>
                      <p className="mt-1 text-xs">{storeInfo.contact_number} | {storeInfo.email}</p>
                      <p className="mt-1 text-xs">{storeInfo.operating_hours}</p>
                    </div>

                    <div className="my-4 border-t border-dashed border-border" />

                    <div className="flex justify-between text-xs">
                      <span>Date: May 31, 2026</span>
                      <span>Time: 10:30 AM</span>
                    </div>

                    <div className="my-4 border-t border-dashed border-border" />

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between font-medium">
                        <span>Item</span>
                        <span>Qty</span>
                        <span>Amount</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Oversized Shirt</span>
                        <span>1</span>
                        <span>{currencySymbol} 120.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Denim Pants</span>
                        <span>1</span>
                        <span>{currencySymbol} 250.00</span>
                      </div>
                    </div>

                    <div className="my-4 border-t border-dashed border-border" />

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span>Subtotal</span><span>{currencySymbol} 370.00</span></div>
                      <div className="flex justify-between"><span>Tax ({numberOrNull(storeInfo.tax_rate) ?? 0}%)</span><span>{currencySymbol} 0.00</span></div>
                      <div className="flex justify-between"><span>Service ({numberOrNull(storeInfo.service_charge_rate) ?? 0}%)</span><span>{currencySymbol} 0.00</span></div>
                      <div className="flex justify-between font-semibold"><span>TOTAL</span><span>{currencySymbol} 370.00</span></div>
                    </div>

                    <div className="my-4 border-t border-dashed border-border" />

                    <div className="text-center text-xs leading-6">
                      <p>{storeInfo.receipt_thank_you_message}</p>
                      <p>{storeInfo.receipt_footer_message}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
                  <div className="flex gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h3 className="font-medium">Important</h3>
                      <p className="mt-2 text-sm leading-6">
                        These values are saved in store_information and are used for store identity, printed receipts, POS settings, tax, and service charge calculations.
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">{label}</label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: string | number; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-primary">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        max="99.99"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function normalizeStoreInfo(data: Partial<StoreInformationData>): StoreInformationData {
  return {
    ...defaultStoreInfo,
    ...data,
    tax_rate: data.tax_rate ?? defaultStoreInfo.tax_rate,
    service_charge_rate: data.service_charge_rate ?? defaultStoreInfo.service_charge_rate,
  };
}

function numberOrNull(value: string | number | null) {
  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function textOrNull(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}
