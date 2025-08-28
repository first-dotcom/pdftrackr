interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
}

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export default function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative">
        {/* Outer ring with gradient */}
        <div className={`${sizeClasses[size]} rounded-full border-2 border-gray-200 animate-spin`}>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 border-r-primary-500 animate-spin"></div>
        </div>

        {/* Inner ring with different animation speed */}
        <div
          className={`absolute inset-1 rounded-full border-2 border-transparent border-b-primary-400 border-l-primary-300 animate-spin`}
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        ></div>

        {/* Center dot */}
        <div
          className={`absolute inset-2 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm`}
        ></div>
      </div>

      {text && (
        <p className="mt-4 text-sm sm:text-base font-medium text-gray-700 text-center max-w-xs">
          {text}
        </p>
      )}
    </div>
  );
}
