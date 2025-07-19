import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const CostOverview: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      Cost Management Overview
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Track, analyze, and optimize your cloud spending across all providers.
    </Typography>
  </Box>
)

const CostManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<CostOverview />} />
    </Routes>
  )
}

export default CostManagement