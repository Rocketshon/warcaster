interface SpaceMarineHelmetProps {
  className?: string;
  strokeWidth?: number;
}

export function SpaceMarineHelmet({ className = "", strokeWidth = 1.5 }: SpaceMarineHelmetProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      strokeWidth={strokeWidth}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Main helmet dome - more rounded and bulbous */}
      <path d="M 25 50 Q 25 20, 60 15 Q 95 20, 95 50 L 95 75 Q 95 90, 80 95 L 40 95 Q 25 90, 25 75 Z" />

      {/* Top crest ridge - prominent center spike */}
      <path d="M 55 15 L 60 8 L 65 15" />
      <path d="M 60 8 L 60 28" strokeWidth={strokeWidth * 1.2} />

      {/* Side armor ridges */}
      <ellipse cx="60" cy="35" rx="30" ry="15" />

      {/* Forehead aquila (Imperial eagle) - more prominent */}
      <path d="M 60 22 L 55 26 L 52 24 M 60 22 L 65 26 L 68 24" />
      <circle cx="60" cy="22" r="2" fill="currentColor" />
      <path d="M 60 24 L 60 28" strokeWidth={strokeWidth * 0.8} />

      {/* Strong V-shaped brow ridge */}
      <path d="M 30 42 L 45 36 L 60 38 L 75 36 L 90 42" strokeWidth={strokeWidth * 1.3} />

      {/* Left eye lens - angular and menacing */}
      <path d="M 32 48 L 45 44 L 50 50 L 48 58 L 35 56 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M 32 48 L 45 44 L 50 50 L 48 58 L 35 56 Z" />

      {/* Right eye lens - angular and menacing */}
      <path d="M 88 48 L 75 44 L 70 50 L 72 58 L 85 56 Z" fill="currentColor" fillOpacity="0.3" />
      <path d="M 88 48 L 75 44 L 70 50 L 72 58 L 85 56 Z" />

      {/* Eye lens inner detail */}
      <path d="M 38 50 L 46 52" strokeWidth={strokeWidth * 0.7} />
      <path d="M 82 50 L 74 52" strokeWidth={strokeWidth * 0.7} />

      {/* Vertical nose guard - prominent divider */}
      <path d="M 60 38 L 60 78" strokeWidth={strokeWidth * 1.5} />

      {/* Nose bridge armor */}
      <path d="M 52 44 L 60 46 L 68 44" />

      {/* Cheek armor plates */}
      <path d="M 35 56 L 32 75 L 38 82" strokeWidth={strokeWidth * 1.2} />
      <path d="M 85 56 L 88 75 L 82 82" strokeWidth={strokeWidth * 1.2} />

      {/* Respirator grilles - more mechanical */}
      <path d="M 42 68 L 78 68" strokeWidth={strokeWidth * 1.1} />
      <path d="M 40 73 L 80 73" strokeWidth={strokeWidth * 1.1} />
      <path d="M 38 78 L 82 78" strokeWidth={strokeWidth * 1.1} />
      <path d="M 40 83 L 80 83" strokeWidth={strokeWidth * 1.1} />

      {/* Vertical respirator vents */}
      <path d="M 48 68 L 46 83" />
      <path d="M 54 68 L 53 83" />
      <path d="M 60 68 L 60 83" strokeWidth={strokeWidth * 1.2} />
      <path d="M 66 68 L 67 83" />
      <path d="M 72 68 L 74 83" />

      {/* Side ear/comm studs - more prominent */}
      <circle cx="22" cy="60" r="5" strokeWidth={strokeWidth * 1.3} />
      <circle cx="22" cy="60" r="2.5" />
      <circle cx="98" cy="60" r="5" strokeWidth={strokeWidth * 1.3} />
      <circle cx="98" cy="60" r="2.5" />

      {/* Side armor detail lines */}
      <path d="M 27 50 L 27 75" strokeWidth={strokeWidth * 1.2} />
      <path d="M 93 50 L 93 75" strokeWidth={strokeWidth * 1.2} />

      {/* Neck seal/collar */}
      <path d="M 40 95 Q 60 98, 80 95" />

      {/* Additional helmet detail - forehead armor plates */}
      <path d="M 45 30 Q 60 32, 75 30" />
    </svg>
  );
}
