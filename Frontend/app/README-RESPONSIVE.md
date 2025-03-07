# Responsive Design Guide

This guide provides information on how to use the responsive components and utilities in the School Management System.

## Breakpoints

The application uses the following breakpoints:

- **xs**: 0px and up (Mobile - Small)
- **sm**: 640px and up (Mobile - Large)
- **md**: 768px and up (Tablet)
- **lg**: 1024px and up (Desktop)
- **xl**: 1280px and up (Large Desktop)
- **2xl**: 1536px and up (Extra Large Desktop)

## Responsive Components

### ResponsiveContainer

The `ResponsiveContainer` component provides consistent padding and max-width across different screen sizes.

```tsx
import ResponsiveContainer from '../components/ResponsiveContainer';

// Basic usage
<ResponsiveContainer>
  <YourContent />
</ResponsiveContainer>

// With custom className
<ResponsiveContainer className="bg-gray-100">
  <YourContent />
</ResponsiveContainer>

// With custom element type
<ResponsiveContainer as="section">
  <YourContent />
</ResponsiveContainer>
```

### ResponsiveText

The `ResponsiveText` component provides consistent font sizing across different screen sizes.

```tsx
import ResponsiveText from '../components/ResponsiveText';

// Basic usage (defaults to sm on mobile, base on tablet, lg on desktop)
<ResponsiveText>
  Your text content
</ResponsiveText>

// With custom sizes
<ResponsiveText 
  mobileSize="xs" 
  tabletSize="sm" 
  desktopSize="base"
>
  Your text content
</ResponsiveText>

// With custom element type
<ResponsiveText as="h1" mobileSize="xl" tabletSize="2xl" desktopSize="3xl">
  Your heading
</ResponsiveText>
```

## Responsive Sidebar

The application includes a responsive sidebar that automatically closes on mobile view and provides a toggle button for easy access.

### Key Features:

- **Auto-close on Mobile**: The sidebar automatically closes when viewed on mobile devices.
- **Route Change Detection**: The sidebar closes automatically when navigating to a new page on mobile.
- **Standard Hamburger Menu**: A standard hamburger menu button appears when the sidebar is closed on mobile.
- **Standard Close Button**: A standard X close button appears in the top-right corner of the sidebar on mobile.
- **Overlay Background**: When the sidebar is open on mobile, a semi-transparent overlay covers the rest of the screen to focus attention on the sidebar.
- **Smooth Transitions**: All open/close actions use smooth CSS transitions.

### Button Types:

1. **Mobile Hamburger Menu Button**: 
   - Appears when the sidebar is closed on mobile
   - Standard three-line hamburger icon
   - Positioned at the left side of the screen
   - Opens the sidebar when clicked

2. **Mobile Close Button**:
   - Appears when the sidebar is open on mobile
   - Standard X icon
   - Positioned at the top-right corner of the sidebar
   - Closes the sidebar when clicked

3. **Desktop Toggle Button**:
   - Changes icon based on sidebar state (collapse/expand)
   - Uses directional arrows to indicate action
   - Toggles the sidebar between collapsed and expanded states

### Implementation:

The sidebar uses the `useResponsive` hook to detect mobile devices and adjust its behavior accordingly:

```tsx
// Close sidebar automatically on mobile
useEffect(() => {
  if (isMobile) {
    setIsOpen(false);
  } else {
    setIsOpen(true);
  }
}, [isMobile]);

// Close sidebar when route changes on mobile
useEffect(() => {
  if (isMobile) {
    setIsOpen(false);
  }
}, [pathname, isMobile]);
```

## Responsive Hook

The `useResponsive` hook provides information about the current screen size and utility functions for responsive behavior.

```tsx
import { useResponsive } from '../hooks/useResponsive';

function YourComponent() {
  const { 
    breakpoint,
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    isMdUp,
    // ... other utilities
  } = useResponsive();

  return (
    <div>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
      
      {/* Or use the breakpoint value */}
      {breakpoint === 'xs' && <ExtraSmallView />}
      {breakpoint === 'sm' && <SmallView />}
      {/* ... */}
      
      {/* Or check if above a certain breakpoint */}
      {isMdUp && <ViewForMediumAndUp />}
    </div>
  );
}
```

## Tailwind CSS Utilities

You can also use Tailwind CSS utilities directly for responsive design:

```tsx
<div className="block md:hidden">
  {/* Visible only on mobile (below md breakpoint) */}
</div>

<div className="hidden md:block">
  {/* Visible only on tablet and above (md breakpoint and up) */}
</div>

<div className="text-sm md:text-base lg:text-lg">
  {/* Text that changes size at different breakpoints */}
</div>

<div className="flex flex-col md:flex-row">
  {/* Stack vertically on mobile, horizontally on tablet and above */}
</div>

<div className="w-full md:w-1/2 lg:w-1/3">
  {/* Full width on mobile, half width on tablet, one-third on desktop */}
</div>
```

## Global CSS Utilities

The application also provides some global CSS utilities for responsive design:

### Container Responsive

The `.container-responsive` class provides a responsive container with appropriate padding at different screen sizes.

```tsx
<div className="container-responsive">
  Your content
</div>
```

### Text Responsive

The `.text-responsive` class provides responsive text sizing:
- 14px on mobile
- 16px on tablet
- 18px on desktop

```tsx
<p className="text-responsive">
  Your text content
</p>
```

## Best Practices

1. **Mobile-First Approach**: Always design for mobile first, then enhance for larger screens.
2. **Use Relative Units**: Prefer relative units (rem, em, %) over absolute units (px).
3. **Flexible Images**: Use `max-width: 100%` or `w-full` for images to ensure they don't overflow their containers.
4. **Test on Real Devices**: Always test your responsive design on real devices or using browser dev tools.
5. **Avoid Fixed Widths**: Use percentage-based or flexible widths instead of fixed pixel widths.
6. **Use Flexbox and Grid**: These CSS layout systems are powerful tools for responsive design.
7. **Consider Touch Targets**: Make interactive elements (buttons, links) large enough for touch interaction (at least 44x44px).
8. **Handle Sidebar Carefully**: On mobile, sidebars should be hidden by default and easily accessible via a standard hamburger menu button.
9. **Use Standard UI Patterns**: Stick to widely recognized UI patterns like hamburger menus for navigation and X icons for closing modals/sidebars. 