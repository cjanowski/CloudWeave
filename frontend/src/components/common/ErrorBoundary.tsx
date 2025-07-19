import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Alert } from '@mui/material'
import { Refresh } from '@mui/icons-material'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            p: 3,
            textAlign: 'center',
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                {this.state.error.stack}
              </Typography>
            )}
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
            >
              Reload Page
            </Button>
            <Button
              variant="outlined"
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Box>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary