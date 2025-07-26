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