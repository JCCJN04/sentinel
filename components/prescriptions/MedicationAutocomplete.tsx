// components/prescriptions/MedicationAutocomplete.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce"; // Asumo que este hook ya existe

interface MedicationAutocompleteProps {
    value: string;
    onValueChange: (value: string) => void;
}

export function MedicationAutocomplete({ value, onValueChange }: MedicationAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // CORRECCIÓN 1: Un estado para controlar si el menú debe estar visible
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const debouncedSearchTerm = useDebounce(value, 300);
    const containerRef = useRef<HTMLDivElement>(null);

    // Efecto para buscar en la API
    useEffect(() => {
        // Solo busca si el término es válido Y si el menú debe mostrarse
        // Validar que debouncedSearchTerm existe y tiene longitud
        if (debouncedSearchTerm && typeof debouncedSearchTerm === 'string' && debouncedSearchTerm.length > 2 && showSuggestions) {
            setIsLoading(true);
            fetch(`/api/medications/search?term=${debouncedSearchTerm}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setSuggestions(data);
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setSuggestions([]);
        }
    }, [debouncedSearchTerm, showSuggestions]);

    // Efecto para cerrar el menú si se hace clic fuera del componente
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(e.target.value);
        // Cuando el usuario teclea, siempre queremos mostrar las sugerencias
        setShowSuggestions(true); 
    };

    const handleSuggestionClick = (suggestion: string) => {
        // CORRECCIÓN 2: Al seleccionar, actualizamos el valor Y ocultamos el menú
        onValueChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <Input
                value={value}
                onChange={handleInputChange} // Usamos el nuevo manejador de cambios
                onFocus={() => {
                    // Si hay texto, permite que se muestren sugerencias al enfocar de nuevo
                    if (value && typeof value === 'string' && value.length > 2) setShowSuggestions(true);
                }}
                placeholder="Ej: Aspirin"
                required
                autoComplete="off"
            />
            {isLoading && <span className="absolute right-2 top-2 text-xs text-muted-foreground">Buscando...</span>}
            
            {/* El menú solo se muestra si showSuggestions es true y hay sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            // Usamos onMouseDown para que se ejecute antes de que el input pierda el foco
                            onMouseDown={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}