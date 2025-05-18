import type { SVGProps } from "react"
import {
  Code,
  LayoutDashboard,
  List,
  Upload,
  AlertCircle,
  Share2,
  BarChart3,
  Settings,
  Users,
  FileText,
  Home,
} from "lucide-react"

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  )
}

export const Icons = {
  logo: Logo,
  code: Code,
  dashboard: LayoutDashboard,
  documents: List,
  upload: Upload,
  alerts: AlertCircle,
  shared: Share2,
  reports: BarChart3,
  settings: Settings,
  users: Users,
  fileText: FileText,
  home: Home,
}

export type Icon = typeof Icons
