import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton rounded-2xl bg-muted",
        className
      )}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}

export function ConsultationCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Skeleton */}
      <div className="rounded-3xl border bg-card p-8 space-y-6 lg:p-10">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-40 rounded-2xl" />
            <Skeleton className="h-10 w-40 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card">
          <div className="border-b p-6">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6 space-y-3">
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
          </div>
        </div>

        <div className="rounded-2xl border bg-card">
          <div className="border-b p-6">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="p-6 space-y-3">
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
            <ConsultationCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
