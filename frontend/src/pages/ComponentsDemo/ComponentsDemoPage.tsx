import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Icon } from '../../components/common/Icon';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { DataTable, type Column } from '../../components/common/DataTable';
import { 
  LineChart, 
  BarChart, 
  DoughnutChart, 
  RadarChart, 
  MetricCard,
  type ChartData 
} from '../../components/common/ChartComponents';
import { 
  MultiSelect, 
  DatePicker, 
  FileUpload, 
  ToggleSwitch 
} from '../../components/common/AdvancedForms';
import { 
  SortableList, 
  KanbanBoard,
  FileDropZone,
  type DraggableItem,
  type KanbanColumn 
} from '../../components/common/DragAndDrop';

// Sample data for demonstrations
const sampleTableData = [
  { id: '1', name: 'Web Server 1', status: 'Running', cpu: '45%', memory: '2.1GB', uptime: '15 days' },
  { id: '2', name: 'Database Server', status: 'Running', cpu: '23%', memory: '4.8GB', uptime: '8 days' },
  { id: '3', name: 'Load Balancer', status: 'Stopped', cpu: '0%', memory: '0GB', uptime: '0 days' },
  { id: '4', name: 'Cache Server', status: 'Running', cpu: '67%', memory: '1.2GB', uptime: '22 days' },
  { id: '5', name: 'File Server', status: 'Running', cpu: '12%', memory: '3.4GB', uptime: '5 days' },
];

const sampleChartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'CPU Usage',
      data: [65, 59, 80, 81, 56, 55],
      fill: true,
    },
    {
      label: 'Memory Usage',
      data: [28, 48, 40, 19, 86, 27],
      fill: true,
    },
  ],
};

const sampleDoughnutData: ChartData = {
  labels: ['AWS', 'Azure', 'GCP', 'Other'],
  datasets: [
    {
      label: 'Cloud Providers',
      data: [45, 25, 20, 10],
    },
  ],
};

const sampleMultiSelectOptions = [
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'azure', label: 'Microsoft Azure' },
  { value: 'gcp', label: 'Google Cloud Platform' },
  { value: 'digitalocean', label: 'DigitalOcean' },
  { value: 'linode', label: 'Linode' },
  { value: 'vultr', label: 'Vultr' },
];

const sampleKanbanData: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    items: [
      { id: '1', content: 'Deploy new web server' },
      { id: '2', content: 'Update SSL certificates' },
      { id: '3', content: 'Configure monitoring alerts' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    items: [
      { id: '4', content: 'Database migration' },
      { id: '5', content: 'Security audit' },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    items: [
      { id: '6', content: 'Backup configuration' },
      { id: '7', content: 'Load balancer setup' },
    ],
  },
];

export const ComponentsDemoPage: React.FC = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('tables');

  // State for form components
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [toggleValue, setToggleValue] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState(sampleKanbanData);
  const [sortableItems, setSortableItems] = useState<DraggableItem[]>([
    { id: '1', content: 'Infrastructure Monitoring' },
    { id: '2', content: 'Cost Optimization' },
    { id: '3', content: 'Security Compliance' },
    { id: '4', content: 'Performance Tuning' },
  ]);

  const tableColumns: Column[] = [
    { key: 'name', label: 'Server Name', sortable: true, filterable: true },
    { key: 'status', label: 'Status', sortable: true, filterable: true },
    { key: 'cpu', label: 'CPU Usage', sortable: true, align: 'center' },
    { key: 'memory', label: 'Memory', sortable: true, align: 'center' },
    { key: 'uptime', label: 'Uptime', sortable: true, align: 'center' },
  ];

  const tabs = [
    { id: 'tables', label: 'Data Tables', icon: 'monitor-chart' },
    { id: 'charts', label: 'Charts', icon: 'monitor-line-chart' },
    { id: 'forms', label: 'Advanced Forms', icon: 'action-edit' },
    { id: 'dragdrop', label: 'Drag & Drop', icon: 'action-drag' },
    { id: 'metrics', label: 'Metrics', icon: 'monitor-pulse' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '24px' }}
      >
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 'bold', 
          margin: '0 0 8px 0',
          color: isDark ? '#ffffff' : '#000000',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 50%, #1E40AF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Advanced UI Components Demo
        </h1>
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.7,
          margin: 0,
          color: isDark ? '#ffffff' : '#666666',
        }}>
          Explore the new advanced UI components for CloudWeave.
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <GlassCard isDark={isDark} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
          {tabs.map(tab => (
            <GlassButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              isDark={isDark}
              size="small"
            >
              <Icon name={tab.icon} size="sm" />
              {tab.label}
            </GlassButton>
          ))}
        </div>
      </GlassCard>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'tables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <GlassCard isDark={isDark}>
                <h2 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Data Table with Sorting & Filtering
                </h2>
                <DataTable
                  data={sampleTableData}
                  columns={tableColumns}
                  isDark={isDark}
                  selectable
                  onSelectionChange={(selected) => console.log('Selected:', selected)}
                />
              </GlassCard>
            </div>
          )}

          {activeTab === 'charts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Line Chart
                </h3>
                <LineChart
                  data={sampleChartData}
                  title="Resource Usage Over Time"
                  height={300}
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Bar Chart
                </h3>
                <BarChart
                  data={sampleChartData}
                  title="Monthly Resource Usage"
                  height={300}
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Doughnut Chart
                </h3>
                <DoughnutChart
                  data={sampleDoughnutData}
                  title="Cloud Provider Distribution"
                  height={300}
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Radar Chart
                </h3>
                <RadarChart
                  data={sampleChartData}
                  title="Performance Metrics"
                  height={300}
                  isDark={isDark}
                />
              </GlassCard>
            </div>
          )}

          {activeTab === 'forms' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Multi-Select
                </h3>
                <MultiSelect
                  options={sampleMultiSelectOptions}
                  value={selectedOptions}
                  onChange={setSelectedOptions}
                  label="Select Cloud Providers"
                  placeholder="Choose providers..."
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Date Picker
                </h3>
                <DatePicker
                  value={selectedDate}
                  onChange={setSelectedDate}
                  label="Select Date"
                  placeholder="Choose a date..."
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  File Upload
                </h3>
                <FileUpload
                  onFileSelect={(files) => console.log('Selected files:', files)}
                  accept=".json,.yaml,.yml"
                  multiple
                  maxSize={10}
                  label="Upload Configuration Files"
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Toggle Switch
                </h3>
                <ToggleSwitch
                  checked={toggleValue}
                  onChange={setToggleValue}
                  label="Enable Auto-scaling"
                  isDark={isDark}
                />
              </GlassCard>
            </div>
          )}

          {activeTab === 'dragdrop' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Sortable List
                </h3>
                <SortableList
                  items={sortableItems}
                  onReorder={setSortableItems}
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  Kanban Board
                </h3>
                <KanbanBoard
                  columns={kanbanColumns}
                  onColumnUpdate={setKanbanColumns}
                  isDark={isDark}
                />
              </GlassCard>

              <GlassCard isDark={isDark}>
                <h3 style={{ margin: '0 0 16px 0', color: isDark ? '#ffffff' : '#333333' }}>
                  File Drop Zone
                </h3>
                <FileDropZone
                  onFilesDrop={(files) => console.log('Dropped files:', files)}
                  acceptTypes={['image/*', 'application/pdf']}
                  maxFiles={5}
                  isDark={isDark}
                />
              </GlassCard>
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <MetricCard
                title="Total Servers"
                value="24"
                change={{ value: 12, isPositive: true }}
                icon="cloud-server"
                color="#3B82F6"
                isDark={isDark}
              />
              
              <MetricCard
                title="Active Deployments"
                value="8"
                change={{ value: 5, isPositive: false }}
                icon="cloud-compute"
                color="#10B981"
                isDark={isDark}
              />
              
              <MetricCard
                title="Monthly Cost"
                value="$2,847"
                change={{ value: 8, isPositive: true }}
                icon="cost-dollar"
                color="#F59E0B"
                isDark={isDark}
              />
              
              <MetricCard
                title="Uptime"
                value="99.9%"
                change={{ value: 0.1, isPositive: true }}
                icon="monitor-pulse"
                color="#8B5CF6"
                isDark={isDark}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}; 