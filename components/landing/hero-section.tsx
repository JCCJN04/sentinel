"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function HeroSection() {
  const router = useRouter();
  const handleGetStarted = () => router.push("/registro");

  return (
    <section className="relative w-full bg-gradient-to-b from-background to-muted/50 py-20 md:py-32 lg:py-40">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Ajustamos los tamaños de fuente para móviles */}
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
            Tu expediente médico, <span className="text-primary">organizado y seguro</span>
          </h1>
          {/* Ajustamos el tamaño de fuente del párrafo */}
          <p className="mt-6 text-base md:text-xl text-muted-foreground">
            Sentinel es la plataforma definitiva para centralizar, gestionar y acceder a toda tu información de salud y la de tu familia, en cualquier momento y lugar.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted}>
              Crea tu cuenta segura
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("#beneficios")}>
              Conocer más
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Cifrado de nivel bancario. Tu privacidad es nuestra prioridad.</span>
          </div>
        </div>
      </div>
    </section>
  );
}