import React from 'react'
import { Typography, Box } from '@mui/material'

const App: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        CloudWeave Test
      </Typography>
      <Typography variant="body1">
        If you can see this, the basic React app is working!
      </Typography>
    </Box>
  )
}

export default App