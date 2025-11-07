'use client';

interface CityWiseLogoProps {
  className?: string;
  width?: number;
  theme?: 'light' | 'dark';
  animated?: boolean;
}

export default function CityWiseLogo({ 
  className = '', 
  width = 180, 
  theme = 'dark',
  animated = false 
}: CityWiseLogoProps) {
  const textColor = theme === 'light' ? '#ffffff' : '#1e3a5f';
  const accentColor = '#9caf88';
  
  return (
    <svg
      width={width}
      height={width / 3}
      viewBox="0 0 180 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CityWise"
    >
      {animated && (
        <defs>
          <linearGradient id="citywise-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f">
              <animate
                attributeName="stop-color"
                values="#1e3a5f; #9caf88; #1e3a5f"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="#9caf88">
              <animate
                attributeName="stop-color"
                values="#9caf88; #1e3a5f; #9caf88"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      )}

      <g transform="translate(5, 10)">
        <rect x="0" y="10" width="12" height="30" rx="2" fill={animated ? "url(#citywise-gradient)" : "#1e3a5f"} />
        <rect x="15" y="5" width="12" height="35" rx="2" fill={animated ? "url(#citywise-gradient)" : accentColor} />
        <rect x="30" y="15" width="12" height="25" rx="2" fill={animated ? "url(#citywise-gradient)" : "#1e3a5f"} />
        
        <circle cx="6" cy="25" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="21" cy="20" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="36" cy="30" r="1.5" fill="#ffffff" opacity="0.8" />
        
        <line x1="6" y1="25" x2="21" y2="20" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
        <line x1="21" y1="20" x2="36" y2="30" stroke="#ffffff" strokeWidth="0.5" opacity="0.6" />
      </g>

      <text
        x="55"
        y="32"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.5"
      >
        CityWise
      </text>

      <text
        x="55"
        y="47"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="11"
        fontWeight="500"
        fill={accentColor}
        letterSpacing="0.5"
      >
        AI
      </text>
    </svg>
  );
}
