import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Tabs,
  Tab,
  Alert,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  CloudQueue as CloudIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid'

interface Resource {
  id: string
  name: string
  type: string
  provider: string
  region: string
  status: 'running' | 'stopped' | 'error' | 'pending'
  cost: number
  cpu: number
  memory: number
  storage: number
  created: string
  lastUpdated: string
  tags: Record<string, string>
}

const Resources: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvider, setFilterProvider] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const resources: Resource[] = [
    {
      id: '1',
      name: 'web-server-prod-01',
      type: 'EC2 Instance',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 145.50,
      cpu: 75,
      memory: 60,
      storage: 45,
      created: '2024-01-15',
      lastUpdated: '2 minutes ago',
      tags: { environment: 'production', team: 'frontend' },
    },
    {
      id: '2',
      name: 'database-cluster',
      type: 'RDS Instance',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 320.00,
      cpu: 45,
      memory: 80,
      storage: 90,
      created: '2024-01-10',
      lastUpdated: '5 minutes ago',
      tags: { environment: 'production', team: 'backend' },
    },
    {
      id: '3',
      name: 'storage-bucket-logs',
      type: 'S3 Bucket',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'running',
      cost: 25.75,
      cpu: 0,
      memory: 0,
      storage: 75,
      created: '2024-01-05',
      lastUpdated: '10 minutes ago',
      tags: { environment: 'production', type: 'logs' },
    },
    {
      id: '4',
      name: 'load-balancer-main',
      type: 'Application Load Balancer',
      provider: 'AWS',
      region: 'us-east-1',
      status: 'error',
      cost: 45.00,
      cpu: 0,
      memory: 0,
      storage: 0,
      created: '2024-01-12',
      lastUpdated: '15 minutes ago',
      tags: { environment: 'production', team: 'devops' },
    },
    {
      id: '5',
      name: 'vm-staging-web',
      type: 'Virtual Machine',
      provider: 'Azure',
      region: 'eastus',
      status: 'stopped',
      cost: 89.25,
      cpu: 0,
      memory: 0,
      storage: 30,
      created: '2024-01-08',
      lastUpdated: '1 hour ago',
      tags: { environment: 'staging', team: 'frontend' },
    },
  ]

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {getResourceIcon(params.row.type)}
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2">{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.type}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'provider',
      headerName: 'Provider',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 120,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'cost',
      headerName: 'Monthly Cost',
      width: 120,
      renderCell: (params) => `$${params.value}`,
    },
    {
      field: 'cpu',
      headerName: 'CPU %',
      width: 80,
      renderCell: (params) => params.value > 0 ? `${params.value}%` : '-',
    },
    {
      field: 'memory',
      headerName: 'Memory %',
      width: 100,
      renderCell: (params) => params.value > 0 ? `${params.value}%` : '-',
    },
    {
      field: 'lastUpdated',
      headerName: 'Last Updated',
      width: 130,
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

  const getResourceIcon = (type: string) => {
    if (type.includes('Instance') || type.includes('Machine')) {
      return <CloudIcon color="primary" />
    } else if (type.includes('Storage') || type.includes('Bucket')) {
      return <StorageIcon color="secondary" />
    } else if (type.includes('Load Balancer') || type.includes('Network')) {
      return <NetworkIcon color="info" />
    }
    return <MemoryIcon color="action" />
  }

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
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

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, resource: Resource) => {
    setAnchorEl(event.currentTarget)
    setSelectedResource(resource)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedResource(null)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const filteredResources = resources.filter((resource) => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProvider = !filterProvider || resource.provider === filterProvider
    const matchesStatus = !filterStatus || resource.status === filterStatus
    
    return matchesSearch && matchesProvider && matchesStatus
  })

  const TabPanel = ({ children, value, index }: { children: React.ReactNode, value: number, index: number }) => (
    <div hidden={value !== index}>
      {value === index && children}
    </div>
  )

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Resources
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your cloud resources across all providers
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
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Resource
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search resources..."
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
                <InputLabel>Provider</InputLabel>
                <Select
                  value={filterProvider}
                  label="Provider"
                  onChange={(e) => setFilterProvider(e.target.value)}
                >
                  <MenuItem value="">All Providers</MenuItem>
                  <MenuItem value="AWS">AWS</MenuItem>
                  <MenuItem value="Azure">Azure</MenuItem>
                  <MenuItem value="GCP">GCP</MenuItem>
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
                  <MenuItem value="running">Running</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`All Resources (${filteredResources.length})`} />
          <Tab label={`Running (${filteredResources.filter(r => r.status === 'running').length})`} />
          <Tab label={`Issues (${filteredResources.filter(r => r.status === 'error').length})`} />
        </Tabs>
      </Box>

      {/* Resource List */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredResources}
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
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredResources.filter(r => r.status === 'running')}
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
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {filteredResources.filter(r => r.status === 'error').length} resources require attention
            </Typography>
          </Alert>
          <Card>
            <Box sx={{ height: 600, width: '100%' }}>
              <DataGrid
                rows={filteredResources.filter(r => r.status === 'error')}
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
        </Box>
      </TabPanel>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit Configuration</MenuItem>
        <MenuItem onClick={handleMenuClose}>Start/Stop</MenuItem>
        <MenuItem onClick={handleMenuClose}>Clone</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      {/* Create Resource Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Resource</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Resource Name"
                placeholder="Enter resource name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Resource Type</InputLabel>
                <Select label="Resource Type">
                  <MenuItem value="ec2">EC2 Instance</MenuItem>
                  <MenuItem value="rds">RDS Database</MenuItem>
                  <MenuItem value="s3">S3 Bucket</MenuItem>
                  <MenuItem value="lb">Load Balancer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Provider</InputLabel>
                <Select label="Provider">
                  <MenuItem value="aws">AWS</MenuItem>
                  <MenuItem value="azure">Azure</MenuItem>
                  <MenuItem value="gcp">Google Cloud</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Region</InputLabel>
                <Select label="Region">
                  <MenuItem value="us-east-1">US East 1</MenuItem>
                  <MenuItem value="us-west-2">US West 2</MenuItem>
                  <MenuItem value="eu-west-1">EU West 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Resource</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Resources