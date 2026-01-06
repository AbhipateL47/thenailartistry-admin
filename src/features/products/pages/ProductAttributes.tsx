import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Loader2, Search, X } from 'lucide-react';
import {
  useAdminProductAttributes,
  useCreateProductAttribute,
  useUpdateProductAttribute,
  useDeleteProductAttribute,
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ProductAttribute,
} from '@/features/products/hooks/useAdminProductAttributes';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

export default function ProductAttributes() {
  const { data: attributes, isLoading } = useAdminProductAttributes();
  const createMutation = useCreateProductAttribute();
  const updateMutation = useUpdateProductAttribute();
  const deleteMutation = useDeleteProductAttribute();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAttribute, setDeletingAttribute] = useState<ProductAttribute | null>(null);

  // Form state for editing
  const [editingName, setEditingName] = useState('');
  const [editingSlug, setEditingSlug] = useState('');
  const [editingValues, setEditingValues] = useState<string[]>([]);
  const [newValueInput, setNewValueInput] = useState('');
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [editingOrder, setEditingOrder] = useState(0);

  // Filter attributes by search query
  const filteredAttributes = useMemo(() => {
    if (!attributes) return [];
    if (!searchQuery.trim()) return attributes;
    const query = searchQuery.toLowerCase();
    return attributes.filter(
      (attr) =>
        attr.name.toLowerCase().includes(query) ||
        attr.slug.toLowerCase().includes(query) ||
        attr.values.some((v) => v.toLowerCase().includes(query))
    );
  }, [attributes, searchQuery]);

  const handleSelectAttribute = (attribute: ProductAttribute) => {
    setSelectedAttribute(attribute);
    setEditingName(attribute.name);
    setEditingSlug(attribute.slug);
    setEditingValues([...attribute.values]);
    setEditingIsActive(attribute.isActive);
    setEditingOrder(attribute.order);
    setNewValueInput('');
  };

  const handleAddValue = () => {
    if (!newValueInput.trim()) return;
    const trimmed = newValueInput.trim();
    if (editingValues.includes(trimmed)) return; // Prevent duplicates
    setEditingValues([...editingValues, trimmed]);
    setNewValueInput('');
  };

  const handleRemoveValue = (valueToRemove: string) => {
    setEditingValues(editingValues.filter((v) => v !== valueToRemove));
  };

  const handleSaveChanges = async () => {
    if (!selectedAttribute || !editingName.trim() || editingValues.length === 0) {
      return;
    }

    const data: UpdateProductAttributeDto = {
      name: editingName.trim(),
      slug: editingSlug.trim() || undefined,
      values: editingValues,
      isActive: editingIsActive,
      order: editingOrder || 0,
    };

    try {
      await updateMutation.mutateAsync({ id: selectedAttribute._id, data });
      // Keep the attribute selected after update
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = (attribute: ProductAttribute) => {
    setDeletingAttribute(attribute);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingAttribute) return;

    try {
      await deleteMutation.mutateAsync(deletingAttribute._id);
      setIsDeleteDialogOpen(false);
      setDeletingAttribute(null);
      // Clear selection if deleted attribute was selected
      if (selectedAttribute?._id === deletingAttribute._id) {
        setSelectedAttribute(null);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCreateNew = () => {
    setSelectedAttribute(null);
    setEditingName('');
    setEditingSlug('');
    setEditingValues([]);
    setEditingIsActive(true);
    setEditingOrder(0);
    setNewValueInput('');
  };

  const handleCreate = async () => {
    if (!editingName.trim() || editingValues.length === 0) {
      return;
    }

    const data: CreateProductAttributeDto = {
      name: editingName.trim(),
      slug: editingSlug.trim() || undefined,
      values: editingValues,
      isActive: editingIsActive,
      order: editingOrder || 0,
    };

    try {
      const newAttribute = await createMutation.mutateAsync(data);
      // Select the newly created attribute
      if (newAttribute) {
        handleSelectAttribute(newAttribute);
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-foreground">Product Attributes</span>
          </nav>
          <h1 className="text-3xl font-semibold">Product Attributes</h1>
          <p className="text-muted-foreground mt-1">
            Manage product filter attributes (Length, Shape, Occasion, etc.)
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attribute List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search attributes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredAttributes && filteredAttributes.length > 0 ? (
                filteredAttributes.map((attribute) => (
                  <div
                    key={attribute._id}
                    onClick={() => handleSelectAttribute(attribute)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAttribute?._id === attribute._id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{attribute.name}</h3>
                          <Badge variant={attribute.isActive ? 'default' : 'secondary'} className="text-xs">
                            {attribute.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <code className="text-xs text-muted-foreground block mb-2">
                          {attribute.slug}
                        </code>
                        <div className="flex flex-wrap gap-1">
                          {attribute.values.slice(0, 3).map((value, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                          {attribute.values.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{attribute.values.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(attribute);
                          }}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    {searchQuery ? 'No attributes found matching your search.' : 'No attributes found. Create your first attribute to get started.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: Attribute Editor */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedAttribute ? `Edit: ${selectedAttribute.name}` : 'Create New Attribute'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Always show form - either for editing or creating */}
            <>
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="e.g., Occasion, Texture, Color"
                />
              </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (optional)</Label>
                  <Input
                    id="slug"
                    value={editingSlug}
                    onChange={(e) => setEditingSlug(e.target.value)}
                    placeholder="Auto-generated from name if empty"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-friendly identifier (e.g., occasion, texture, color)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Values <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    <Input
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue();
                        }
                      }}
                      placeholder="Add a value..."
                    />
                    <Button type="button" onClick={handleAddValue} disabled={!newValueInput.trim()}>
                      Add
                    </Button>
                  </div>
                  {editingValues.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingValues.map((value, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {value}
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(value)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  {editingValues.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Add at least one value for this attribute
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={editingIsActive}
                      onCheckedChange={setEditingIsActive}
                    />
                    <Label htmlFor="isActive" className="cursor-pointer">
                      Active
                    </Label>
                  </div>
                  <div className="space-y-2 w-32">
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={editingOrder}
                      onChange={(e) => setEditingOrder(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedAttribute ? (
                    <Button
                      onClick={handleSaveChanges}
                      disabled={updateMutation.isPending || !editingName.trim() || editingValues.length === 0}
                      className="flex-1"
                    >
                      {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreate}
                      disabled={createMutation.isPending || !editingName.trim() || editingValues.length === 0}
                      className="flex-1"
                    >
                      {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Attribute
                    </Button>
                  )}
                </div>
            </>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the attribute &quot;{deletingAttribute?.name}&quot;. This action
              cannot be undone. Products using this attribute will not be affected, but the
              attribute will no longer appear in filters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
