import React, { useState } from 'react'
import {
  Box,
  Grid,
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
  Chip,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  NotificationImportant as AlertIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

interface Alert {
  id: string
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  status: 'active' | 'resolved' | 'acknowledged'
  resource: string
  metric: string
  threshold: string
  currentValue: string
  timestamp: string
  duration: string
  isEnabled: boolean
}

interface AlertRule {
  id: string
  name: string
  metric: string
  condition: string
  threshold: number
  duration: string
  severity: 'critical' | 'warning' | 'info'
  isEnabled: boolean
  notifications: string[]
}

const Alerts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [createRuleDialogOpen, setCreateRuleDialogOpen] = useState(false)
  const [alertDetailsDialogOpen, setAlertDetailsDialogOpen] = useState(false)

  const alerts: Alert[] = [
    {
      id: '1',
      title: 'High CPU usage on prod-server-01',
      description: 'CPU usage has exceeded 80% for more than 5 minutes',
      severity: 'critical',
      status: 'active',
      resource: 'prod-server-01',
      metric: 'CPU Usage',
      threshold: '> 80%',
      currentValue: '92%',
      timestamp: '2024-01-20 15:30:00',
      duration: '12 minutes',
      isEnabled: true,
    },
    {
      id: '2',
      title: 'Disk space running low on database server',
      description: 'Available disk space is below 15%',
      severity: 'warning',
      status: 'active',
      resource: 'db-server-main',
      metric: 'Disk Usage',
      threshold: '> 85%',
      currentValue: '88%',
      timestamp: '2024-01-20 15:15:00',
      duration: '27 minutes',
      isEnabled: true,
    },
    {
      id: '3',
      title: 'SSL certificate expires soon',
      description: 'SSL certificate for web-app.example.com expires in 7 days',
      severity: 'warning',
      status: 'acknowledged',
      resource: 'web-app.example.com',
      metric: 'Certificate Expiry',
      threshold: '< 30 days',
      currentValue: '7 days',
      timestamp: '2024-01-20 14:00:00',
      duration: '1 hour 42 minutes',
      isEnabled: true,
    },
    {
      id: '4',
      title: 'Load balancer health check recovered',
      description: 'Health check is now passing after previous failure',
      severity: 'info',
      status: 'resolved',
      resource: 'load-balancer-main',
      metric: 'Health Check',
      threshold: 'Failed',
      currentValue: 'Passing',
      timestamp: '2024-01-20 13:45:00',
      duration: '15 minutes',
      isEnabled: true,
    },
  ]

  const alertRules: AlertRule[] = [
    {
      id: '1',
      name: 'High CPU Usage',
      metric: 'CPU Usage',
      condition: 'greater than',
      threshold: 80,
      duration: '5 minutes',
      severity: 'critical',
      isEnabled: true,
      notifications: ['email', 'slack'],
    },
    {
      id: '2',
      name: 'Low Disk Space',
      metric: 'Disk Usage',
      condition: 'greater than',
      threshold: 85,
      duration: '2 minutes',
      severity: 'warning',
      isEnabled: true,
      notifications: ['email'],
    },
    {
      id: '3',
      name: 'High Memory Usage',
      metric: 'Memory Usage',
      condition: 'greater than',
      threshold: 90,
      duration: '10 minutes',
      severity: 'warning',
      isEnabled: false,
      notifications: ['email', 'webhook'],
    },
  ]

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Alert',
      width: 250,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.resource}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'severity',
      headerName: 'Severity',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getSeverityColor(params.value)}
          size="small"
          icon={getSeverityIcon(params.value)}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'metric',
      headerName: 'Metric',
      width: 120,
    },
    {
      field: 'currentValue',
      headerName: 'Current Value',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 120,
    },
    {
      field: 'timestamp',
      headerName: 'Started',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body2">
          {new Date(params.value).toLocaleString()}
        </Typography>
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

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'info' | 'default' => {
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
        return <ErrorIcon />
      case 'warning':
        return <WarningIcon />
      case 'info':
        return <InfoIcon />
      default:
        return <AlertIcon />
    }
  }

  const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'resolved':
        return 'success'
      case 'acknowledged':
        return 'warning'
      case 'active':
        return 'info'
      default:
        return 'default'
    }
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, alert: Alert) => {
    setAnchorEl(event.currentTarget)
    setSelectedAlert(alert)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedAlert(null)
  }

  const handleViewDetails = (alert: Alert) => {
    setSelectedAlert(alert)
    setAlertDetailsDialogOpen(true)
    handleMenuClose()
  }

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.resource.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = !filterSeverity || alert.severity === filterSeverity
    const matchesStatus = !filterStatus || alert.status === filterStatus
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length
  const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage alerts and notification rules
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
            onClick={() => setCreateRuleDialogOpen(true)}
          >
            Create Rule
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Alerts</Typography>
              </Box>
              <Typography variant="h4">{activeAlertsCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AlertIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Critical</Typography>
              </Box>
              <Typography variant="h4">{criticalAlertsCount}</Typography>
              <Typography variant="body2" color="text.secondary">
                High priority
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Alert Rules</Typography>
              </Box>
              <Typography variant="h4">{alertRules.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Configured rules
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Resolved</Typography>
              </Box>
              <Typography variant="h4">
                {alerts.filter(a => a.status === 'resolved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last 24 hours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search alerts..."
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
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  label="Severity"
                  onChange={(e) => setFilterSeverity(e.target.value)}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
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
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="acknowledged">Acknowledged</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Alerts
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={filteredAlerts}
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
        </CardContent>
      </Card>

      {/* Alert Rules */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alert Rules
          </Typography>
          <List>
            {alertRules.map((rule, index) => (
              <React.Fragment key={rule.id}>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: getSeverityColor(rule.severity) + '.light' }}>
                      {getSeverityIcon(rule.severity)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={rule.name}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {rule.metric} {rule.condition} {rule.threshold}% for {rule.duration}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          {rule.notifications.map((notification) => (
                            <Chip
                              key={notification}
                              label={notification}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={rule.isEnabled}
                        onChange={() => {/* Toggle rule */}}
                      />
                    }
                    label="Enabled"
                  />
                </ListItem>
                {index < alertRules.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedAlert!)}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Acknowledge
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Resolve
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Snooze
        </MenuItem>
      </Menu>

      {/* Create Alert Rule Dialog */}
      <Dialog open={createRuleDialogOpen} onClose={() => setCreateRuleDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Alert Rule</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Rule Name"
                placeholder="Enter rule name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select label="Metric">
                  <MenuItem value="cpu">CPU Usage</MenuItem>
                  <MenuItem value="memory">Memory Usage</MenuItem>
                  <MenuItem value="disk">Disk Usage</MenuItem>
                  <MenuItem value="network">Network I/O</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select label="Condition">
                  <MenuItem value="greater">Greater than</MenuItem>
                  <MenuItem value="less">Less than</MenuItem>
                  <MenuItem value="equal">Equal to</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Threshold"
                type="number"
                placeholder="80"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select label="Severity">
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Duration"
                placeholder="5 minutes"
                helperText="How long the condition must persist before triggering"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRuleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Rule</Button>
        </DialogActions>
      </Dialog>

      {/* Alert Details Dialog */}
      <Dialog open={alertDetailsDialogOpen} onClose={() => setAlertDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Alert Details
          <Typography variant="body2" color="text.secondary">
            {selectedAlert?.resource}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Severity
                  </Typography>
                  <Chip
                    label={selectedAlert.severity}
                    color={getSeverityColor(selectedAlert.severity)}
                    icon={getSeverityIcon(selectedAlert.severity)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={selectedAlert.status}
                    color={getStatusColor(selectedAlert.status)}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">{selectedAlert.description}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Value
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {selectedAlert.currentValue}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Threshold
                  </Typography>
                  <Typography variant="body2">{selectedAlert.threshold}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Duration
                  </Typography>
                  <Typography variant="body2">{selectedAlert.duration}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Started
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDetailsDialogOpen(false)}>Close</Button>
          <Button variant="outlined">Acknowledge</Button>
          <Button variant="contained">Resolve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Alerts