import { Link } from 'react-router-dom'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">FastAPI + React App</h1>
            <div className="flex gap-4">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/students" className="hover:underline">Students</Link>
              <Link to="/ai-chat" className="hover:underline">AI Chat</Link>
              <Link to="/texts" className="hover:underline">Texts</Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
