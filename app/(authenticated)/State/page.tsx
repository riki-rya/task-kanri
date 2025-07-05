// app/states/page.tsx (Similar structure for States)
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'

type State = Database['public']['Tables']['status']['Row']
type Project = Database['public']['Tables']['projects']['Row']

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [newState, setNewState] = useState({ name: '', project_id: '' })
  const [editingState, setEditingState] = useState<State | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
    fetchStates()
  }, [])

  async function fetchProjects() {
    const { data, error } = await supabase.from('project_t').select('*')
    if (error) {
      console.error('Error fetching projects:', error)
      return
    }
    setProjects(data || [])
  }

  async function fetchStates() {
    const { data, error } = await supabase
      .from('state_t')
      .select('*, project_t(name)')

    if (error) {
      console.error('Error fetching states:', error)
      return
    }

    setStates(data || [])
  }

  async function handleCreateState() {
    if (!newState.name || !newState.project_id) return

    const { data, error } = await supabase
      .from('state_t')
      .insert(newState)
      .select('*, project_t(name)')

    if (error) {
      console.error('Error creating state:', error)
      return
    }

    if (data) {
      setStates([...states, data[0]])
      setNewState({ name: '', project_id: '' })
    }
  }

  async function handleUpdateState() {
    if (!editingState) return

    const { data, error } = await supabase
      .from('state_t')
      .update(editingState)
      .eq('id', editingState.id)
      .select('*, project_t(name)')

    if (error) {
      console.error('Error updating state:', error)
      return
    }

    if (data) {
      setStates(states.map(s => s.id === editingState.id ? data[0] : s))
      setEditingState(null)
    }
  }

  async function handleDeleteState(stateId: string) {
    const { error } = await supabase
      .from('state_t')
      .delete()
      .eq('id', stateId)

    if (error) {
      console.error('Error deleting state:', error)
      return
    }

    setStates(states.filter(s => s.id !== stateId))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Project States</h1>

      {/* Create/Edit State Form */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="State Name"
          value={editingState ? editingState.status_name : newState.name}
          onChange={(e) => 
            editingState 
              ? setEditingState({...editingState, status_name: e.target.value}) 
              : setNewState({...newState, name: e.target.value})
          }
          className="border p-2 mr-2"
        />
        <select
          value={editingState ? editingState.project_id || '' : newState.project_id || ''}
          onChange={(e) => 
            editingState 
              ? setEditingState({...editingState, project_id: e.target.value}) 
              : setNewState({...newState, project_id: e.target.value})
          }
          className="border p-2 mr-2"
        >
          <option value="">Select Project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.project_name}
            </option>
          ))}
        </select>

        {editingState ? (
          <>
            <button 
              onClick={handleUpdateState}
              className="bg-blue-500 text-white p-2 mr-2"
            >
              Update State
            </button>
            <button 
              onClick={() => setEditingState(null)}
              className="bg-gray-500 text-white p-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <button 
            onClick={handleCreateState}
            className="bg-green-500 text-white p-2"
          >
            Create State
          </button>
        )}
      </div>

      {/* States List */}
      <div>
        {states.map(state => (
          <div 
            key={state.id} 
            className="border p-2 mb-2 flex justify-between items-center"
          >
            <div>
              <h2 className="font-bold">{state.status_name}</h2>
              <p>Project: {state.project_id ? `Project ID: ${state.project_id}` : 'No Project'}</p>
            </div>
            <div>
              <button 
                onClick={() => setEditingState(state)}
                className="bg-yellow-500 text-white p-1 mr-2"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeleteState(state.id)}
                className="bg-red-500 text-white p-1"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
