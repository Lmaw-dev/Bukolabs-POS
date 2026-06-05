import { useState, type FormEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Page, type StoreBrand } from '../App';
import type { AuthenticatedUser } from '../../auth/types/auth';

interface IngredientManagementProps {
  currentUser: AuthenticatedUser | null;
  storeBrand?: StoreBrand;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock: string;
}

const initialIngredients: Ingredient[] = [
  { id: 1, name: 'Rice', unit: 'kg', stock: '25' },
  { id: 2, name: 'Chicken', unit: 'kg', stock: '12' },
  { id: 3, name: 'Cooking Oil', unit: 'L', stock: '8' },
];

export function IngredientManagement({ currentUser, storeBrand, onLogout, onNavigate }: IngredientManagementProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [stock, setStock] = useState('');

  const reset = () => {
    setEditing(null);
    setName('');
    setUnit('');
    setStock('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (editing) {
      setIngredients((current) => current.map((item) => item.id === editing.id ? { ...item, name, unit, stock } : item));
      reset();
      return;
    }

    setIngredients((current) => [
      ...current,
      { id: Date.now(), name, unit, stock },
    ]);
    reset();
  };

  const edit = (ingredient: Ingredient) => {
    setEditing(ingredient);
    setName(ingredient.name);
    setUnit(ingredient.unit);
    setStock(ingredient.stock);
  };

  const remove = (ingredient: Ingredient) => {
    setIngredients((current) => current.filter((item) => item.id !== ingredient.id));
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="ingredient-management" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} />
      <div className="flex-1 overflow-auto bg-background">
        <main className="p-8">
          <div className="mb-6">
            <h1 className="text-primary mb-2">Ingredients</h1>
            <p className="text-muted-foreground">Manage ingredient names and stock units for restaurant menu setup.</p>
          </div>

          <form onSubmit={submit} className="mb-6 grid gap-4 rounded-lg border border-border bg-card p-6 shadow-sm md:grid-cols-[1fr_160px_160px_auto]">
            <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Ingredient name" className="rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            <input value={unit} onChange={(event) => setUnit(event.target.value)} required placeholder="Unit" className="rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            <input value={stock} onChange={(event) => setStock(event.target.value)} required placeholder="Stock" className="rounded-lg border border-border bg-input-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
            <button className="rounded-lg bg-primary px-5 py-2 text-primary-foreground hover:bg-primary/90">{editing ? 'Save' : 'Add'}</button>
          </form>

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Unit</th>
                  <th className="px-6 py-4 text-left">Stock</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient) => (
                  <tr key={ingredient.id} className="border-t border-border">
                    <td className="px-6 py-4">{ingredient.name}</td>
                    <td className="px-6 py-4">{ingredient.unit}</td>
                    <td className="px-6 py-4">{ingredient.stock}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => edit(ingredient)} className="rounded-lg border border-border px-3 py-1.5 text-primary"><Pencil className="h-4 w-4" /></button>
                        <button type="button" onClick={() => remove(ingredient)} className="rounded-lg border border-destructive/20 px-3 py-1.5 text-destructive"><Trash2 className="h-4 w-4" /></button>
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
