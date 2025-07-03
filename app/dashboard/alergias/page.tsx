// app/dashboard/alergias/page.tsx
import { AlergiasManager } from "@/components/alergias/alergias-manager";

export default function AlergiasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Alergias</h1>
        <p className="text-muted-foreground">
          Añade, consulta y gestiona aquí todas tus alergias conocidas para mantener tu perfil de salud completo.
        </p>
      </div>
      <AlergiasManager />
    </div>
  );
}