export default function Home() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Welcome to Your App</h2>
      <p className="text-muted-foreground">
        This is a full-stack application built with FastAPI, React, and AI integration.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Students</h3>
          <p className="text-sm text-muted-foreground">
            Manage student information stored in PostgreSQL
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">AI Chat</h3>
          <p className="text-sm text-muted-foreground">
            Chat with AI powered by Ollama
          </p>
        </div>
        <div className="border rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Texts</h3>
          <p className="text-sm text-muted-foreground">
            Store and manage text documents in MongoDB
          </p>
        </div>
      </div>
    </div>
  )
}
