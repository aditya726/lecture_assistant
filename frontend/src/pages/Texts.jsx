import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Texts() {
  const [texts, setTexts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTexts()
  }, [])

  const fetchTexts = async () => {
    try {
      const response = await api.get('/texts/')
      setTexts(response.data)
    } catch (error) {
      console.error('Error fetching texts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Text Documents</h2>
      <div className="grid gap-4">
        {texts.length === 0 ? (
          <p className="text-muted-foreground">No documents found</p>
        ) : (
          texts.map((text) => (
            <div key={text._id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{text.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{text.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
