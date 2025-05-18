export default function Loading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="ml-4 text-muted-foreground">Preparando opciones de compartir...</p>
    </div>
  )
}
