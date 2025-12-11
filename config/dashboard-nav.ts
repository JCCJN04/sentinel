import { 
  ClipboardList, HeartPulse, Shield, FileText, Home, 
  Settings, ShieldAlert, Upload, AlertCircle, Share2, 
  BarChart3, Users, Syringe, Bot, Pill, type LucideIcon 
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

// Menú reorganizado de forma más lógica y agrupada
export const sidebarItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Subir documento", href: "/dashboard/subir", icon: Upload },
  { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
  { title: "Alertas", href: "/dashboard/alertas", icon: AlertCircle },
  { title: "Recetas", href: "/dashboard/prescriptions", icon: HeartPulse },
  { title: "Medicamentos", href: "/dashboard/medicamentos", icon: Pill },
  { title: "Alergias", href: "/dashboard/alergias", icon: ShieldAlert },
  { title: "Vacunas", href: "/dashboard/vacunas", icon: Syringe },
  { title: "Antecedentes", href: "/dashboard/antecedentes", icon: ClipboardList },
  { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
  { title: "Compartir", href: "/dashboard/compartidos", icon: Share2 },
  { title: "Familia", href: "/dashboard/familia", icon: Users },
  { title: "Asistente IA", href: "/dashboard/asistente-ia", icon: Bot },
  { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];