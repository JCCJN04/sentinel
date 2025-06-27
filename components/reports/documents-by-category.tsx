// components/reports/documents-by-category.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

// This is an example, replace with your actual data type for categories
interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export function DocumentsByCategory({ data }: { data: CategoryData[] }) { // Assuming data is passed as a prop
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos por Categoría</CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                // Added a nullish coalescing operator to provide a default value of 0 for percent
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-muted-foreground py-4">No hay datos de categorías disponibles.</div>
        )}
      </CardContent>
    </Card>
  );
}