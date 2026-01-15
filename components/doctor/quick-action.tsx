import Link from "next/link"
import { LucideIcon, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionProps {
  title: string
  description: string
  icon: LucideIcon
  href: string
  variant?: "primary" | "accent" | "info" | "warning"
  className?: string
}

const variantStyles = {
  primary: {
    border: "border-primary/20 hover:border-primary/40",
    bg: "bg-gradient-to-br from-primary/5 to-transparent",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    arrowColor: "text-primary",
  },
  accent: {
    border: "border-accent/20 hover:border-accent/40",
    bg: "bg-gradient-to-br from-accent/5 to-transparent",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    arrowColor: "text-accent",
  },
  info: {
    border: "border-info/20 hover:border-info/40",
    bg: "bg-gradient-to-br from-info/5 to-transparent",
    iconBg: "bg-info/10",
    iconColor: "text-info",
    arrowColor: "text-info",
  },
  warning: {
    border: "border-warning/20 hover:border-warning/40",
    bg: "bg-gradient-to-br from-warning/5 to-transparent",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    arrowColor: "text-warning",
  },
}

export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  variant = "primary",
  className,
}: QuickActionProps) {
  const styles = variantStyles[variant]

  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border p-6 transition-all duration-300",
        "hover-lift hover:shadow-2xl",
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("rounded-xl p-3 transition-transform group-hover:scale-110", styles.iconBg)}>
          <Icon className={cn("h-6 w-6", styles.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <ArrowRight
              className={cn(
                "h-5 w-5 transition-all group-hover:translate-x-1",
                styles.arrowColor
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Decorative gradient on hover */}
      <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
        <div className={cn("absolute right-0 top-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full blur-3xl", styles.iconBg)} />
      </div>
    </Link>
  )
}

interface QuickActionsGridProps {
  children: React.ReactNode
  className?: string
}

export function QuickActionsGrid({ children, className }: QuickActionsGridProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children", className)}>
      {children}
    </div>
  )
}
