'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { FormSection } from '@/components/ui/FormSection';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { useToast } from '@/hooks/useToast';
import { postService } from '@/services/postService';
import { Post } from '@/types/post';

export default function EditPostPage() {
  const params = useParams();
  const idParam = params?.id as string;
  const isNew = idParam === 'new';
  const router = useRouter();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<Partial<Post>>({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    meta_title: '',
    meta_description: '',
    canonical_url: '',
    og_image: '',
    noindex: false,
    status: 'draft',
  });
  const [scheduleAt, setScheduleAt] = useState('');

  const load = useCallback(async () => {
    if (isNew) return;
    setIsLoading(true);
    try {
      const res = await postService.getAdminPost(Number(idParam));
      if (res.data) {
        setPost(res.data);
        if (res.data.scheduled_for) {
          const d = new Date(res.data.scheduled_for);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setScheduleAt(local);
        }
      }
    } catch {
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [idParam, isNew, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (isNew) {
        const res = await postService.create(post);
        toast.success('Post created');
        router.replace(`/admin/content/posts/${res.data.id}`);
      } else {
        await postService.update(Number(idParam), post);
        toast.success('Post saved');
        load();
      }
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground animate-pulse">Loading…</div>;
  }

  return (
    <PermissionGuard permission="manage-posts">
      <div className="space-y-6">
        <PageHeader
          title={isNew ? 'New post' : `Edit: ${post.title || 'Post'}`}
          description="Write content, SEO fields, then publish or schedule."
          breadcrumbs={[
            { label: 'Content' },
            { label: 'Posts', href: '/admin/content/posts' },
            { label: isNew ? 'New' : 'Edit' },
          ]}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" onClick={() => router.push('/admin/content/posts')}>
                Back
              </Button>
              <Button size="sm" type="button" isLoading={isSaving} onClick={save}>
                Save
              </Button>
            </div>
          }
        />

        <FormError message={error} />

        <FormSection title="Content">
          <Input
            label="Title"
            value={post.title || ''}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            required
          />
          <Input
            label="Slug"
            value={post.slug || ''}
            onChange={(e) => setPost({ ...post, slug: e.target.value })}
            hint="Leave blank on create to auto-generate."
          />
          <Textarea
            label="Excerpt"
            value={post.excerpt || ''}
            onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
            rows={2}
          />
          <Textarea
            label="Body (HTML allowlisted)"
            value={post.body || ''}
            onChange={(e) => setPost({ ...post, body: e.target.value })}
            rows={12}
          />
        </FormSection>

        <FormSection title="SEO">
          <Input
            label="Meta title"
            value={post.meta_title || ''}
            onChange={(e) => setPost({ ...post, meta_title: e.target.value })}
          />
          <Textarea
            label="Meta description"
            value={post.meta_description || ''}
            onChange={(e) => setPost({ ...post, meta_description: e.target.value })}
            rows={2}
          />
          <Input
            label="Canonical URL"
            value={post.canonical_url || ''}
            onChange={(e) => setPost({ ...post, canonical_url: e.target.value })}
          />
          <Input
            label="OG image URL"
            value={post.og_image || ''}
            onChange={(e) => setPost({ ...post, og_image: e.target.value })}
          />
          <Switch
            label="Noindex"
            description="Exclude from search engines even if published."
            checked={Boolean(post.noindex)}
            onChange={(v) => setPost({ ...post, noindex: v })}
          />
        </FormSection>

        {!isNew && (
          <FormSection title="Publishing" description={`Current status: ${post.status}`}>
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission="publish-posts">
                <Button
                  size="sm"
                  type="button"
                  onClick={async () => {
                    try {
                      await postService.publish(Number(idParam));
                      toast.success('Published');
                      load();
                    } catch {
                      toast.error('Publish failed');
                    }
                  }}
                >
                  Publish now
                </Button>
              </PermissionGuard>
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={async () => {
                  try {
                    await postService.archive(Number(idParam));
                    toast.success('Archived');
                    load();
                  } catch {
                    toast.error('Archive failed');
                  }
                }}
              >
                Archive
              </Button>
            </div>

            <PermissionGuard permission="publish-posts">
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <Input
                  label="Schedule for"
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
                <Button
                  size="sm"
                  type="button"
                  disabled={!scheduleAt}
                  onClick={async () => {
                    try {
                      await postService.schedule(
                        Number(idParam),
                        new Date(scheduleAt).toISOString(),
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      );
                      toast.success('Scheduled');
                      load();
                    } catch (err: unknown) {
                      toast.error(
                        (err as { response?: { data?: { message?: string } } })?.response?.data
                          ?.message || 'Schedule failed'
                      );
                    }
                  }}
                >
                  Schedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={async () => {
                    try {
                      await postService.unschedule(Number(idParam));
                      toast.success('Unscheduled');
                      setScheduleAt('');
                      load();
                    } catch {
                      toast.error('Unschedule failed');
                    }
                  }}
                >
                  Unschedule
                </Button>
              </div>
            </PermissionGuard>
          </FormSection>
        )}
      </div>
    </PermissionGuard>
  );
}
