import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Divider,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'

interface PipelineStep {
  id: string
  name: string
  status: 'completed' | 'running' | 'failed' | 'pending'
  duration?: string
  logs?: string[]
}

interface Pipeline {
  id: string
  name: string
  description: string
  repository: string
  branch: string
  environment: string
  status: 'idle' | 'running' | 'success' | 'failed'
  lastRun: string
  nextRun?: string
  isScheduled: boolean
  steps: PipelineStep[]
  progress?: number
}

const Pipelines: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const pipelines: Pipeline[] = [
    {
      id: '1',
      name: 'web-app-frontend',
      description: 'Frontend application deployment pipeline',
      repository: 'github.com/company/web-app',
      branch: 'main',
      environment: 'production',
      status: 'success',
      lastRun: '2 hours ago',
      nextRun: 'On push to main',
      isScheduled: false,
      steps: [
        { id: '1', name: 'Checkout Code', status: 'completed', duration: '15s' },
        { id: '2', name: 'Install Dependencies', status: 'completed', duration: '2m 30s' },
        { id: '3', name: 'Run Tests', status: 'completed', duration: '1m 45s' },
        { id: '4', name: 'Build Application', status: 'completed', duration: '3m 20s' },
        { id: '5', name: 'Deploy to Production', status: 'completed', duration: '45s' },
      ],
    },
    {
      id: '2',
      name: 'api-backend',
      description: 'Backend API deployment pipeline',
      repository: 'github.com/company/api-backend',
      branch: 'develop',
      environment: 'staging',
      status: 'running',
      lastRun: 'Running now',
      isScheduled: false,
      progress: 65,
      steps: [
        { id: '1', name: 'Checkout Code', status: 'completed', duration: '12s' },
        { id: '2', name: 'Install Dependencies', status: 'completed', duration: '1m 50s' },
        { id: '3', name: 'Run Tests', status: 'running', logs: ['Running unit tests...', 'Test suite: Authentication', 'Test suite: API endpoints'] },
        { id: '4', name: 'Build Docker Image', status: 'pending' },
        { id: '5', name: 'Deploy to Staging', status: 'pending' },
      ],
    },
    {
      id: '3',
      name: 'mobile-app',
      description: 'Mobile application build and deployment',
      repository: 'github.com/company/mobile-app',
      branch: 'release/v2.1',
      environment: 'production',
      status: 'failed',
      lastRun: '1 day ago',
      isScheduled: false,
      steps: [
        { id: '1', name: 'Checkout Code', status: 'completed', duration: '18s' },
        { id: '2', name: 'Install Dependencies', status: 'completed', duration: '3m 15s' },
        { id: '3', name: 'Run Tests', status: 'failed', duration: '2m 10s', logs: ['Test failed: LoginTest.testInvalidCredentials', 'Error: Expected 401, got 500'] },
        { id: '4', name: 'Build App', status: 'pending' },
        { id: '5', name: 'Deploy to Store', status: 'pending' },
      ],
    },
    {
      id: '4',
      name: 'data-pipeline',
      description: 'Data processing and analytics pipeline',
      repository: 'github.com/company/data-pipeline',
      branch: 'feature/analytics',
      environment: 'staging',
      status: 'idle',
      lastRun: '3 days ago',
      nextRun: 'Daily at 2:00 AM',
      isScheduled: true,
      steps: [
        { id: '1', name: 'Extract Data', status: 'pending' },
        { id: '2', name: 'Transform Data', status: 'pending' },
        { id: '3', name: 'Load to Warehouse', status: 'pending' },
        { id: '4', name: 'Run Analytics', status: 'pending' },
        { id: '5', name: 'Generate Reports', status: 'pending' },
      ],
    },
  ]

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, pipeline: Pipeline) => {
    setAnchorEl(event.currentTarget)
    setSelectedPipeline(pipeline)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedPipeline(null)
  }

  const handleViewDetails = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline)
    setDetailsDialogOpen(true)
    handleMenuClose()
  }

  const getStatusColor = (status: string): 'success' | 'error' | 'info' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
      case 'completed':
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

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon color="success" />
      case 'running':
        return <ScheduleIcon color="info" />
      case 'failed':
        return <ErrorIcon color="error" />
      default:
        return <ScheduleIcon color="disabled" />
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Deployment Pipelines
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure and monitor your CI/CD pipelines
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
            Create Pipeline
          </Button>
        </Box>
      </Box>

      {/* Pipeline Cards */}
      <Grid container spacing={3}>
        {pipelines.map((pipeline) => (
          <Grid item xs={12} lg={6} key={pipeline.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {pipeline.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {pipeline.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
                      {pipeline.isScheduled && (
                        <Chip
                          label="Scheduled"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, pipeline)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                {/* Repository Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Repository: {pipeline.repository}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Branch: {pipeline.branch}
                  </Typography>
                </Box>

                {/* Progress */}
                {pipeline.status === 'running' && pipeline.progress && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2">{pipeline.progress}%</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pipeline.progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {/* Last Run Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Last run: {pipeline.lastRun}
                  </Typography>
                  {pipeline.nextRun && (
                    <Typography variant="body2" color="text.secondary">
                      Next run: {pipeline.nextRun}
                    </Typography>
                  )}
                </Box>

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<PlayIcon />}
                    disabled={pipeline.status === 'running'}
                  >
                    Run
                  </Button>
                  {pipeline.status === 'running' && (
                    <Button
                      size="small"
                      startIcon={<StopIcon />}
                      color="error"
                    >
                      Stop
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<HistoryIcon />}
                    onClick={() => handleViewDetails(pipeline)}
                  >
                    Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedPipeline!)}>
          <HistoryIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          Configure
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PlayIcon sx={{ mr: 1 }} />
          Run Pipeline
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete Pipeline
        </MenuItem>
      </Menu>

      {/* Pipeline Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPipeline?.name}
          <Typography variant="body2" color="text.secondary">
            {selectedPipeline?.repository} • {selectedPipeline?.branch}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedPipeline && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Chip
                  label={selectedPipeline.status}
                  color={getStatusColor(selectedPipeline.status)}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={selectedPipeline.environment}
                  color={selectedPipeline.environment === 'production' ? 'error' : 'info'}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h6" gutterBottom>
                Pipeline Steps
              </Typography>
              
              <Stepper orientation="vertical">
                {selectedPipeline.steps.map((step) => (
                  <Step key={step.id} active={step.status === 'running'} completed={step.status === 'completed'}>
                    <StepLabel
                      error={step.status === 'failed'}
                      icon={getStepIcon(step.status)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography>{step.name}</Typography>
                        {step.duration && (
                          <Typography variant="caption" color="text.secondary">
                            {step.duration}
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                    {step.logs && (
                      <StepContent>
                        <Box
                          sx={{
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {step.logs.map((log, index) => (
                            <Typography key={index} variant="body2" component="div">
                              {log}
                            </Typography>
                          ))}
                        </Box>
                      </StepContent>
                    )}
                  </Step>
                ))}
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<PlayIcon />}>
            Run Pipeline
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Pipeline Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Pipeline</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Pipeline Name"
                placeholder="Enter pipeline name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Environment</InputLabel>
                <Select label="Environment">
                  <MenuItem value="development">Development</MenuItem>
                  <MenuItem value="staging">Staging</MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Repository URL"
                placeholder="https://github.com/company/repo"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Branch"
                placeholder="main"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Trigger</InputLabel>
                <Select label="Trigger">
                  <MenuItem value="push">On Push</MenuItem>
                  <MenuItem value="pr">On Pull Request</MenuItem>
                  <MenuItem value="schedule">Scheduled</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                placeholder="Describe what this pipeline does"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Pipeline</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Pipelines