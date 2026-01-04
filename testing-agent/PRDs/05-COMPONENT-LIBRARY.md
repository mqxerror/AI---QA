# QA Testing Dashboard - Component Library Reference

**Version:** 1.0  
**Purpose:** BMAD Component Reference for Development  
**Last Updated:** January 2026

---

## 1. LAYOUT COMPONENTS

### AppLayout
The main layout wrapper with sidebar and header.

```tsx
<AppLayout>
  <Sidebar />
  <div className="flex-1">
    <Header />
    <main className="p-6">{children}</main>
  </div>
</AppLayout>
```

### Sidebar
Fixed navigation sidebar with links and user menu.

```tsx
interface SidebarProps {
  collapsed?: boolean;
}

// Nav items configuration
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Globe, label: 'Websites', href: '/websites' },
  { icon: TestTube, label: 'Test Runs', href: '/test-runs' },
  { icon: AlertCircle, label: 'Failures', href: '/failures' },
  { icon: Activity, label: 'Activity Log', href: '/activities' },
  { icon: Cog, label: 'Processes', href: '/processes' },
  { icon: Server, label: 'System Status', href: '/status' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];
```

---

## 2. UI PRIMITIVES

### Button

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
}

// Variants
// primary: gradient blue-purple, white text
// secondary: transparent, border, muted text
// ghost: no border, hover background
// danger: red gradient
```

**Usage:**
```tsx
<Button variant="primary" icon={Plus}>Add Website</Button>
<Button variant="secondary" loading>Running...</Button>
<Button variant="danger" icon={Trash}>Delete</Button>
```

### StatusBadge

```tsx
interface StatusBadgeProps {
  status: 'pass' | 'fail' | 'running' | 'idle' | 'warning';
  size?: 'sm' | 'md';
}

// Colors
// pass: green background, green text
// fail: red background, red text
// running: purple background, purple text (animated pulse)
// idle: gray background, gray text
// warning: amber background, amber text
```

**Usage:**
```tsx
<StatusBadge status="pass" />
<StatusBadge status="fail" />
<StatusBadge status="running" />
```

### Card

```tsx
interface CardProps {
  className?: string;
  hoverable?: boolean;
  children: React.ReactNode;
}

// Styles
// background: rgba(22, 33, 62, 0.8)
// border: 1px solid rgba(255, 255, 255, 0.1)
// border-radius: 12px
// backdrop-filter: blur(10px)
```

**Usage:**
```tsx
<Card hoverable>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Modal

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

**Usage:**
```tsx
<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Add Website"
>
  <form onSubmit={handleSubmit}>
    <Input label="Name" {...nameField} />
    <Input label="URL" {...urlField} />
  </form>
</Modal>
```

### Dropdown

```tsx
interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
}

interface DropdownItem {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}
```

**Usage:**
```tsx
<Dropdown
  trigger={<Button>Run Test ▼</Button>}
  items={[
    { icon: Zap, label: 'Smoke Test', onClick: () => runTest('smoke') },
    { icon: Gauge, label: 'Performance', onClick: () => runTest('performance') },
    { icon: Trash, label: 'Delete', onClick: handleDelete, danger: true },
  ]}
/>
```

---

## 3. DATA DISPLAY COMPONENTS

### DataTable

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<DataTable
  columns={[
    { id: 'name', header: 'Website', accessor: 'name' },
    { id: 'status', header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { id: 'actions', header: '', accessor: (row) => <ActionMenu row={row} /> },
  ]}
  data={websites}
  onRowClick={(row) => navigate(`/websites/${row.id}`)}
  loading={isLoading}
/>
```

### StatsCard

```tsx
interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
```

**Usage:**
```tsx
<StatsCard
  title="Total Websites"
  value={5}
  icon={Globe}
/>
<StatsCard
  title="Pass Rate (7d)"
  value="85%"
  icon={CheckCircle}
  trend={{ value: 5, direction: 'up' }}
  variant="success"
/>
```

### FilterTabs

```tsx
interface FilterTabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
}
```

**Usage:**
```tsx
<FilterTabs
  tabs={[
    { id: 'all', label: 'All', count: 41 },
    { id: 'smoke', label: 'Smoke', count: 9 },
    { id: 'performance', label: 'Performance', count: 4 },
  ]}
  activeTab={activeFilter}
  onChange={setActiveFilter}
/>
```

### EmptyState

```tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

**Usage:**
```tsx
<EmptyState
  icon={Globe}
  title="No Websites Yet"
  description="Add your first website to start testing."
  action={{
    label: 'Add Website',
    onClick: () => setShowAddModal(true),
  }}
/>
```

---

## 4. FEATURE COMPONENTS

### WebsiteRow

```tsx
interface WebsiteRowProps {
  website: Website;
  onRunTest: (testType: string) => void;
  onDelete: () => void;
}
```

### TestRunRow

```tsx
interface TestRunRowProps {
  testRun: TestRun;
  expanded?: boolean;
  onToggle: () => void;
}
```

### ProcessCard

```tsx
interface ProcessCardProps {
  process: Process;
  onCancel?: () => void;
}

// Displays:
// - Test type icon + name
// - Status badge
// - Website info
// - Duration (live counter if running)
// - Error message if failed
```

### ServiceHealthCard

```tsx
interface ServiceHealthCardProps {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  endpoint?: string;
  lastCheck?: Date;
}
```

---

## 5. FORM COMPONENTS

### Input

```tsx
interface InputProps {
  label: string;
  type?: 'text' | 'url' | 'email' | 'password';
  placeholder?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}
```

### Select

```tsx
interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}
```

---

## 6. FEEDBACK COMPONENTS

### Toast

```tsx
interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Usage via hook
const { toast } = useToast();
toast.success('Website added successfully');
toast.error('Failed to run test');
```

### LoadingSpinner

```tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

### Skeleton

```tsx
interface SkeletonProps {
  variant: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  className?: string;
}
```

---

## 7. UTILITY COMPONENTS

### TestTypeIcon

```tsx
interface TestTypeIconProps {
  type: 'smoke' | 'performance' | 'load' | 'accessibility' | 'security' | 'seo' | 'visual' | 'pixel';
  size?: 'sm' | 'md' | 'lg';
}

// Icon mapping
const testTypeIcons = {
  smoke: { emoji: '💨', icon: Zap },
  performance: { emoji: '⚡', icon: Gauge },
  load: { emoji: '📊', icon: BarChart },
  accessibility: { emoji: '♿', icon: Accessibility },
  security: { emoji: '🔒', icon: Shield },
  seo: { emoji: '📈', icon: TrendingUp },
  visual: { emoji: '👁️', icon: Eye },
  pixel: { emoji: '🔍', icon: Search },
};
```

### RelativeTime

```tsx
interface RelativeTimeProps {
  date: Date | string;
  format?: 'relative' | 'full';
}

// Examples:
// "2 hours ago"
// "Dec 31, 04:54 AM"
```

### Duration

```tsx
interface DurationProps {
  ms: number;
  precision?: 'seconds' | 'milliseconds';
}

// Examples:
// "0.52s"
// "12m 54s"
// "1h 23m"
```

---

## 8. COMPOSITION PATTERNS

### Page Layout Pattern

```tsx
export function WebsitesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Websites</h1>
        <Button variant="primary" icon={Plus} onClick={openModal}>
          Add Website
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : websites.length === 0 ? (
        <EmptyState {...emptyProps} />
      ) : (
        <DataTable columns={columns} data={websites} />
      )}

      {/* Modal */}
      <AddWebsiteModal isOpen={showModal} onClose={closeModal} />
    </div>
  );
}
```

### Stats Grid Pattern

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard title="Total Websites" value={stats.websites} icon={Globe} />
  <StatsCard title="Pass Rate" value={`${stats.passRate}%`} icon={CheckCircle} />
  <StatsCard title="Total Tests" value={stats.tests} icon={TestTube} />
  <StatsCard title="System Health" value={stats.health} icon={Server} />
</div>
```

### Filter + Table Pattern

```tsx
<div className="space-y-4">
  <FilterTabs tabs={filterTabs} activeTab={filter} onChange={setFilter} />
  <DataTable 
    columns={columns} 
    data={filteredData}
    loading={isLoading}
  />
</div>
```

---

**COMPONENT LIBRARY COMPLETE** ✓

This document provides the component blueprint for BMAD development.
