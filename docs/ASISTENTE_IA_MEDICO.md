# Módulo Asistente IA Médico

Chatbot inteligente integrado al sistema de salud digital, respaldado por Supabase y Google Gemini AI.

## 📋 Descripción

Módulo de chatbot inteligente que permite al paciente hacer preguntas sobre su salud, recibir explicaciones de sus estudios y documentos médicos, y obtener orientación general basada en la información almacenada en su expediente.

**Importante:** No realiza diagnósticos ni prescribe tratamientos, sino que apoya al usuario a comprender mejor su propia información médica y le recuerda siempre consultar a un profesional de la salud.

## 🗄️ Tablas de Base de Datos Utilizadas

El asistente consulta las siguientes tablas del esquema PostgreSQL de Supabase:

### Tabla: `profiles`
- **Propósito**: Información personal del paciente
- **Columnas usadas**: `first_name`, `last_name`, `genero`, `tipo_de_sangre`

### Tabla: `documents`
- **Propósito**: Documentos médicos almacenados
- **Columnas usadas**: `name`, `category`, `date`, `provider`, `notes`, `doctor_name`, `specialty`
- **Límite**: Últimos 20 documentos

### Tabla: `prescriptions` + `prescription_medicines`
- **Propósito**: Recetas médicas y medicamentos
- **Columnas usadas**: 
  - Prescriptions: `doctor_name`, `diagnosis`, `start_date`, `end_date`, `notes`
  - Medicines: `medicine_name`, `dosage`, `instructions`
- **Límite**: Últimas 10 recetas

### Tabla: `user_allergies`
- **Propósito**: Alergias reportadas por el paciente
- **Columnas usadas**: `allergy_name`, `reaction_description`, `severity`, `treatment`

### Tabla: `vaccinations`
- **Propósito**: Registro de vacunación
- **Columnas usadas**: `vaccine_name`, `disease_protected`, `administration_date`

### Tabla: `user_personal_history`
- **Propósito**: Antecedentes patológicos personales
- **Columnas usadas**: `condition_name`, `diagnosis_date`, `notes`

### Tabla: `user_family_history`
- **Propósito**: Antecedentes familiares
- **Columnas usadas**: `condition_name`, `family_member`, `notes`

## 🏗️ Arquitectura del Módulo

### Backend

#### 1. **Servicio de IA Médica** (`lib/medical-assistant-service.ts`)
Funciones principales:
- `getMedicalContext()`: Consulta todas las tablas relevantes para construir el contexto del paciente
- `generateMedicalResponse()`: Genera respuestas usando Google Gemini AI
- `buildSystemPrompt()`: Define el comportamiento y restricciones del asistente
- `validateUserMessage()`: Valida los mensajes del usuario

#### 2. **API Endpoint** (`app/api/ai/medical-chat/route.ts`)
- **Ruta**: `POST /api/ai/medical-chat`
- **Autenticación**: Requiere token de Supabase Auth
- **Request body**:
  ```json
  {
    "message": "string",
    "conversationHistory": [
      {
        "id": "string",
        "role": "user|assistant",
        "content": "string",
        "timestamp": "Date"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "message": "string",
    "timestamp": "Date"
  }
  ```

### Frontend

#### 1. **Componente de Chat** (`components/medical-assistant/medical-chat-interface.tsx`)
Características:
- Interfaz de chat conversacional
- Auto-scroll a nuevos mensajes
- Indicador de carga mientras el asistente responde
- Manejo de errores amigable
- Atajos de teclado (Enter para enviar, Shift+Enter para nueva línea)
- Historial de conversación persistente durante la sesión

#### 2. **Página Principal** (`app/dashboard/asistente-ia/page.tsx`)
- Vista completa del módulo
- Información sobre capacidades del asistente
- Advertencias importantes sobre limitaciones
- Integración del componente de chat

### Types

#### **Interfaces TypeScript** (`types/medical-assistant.ts`)
- `ChatMessage`: Estructura de mensajes
- `MedicalContext`: Contexto médico completo del paciente
- `ChatRequest`: Request del API
- `ChatResponse`: Response del API
- `MedicalAssistantError`: Manejo de errores

## 🚀 Características Principales

### Capacidades del Asistente
✅ Explicar resultados de estudios médicos con lenguaje claro
✅ Responder preguntas sobre documentos médicos almacenados
✅ Proporcionar información sobre medicamentos y tratamientos actuales
✅ Explicar terminología médica
✅ Información sobre alergias registradas
✅ Consultar historial de vacunación
✅ Acceso a antecedentes personales y familiares

### Limitaciones y Seguridad
❌ No realiza diagnósticos médicos
❌ No prescribe tratamientos ni medicamentos
❌ No sustituye la consulta con un profesional de la salud
⚠️ Siempre recomienda consultar a un médico para decisiones importantes
⚠️ En emergencias, siempre dirige a servicios de emergencia

## 🔐 Seguridad y Privacidad

1. **Autenticación requerida**: Solo usuarios autenticados pueden acceder
2. **Row Level Security (RLS)**: Cada usuario solo accede a sus propios datos
3. **Aislamiento de datos**: El contexto se construye únicamente con datos del usuario autenticado
4. **Sin almacenamiento de conversaciones**: Las conversaciones no se guardan en la base de datos (opcional implementar)

## 🛠️ Configuración

### Variables de Entorno Necesarias

En tu archivo `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Obtener API Key de Gemini

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea un nuevo proyecto o usa uno existente
3. Genera una nueva API key
4. Copia la key al archivo `.env.local`

## 📝 Uso

### Para el Usuario Final

1. Navega a "Asistente IA" en el menú del dashboard
2. Lee las capacidades y limitaciones del asistente
3. Escribe tu pregunta en el área de texto
4. Presiona Enter o el botón de enviar
5. Espera la respuesta del asistente
6. Continúa la conversación según necesites

### Ejemplos de Preguntas

- "¿Qué medicamentos estoy tomando actualmente?"
- "¿Puedes explicarme qué significa 'hemoglobina glucosilada'?"
- "¿Tengo alguna alergia registrada?"
- "¿Cuándo fue mi última vacuna contra la influenza?"
- "¿Qué dice mi último análisis de sangre?"
- "Tengo antecedentes de diabetes en mi familia?"

## 🔄 Flujo de Datos

```
Usuario escribe mensaje
    ↓
Frontend envía request a /api/ai/medical-chat
    ↓
Backend valida autenticación (Supabase Auth)
    ↓
Backend consulta contexto médico (7 tablas de PostgreSQL)
    ↓
Backend construye prompt con contexto
    ↓
Backend llama a Gemini AI
    ↓
Gemini genera respuesta personalizada
    ↓
Backend retorna respuesta
    ↓
Frontend muestra mensaje al usuario
```

## 🧪 Testing

### Probar el Módulo

1. Asegúrate de tener datos en al menos algunas tablas:
   - Sube algunos documentos médicos
   - Registra alergias
   - Agrega vacunas
   - Crea una receta

2. Accede al módulo y prueba preguntas como:
   - Preguntas generales sobre salud
   - Consultas sobre tus datos específicos
   - Solicitudes de explicación de términos médicos

## 📊 Mejoras Futuras Sugeridas

1. **Almacenamiento de conversaciones**
   - Crear tabla `medical_chat_history` para guardar conversaciones
   - Permitir al usuario revisar conversaciones pasadas

2. **Análisis de documentos**
   - Integrar OCR para extraer texto de imágenes y PDFs
   - Permitir al asistente leer el contenido de documentos específicos

3. **Alertas proactivas**
   - El asistente podría avisar sobre:
     - Medicamentos próximos a vencer
     - Vacunas pendientes
     - Estudios de control recomendados

4. **Multilenguaje**
   - Soporte para inglés y otros idiomas
   - Traducción automática de términos médicos

5. **Integración con telemedicina**
   - Programar citas directamente desde el chat
   - Compartir conversación con médico tratante

6. **Síntesis de voz**
   - Lectura en voz alta de respuestas
   - Accesibilidad mejorada

## 🐛 Solución de Problemas

### Error: "No autenticado"
- Verifica que el usuario haya iniciado sesión
- Revisa que el token de Supabase sea válido
- Verifica las variables de entorno

### Error: "Error al procesar tu pregunta"
- Verifica la API key de Gemini
- Revisa los logs del servidor para más detalles
- Asegúrate de que Gemini AI esté disponible

### El asistente no encuentra información
- Verifica que existan datos en las tablas de la base de datos
- Revisa las políticas RLS de Supabase
- Confirma que el `user_id` sea correcto

## 📚 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Google Gemini AI Documentation](https://ai.google.dev/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Política de uso responsable de IA](https://ai.google.dev/gemini-api/docs/safety-guidance)

## 👨‍⚕️ Disclaimer Médico

Este asistente es una herramienta educativa y de información. No debe utilizarse como sustituto del consejo, diagnóstico o tratamiento médico profesional. Siempre busca el consejo de tu médico u otro proveedor de salud calificado con cualquier pregunta que puedas tener sobre una condición médica.

---

**Desarrollado con ❤️ para mejorar el acceso a información de salud**
