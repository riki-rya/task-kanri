// app/projects/page.tsx
"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type Status = Database['public']['Tables']['status']['Row']

// 事前定義された色パターン
const COLOR_PRESETS = [
  { name: '青', color: '#3B82F6' },
  { name: '緑', color: '#10B981' },
  { name: '赤', color: '#EF4444' },
  { name: '黄', color: '#F59E0B' },
  { name: '紫', color: '#8B5CF6' },
  { name: 'ピンク', color: '#EC4899' },
  { name: 'オレンジ', color: '#F97316' },
  { name: '青緑', color: '#06B6D4' },
  { name: '灰', color: '#6B7280' },
  { name: '深緑', color: '#059669' },
  { name: '濃紫', color: '#7C3AED' },
  { name: '茶', color: '#A16207' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [statuses, setStatuses] = useState<Status[]>([])
  const [newProject, setNewProject] = useState({ name: '' })
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState({ name: '', color: '#3B82F6' })
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      fetchStatuses(selectedProjectId)
    }
  }, [selectedProjectId])

  async function fetchProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')

    if (error) {
      console.error('Error fetching projects:', error)
      return
    }

    setProjects(data || [])
  }

  async function fetchStatuses(projectId: string) {
    const { data, error } = await supabase
      .from('status')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')

    if (error) {
      console.error('Error fetching statuses:', error)
      return
    }

    setStatuses(data || [])
  }

  async function handleCreateProject() {
    if (!newProject.name) return

    const { data, error } = await supabase
      .from('projects')
      .insert({ project_name: newProject.name })
      .select()

    if (error) {
      console.error('Error creating project:', error)
      return
    }

    if (data) {
      setProjects([...projects, data[0]])
      setNewProject({ name: '' })
    }
  }

  async function handleUpdateProject() {
    if (!editingProject) return

    const { data, error } = await supabase
      .from('projects')
      .update({ project_name: editingProject.project_name })
      .eq('id', editingProject.id)
      .select()

    if (error) {
      console.error('Error updating project:', error)
      return
    }

    if (data) {
      setProjects(projects.map(p => p.id === editingProject.id ? data[0] : p))
      setEditingProject(null)
    }
  }

  async function handleDeleteProject(projectId: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return
    }

    setProjects(projects.filter(p => p.id !== projectId))
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null)
      setStatuses([])
    }
  }

  async function handleCreateStatus() {
    if (!newStatus.name || !selectedProjectId) return

    const maxSortOrder = Math.max(...statuses.map(s => s.order_index || 0), 0)
    
    const { data, error } = await supabase
      .from('status')
      .insert({
        project_id: selectedProjectId,
        status_name: newStatus.name,
        status_color: newStatus.color,
        order_index: maxSortOrder + 1
      })
      .select()

    if (error) {
      console.error('Error creating status:', error)
      return
    }

    if (data) {
      setStatuses([...statuses, data[0]])
      setNewStatus({ name: '', color: '#3B82F6' })
    }
  }

  async function handleUpdateStatus() {
    if (!editingStatus) return

    const { data, error } = await supabase
      .from('status')
      .update({
        status_name: editingStatus.status_name,
        status_color: editingStatus.status_color
      })
      .eq('id', editingStatus.id)
      .select()

    if (error) {
      console.error('Error updating status:', error)
      return
    }

    if (data) {
      setStatuses(statuses.map(s => s.id === editingStatus.id ? data[0] : s))
      setEditingStatus(null)
    }
  }

  async function handleDeleteStatus(statusId: string) {
    const { error } = await supabase
      .from('status')
      .delete()
      .eq('id', statusId)

    if (error) {
      console.error('Error deleting status:', error)
      return
    }

    setStatuses(statuses.filter(s => s.id !== statusId))
  }

  async function handleMoveStatus(statusId: string, direction: 'up' | 'down') {
    const currentIndex = statuses.findIndex(s => s.id === statusId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= statuses.length) return

    const newStatuses = [...statuses]
    const [movedStatus] = newStatuses.splice(currentIndex, 1)
    newStatuses.splice(newIndex, 0, movedStatus)

    const updates = newStatuses.map((status, index) => ({
      id: status.id,
      order_index: index + 1
    }))

    for (const update of updates) {
      await supabase
        .from('status')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    }

    if (selectedProjectId) {
      fetchStatuses(selectedProjectId)
    }
  }

  // 色選択コンポーネント
  const ColorSelector = ({ 
    value, 
    onChange, 
    label = "ステータスカラー" 
  }: { 
    value: string; 
    onChange: (color: string) => void; 
    label?: string 
  }) => (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((preset) => (
          <button
            key={preset.color}
            type="button"
            onClick={() => onChange(preset.color)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
              value === preset.color ? 'border-gray-600 scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: preset.color }}
            title={preset.name}
          >
            {value === preset.color && (
              <div className="w-3 h-3 rounded-full bg-white opacity-80"></div>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-sm text-gray-500">カスタム:</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-8 rounded border cursor-pointer"
        />
        <span className="text-sm font-mono text-gray-600">{value}</span>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">プロジェクト管理</h1>

      {/* Create/Edit Project Form */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-3">プロジェクト</h2>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="プロジェクト名"
            value={editingProject ? (editingProject.project_name || '') : newProject.name}
            onChange={(e) => 
              editingProject 
                ? setEditingProject({...editingProject, project_name: e.target.value}) 
                : setNewProject({...newProject, name: e.target.value})
            }
            className="border p-2 rounded flex-1"
          />
          
          {editingProject ? (
            <>
              <button 
                onClick={handleUpdateProject}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                更新
              </button>
              <button 
                onClick={() => setEditingProject(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </>
          ) : (
            <button 
              onClick={handleCreateProject}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              作成
            </button>
          )}
        </div>
      </div>

      {/* Projects List */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">プロジェクト一覧</h2>
        <div className="grid gap-2">
          {projects.map(project => (
            <div 
              key={project.id} 
              className={`border p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                selectedProjectId === project.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div>
                <h3 className="font-bold text-lg">{project.project_name || '無題のプロジェクト'}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingProject(project)
                  }}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  編集
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteProject(project.id)
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Management */}
      {selectedProjectId && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-3">
            ステータス管理 - {projects.find(p => p.id === selectedProjectId)?.project_name || '無題のプロジェクト'}
          </h2>
          
          {/* Create/Edit Status Form */}
          <div className="mb-4 p-4 border rounded bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ステータス名</label>
                <input
                  type="text"
                  placeholder="ステータス名"
                  value={editingStatus ? (editingStatus.status_name || '') : newStatus.name}
                  onChange={(e) => 
                    editingStatus 
                      ? setEditingStatus({...editingStatus, status_name: e.target.value}) 
                      : setNewStatus({...newStatus, name: e.target.value})
                  }
                  className="border p-2 rounded w-full"
                />
              </div>
              
              <div>
                <ColorSelector
                  value={editingStatus ? (editingStatus.status_color || '#3B82F6') : newStatus.color}
                  onChange={(color) => 
                    editingStatus 
                      ? setEditingStatus({...editingStatus, status_color: color}) 
                      : setNewStatus({...newStatus, color})
                  }
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {editingStatus ? (
                <>
                  <button 
                    onClick={handleUpdateStatus}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    更新
                  </button>
                  <button 
                    onClick={() => setEditingStatus(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleCreateStatus}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  作成
                </button>
              )}
            </div>
          </div>

          {/* Status List */}
          <div>
            <h3 className="font-semibold mb-2">ステータス一覧</h3>
            <div className="grid gap-2">
              {statuses.map((status, index) => (
                <div 
                  key={status.id} 
                  className="border p-3 rounded bg-white flex justify-between items-center"
                  style={{ borderLeftColor: status.status_color || '#3B82F6', borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: status.status_color || '#3B82F6' }}
                    ></div>
                    <span className="font-medium">{status.status_name || '無題のステータス'}</span>
                    <span className="text-sm text-gray-500">順序: {status.order_index}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleMoveStatus(status.id, 'up')}
                      disabled={index === 0}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => handleMoveStatus(status.id, 'down')}
                      disabled={index === statuses.length - 1}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 disabled:bg-gray-300"
                    >
                      ↓
                    </button>
                    <button 
                      onClick={() => setEditingStatus(status)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      編集
                    </button>
                    <button 
                      onClick={() => handleDeleteStatus(status.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}