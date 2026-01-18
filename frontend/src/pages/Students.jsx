import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students/')
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Students</h2>
      <div className="grid gap-4">
        {students.length === 0 ? (
          <p className="text-muted-foreground">No students found</p>
        ) : (
          students.map((student) => (
            <div key={student.id} className="border rounded-lg p-4">
              <h3 className="font-semibold">{student.name}</h3>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
