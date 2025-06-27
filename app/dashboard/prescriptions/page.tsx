// app/dashboard/prescriptions/page.tsx
import Link from 'next/link';
import { getPrescriptions } from '@/lib/actions/prescriptions.actions';
import { Button } from '@/components/ui/button'; // Asumo que tienes este componente

export default async function PrescriptionsPage() {
    const { data: prescriptions, error } = await getPrescriptions();

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Mis Recetas Médicas</h1>
                <Button asChild>
                    <Link href="/dashboard/prescriptions/new">
                        + Nueva Receta
                    </Link>
                </Button>
            </div>

            {prescriptions.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-gray-500">No tienes recetas registradas.</p>
                    <p className="text-gray-500">¡Añade una para empezar!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {prescriptions.map((prescription) => (
                        // CADA RECETA ES AHORA UN ENLACE (Link)
                        <Link 
                            key={prescription.id} 
                            href={`/dashboard/prescriptions/${prescription.id}`}
                            className="block p-4 border rounded-lg shadow-sm hover:shadow-md hover:border-primary transition-all duration-200"
                        >
                            <div className="flex flex-col h-full">
                                <h2 className="text-xl font-semibold text-primary">{prescription.diagnosis}</h2>
                                <p className="text-gray-600">Dr. {prescription.doctor_name || 'No especificado'}</p>
                                <p className="text-sm text-gray-500 mb-2">
                                    Inicio: {new Date(prescription.start_date).toLocaleDateString()}
                                </p>
                                <div className="mt-auto pt-2">
                                    <h3 className="font-bold text-sm">Medicamentos:</h3>
                                    {prescription.prescription_medicines.length > 0 ? (
                                        <ul className="list-disc pl-5 text-sm">
                                            {prescription.prescription_medicines.slice(0, 2).map(med => (
                                                <li key={med.id} className="truncate">{med.medicine_name} ({med.dosage})</li>
                                            ))}
                                            {prescription.prescription_medicines.length > 2 && <li className="text-gray-400">...y más</li>}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-400">Sin medicamentos asignados.</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}