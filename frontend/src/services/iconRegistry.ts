import type { LucideIcon } from 'lucide-react';
import type { IconRegistry } from '../types/icon';
import {
  // Authentication icons
  LogIn,
  LogOut,
  User,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Mail,
  Key,
  
  // Navigation icons
  Home,
  LayoutDashboard,
  Menu,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  
  // Cloud infrastructure icons
  Server,
  Database,
  Network,
  HardDrive,
  Cpu,
  Package,
  Scale,
  Cloud,
  
  // Monitoring icons
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Zap,
  AlertTriangle,
  Bell,
  Clock,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  
  // Security icons
  Shield,
  ShieldCheck,
  Award,
  Search,
  FileSearch,
  
  // Cost management icons
  DollarSign,
  PiggyBank,
  TrendingDown,
  FileText,
  Calculator,
  
  // Action icons
  Edit,
  Save,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Settings,
  MoreHorizontal,
  Search as SearchIcon,
  X as XIcon,
  File,
  GripVertical,
  
  // Status icons
  Check,
  CheckCircle,
  X,
  Info,
  HelpCircle,
  Loader,
  
  // Deployment icons
  Rocket,
  GitBranch,
  History,
  Play,
  Square,
  MessageSquare,
} from 'lucide-react';

class IconRegistryImpl implements IconRegistry {
  public icons: Map<string, LucideIcon> = new Map();
  
  public categories = {
    auth: [
      'auth-login', 'auth-logout', 'auth-user', 'auth-lock', 'auth-unlock',
      'auth-eye', 'auth-eye-off', 'auth-mail', 'auth-key'
    ],
    navigation: [
      'nav-home', 'nav-dashboard', 'nav-menu', 'nav-back', 'nav-forward',
      'nav-up', 'nav-down', 'nav-external'
    ],
    cloud: [
      'cloud-server', 'cloud-database', 'cloud-network', 'cloud-storage',
      'cloud-compute', 'cloud-container', 'cloud-load-balancer', 'cloud-cdn'
    ],
    monitoring: [
      'monitor-chart', 'monitor-line-chart', 'monitor-pie-chart', 'monitor-activity',
      'monitor-pulse', 'monitor-bell', 'monitor-clock', 'monitor-layout', 'monitor-trending',
      'monitor-trending-up', 'monitor-trending-down', 'monitor-alert', 'monitor-settings', 'monitor-memory', 
      'monitor-network', 'monitor-storage', 'monitor-dollar', 'monitor-check', 'monitor-speed', 
      'alert-triangle', 'alert-circle', 'info-circle', 'spinner', 'plus', 'chevron-up', 
      'chevron-down', 'trash', 'slack'
    ],
    security: [
      'security-shield', 'security-shield-check', 'security-lock', 'security-key',
      'security-certificate', 'security-scan', 'security-audit'
    ],
    cost: [
      'cost-dollar', 'cost-chart', 'cost-budget', 'cost-savings',
      'cost-report', 'cost-calculator'
    ],
    actions: [
      'action-edit', 'action-delete', 'action-save', 'action-copy',
      'action-download', 'action-upload', 'action-refresh', 'action-settings',
      'action-more', 'action-search', 'action-clear', 'action-drag', 'action-file'
    ],
    status: [
      'status-check', 'status-check-circle', 'status-x', 'status-warning', 'status-info',
      'status-help', 'status-loading'
    ],
    deployment: [
      'deploy-rocket', 'deploy-pipeline', 'deploy-history', 'deploy-start', 'deploy-stop'
    ]
  };

  constructor() {
    this.initializeIcons();
  }

  private initializeIcons(): void {
    // Authentication icons
    this.register('auth-login', LogIn);
    this.register('auth-logout', LogOut);
    this.register('auth-user', User);
    this.register('auth-lock', Lock);
    this.register('auth-unlock', Unlock);
    this.register('auth-eye', Eye);
    this.register('auth-eye-off', EyeOff);
    this.register('auth-mail', Mail);
    this.register('auth-key', Key);
    
    // Navigation icons
    this.register('nav-home', Home);
    this.register('nav-dashboard', LayoutDashboard);
    this.register('nav-menu', Menu);
    this.register('nav-back', ArrowLeft);
    this.register('nav-forward', ArrowRight);
    this.register('nav-up', ArrowUp);
    this.register('nav-down', ArrowDown);
    this.register('nav-external', ExternalLink);
    
    // Cloud infrastructure icons
    this.register('cloud-server', Server);
    this.register('cloud-database', Database);
    this.register('cloud-network', Network);
    this.register('cloud-storage', HardDrive);
    this.register('cloud-compute', Cpu);
    this.register('cloud-container', Package);
    this.register('cloud-load-balancer', Scale);
    this.register('cloud-cdn', Cloud);
    
    // Monitoring icons
    this.register('monitor-chart', BarChart3);
    this.register('monitor-line-chart', TrendingUp);
    this.register('monitor-pie-chart', PieChart);
    this.register('monitor-activity', Activity);
    this.register('monitor-pulse', Zap);
    this.register('monitor-bell', Bell);
    this.register('monitor-clock', Clock);
    this.register('monitor-layout', LayoutDashboard);
    this.register('monitor-trending', TrendingUp);
    this.register('monitor-trending-up', TrendingUp);
    this.register('monitor-trending-down', TrendingDown);
    this.register('monitor-alert', AlertTriangle);
    this.register('monitor-settings', Settings);
    this.register('monitor-memory', HardDrive);
    this.register('monitor-network', Network);
    this.register('monitor-storage', HardDrive);
    this.register('monitor-dollar', DollarSign);
    this.register('monitor-check', CheckCircle);
    this.register('monitor-speed', Zap);
    
    // Alert and status icons
    this.register('alert-triangle', AlertTriangle);
    this.register('alert-circle', AlertTriangle);
    this.register('info-circle', Info);
    this.register('spinner', Loader);
    this.register('plus', Plus);
    this.register('chevron-up', ChevronUp);
    this.register('chevron-down', ChevronDown);
    this.register('trash', Trash2);
    this.register('slack', MessageSquare);
    
    // Simple name aliases for common icons
    this.register('mail', Mail);
    this.register('bell', Bell);
    this.register('settings', Settings);
    
    // Security icons
    this.register('security-shield', Shield);
    this.register('security-shield-check', ShieldCheck);
    this.register('security-lock', Lock);
    this.register('security-key', Key);
    this.register('security-certificate', Award);
    this.register('security-scan', Search);
    this.register('security-audit', FileSearch);
    
    // Cost management icons
    this.register('cost-dollar', DollarSign);
    this.register('cost-chart', TrendingUp);
    this.register('cost-budget', PiggyBank);
    this.register('cost-savings', TrendingDown);
    this.register('cost-report', FileText);
    this.register('cost-calculator', Calculator);
    
    // Action icons
    this.register('action-edit', Edit);
    this.register('action-delete', Trash2);
    this.register('action-save', Save);
    this.register('action-copy', Copy);
    this.register('action-download', Download);
    this.register('action-upload', Upload);
    this.register('action-refresh', RefreshCw);
    this.register('action-settings', Settings);
    this.register('action-more', MoreHorizontal);
    this.register('action-search', SearchIcon);
    this.register('action-clear', XIcon);
    this.register('action-drag', GripVertical);
    this.register('action-file', File);
    
    // Status icons
    this.register('status-check', Check);
    this.register('status-check-circle', CheckCircle);
    this.register('status-x', X);
    this.register('status-warning', AlertTriangle);
    this.register('status-info', Info);
    this.register('status-help', HelpCircle);
    this.register('status-loading', Loader);
    
    // Deployment icons
    this.register('deploy-rocket', Rocket);
    this.register('deploy-pipeline', GitBranch);
    this.register('deploy-history', History);
    this.register('deploy-start', Play);
    this.register('deploy-stop', Square);
  }

  public register(name: string, component: LucideIcon): void {
    this.icons.set(name, component);
  }

  public get(name: string): LucideIcon | null {
    return this.icons.get(name) || null;
  }

  public getCategory(category: keyof IconRegistry['categories']): string[] {
    return this.categories[category] || [];
  }

  public exists(name: string): boolean {
    return this.icons.has(name);
  }
}

// Create and export singleton instance
export const iconRegistry = new IconRegistryImpl();