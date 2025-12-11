// components/ui/error-state.tsx
"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Alert, AlertDescription, AlertTitle } from "./alert";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({ 
  title = "Ha ocurrido un error", 
  message, 
  onRetry,
  retryLabel = "Intentar nuevamente"
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-2">
          {message}
        </AlertDescription>
      </Alert>
      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline" 
          className="mt-4"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
