
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import { GlassCard } from './GlassCard';
import { Icon } from './Icon';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  RadialLinearScale
);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    pointBackgroundColor?: string | string[];
    pointBorderColor?: string | string[];
    pointRadius?: number;
    pointHoverRadius?: number;
  }[];
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    title?: {
      display?: boolean;
      text?: string;
      color?: string;
      font?: {
        size?: number;
        weight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
      };
    };
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        color?: string;
        usePointStyle?: boolean;
        padding?: number;
      };
    };
    tooltip?: {
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
      };
    };
    y?: {
      display?: boolean;
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
      };
    };
  };
}

export interface ChartComponentProps {
  data: ChartData;
  options?: ChartOptions;
  title?: string;
  height?: number;
  className?: string;
  isDark?: boolean;
}

// Default color palette for charts
const getChartColors = (isDark: boolean) => ({
  primary: isDark ? '#3B82F6' : '#2563EB',
  secondary: isDark ? '#10B981' : '#059669',
  tertiary: isDark ? '#F59E0B' : '#D97706',
  quaternary: isDark ? '#EF4444' : '#DC2626',
  quinary: isDark ? '#8B5CF6' : '#7C3AED',
  senary: isDark ? '#06B6D4' : '#0891B2',
  septenary: isDark ? '#F97316' : '#EA580C',
  octonary: isDark ? '#EC4899' : '#DB2777',
});

// Line Chart Component
export function LineChart({ 
  data, 
  options, 
  title, 
  height = 300, 
  className = '', 
  isDark = false 
}: ChartComponentProps) {
  const colors = getChartColors(isDark);
  
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#ffffff' : '#333333',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#ffffff' : '#333333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
    },
  };

  // Apply default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || Object.values(colors)[index % Object.values(colors).length],
      backgroundColor: dataset.backgroundColor || 
        (dataset.fill ? `${Object.values(colors)[index % Object.values(colors).length]}20` : undefined),
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
      pointRadius: dataset.pointRadius || 4,
      pointHoverRadius: dataset.pointHoverRadius || 6,
    })),
  };

  return (
    <GlassCard className={`chart-container ${className}`} isDark={isDark}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Line data={enhancedData} options={{ ...defaultOptions, ...options }} />
      </div>
    </GlassCard>
  );
}

// Bar Chart Component
export function BarChart({ 
  data, 
  options, 
  title, 
  height = 300, 
  className = '', 
  isDark = false 
}: ChartComponentProps) {
  const colors = getChartColors(isDark);
  
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#ffffff' : '#333333',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#ffffff' : '#333333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
    },
  };

  // Apply default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || Object.values(colors)[index % Object.values(colors).length],
      borderColor: dataset.borderColor || Object.values(colors)[index % Object.values(colors).length],
      borderWidth: dataset.borderWidth || 1,
    })),
  };

  return (
    <GlassCard className={`chart-container ${className}`} isDark={isDark}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Bar data={enhancedData} options={{ ...defaultOptions, ...options }} />
      </div>
    </GlassCard>
  );
}

// Doughnut Chart Component
export function DoughnutChart({ 
  data, 
  options, 
  title, 
  height = 300, 
  className = '', 
  isDark = false 
}: ChartComponentProps) {
  const colors = getChartColors(isDark);
  
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: isDark ? '#ffffff' : '#333333',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#ffffff' : '#333333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
  };

  // Apply default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || 
        (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : 
         data.labels.map((_, i) => Object.values(colors)[i % Object.values(colors).length])),
      borderColor: dataset.borderColor || 
        (Array.isArray(dataset.borderColor) ? dataset.borderColor : 
         data.labels.map((_, i) => Object.values(colors)[i % Object.values(colors).length])),
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  return (
    <GlassCard className={`chart-container ${className}`} isDark={isDark}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Doughnut data={enhancedData} options={{ ...defaultOptions, ...options }} />
      </div>
    </GlassCard>
  );
}

// Radar Chart Component
export function RadarChart({ 
  data, 
  options, 
  title, 
  height = 300, 
  className = '', 
  isDark = false 
}: ChartComponentProps) {
  const colors = getChartColors(isDark);
  
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#ffffff' : '#333333',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#ffffff' : '#333333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  };

  // Apply default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || Object.values(colors)[index % Object.values(colors).length],
      backgroundColor: dataset.backgroundColor || 
        `${Object.values(colors)[index % Object.values(colors).length]}20`,
      borderWidth: dataset.borderWidth || 2,
      pointBackgroundColor: dataset.pointBackgroundColor || Object.values(colors)[index % Object.values(colors).length],
      pointBorderColor: dataset.pointBorderColor || Object.values(colors)[index % Object.values(colors).length],
      pointRadius: dataset.pointRadius || 4,
      pointHoverRadius: dataset.pointHoverRadius || 6,
    })),
  };

  return (
    <GlassCard className={`chart-container ${className}`} isDark={isDark}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Radar data={enhancedData} options={{ ...defaultOptions, ...options }} />
      </div>
    </GlassCard>
  );
}

// Scatter Chart Component
export function ScatterChart({ 
  data, 
  options, 
  title, 
  height = 300, 
  className = '', 
  isDark = false 
}: ChartComponentProps) {
  const colors = getChartColors(isDark);
  
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!title,
        text: title,
        color: isDark ? '#ffffff' : '#333333',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#ffffff' : '#333333',
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#333333',
        bodyColor: isDark ? '#ffffff' : '#333333',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
      y: {
        display: true,
        grid: {
          display: true,
          color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDark ? '#ffffff' : '#666666',
        },
      },
    },
  };

  // Apply default colors if not provided
  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || Object.values(colors)[index % Object.values(colors).length],
      borderColor: dataset.borderColor || Object.values(colors)[index % Object.values(colors).length],
      pointBackgroundColor: dataset.pointBackgroundColor || Object.values(colors)[index % Object.values(colors).length],
      pointBorderColor: dataset.pointBorderColor || Object.values(colors)[index % Object.values(colors).length],
      pointRadius: dataset.pointRadius || 6,
      pointHoverRadius: dataset.pointHoverRadius || 8,
    })),
  };

  return (
    <GlassCard className={`chart-container ${className}`} isDark={isDark}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Scatter data={enhancedData} options={{ ...defaultOptions, ...options }} />
      </div>
    </GlassCard>
  );
}

// Metric Card Component for displaying key metrics
export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: string;
  color?: string;
  className?: string;
  isDark?: boolean;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  icon, 
  color = '#3B82F6', 
  className = '', 
  isDark = false 
}: MetricCardProps) {
  return (
    <GlassCard className={`metric-card ${className}`} isDark={isDark}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '14px', 
            color: isDark ? '#ffffff' : '#666666',
            marginBottom: '4px',
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold',
            color: isDark ? '#ffffff' : '#333333',
            marginBottom: change ? '8px' : '0',
          }}>
            {value}
          </div>
          {change && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontSize: '12px',
              color: change.isPositive ? '#10B981' : '#EF4444',
            }}>
              <Icon 
                name={change.isPositive ? 'nav-up' : 'nav-down'} 
                size="xs" 
                color={change.isPositive ? '#10B981' : '#EF4444'}
              />
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px',
            backgroundColor: `${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon name={icon} size="lg" color={color} />
          </div>
        )}
      </div>
    </GlassCard>
  );
} 