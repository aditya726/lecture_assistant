import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import GlassCard from '../components/ui/GlassCard'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Chrome } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const { toast } = useToast()
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast({
        title: "Success!",
        description: "You've been logged in successfully.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.detail || "Invalid email or password",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate Google login",
      })
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#111315]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-[#d97757]/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#7ea389]/10 blur-3xl" />
      </div>
      <main className="relative flex items-center justify-center px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <GlassCard className="p-8">
            <div className="flex items-center justify-center mb-4">
              <div className="rounded-full border border-white/15 bg-white/5 p-3">
                <LogIn className="w-6 h-6 text-[#f0b39e]" />
              </div>
            </div>
            <h1 className="text-2xl text-center font-bold text-[#f4f1ed]">Welcome Back</h1>
            <p className="text-center text-[#ece3dc]/80 mt-1">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#ece3dc]/85" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#d0c2b7]/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 rounded-lg border border-white/15 bg-white/5 text-[#f4f1ed] placeholder-[#d0c2b7]/65 focus:ring-2 focus:ring-[#d97757]/35"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#ece3dc]/85" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#d0c2b7]/70" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 rounded-lg border border-white/15 bg-white/5 text-[#f4f1ed] placeholder-[#d0c2b7]/65 focus:ring-2 focus:ring-[#d97757]/35"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl bg-[#d97757] text-white hover:bg-[#bf6548]"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-[#d0c2b7]/70">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl border border-white/15 bg-white/5 text-[#f4f1ed] hover:bg-white/10"
              onClick={handleGoogleLogin}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>

            <div className="mt-6 text-sm text-center text-[#ece3dc]/80">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#f0b39e] hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  )
}
