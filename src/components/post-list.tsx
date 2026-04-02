'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

type Post = {
  id: string
  title: string
  description: string
  category: 'bug' | 'feature' | 'improvement'
  status: 'open' | 'in_progress' | 'closed'
  attachment_url: string | null
  created_at: string
  author_id: string
  profiles: {
    full_name: string
    username: string
  } | null
}

interface SimpleUser {
  id: string
}

export function PostList({ initialPosts, user }: { initialPosts: Post[], user: SimpleUser | null }) {
  const [filter, setFilter] = useState<string>('all')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel('realtime posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const filteredPosts = initialPosts
    .filter(p => filter === 'all' || p.category === filter)
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sort === 'desc' ? dateB - dateA : dateA - dateB
    })

  async function handleDelete(id: string, attachmentUrl: string | null) {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    setDeletingId(id)
    try {
      // 1. Delete attachment if exists
      if (attachmentUrl) {
        const urlObj = new URL(attachmentUrl)
        const pathParts = urlObj.pathname.split('/')
        // Extract fileName (everything after the bucket name)
        const bucketIndex = pathParts.findIndex(p => p === 'feedback-attachments')
        if (bucketIndex !== -1 && pathParts.length > bucketIndex + 1) {
          const fileName = pathParts.slice(bucketIndex + 1).join('/')
          await supabase.storage.from('feedback-attachments').remove([fileName])
        }
      }

      // 2. Delete post row
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
      
      router.refresh()
    } catch {
      alert("Failed to delete post")
    } finally {
      setDeletingId(null)
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase.from('posts').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      router.refresh()
    } catch {
      alert("Failed to update status")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter:</span>
          <select 
            className="h-9 rounded-md border border-input bg-background border-solid px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="feature">Feature Requests</option>
            <option value="bug">Bug Reports</option>
            <option value="improvement">Improvements</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort:</span>
          <select 
            className="h-9 rounded-md border border-input bg-background border-solid px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={sort}
            onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl bg-card border-dashed">
            No feedback posts found.
          </div>
        ) : (
          filteredPosts.map(post => {
            const isOwner = user?.id === post.author_id
            
            return (
              <Card key={post.id} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={post.category as any} className="capitalize">
                          {post.category}
                        </Badge>
                        <Badge variant={post.status === 'open' ? 'secondary' : post.status === 'in_progress' ? 'default' : 'outline'} className="capitalize ml-2">
                          Status: {post.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto sm:ml-4">
                          By {post.profiles?.full_name || post.profiles?.username || 'Unknown'} • {formatDistanceToNow(new Date(post.created_at))} ago
                        </span>
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <select 
                          className="h-8 rounded-md border border-input bg-background border-solid px-2 text-xs focus:outline-none focus:ring-1"
                          value={post.status}
                          onChange={(e) => updateStatus(post.id, e.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="closed">Closed</option>
                        </select>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="h-8"
                          disabled={deletingId === post.id}
                          onClick={() => handleDelete(post.id, post.attachment_url)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-2">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed mb-4">{post.description}</p>
                  
                  {post.attachment_url && (
                    <div className="mt-4 border rounded-md p-2 bg-muted/10">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Attachment:</p>
                      {post.attachment_url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                        <div className="relative max-h-64 overflow-hidden rounded border w-fit">
                          <img 
                            src={post.attachment_url} 
                            alt="Attachment preview" 
                            className="max-w-full md:max-w-md max-h-64 object-contain"
                          />
                        </div>
                      ) : (
                        <a 
                          href={post.attachment_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline underline-offset-4"
                        >
                          📎 View File Document
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
