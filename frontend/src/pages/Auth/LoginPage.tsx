import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../store/slices/authSlice'

const LoginPage: React.FC = () => {
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mock login - in real app this would call the API
    const mockUser = {
      id: '1',
      email: email,
      name: 'Demo User',
      role: 'admin',
      organizationId: '1',
      permissions: ['read', 'write', 'admin'],
    }
    
    const mockToken = 'mock-jwt-token'
    
    dispatch(loginSuccess({ user: mockUser, token: mockToken }))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            CloudWeave
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Cloud Platform Engineering
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            Demo Mode: Use any email/password to login
          </Alert>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              Sign In
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginPage