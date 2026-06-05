import { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Page, type StoreBrand } from '../App';
import { getApiBaseUrl } from '../../auth/services/auth';
import type { AuthenticatedUser } from '../../auth/types/auth';
import { normalizeStoreSettings, useStoreSettings, type DiscountSetting, type StoreSettingValues } from '../context/StoreSettingsContext';

interface StoreSettingsProps {
  currentUser: AuthenticatedUser | null;
  storeBrand?: StoreBrand;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

type DiscountForm = {
  id: number | null;
  discount_name: string;
  discount_rate: number;
  is_enabled: boolean;
};

const restaurantSettings: Array<[keyof StoreSettingValues, string, string]> = [
  ['enable_customer_recommendation', 'Enable Customer Recommendation', 'Show previous-customer suggestions while staff types customer names.'],
  ['enable_table_management', 'Enable Table Management', 'Require and process table selection, status, assignment, and history for dine-in orders.'],
  ['enable_refund', 'Enable Refund', 'Show and allow refund processing.'],
  ['enable_void', 'Enable Void', 'Show and allow void transaction processing.'],
  ['enable_service_charge', 'Enable Service Charge', 'Show and include service charge in totals.'],
  ['enable_tax', 'Enable Tax', 'Show and include tax in totals.'],
  ['enable_discount', 'Enable Discount', 'Allow discount management and staff discount selection.'],
];

const retailSettings: Array<[keyof StoreSettingValues, string, string]> = [
  ['enable_refund', 'Enable Refund', 'Show and allow refund processing.'],
  ['enable_void', 'Enable Void', 'Show and allow void transaction processing.'],
  ['enable_service_charge', 'Enable Service Fee / Service Charge', 'Show and include service fee in totals.'],
  ['enable_tax', 'Enable Tax', 'Show and include tax in totals.'],
  ['enable_discount', 'Enable Discount', 'Allow discount management and staff discount selection.'],
];

const blankDiscountForm: DiscountForm = {
  id: null,
  discount_name: '',
  discount_rate: 0,
  is_enabled: true,
};

function SettingToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'left-6' : 'left-1'
        }`}
      />
    </button>
  );
}

export function StoreSettings({ currentUser, storeBrand, onLogout, onNavigate }: StoreSettingsProps) {
  const { settings: loadedSettings, discounts: loadedDiscounts, reload } = useStoreSettings();
  const [settings, setSettings] = useState<StoreSettingValues>(loadedSettings);
  const [discounts, setDiscounts] = useState<DiscountSetting[]>(loadedDiscounts);
  const [discountForm, setDiscountForm] = useState<DiscountForm>(blankDiscountForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isRestaurant = currentUser?.store_type === 'RESTAURANT';
  const visibleSettings = isRestaurant ? restaurantSettings : retailSettings;

  useEffect(() => {
    setSettings(loadedSettings);
  }, [loadedSettings]);

  useEffect(() => {
    setDiscounts(loadedDiscounts);
  }, [loadedDiscounts]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [currentUser?.id]);

  const saveSettings = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/store-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: currentUser.id,
          enable_customer_recommendation: settings.enable_customer_recommendation,
          enable_table_management: settings.enable_table_management,
          enable_refund: settings.enable_refund,
          enable_void: settings.enable_void,
          enable_service_charge: settings.enable_service_charge,
          service_charge_rate: settings.service_charge_rate,
          enable_tax: settings.enable_tax,
          tax_rate: settings.tax_rate,
          enable_discount: settings.enable_discount,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message ?? 'Unable to save store settings.');
      setSettings(normalizeStoreSettings(data));
      await reload();
      setMessage('Store settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save store settings.');
    } finally {
      setSaving(false);
    }
  };

  const saveDiscount = async () => {
    if (!currentUser?.id || !discountForm.discount_name.trim()) return;
    setSaving(true);
    setMessage('');

    try {
      const endpoint = discountForm.id
        ? `${getApiBaseUrl()}/admin/discount-settings/${discountForm.id}`
        : `${getApiBaseUrl()}/admin/discount-settings`;
      const response = await fetch(endpoint, {
        method: discountForm.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: currentUser.id,
          discount_name: discountForm.discount_name,
          discount_rate: discountForm.discount_rate,
          is_enabled: discountForm.is_enabled,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message ?? 'Unable to save discount.');
      setDiscountForm(blankDiscountForm);
      await reload();
      setMessage('Discount settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save discount.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDiscount = async (discount: DiscountSetting) => {
    if (!currentUser?.id || !window.confirm(`Delete ${discount.discount_name}?`)) return;
    setSaving(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/discount-settings/${discount.id}?admin_user_id=${currentUser.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message ?? 'Unable to delete discount.');
      await reload();
      setMessage('Discount deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete discount.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="store-settings" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} />
      <div className="flex-1 overflow-auto bg-background">
        <main className="p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-primary mb-2">Store Settings</h1>
              <p className="text-muted-foreground">Control POS features for {currentUser?.store_name ?? 'this store'}.</p>
            </div>
            <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">{message}</div>}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-semibold">{isRestaurant ? 'Restaurant POS Settings' : 'Retail Store Settings'}</h2>
              <p className="mb-5 text-sm text-muted-foreground">These settings are saved per store and applied to staff POS pages.</p>

              {loading ? (
                <p className="text-muted-foreground">Loading settings...</p>
              ) : (
                <div className="space-y-4">
                  {visibleSettings.map(([key, label, description]) => (
                    <div key={key} className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                      <span>
                        <span className="block font-medium">{label}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                      </span>
                      <SettingToggle
                        checked={Boolean(settings[key])}
                        onChange={(checked) => setSettings((current) => ({ ...current, [key]: checked }))}
                      />
                    </div>
                  ))}

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block rounded-lg border border-border p-4">
                      <span className="mb-2 block font-medium">Service Charge Rate (%)</span>
                      <input
                        type="number"
                        value={settings.service_charge_rate}
                        onChange={(event) => setSettings((current) => ({ ...current, service_charge_rate: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        max="100"
                        disabled={!settings.enable_service_charge}
                      />
                    </label>
                    <label className="block rounded-lg border border-border p-4">
                      <span className="mb-2 block font-medium">Tax Rate (%)</span>
                      <input
                        type="number"
                        value={settings.tax_rate}
                        onChange={(event) => setSettings((current) => ({ ...current, tax_rate: Number(event.target.value) }))}
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        max="100"
                        disabled={!settings.enable_tax}
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-semibold">Discount Settings</h2>
              <p className="mb-5 text-sm text-muted-foreground">Manage discount types and rates used by staff during checkout.</p>

              {settings.enable_discount ? (
                <>
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <input
                      value={discountForm.discount_name}
                      onChange={(event) => setDiscountForm((current) => ({ ...current, discount_name: event.target.value }))}
                      placeholder="Discount name"
                      className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <input
                        type="number"
                        value={discountForm.discount_rate}
                        onChange={(event) => setDiscountForm((current) => ({ ...current, discount_rate: Number(event.target.value) }))}
                        placeholder="Rate"
                        className="w-full rounded-lg border border-border bg-input-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        min="0"
                        max="100"
                      />
                      <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 text-sm">
                        <SettingToggle
                          checked={discountForm.is_enabled}
                          onChange={(checked) => setDiscountForm((current) => ({ ...current, is_enabled: checked }))}
                        />
                        <span>Enabled</span>
                      </label>
                    </div>
                    <button onClick={saveDiscount} disabled={saving || !discountForm.discount_name.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                      <Plus className="h-4 w-4" />
                      {discountForm.id ? 'Update Discount' : 'Add Discount'}
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {discounts.map((discount) => (
                      <div key={discount.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                        <div>
                          <p className="font-medium">{discount.discount_name}</p>
                          <p className="text-sm text-muted-foreground">{Number(discount.discount_rate).toFixed(2)}% · {discount.is_enabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setDiscountForm({ id: discount.id, discount_name: discount.discount_name, discount_rate: Number(discount.discount_rate), is_enabled: discount.is_enabled })} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" title="Edit discount">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => void deleteDiscount(discount)} className="rounded-md p-2 text-destructive hover:bg-destructive/10" title="Delete discount">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Discount management is hidden because discounts are disabled.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
