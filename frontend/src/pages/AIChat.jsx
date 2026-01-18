import { useState } from 'react'
import api from '../services/api'

export default function AIChat() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const result = await api.post('/ai/generate', { prompt })
      setResponse(result.data.response)
    } catch (error) {
      console.error('Error generating response:', error)
      setResponse('Error: Could not generate response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="text-3xl font-bold">AI Chat</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          className="w-full min-h-[100px] p-3 border rounded-lg"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Response'}
        </button>
      </form>
      {response && (
        <div className="border rounded-lg p-4 bg-muted">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  )
}
