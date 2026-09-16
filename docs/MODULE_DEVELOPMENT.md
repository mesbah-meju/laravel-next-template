# Module Development Guide & Walkthrough

This guide provides a step-by-step tutorial on how to create a complete, modular feature for the Next.js + Laravel 12 starter. 

As an example, we will build a **Posts Module** (`posts`) with:
- Database migration and model with automated audit logging.
- Granular Spatie permissions.
- Form request validation and REST API controller.
- Frontend TypeScript types and API service.
- Server-side sorted and searchable `DataTable` with bulk actions and delete dialogs.
- Create/Edit modal form using `useApiForm` and `FormField`.
- Dynamic registration into the Sidebar, Dashboard Widgets, and Command Palette.

---

## Step 1: Database Migration & Eloquent Model

### 1.1 Create the Migration
Run:
```bash
php artisan make:migration create_posts_table
```
In `database/migrations/xxxx_xx_xx_create_posts_table.php`:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('summary')->nullable();
            $table->longText('content');
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### 1.2 Create the Eloquent Model with Activity Logging
In `app/Models/Post.php`:
```php
<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'summary',
        'content',
        'featured_image',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## Step 2: Permissions Definition

Add permissions into `database/seeders/RolePermissionSeeder.php`:
```php
$permissions = [
    // ... existing permissions
    'view-posts',
    'manage-posts',
];
```

Assign them to roles:
```php
$adminRole->givePermissionTo(['view-posts', 'manage-posts']);
```

---

## Step 3: Form Request & API Controller

### 3.1 Form Request
Create `app/Http/Requests/Admin/PostRequest.php`:
```php
<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $postId = $this->route('post')?->id ?? $this->input('id');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:posts,slug,' . $postId],
            'summary' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'featured_image' => ['nullable', 'string'],
            'status' => ['required', 'in:draft,published,archived'],
        ];
    }
}
```

### 3.2 API Controller
Create `app/Http/Controllers/Api/V1/Admin/PostController.php`:
```php
<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\PostRequest;
use App\Models\Post;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = Post::with('user:id,name,email');

        if ($search = $request->input('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortBy, $sortDirection);

        $posts = $query->paginate($request->input('per_page', 15));

        return $this->paginatedResponse($posts, 'Posts retrieved successfully.');
    }

    public function store(PostRequest $request): JsonResponse
    {
        $post = Post::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return $this->successResponse($post, 'Post created successfully.', 201);
    }

    public function show(Post $post): JsonResponse
    {
        return $this->successResponse($post->load('user:id,name'), 'Post retrieved successfully.');
    }

    public function update(PostRequest $request, Post $post): JsonResponse
    {
        $post->update($request->validated());

        return $this->successResponse($post, 'Post updated successfully.');
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return $this->successResponse(null, 'Post deleted successfully.');
    }
}
```

### 3.3 Register Backend Routes & Module
In `routes/api.php`:
```php
Route::middleware(['auth:sanctum', 'permission:manage-posts'])->prefix('admin/posts')->group(function () {
    Route::get('/', [PostController::class, 'index'])->middleware('permission:view-posts');
    Route::post('/', [PostController::class, 'store']);
    Route::get('{post}', [PostController::class, 'show'])->middleware('permission:view-posts');
    Route::put('{post}', [PostController::class, 'update']);
    Route::delete('{post}', [PostController::class, 'destroy']);
});
```

Register in `app/Providers/AppServiceProvider.php` (or module provider):
```php
use App\Support\ModuleRegistry;
use App\Models\Post;

ModuleRegistry::register('posts', [
    'name' => 'Blog & Posts',
    'permissions' => ['view-posts', 'manage-posts'],
    'stats' => fn() => [
        'total_posts' => Post::count(),
        'published_posts' => Post::where('status', 'published')->count(),
    ],
]);
```

---

## Step 4: Frontend Types & API Service

### 4.1 TypeScript Types (`frontend/types/post.ts`)
```typescript
export interface Post {
  id: number;
  user_id: number;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface PostFormData {
  title: string;
  slug: string;
  summary?: string;
  content: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
}
```

### 4.2 API Service (`frontend/services/postService.ts`)
```typescript
import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { Post, PostFormData } from '@/types/post';

export const postService = {
  getPosts(params?: Record<string, any>) {
    return apiClient
      .get<PaginatedResponse<Post>>('/api/v1/admin/posts', { params })
      .then((res) => res.data);
  },

  getPost(id: number) {
    return apiClient
      .get<ApiResponse<Post>>(`/api/v1/admin/posts/${id}`)
      .then((res) => res.data);
  },

  createPost(data: PostFormData) {
    return apiClient
      .post<ApiResponse<Post>>('/api/v1/admin/posts', data)
      .then((res) => res.data);
  },

  updatePost(id: number, data: PostFormData) {
    return apiClient
      .put<ApiResponse<Post>>(`/api/v1/admin/posts/${id}`, data)
      .then((res) => res.data);
  },

  deletePost(id: number) {
    return apiClient
      .delete<ApiResponse<null>>(`/api/v1/admin/posts/${id}`)
      .then((res) => res.data);
  },
};
```

---

## Step 5: Frontend CRUD Page with `DataTable`

In `frontend/app/(admin)/admin/posts/page.tsx`:
```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, FileText, CheckCircle, Clock } from 'lucide-react';
import { postService } from '@/services/postService';
import { Post, PostFormData } from '@/types/post';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { DataTable, Column } from '@/components/admin/DataTable';
import { DeleteDialog } from '@/components/admin/DeleteDialog';
import { Modal } from '@/components/admin/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useApiForm } from '@/hooks/useApiForm';
import { useToast } from '@/hooks/useToast';
import { formatDate } from '@/lib/utils';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);

  const toast = useToast();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await postService.getPosts({
        page,
        per_page: perPage,
        search,
        sort_by: sortBy,
        sort_direction: sortDirection,
      });
      setPosts(res.data);
      setTotal(res.meta.total);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, sortBy, sortDirection, toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Form handling using useApiForm
  const { values, setValues, errors, isSubmitting, handleSubmit, resetForm } = useApiForm<PostFormData>({
    initialValues: {
      title: '',
      slug: '',
      summary: '',
      content: '',
      featured_image: '',
      status: 'draft',
    },
    onSubmit: async (formValues) => {
      if (editingPost) {
        await postService.updatePost(editingPost.id, formValues);
      } else {
        await postService.createPost(formValues);
      }
      setIsModalOpen(false);
      resetForm();
      fetchPosts();
    },
    successTitle: editingPost ? 'Post Updated' : 'Post Created',
    successMessage: editingPost ? 'Changes have been saved.' : 'New post published successfully.',
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: Post) => {
    setEditingPost(post);
    setValues({
      title: post.title,
      slug: post.slug,
      summary: post.summary || '',
      content: post.content,
      featured_image: post.featured_image || '',
      status: post.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletePostId) return;
    try {
      await postService.deletePost(deletePostId);
      toast.success('Post Deleted', 'Article removed successfully.');
      setDeletePostId(null);
      fetchPosts();
    } catch {
      toast.error('Delete Failed');
    }
  };

  const columns: Column<Post>[] = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (post) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{post.title}</p>
          <p className="text-[11px] text-gray-400">/{post.slug}</p>
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (post) => post.user?.name || 'System',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (post) => <StatusBadge status={post.status} />,
    },
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      render: (post) => formatDate(post.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (post) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(post)}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeletePostId(post.id)}>
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="manage-posts">
      <div className="space-y-6">
        <PageHeader
          title="Posts & Articles"
          description="Manage blog posts, draft publications, and rich content."
          actions={
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-1.5" /> New Post
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={posts}
          isLoading={isLoading}
          totalItems={total}
          currentPage={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          searchQuery={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={(key, dir) => {
            setSortBy(key);
            setSortDirection(dir);
          }}
          enableSelection
          exportFileName="posts_export.csv"
        />

        {/* Create / Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPost ? 'Edit Post' : 'Create New Post'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Title" error={errors.title} required>
              <Input
                value={values.title}
                onChange={(e) => setValues({ ...values, title: e.target.value })}
                placeholder="Article title..."
              />
            </FormField>

            <FormField label="URL Slug" error={errors.slug} required>
              <Input
                value={values.slug}
                onChange={(e) => setValues({ ...values, slug: e.target.value })}
                placeholder="article-url-slug"
              />
            </FormField>

            <FormField label="Featured Image" error={errors.featured_image}>
              <MediaPicker
                value={values.featured_image}
                onChange={(url) => setValues({ ...values, featured_image: url })}
              />
            </FormField>

            <FormField label="Summary" error={errors.summary}>
              <Textarea
                rows={2}
                value={values.summary}
                onChange={(e) => setValues({ ...values, summary: e.target.value })}
                placeholder="Brief summary for previews..."
              />
            </FormField>

            <FormField label="Content" error={errors.content} required>
              <Textarea
                rows={6}
                value={values.content}
                onChange={(e) => setValues({ ...values, content: e.target.value })}
                placeholder="Write article markdown or body text..."
              />
            </FormField>

            <FormField label="Status" error={errors.status} required>
              <Select
                value={values.status}
                onChange={(e) => setValues({ ...values, status: e.target.value as any })}
                options={[
                  { label: 'Draft', value: 'draft' },
                  { label: 'Published', value: 'published' },
                  { label: 'Archived', value: 'archived' },
                ]}
              />
            </FormField>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <SubmitButton isLoading={isSubmitting} label={editingPost ? 'Save Changes' : 'Create Post'} size="sm" />
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation */}
        <DeleteDialog
          isOpen={deletePostId !== null}
          onClose={() => setDeletePostId(null)}
          onConfirm={handleDelete}
          title="Delete Post"
          description="Are you sure you want to permanently delete this post? This action cannot be undone."
        />
      </div>
    </PermissionGuard>
  );
}
```

---

## Step 6: Plug-and-Play Module Registration

In your module configuration file (e.g. `frontend/modules/posts.ts`):
```typescript
import { moduleRegistry } from '@/lib/moduleRegistry';
import { FileText } from 'lucide-react';

moduleRegistry.register({
  id: 'posts',
  name: 'Blog Posts',
  navItems: [
    {
      label: 'Blog Posts',
      href: '/admin/posts',
      icon: FileText,
      permission: 'manage-posts',
    },
  ],
  commandItems: [
    {
      id: 'cmd-posts',
      title: 'Manage Blog Posts',
      category: 'Content',
      icon: FileText,
      href: '/admin/posts',
      permission: 'manage-posts',
    },
  ],
});
```

And that's it! Your new module is fully integrated with **automatic RBAC, audit logging, unified validation, responsive dark/light themes, and full command palette accessibility**.
