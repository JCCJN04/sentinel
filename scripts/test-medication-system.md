# 🧪 Prueba del Sistema de Medicamentos

## Paso 1: Limpiar datos antiguos

1. Ve a **Dashboard → Recetas** (`/dashboard/prescriptions`)
2. Elimina las prescripciones de 2023 (las que dicen "hace 889 días")
3. Ve a **Centro de Alertas** (`/dashboard/alertas`)
4. Elimina las alertas antiguas de medicamentos

## Paso 2: Crear prescripción de prueba con fecha ACTUAL

1. Ve a **Nueva Prescripción** (`/dashboard/prescriptions/new`)
2. Usa estos datos:

```
📋 Diagnóstico: Gripe común
👨‍⚕️ Doctor: Dr. Test
📅 Fecha de inicio: 29/11/2025 (HOY)
🕐 Hora de primera dosis: 18:00

💊 Medicamentos:
1. Paracetamol
   - Dosis: 500mg
   - Frecuencia: 6 horas
   - Duración: 2 días
   - Instrucciones: Tomar con alimentos

2. Ibuprofeno
   - Dosis: 400mg
   - Frecuencia: 8 horas
   - Duración: 3 días
   - Instrucciones: Después de comidas
```

## Paso 3: Verificar resultados

### ✅ En la consola deberías ver:

```
🗓️ Generando calendario de dosis...
📅 Fecha inicio: 2025-11-29T18:00:00.000Z
💊 Medicamentos creados: 2

📋 Procesando: Paracetamol
   ⏰ Frecuencia: 6h
   📆 Duración: 2 días
   💉 Total dosis a generar: 8

📋 Procesando: Ibuprofeno
   ⏰ Frecuencia: 8h
   📆 Duración: 3 días
   💉 Total dosis a generar: 9

✅ Total dosis programadas: 17
✅ Dosis insertadas en la BD correctamente

✅ Prescripción reciente - generando alertas automáticas
📤 Generando alerta automática: Paracetamol
✅ Alerta generada exitosamente

📤 Generando alerta automática: Ibuprofeno
✅ Alerta generada exitosamente
```

### ✅ En el Dashboard verás:

**Próximas Tomas (widget derecho):**
```
💊 Paracetamol - 500mg
   📅 Hoy 18:00 | Cada 6h
   🔴 Atrasada / 🟡 Próxima

💊 Ibuprofeno - 400mg
   📅 Hoy 18:00 | Cada 8h
   🟡 Próxima

💊 Paracetamol - 500mg
   📅 Mañana 00:00 | Cada 6h
   🔵 Programada
```

### ✅ En Centro de Alertas verás:

```
🔔 Alertas Críticas (2 nuevas)

✅ Es hora de tomar Paracetamol - 500mg
   29/11/25, 18:00 | Nueva

✅ Es hora de tomar Ibuprofeno - 400mg
   29/11/25, 18:00 | Nueva
```

## Paso 4: Simular paso del tiempo (opcional)

Para ver cómo se crean alertas automáticamente:

1. Espera hasta las **17:00** (1 hora antes de la segunda dosis)
2. Ejecuta el cron job manualmente:

```bash
npx tsx scripts/run-cron-local.ts
```

3. Verás que se crean nuevas alertas para las siguientes dosis

## Paso 5: Registrar una toma

1. En el widget "Próximas Tomas", click en **"Registrar toma"**
2. La dosis desaparece del widget
3. Ya no aparece en la lista
4. La siguiente dosis se muestra

---

## 📊 Resultados Esperados

### Dosis programadas en BD:
```
medication_doses (17 total):

Paracetamol (8 dosis):
1. 29/11 18:00 ← AHORA
2. 30/11 00:00
3. 30/11 06:00
4. 30/11 12:00
5. 30/11 18:00
6. 01/12 00:00
7. 01/12 06:00
8. 01/12 12:00

Ibuprofeno (9 dosis):
1. 29/11 18:00 ← AHORA
2. 30/11 02:00
3. 30/11 10:00
4. 30/11 18:00
5. 01/12 02:00
6. 01/12 10:00
7. 01/12 18:00
8. 02/12 02:00
9. 02/12 10:00
```

### Alertas creadas inicialmente: 2
- "Tomar Paracetamol - 500mg"
- "Tomar Ibuprofeno - 400mg"

### Alertas que se crearán automáticamente: 15 más
(Una por cada dosis restante, 1 hora antes de cada toma)

---

## ⚠️ Notas Importantes

### Si sigues viendo "hace 889 días":
- Las prescripciones antiguas (2023) todavía existen en la BD
- Elimínalas manualmente desde el dashboard
- El sistema ahora filtra correctamente, pero los datos viejos permanecen

### Si no ves alertas nuevas:
- En desarrollo local, el cron job NO se ejecuta automáticamente
- Debes ejecutarlo manualmente: `npx tsx scripts/run-cron-local.ts`
- En producción (Vercel), se ejecuta cada hora automáticamente

### Si ves errores en consola:
- Verifica que `CRON_SECRET` esté en `.env.local`
- Verifica que `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

## 🎯 Prueba Rápida (1 minuto)

1. **Eliminar recetas antiguas** → Dashboard → Recetas → Eliminar todas las de 2023
2. **Nueva receta** → Fecha HOY (29/11/2025) a las 18:00
3. **Verificar** → Dashboard debe mostrar "Hoy 18:00" (no "hace 889 días")
4. **Listo!** ✅

¿Necesitas ayuda con algún paso? 🚀
