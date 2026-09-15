# Guide: Adding New CRUD Modules

This guide walks you through creating a new domain module (e.g. `Projects`, `Products`, `Articles`, `Testimonials`) from backend database to frontend admin UI.

---

## 1. Backend (Laravel 12)

### Step 1: Create Migration & Model
```bash
cd backend
php artisan make:model Product -m
```

In `database/migrations/xxxx_create_products_table.php`:
```php
public function up(): void
{
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('slug')->unique();
        $table->text('description')->nullable();
        $table->decimal('price', 10, 2);
        $table->string('image')->nullable();
        $table->enum('status', ['active', 'draft', 'archived'])->default('active');
        $table->timestamps();
    });
}
```

In `app/Models/Product.php`:
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'image',
        'status',
    ];
}
```

### Step 2: Create Controller & Form Requests
```bash
php artisan make:controller Api/V1/Admin/ProductController
```

In `app/Http/Controllers/Api/V1/Admin/ProductController.php`:
```php
namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $products = $query->latest()->paginate($request->get('per_page', 15));
        return $this->paginatedResponse($products, 'Products retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'required|in:active,draft,archived',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . uniqid();
        $product = Product::create($validated);

        return $this->successResponse($product, 'Product created.', 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'sometimes|in:active,draft,archived',
        ]);

        $product->update($validated);
        return $this->successResponse($product, 'Product updated.');
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        return $this->successResponse(null, 'Product deleted.');
    }
}
```

### Step 3: Register API Routes
In `backend/routes/api.php`:
```php
Route::middleware(['auth:sanctum', 'permission:manage-products'])->group(function () {
    Route::apiResource('products', ProductController::class);
});
```

---

## 2. Frontend (Next.js 15+)

### Step 1: Define TypeScript Type
In `frontend/types/product.ts`:
```typescript
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  image?: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
}
```

### Step 2: Create API Service
In `frontend/services/productService.ts`:
```typescript
import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { Product } from '@/types/product';

export const productService = {
  getProducts(params?: { search?: string; status?: string; page?: number; per_page?: number }) {
    return apiClient
      .get<PaginatedResponse<Product>>('/api/v1/admin/products', { params })
      .then((res) => res.data);
  },
  createProduct(data: Partial<Product>) {
    return apiClient
      .post<ApiResponse<Product>>('/api/v1/admin/products', data)
      .then((res) => res.data);
  },
  updateProduct(id: number | string, data: Partial<Product>) {
    return apiClient
      .put<ApiResponse<Product>>(`/api/v1/admin/products/${id}`, data)
      .then((res) => res.data);
  },
  deleteProduct(id: number | string) {
    return apiClient
      .delete<ApiResponse<null>>(`/api/v1/admin/products/${id}`)
      .then((res) => res.data);
  },
};
```

### Step 3: Build Admin CRUD Page
Create `frontend/app/(admin)/admin/products/page.tsx` using starter components:
* `<PageHeader title="Products" />`
* `<FilterBar>` + `<SearchInput>`
* `<DataTable columns={columns} data={products} />`
* `<Pagination meta={meta} onPageChange={setPage} />`
* `<Modal>` with `<Input>`, `<ImagePicker>`, and `<Button>`
* `<ConfirmationDialog>` for deletion confirmation

### Step 4: Add Navigation Link
In `frontend/app/(admin)/layout.tsx`, add your new navigation item to `navItems`:
```typescript
{ label: 'Products', href: '/admin/products', icon: ShoppingBag },
```
