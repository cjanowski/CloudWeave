import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
} from '@mui/material'
import {
  RocketLaunch as DeployIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material'

interface Pipeline {
  id: string
  name: string
  status: 'success' | 'failed' | 'running' | 'pending'
  lastDeployment: string
  environment: string
  branch: string
  progress?: number
}

interface Deployment {
  id: string
  pipeline: string
  version: string
  environment: string
  status: 'success' | 'failed' | 'running' | 'pending'
  startTime: string
  duration: string
  author: string
}

const DeploymentOverview: React.FC = () => {
  const pipelines: Pipeline[] = [
    {
      id: '1',
      name: 'web-app-frontend',
      status: 'success',
      lastDeployment: '2 hours ago',
      environment: 'production',
      branch: 'main',
    },
    {
      id: '2',
      name: 'api-backend',
      status: 'running',
      lastDeployment: 'Running now',
      environment: 'staging',
      branch: 'develop',
      progress: 65,
    },
    {
      id: '3',
      name: 'mobile-app',
      status: 'failed',
      lastDeployment: '1 day ago',
      environment: 'production',
      branch: 'release/v2.1',
    },
    {
      id: '4',
      name: 'data-pipeline',
      status: 'pending',
      lastDeployment: 'Queued',
      environment: 'staging',
      branch: 'feature/analytics',
    },
  ]

  const recentDeployments: Deployment[] = [
    {
      id: '1',
      pipeline: 'web-app-frontend',
      version: 'v2.1.3',
      environment: 'production',
      status: 'success',
      startTime: '2 hours ago',
      duration: '4m 32s',
      author: 'John Doe',
    },
    {
      id: '2',
      pipeline: 'api-backend',
      version: 'v1.8.2',
      environment: 'staging',
      status: 'running',
      startTime: '15 minutes ago',
      duration: '15m 20s',
      author: 'Jane Smith',
    },
    {
      id: '3',
      pipeline: 'mobile-app',
      version: 'v2.1.0',
      environment: 'production',
      status: 'failed',
      startTime: '1 day ago',
      duration: '2m 15s',
      author: 'Mike Johnson',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />
      case 'failed':
        return <ErrorIcon color="error" />
      case 'running':
        return <PendingIcon color="info" />
      case 'pending':
        return <PendingIcon color="warning" />
      default:
        return <PendingIcon />
    }
  }

  const getStatusColor = (status: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'error'
      case 'running':
        return 'info'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  const successfulDeployments = pipelines.filter(p => p.status === 'success').length
  const failedDeployments = pipelines.filter(p => p.status === 'failed').length
  const runningDeployments = pipelines.filter(p => p.status === 'running').length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Deployment Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your deployment pipelines and release processes
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            New Pipeline
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DeployIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Pipelines</Typography>
              </Box>
              <Typography variant="h4">{pipelines.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active pipelines
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SuccessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Successful</Typography>
              </Box>
              <Typography variant="h4">{successfulDeployments}</Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Running</Typography>
              </Box>
              <Typography variant="h4">{runningDeployments}</Typography>
              <Typography variant="body2" color="text.secondary">
                Currently deploying
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Failed</Typography>
              </Box>
              <Typography variant="h4">{failedDeployments}</Typography>
              <Typography variant="body2" color="text.secondary">
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pipeline Status */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pipeline Status
              </Typography>
              <List>
                {pipelines.map((pipeline, index) => (
                  <React.Fragment key={pipeline.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getStatusIcon(pipeline.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body1">{pipeline.name}</Typography>
                            <Chip
                              label={pipeline.environment}
                              size="small"
                              color={pipeline.environment === 'production' ? 'error' : 'info'}
                              variant="outlined"
                            />
                            <Chip
                              label={pipeline.status}
                              size="small"
                              color={getStatusColor(pipeline.status)}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Branch: {pipeline.branch} • Last deployment: {pipeline.lastDeployment}
                            </Typography>
                            {pipeline.progress && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={pipeline.progress}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {pipeline.progress}% complete
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < pipelines.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Deployments */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TimelineIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Recent Deployments</Typography>
              </Box>
              <List dense>
                {recentDeployments.map((deployment, index) => (
                  <React.Fragment key={deployment.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {getStatusIcon(deployment.status)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap>
                            {deployment.pipeline} {deployment.version}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {deployment.environment} • {deployment.duration}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              by {deployment.author} • {deployment.startTime}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentDeployments.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DeploymentOverview