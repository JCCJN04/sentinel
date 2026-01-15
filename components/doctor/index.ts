/**
 * 🎨 HealthPal - Doctor UI Components
 * 
 * Componentes premium para el módulo de doctores
 * Inspirado en Duolingo, Uber y productos Apple
 */

// Layout Components
export { DoctorSidebar } from "./sidebar"
export { DoctorHeader } from "./header"
export { DoctorMobileNav } from "./mobile-nav"

// Content Components
export { PageHeader } from "./page-header"
export { StatCard } from "./stat-card"
export { QuickAction, QuickActionsGrid } from "./quick-action"
export { EmptyState } from "./empty-state"

// Loading States
export {
  Skeleton,
  StatCardSkeleton,
  ConsultationCardSkeleton,
  DashboardSkeleton,
} from "./skeleton"

// Form Components (existing)
export { AddPatientForm } from "./add-patient-form"
export { InvitePatientForm } from "./invite-patient-form"
export { NewConsultationForm } from "./new-consultation-form"
export { NewPrescriptionForm } from "./new-prescription-form"
export { SearchBar } from "./search-bar"

// Other existing components
export { ConsultationAttachments } from "./consultation-attachments"
export { ConsultationCalendar } from "./consultation-calendar"
