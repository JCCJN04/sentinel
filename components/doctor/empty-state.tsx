import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
  variant?: "default" | "primary" | "accent" | "info" | "warning"
}

const variantStyles = {
  default: "from-muted/50 to-muted/20",
  primary: "from-primary/10 to-primary/5",
  accent: "from-accent/10 to-accent/5",
  info: "from-info/10 to-info/5",
  warning: "from-warning/10 to-warning/5",
}

const iconStyles = {
  default: "text-muted-foreground/50",
  primary: "text-primary",
  accent: "text-accent",
  info: "text-info",
  warning: "text-warning",
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center animate-scale-in",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full bg-gradient-to-br p-6 mb-4 backdrop-blur-sm",
          variantStyles[variant]
        )}
      >
        <Icon className={cn("h-12 w-12", iconStyles[variant])} />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
