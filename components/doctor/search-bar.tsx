"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/useDebounce"
import { cn } from "@/lib/utils"

export type SearchBarProps = {
  placeholder?: string
  param?: string
  className?: string
  inputClassName?: string
  debounceMs?: number
}

export function SearchBar({
  placeholder = "Buscar...",
  param = "q",
  className,
  inputClassName,
  debounceMs = 250,
}: SearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const searchParamsString = searchParams.toString()
  const currentValue = searchParams.get(param) ?? ""

  const [value, setValue] = useState(currentValue)
  const debouncedValue = useDebounce(value, debounceMs)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setValue(currentValue)
  }, [currentValue])

  useEffect(() => {
    if (!isMounted) return
    if (debouncedValue === currentValue) return

    const params = new URLSearchParams(searchParamsString)

    if (debouncedValue) {
      params.set(param, debouncedValue)
    } else {
      params.delete(param)
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [debouncedValue, currentValue, isMounted, param, pathname, router, searchParamsString])

  return (
    <div className={cn("w-full sm:w-72", className)}>
      <label className="sr-only" htmlFor={`search-${param}`}>
        {placeholder}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-500 dark:text-sky-400" />
        <Input
          id={`search-${param}`}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "pl-9 border-sky-500/30 bg-white/80 text-slate-900 shadow-sm backdrop-blur dark:border-sky-400/20 dark:bg-slate-900/70 dark:text-slate-50 focus-visible:border-sky-500/50 focus-visible:ring-sky-500/40",
            "transition-colors",
            inputClassName,
          )}
        />
      </div>
    </div>
  )
}
