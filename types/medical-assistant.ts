/**
 * Tipos para el módulo Asistente IA Médico
 */

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface MedicalContext {
  // Información del perfil
  profile?: {
    firstName?: string;
    lastName?: string;
    gender?: string;
    bloodType?: string;
  };

  // Documentos médicos recientes
  documents?: Array<{
    name: string;
    category: string;
    date: string;
    provider?: string;
    notes?: string;
    doctorName?: string;
    specialty?: string;
  }>;

  // Recetas activas
  prescriptions?: Array<{
    doctorName?: string;
    diagnosis: string;
    startDate: string;
    endDate?: string;
    medicines?: Array<{
      medicineName: string;
      dosage?: string;
      instructions?: string;
      frequencyHours?: number;
    }>;
  }>;

  // Próximas dosis programadas
  upcomingDoses?: Array<{
    scheduledAt: string;
    status: string;
    medicineName?: string;
    dosage?: string;
    frequencyHours?: number;
  }>;
  // Alergias
  allergies?: Array<{
    allergyName: string;
    reactionDescription?: string;
    severity?: string;
    treatment?: string;
  }>;

  // Vacunas
  vaccinations?: Array<{
    vaccineName: string;
    diseaseProtected?: string;
    administrationDate: string;
  }>;

  // Antecedentes personales
  personalHistory?: Array<{
    conditionName: string;
    diagnosisDate?: string;
    notes?: string;
  }>;

  // Antecedentes familiares
  familyHistory?: Array<{
    conditionName: string;
    familyMember: string;
    notes?: string;
  }>;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  timestamp: Date;
}

export interface MedicalAssistantError {
  error: string;
  details?: string;
}
