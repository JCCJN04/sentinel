import { generateAutoAlert } from './alerts-service';

/**
 * Hooks para integrar alertas automáticas en diferentes partes de la aplicación
 */

/**
 * Llamar después de subir/actualizar un documento con fecha de vencimiento
 */
export async function onDocumentUploaded(params: {
  documentId: string;
  documentName: string;
  expiryDate: string | null;
  userId: string;
}) {
  console.log('📄 onDocumentUploaded llamado:', params);
  
  if (!params.expiryDate) {
    console.log('⏭️ Sin fecha de vencimiento, no se genera alerta');
    return;
  }

  const expiryDateObj = new Date(params.expiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiryDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  console.log(`📅 Días hasta vencimiento: ${daysUntilExpiry}`);

  // Solo generar alerta si el documento vence en menos de 30 días
  if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
    console.log('✅ Generando alerta de documento próximo a vencer');
    const result = await generateAutoAlert({
      event_type: 'document_expiring',
      user_id: params.userId,
      data: {
        document_id: params.documentId,
        document_name: params.documentName,
        expiry_date: params.expiryDate,
        days_until_expiry: daysUntilExpiry,
      },
    });
    console.log(`${result ? '✅' : '❌'} Resultado de generación de alerta:`, result);
  } else {
    console.log(`⏭️ Documento vence en ${daysUntilExpiry} días (fuera del rango de 1-30 días)`);
  }
}

/**
 * Llamar después de que un miembro de familia comparta un documento
 */
export async function onFamilyMemberShared(params: {
  documentId: string;
  documentName: string;
  familyMemberName: string;
  recipientUserId: string;
}) {
  await generateAutoAlert({
    event_type: 'family_member_shared',
    user_id: params.recipientUserId,
    data: {
      document_id: params.documentId,
      document_name: params.documentName,
      family_member_name: params.familyMemberName,
    },
  });
}

/**
 * Llamar cuando se crea una prescripción con medicamentos
 * 
 * NOTA: Crea alertas para la primera dosis de cada medicamento si es futura.
 * Las alertas para dosis subsecuentes se generan automáticamente
 * por el cron job cada hora (checkMedicationDoses en alerts-cron.ts)
 */
export async function onPrescriptionCreated(params: {
  userId: string;
  prescriptionId: string;
  medicines: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency_hours: number;
  }>;
  startDate: string;
}) {
  console.log('📋 onPrescriptionCreated: Generando alertas para primera dosis de cada medicamento');
  
  // Crear alertas para las primeras dosis de cada medicamento
  for (const medicine of params.medicines) {
    const firstDoseTime = new Date(params.startDate);
    const now = new Date();
    
    // Crear alerta si la primera dosis es en el futuro (incluso si es en varios días)
    if (firstDoseTime > now) {
      console.log(`  ✅ Creando alerta para primera dosis futura: ${medicine.name} a las ${firstDoseTime.toISOString()}`);
      await generateAutoAlert({
        event_type: 'medication_reminder',
        user_id: params.userId,
        data: {
          medicine_name: medicine.name,
          dosage: medicine.dosage,
          scheduled_at: firstDoseTime.toISOString(),
          prescription_id: params.prescriptionId,
        },
      });
    } else {
      console.log(`  ⏭️ Primera dosis de ${medicine.name} ya pasó (${firstDoseTime.toISOString()}) - no se crea alerta`);
    }
  }
  
  console.log('ℹ️ Las alertas para dosis subsecuentes se generarán automáticamente por el cron job cada hora');
}

/**
 * Llamar cuando se detecta un login desde un dispositivo o ubicación nueva
 */
export async function onSuspiciousLogin(params: {
  userId: string;
  ipAddress: string;
  location?: string;
  device?: string;
}) {
  await generateAutoAlert({
    event_type: 'security_alert',
    user_id: params.userId,
    data: {
      message: `Inicio de sesión detectado desde ${params.location || 'ubicación desconocida'} (${params.ipAddress})`,
      ip_address: params.ipAddress,
      location: params.location,
      device: params.device,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Llamar cuando se cambia la contraseña
 */
export async function onPasswordChanged(params: {
  userId: string;
}) {
  await generateAutoAlert({
    event_type: 'security_alert',
    user_id: params.userId,
    data: {
      message: 'Tu contraseña fue cambiada recientemente. Si no fuiste tú, contacta soporte inmediatamente.',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Llamar cuando se agrega una vacuna al registro
 */
export async function onVaccineAdded(params: {
  userId: string;
  vaccineName: string;
  administrationDate: string;
  nextDoseDate?: string;
}) {
  // Si hay una próxima dosis programada, crear alerta
  if (params.nextDoseDate) {
    const nextDoseObj = new Date(params.nextDoseDate);
    const daysUntilNextDose = Math.ceil(
      (nextDoseObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Alerta 7 días antes de la próxima dosis
    if (daysUntilNextDose > 0 && daysUntilNextDose <= 30) {
      await generateAutoAlert({
        event_type: 'vaccine_due',
        user_id: params.userId,
        data: {
          vaccine_name: params.vaccineName,
          due_date: params.nextDoseDate, // Cambiado para usar due_date
          next_dose_date: params.nextDoseDate,
          days_until_next_dose: daysUntilNextDose,
        },
      });
    }
  }
}

/**
 * Llamar cuando se detecta que un seguro está próximo a vencer
 */
export async function onInsuranceExpiring(params: {
  userId: string;
  insuranceType: string;
  expiryDate: string;
  documentId?: string;
}) {
  const expiryDateObj = new Date(params.expiryDate);
  const daysUntilExpiry = Math.ceil(
    (expiryDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry > 0 && daysUntilExpiry <= 60) {
    await generateAutoAlert({
      event_type: 'insurance_renewal',
      user_id: params.userId,
      data: {
        insurance_type: params.insuranceType,
        renewal_date: params.expiryDate, // Cambiado para usar renewal_date
        expiry_date: params.expiryDate,
        days_until_expiry: daysUntilExpiry,
        document_id: params.documentId,
      },
    });
  }
}

/**
 * Ejemplo de uso en server actions:
 * 
 * // En document-service.ts después de subir un documento
 * import { onDocumentUploaded } from '@/lib/alerts-hooks';
 * 
 * export async function uploadDocument(formData) {
 *   // ... lógica de subida ...
 *   
 *   await onDocumentUploaded({
 *     documentId: newDocument.id,
 *     documentName: newDocument.name,
 *     expiryDate: newDocument.expiry_date,
 *     userId: newDocument.user_id
 *   });
 *   
 *   return newDocument;
 * }
 */
