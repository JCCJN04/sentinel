// middleware/validation.ts
/**
 * VALIDATION MIDDLEWARE
 * 
 * Esquemas de validación Zod para todos los endpoints
 * Previene inyecciones y datos malformados
 */

import { z } from 'zod';

// Validadores comunes reutilizables
export const commonValidators = {
  id: z.string().uuid('ID inválido'),
  email: z.string().email('Email inválido').max(255),
  name: z.string().min(1).max(255).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/, 'Nombre contiene caracteres no permitidos'),
  phone: z.string().regex(/^\+?[0-9\s-()]{8,20}$/, 'Teléfono inválido').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  
  // Previene path traversal y command injection
  filename: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-zA-Z0-9_\-. ]+$/, 'Nombre de archivo contiene caracteres no permitidos')
    .refine(name => !name.includes('..'), 'Path traversal no permitido'),

  // Sanitiza texto libre
  text: z.string().max(5000).transform(str => 
    str.replace(/<script[^>]*>.*?<\/script>/gi, '')
       .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
       .replace(/javascript:/gi, '')
  ),

  // URLs seguras
  url: z.string().url().refine(url => {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  }, 'Solo se permiten URLs HTTP/HTTPS'),
};

// Esquemas de validación por endpoint

export const authSchemas = {
  login: z.object({
    email: commonValidators.email,
    password: z.string().min(6).max(128),
  }),

  register: z.object({
    email: commonValidators.email,
    password: z.string()
      .min(8, 'Contraseña debe tener al menos 8 caracteres')
      .max(128)
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[a-z]/, 'Debe contener al menos una minúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
  }),

  resetPassword: z.object({
    email: commonValidators.email,
  }),
};

export const documentSchemas = {
  upload: z.object({
    name: z.string().min(1).max(255),
    category: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    date: commonValidators.date.optional(),
    expiry_date: commonValidators.date.optional(),
    notes: commonValidators.text.optional(),
    provider: z.string().max(255).optional(),
    amount: z.number().min(0).max(999999999).optional(),
    currency: z.string().length(3).optional(),
    patient_name: commonValidators.name.optional(),
    doctor_name: commonValidators.name.optional(),
    specialty: z.string().max(100).optional(),
  }),

  update: z.object({
    id: commonValidators.id,
    name: z.string().min(1).max(255).optional(),
    category: z.string().max(100).optional(),
    notes: commonValidators.text.optional(),
  }),

  delete: z.object({
    id: commonValidators.id,
  }),
};

export const medicalSchemas = {
  allergy: z.object({
    allergy_name: z.string().min(1).max(255),
    reaction_description: commonValidators.text.optional(),
    severity: z.enum(['leve', 'moderada', 'grave', 'muy grave']).optional(),
    treatment: commonValidators.text.optional(),
  }),

  prescription: z.object({
    doctor_name: commonValidators.name.optional(),
    diagnosis: z.string().min(1).max(500),
    start_date: commonValidators.date,
    end_date: commonValidators.date.optional(),
    notes: commonValidators.text.optional(),
    medicines: z.array(z.object({
      medicine_name: z.string().min(1).max(255),
      dosage: z.string().max(100).optional(),
      instructions: commonValidators.text.optional(),
      frequency_hours: z.number().min(1).max(168).optional(),
    })).min(1).max(20),
  }),

  vaccination: z.object({
    vaccine_name: z.string().min(1).max(255),
    disease_protected: z.string().max(255).optional(),
    administration_date: commonValidators.date,
    lot_number: z.string().max(100).optional(),
    notes: commonValidators.text.optional(),
  }),
};

export const familySchemas = {
  addMember: z.object({
    member_name: commonValidators.name,
    member_email: commonValidators.email,
    relationship: z.string().max(50),
    permissions: z.object({
      view_all: z.boolean(),
      view_prescriptions: z.boolean(),
      view_allergies: z.boolean(),
      view_vaccinations: z.boolean(),
      view_personal_history: z.boolean(),
    }),
  }),

  updatePermissions: z.object({
    member_id: commonValidators.id,
    permissions: z.object({
      view_all: z.boolean(),
      view_prescriptions: z.boolean(),
      view_allergies: z.boolean(),
      view_vaccinations: z.boolean(),
      view_personal_history: z.boolean(),
    }),
  }),
};

export const aiSchemas = {
  chat: z.object({
    message: z.string()
      .min(1, 'El mensaje no puede estar vacío')
      .max(2000, 'Mensaje demasiado largo')
      // Prevenir inyecciones de prompts
      .refine(msg => {
        const dangerousPatterns = [
          /ignore\s+(previous|all)\s+instructions?/i,
          /you\s+are\s+now/i,
          /system\s*:/i,
          /\[system\]/i,
          /<\|im_start\|>/i,
        ];
        return !dangerousPatterns.some(pattern => pattern.test(msg));
      }, 'Mensaje contiene patrones no permitidos'),
    conversationHistory: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(5000),
      timestamp: z.string().datetime(),
    })).max(20).optional(),
  }),
};

/**
 * Helper para validar datos con Zod y retornar errores formateados
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Error de validación desconocido'] };
  }
}
