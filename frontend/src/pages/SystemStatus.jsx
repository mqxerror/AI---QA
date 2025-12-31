import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../services/api'
import axios from 'axios'
import { CheckCircle, XCircle, Clock, Server, Database, Activity } from 'lucide-react'

function SystemStatus() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth().then(res => res.data),
    refetchInterval: 5000
  })

  const { data: testApiHealth } = useQuery({
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

  if (isLoading) return <div className="loading">Loading...</div>

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
      description: 'SQLite',
      status: health?.database ? 'healthy' : 'unhealthy',
      icon: Database
    },
    {
      name: 'Test API',
      description: 'Playwright + Lighthouse on Mercan',
      port: 3003,
      status: testApiHealth?.status === 'healthy' ? 'healthy' : 'unhealthy',
      uptime: testApiHealth?.uptime,
      version: testApiHealth?.version,
      icon: Activity
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '700' }}>
        System Status
      </h2>

      <div style={{ display: 'grid', gap: '20px' }}>
        {services.map((service, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                background: service.status === 'healthy' ? '#dcfce7' : '#fee2e2'
              }}>
                <service.icon
                  size={24}
                  color={service.status === 'healthy' ? '#16a34a' : '#dc2626'}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    {service.name}
                  </h3>
                  {service.status === 'healthy' ? (
                    <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <CheckCircle size={14} />
                      Healthy
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <XCircle size={14} />
                      Unhealthy
                    </span>
                  )}
                </div>

                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                  {service.description}
                </p>

                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                  {service.port && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Port: </span>
                      <strong>{service.port}</strong>
                    </div>
                  )}
                  {service.uptime && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Uptime: </span>
                      <strong>{(service.uptime / 3600).toFixed(2)}h</strong>
                    </div>
                  )}
                  {service.version && (
                    <div>
                      <span style={{ color: '#6b7280' }}>Version: </span>
                      <strong>{service.version}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">Service Details</div>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Last Check</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dashboard Backend</td>
              <td><code>http://localhost:3004/api</code></td>
              <td>
                <span className={`badge badge-${health?.dashboard ? 'success' : 'danger'}`}>
                  {health?.dashboard ? 'Running' : 'Down'}
                </span>
              </td>
              <td><small style={{ color: '#6b7280' }}>{new Date().toLocaleTimeString()}</small></td>
            </tr>
            <tr>
              <td>SQLite Database</td>
              <td><code>./database/qa-tests.db</code></td>
              <td>
                <span className={`badge badge-${health?.database ? 'success' : 'danger'}`}>
                  {health?.database ? 'Connected' : 'Error'}
                </span>
              </td>
              <td><small style={{ color: '#6b7280' }}>{new Date().toLocaleTimeString()}</small></td>
            </tr>
            <tr>
              <td>Test API (Mercan)</td>
              <td><code>http://38.97.60.181:3003/api</code></td>
              <td>
                <span className={`badge badge-${testApiHealth?.status === 'healthy' ? 'success' : 'danger'}`}>
                  {testApiHealth?.status === 'healthy' ? 'Running' : 'Down'}
                </span>
              </td>
              <td><small style={{ color: '#6b7280' }}>{new Date().toLocaleTimeString()}</small></td>
            </tr>
            <tr>
              <td>Playwright Service</td>
              <td><code>Embedded in Test API</code></td>
              <td>
                <span className={`badge badge-${testApiHealth?.status === 'healthy' ? 'success' : 'warning'}`}>
                  {testApiHealth?.status === 'healthy' ? 'Available' : 'Unknown'}
                </span>
              </td>
              <td><small style={{ color: '#6b7280' }}>{new Date().toLocaleTimeString()}</small></td>
            </tr>
            <tr>
              <td>Lighthouse Service</td>
              <td><code>Embedded in Test API</code></td>
              <td>
                <span className={`badge badge-${testApiHealth?.status === 'healthy' ? 'success' : 'warning'}`}>
                  {testApiHealth?.status === 'healthy' ? 'Available' : 'Unknown'}
                </span>
              </td>
              <td><small style={{ color: '#6b7280' }}>{new Date().toLocaleTimeString()}</small></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={20} color="#2563eb" />
          <div>
            <strong style={{ color: '#1e40af' }}>Auto-refresh: </strong>
            <span style={{ color: '#3b82f6' }}>Every 5 seconds</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStatus
