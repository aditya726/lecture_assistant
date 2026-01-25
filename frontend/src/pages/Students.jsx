import { useState, useEffect } from 'react'
import api from '../services/api'
import GlassCard from '../components/ui/GlassCard'
import { motion } from 'framer-motion'

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

  if (loading) return <div className="text-white/80">Loading...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold text-white">Students</h2>
      <div className="grid gap-4">
        {students.length === 0 ? (
          <p className="text-white/70">No students found</p>
        ) : (
          students.map((student) => (
            <GlassCard key={student.id} className="p-4">
              <h3 className="font-semibold text-white">{student.name}</h3>
              <p className="text-sm text-white/70">{student.email}</p>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  )
}
