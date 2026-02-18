import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { db } from '../lib/db';
import { useAuth } from '../lib/auth-context';
import type { Category, Asset } from '../lib/types';
import { toast } from 'sonner';

export function CategoriesPage() {
  const { company } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;

    const loadData = async () => {
      try {
        const [categoriesData, assetsData] = await Promise.all([
          db.getCategories(company.id),
          db.getAssets(company.id),
        ]);
        setCategories(categoriesData);
        setAssets(assetsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [company?.id]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('IT');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      companyId: 'company-1',
      name: newCategoryName,
      type: newCategoryType,
      parentId: null,
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryType('IT');
    setIsAdding(false);
    toast.success('Category added successfully');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
    toast.success('Category deleted successfully');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-2 text-gray-600">Organize your assets by categories</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Add Category Form */}
      {isAdding && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <select
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value)}
                className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="IT">IT Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Software">Software</option>
                <option value="Other">Other</option>
              </select>
              <Button onClick={handleAddCategory}>Add</Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          // Count assets in this category
          const assetCount = assets.filter((asset) => asset.categoryId === category.id).length;

          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <Badge className="mt-2 bg-blue-100 text-blue-700">{category.type}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {assetCount} {assetCount === 1 ? 'asset' : 'assets'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
