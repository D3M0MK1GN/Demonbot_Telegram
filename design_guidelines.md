# CyberGuard - Victim Assistance System Design Guidelines

## Design Approach
**System-Based Approach**: Adapting Material Design Dark with cybersecurity-focused enhancements. Drawing inspiration from Linear's clean data presentation and Notion's organizational clarity. Dark theme is essential for cybersecurity context - reduces eye strain during extended incident monitoring sessions and establishes professional, serious tone.

## Core Design Elements

### Typography
**Font Family**: Inter (primary) via Google Fonts CDN for UI, Roboto Mono for case IDs, timestamps, IP addresses
- **Headings**: Inter Semi-Bold (text-xl to text-3xl)
- **Body**: Inter Regular (text-sm to text-base)
- **Data/Metrics**: Inter Medium (text-2xl to text-4xl)
- **Technical Data**: Roboto Mono Regular (text-xs to text-sm)
- **Spanish Translation**: Same hierarchy, ensure proper spacing for longer Spanish text variants

### Layout System
**Spacing Units**: Tailwind units of 3, 4, 6, 8, 12 for consistent rhythm
- Dashboard grid: 12-column system with 16-column layout for complex data tables
- Sidebar: Fixed 64px (collapsed) / 280px (expanded)
- Content padding: p-6 (mobile), p-8 (desktop)
- Card spacing: gap-6 between cards, gap-4 within cards

### Component Library

**Dashboard Shell**:
- Left sidebar navigation: Collapsible with icons + labels (Dashboard, Active Cases, Incident Reports, Resources, Settings)
- Top bar: Search (prominent), notifications bell, language toggle (EN/ES), user profile
- Main content area: max-w-7xl with responsive grid

**Data Cards**:
- Stats cards (4-column grid on desktop): Total Cases, Active Incidents, Resolved, Avg Response Time
- Each card: Large number (text-3xl), label (text-sm), trend indicator, mini sparkline visualization
- Elevated shadow (shadow-xl) with subtle border

**Case Management Table**:
- Sortable columns: Case ID, Victim Name, Incident Type, Priority (High/Medium/Low badges), Status, Date Reported
- Priority badges: Pill-shaped with status indicators (use semantic meaning, not colors)
- Row actions: View Details, Update Status, Generate Report
- Pagination at bottom, 20 rows per page default

**Incident Details Panel**:
- Split layout: 60% main details / 40% timeline sidebar
- Main section: Incident overview, victim information, evidence uploads, investigator notes
- Timeline: Chronological activity feed with timestamps, status changes, comments
- Action buttons: Update Case, Add Evidence, Generate Report, Close Case

**Filter & Search**:
- Advanced filters panel: Date range picker, incident type multi-select, priority filter, status filter
- Persistent search bar with autocomplete for case IDs and victim names
- Active filters display as dismissible chips below search

**Forms**:
- Two-column layout for data entry (single column on mobile)
- Clear field labels with helper text in both languages
- File upload zones for evidence (drag-drop with preview)
- Required field indicators, inline validation

**Navigation**:
- Breadcrumb trail for deep navigation (Dashboard > Active Cases > Case #CG-2024-1847)
- Tabbed interface for case sections (Overview, Evidence, Timeline, Reports, Communications)

**Modals & Overlays**:
- Confirmation dialogs for critical actions (close case, delete evidence)
- Report generation modal with export format selection (PDF, CSV)
- Maximum width: max-w-2xl, centered with backdrop

**Charts & Visualizations**:
- Incident trends: Line chart showing weekly/monthly patterns
- Incident types: Donut chart with category breakdown
- Response metrics: Horizontal bar chart for team performance
- Use Chart.js or Recharts libraries

**Empty States**:
- No active cases: Illustration with "No active incidents" message and "Start New Case" CTA
- No search results: "No cases found" with filter reset option

**Animations**:
- Minimal: Smooth page transitions (200ms), loading spinners for data fetch
- Table row hover: Subtle elevation change
- No decorative animations - this is a serious, utility-focused tool

## Images

**Hero Section**: Not applicable - this is a dashboard application, not a marketing site. Dashboard loads directly to the main interface.

**Iconography**: Use Heroicons (outline style) via CDN for all UI icons
- Sidebar: home, folder, document-text, lifebuoy, cog
- Actions: plus, pencil, trash, download, upload, x-mark
- Status indicators: check-circle, exclamation-triangle, clock

**Illustrations**:
- Empty state illustration: Abstract cybersecurity shield motif (place via placeholder comment)
- Login/splash screen: Minimalist lock/shield graphic centered
- Error states: Simple line illustrations for 404, 500 errors

**Evidence Thumbnails**:
- Document previews in case details
- Image evidence with lightbox expansion
- File type icons for non-previewable formats

**No large hero images** - This is a functional dashboard focused on data presentation and workflow efficiency. Visual emphasis is on clarity, readability, and quick information access.