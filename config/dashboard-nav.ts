import { 
  ClipboardList, HeartPulse, Shield, FileText, Home, 
  Settings, ShieldAlert, Upload, AlertCircle, Share2, 
  BarChart3, Users, Syringe, Bot, type LucideIcon 
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

// Este array ahora controlará los menús de escritorio y móvil
export const sidebarItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home },
  { title: "Documentos", href: "/dashboard/documentos", icon: FileText },
  { title: "Recetas", href: "/dashboard/prescriptions", icon: HeartPulse },
  { title: "Alergias", href: "/dashboard/alergias", icon: ShieldAlert },
  { title: "Vacunas", href: "/dashboard/vacunas", icon: Syringe },
  { title: "Antecedentes", href: "/dashboard/antecedentes", icon: ClipboardList },
  { title: "Asistente IA", href: "/dashboard/asistente-ia", icon: Bot },
  { title: "Subir documento", href: "/dashboard/subir", icon: Upload },
  { title: "Alertas", href: "/dashboard/alertas", icon: AlertCircle },
  { title: "Compartidos", href: "/dashboard/compartidos", icon: Share2 },
  { title: "Reportes", href: "/dashboard/reportes", icon: BarChart3 },
  { title: "Familia", href: "/dashboard/familia", icon: Users },
  { title: "Configuración", href: "/dashboard/configuracion", icon: Settings },
];