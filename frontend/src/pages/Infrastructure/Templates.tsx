import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
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
  Avatar,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  CloudQueue as CloudIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FileCopy as CopyIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material'

interface Template {
  id: string
  name: string
  description: string
  provider: string
  category: string
  version: string
  author: string
  created: string
  lastModified: string
  usageCount: number
  isStarred: boolean
  tags: string[]
  resources: {
    type: string
    count: number
  }[]
}

const Templates: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  const templates: Template[] = [
    {
      id: '1',
      name: 'Web Application Stack',
      description: 'Complete web application infrastructure with load balancer, auto-scaling group, and RDS database',
      provider: 'AWS',
      category: 'Web Applications',
      version: '2.1.0',
      author: 'DevOps Team',
      created: '2024-01-10',
      lastModified: '2024-01-18',
      usageCount: 15,
      isStarred: true,
      tags: ['web', 'scalable', 'production'],
      resources: [
        { type: 'EC2 Instances', count: 3 },
        { type: 'Load Balancer', count: 1 },
        { type: 'RDS Database', count: 1 },
        { type: 'S3 Bucket', count: 2 },
      ],
    },
    {
      id: '2',
      name: 'Microservices Platform',
      description: 'Kubernetes-based microservices platform with monitoring and logging',
      provider: 'GCP',
      category: 'Containers',
      version: '1.5.2',
      author: 'Platform Team',
      created: '2024-01-05',
      lastModified: '2024-01-15',
      usageCount: 8,
      isStarred: false,
      tags: ['kubernetes', 'microservices', 'monitoring'],
      resources: [
        { type: 'GKE Cluster', count: 1 },
        { type: 'Load Balancer', count: 2 },
        { type: 'Cloud SQL', count: 1 },
        { type: 'Storage Buckets', count: 3 },
      ],
    },
    {
      id: '3',
      name: 'Data Analytics Pipeline',
      description: 'Complete data processing pipeline with storage, compute, and analytics services',
      provider: 'Azure',
      category: 'Analytics',
      version: '3.0.1',
      author: 'Data Team',
      created: '2024-01-12',
      lastModified: '2024-01-20',
      usageCount: 5,
      isStarred: true,
      tags: ['analytics', 'big-data', 'pipeline'],
      resources: [
        { type: 'Data Factory', count: 1 },
        { type: 'Storage Account', count: 2 },
        { type: 'Synapse Analytics', count: 1 },
        { type: 'Key Vault', count: 1 },
      ],
    },
    {
      id: '4',
      name: 'Development Environment',
      description: 'Standard development environment setup with CI/CD pipeline',
      provider: 'AWS',
      category: 'Development',
      version: '1.2.0',
      author: 'DevOps Team',
      created: '2024-01-08',
      lastModified: '2024-01-16',
      usageCount: 22,
      isStarred: false,
      tags: ['development', 'ci-cd', 'testing'],
      resources: [
        { type: 'EC2 Instances', count: 2 },
        { type: 'CodePipeline', count: 1 },
        { type: 'CodeBuild', count: 1 },
        { type: 'S3 Bucket', count: 1 },
      ],
    },
  ]

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, template: Template) => {
    setAnchorEl(event.currentTarget)
    setSelectedTemplate(template)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTemplate(null)
  }

  const handleViewTemplate = (template: Template) => {
    setSelectedTemplate(template)
    setViewDialogOpen(true)
    handleMenuClose()
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'AWS':
        return '#FF9900'
      case 'Azure':
        return '#0078D4'
      case 'GCP':
        return '#4285F4'
      default:
        return '#666'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Infrastructure Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage reusable infrastructure templates
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Template
        </Button>
      </Box>

      {/* Template Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: getProviderColor(template.provider),
                        width: 32,
                        height: 32,
                        mr: 1,
                      }}
                    >
                      <CloudIcon fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div" noWrap>
                        {template.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        v{template.version} • {template.provider}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => {/* Toggle star */}}
                    >
                      {template.isStarred ? (
                        <StarIcon color="warning" />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, template)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Description */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>

                {/* Category and Tags */}
                <Box sx={{ mb: 2 }}>
                  <Chip
                    label={template.category}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                  {template.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>

                {/* Resources */}
                <Typography variant="subtitle2" gutterBottom>
                  Resources ({template.resources.reduce((sum, r) => sum + r.count, 0)})
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {template.resources.map((resource, index) => (
                    <Typography key={index} variant="caption" display="block" color="text.secondary">
                      {resource.count}x {resource.type}
                    </Typography>
                  ))}
                </Box>

                {/* Metadata */}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Used {template.usageCount} times
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    by {template.author}
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewTemplate(template)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<CopyIcon />}
                >
                  Deploy
                </Button>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                >
                  Edit
                </Button>
              </CardActions>
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
        <MenuItem onClick={() => handleViewTemplate(selectedTemplate!)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 1 }} />
          Edit Template
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CopyIcon sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <CodeIcon sx={{ mr: 1 }} />
          Export
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                placeholder="Enter template name"
              />
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                placeholder="Describe what this template creates"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category">
                  <MenuItem value="web">Web Applications</MenuItem>
                  <MenuItem value="containers">Containers</MenuItem>
                  <MenuItem value="analytics">Analytics</MenuItem>
                  <MenuItem value="development">Development</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version"
                placeholder="1.0.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Enter tags separated by commas"
                helperText="e.g., web, scalable, production"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Create Template</Button>
        </DialogActions>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTemplate?.name}
          <Typography variant="body2" color="text.secondary">
            Version {selectedTemplate?.version} • {selectedTemplate?.provider}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Resources
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {selectedTemplate.resources.map((resource, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{resource.count}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resource.type}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" gutterBottom>
                Template Configuration
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: 300,
                }}
              >
                {`# Infrastructure Template: ${selectedTemplate.name}
# Provider: ${selectedTemplate.provider}
# Version: ${selectedTemplate.version}

resources:
${selectedTemplate.resources.map(r => `  - type: ${r.type}
    count: ${r.count}`).join('\n')}

configuration:
  auto_scaling: true
  monitoring: enabled
  backup: daily
  
tags:
${selectedTemplate.tags.map(tag => `  - ${tag}`).join('\n')}`}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button variant="outlined" startIcon={<CopyIcon />}>
            Deploy Template
          </Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            Edit Template
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Templates