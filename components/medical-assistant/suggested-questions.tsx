/**
 * Componente: Suggested Questions
 * 
 * Muestra preguntas sugeridas para ayudar al usuario a comenzar
 * la conversación con el Asistente IA Médico
 */

'use client';

import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void;
  disabled?: boolean;
}

const SUGGESTED_QUESTIONS = [
  {
    category: 'Medicamentos',
    questions: [
      '¿Qué medicamentos estoy tomando actualmente?',
      '¿Para qué sirve [nombre del medicamento]?',
      '¿Cuándo debo tomar mis medicamentos?',
    ],
  },
  {
    category: 'Análisis y Estudios',
    questions: [
      '¿Qué significa mi último análisis de sangre?',
      'Explícame qué es la hemoglobina glucosilada',
      '¿Cuáles son mis niveles de colesterol?',
    ],
  },
  {
    category: 'Alergias y Vacunas',
    questions: [
      '¿Tengo alguna alergia registrada?',
      '¿Cuándo fue mi última vacuna?',
      '¿Qué vacunas me faltan?',
    ],
  },
  {
    category: 'Antecedentes',
    questions: [
      '¿Qué condiciones médicas tengo en mi historial?',
      '¿Hay antecedentes de enfermedades en mi familia?',
      '¿Qué riesgos hereditarios debo considerar?',
    ],
  },
  {
    category: 'Información General',
    questions: [
      '¿Qué documentos médicos tengo registrados?',
      '¿Cuándo fue mi última visita al médico?',
      'Dame un resumen de mi información de salud',
    ],
  },
];

export function SuggestedQuestions({ onQuestionClick, disabled = false }: SuggestedQuestionsProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
          Preguntas Sugeridas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        {SUGGESTED_QUESTIONS.map((category) => (
          <div key={category.category} className="space-y-1.5 sm:space-y-2">
            <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground">
              {category.category}
            </h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {category.questions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5 px-2.5 sm:py-2 sm:px-3 text-xs sm:text-sm text-left whitespace-normal justify-start hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors"
                  onClick={() => onQuestionClick(question)}
                  disabled={disabled}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
