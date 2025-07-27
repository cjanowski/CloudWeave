# Icon System Documentation

## Overview

The CloudWeave application now uses a professional icon system based on Lucide React icons, replacing the previous Material-UI icons. This system provides consistent, scalable, and visually appealing icons that align with the application's premium cloud platform aesthetic.

## Quick Start

```tsx
import { Icon } from '../components/common/Icon';

// Basic usage
<Icon name="auth-login" />

// With size and accessibility
<Icon name="auth-login" size="lg" aria-label="Login" />

// With custom styling
<Icon name="cloud-server" size="md" color="#1976d2" className="server-icon" />
```

## Available Icon Names

### Authentication Icons
- `auth-login` - Login/sign in
- `auth-logout` - Logout/sign out  
- `auth-user` - User profile
- `auth-lock` - Locked/secure
- `auth-unlock` - Unlocked
- `auth-eye` - Show password
- `auth-eye-off` - Hide password
- `auth-mail` - Email
- `auth-key` - API key/authentication

### Navigation Icons
- `nav-home` - Home page
- `nav-dashboard` - Dashboard
- `nav-menu` - Menu/hamburger
- `nav-back` - Back/previous
- `nav-forward` - Forward/next
- `nav-up` - Up arrow
- `nav-down` - Down arrow
- `nav-external` - External link

### Cloud Infrastructure Icons
- `cloud-server` - Server/compute
- `cloud-database` - Database
- `cloud-network` - Network
- `cloud-storage` - Storage/disk
- `cloud-compute` - CPU/processing
- `cloud-container` - Container/package
- `cloud-load-balancer` - Load balancer
- `cloud-cdn` - CDN/global

### Monitoring Icons
- `monitor-chart` - Bar chart
- `monitor-line-chart` - Line chart/trending
- `monitor-pie-chart` - Pie chart
- `monitor-activity` - Activity/pulse
- `monitor-pulse` - Performance pulse
- `monitor-alert` - Alert/warning
- `monitor-bell` - Notification
- `monitor-clock` - Time/schedule

### Security Icons
- `security-shield` - Security/protection
- `security-shield-check` - Verified security
- `security-lock` - Locked/secure
- `security-key` - Security key
- `security-certificate` - Certificate/award
- `security-scan` - Security scan
- `security-audit` - Security audit

### Cost Management Icons
- `cost-dollar` - Dollar/money
- `cost-chart` - Cost trending
- `cost-budget` - Budget/savings
- `cost-savings` - Cost reduction
- `cost-report` - Cost report
- `cost-calculator` - Calculator

### Action Icons
- `action-edit` - Edit/modify
- `action-delete` - Delete/remove
- `action-save` - Save
- `action-copy` - Copy/duplicate
- `action-download` - Download
- `action-upload` - Upload
- `action-refresh` - Refresh/reload
- `action-settings` - Settings/configure
- `action-more` - More options
- `action-search` - Search
- `action-clear` - Clear/reset
- `action-drag` - Drag handle
- `action-file` - File

### Status Icons
- `status-check` - Success/complete
- `status-x` - Error/close
- `status-warning` - Warning/caution
- `status-info` - Information
- `status-help` - Help/question
- `status-loading` - Loading/spinner

## Icon Sizes

The icon system supports predefined sizes and custom numeric values:

- `xs` - 12px (small inline icons)
- `sm` - 16px (form field icons, small buttons)
- `md` - 20px (default size, navigation icons)
- `lg` - 24px (large buttons, headers)
- `xl` - 32px (hero sections, large displays)
- Custom: Any number for pixel size

## Theme Integration

Icons automatically adapt to the current theme (light/dark mode) using the Redux store. The system provides appropriate colors and contrast ratios for both themes.

## Accessibility

The icon system includes comprehensive accessibility features:

- Proper ARIA labels for screen readers
- `aria-hidden` support for decorative icons
- High contrast ratios in both light and dark themes
- Keyboard navigation support for interactive icons

## Error Handling

The system includes robust error handling:

- Fallback icons for missing/invalid icon names
- Error boundaries to prevent crashes
- Development warnings for missing icons
- Graceful degradation

## Performance

- Tree-shaking support (only imports used icons)
- Optimized SVG rendering
- Memoized components to prevent unnecessary re-renders
- Minimal bundle size impact

## Migration from Material-UI Icons

When migrating from Material-UI icons, use this mapping:

| Material-UI | New Icon Name |
|-------------|---------------|
| `Email` | `auth-mail` |
| `Lock` | `auth-lock` |
| `Visibility` | `auth-eye` |
| `VisibilityOff` | `auth-eye-off` |
| `Person` | `auth-user` |
| `Dashboard` | `nav-dashboard` |
| `Home` | `nav-home` |
| `Menu` | `nav-menu` |
| `ArrowBack` | `nav-back` |
| `Server` | `cloud-server` |
| `Storage` | `cloud-storage` |
| `BarChart` | `monitor-chart` |
| `TrendingUp` | `monitor-line-chart` |
| `Security` | `security-shield` |
| `Settings` | `action-settings` |

## Development Tools

Use the `IconDemo` component to preview all available icons:

```tsx
import { IconDemo } from '../components/common/IconDemo';

// In your development component
<IconDemo />
```

## Testing

The icon system includes comprehensive tests. Run them with:

```bash
npm run test src/components/common/__tests__/Icon.test.tsx
```

## Adding New Icons

To add new icons to the system:

1. Import the icon from Lucide React in `iconRegistry.ts`
2. Add it to the appropriate category
3. Register it in the `initializeIcons()` method
4. Update this documentation

## Best Practices

1. Always provide `aria-label` for interactive icons
2. Use `aria-hidden="true"` for purely decorative icons
3. Choose appropriate sizes for context
4. Use semantic icon names that clearly represent functionality
5. Test icons in both light and dark themes
6. Ensure sufficient color contrast for accessibility

---

# Advanced UI Components Documentation

## Overview

CloudWeave now includes a comprehensive set of advanced UI components designed specifically for cloud management platforms. These components provide enhanced functionality while maintaining the glassmorphism design aesthetic.

## Data Table Component

A feature-rich data table with sorting, filtering, pagination, and row selection.

```tsx
import { DataTable, type Column } from '../components/common/DataTable';

const columns: Column[] = [
  { key: 'name', label: 'Server Name', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true, filterable: true },
  { key: 'cpu', label: 'CPU Usage', sortable: true, align: 'center' },
];

const data = [
  { id: '1', name: 'Web Server 1', status: 'Running', cpu: '45%' },
  { id: '2', name: 'Database Server', status: 'Running', cpu: '23%' },
];

<DataTable
  data={data}
  columns={columns}
  isDark={isDark}
  selectable
  onSelectionChange={(selected) => console.log('Selected:', selected)}
  onRowClick={(row) => console.log('Clicked:', row)}
/>
```

### Features
- **Sorting**: Click column headers to sort
- **Filtering**: Built-in search and column filters
- **Pagination**: Configurable page sizes
- **Row Selection**: Single or multiple row selection
- **Responsive**: Mobile-friendly design
- **Custom Rendering**: Custom cell content rendering
- **Loading States**: Built-in loading indicators

## Chart Components

Comprehensive chart library using Chart.js with glassmorphism styling.

```tsx
import { 
  LineChart, 
  BarChart, 
  DoughnutChart, 
  RadarChart, 
  ScatterChart,
  type ChartData 
} from '../components/common/ChartComponents';

const chartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'CPU Usage',
      data: [65, 59, 80, 81, 56, 55],
      fill: true,
    },
  ],
};

<LineChart
  data={chartData}
  title="Resource Usage Over Time"
  height={300}
  isDark={isDark}
/>
```

### Available Chart Types
- **LineChart**: Time series and trend data
- **BarChart**: Categorical data comparison
- **DoughnutChart**: Proportional data
- **RadarChart**: Multi-dimensional metrics
- **ScatterChart**: Correlation analysis

### Features
- **Theme Integration**: Automatic light/dark mode support
- **Responsive**: Adapts to container size
- **Interactive**: Hover tooltips and animations
- **Customizable**: Extensive styling options
- **Accessible**: Screen reader support

## Advanced Form Components

Enhanced form components for better user experience.

### Multi-Select Component

```tsx
import { MultiSelect } from '../components/common/AdvancedForms';

const options = [
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'azure', label: 'Microsoft Azure' },
  { value: 'gcp', label: 'Google Cloud Platform' },
];

<MultiSelect
  options={options}
  value={selectedOptions}
  onChange={setSelectedOptions}
  label="Select Cloud Providers"
  placeholder="Choose providers..."
  isDark={isDark}
/>
```

### Date Picker Component

```tsx
import { DatePicker } from '../components/common/AdvancedForms';

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  label="Select Date"
  placeholder="Choose a date..."
  isDark={isDark}
/>
```

### File Upload Component

```tsx
import { FileUpload } from '../components/common/AdvancedForms';

<FileUpload
  onFileSelect={(files) => console.log('Selected files:', files)}
  accept=".json,.yaml,.yml"
  multiple
  maxSize={10}
  label="Upload Configuration Files"
  isDark={isDark}
/>
```

### Toggle Switch Component

```tsx
import { ToggleSwitch } from '../components/common/AdvancedForms';

<ToggleSwitch
  checked={toggleValue}
  onChange={setToggleValue}
  label="Enable Auto-scaling"
  isDark={isDark}
/>
```

## Drag and Drop Components

Interactive drag and drop interfaces for enhanced user experience.

### Sortable List Component

```tsx
import { SortableList, type DraggableItem } from '../components/common/DragAndDrop';

const items: DraggableItem[] = [
  { id: '1', content: 'Infrastructure Monitoring' },
  { id: '2', content: 'Cost Optimization' },
];

<SortableList
  items={items}
  onReorder={setItems}
  isDark={isDark}
/>
```

### Kanban Board Component

```tsx
import { KanbanBoard, type KanbanColumn } from '../components/common/DragAndDrop';

const columns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    items: [{ id: '1', content: 'Deploy new server' }],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    items: [{ id: '2', content: 'Database migration' }],
  },
];

<KanbanBoard
  columns={columns}
  onColumnUpdate={setColumns}
  isDark={isDark}
/>
```

### File Drop Zone Component

```tsx
import { FileDropZone } from '../components/common/DragAndDrop';

<FileDropZone
  onFilesDrop={(files) => console.log('Dropped files:', files)}
  acceptTypes={['image/*', 'application/pdf']}
  maxFiles={5}
  isDark={isDark}
/>
```

## Metric Card Component

Display key performance indicators with change indicators.

```tsx
import { MetricCard } from '../components/common/ChartComponents';

<MetricCard
  title="Total Servers"
  value="24"
  change={{ value: 12, isPositive: true }}
  icon="cloud-server"
  color="#3B82F6"
  isDark={isDark}
/>
```

## Demo Page

Visit the Components Demo page to see all components in action:

```tsx
import { ComponentsDemoPage } from '../pages/ComponentsDemo/ComponentsDemoPage';

// Add to your routing
<Route path="/components-demo" element={<ComponentsDemoPage />} />
```

## Best Practices

1. **Theme Consistency**: Always pass the `isDark` prop for proper theming
2. **Accessibility**: Components include built-in accessibility features
3. **Performance**: Use React.memo for frequently re-rendered components
4. **Error Handling**: Implement proper error boundaries
5. **Responsive Design**: Components are mobile-friendly by default
6. **TypeScript**: Full TypeScript support with comprehensive type definitions

## Integration Examples

### Dashboard Integration

```tsx
// In your dashboard component
import { DataTable, LineChart, MetricCard } from '../components/common';

export const Dashboard = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <MetricCard
          title="Active Servers"
          value="24"
          icon="cloud-server"
          isDark={isDark}
        />
        <MetricCard
          title="Monthly Cost"
          value="$2,847"
          icon="cost-dollar"
          isDark={isDark}
        />
      </div>
      
      <LineChart
        data={metricsData}
        title="Resource Usage"
        height={300}
        isDark={isDark}
      />
      
      <DataTable
        data={serversData}
        columns={serverColumns}
        isDark={isDark}
      />
    </div>
  );
};
```

### Form Integration

```tsx
// In your form component
import { MultiSelect, DatePicker, FileUpload } from '../components/common/AdvancedForms';

export const DeploymentForm = () => {
  const { theme } = useSelector((state: any) => state.ui);
  const isDark = theme === 'dark';

  return (
    <form>
      <MultiSelect
        options={cloudProviders}
        value={selectedProviders}
        onChange={setSelectedProviders}
        label="Cloud Providers"
        isDark={isDark}
      />
      
      <DatePicker
        value={deploymentDate}
        onChange={setDeploymentDate}
        label="Deployment Date"
        isDark={isDark}
      />
      
      <FileUpload
        onFileSelect={handleConfigFiles}
        accept=".yaml,.yml,.json"
        label="Configuration Files"
        isDark={isDark}
      />
    </form>
  );
};
```

## Performance Considerations

1. **Virtualization**: For large datasets, consider implementing virtual scrolling
2. **Memoization**: Use React.memo for expensive components
3. **Lazy Loading**: Load chart components only when needed
4. **Debouncing**: Debounce search and filter inputs
5. **Pagination**: Use pagination for large data tables

## Accessibility Features

All components include:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- ARIA labels and descriptions
- Semantic HTML structure