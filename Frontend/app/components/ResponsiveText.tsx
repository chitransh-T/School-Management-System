import React from 'react';

type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  mobileSize?: TextSize;
  tabletSize?: TextSize;
  desktopSize?: TextSize;
}

/**
 * A responsive text component that provides consistent font sizing
 * across different screen sizes.
 */
const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = '',
  as: Component = 'p',
  mobileSize = 'sm',
  tabletSize = 'base',
  desktopSize = 'lg',
}) => {
  const sizeClasses = `text-${mobileSize} sm:text-${tabletSize} lg:text-${desktopSize}`;
  
  return (
    <Component className={`${sizeClasses} ${className}`}>
      {children}
    </Component>
  );
};

export default ResponsiveText; 