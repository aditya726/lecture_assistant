import { useState } from "react";
import { Link } from "react-router-dom";
import { Chrome, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import AuthShell from "../components/AuthShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back", { description: "You are now signed in." });
    } catch (error) {
      toast.error("Unable to sign in", {
        description: error.response?.data?.detail || "Please verify your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      toast.error("Google sign-in failed", { description: "Please retry in a moment." });
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your lecture workspace."
      footer={
        <>
          New here?{" "}
          <Link to="/register" className="font-medium text-foreground hover:text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-9"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              className="pl-9"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
          <Chrome className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>
      </form>
    </AuthShell>
  );
}
