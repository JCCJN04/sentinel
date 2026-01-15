import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  variant?: "primary" | "accent" | "info" | "warning" | "success"
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  className?: string
}

const variantStyles = {
  primary: {
    border: "border-primary/20",
    bg: "bg-gradient-to-br from-primary/5 to-transparent",
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    iconColor: "text-primary",
    hoverBorder: "hover:border-primary/40",
    glow: "h-24 w-24 bg-primary/10",
  },
  accent: {
    border: "border-accent/20",
    bg: "bg-gradient-to-br from-accent/5 to-transparent",
    iconBg: "bg-accent/10 group-hover:bg-accent/20",
    iconColor: "text-accent",
    hoverBorder: "hover:border-accent/40",
    glow: "h-24 w-24 bg-accent/10",
  },
  info: {
    border: "border-info/20",
    bg: "bg-gradient-to-br from-info/5 to-transparent",
    iconBg: "bg-info/10 group-hover:bg-info/20",
    iconColor: "text-info",
    hoverBorder: "hover:border-info/40",
    glow: "h-24 w-24 bg-info/10",
  },
  warning: {
    border: "border-warning/20",
    bg: "bg-gradient-to-br from-warning/5 to-transparent",
    iconBg: "bg-warning/10 group-hover:bg-warning/20",
    iconColor: "text-warning",
    hoverBorder: "hover:border-warning/40",
    glow: "h-24 w-24 bg-warning/10",
  },
  success: {
    border: "border-success/20",
    bg: "bg-gradient-to-br from-success/5 to-transparent",
    iconBg: "bg-success/10 group-hover:bg-success/20",
    iconColor: "text-success",
    hoverBorder: "hover:border-success/40",
    glow: "h-24 w-24 bg-success/10",
  },
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
}

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "primary",
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover-lift cursor-pointer",
        styles.border,
        styles.bg,
        styles.hoverBorder,
        className
      )}
    >
      {/* Decorative glow */}
      <div
        className={cn(
          "absolute right-0 top-0 translate-x-8 -translate-y-8 rounded-full blur-2xl transition-opacity group-hover:opacity-80",
          styles.glow
        )}
      />

      <CardHeader className="relative pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={cn(
              "rounded-xl p-2.5 transition-colors",
              styles.iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", styles.iconColor)} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold">{value}</p>
          {trend && TrendIcon && trendValue && (
            <div className={cn("flex items-center gap-1 text-sm", trendColors[trend])}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">{trendValue}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}
