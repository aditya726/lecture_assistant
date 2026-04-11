import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from './ui/card'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center justify-center gap-3 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Authenticating your session...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
