import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: {
    icon?: LucideIcon
    text: string
  }
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  action,
  className,
}: PageHeaderProps) {
  const BadgeIcon = badge?.icon

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/20",
        "bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5",
        "p-6 shadow-2xl backdrop-blur-sm lg:p-8",
        "animate-scale-in",
        className
      )}
    >
      {/* Decorative glows */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-accent/20 to-primary/20 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 backdrop-blur-sm">
              {BadgeIcon && <BadgeIcon className="h-4 w-4 text-primary" />}
              <span className="text-sm font-semibold text-primary">
                {badge.text}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="text-base text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {action && (
          <Button
            size="lg"
            className="group bg-gradient-to-r from-primary to-accent text-white shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 rounded-2xl px-8 h-14 text-base font-semibold"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}
