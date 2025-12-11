interface LogoProps {
  className?: string
  size?: number
  showText?: boolean
}

export function Logo({ className = '', size = 240, showText = false }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/healthpal.png"
        alt="HealthPal Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent">
          HealthPal
        </span>
      )}
    </div>
  )
}
