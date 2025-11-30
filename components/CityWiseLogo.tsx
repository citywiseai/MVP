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
  const textColor = theme === 'light' ? '#f4f5f7' : '#1d1d1d';
  const primaryColor = '#faa950'; // Orange
  const secondaryColor = '#bf9968'; // Tan/gold

  return (
    <svg
      width={width}
      height={width / 3.5}
      viewBox="0 0 200 57"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CityWise"
    >
      {animated && (
        <defs>
          <linearGradient id="citywise-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor}>
              <animate
                attributeName="stop-color"
                values={`${primaryColor}; ${secondaryColor}; ${primaryColor}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={secondaryColor}>
              <animate
                attributeName="stop-color"
                values={`${secondaryColor}; ${primaryColor}; ${secondaryColor}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        </defs>
      )}

      {/* Modern cityscape icon */}
      <g transform="translate(0, 8)">
        {/* Building 1 */}
        <path
          d="M 3 35 L 3 18 C 3 16.5 4 15.5 5.5 15.5 L 14.5 15.5 C 16 15.5 17 16.5 17 18 L 17 35 Z"
          fill={animated ? "url(#citywise-gradient)" : primaryColor}
          opacity="0.9"
        />

        {/* Building 2 - Taller */}
        <path
          d="M 20 35 L 20 10 C 20 8.5 21 7.5 22.5 7.5 L 31.5 7.5 C 33 7.5 34 8.5 34 10 L 34 35 Z"
          fill={animated ? "url(#citywise-gradient)" : secondaryColor}
        />

        {/* Building 3 */}
        <path
          d="M 37 35 L 37 20 C 37 18.5 38 17.5 39.5 17.5 L 48.5 17.5 C 50 17.5 51 18.5 51 20 L 51 35 Z"
          fill={animated ? "url(#citywise-gradient)" : primaryColor}
          opacity="0.85"
        />

        {/* Window details */}
        <rect x="7" y="20" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="12" y="20" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="7" y="26" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="12" y="26" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />

        <rect x="24" y="13" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />
        <rect x="29" y="13" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />
        <rect x="24" y="19" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />
        <rect x="29" y="19" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />
        <rect x="24" y="25" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />
        <rect x="29" y="25" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.4" />

        <rect x="41" y="23" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="46" y="23" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="41" y="29" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />
        <rect x="46" y="29" width="3" height="3" rx="0.5" fill={theme === 'light' ? '#f4f5f7' : '#1d1d1d'} opacity="0.3" />

        {/* Base line */}
        <line x1="0" y1="36" x2="54" y2="36" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* CityWise text */}
      <text
        x="62"
        y="35"
        fontFamily="system-ui, -apple-system, 'SF Pro Display', sans-serif"
        fontSize="24"
        fontWeight="700"
        fill={textColor}
        letterSpacing="-0.5"
      >
        CityWise
      </text>

      {/* Subtle tagline */}
      <text
        x="62"
        y="48"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="9"
        fontWeight="500"
        fill={secondaryColor}
        letterSpacing="1"
        opacity="0.8"
      >
        PRECONSTRUCTION
      </text>
    </svg>
  );
}

export { CityWiseLogo };
