import React from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  alpha,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  Logout,
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { RootState } from '../../store'
import { setSidebarOpen } from '../../store/slices/uiSlice'
import { logout } from '../../store/slices/authSlice'

const Header: React.FC = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state: RootState) => state.auth)
  const { sidebarOpen } = useSelector((state: RootState) => state.ui)
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    dispatch(logout())
    handleMenuClose()
    navigate('/login')
  }

  const handleSettings = () => {
    navigate('/settings')
    handleMenuClose()
  }

  return (
    <AppBar
      position="static"
      elevation={1}
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar>
        {/* Menu Toggle */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Search */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 1,
            backgroundColor: alpha('#000', 0.05),
            '&:hover': {
              backgroundColor: alpha('#000', 0.08),
            },
            marginLeft: 0,
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Box
            sx={{
              padding: (theme) => theme.spacing(0, 2),
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SearchIcon />
          </Box>
          <InputBase
            placeholder="Search resources, deployments..."
            sx={{
              color: 'inherit',
              width: '100%',
              '& .MuiInputBase-input': {
                padding: (theme) => theme.spacing(1, 1, 1, 0),
                paddingLeft: (theme) => `calc(1em + ${theme.spacing(4)})`,
                transition: (theme) => theme.transitions.create('width'),
                width: '100%',
              },
            }}
          />
        </Box>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Notifications */}
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* User Menu */}
        <IconButton
          size="large"
          edge="end"
          aria-label="account menu"
          aria-controls="account-menu"
          aria-haspopup="true"
          onClick={handleMenuOpen}
          color="inherit"
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>

        <Menu
          id="account-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Avatar /> Profile
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <Settings fontSize="small" sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout fontSize="small" sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

export default Header