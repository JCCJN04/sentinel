import React from 'react';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString.replace(/-/g, '/').replace(/T.+/, ''));
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatAddress = (direccion: any) => {
  if (!direccion || typeof direccion !== 'object') return 'No especificada';
  const parts = [
    direccion.calle_avenida,
    direccion.numero_exterior,
    direccion.numero_interior,
    direccion.colonia,
    direccion.municipio_alcaldia,
    direccion.ciudad,
    direccion.estado,
    direccion.pais,
    direccion.codigo_postal ? `C.P. ${direccion.codigo_postal}` : ''
  ];
  return parts.filter(Boolean).join(', ');
};

export const HealthReportTemplate = ({ data }: { data: any }) => {
  const { profile, allergies, activePrescriptions, personalHistory, familyHistory, vaccinations } = data;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>Expediente de Salud - Sentinel</title>
      </head>
      <body className="font-sans p-8 bg-white text-gray-900 text-sm">
        <header className="flex justify-between items-center border-b-2 border-gray-200 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-700">Expediente de Salud</h1>
            <p className="text-gray-500">Generado por Sentinel</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-sm text-gray-600">Fecha de Generación: {formatDate(new Date().toISOString())}</p>
          </div>
        </header>

        <main>
          {/* --- Información Personal --- */}
          <section className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-blue-800">Información Personal</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <p><strong>CURP:</strong> {profile?.curp || 'No especificado'}</p>
              <p><strong>Género:</strong> {profile?.genero || 'No especificado'}</p>
              <p><strong>Tipo de Sangre:</strong> {profile?.tipo_de_sangre || 'No especificado'}</p>
              <p><strong>Estado Civil:</strong> {profile?.estado_civil || 'No especificado'}</p>
              <p className="col-span-2"><strong>Ocupación:</strong> {profile?.ocupacion || 'No especificado'}</p>
              <p className="col-span-2"><strong>Dirección:</strong> {formatAddress(profile?.direccion)}</p>
              {profile?.contacto_emergencia && (
                <p className="col-span-2 pt-2 border-t mt-2">
                  <strong>Contacto de Emergencia:</strong> {profile.contacto_emergencia.nombre || 'N/A'} - {profile.contacto_emergencia.telefono || 'N/A'}
                </p>
              )}
            </div>
          </section>

          {/* --- Alergias --- */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-red-700">Alergias Registradas</h2>
            {allergies?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-2">
                {allergies.map((allergy: any, index: number) => (
                  <li key={index}>
                    <strong className="font-semibold">{allergy.allergy_name}</strong>
                    {allergy.reaction_description && <span className="text-gray-600"> - Reacción: {allergy.reaction_description}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic">No hay alergias registradas.</p>}
          </section>

          {/* --- Antecedentes Personales Patológicos --- */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-purple-700">Antecedentes Personales Patológicos</h2>
            {personalHistory?.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 pl-2">
                {personalHistory.map((item: any, index: number) => (
                  <li key={index}>
                    <strong className="font-semibold">{item.condition_name}</strong>
                    {item.diagnosis_date && <span className="text-gray-600"> (Diagnosticado: {formatDate(item.diagnosis_date)})</span>}
                    {item.notes && <span className="text-gray-600 block pl-4 text-xs">Nota: {item.notes}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic">No hay antecedentes personales registrados.</p>}
          </section>

          {/* --- Antecedentes Heredo-Familiares --- */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-orange-700">Antecedentes Heredo-Familiares</h2>
            {familyHistory?.length > 0 ? (
               <ul className="list-disc list-inside space-y-1 pl-2">
                {familyHistory.map((item: any, index: number) => (
                  <li key={index}>
                    <strong className="font-semibold">{item.condition_name}</strong>
                    <span className="text-gray-600"> (Familiar: {item.family_member})</span>
                    {item.notes && <span className="text-gray-600 block pl-4 text-xs">Nota: {item.notes}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic">No hay antecedentes familiares registrados.</p>}
          </section>

          {/* --- Historial de Vacunación --- */}
          <section className="mb-6">
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-teal-700">Historial de Vacunación</h2>
            {vaccinations?.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 font-semibold">Vacuna</th>
                    <th className="p-2 font-semibold">Dosis</th>
                    <th className="p-2 font-semibold">Fecha de Aplicación</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((v: any, index: number) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-2">{v.vaccine_name}</td>
                      <td className="p-2">{v.dose_details || 'N/A'}</td>
                      <td className="p-2">{formatDate(v.administration_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-gray-500 italic">No hay vacunas registradas.</p>}
          </section>

          {/* --- Recetas Activas --- */}
          <section>
            <h2 className="text-xl font-semibold border-b border-gray-300 pb-2 mb-4 text-green-700">Medicamentos y Recetas Activas</h2>
            {activePrescriptions?.length > 0 ? (
              activePrescriptions.map((prescription: any, index: number) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-bold">Diagnóstico: {prescription.diagnosis}</h3>
                  <p className="text-sm text-gray-500">Dr(a). {prescription.doctor_name || 'N/A'} | Fecha: {formatDate(prescription.start_date)}</p>
                  <table className="w-full mt-2 text-left text-sm border-t">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 font-semibold">Medicamento</th>
                        <th className="p-2 font-semibold">Dosis</th>
                        <th className="p-2 font-semibold">Instrucciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescription.prescription_medicines?.map((med: any, medIndex: number) => (
                        <tr key={medIndex} className="border-b last:border-b-0">
                          <td className="p-2">{med.medicine_name}</td>
                          <td className="p-2">{med.dosage || 'N/A'}</td>
                          <td className="p-2">{med.instructions || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : <p className="text-gray-500 italic">No hay recetas activas.</p>}
          </section>
        </main>
      </body>
    </html>
  );
};