import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const SettingsOverview: React.FC = () => (
  <Box>
    <Typography variant="h4" component="h1" gutterBottom>
      Settings
    </Typography>
    <Typography variant="body1" color="text.secondary">
      Configure your account, organization, and application preferences.
    </Typography>
  </Box>
)

const Settings: React.FC = () => {
  return (
    <Routes>
      <Route index element={<SettingsOverview />} />
    </Routes>
  )
}

export default Settings