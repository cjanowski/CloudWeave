import React from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'

import { RootState } from '../../store'
import { setSidebarOpen } from '../../store/slices/uiSlice'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useDispatch()
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)

  const sidebarWidth = 280
  const collapsedSidebarWidth = 64

  React.useEffect(() => {
    // Auto-collapse sidebar on mobile
    if (isMobile && sidebarOpen) {
      dispatch(setSidebarOpen(false))
    }
  }, [isMobile, sidebarOpen, dispatch])

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        width={sidebarWidth}
        collapsedWidth={collapsedSidebarWidth}
        isMobile={isMobile}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0, // Prevents flex item from overflowing
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: isMobile ? 0 : sidebarOpen ? 0 : `-${sidebarWidth - collapsedSidebarWidth}px`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            backgroundColor: theme.palette.background.default,
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer - 1,
          }}
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}
    </Box>
  )
}

export default Layout