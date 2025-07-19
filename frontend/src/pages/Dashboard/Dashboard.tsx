import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Cloud,
  Security,
  Speed,
  AttachMoney,
} from '@mui/icons-material'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactElement
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'primary',
}) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        
        {change !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {change >= 0 ? (
              <TrendingUp color="success" sx={{ mr: 0.5 }} />
            ) : (
              <TrendingDown color="error" sx={{ mr: 0.5 }} />
            )}
            <Typography
              variant="body2"
              color={change >= 0 ? 'success.main' : 'error.main'}
            >
              {Math.abs(change)}% from last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

interface StatusItemProps {
  label: string
  status: 'healthy' | 'warning' | 'error'
  count?: number
}

const StatusItem: React.FC<StatusItemProps> = ({ label, status, count }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle />
      case 'warning':
      case 'error':
        return <Warning />
      default:
        return null
    }
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {getStatusIcon()}
        <Typography variant="body2" sx={{ ml: 1 }}>
          {label}
        </Typography>
      </Box>
      <Chip
        label={count || status}
        color={getStatusColor() as any}
        size="small"
        variant="outlined"
      />
    </Box>
  )
}

const Dashboard: React.FC = () => {
  const metrics = [
    {
      title: 'Active Resources',
      value: 247,
      change: 12,
      icon: <Cloud />,
      color: 'primary' as const,
    },
    {
      title: 'Monthly Cost',
      value: '$12,450',
      change: -8,
      icon: <AttachMoney />,
      color: 'success' as const,
    },
    {
      title: 'Security Score',
      value: '94%',
      change: 3,
      icon: <Security />,
      color: 'warning' as const,
    },
    {
      title: 'Performance',
      value: '99.8%',
      change: 0.2,
      icon: <Speed />,
      color: 'secondary' as const,
    },
  ]

  const systemStatus = [
    { label: 'Infrastructure Services', status: 'healthy' as const, count: 12 },
    { label: 'Deployment Pipelines', status: 'healthy' as const, count: 8 },
    { label: 'Security Policies', status: 'warning' as const, count: 2 },
    { label: 'Cost Alerts', status: 'error' as const, count: 1 },
  ]

  const recentActivity = [
    {
      id: 1,
      action: 'Deployment completed',
      resource: 'web-app-v2.1.0',
      timestamp: '5 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      action: 'Security scan completed',
      resource: 'prod-database',
      timestamp: '15 minutes ago',
      status: 'warning',
    },
    {
      id: 3,
      action: 'Cost threshold exceeded',
      resource: 'compute-cluster-01',
      timestamp: '1 hour ago',
      status: 'error',
    },
    {
      id: 4,
      action: 'Infrastructure provisioned',
      resource: 'staging-environment',
      timestamp: '2 hours ago',
      status: 'success',
    },
  ]

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Welcome back! Here's what's happening with your cloud infrastructure.
      </Typography>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard {...metric} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              {systemStatus.map((item, index) => (
                <StatusItem key={index} {...item} />
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box>
                {recentActivity.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor:
                          activity.status === 'success'
                            ? 'success.main'
                            : activity.status === 'warning'
                            ? 'warning.main'
                            : 'error.main',
                        mr: 2,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2">
                        {activity.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.resource} • {activity.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Resource Usage */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Usage
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">CPU Usage</Typography>
                      <Typography variant="body2">72%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={72} sx={{ mb: 2 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Memory Usage</Typography>
                      <Typography variant="body2">58%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={58} sx={{ mb: 2 }} />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Storage Usage</Typography>
                      <Typography variant="body2">84%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={84} sx={{ mb: 2 }} />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Dashboard