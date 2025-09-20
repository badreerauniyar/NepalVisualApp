# Nepal Visual - Geographic & School Mapping Application

A modern, responsive web application for visualizing geographic data and school information in Nepal. Built with Angular 20 and designed with a clean, component-wise UI layout.

## 🎯 Phase 1 MVP Features

### Layout Structure
- **Header**: Logo, search functionality, and profile section
- **Left Sidebar**: Administrative filters (Country → Province → District → Municipality/VDC) and population layer toggle
- **Main Content**: Interactive map area with Mapbox integration
- **Right Sidebar**: Thematic filters for schools, hospitals, and roads
- **Footer**: Data attribution and version information

### Key Components

#### 1. Header Component
- Modern logo and branding
- Centralized search bar for schools and locations
- Mobile-responsive design with collapsible elements
- Profile section (Phase 2 ready)

#### 2. Left Sidebar (Geography & Filters)
- Hierarchical administrative area selection
- Population density layer toggle
- Quick statistics display
- Collapsible for mobile devices

#### 3. Main Content (Map Area)
- Interactive map container ready for Mapbox integration
- Map controls overlay (zoom, layers, location)
- Feature info panels with school details
- Search results dropdown
- Loading states and animations

#### 4. Right Sidebar (Thematic Filters)
- Category selection (Schools, Hospitals, Roads)
- Dynamic sub-filters based on selected category
- School-specific filters (Public/Private, Primary/Secondary/Higher Secondary)
- Map controls and legend
- Phase 2 placeholders for Hospitals and Roads

### Design System

#### Color Palette
- Primary: `#2563eb` (Blue)
- Secondary: `#64748b` (Slate)
- Accent: `#0ea5e9` (Sky Blue)
- Success: `#10b981` (Emerald)
- Warning: `#f59e0b` (Amber)
- Danger: `#ef4444` (Red)

#### Typography
- Font Family: Inter (with system fallbacks)
- Responsive font sizes from 0.75rem to 2.25rem
- Consistent line heights and font weights

#### Spacing & Layout
- CSS custom properties for consistent spacing
- Responsive breakpoints (768px, 1024px, 1200px)
- Modern shadow system and border radius values

### Responsive Design
- Mobile-first approach
- Collapsible sidebars on mobile devices
- Adaptive layout for tablets and desktops
- Touch-friendly controls and interactions

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Angular CLI (v20.3.2)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd NepalVisualApp

# Install dependencies
npm install

# Start development server
ng serve

# Navigate to http://localhost:4200/
```

### Build for Production
```bash
ng build --configuration production
```

## 🛠️ Technology Stack

- **Frontend**: Angular 20 with standalone components
- **Styling**: SCSS with CSS custom properties
- **UI Framework**: Bootstrap 5.3.8 (minimal usage)
- **Maps**: Mapbox GL JS (ready for integration)
- **Icons**: Custom SVG icons
- **Build Tool**: Angular CLI

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Design Principles

1. **Clean & Modern**: Minimal clutter with clear visual hierarchy
2. **Component-wise**: Modular, reusable UI components
3. **Responsive**: Works seamlessly across all device sizes
4. **Accessible**: Proper focus states and keyboard navigation
5. **Performance**: Optimized for fast loading and smooth interactions

## 🔮 Phase 2 Roadmap

- Hospital and road data integration
- User authentication and profiles
- Advanced search and filtering
- Data export functionality
- Real-time data updates
- Mobile app development

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.
