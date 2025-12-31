import { useState, useEffect } from 'react';
import api from '../services/api';
import { useProcessUpdates } from '../hooks/useRealtimeUpdates';
import './ProcessMonitor.css';

export default function ProcessMonitor() {
  const [processes, setProcesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, running, completed, failed

  // Real-time updates via WebSocket
  useProcessUpdates((data) => {
    // Update processes list
    setProcesses(prevProcesses => {
      const existingIndex = prevProcesses.findIndex(p => p.id === data.id);
      if (existingIndex >= 0) {
        // Update existing process
        const updated = [...prevProcesses];
        updated[existingIndex] = { ...updated[existingIndex], ...data };
        return updated;
      } else {
        // Add new process
        return [data, ...prevProcesses];
      }
    });

    // Refresh stats when process status changes
    if (data.status === 'completed' || data.status === 'failed') {
      fetchStats();
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    fetchStats();
  }, [filter]);

  const fetchProcesses = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      params.append('limit', 50);

      const response = await api.get(`/processes?${params}`);
      setProcesses(response.data);
    } catch (error) {
      console.error('Failed to fetch processes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/processes/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      running: 'status-running',
      completed: 'status-completed',
      failed: 'status-failed'
    };
    return badges[status] || 'status-default';
  };

  const getProcessIcon = (type) => {
    const icons = {
      smoke_test: '💨',
      performance_test: '⚡',
      pixel_audit: '🔍',
      load_test: '📊'
    };
    return icons[type] || '⚙️';
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress...';

    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end - start;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Loading processes...</div>;

  return (
    <div className="process-monitor">
      <div className="process-header">
        <h1>Process Monitor</h1>
        <p>Real-time tracking of test executions and processes</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card running">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <div className="stat-value">{stats.running}</div>
              <div className="stat-label">Running</div>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card failed">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
          </div>
          <div className="stat-card total">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        </div>
      )}

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'running' ? 'active' : ''}
          onClick={() => setFilter('running')}
        >
          Running ({stats?.running || 0})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
        <button
          className={filter === 'failed' ? 'active' : ''}
          onClick={() => setFilter('failed')}
        >
          Failed
        </button>
      </div>

      <div className="processes-grid">
        {processes.length === 0 ? (
          <div className="empty-state">No processes found</div>
        ) : (
          processes.map((process) => (
            <div key={process.id} className={`process-card ${process.status}`}>
              <div className="process-card-header">
                <div className="process-type">
                  <span className="process-icon">{getProcessIcon(process.process_type)}</span>
                  <span className="process-type-text">
                    {process.process_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <span className={`status-badge ${getStatusBadge(process.status)}`}>
                  {process.status}
                </span>
              </div>

              {process.metadata.website_name && (
                <div className="process-website">
                  <strong>Website:</strong> {process.metadata.website_name}
                </div>
              )}

              {process.metadata.url && (
                <div className="process-url">
                  <strong>URL:</strong> {process.metadata.url}
                </div>
              )}

              {process.status === 'running' && (
                <div className="progress-bar-container">
                  <div
                    className="progress-bar"
                    style={{ width: `${process.progress}%` }}
                  >
                    <span className="progress-text">{process.progress}%</span>
                  </div>
                </div>
              )}

              <div className="process-footer">
                <div className="process-time">
                  <span className="time-label">Started:</span>
                  <span className="time-value">{formatDate(process.started_at)}</span>
                </div>
                {process.completed_at && (
                  <div className="process-duration">
                    <span className="duration-label">Duration:</span>
                    <span className="duration-value">
                      {formatDuration(process.started_at, process.completed_at)}
                    </span>
                  </div>
                )}
                {process.metadata.error && (
                  <div className="process-error">
                    <strong>Error:</strong> {process.metadata.error}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
