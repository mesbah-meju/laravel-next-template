# Module Development Guide

This guide details how to build and integrate modular features into the **Next.js + Laravel 12 Enterprise Starter Template**.

The starter is built on a loosely coupled, registry-driven architecture. Future modules (e.g. `Blog`, `E-Commerce`, `CRM`, `Project Management`) integrate cleanly with core platform services without modifying core application code.

---

## 1. Directory Structure Conventions

Recommended layout for creating a new module (e.g. `Blog`):

```text
backend/app/
├── Models/
│   └── Post.php
├── Http/
│   ├── Controllers/Api/V1/
│   │   └── PostController.php
│   └── Requests/
│       └── StorePostRequest.php
├── Services/
│   └── PostService.php
└── Providers/
    └── PostServiceProvider.php

frontend/
├── app/(admin)/admin/posts/
│   ├── page.tsx            # Main DataTable view
│   ├── create/page.tsx     # Post creation form
│   └── [id]/edit/page.tsx  # Post edit form
├── services/
│   └── postService.ts      # API client
└── types/
    └── post.ts             # TypeScript definitions
```

---

## 2. Role-Based Access Control (RBAC) & Permissions

### Registering Permissions in Database Seeders
Add your module's permissions in `database/seeders/RolePermissionSeeder.php` or a module-specific seeder:

```php
$permissions = [
    'view-posts',
    'create-posts',
    'edit-posts',
    'delete-posts',
    'export-posts',
    'import-posts',
];

foreach ($permissions as $perm) {
    Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']);
}
```

### Authorizing in Laravel Controllers
```php
public function __construct()
{
    $this->middleware('permission:view-posts')->only(['index', 'show']);
    $this->middleware('permission:create-posts')->only(['store']);
    $this->middleware('permission:edit-posts')->only(['update']);
    $this->middleware('permission:delete-posts')->only(['destroy']);
}
```

### Frontend Permission Guard
Wrap admin buttons or pages in `<PermissionGuard>`:

```tsx
import { PermissionGuard } from '@/components/admin/PermissionGuard';

<PermissionGuard permission="create-posts">
  <Button onClick={handleCreate}>Add New Post</Button>
</PermissionGuard>
```

---

## 3. Generic Import / Export Engine

### Registering an Importer
Register your importer in `AppServiceProvider::boot()` or a module service provider:

```php
use App\Services\ImportExport\ImportRegistry;

ImportRegistry::register([
    'key' => 'posts',
    'label' => 'Blog Posts',
    'permission' => 'import-posts',
    'model' => \App\Models\Post::class,
    'fields' => [
        [
            'key' => 'title',
            'label' => 'Post Title',
            'required' => true,
            'rules' => ['required', 'string', 'max:255'],
            'aliases' => ['post_title', 'headline', 'name'],
        ],
        [
            'key' => 'slug',
            'label' => 'URL Slug',
            'required' => false,
            'rules' => ['nullable', 'string', 'max:255'],
            'aliases' => ['permalink'],
        ],
        [
            'key' => 'content',
            'label' => 'Body Content',
            'required' => true,
            'rules' => ['required', 'string'],
        ],
    ],
    'processor' => function(array $row, $user) {
        return \App\Models\Post::create([
            'title' => $row['title'],
            'slug' => $row['slug'] ?? \Illuminate\Support\Str::slug($row['title']),
            'content' => $row['content'],
            'author_id' => $user->id,
        ]);
    },
]);
```

### Registering an Exporter
```php
use App\Services\ImportExport\ExportRegistry;

ExportRegistry::register([
    'key' => 'posts',
    'label' => 'Blog Posts',
    'permission' => 'export-posts',
    'query' => function($request) {
        return \App\Models\Post::query()->with('author');
    },
    'columns' => [
        ['key' => 'id', 'label' => 'ID'],
        ['key' => 'title', 'label' => 'Title'],
        ['key' => 'slug', 'label' => 'Slug'],
        ['key' => 'author.name', 'label' => 'Author'],
        ['key' => 'created_at', 'label' => 'Created At', 'transform' => fn($val) => $val?->toIso8601String()],
    ],
]);
```

---

## 4. Reusable Bulk Action Engine

### Backend Registration
Register actions in `BulkActionRegistry`:

```php
use App\Services\BulkAction\BulkActionRegistry;

BulkActionRegistry::register('posts', [
    [
        'key' => 'publish',
        'label' => 'Publish Selected',
        'permission' => 'edit-posts',
        'handler' => function(array $ids, $user) {
            \App\Models\Post::whereIn('id', $ids)->update(['status' => 'published']);
            return ['status' => 'success', 'affected' => count($ids)];
        },
    ],
    [
        'key' => 'delete',
        'label' => 'Delete Selected',
        'permission' => 'delete-posts',
        'requires_confirmation' => true,
        'handler' => function(array $ids, $user) {
            \App\Models\Post::whereIn('id', $ids)->delete();
            return ['status' => 'success', 'affected' => count($ids)];
        },
    ],
]);
```

### Frontend Integration with `<DataTable>`
```tsx
const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

<DataTable
  columns={columns}
  data={posts}
  selectable
  selectedIds={selectedIds}
  onSelectRow={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
  onSelectAll={(all) => setSelectedIds(all ? posts.map(p => p.id) : [])}
  bulkActions={
    <BulkActionMenu
      resource="posts"
      selectedIds={selectedIds}
      onSuccess={() => {
        setSelectedIds([]);
        fetchPosts();
      }}
    />
  }
/>
```

---

## 5. Email & Notification Templates

### Registering Whitelisted Templates
Register template blueprints and allowed variables in `TemplateRegistry`:

```php
use App\Services\Templates\TemplateRegistry;

TemplateRegistry::register([
    'key' => 'POST_PUBLISHED',
    'name' => 'Post Published Notification',
    'description' => 'Dispatched to subscribers when a new article is published.',
    'allowed_variables' => [
        'post_title' => 'Title of the published post',
        'post_url' => 'Public URL of the article',
        'author_name' => 'Author full name',
        'app_name' => 'Application name',
    ],
    'default_email_subject' => 'New Post: {{post_title}}',
    'default_email_body' => '<p>Hello,</p><p>A new post <strong>{{post_title}}</strong> has been published by {{author_name}}.</p><p><a href="{{post_url}}">Read Article</a></p>',
    'default_notification_message' => 'New article "{{post_title}}" published by {{author_name}}.',
]);
```

### Dispatching Semantic Notifications
```php
use App\Services\Templates\TemplateParser;
use App\Models\NotificationTemplate;

$template = NotificationTemplate::where('key', 'POST_PUBLISHED')->where('is_active', true)->first();

if ($template) {
    $variables = [
        'post_title' => $post->title,
        'post_url' => url('/blog/' . $post->slug),
        'author_name' => $post->author->name,
        'app_name' => config('app.name'),
    ];

    $rendered = TemplateParser::parseNotification($template, $variables);

    // Send Database Notification
    $subscriber->notify(new GenericDatabaseNotification($rendered['title'], $rendered['message']));
}
```

---

## 6. Advanced SEO & Metadata Foundation

### Next.js Public Page SEO (`buildPageMetadata`)
Use the App Router helper `buildPageMetadata` from `@/lib/seo`:

```tsx
import { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/seo/JsonLd';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  return buildPageMetadata({
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    canonicalPath: `/blog/${post.slug}`,
    ogImage: post.featured_image_url,
    ogType: 'article',
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image_url,
    datePublished: post.created_at,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
  };

  return (
    <article className="prose dark:prose-invert max-w-4xl mx-auto py-12">
      <JsonLd data={articleSchema} />
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

### Registering Sitemap Providers
Register dynamic URL endpoints for the automated sitemap index in `SitemapRegistry`:

```php
use App\Services\SEO\SitemapRegistry;

SitemapRegistry::register('posts', function() {
    return \App\Models\Post::where('status', 'published')
        ->select(['slug', 'updated_at'])
        ->get()
        ->map(fn($p) => [
            'url' => url('/blog/' . $p->slug),
            'lastmod' => $p->updated_at->toIso8601String(),
            'changefreq' => 'weekly',
            'priority' => 0.8,
        ])
        ->toArray();
});
```

---

## 7. Dynamic Breadcrumbs

In your Next.js admin page, use the `useBreadcrumbs` hook to provide custom dynamic labels:

```tsx
'use client';

import { useEffect } from 'react';
import { useBreadcrumbs } from '@/providers/BreadcrumbProvider';

export default function EditPostPage({ params }: { params: { id: string } }) {
  const { setDynamicLabel } = useBreadcrumbs();

  useEffect(() => {
    // When post data loads, replace the generic ID with the actual title:
    setDynamicLabel(`/admin/posts/${params.id}`, 'How to Build SaaS with Next.js');
  }, [params.id, setDynamicLabel]);

  return <div>Post Editor</div>;
}
```

---

## 8. Activity & Audit Logging

Audit sensitive actions via `ActivityLogService`:

```php
use App\Services\ActivityLogService;

ActivityLogService::log(
    action: 'posts.published',
    description: "Published blog post: {$post->title}",
    subject: $post,
    properties: ['post_id' => $post->id, 'slug' => $post->slug]
);
```

---

## 9. Menu Builder Integration

To add your module into the sidebar:
1. Navigate to **Admin → Content Management → Menu Builder**.
2. Select the `admin-sidebar` menu.
3. Add a new item pointing to `/admin/posts`, select an icon (e.g. `FileText`), and assign the `view-posts` permission.
4. Save and the sidebar will update dynamically for authorized users.
