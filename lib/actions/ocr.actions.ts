"use server";

interface MedicineExtraction {
  medicine_name: string;
  dosage: string;
  frequency_hours: string;
  duration: string;
  instructions: string;
}

interface PrescriptionData {
  diagnosis: string;
  doctor_name: string;
  medicines: MedicineExtraction[];
  prescription_date: string;
  additional_notes: string;
}

export async function extractPrescriptionDataFromImage(
  base64Image: string
): Promise<PrescriptionData> {
  try {
    // Usar OpenRouter API key
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error("❌ NEXT_PUBLIC_OPENROUTER_API_KEY no está configurada en .env.local");
      throw new Error("OpenRouter API key no configurada");
    }

    console.log("🔍 Procesando imagen con Claude 3.5 Sonnet (OpenRouter)...");

    // Preparar imagen en formato base64 limpio
    let imageData = base64Image;
    if (imageData.startsWith("data:image/")) {
      // Extraer solo la parte base64
      imageData = imageData.split(",")[1] || imageData;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Medical Prescription OCR",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageData,
                },
              },
              {
                type: "text",
                text: `You are an accurate OCR system for medical prescriptions. Extract information from this prescription image EXACTLY as written.

Return ONLY valid JSON with this structure:
{
  "diagnosis": "exact diagnosis text from image or empty string",
  "doctor_name": "exact doctor name from image or empty string",
  "medicines": [
    {
      "medicine_name": "exact name as written",
      "dosage": "exact dosage as written",
      "frequency_hours": "frequency in hours or empty string",
      "duration": "duration in days or empty string",
      "instructions": "special instructions or empty string"
    }
  ],
  "prescription_date": "date in YYYY-MM-DD format or empty string",
  "additional_notes": "any other notes or empty string"
}

CRITICAL RULES:
1. Extract EXACTLY what you see written in the image
2. Do NOT invent, guess, or assume any values
3. Use empty string "" for any field not clearly visible in the image
4. For dates, convert to YYYY-MM-DD format if possible, else empty string
5. Include all visible medicines
6. Return ONLY the JSON, no explanations or markdown`,
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 1000,
      }),
    });

    console.log("📡 Respuesta recibida, status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error de API:", errorData);
      throw new Error(`API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("✅ JSON parseado correctamente");

    // Extraer el contenido de la respuesta
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("❌ No hay contenido en la respuesta");
      throw new Error("No content in API response");
    }

    console.log("🔍 Buscando JSON en contenido...");
    console.log("📝 Contenido completo:", content);

    // Limpiar y parsear JSON - buscar de múltiples formas
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Intenta eliminar markdown code blocks si los hay
      const cleanedContent = content.replace(/```json\s*/g, "").replace(/```\s*/g, "");
      jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      console.error("❌ No se encontró JSON en la respuesta:", content);
      throw new Error("No JSON found in API response");
    }

    const extractedData = JSON.parse(jsonMatch[0]) as PrescriptionData;
    console.log("✨ Datos extraídos exitosamente:", {
      diagnosis: extractedData.diagnosis,
      doctor: extractedData.doctor_name,
      medicines: extractedData.medicines?.length || 0,
    });

    // Validar y limpiar datos - NO inventar valores por defecto
    return {
      diagnosis: extractedData.diagnosis || "",
      doctor_name: extractedData.doctor_name || "",
      medicines: Array.isArray(extractedData.medicines)
        ? extractedData.medicines
            .filter((med) => med.medicine_name && med.medicine_name.trim() !== "")
            .map((med) => ({
              medicine_name: med.medicine_name || "",
              dosage: med.dosage || "",
              frequency_hours: med.frequency_hours?.toString() || "",
              duration: med.duration?.toString() || "",
              instructions: med.instructions || "",
            }))
        : [],
      prescription_date: extractedData.prescription_date || "",
      additional_notes: extractedData.additional_notes || "",
    };
  } catch (error) {
    console.error("❌ Error extrayendo receta:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    // Retornar datos vacíos con mensaje de error
    return {
      diagnosis: "",
      doctor_name: "",
      medicines: [],
      prescription_date: new Date().toISOString().split("T")[0],
      additional_notes: `Error al procesar: ${errorMessage}. Por favor intenta de nuevo con una foto más clara.`,
    };
  }
}
