export default function ChefLogo({ className = "w-8 h-8" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chef's Hat */}
      <path 
        d="M20 30 Q20 20 30 20 Q50 15 70 20 Q80 20 80 30 Q80 40 70 40 L30 40 Q20 40 20 30 Z" 
        fill="#8B4513" 
        stroke="#654321" 
        strokeWidth="2"
      />
      {/* Hat highlight */}
      <path 
        d="M25 25 Q35 20 50 18 Q65 20 75 25" 
        fill="#A0522D" 
        opacity="0.6"
      />
      {/* Hat band */}
      <rect x="25" y="35" width="50" height="8" fill="#654321" rx="2"/>
      
      {/* Mustache */}
      <path 
        d="M30 60 Q35 55 50 55 Q65 55 70 60 Q75 65 70 70 Q65 75 50 75 Q35 75 30 70 Q25 65 30 60 Z" 
        fill="#654321"
      />
      {/* Mustache curls */}
      <path 
        d="M25 65 Q20 60 25 55 Q30 50 35 55 Q30 60 25 65 Z" 
        fill="#654321"
      />
      <path 
        d="M75 65 Q80 60 75 55 Q70 50 65 55 Q70 60 75 65 Z" 
        fill="#654321"
      />
    </svg>
  );
}
