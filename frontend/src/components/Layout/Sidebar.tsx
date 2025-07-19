import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Collapse,
  useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Cloud as CloudIcon,
  RocketLaunch as DeployIcon,
  Monitor as MonitoringIcon,
  Security as SecurityIcon,
  AttachMoney as CostIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  Storage as InfraIcon,
  Timeline as MetricsIcon,
  NotificationImportant as AlertsIcon,
  Policy as PolicyIcon,
  Assessment as ReportsIcon,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'

interface SidebarProps {
  open: boolean
  width: number
  collapsedWidth: number
  isMobile: boolean
}

interface NavItem {
  id: string
  label: string
  icon: React.ReactElement
  path?: string
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: <CloudIcon />,
    path: '/infrastructure',
    children: [
      { id: 'resources', label: 'Resources', icon: <InfraIcon />, path: '/infrastructure/resources' },
      { id: 'templates', label: 'Templates', icon: <PolicyIcon />, path: '/infrastructure/templates' },
    ],
  },
  {
    id: 'deployments',
    label: 'Deployments',
    icon: <DeployIcon />,
    path: '/deployments',
    children: [
      { id: 'pipelines', label: 'Pipelines', icon: <DeployIcon />, path: '/deployments/pipelines' },
      { id: 'history', label: 'History', icon: <ReportsIcon />, path: '/deployments/history' },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    icon: <MonitoringIcon />,
    path: '/monitoring',
    children: [
      { id: 'metrics', label: 'Metrics', icon: <MetricsIcon />, path: '/monitoring/metrics' },
      { id: 'alerts', label: 'Alerts', icon: <AlertsIcon />, path: '/monitoring/alerts' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: <SecurityIcon />,
    path: '/security',
    children: [
      { id: 'policies', label: 'Policies', icon: <PolicyIcon />, path: '/security/policies' },
      { id: 'compliance', label: 'Compliance', icon: <ReportsIcon />, path: '/security/compliance' },
    ],
  },
  {
    id: 'cost-management',
    label: 'Cost Management',
    icon: <CostIcon />,
    path: '/cost-management',
    children: [
      { id: 'overview', label: 'Overview', icon: <ReportsIcon />, path: '/cost-management/overview' },
      { id: 'optimization', label: 'Optimization', icon: <MetricsIcon />, path: '/cost-management/optimization' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <SettingsIcon />,
    path: '/settings',
  },
]

const Sidebar: React.FC<SidebarProps> = ({ open, width, collapsedWidth, isMobile }) => {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      // Toggle expansion for items with children
      setExpandedItems(prev =>
        prev.includes(item.id)
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      )
    } else if (item.path) {
      // Navigate to the path
      navigate(item.path)
    }
  }

  const isItemActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = item.path ? isItemActive(item.path) : false
    const isExpanded = expandedItems.includes(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            selected={isActive}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              pl: level > 0 ? 4 : 2.5,
              '&.Mui-selected': {
                backgroundColor: theme.palette.primary.main + '20',
                borderRight: `3px solid ${theme.palette.primary.main}`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.main + '30',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: isActive ? theme.palette.primary.main : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                opacity: open ? 1 : 0,
                color: isActive ? theme.palette.primary.main : 'inherit',
              }}
            />
            {hasChildren && open && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {hasChildren && (
          <Collapse in={isExpanded && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    )
  }

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
          px: 2.5,
          py: 2,
          minHeight: 64,
        }}
      >
        <CloudIcon
          sx={{
            color: theme.palette.primary.main,
            fontSize: 32,
            mr: open ? 1 : 0,
          }}
        />
        {open && (
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 'bold',
              color: theme.palette.primary.main,
            }}
          >
            CloudWeave
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {navigationItems.map(item => renderNavItem(item))}
      </List>
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? width : collapsedWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: open ? width : collapsedWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  )
}

export default Sidebar