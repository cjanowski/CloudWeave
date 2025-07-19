import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box } from '@mui/material'

import { RootState } from './store'
import { setUser } from './store/slices/authSlice'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/Auth/LoginPage'
import Dashboard from './pages/Dashboard/Dashboard'
import Infrastructure from './pages/Infrastructure/Infrastructure'
import Deployments from './pages/Deployments/Deployments'
import Monitoring from './pages/Monitoring/Monitoring'
import Security from './pages/Security/Security'
import CostManagement from './pages/CostManagement/CostManagement'
import Settings from './pages/Settings/Settings'
import { authService } from './services/authService'

const App: React.FC = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      if (token && !isAuthenticated) {
        try {
          const user = await authService.getCurrentUser()
          dispatch(setUser(user))
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token')
        }
      }
    }

    checkAuth()
  }, [token, isAuthenticated, dispatch])

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/infrastructure/*" element={<Infrastructure />} />
          <Route path="/deployments/*" element={<Deployments />} />
          <Route path="/monitoring/*" element={<Monitoring />} />
          <Route path="/security/*" element={<Security />} />
          <Route path="/cost-management/*" element={<CostManagement />} />
          <Route path="/settings/*" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App