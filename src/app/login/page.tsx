'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    // Simple validation
    if (!isLogin) {
      if (!formData.get('username') || !formData.get('full_name')) {
        setError("Username and Full Name are required for signup")
        setLoading(false)
        return
      }
    }

    const action = isLogin ? login : signup
    const result = await action(formData)
    
    if (result && !result.success) {
      setError(result.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{isLogin ? 'Welcome back' : 'Create an account'}</CardTitle>
          <CardDescription>
            {isLogin 
              ? 'Enter your email below to login to your account.' 
              : 'Enter your details below to create your account and start posting feedback.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" placeholder="johndoe" required={!isLogin} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" placeholder="John Doe" required={!isLogin} />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            
            {error && (
              <div className="text-sm font-medium text-destructive mt-2">
                {error}
              </div>
            )}
            
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign up'}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Login'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
