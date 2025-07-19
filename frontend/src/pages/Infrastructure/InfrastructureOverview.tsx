import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material'
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

interface ResourceSummary {
  provider: string
  region: string
  totalResources: number
  runningResources: number
  stoppedResources: number
  errorResources: number
  monthlyCost: number
}

interface Resource {
  id: string
  name: string
  type: string
  provider: string
  region: string
  status: 'running' | 'stopped' | 'error' | 'pending'
  cost: number
  lastUpdated: string
}

const InfrastructureOverview: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedResource, setSelectedResource] = useState<string | null>(null)

  const resourceSummary: ResourceSummary[] = [
    {
      provider: 'AWS',
      region: 'us-east-1',
      totalResources: 45,
      runningResources: 38,
      stoppedResources: 5,
      errorResources: 2,
      monthlyCost: 2450.50,
    },
    {
      provider: 'Azure',
      region: 'eastus',
      totalResources: 23,
      runningResources: 20,
      stoppedResources: 3,
      errorResources: 0,
      monthlyCost: 1200.25,
    },
    {
      provider: 'GCP',
      region: 'us-central1',
      totalResources: 18,
      runningResources: 15,
      stoppedResources: 2,
      errorResources: 1,
      monthlyCost: 890.75,
    },
  ]

  const recentResources: Resource[] = [
    {
      id: '1',
      name: 'web-server-prod-01',
      type: 'EC2 Instance',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 145.50,
      lastUpdated: '2 minutes ago',
    },
    {
      id: '2',
      name: 'database-cluster',
      type: 'RDS Instance',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 320.00,
      lastUpdated: '5 minutes ago',
    },
    {
      id: '3',
      name: 'storage-bucket-logs',
      type: 'S3 Bucket',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 25.75,
      lastUpdated: '10 minutes ago',
    },
    {
      id: '4',
      name: 'load-balancer-main',
      type: 'Application Load Balancer',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'error',
      cost: 45.00,
      lastUpdated: '15 minutes ago',
    },
  ]

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, resourceId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedResource(resourceId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedResource(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'stopped':
        return 'warning'
      case 'error':
        return 'error'
      case 'pending':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleIcon color="success" />
      case 'stopped':
        return <WarningIcon color="warning" />
      case 'error':
        return <ErrorIcon color="error" />
      default:
        return <CheckCircleIcon color="disabled" />
    }
  }

  const totalResources = resourceSummary.reduce((sum, item) => sum + item.totalResources, 0)
  const totalRunning = resourceSummary.reduce((sum, item) => sum + item.runningResources, 0)
  const totalCost = resourceSummary.reduce((sum, item) => sum + item.monthlyCost, 0)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Infrastructure Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your cloud infrastructure across all providers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Add Resource
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CloudIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Resources</Typography>
              </Box>
              <Typography variant="h4">{totalResources}</Typography>
              <Typography variant="body2" color="text.secondary">
                Across all providers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Running</Typography>
              </Box>
              <Typography variant="h4">{totalRunning}</Typography>
              <Typography variant="body2" color="text.secondary">
                Active resources
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Health Score</Typography>
              </Box>
              <Typography variant="h4">94%</Typography>
              <LinearProgress variant="determinate" value={94} sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Monthly Cost</Typography>
              </Box>
              <Typography variant="h4">${totalCost.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">
                Estimated spend
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Provider Summary */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resources by Provider
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Running</TableCell>
                      <TableCell align="right">Issues</TableCell>
                      <TableCell align="right">Monthly Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resourceSummary.map((row) => (
                      <TableRow key={`${row.provider}-${row.region}`}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {row.provider}
                          </Box>
                        </TableCell>
                        <TableCell>{row.region}</TableCell>
                        <TableCell align="right">{row.totalResources}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={row.runningResources}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {row.errorResources > 0 ? (
                            <Chip
                              label={row.errorResources}
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip
                              label="0"
                              color="default"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          ${row.monthlyCost.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Resources
              </Typography>
              <Box>
                {recentResources.map((resource) => (
                  <Box
                    key={resource.id}
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
                    <Box sx={{ mr: 2 }}>
                      {getStatusIcon(resource.status)}
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>
                        {resource.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {resource.type} • ${resource.cost}/mo
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, resource.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Cost Alert:</strong> Your AWS spending is 15% higher than last month. 
            Consider reviewing your resource usage.
          </Typography>
        </Alert>
        <Alert severity="error">
          <Typography variant="body2">
            <strong>Resource Issue:</strong> Load balancer "load-balancer-main" is experiencing connectivity issues.
          </Typography>
        </Alert>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit</MenuItem>
        <MenuItem onClick={handleMenuClose}>Stop</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete</MenuItem>
      </Menu>
    </Box>
  )
}

export default InfrastructureOverview