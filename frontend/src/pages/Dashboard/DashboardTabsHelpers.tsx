// Helper functions for Dashboard tabs

export const formatRelativeTime = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

export const getActivityColor = (type: string) => {
  const colors = {
    deployment: '#10B981',
    infrastructure: '#3B82F6',
    security: '#F59E0B',
    cost: '#EF4444',
    alert: '#8B5CF6',
    created: '#10B981',
    updated: '#3B82F6',
    deleted: '#EF4444',
    deployed: '#8B5CF6'
  };
  return colors[type as keyof typeof colors] || '#666666'; // Default color
};

export const getActivityIcon = (type: string) => {
  const icons = {
    deployment: 'action-upload',
    infrastructure: 'cloud-server',
    security: 'security-shield',
    cost: 'cost-dollar',
    alert: 'alert-triangle',
    created: 'plus',
    updated: 'edit',
    deleted: 'trash',
    deployed: 'action-upload'
  };
  return icons[type as keyof typeof icons] || 'activity'; // Default icon
};