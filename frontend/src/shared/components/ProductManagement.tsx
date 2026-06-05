import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Page, type StoreBrand } from '../App';
import { getApiBaseUrl } from '../../auth/services/auth';
import type { AuthenticatedUser } from '../../auth/types/auth';

interface ProductManagementProps {
  currentUser: AuthenticatedUser | null;
  storeBrand?: StoreBrand;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number | null;
  category_name: string | null;
  name: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  meal_type: string | null;
  preparation_time_minutes: number | null;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  size: string | null;
  color: string | null;
  stock_quantity: number | null;
  low_stock_limit: number | null;
  is_available: boolean;
}

const emptyProduct = {
  category_id: '',
  name: '',
  description: '',
  price: '',
  image_url: '',
  meal_type: '',
  preparation_time_minutes: '',
  sku: '',
  barcode: '',
  unit: '',
  size: '',
  color: '',
  stock_quantity: '0',
  low_stock_limit: '5',
  is_available: true,
};

export function ProductManagement({ currentUser, storeBrand, onLogout, onNavigate }: ProductManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(emptyProduct);
  const [message, setMessage] = useState('');
  const isRestaurant = currentUser?.store_type === 'RESTAURANT';

  const setField = (field: string, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const load = async () => {
    if (!currentUser?.id) return;
    const [categoryResponse, productResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/admin/categories?admin_user_id=${currentUser.id}`),
      fetch(`${getApiBaseUrl()}/admin/products?admin_user_id=${currentUser.id}`),
    ]);
    setCategories(await categoryResponse.json());
    setProducts(await productResponse.json());
  };

  useEffect(() => {
    void load();
  }, [currentUser?.id]);

  const reset = () => {
    setEditing(null);
    setForm(emptyProduct);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser?.id) return;

    const body = {
      admin_user_id: currentUser.id,
      category_id: form.category_id ? Number(form.category_id) : null,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      image_url: form.image_url || null,
      meal_type: form.meal_type || null,
      preparation_time_minutes: form.preparation_time_minutes ? Number(form.preparation_time_minutes) : null,
      sku: form.sku || null,
      barcode: form.barcode || null,
      unit: form.unit || null,
      size: form.size || null,
      color: form.color || null,
      stock_quantity: Number(form.stock_quantity || 0),
      low_stock_limit: Number(form.low_stock_limit || 5),
      is_available: Boolean(form.is_available),
    };

    const response = await fetch(`${getApiBaseUrl()}/admin/products${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data?.message ?? 'Unable to save product.');
      return;
    }

    await load();
    reset();
    setMessage('Product saved.');
  };

  const edit = (product: Product) => {
    setEditing(product);
    setForm({
      category_id: product.category_id ? String(product.category_id) : '',
      name: product.name,
      description: product.description ?? '',
      price: String(product.price ?? ''),
      image_url: product.image_url ?? '',
      meal_type: product.meal_type ?? '',
      preparation_time_minutes: product.preparation_time_minutes ? String(product.preparation_time_minutes) : '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      unit: product.unit ?? '',
      size: product.size ?? '',
      color: product.color ?? '',
      stock_quantity: String(product.stock_quantity ?? 0),
      low_stock_limit: String(product.low_stock_limit ?? 5),
      is_available: product.is_available,
    });
  };

  const remove = async (product: Product) => {
    if (!currentUser?.id || !window.confirm(`Delete ${product.name}?`)) return;
    await fetch(`${getApiBaseUrl()}/admin/products/${product.id}?admin_user_id=${currentUser.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="product-management" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} />
      <div className="flex-1 overflow-auto bg-background">
        <main className="p-8">
          <div className="mb-6">
            <h1 className="text-primary mb-2">Temporary Products</h1>
            <p className="text-muted-foreground">Add products for POS testing until the inventory API is integrated.</p>
          </div>

          {message && <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm">{message}</div>}

          <form onSubmit={submit} className="mb-6 rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <input value={String(form.name)} onChange={(event) => setField('name', event.target.value)} required placeholder="Product name" className="rounded-lg border border-border bg-input-background px-4 py-2" />
              <select value={String(form.category_id)} onChange={(event) => setField('category_id', event.target.value)} className="rounded-lg border border-border bg-input-background px-4 py-2">
                <option value="">No category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <input type="number" value={String(form.price)} onChange={(event) => setField('price', event.target.value)} required placeholder="Price" className="rounded-lg border border-border bg-input-background px-4 py-2" />
              <input value={String(form.description)} onChange={(event) => setField('description', event.target.value)} placeholder="Description" className="rounded-lg border border-border bg-input-background px-4 py-2 md:col-span-2" />
              <input value={String(form.image_url)} onChange={(event) => setField('image_url', event.target.value)} placeholder="Image URL" className="rounded-lg border border-border bg-input-background px-4 py-2" />

              {isRestaurant ? (
                <>
                  <input value={String(form.meal_type)} onChange={(event) => setField('meal_type', event.target.value)} placeholder="Meal type" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input type="number" value={String(form.preparation_time_minutes)} onChange={(event) => setField('preparation_time_minutes', event.target.value)} placeholder="Preparation minutes" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                </>
              ) : (
                <>
                  <input value={String(form.sku)} onChange={(event) => setField('sku', event.target.value)} placeholder="SKU" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input value={String(form.barcode)} onChange={(event) => setField('barcode', event.target.value)} placeholder="Barcode" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input value={String(form.unit)} onChange={(event) => setField('unit', event.target.value)} placeholder="Unit" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input value={String(form.size)} onChange={(event) => setField('size', event.target.value)} placeholder="Size" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input value={String(form.color)} onChange={(event) => setField('color', event.target.value)} placeholder="Color" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input type="number" value={String(form.stock_quantity)} onChange={(event) => setField('stock_quantity', event.target.value)} placeholder="Stock quantity" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                  <input type="number" value={String(form.low_stock_limit)} onChange={(event) => setField('low_stock_limit', event.target.value)} placeholder="Low stock limit" className="rounded-lg border border-border bg-input-background px-4 py-2" />
                </>
              )}
            </div>

            <label className="mt-4 flex items-center gap-2">
              <input type="checkbox" checked={Boolean(form.is_available)} onChange={(event) => setField('is_available', event.target.checked)} className="h-5 w-5 accent-primary" />
              Available
            </label>

            <div className="mt-5 flex gap-3">
              <button className="rounded-lg bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90">{editing ? 'Save Product' : 'Add Product'}</button>
              {editing && <button type="button" onClick={reset} className="rounded-lg border border-border px-5 py-2">Cancel</button>}
            </div>
          </form>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Category</th>
                  <th className="px-6 py-4 text-left">Price</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-t border-border">
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">{product.category_name ?? '-'}</td>
                    <td className="px-6 py-4">₱ {Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">{product.is_available ? 'Available' : 'Unavailable'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => edit(product)} className="rounded-lg border border-border px-3 py-1.5 text-primary"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => remove(product)} className="rounded-lg border border-destructive/20 px-3 py-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
