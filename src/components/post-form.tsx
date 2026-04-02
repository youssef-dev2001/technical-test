'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'

// We define a minimal User type to replace 'any'
interface SimpleUser {
  id: string
  email?: string
}

export function PostForm({ user }: { user: SimpleUser | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    try {
      let attachment_url = null
      
      if (file) {
        // Enforce 5MB limit
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File must be less than 5MB")
        }
        
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('feedback-attachments')
          .upload(fileName, file)
          
        if (uploadError) throw uploadError
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('feedback-attachments')
          .getPublicUrl(fileName)
          
        attachment_url = publicUrl
      }

      const { error: insertError } = await supabase
        .from('posts')
        .insert({
          title,
          description,
          category,
          author_id: user.id,
          attachment_url
        })

      if (insertError) throw insertError

      // Success
      e.currentTarget.reset()
      setFile(null)
      router.refresh() // Refresh the page server component
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6 text-center text-muted-foreground">
          Please log in to submit feedback.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Suggest a feature, report a bug, or share an improvement.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="A brief summary..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category" 
                name="category" 
                required
                className="flex h-10 w-full rounded-md border border-input bg-background border-solid px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="feature">Feature Request</option>
                <option value="bug">Bug Report</option>
                <option value="improvement">Improvement</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment (Optional, max 5MB)</Label>
              <Input 
                id="attachment" 
                type="file" 
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Detail</Label>
              <Textarea 
                id="description" 
                name="description" 
                required 
                placeholder="Please provide more details..." 
                className="min-h-[100px]"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-destructive">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
