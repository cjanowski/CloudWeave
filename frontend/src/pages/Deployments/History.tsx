import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Code as CodeIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

interface DeploymentHistory {
  id: string
  pipeline: string
  version: string
  environment: string
  status: 'success' | 'failed' | 'running' | 'cancelled'
  startTime: string
  endTime?: string
  duration: string
  author: string
  commit: string
  commitMessage: string
  branch: string
  rollbackAvailable: boolean
}

const History: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEnvironment, setFilterEnvironment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentHistory | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const deploymentHistory: DeploymentHistory[] = [
    {
      id: '1',
      pipeline: 'web-app-frontend',
      version: 'v2.1.3',
      environment: 'production',
      status: 'success',
      startTime: '2024-01-20 14:30:00',
      endTime: '2024-01-20 14:34:32',
      duration: '4m 32s',
      author: 'John Doe',
      commit: 'a1b2c3d',
      commitMessage: 'Fix authentication bug and update dependencies',
      branch: 'main',
      rollbackAvailable: true,
    },
    {
      id: '2',
      pipeline: 'api-backend',
      version: 'v1.8.2',
      environment: 'staging',
      status: 'running',
      startTime: '2024-01-20 15:15:00',
      duration: '15m 20s',
      author: 'Jane Smith',
      commit: 'e4f5g6h',
      commitMessage: 'Add new API endpoints for user management',
      branch: 'develop',
      rollbackAvailable: false,
    },
    {
      id: '3',
      pipeline: 'mobile-app',
      version: 'v2.1.0',
      environment: 'production',
      status: 'failed',
      startTime: '2024-01-19 16:45:00',
      endTime: '2024-01-19 16:47:15',
      duration: '2m 15s',
      author: 'Mike Johnson',
      commit: 'i7j8k9l',
      commitMessage: 'Update mobile app UI components',
      branch: 'release/v2.1',
      rollbackAvailable: true,
    },
    {
      id: '4',
      pipeline: 'web-app-frontend',
      version: 'v2.1.2',
      environment: 'production',
      status: 'success',
      startTime: '2024-01-19 10:20:00',
      endTime: '2024-01-19 10:25:45',
      duration: '5m 45s',
      author: 'Sarah Wilson',
      commit: 'm1n2o3p',
      commitMessage: 'Performance improvements and bug fixes',
      branch: 'main',
      rollbackAvailable: true,
    },
    {
      id: '5',
      pipeline: 'data-pipeline',
      version: 'v1.3.1',
      environment: 'staging',
      status: 'cancelled',
      startTime: '2024-01-18 22:00:00',
      endTime: '2024-01-18 22:02:30',
      duration: '2m 30s',
      author: 'Alex Chen',
      commit: 'q4r5s6t',
      commitMessage: 'Update data processing algorithms',
      branch: 'feature/analytics',
      rollbackAvailable: false,
    },
  ]

  const columns: GridColDef[] = [
    {
      field: 'pipeline',
      headerName: 'Pipeline',
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
            <CodeIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.version}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'environment',
      headerName: 'Environment',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'production' ? 'error' : 'info'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
          icon={getStatusIcon(params.value)}
        />
      ),
    },
    {
      field: 'author',
      headerName: 'Author',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'startTime',
      headerName: 'Started',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2">
            {new Date(params.value).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(params.value).toLocaleTimeString()}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TimeIcon sx={{ mr: 1, fontSize: 16 }} />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'commit',
      headerName: 'Commit',
      width: 120,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.branch}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, params.row)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ]

  const getStatusColor = (status: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
        return 'success'
      case 'failed':
        return 'error'
      case 'running':
        return 'info'
      case 'cancelled':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <SuccessIcon />
      case 'failed':
        return <ErrorIcon />
      case 'running':
        return <PendingIcon />
      default:
        return <PendingIcon />
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, deployment: DeploymentHistory) => {
    setAnchorEl(event.currentTarget)
    setSelectedDeployment(deployment)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedDeployment(null)
  }

  const handleViewDetails = (deployment: DeploymentHistory) => {
    setSelectedDeployment(deployment)
    setDetailsDialogOpen(true)
    handleMenuClose()
  }

  const filteredDeployments = deploymentHistory.filter((deployment) => {
    const matchesSearch = deployment.pipeline.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deployment.commitMessage.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEnvironment = !filterEnvironment || deployment.environment === filterEnvironment
    const matchesStatus = !filterStatus || deployment.status === filterStatus
    
    return matchesSearch && matchesEnvironment && matchesStatus
  })

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Deployment History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View past deployments and their status
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search deployments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select
                  value={filterEnvironment}
                  label="Environment"
                  onChange={(e) => setFilterEnvironment(e.target.value)}
                >
                  <MenuItem value="">All Environments</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Deployment History Table */}
      <Card>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredDeployments}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        </Box>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedDeployment!)}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          View Logs
        </MenuItem>
        {selectedDeployment?.rollbackAvailable && (
          <MenuItem onClick={handleMenuClose}>
            Rollback
          </MenuItem>
        )}
        <MenuItem onClick={handleMenuClose}>
          Redeploy
        </MenuItem>
      </Menu>

      {/* Deployment Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Deployment Details
          <Typography variant="body2" color="text.secondary">
            {selectedDeployment?.pipeline} • {selectedDeployment?.version}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedDeployment && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedDeployment.status}
                    color={getStatusColor(selectedDeployment.status)}
                    icon={getStatusIcon(selectedDeployment.status)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Environment
                  </Typography>
                  <Chip
                    label={selectedDeployment.environment}
                    color={selectedDeployment.environment === 'production' ? 'error' : 'info'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Author
                  </Typography>
                  <Typography variant="body2">{selectedDeployment.author}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body2">{selectedDeployment.duration}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Start Time
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedDeployment.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    End Time
                  </Typography>
                  <Typography variant="body2">
                    {selectedDeployment.endTime 
                      ? new Date(selectedDeployment.endTime).toLocaleString()
                      : 'In progress'
                    }
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Commit Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Commit:</strong> {selectedDeployment.commit}
                </Typography>
                <Typography variant="body2">
                  <strong>Branch:</strong> {selectedDeployment.branch}
                </Typography>
                <Typography variant="body2">
                  <strong>Message:</strong> {selectedDeployment.commitMessage}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Deployment Logs
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                <Typography variant="body2" component="div">
                  [2024-01-20 14:30:00] Starting deployment...
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:30:15] Checking out code from {selectedDeployment.branch}
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:30:30] Installing dependencies...
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:32:00] Running tests...
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:33:15] Building application...
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:34:00] Deploying to {selectedDeployment.environment}...
                </Typography>
                <Typography variant="body2" component="div">
                  [2024-01-20 14:34:32] Deployment completed successfully!
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedDeployment?.rollbackAvailable && (
            <Button variant="outlined" color="warning">
              Rollback
            </Button>
          )}
          <Button variant="contained">
            Redeploy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default History