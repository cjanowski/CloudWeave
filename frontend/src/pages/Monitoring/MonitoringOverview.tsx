import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'healthy' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactElement
}

interface Alert {
  id: string
  title: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: string
  resource: string
  status: 'active' | 'resolved'
}

const MonitoringOverview: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h')

  const systemMetrics: SystemMetric[] = [
    {
      name: 'CPU Usage',
      value: 72,
      unit: '%',
      status: 'warning',
      trend: 'up',
      icon: <SpeedIcon />,
    },
    {
      name: 'Memory Usage',
      value: 58,
      unit: '%',
      status: 'healthy',
      trend: 'stable',
      icon: <MemoryIcon />,
    },
    {
      name: 'Disk Usage',
      value: 84,
      unit: '%',
      status: 'critical',
      trend: 'up',
      icon: <StorageIcon />,
    },
    {
      name: 'Network I/O',
      value: 45,
      unit: 'MB/s',
      status: 'healthy',
      trend: 'down',
      icon: <NetworkIcon />,
    },
  ]

  const alerts: Alert[] = [
    {
      id: '1',
      title: 'High CPU usage on prod-server-01',
      severity: 'critical',
      timestamp: '5 minutes ago',
      resource: 'prod-server-01',
      status: 'active',
    },
    {
      id: '2',
      title: 'Disk space running low on database server',
      severity: 'warning',
      timestamp: '15 minutes ago',
      resource: 'db-server-main',
      status: 'active',
    },
    {
      id: '3',
      title: 'SSL certificate expires in 7 days',
      severity: 'warning',
      timestamp: '1 hour ago',
      resource: 'web-app.example.com',
      status: 'active',
    },
    {
      id: '4',
      title: 'Load balancer health check failed',
      severity: 'critical',
      timestamp: '2 hours ago',
      resource: 'load-balancer-main',
      status: 'resolved',
    },
  ]

  // Sample data for charts
  const cpuData = [
    { time: '00:00', value: 45 },
    { time: '00:15', value: 52 },
    { time: '00:30', value: 48 },
    { time: '00:45', value: 61 },
    { time: '01:00', value: 72 },
  ]

  const memoryData = [
    { time: '00:00', value: 55 },
    { time: '00:15', value: 58 },
    { time: '00:30', value: 56 },
    { time: '00:45', value: 59 },
    { time: '01:00', value: 58 },
  ]

  const networkData = [
    { time: '00:00', inbound: 25, outbound: 18 },
    { time: '00:15', inbound: 32, outbound: 22 },
    { time: '00:30', inbound: 28, outbound: 19 },
    { time: '00:45', inbound: 35, outbound: 25 },
    { time: '01:00', inbound: 30, outbound: 20 },
  ]

  const resourceDistribution = [
    { name: 'Web Servers', value: 35, color: '#8884d8' },
    { name: 'Databases', value: 25, color: '#82ca9d' },
    { name: 'Load Balancers', value: 15, color: '#ffc658' },
    { name: 'Storage', value: 25, color: '#ff7300' },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'warning':
        return 'warning'
      case 'critical':
        return 'error'
      default:
        return 'default'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
      default:
        return 'default'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />
      case 'warning':
        return <WarningIcon color="warning" />
      case 'info':
        return <CheckCircleIcon color="info" />
      default:
        return <CheckCircleIcon />
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Monitoring Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor system performance, metrics, and alerts across your infrastructure
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="15m">15 minutes</MenuItem>
              <MenuItem value="1h">1 hour</MenuItem>
              <MenuItem value="6h">6 hours</MenuItem>
              <MenuItem value="24h">24 hours</MenuItem>
              <MenuItem value="7d">7 days</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
          >
            Configure
          </Button>
        </Box>
      </Box>

      {/* System Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {systemMetrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: `${getStatusColor(metric.status)}.main`, mr: 1 }}>
                    {metric.icon}
                  </Box>
                  <Typography variant="h6">{metric.name}</Typography>
                </Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {metric.value}{metric.unit}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={metric.status}
                    size="small"
                    color={getStatusColor(metric.status) as any}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} {metric.trend}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={metric.value}
                  color={getStatusColor(metric.status) as any}
                  sx={{ mt: 2, height: 6, borderRadius: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* CPU Usage Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Network Traffic Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Traffic
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="inbound" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="outbound" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={resourceDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {resourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Active Alerts</Typography>
                <Chip
                  label={alerts.filter(a => a.status === 'active').length}
                  size="small"
                  color="error"
                  sx={{ ml: 2 }}
                />
              </Box>
              
              {alerts.filter(a => a.status === 'active').length > 0 ? (
                <List>
                  {alerts.filter(a => a.status === 'active').map((alert, index) => (
                    <ListItem key={alert.id} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: `${getSeverityColor(alert.severity)}.light` }}>
                          {getSeverityIcon(alert.severity)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.title}
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Resource: {alert.resource} • {alert.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  No active alerts. All systems are running normally.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MonitoringOverview