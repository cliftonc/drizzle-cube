import React from 'react';

interface DrizzleCubeIconProps {
  className?: string;
  size?: number;
}

const DrizzleCubeIcon: React.FC<DrizzleCubeIconProps> = ({ className = "", size = 24 }) => {
  return (
    <img 
      src="/drizzle-cube.png" 
      alt="Drizzle Cube" 
      width={size} 
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

export default DrizzleCubeIcon;