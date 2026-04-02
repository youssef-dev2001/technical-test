import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { signout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

export default async function Navbar() {
  const supabase = await createClient()
  
  // We get the user session
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is logged in, fetch their profile to get the username/full_name
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url')
      .eq('id', user.id)
      .single()
      
    profile = data
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-5xl flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold sm:inline-block">
            Feedback Board
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                  {profile?.full_name || profile?.username || user.email}
                </span>
                <form action={signout}>
                  <Button variant="outline" size="sm">Sign out</Button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
