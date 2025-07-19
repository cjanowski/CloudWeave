import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const SecurityOverview: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      Security Overview
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Monitor security posture, policies, and compliance across your infrastructure.
    </Typography>
  </Box>
)

const Security: React.FC = () => {
  return (
    <Routes>
      <Route index element={<SecurityOverview />} />
    </Routes>
  )
}

export default Security