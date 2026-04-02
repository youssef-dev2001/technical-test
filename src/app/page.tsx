import { createClient } from "@/lib/supabase/server"
import { PostForm } from "@/components/post-form"
import { PostList } from "@/components/post-list"

export default async function Home() {
  const supabase = await createClient()
  
  // Get current user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch posts with author profiles
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (
        username,
        full_name
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Feedback Board</h1>
        <p className="text-lg text-muted-foreground">
          Help us improve our product. See what others are saying, suggest new ideas, and track our progress.
        </p>
      </div>

      <PostForm user={user} />
      
      <div className="pt-8 border-t">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Recent Feedback</h2>
        <PostList initialPosts={posts || []} user={user} />
      </div>
    </div>
  )
}
