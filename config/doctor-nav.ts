import {
  type LucideIcon,
  Home,
  Users,
  CalendarClock,
  FileText,
  Pill,
  Settings,
} from "lucide-react";

export type DoctorNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const doctorSidebarItems: DoctorNavItem[] = [
  { title: "Inicio", href: "/doctor", icon: Home },
  { title: "Pacientes", href: "/doctor/pacientes", icon: Users },
  { title: "Consultas", href: "/doctor/consultas", icon: CalendarClock },
  { title: "Documentos", href: "/doctor/documentos", icon: FileText },
  { title: "Recetas", href: "/doctor/recetas", icon: Pill },
  { title: "Configuración", href: "/doctor/configuracion", icon: Settings },
];
