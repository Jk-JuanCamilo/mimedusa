import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const templates: Record<string, { title: string; systemPrompt: string; columns: string[] }> = {
  "data-analysis": {
    title: "Análisis de Datos",
    systemPrompt: "Genera una tabla de datos para análisis con columnas relevantes, incluyendo fórmulas sugeridas como PROMEDIO, SUMA, DESVEST, etc.",
    columns: ["ID", "Categoría", "Valor", "Fecha", "Observación"]
  },
  "finance": {
    title: "Control Financiero",
    systemPrompt: "Genera una tabla de control financiero con ingresos, gastos, balance y categorías. Incluye fórmulas de totales y porcentajes.",
    columns: ["Fecha", "Descripción", "Categoría", "Ingreso", "Gasto", "Balance"]
  },
  "sales": {
    title: "Seguimiento de Ventas",
    systemPrompt: "Genera una tabla de ventas con productos, cantidades, precios, descuentos y totales. Incluye cálculos de comisiones y metas.",
    columns: ["Fecha", "Vendedor", "Producto", "Cantidad", "Precio Unitario", "Descuento", "Total", "Comisión"]
  },
  "inventory": {
    title: "Control de Inventario",
    systemPrompt: "Genera una tabla de inventario con productos, stock, precio de compra, precio de venta, y alertas de stock mínimo.",
    columns: ["Código", "Producto", "Categoría", "Stock Actual", "Stock Mínimo", "Precio Compra", "Precio Venta", "Valor Total"]
  },
  "budget": {
    title: "Presupuesto",
    systemPrompt: "Genera una tabla de presupuesto con categorías, montos presupuestados, gastos reales y variaciones.",
    columns: ["Categoría", "Presupuestado", "Ejecutado", "Variación", "% Ejecución"]
  },
  "report": {
    title: "Informe",
    systemPrompt: "Genera una tabla estructurada para informes con datos organizados por período, métricas y comparativas.",
    columns: ["Período", "Métrica", "Valor Actual", "Valor Anterior", "Variación %"]
  },
  "project": {
    title: "Gestión de Proyecto",
    systemPrompt: "Genera una tabla de seguimiento de proyecto con tareas, responsables, fechas, estados y porcentaje de avance.",
    columns: ["Tarea", "Responsable", "Fecha Inicio", "Fecha Fin", "Estado", "% Avance", "Prioridad"]
  },
  "payroll": {
    title: "Nómina",
    systemPrompt: "Genera una tabla de nómina con empleados, salarios, deducciones, bonificaciones y neto a pagar.",
    columns: ["Empleado", "Cargo", "Salario Base", "Bonificaciones", "Deducciones", "Salud", "Pensión", "Neto"]
  },
  "invoice-tracker": {
    title: "Seguimiento de Facturas",
    systemPrompt: "Genera una tabla de facturas con número, cliente, fecha, monto, estado de pago y días de vencimiento.",
    columns: ["No. Factura", "Cliente", "Fecha Emisión", "Fecha Vencimiento", "Monto", "Estado", "Días Vencido"]
  },
  "kpi": {
    title: "Indicadores KPI",
    systemPrompt: "Genera una tabla de KPIs con indicadores, metas, valores actuales, estado (semáforo) y tendencia.",
    columns: ["KPI", "Descripción", "Meta", "Valor Actual", "% Cumplimiento", "Estado", "Tendencia"]
  },
  "macros": {
    title: "Plantilla con Macros",
    systemPrompt: "Genera una tabla con datos de ejemplo y proporciona código VBA para macros útiles como formateo automático, filtros y cálculos.",
    columns: ["Dato 1", "Dato 2", "Dato 3", "Resultado"]
  },
  "custom": {
    title: "Personalizado",
    systemPrompt: "Genera una tabla personalizada según la descripción del usuario con las columnas y datos especificados.",
    columns: []
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateType, description, customTitle, importedData } = await req.json();

    if (!templateType || !description) {
      return new Response(
        JSON.stringify({ error: "Se requiere tipo de plantilla y descripción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = templates[templateType];
    if (!template) {
      return new Response(
        JSON.stringify({ error: "Tipo de plantilla no válido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const hasImportedData = importedData && importedData.trim().length > 0;

    const systemPrompt = `Eres un experto en Excel y análisis de datos. ${template.systemPrompt}

INSTRUCCIONES CRÍTICAS:
1. Genera datos en formato de tabla usando el separador | (pipe)
2. La primera fila DEBE ser los encabezados
3. Cada fila debe tener el mismo número de columnas
4. Usa datos realistas y relevantes basados en la descripción del usuario
5. Si el usuario pide fórmulas o macros, inclúyelas como texto explicativo después de la tabla
6. Para múltiples hojas, usa "--- HOJA: NombreHoja" como separador
${hasImportedData ? '7. El usuario ha importado datos CSV - DEBES usar estos datos como base y aplicar las transformaciones/análisis solicitados' : ''}

${template.columns.length > 0 ? `Columnas sugeridas: ${template.columns.join(', ')}` : ''}

EJEMPLO DE FORMATO:
| Columna1 | Columna2 | Columna3 |
| Dato1 | Dato2 | 100 |
| Dato3 | Dato4 | 200 |

Si incluyes macros VBA, usa este formato:
=== MACRO VBA ===
Sub NombreMacro()
    ' Código aquí
End Sub
================`;

    let userMessage = `Genera un archivo Excel para: ${description}`;
    
    if (hasImportedData) {
      userMessage += `\n\n--- DATOS IMPORTADOS DEL CSV ---\n${importedData}\n--- FIN DATOS IMPORTADOS ---\n\nUsa estos datos como base para el Excel y aplica las transformaciones/análisis solicitados.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Agrega fondos a tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error("Error al generar contenido");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        content,
        title: customTitle || template.title,
        templateType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-xlsx:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});