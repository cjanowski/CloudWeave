import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface MetricData {
  timestamp: string
  value: number
  label: string
}

const Metrics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('1h')
  const [selectedMetric, setSelectedMetric] = useState('cpu')

  // Sample data for different metrics
  const cpuMetrics: MetricData[] = [
    { timestamp: '00:00', value: 45, label: 'CPU Usage' },
    { timestamp: '00:15', value: 52, label: 'CPU Usage' },
    { timestamp: '00:30', value: 48, label: 'CPU Usage' },
    { timestamp: '00:45', value: 61, label: 'CPU Usage' },
    { timestamp: '01:00', value: 72, label: 'CPU Usage' },
    { timestamp: '01:15', value: 68, label: 'CPU Usage' },
    { timestamp: '01:30', value: 55, label: 'CPU Usage' },
  ]

  const memoryMetrics: MetricData[] = [
    { timestamp: '00:00', value: 55, label: 'Memory Usage' },
    { timestamp: '00:15', value: 58, label: 'Memory Usage' },
    { timestamp: '00:30', value: 56, label: 'Memory Usage' },
    { timestamp: '00:45', value: 59, label: 'Memory Usage' },
    { timestamp: '01:00', value: 58, label: 'Memory Usage' },
    { timestamp: '01:15', value: 62, label: 'Memory Usage' },
    { timestamp: '01:30', value: 60, label: 'Memory Usage' },
  ]

  const networkMetrics: MetricData[] = [
    { timestamp: '00:00', value: 25, label: 'Network I/O' },
    { timestamp: '00:15', value: 32, label: 'Network I/O' },
    { timestamp: '00:30', value: 28, label: 'Network I/O' },
    { timestamp: '00:45', value: 35, label: 'Network I/O' },
    { timestamp: '01:00', value: 30, label: 'Network I/O' },
    { timestamp: '01:15', value: 38, label: 'Network I/O' },
    { timestamp: '01:30', value: 33, label: 'Network I/O' },
  ]

  const diskMetrics: MetricData[] = [
    { timestamp: '00:00', value: 78, label: 'Disk Usage' },
    { timestamp: '00:15', value: 79, label: 'Disk Usage' },
    { timestamp: '00:30', value: 80, label: 'Disk Usage' },
    { timestamp: '00:45', value: 82, label: 'Disk Usage' },
    { timestamp: '01:00', value: 84, label: 'Disk Usage' },
    { timestamp: '01:15', value: 85, label: 'Disk Usage' },
    { timestamp: '01:30', value: 86, label: 'Disk Usage' },
  ]

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'memory':
        return memoryMetrics
      case 'network':
        return networkMetrics
      case 'disk':
        return diskMetrics
      default:
        return cpuMetrics
    }
  }

  const getMetricColor = () => {
    switch (selectedMetric) {
      case 'memory':
        return '#82ca9d'
      case 'network':
        return '#ffc658'
      case 'disk':
        return '#ff7300'
      default:
        return '#8884d8'
    }
  }

  const getCurrentValue = () => {
    const data = getMetricData()
    return data[data.length - 1]?.value || 0
  }

  const getTrend = () => {
    const data = getMetricData()
    if (data.length < 2) return 'stable'
    const current = data[data.length - 1].value
    const previous = data[data.length - 2].value
    return current > previous ? 'up' : current < previous ? 'down' : 'stable'
  }

  const metricSummary = [
    { name: 'CPU Usage', current: 72, avg: 58, max: 85, unit: '%', trend: 'up' },
    { name: 'Memory Usage', current: 60, avg: 58, max: 75, unit: '%', trend: 'stable' },
    { name: 'Network I/O', current: 33, avg: 31, max: 45, unit: 'MB/s', trend: 'up' },
    { name: 'Disk Usage', current: 86, avg: 82, max: 90, unit: '%', trend: 'up' },
  ]

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Metrics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View detailed performance metrics and analytics
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
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
          >
            Configure
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Metric Selector and Current Value */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Metric
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Metric Type</InputLabel>
                <Select
                  value={selectedMetric}
                  label="Metric Type"
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <MenuItem value="cpu">CPU Usage</MenuItem>
                  <MenuItem value="memory">Memory Usage</MenuItem>
                  <MenuItem value="network">Network I/O</MenuItem>
                  <MenuItem value="disk">Disk Usage</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color="primary" gutterBottom>
                  {getCurrentValue()}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  {getTrend() === 'up' ? (
                    <TrendingUpIcon color="error" />
                  ) : getTrend() === 'down' ? (
                    <TrendingDownIcon color="success" />
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    Current Value
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {getMetricData()[0]?.label} Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getMetricData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={getMetricColor()} 
                    fill={getMetricColor()} 
                    fillOpacity={0.3} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics Summary Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metrics Summary
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Current</TableCell>
                      <TableCell align="right">Average</TableCell>
                      <TableCell align="right">Maximum</TableCell>
                      <TableCell align="right">Trend</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metricSummary.map((metric) => (
                      <TableRow key={metric.name}>
                        <TableCell component="th" scope="row">
                          {metric.name}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {metric.current}{metric.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {metric.avg}{metric.unit}
                        </TableCell>
                        <TableCell align="right">
                          {metric.max}{metric.unit}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {metric.trend === 'up' ? (
                              <TrendingUpIcon color="error" fontSize="small" />
                            ) : metric.trend === 'down' ? (
                              <TrendingDownIcon color="success" fontSize="small" />
                            ) : (
                              <Typography variant="body2">—</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={
                              metric.current > 80 ? 'Critical' :
                              metric.current > 60 ? 'Warning' : 'Normal'
                            }
                            color={
                              metric.current > 80 ? 'error' :
                              metric.current > 60 ? 'warning' : 'success'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Comparison Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metrics Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metricSummary}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="current" fill="#8884d8" name="Current" />
                  <Bar dataKey="avg" fill="#82ca9d" name="Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default Metrics