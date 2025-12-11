// lib/file-security.ts
/**
 * FILE SECURITY SERVICE
 * 
 * Validación estricta de archivos subidos:
 * - Magic number validation (no confiar en extensión)
 * - Escaneo de contenido malicioso
 * - Sanitización de nombres
 * - Límites estrictos
 */

// Magic numbers para tipos de archivo permitidos
const ALLOWED_FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
  ],
  'image/heic': [
    [0x00, 0x00, 0x00], // HEIC (partial, más validación necesaria)
  ],
  'application/msword': [
    [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], // DOC
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP)
  ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', 
  '.js', '.jar', '.app', '.deb', '.rpm', '.sh',
  '.php', '.asp', '.aspx', '.jsp', '.cgi'
];

/**
 * Valida magic numbers del archivo
 */
async function validateMagicNumbers(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  
  const signatures = ALLOWED_FILE_SIGNATURES[file.type];
  if (!signatures) {
    return false;
  }

  return signatures.some(signature => {
    return signature.every((byte, index) => uint8Array[index] === byte);
  });
}

/**
 * Sanitiza nombre de archivo
 */
export function sanitizeFileName(fileName: string): string {
  // Remover caracteres peligrosos
  let sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.')
    .replace(/_+/g, '_')
    .toLowerCase();

  // Prevenir nombres de archivo especiales
  if (['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'].includes(sanitized.split('.')[0])) {
    sanitized = `file_${sanitized}`;
  }

  // Limitar longitud
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    sanitized = sanitized.substring(0, maxLength - ext.length) + ext;
  }

  return sanitized;
}

/**
 * Detecta contenido potencialmente malicioso
 */
async function scanForMaliciousContent(file: File): Promise<{ safe: boolean; reason?: string }> {
  const text = await file.text().catch(() => '');
  
  // Patrones sospechosos
  const maliciousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload, etc.
    /eval\(/i,
    /expression\(/i, // IE CSS expressions
    /import\s+/i,
    /<?php/i,
    /<\?=/i,
    /<%/i, // ASP
  ];

  for (const pattern of maliciousPatterns) {
    if (pattern.test(text)) {
      return { 
        safe: false, 
        reason: `Contenido sospechoso detectado: ${pattern.source}` 
      };
    }
  }

  return { safe: true };
}

/**
 * Valida archivo completo
 */
export async function validateUploadedFile(file: File): Promise<{
  valid: boolean;
  error?: string;
  sanitizedName?: string;
}> {
  // 1. Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Archivo vacío no permitido',
    };
  }

  // 2. Validar extensión peligrosa
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido por seguridad',
    };
  }

  // 3. Validar tipo MIME
  if (!ALLOWED_FILE_SIGNATURES[file.type]) {
    return {
      valid: false,
      error: 'Tipo de archivo no soportado',
    };
  }

  // 4. Validar magic numbers (firma del archivo)
  try {
    const validMagic = await validateMagicNumbers(file);
    if (!validMagic) {
      return {
        valid: false,
        error: 'El archivo no corresponde al tipo declarado',
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Error al validar archivo',
    };
  }

  // 5. Escanear contenido malicioso (solo para archivos de texto)
  if (file.type.includes('text') || file.type.includes('xml') || file.type.includes('word')) {
    try {
      const scanResult = await scanForMaliciousContent(file);
      if (!scanResult.safe) {
        return {
          valid: false,
          error: scanResult.reason || 'Contenido sospechoso detectado',
        };
      }
    } catch {
      // Si falla el escaneo, continuamos (archivo binario)
    }
  }

  // 6. Sanitizar nombre
  const sanitizedName = sanitizeFileName(file.name);

  return {
    valid: true,
    sanitizedName,
  };
}

/**
 * Genera nombre único y seguro para storage
 */
export function generateSecureFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const sanitizedExt = extension.replace(/[^a-z0-9.]/g, '');
  
  return `${userId}/${timestamp}-${random}${sanitizedExt}`;
}
