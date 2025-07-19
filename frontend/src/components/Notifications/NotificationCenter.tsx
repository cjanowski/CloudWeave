import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'

import { RootState } from '../../store'
import { setNotificationCenterOpen } from '../../store/slices/uiSlice'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Deployment Completed',
    message: 'Production deployment for app-v2.1.0 completed successfully',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'High CPU Usage',
    message: 'CPU usage on prod-server-01 exceeded 85% threshold',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'Database maintenance scheduled for tonight at 2:00 AM',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <SuccessIcon color="success" />
    case 'warning':
      return <WarningIcon color="warning" />
    case 'error':
      return <ErrorIcon color="error" />
    default:
      return <InfoIcon color="info" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'info'
  }
}

const formatTimestamp = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    return `${days}d ago`
  }
}

const NotificationCenter: React.FC = () => {
  const dispatch = useDispatch()
  const { notificationCenterOpen } = useSelector((state: RootState) => state.ui)

  const handleClose = () => {
    dispatch(setNotificationCenterOpen(false))
  }

  return (
    <Drawer
      anchor="right"
      open={notificationCenterOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 400,
          maxWidth: '90vw',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notifications</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {mockNotifications.map((notification, index) => (
          <React.Fragment key={notification.id}>
            <ListItem
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                      {notification.title}
                    </Typography>
                    <Chip
                      label={notification.type}
                      size="small"
                      color={getNotificationColor(notification.type) as any}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatTimestamp(notification.timestamp)}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
            {index < mockNotifications.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          View all notifications
        </Typography>
      </Box>
    </Drawer>
  )
}

export default NotificationCenter