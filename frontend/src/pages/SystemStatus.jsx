import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../services/api'
import axios from 'axios'
import {
  Server, Database, Globe, Cloud, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Briefcase, Code2, Clock, Activity, Cpu
} from 'lucide-react'
import {
  TextShimmer,
  FadeText,
  ScrollReveal
} from '../components/ui'
import './SystemStatus.css'

export default function SystemStatus() {
  const [viewMode, setViewMode] = useState('executive')

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth().then(res => res.data),
    refetchInterval: 10000
  })

  const { data: testApiHealth, refetch: refetchTestApi } = useQuery({
    queryKey: ['test-api-health'],
    queryFn: async () => {
      try {
        const res = await axios.get('http://38.97.60.181:3003/api/health', { timeout: 5000 })
        return { status: 'healthy', ...res.data }
      } catch (error) {
        return { status: 'unhealthy', error: error.message }
      }
    },
    refetchInterval: 10000
  })

  // Calculate stats
  const stats = useMemo(() => {
    const services = [
      { status: health?.dashboard ? 'healthy' : 'unhealthy' },
      { status: health?.database ? 'healthy' : 'unhealthy' },
      { status: testApiHealth?.status === 'healthy' ? 'healthy' : 'unhealthy' }
    ]

    const total = services.length
    const healthy = services.filter(s => s.status === 'healthy').length
    const unhealthy = total - healthy
    const uptime = total > 0 ? Math.round((healthy / total) * 100) : 0

    return { total, healthy, unhealthy, uptime }
  }, [health, testApiHealth])

  const services = [
    {
      name: 'Dashboard Backend',
      description: 'Express API + SQLite',
      port: 3004,
      status: health?.dashboard ? 'healthy' : 'unhealthy',
      icon: Server
    },
    {
      name: 'Database',
      description: 'SQLite Database',
      status: health?.database ? 'healthy' : 'unhealthy',
      icon: Database
    },
    {
      name: 'Test API',
      description: 'Playwright + Lighthouse',
      port: 3003,
      status: testApiHealth?.status === 'healthy' ? 'healthy' : 'unhealthy',
      uptime: testApiHealth?.uptime,
      version: testApiHealth?.version,
      icon: Activity
    },
    {
      name: 'Playwright Service',
      description: 'Browser automation for tests',
      status: testApiHealth?.status === 'healthy' ? 'healthy' : 'unknown',
      icon: Globe
    },
    {
      name: 'Lighthouse Service',
      description: 'Performance & SEO auditing',
      status: testApiHealth?.status === 'healthy' ? 'healthy' : 'unknown',
      icon: Cpu
    }
  ]

  const handleRefresh = () => {
    refetch()
    refetchTestApi()
  }

  if (isLoading) {
    return <div className="loading">Checking system status...</div>
  }

  return (
    <div className="system-status-page">
      {/* Header */}
      <div className="page-header">
        <FadeText direction="down">
          <div>
            <TextShimmer className="title-shimmer">
              <h1>System Status</h1>
            </TextShimmer>
            <p>Monitor service health and availability</p>
          </div>
        </FadeText>
        <div className="header-actions">
          <div className="view-mode-toggle">
            <button
              onClick={() => setViewMode('executive')}
              className={`view-mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
            >
              <Briefcase size={16} />
              Executive
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`view-mode-btn ${viewMode === 'technical' ? 'active' : ''}`}
            >
              <Code2 size={16} />
              Technical
            </button>
          </div>
          <button onClick={handleRefresh} className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Executive View - KPIs */}
      {viewMode === 'executive' && (
        <div className="executive-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="kpi-grid">
              <div className="kpi-card primary">
                <div className="kpi-icon"><Server size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.total}</div>
                  <div className="kpi-label">Total Services</div>
                  <div className="kpi-meta">Monitored</div>
                </div>
              </div>
              <div className="kpi-card success">
                <div className="kpi-icon success"><CheckCircle size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.uptime}%</div>
                  <div className="kpi-label">Uptime</div>
                  <div className="kpi-meta">{stats.healthy} services healthy</div>
                </div>
                <div className="kpi-progress">
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${stats.uptime}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="kpi-card danger">
                <div className="kpi-icon danger"><XCircle size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">{stats.unhealthy}</div>
                  <div className="kpi-label">Issues</div>
                  <div className="kpi-meta">{stats.unhealthy > 0 ? 'Requires attention' : 'All clear'}</div>
                </div>
              </div>
              <div className="kpi-card info">
                <div className="kpi-icon info"><Clock size={24} /></div>
                <div className="kpi-content">
                  <div className="kpi-value">
                    {testApiHealth?.uptime ? Math.floor(testApiHealth.uptime / 3600) + 'h' : 'N/A'}
                  </div>
                  <div className="kpi-label">API Uptime</div>
                  <div className="kpi-meta">Since restart</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Technical View - Compact Stats */}
      {viewMode === 'technical' && (
        <div className="technical-view">
          <ScrollReveal delay={0.1} direction="up">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Services</div>
              </div>
              <div className="stat-card stat-success">
                <div className="stat-value">{stats.healthy}</div>
                <div className="stat-label">Healthy</div>
              </div>
              <div className="stat-card stat-failure">
                <div className="stat-value">{stats.unhealthy}</div>
                <div className="stat-label">Unhealthy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.uptime}%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Services Grid */}
      <ScrollReveal delay={0.2} direction="up">
        <div className="services-section">
          <h3>Services</h3>
          <div className="services-grid">
            {services.map((service) => {
              const ServiceIcon = service.icon
              return (
                <div key={service.name} className={`service-card ${service.status}`}>
                  <div className="service-header">
                    <div className={`service-icon ${service.status}`}>
                      <ServiceIcon size={24} />
                    </div>
                    <div className={`service-status-indicator ${service.status}`}>
                      {service.status === 'healthy' ? (
                        <CheckCircle size={18} />
                      ) : service.status === 'unhealthy' ? (
                        <XCircle size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>
                  </div>
                  <div className="service-content">
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <div className="service-details">
                      {service.port && (
                        <span className="detail-item">Port: {service.port}</span>
                      )}
                      {service.uptime && (
                        <span className="detail-item">Up: {(service.uptime / 3600).toFixed(1)}h</span>
                      )}
                      {service.version && (
                        <span className="detail-item">v{service.version}</span>
                      )}
                    </div>
                  </div>
                  <div className={`service-status-badge ${service.status}`}>
                    {service.status === 'healthy' ? 'Operational' :
                     service.status === 'unhealthy' ? 'Down' : 'Unknown'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Auto-refresh indicator */}
      <ScrollReveal delay={0.3} direction="up">
        <div className="refresh-indicator">
          <Clock size={16} />
          <span>Auto-refresh every 10 seconds</span>
        </div>
      </ScrollReveal>
    </div>
  )
}
