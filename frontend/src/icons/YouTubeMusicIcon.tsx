import React from "react";

interface YouTubeMusicIconProps {
  className?: string;
}

const YouTubeMusicIcon: React.FC<YouTubeMusicIconProps> = ({
  className = "w-5 h-5 md:w-6 md:h-6",
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="YouTube Music"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  );
};

export default YouTubeMusicIcon;
