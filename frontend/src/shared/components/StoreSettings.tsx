import { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Page, type StoreBrand } from '../App';
import { getApiBaseUrl } from '../../auth/services/auth';
import type { AuthenticatedUser } from '../../auth/types/auth';

interface StoreSettingsProps {
  currentUser: AuthenticatedUser | null;
  storeBrand?: StoreBrand;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

type Settings = Record<string, boolean | number>;

const baseSettings = [
  ['enable_refund', 'Enable Refund'],
  ['enable_void', 'Enable Void'],
  ['enable_discount', 'Enable Discount'],
  ['enable_service_charge', 'Enable Service Charge'],
] as const;

const restaurantSettings = [
  ['enable_customer_recommendation', 'Enable Customer Recommendation'],
  ['enable_table_management', 'Enable Table Management'],
  ['enable_dine_in', 'Enable Dine-In'],
  ['enable_takeout', 'Enable Takeout'],
  ['enable_ingredient_customization', 'Enable Ingredient Customization'],
] as const;

const retailSettings = [
  ['enable_receipt_printing', 'Enable Receipt Printing'],
] as const;

export function StoreSettings({ currentUser, storeBrand, onLogout, onNavigate }: StoreSettingsProps) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isRestaurant = currentUser?.store_type === 'RESTAURANT';
  const visibleSettings = [...baseSettings, ...(isRestaurant ? restaurantSettings : retailSettings)];

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await fetch(`${getApiBaseUrl()}/admin/store-settings?admin_user_id=${currentUser.id}`);
        const data = await response.json();
        setSettings(data);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [currentUser?.id]);

  const save = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/store-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_user_id: currentUser.id, ...settings }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.message ?? 'Unable to save store settings.');
      setSettings(data);
      setMessage('Store settings saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="store-settings" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} />
      <div className="flex-1 overflow-auto bg-background">
        <main className="p-8">
          <div className="mb-6">
            <h1 className="text-primary mb-2">Store Settings</h1>
            <p className="text-muted-foreground">Control POS features for {currentUser?.store_name ?? 'this store'}.</p>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">{message}</div>}

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            {loading ? (
              <p className="text-muted-foreground">Loading settings...</p>
            ) : (
              <div className="space-y-5">
                {visibleSettings.map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <span className="font-medium">{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(settings[key])}
                      onChange={(event) => setSettings((current) => ({ ...current, [key]: event.target.checked }))}
                      className="h-5 w-5 accent-primary"
                    />
                  </label>
                ))}

                <div>
                  <label className="mb-2 block font-medium">Service Charge Percentage</label>
                  <input
                    type="number"
                    value={Number(settings.service_charge_percentage ?? 0)}
                    onChange={(event) => setSettings((current) => ({ ...current, service_charge_percentage: Number(event.target.value) }))}
                    className="w-full rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    min="0"
                    max="100"
                  />
                </div>

                <button onClick={save} disabled={saving} className="rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
