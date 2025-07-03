import React from 'react';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Función auxiliar para construir la dirección de forma segura
const formatAddress = (direccion: any) => {
  if (!direccion || typeof direccion !== 'object') {
    return 'No especificada';
  }
  const parts = [
    direccion.calle_avenida,
    direccion.numero_exterior,
    direccion.colonia,
    direccion.ciudad,
    direccion.estado,
    direccion.pais,
    direccion.codigo_postal ? `C.P. ${direccion.codigo_postal}` : ''
  ];
  return parts.filter(Boolean).join(', '); // Une solo las partes que existen
};

export const HealthReportTemplate = ({ data }: { data: any }) => {
  const { profile, allergies, activePrescriptions } = data;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Expediente de Salud - Sentinel</title>
      </head>
      <body className="font-sans p-8 bg-white text-gray-800">
        <header className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Expediente de Salud</h1>
            <p className="text-gray-500">Generado por Sentinel</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-sm text-gray-600">Fecha de Generación: {formatDate(new Date().toISOString())}</p>
          </div>
        </header>

        <main className="mt-8">
          <section className="mb-8">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-blue-700">Información Personal</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <p><strong>CURP:</strong> {profile?.curp || 'No especificado'}</p>
              <p><strong>Género:</strong> {profile?.genero || 'No especificado'}</p>
              <p><strong>Tipo de Sangre:</strong> {profile?.tipo_de_sangre || 'No especificado'}</p>
              <p><strong>Estado Civil:</strong> {profile?.estado_civil || 'No especificado'}</p>
              <p className="col-span-2"><strong>Ocupación:</strong> {profile?.ocupacion || 'No especificado'}</p>
              <p className="col-span-2"><strong>Dirección:</strong> {formatAddress(profile?.direccion)}</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-red-700">Alergias Registradas</h2>
            {allergies?.length > 0 ? (
              <ul className="list-disc list-inside space-y-2">
                {allergies.map((allergy: any, index: number) => (
                  <li key={index}>
                    <strong className="font-semibold">{allergy.allergy_name}</strong>
                    {allergy.reaction_description && <span className="text-gray-600"> - Reacción: {allergy.reaction_description}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No hay alergias registradas.</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-green-700">Medicamentos y Recetas Activas</h2>
            {activePrescriptions?.length > 0 ? (
              activePrescriptions.map((prescription: any, index: number) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-bold">Diagnóstico: {prescription.diagnosis}</h3>
                  <p className="text-sm text-gray-500">Dr(a). {prescription.doctor_name} | Fecha: {formatDate(prescription.start_date)}</p>
                  <table className="w-full mt-2 text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2">Medicamento</th>
                        <th className="p-2">Dosis</th>
                        <th className="p-2">Instrucciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.prescription_medicines?.map((med: any, medIndex: number) => (
                        <tr key={medIndex} className="border-b">
                          <td className="p-2">{med.medicine_name}</td>
                          <td className="p-2">{med.dosage}</td>
                          <td className="p-2">{med.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay recetas activas.</p>
            )}
          </section>
        </main>
      </body>
    </html>
  );
};