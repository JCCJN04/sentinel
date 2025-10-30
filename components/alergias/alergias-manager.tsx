// components/alergias/alergias-manager.tsx
"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Edit,
  Loader2,
  Pill,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "leve" | "moderada" | "severa";
type ReactionType = "cutanea" | "gastrointestinal" | "respiratoria" | "anafilactica" | "otra";

type UserAllergy = {
  id: string;
  allergy_name: string;
  reaction_description: string | null;
  notes: string | null;
  severity: Severity | null;
  treatment: string | null;
  date_diagnosed: string | null;
  reaction_type: ReactionType | null;
  created_at: string;
};

type CommonAllergen = {
  name: string;
  icon: string;
  category: AllergenCategory;
  defaultSeverity?: Severity;
  defaultReactionType?: ReactionType;
};

const severitySchema = z.enum(["leve", "moderada", "severa"], {
  required_error: "Selecciona una severidad",
});

const reactionTypeSchema = z.enum([
  "cutanea",
  "gastrointestinal",
  "respiratoria",
  "anafilactica",
  "otra",
]);

const allergySchema = z.object({
  allergy_name: z
    .string()
    .trim()
    .min(2, { message: "El nombre del alérgeno debe tener al menos 2 caracteres." })
    .max(120, { message: "El nombre del alérgeno es demasiado largo." }),
  severity: severitySchema.optional(),
  reaction_description: z
    .string()
    .trim()
    .max(600, { message: "Máximo 600 caracteres." })
    .optional(),
  reaction_type: reactionTypeSchema.optional(),
  treatment: z
    .string()
    .trim()
    .max(600, { message: "Máximo 600 caracteres." })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(600, { message: "Máximo 600 caracteres." })
    .optional(),
  date_diagnosed: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Selecciona una fecha válida."
    ),
});

type AllergyFormValues = z.infer<typeof allergySchema>;

const severityStyles: Record<Severity, { badge: string; label: string; tone: string }> = {
  leve: {
    badge:
      "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700",
    label: "Leve",
    tone: "text-yellow-700 dark:text-yellow-200",
  },
  moderada: {
    badge:
      "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700",
    label: "Moderada",
    tone: "text-orange-700 dark:text-orange-200",
  },
  severa: {
    badge:
      "bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700",
    label: "Severa",
    tone: "text-red-700 dark:text-red-200",
  },
};

const reactionTypeLabels: Record<ReactionType, string> = {
  cutanea: "Cutánea",
  gastrointestinal: "Gastrointestinal",
  respiratoria: "Respiratoria",
  anafilactica: "Anafiláctica",
  otra: "Otra",
};

const reactionTypeBadges: Partial<Record<ReactionType, string>> = {
  cutanea: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-200",
  gastrointestinal: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-200",
  respiratoria: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-200",
  anafilactica: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-200",
  otra: "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200",
};

const DEFAULT_SEVERITY_BADGE =
  "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700";

const severityOrder: Record<Severity, number> = {
  severa: 0,
  moderada: 1,
  leve: 2,
};

type AllergenCategory = "Medicamentos" | "Alimentos" | "Ambiental" | "Contacto" | "Inyectables";

const COMMON_ALLERGENS: readonly CommonAllergen[] = [
  { name: "Penicilina", icon: "💊", category: "Medicamentos", defaultSeverity: "severa" },
  { name: "Amoxicilina", icon: "💊", category: "Medicamentos" },
  { name: "Aspirina", icon: "💊", category: "Medicamentos" },
  { name: "Ibuprofeno", icon: "💊", category: "Medicamentos" },
  { name: "Paracetamol", icon: "💊", category: "Medicamentos" },
  { name: "Sulfonamidas", icon: "💊", category: "Medicamentos" },
  { name: "Cefalosporinas", icon: "💊", category: "Medicamentos" },
  { name: "Claritromicina", icon: "💊", category: "Medicamentos" },
  { name: "Ciprofloxacino", icon: "💊", category: "Medicamentos" },
  { name: "Dipirona", icon: "💊", category: "Medicamentos" },
  { name: "Ácido acetilsalicílico", icon: "💊", category: "Medicamentos" },
  { name: "Naproxeno", icon: "💊", category: "Medicamentos" },
  { name: "Cacahuates", icon: "🥜", category: "Alimentos", defaultSeverity: "severa" },
  { name: "Frutos secos", icon: "🌰", category: "Alimentos" },
  { name: "Mariscos", icon: "🦐", category: "Alimentos" },
  { name: "Camarones", icon: "🦐", category: "Alimentos" },
  { name: "Cangrejo", icon: "🦀", category: "Alimentos" },
  { name: "Leche de vaca", icon: "🥛", category: "Alimentos" },
  { name: "Huevos", icon: "🥚", category: "Alimentos" },
  { name: "Trigo", icon: "🌾", category: "Alimentos" },
  { name: "Soja", icon: "🫘", category: "Alimentos" },
  { name: "Pescado", icon: "🐟", category: "Alimentos" },
  { name: "Sésamo", icon: "🌿", category: "Alimentos" },
  { name: "Mostaza", icon: "🌶️", category: "Alimentos" },
  { name: "Moluscos", icon: "🐚", category: "Alimentos" },
  { name: "Apio", icon: "🥬", category: "Alimentos" },
  { name: "Calabaza", icon: "🎃", category: "Alimentos" },
  { name: "Kiwi", icon: "🥝", category: "Alimentos" },
  { name: "Plátano", icon: "🍌", category: "Alimentos" },
  { name: "Avellana", icon: "🌰", category: "Alimentos" },
  { name: "Chocolate", icon: "🍫", category: "Alimentos" },
  { name: "Polen", icon: "🌼", category: "Ambiental" },
  { name: "Ácaros del polvo", icon: "🦠", category: "Ambiental" },
  { name: "Moho", icon: "🍄", category: "Ambiental" },
  { name: "Polvo de casa", icon: "💨", category: "Ambiental" },
  { name: "Caspa de animales", icon: "🐾", category: "Ambiental" },
  { name: "Pasto", icon: "🌾", category: "Ambiental" },
  { name: "Humo", icon: "💨", category: "Ambiental" },
  { name: "Látex", icon: "🧤", category: "Contacto" },
  { name: "Níquel", icon: "⌚", category: "Contacto" },
  { name: "Cobre", icon: "🪙", category: "Contacto" },
  { name: "Cromo", icon: "⚙️", category: "Contacto" },
  { name: "Fragancias", icon: "💐", category: "Contacto" },
  { name: "Cosméticos", icon: "💄", category: "Contacto" },
  { name: "Anestésicos locales", icon: "💉", category: "Inyectables" },
  { name: "Vacunas", icon: "💉", category: "Inyectables" },
  { name: "Contraste radiológico", icon: "💉", category: "Inyectables" },
  { name: "Insulina", icon: "💉", category: "Inyectables" },
];

const defaultFormValues: AllergyFormValues = {
  allergy_name: "",
  severity: undefined,
  reaction_description: "",
  reaction_type: undefined,
  treatment: "",
  notes: "",
  date_diagnosed: "",
};

type SeverityFilter = "all" | Severity;

const severityFilterOptions: Array<{ value: SeverityFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "severa", label: "Severas" },
  { value: "moderada", label: "Moderadas" },
  { value: "leve", label: "Leves" },
];

const SUGGESTION_LIMIT = 12;

const sanitizeText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const formatDate = (value: string | null) => {
  if (!value) return "Sin dato";
  const isoCandidate = value.length === 10 && value.includes("-");
  const parsed = isoCandidate ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value: Date | string | null) => {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toDateInputValue = (value: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const LoadingState = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
      <Skeleton className="h-[120px] rounded-xl" />
    </div>
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-48 rounded-md" />
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

interface AllergyCardProps {
  allergy: UserAllergy;
  onEdit: (allergy: UserAllergy) => void;
  onDelete: (id: string) => void;
  pendingDeleteId: string | null;
}

const AllergyCard = ({ allergy, onEdit, onDelete, pendingDeleteId }: AllergyCardProps) => {
  const severityStyle = allergy.severity ? severityStyles[allergy.severity] : undefined;
  const reactionBadgeClass = allergy.reaction_type
    ? reactionTypeBadges[allergy.reaction_type] ?? reactionTypeBadges.otra
    : undefined;
  const reactionLabel = allergy.reaction_type
    ? reactionTypeLabels[allergy.reaction_type] ?? "Otra"
    : null;

  return (
    <Card className="rounded-2xl border-slate-200 transition-shadow hover:shadow-lg dark:border-slate-800">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-lg font-semibold md:text-xl">{allergy.allergy_name}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={cn("w-fit border", severityStyle?.badge ?? DEFAULT_SEVERITY_BADGE)}>
                {severityStyle ? severityStyle.label : "Sin severidad"}
              </Badge>
              {reactionLabel && (
                <Badge className={cn("w-fit border border-transparent", reactionBadgeClass)}>
                  {reactionLabel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(allergy)}
              className="h-11 w-11 md:h-9 md:w-9"
              aria-label={`Editar ${allergy.allergy_name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 text-destructive hover:text-destructive md:h-9 md:w-9"
                  aria-label={`Eliminar ${allergy.allergy_name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    ¿Eliminar alergia?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base leading-relaxed md:text-sm">
                    El registro para <strong>{allergy.allergy_name}</strong> se eliminará
                    permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col gap-2 md:flex-row md:justify-end">
                  <AlertDialogCancel className="h-11 w-full text-base md:h-9 md:w-auto md:text-sm">
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="h-11 w-full bg-destructive text-base text-destructive-foreground hover:bg-destructive/90 md:h-9 md:w-auto md:text-sm"
                    disabled={pendingDeleteId === allergy.id}
                    onClick={() => onDelete(allergy.id)}
                  >
                    {pendingDeleteId === allergy.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Sí, eliminar"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {allergy.reaction_description && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-medium md:text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Síntomas y reacción
            </div>
            <p className="ml-6 whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-3 text-base leading-relaxed text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200 md:text-sm">
              {allergy.reaction_description}
            </p>
          </div>
        )}

        {allergy.treatment && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-medium md:text-sm">
              <Pill className="h-4 w-4 text-green-600 dark:text-green-400" />
              Tratamiento recomendado
            </div>
            <p className="ml-6 whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-3 text-base leading-relaxed text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200 md:text-sm">
              {allergy.treatment}
            </p>
          </div>
        )}

        {allergy.notes && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-medium md:text-sm">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Notas adicionales
            </div>
            <p className="ml-6 whitespace-pre-wrap rounded-lg border border-blue-200 bg-blue-50 p-3 text-base leading-relaxed text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200 md:text-sm">
              {allergy.notes}
            </p>
          </div>
        )}

        {allergy.date_diagnosed && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground md:text-xs">
            <Calendar className="h-4 w-4" />
            Diagnóstico: {formatDate(allergy.date_diagnosed)}
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-slate-200 pt-3 text-xs text-muted-foreground dark:border-slate-800">
          <Calendar className="h-3 w-3" />
          Registrado: {formatDateTime(allergy.created_at)}
        </div>
      </CardContent>
    </Card>
  );
};

export const AlergiasManager = () => {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [userAllergies, setUserAllergies] = useState<UserAllergy[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<UserAllergy | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [quickAddLoading, setQuickAddLoading] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AllergyFormValues>({
    resolver: zodResolver(allergySchema),
    defaultValues: defaultFormValues,
  });

  const fetchUserAllergies = useCallback(
    async (userId: string, options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setIsRefreshing(true);
      }

      try {
        const { data, error } = await supabase
          .from("user_allergies")
          .select(
            "id, allergy_name, reaction_description, notes, severity, treatment, date_diagnosed, reaction_type, created_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[Alergias] Error al cargar:", error);
          setFetchError("No pudimos cargar tus alergias. Intenta nuevamente.");
          toast.error("No pudimos cargar tus alergias.");
          return;
        }

        setUserAllergies(data ?? []);
        setFetchError(null);
        setLastSynced(new Date());
      } catch (error) {
        console.error("[Alergias] Error inesperado al cargar:", error);
        setFetchError("Ocurrió un error inesperado al obtener la información.");
        toast.error("Ocurrió un error inesperado.");
      } finally {
        if (!options.silent) {
          setIsRefreshing(false);
        }
      }
    },
    [supabase]
  );

  useEffect(() => {
    const bootstrap = async () => {
      setInitialLoading(true);
      try {
        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("[Alergias] Error obteniendo el usuario:", error);
          setFetchError("No pudimos validar tu sesión. Intenta nuevamente.");
          toast.error("No pudimos validar tu sesión.");
          setUser(null);
          setUserAllergies([]);
          return;
        }

        if (currentUser) {
          setUser(currentUser);
          await fetchUserAllergies(currentUser.id, { silent: true });
        } else {
          setUser(null);
          setUserAllergies([]);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    void bootstrap();
  }, [fetchUserAllergies, supabase]);

  const severityCounts = useMemo(() => {
    return userAllergies.reduce(
      (acc, allergy) => {
        if (allergy.severity) {
          acc[allergy.severity] += 1;
        }
        return acc;
      },
      { leve: 0, moderada: 0, severa: 0 } as Record<Severity, number>
    );
  }, [userAllergies]);

  const lastAllergyUpdate = useMemo(() => {
    if (!userAllergies.length) return null;
    const latest = userAllergies.reduce((latestDate, allergy) => {
      const createdAt = new Date(allergy.created_at).getTime();
      return createdAt > latestDate ? createdAt : latestDate;
    }, 0);
    return latest ? new Date(latest) : null;
  }, [userAllergies]);

  const filteredAllergies = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return userAllergies
      .filter((allergy) => {
        const matchesSeverity = severityFilter === "all" || allergy.severity === severityFilter;
        if (!matchesSeverity) return false;

        if (!normalizedSearch) return true;

        const haystack = [
          allergy.allergy_name,
          allergy.reaction_description ?? "",
          allergy.notes ?? "",
          allergy.treatment ?? "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => {
        const severityRankA = a.severity ? severityOrder[a.severity] : 3;
        const severityRankB = b.severity ? severityOrder[b.severity] : 3;
        if (severityRankA !== severityRankB) return severityRankA - severityRankB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [searchTerm, severityFilter, userAllergies]);

  const quickSuggestions = useMemo(() => {
    const normalizedSearch = quickSearchTerm.trim().toLowerCase();
    const baseList = normalizedSearch
      ? COMMON_ALLERGENS.filter((allergen) =>
          [allergen.name, allergen.category].some((value) =>
            value.toLowerCase().includes(normalizedSearch)
          )
        )
      : COMMON_ALLERGENS;

    if (normalizedSearch) {
      return baseList;
    }

    return showAllSuggestions ? baseList : baseList.slice(0, SUGGESTION_LIMIT);
  }, [quickSearchTerm, showAllSuggestions]);

  const isSearchingSuggestions = quickSearchTerm.trim().length > 0;
  const canToggleSuggestions = !isSearchingSuggestions && COMMON_ALLERGENS.length > SUGGESTION_LIMIT;
  const allSuggestionsAdded = useMemo(
    () =>
      COMMON_ALLERGENS.every((allergen) =>
        userAllergies.some(
          (item) => item.allergy_name.trim().toLowerCase() === allergen.name.toLowerCase()
        )
      ),
    [userAllergies]
  );
  const noQuickMatches = quickSuggestions.length === 0;
  const quickHelperText = isSearchingSuggestions
    ? "Resultados que coinciden con tu búsqueda."
    : "Selecciona un alérgeno frecuente y completa los detalles cuando lo necesites.";

  const openCreateDialog = () => {
    setEditingAllergy(null);
    reset(defaultFormValues);
    setIsDialogOpen(true);
  };

  const openEditDialog = (allergy: UserAllergy) => {
    setEditingAllergy(allergy);
    reset({
      allergy_name: allergy.allergy_name,
      severity: allergy.severity ?? undefined,
      reaction_description: allergy.reaction_description ?? "",
      reaction_type: allergy.reaction_type ?? undefined,
      treatment: allergy.treatment ?? "",
      notes: allergy.notes ?? "",
      date_diagnosed: toDateInputValue(allergy.date_diagnosed),
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAllergy(null);
    reset(defaultFormValues);
  };

  const handleRefresh = async () => {
    if (!user) return;
    await fetchUserAllergies(user.id);
  };

  const handleAddAllergy = async (values: AllergyFormValues) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      allergy_name: values.allergy_name.trim(),
      severity: values.severity ?? null,
      reaction_description: sanitizeText(values.reaction_description),
      reaction_type: values.reaction_type ?? null,
      treatment: sanitizeText(values.treatment),
      notes: sanitizeText(values.notes),
      date_diagnosed: values.date_diagnosed?.trim() ? values.date_diagnosed.trim() : null,
    };

    const normalizedName = payload.allergy_name.toLowerCase();
    const duplicated = userAllergies.some(
      (item) => item.allergy_name.trim().toLowerCase() === normalizedName
    );

    if (duplicated) {
      toast.info("Esta alergia ya está registrada.");
      return;
    }

    try {
      const { error } = await supabase.from("user_allergies").insert([payload]);

      if (error) {
        console.error("[Alergias] Error al crear:", error);
        toast.error("No se pudo guardar la alergia.");
        return;
      }

      toast.success("Alergia añadida correctamente.");
      closeDialog();
      await fetchUserAllergies(user.id, { silent: true });
    } catch (error) {
      console.error("[Alergias] Error inesperado al crear:", error);
      toast.error("Ocurrió un error inesperado al guardar.");
    }
  };

  const handleUpdateAllergy = async (values: AllergyFormValues) => {
    if (!user || !editingAllergy) return;

    const payload = {
      allergy_name: values.allergy_name.trim(),
      severity: values.severity ?? null,
      reaction_description: sanitizeText(values.reaction_description),
      reaction_type: values.reaction_type ?? null,
      treatment: sanitizeText(values.treatment),
      notes: sanitizeText(values.notes),
      date_diagnosed: values.date_diagnosed?.trim() ? values.date_diagnosed.trim() : null,
    };

    const normalizedName = payload.allergy_name.toLowerCase();
    const duplicated = userAllergies.some(
      (item) =>
        item.id !== editingAllergy.id &&
        item.allergy_name.trim().toLowerCase() === normalizedName
    );

    if (duplicated) {
      toast.info("Ya tienes otra alergia con ese nombre.");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_allergies")
        .update(payload)
        .eq("id", editingAllergy.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[Alergias] Error al actualizar:", error);
        toast.error("No se pudo actualizar la alergia.");
        return;
      }

      toast.success("Alergia actualizada correctamente.");
      closeDialog();
      await fetchUserAllergies(user.id, { silent: true });
    } catch (error) {
      console.error("[Alergias] Error inesperado al actualizar:", error);
      toast.error("Ocurrió un error inesperado al actualizar.");
    }
  };

  const handleDeleteAllergy = async (allergyId: string) => {
    if (!user) return;

    setPendingDeleteId(allergyId);
    try {
      const { error } = await supabase
        .from("user_allergies")
        .delete()
        .match({ id: allergyId, user_id: user.id });

      if (error) {
        console.error("[Alergias] Error al eliminar:", error);
        toast.error("No se pudo eliminar la alergia.");
        return;
      }

      toast.success("Alergia eliminada correctamente.");
      await fetchUserAllergies(user.id, { silent: true });
    } catch (error) {
      console.error("[Alergias] Error inesperado al eliminar:", error);
      toast.error("Ocurrió un error inesperado al eliminar.");
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleAddQuickAllergy = async (allergen: CommonAllergen) => {
    if (!user) {
      toast.info("Inicia sesión para registrar tus alergias.");
      return;
    }

    const normalizedName = allergen.name.trim().toLowerCase();
    const alreadyExists = userAllergies.some(
      (item) => item.allergy_name.trim().toLowerCase() === normalizedName
    );

    if (alreadyExists) {
      toast.info("Ya registraste este alérgeno.");
      return;
    }

    setQuickAddLoading(allergen.name);

    try {
      const { error } = await supabase.from("user_allergies").insert([
        {
          user_id: user.id,
          allergy_name: allergen.name,
          severity: allergen.defaultSeverity ?? null,
          reaction_type: allergen.defaultReactionType ?? null,
          reaction_description: null,
          treatment: null,
          notes: null,
          date_diagnosed: null,
        },
      ]);

      if (error) {
        console.error("[Alergias] Error en añadido rápido:", error);
        toast.error("No se pudo añadir este alérgeno.");
        return;
      }

      toast.success(`${allergen.name} se añadió a tu lista.`);
      await fetchUserAllergies(user.id, { silent: true });
    } catch (error) {
      console.error("[Alergias] Error inesperado en añadido rápido:", error);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setQuickAddLoading(null);
    }
  };

  if (initialLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="ml-3 text-base leading-relaxed md:text-sm">
          No pudimos identificar tu sesión. Por favor inicia sesión nuevamente para gestionar tus alergias.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="space-y-2">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100 md:text-sm">Panel de alergias personales</p>
          <p className="text-base leading-relaxed text-muted-foreground md:text-sm">
            Revisa, filtra y actualiza tus alergias para que el equipo médico cuente con información confiable.
          </p>
          {lastSynced && (
            <p className="text-sm text-muted-foreground md:text-xs">
              Última sincronización: <span className="font-medium">{formatDateTime(lastSynced)}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:w-full sm:justify-end md:w-auto">
          <Button
            variant="outline"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="h-11 w-full gap-2 text-base md:h-10 md:w-auto md:text-sm"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Actualizar
          </Button>
          <Button onClick={openCreateDialog} className="h-11 w-full gap-2 text-base md:h-10 md:w-auto md:text-sm">
            <Plus className="h-4 w-4" />
            Nueva alergia
          </Button>
        </div>
      </div>

      {fetchError && (
        <Alert className="border-destructive/50 bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="ml-3 text-base leading-relaxed md:text-sm">{fetchError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-3 pt-6 md:pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground md:text-[0.7rem]">Registros totales</p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400">{userAllergies.length}</p>
            <p className="text-base leading-relaxed text-muted-foreground md:text-sm">
              {severityCounts.severa} severas • {severityCounts.moderada} moderadas • {severityCounts.leve} leves
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800">
          <CardContent className="flex items-center justify-between pt-6 md:pt-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground md:text-[0.7rem]">Última actualización</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 md:text-base">
                {lastAllergyUpdate ? formatDate(lastAllergyUpdate.toISOString()) : "Sin historial"}
              </p>
              <p className="text-base leading-relaxed text-muted-foreground md:text-sm">
                {lastAllergyUpdate ? "Mantén tu información vigente" : "Agrega tu primera alergia"}
              </p>
            </div>
            <Shield className="h-10 w-10 text-green-600 dark:text-green-400 md:h-9 md:w-9" />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex w-full flex-col gap-3 md:max-w-3xl md:flex-row md:items-end md:gap-4">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre, síntomas o notas"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-11 pl-9 text-base md:h-10 md:text-sm"
              />
            </div>
            <div className="w-full md:w-48">
              <span className="text-sm font-medium uppercase text-muted-foreground md:text-xs">Filtrar por severidad</span>
              <Select
                value={severityFilter}
                onValueChange={(value) => setSeverityFilter((value as SeverityFilter) || "all")}
              >
                <SelectTrigger className="mt-1 h-11 text-base md:h-9 md:text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {severityFilterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-base text-muted-foreground md:text-sm">
            Mostrando {filteredAllergies.length} de {userAllergies.length} {userAllergies.length === 1 ? "registro" : "registros"}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/60 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100 md:text-sm">Añadir con un toque</p>
              <p className="text-sm text-muted-foreground md:text-xs">{quickHelperText}</p>
            </div>
            {canToggleSuggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSuggestions((prev) => !prev)}
                className="h-10 px-4 text-base md:h-9 md:px-3 md:text-sm"
              >
                {showAllSuggestions ? "Ver menos" : `Ver todos (${COMMON_ALLERGENS.length})`}
              </Button>
            )}
          </div>

          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar en el catálogo de alérgenos"
              value={quickSearchTerm}
              onChange={(event) => setQuickSearchTerm(event.target.value)}
              className="h-11 pl-9 text-base md:h-10 md:text-sm"
            />
          </div>

          {noQuickMatches ? (
            <p className="text-base text-muted-foreground md:text-sm">
              No encontramos alérgenos con ese nombre. Prueba con otra palabra clave.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((allergen) => {
                const alreadyAdded = userAllergies.some(
                  (item) => item.allergy_name.trim().toLowerCase() === allergen.name.toLowerCase()
                );
                const isLoading = quickAddLoading === allergen.name;
                return (
                  <Button
                    key={`${allergen.category}-${allergen.name}`}
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-4 py-2 text-base md:px-3 md:py-1.5 md:text-sm",
                      alreadyAdded
                        ? "border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200"
                        : "border-slate-200 dark:border-slate-700"
                    )}
                    disabled={alreadyAdded || isLoading}
                    onClick={() => void handleAddQuickAllergy(allergen)}
                  >
                    <span className="text-base" aria-hidden>
                      {allergen.icon}
                    </span>
                    <span>{allergen.name}</span>
                    {alreadyAdded ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                  </Button>
                );
              })}
            </div>
          )}

          {!isSearchingSuggestions && allSuggestionsAdded && !noQuickMatches && (
            <p className="text-xs text-emerald-600 dark:text-emerald-300">
              Ya registraste todos los alérgenos sugeridos. Puedes añadir otros desde el botón "Nueva alergia".
            </p>
          )}
        </div>

        {filteredAllergies.length === 0 ? (
          <Alert className="border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-3 text-base leading-relaxed md:text-sm">
              {userAllergies.length === 0
                ? "Todavía no has registrado alergias. Añade tu primera alergia para tenerla siempre a mano."
                : "No encontramos coincidencias. Ajusta la búsqueda o la severidad para ver otros resultados."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {filteredAllergies.map((allergy) => (
              <AllergyCard
                key={allergy.id}
                allergy={allergy}
                onEdit={openEditDialog}
                onDelete={(id) => void handleDeleteAllergy(id)}
                pendingDeleteId={pendingDeleteId}
              />
            ))}
          </div>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={(open) => (open ? setIsDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              {editingAllergy ? "Editar alergia" : "Añadir nueva alergia"}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed md:text-sm">
              {editingAllergy
                ? "Actualiza los detalles para mantener tu información al día."
                : "Registra una alergia con la mayor cantidad de detalles posibles."}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit((data) => {
              if (editingAllergy) {
                void handleUpdateAllergy(data);
              } else {
                void handleAddAllergy(data);
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="allergy_name"
                className="flex items-center gap-2 text-base font-medium md:text-sm"
              >
                <Pill className="h-4 w-4" />
                Nombre del alérgeno *
              </Label>
              <Controller
                name="allergy_name"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Input
                      id="allergy_name"
                      placeholder="Ej. Penicilina, Cacahuates"
                      className="h-11 text-base md:h-10 md:text-sm"
                      {...field}
                      autoFocus={!editingAllergy}
                    />
                    {fieldState.error && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="severity"
                  className="flex items-center gap-2 text-base font-medium md:text-sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Severidad
                </Label>
                <Controller
                  name="severity"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="severity"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value ? (event.target.value as Severity) : undefined)}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-base md:h-9 md:text-sm"
                    >
                      <option value="">Sin especificar</option>
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="severa">Severa</option>
                    </select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="reaction_type"
                  className="flex items-center gap-2 text-base font-medium md:text-sm"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Tipo de reacción
                </Label>
                <Controller
                  name="reaction_type"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="reaction_type"
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value ? (event.target.value as ReactionType) : undefined)}
                      className="h-11 w-full rounded-md border border-input bg-background px-3 text-base md:h-9 md:text-sm"
                    >
                      <option value="">Sin especificar</option>
                      <option value="cutanea">Cutánea (rash, picazón)</option>
                      <option value="gastrointestinal">Gastrointestinal (náuseas, vómito)</option>
                      <option value="respiratoria">Respiratoria (tos, asma)</option>
                      <option value="anafilactica">Anafiláctica (crítica)</option>
                      <option value="otra">Otra</option>
                    </select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reaction_description" className="text-base font-medium md:text-sm">
                Síntomas / reacción
              </Label>
              <Controller
                name="reaction_description"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Textarea
                      id="reaction_description"
                      placeholder="Describe los síntomas presentados durante la reacción."
                      className="min-h-[96px] resize-none text-base md:text-sm"
                      {...field}
                    />
                    {fieldState.error && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment" className="text-base font-medium md:text-sm">
                Tratamiento recomendado
              </Label>
              <Controller
                name="treatment"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Textarea
                      id="treatment"
                      placeholder="Medicamentos, dispositivos o acciones sugeridas."
                      className="min-h-[96px] resize-none text-base md:text-sm"
                      {...field}
                    />
                    {fieldState.error && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="date_diagnosed"
                  className="flex items-center gap-2 text-base font-medium md:text-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Fecha de diagnóstico
                </Label>
                <Controller
                  name="date_diagnosed"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <Input
                        id="date_diagnosed"
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        className="h-11 text-base md:h-10 md:text-sm"
                        {...field}
                      />
                      {fieldState.error && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-medium md:text-sm">
                  Notas adicionales
                </Label>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <Textarea
                        id="notes"
                        placeholder="Indicaciones especiales, recordatorios o contactos médicos."
                        className="min-h-[96px] resize-none text-base md:text-sm"
                        {...field}
                      />
                      {fieldState.error && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-2 md:flex-row md:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="h-11 w-full text-base md:h-10 md:w-auto md:text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 w-full gap-2 text-base md:h-10 md:w-auto md:text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingAllergy ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Actualizar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Añadir alergia
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-24 right-5 z-40 md:hidden">
        <Button
          onClick={openCreateDialog}
          className="h-14 w-14 rounded-full bg-rose-600 text-white shadow-lg hover:bg-rose-700"
          size="icon"
          aria-label="Registrar nueva alergia"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};