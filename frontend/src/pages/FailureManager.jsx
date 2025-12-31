import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertCircle, CheckCircle, Clock, X, Plus } from 'lucide-react'

const api = axios.create({ baseURL: '/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default function FailureManager() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState({ status: '', priority: '' })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    failure_type: 'Test Failure',
    priority: 'Medium',
    reproduction_steps: ''
  })

  const { data: failures } = useQuery({
    queryKey: ['failures', filter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.priority) params.append('priority', filter.priority)
      return api.get(`/failures?${params}`).then(res => res.data)
    },
    refetchInterval: 10000
  })

  const { data: stats } = useQuery({
    queryKey: ['failure-stats'],
    queryFn: () => api.get('/failures/stats').then(res => res.data),
    refetchInterval: 10000
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/failures', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['failures'])
      queryClient.invalidateQueries(['failure-stats'])
      setShowCreateForm(false)
      setFormData({ title: '', description: '', failure_type: 'Test Failure', priority: 'Medium', reproduction_steps: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/failures/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['failures'])
      queryClient.invalidateQueries(['failure-stats'])
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/failures/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['failures'])
      queryClient.invalidateQueries(['failure-stats'])
    }
  })

  const getPriorityBadge = (priority) => {
    const colors = {
      Critical: 'badge-danger',
      High: 'badge-warning',
      Medium: 'badge-info',
      Low: 'badge-secondary'
    }
    return colors[priority] || 'badge-secondary'
  }

  const getStatusIcon = (status) => {
    if (status === 'Resolved') return <CheckCircle size={16} color="#10b981" />
    if (status === 'In Progress') return <Clock size={16} color="#f59e0b" />
    return <AlertCircle size={16} color="#dc2626" />
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Failure Manager</h2>
        <button className="btn btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus size={16} style={{ display: 'inline', marginRight: '5px' }} />
          Create Failure
        </button>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Failures</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Open</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{stats.open}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.in_progress}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Resolved</div>
            <div className="stat-value" style={{ color: '#10b981' }}>{stats.resolved}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical</div>
            <div className="stat-value" style={{ color: '#dc2626' }}>{stats.by_priority.critical}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Priority</div>
            <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.by_priority.high}</div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">Create New Failure</div>
          <div className="form-group">
            <label>Title</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Brief description of the issue" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" placeholder="Detailed description" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Priority</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={formData.failure_type} onChange={(e) => setFormData({ ...formData, failure_type: e.target.value })}>
                <option>Test Failure</option>
                <option>Performance Issue</option>
                <option>Accessibility Violation</option>
                <option>Security Issue</option>
                <option>Bug</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Reproduction Steps</label>
            <textarea value={formData.reproduction_steps} onChange={(e) => setFormData({ ...formData, reproduction_steps: e.target.value })} rows="3" placeholder="Steps to reproduce the issue" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => createMutation.mutate(formData)} disabled={!formData.title}>
              Create Failure
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
          <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} style={{ padding: '8px 12px' }}>
            <option value="">All Status</option>
            <option>Open</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })} style={{ padding: '8px 12px' }}>
            <option value="">All Priorities</option>
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        {failures?.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <p>No failures found. All tests are passing!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}></th>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {failures?.map(failure => (
                <tr key={failure.id}>
                  <td>{getStatusIcon(failure.status)}</td>
                  <td>
                    <strong>{failure.title}</strong>
                    {failure.website_name && (
                      <><br /><small style={{ color: '#6b7280' }}>{failure.website_name}</small></>
                    )}
                  </td>
                  <td><small>{failure.failure_type}</small></td>
                  <td><span className={`badge ${getPriorityBadge(failure.priority)}`}>{failure.priority}</span></td>
                  <td>
                    <select
                      value={failure.status}
                      onChange={(e) => updateMutation.mutate({ id: failure.id, data: { status: e.target.value } })}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                    >
                      <option>Open</option>
                      <option>In Progress</option>
                      <option>Resolved</option>
                    </select>
                  </td>
                  <td><small style={{ color: '#6b7280' }}>{new Date(failure.created_at).toLocaleDateString()}</small></td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => { if (confirm('Delete this failure?')) deleteMutation.mutate(failure.id) }}
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
