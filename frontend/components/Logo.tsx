interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "white" | "gradient";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const textSizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

export default function Logo({
  size = "md",
  variant = "default",
  showText = true,
  className = "",
}: LogoProps) {
  const logoClasses = `flex items-center space-x-0.5 ${className}`;
  const iconClasses = `${sizeClasses[size]} flex-shrink-0`;
  const textClasses = `font-bold ${textSizes[size]} ${
    variant === "white" ? "text-white" : "text-gray-900"
  }`;

  return (
    <div className={logoClasses}>
      <img src="/logo.png" alt="PDFTrackr Logo" className={iconClasses} />
      {showText && <span className={textClasses}>PDFTrackr</span>}
    </div>
  );
}

// Logo Icon component for use without text
export function LogoIcon({ size = "md", className = "" }: Omit<LogoProps, "showText" | "variant">) {
  const iconClasses = `${sizeClasses[size]} flex-shrink-0 ${className}`;

  return <img src="/logo.png" alt="PDFTrackr Logo" className={iconClasses} />;
}
