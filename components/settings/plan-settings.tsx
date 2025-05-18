"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Check, CreditCard, Download, HardDrive, Package } from "lucide-react"

export function PlanSettings() {
  // Mock plan data
  const currentPlan = {
    name: "Premium",
    price: "$9.99",
    billingCycle: "mensual",
    nextBillingDate: "15/04/2025",
    storage: {
      used: 2.4,
      total: 50,
      percentage: 4.8,
    },
    features: [
      "Documentos ilimitados",
      "50 GB de almacenamiento",
      "Organización avanzada con OCR",
      "Recordatorios ilimitados",
      "Compartir documentos",
      "Reportes personalizados",
    ],
  }

  // Mock billing history
  const billingHistory = [
    {
      id: "INV-001",
      date: "15/03/2025",
      amount: "$9.99",
      status: "Pagada",
    },
    {
      id: "INV-002",
      date: "15/02/2025",
      amount: "$9.99",
      status: "Pagada",
    },
    {
      id: "INV-003",
      date: "15/01/2025",
      amount: "$9.99",
      status: "Pagada",
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plan actual</CardTitle>
              <CardDescription>Gestiona tu suscripción y uso de almacenamiento</CardDescription>
            </div>
            <Badge className="bg-primary">{currentPlan.name}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalles de suscripción</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="text-sm font-medium">{currentPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Precio</span>
                  <span className="text-sm font-medium">
                    {currentPlan.price} / {currentPlan.billingCycle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Próximo cobro</span>
                  <span className="text-sm font-medium">{currentPlan.nextBillingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Método de pago</span>
                  <span className="text-sm font-medium">•••• 4242</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  Cambiar plan
                </Button>
                <Button variant="outline" className="flex-1">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Actualizar pago
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Uso de almacenamiento</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Usado</span>
                  <span className="text-sm font-medium">
                    {currentPlan.storage.used} GB de {currentPlan.storage.total} GB
                  </span>
                </div>
                <Progress value={currentPlan.storage.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {currentPlan.storage.percentage}% de tu almacenamiento utilizado
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Almacenamiento adicional</span>
                </div>
                <Button variant="outline" size="sm">
                  Comprar
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Características incluidas</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="rounded-full p-1 bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" className="text-destructive">
            Cancelar suscripción
          </Button>
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Actualizar a Familiar
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de facturación</CardTitle>
          <CardDescription>Revisa tus facturas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 items-center gap-4 p-4 font-medium border-b">
              <div>Factura</div>
              <div>Fecha</div>
              <div>Monto</div>
              <div>Estado</div>
            </div>

            {billingHistory.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-4 items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="font-medium">{invoice.id}</div>
                <div>{invoice.date}</div>
                <div>{invoice.amount}</div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-success/10 text-success border-success">
                    {invoice.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
