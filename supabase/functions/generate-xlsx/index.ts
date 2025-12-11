import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const templates: Record<string, { title: string; systemPrompt: string; columns: string[] }> = {
  "data-analysis": {
    title: "Análisis de Datos",
    systemPrompt: "Genera una tabla de datos para análisis con columnas relevantes, incluyendo fórmulas sugeridas.",
    columns: ["ID", "Categoría", "Valor", "Fecha", "Observación"]
  },
  "finance": {
    title: "Control Financiero",
    systemPrompt: "Genera una tabla de control financiero con ingresos, gastos, balance y categorías.",
    columns: ["Fecha", "Descripción", "Categoría", "Ingreso", "Gasto", "Balance"]
  },
  "sales": {
    title: "Seguimiento de Ventas",
    systemPrompt: "Genera una tabla de ventas con productos, cantidades, precios y totales.",
    columns: ["Fecha", "Vendedor", "Producto", "Cantidad", "Precio Unitario", "Total"]
  },
  "inventory": {
    title: "Control de Inventario",
    systemPrompt: "Genera una tabla de inventario con productos, stock, precios.",
    columns: ["Código", "Producto", "Stock Actual", "Precio Compra", "Precio Venta"]
  },
  "budget": {
    title: "Presupuesto",
    systemPrompt: "Genera una tabla de presupuesto con categorías y montos.",
    columns: ["Categoría", "Presupuestado", "Ejecutado", "Variación"]
  },
  "report": {
    title: "Informe",
    systemPrompt: "Genera una tabla estructurada para informes.",
    columns: ["Período", "Métrica", "Valor Actual", "Valor Anterior"]
  },
  "project": {
    title: "Gestión de Proyecto",
    systemPrompt: "Genera una tabla de seguimiento de proyecto.",
    columns: ["Tarea", "Responsable", "Fecha Inicio", "Fecha Fin", "Estado"]
  },
  "payroll": {
    title: "Nómina",
    systemPrompt: "Genera una tabla de nómina con empleados y salarios.",
    columns: ["Empleado", "Cargo", "Salario Base", "Deducciones", "Neto"]
  },
  "invoice-tracker": {
    title: "Seguimiento de Facturas",
    systemPrompt: "Genera una tabla de facturas.",
    columns: ["No. Factura", "Cliente", "Fecha", "Monto", "Estado"]
  },
  "kpi": {
    title: "Indicadores KPI",
    systemPrompt: "Genera una tabla de KPIs.",
    columns: ["KPI", "Meta", "Valor Actual", "Estado"]
  },
  "macros": {
    title: "Plantilla con Macros",
    systemPrompt: "Genera una tabla con datos de ejemplo y código VBA para macros.",
    columns: ["Dato 1", "Dato 2", "Dato 3", "Resultado"]
  },
  "custom": {
    title: "Personalizado",
    systemPrompt: "Genera una tabla personalizada según la descripción.",
    columns: []
  }
};

serve(async (req) => {
  console.log("generate-xlsx: Request received", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("generate-xlsx: Body parsed", JSON.stringify(body).substring(0, 200));
    
    const { templateType, description, customTitle, importedData, includeCharts } = body;

    if (!templateType || !description) {
      console.log("generate-xlsx: Missing required fields");
      return new Response(
        JSON.stringify({ error: "Se requiere tipo de plantilla y descripción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = templates[templateType];
    if (!template) {
      console.log("generate-xlsx: Invalid template type", templateType);
      return new Response(
        JSON.stringify({ error: "Tipo de plantilla no válido" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("generate-xlsx: LOVABLE_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasImportedData = importedData && importedData.trim().length > 0;

    const chartInstructions = includeCharts ? `
También crea una sección adicional separada con "--- HOJA: Gráficos" que incluya:
- Resumen con totales y promedios
- Datos agregados por categoría listos para gráficos` : '';

    const systemPrompt = `Eres un experto en Excel. ${template.systemPrompt}

REGLAS OBLIGATORIAS:
1. Genera datos en formato tabla usando | (pipe) como separador
2. Primera fila = encabezados
3. Datos realistas y útiles
4. Para múltiples hojas usa "--- HOJA: NombreHoja"
${hasImportedData ? '5. Usa los datos CSV importados como base' : ''}
${chartInstructions}

${template.columns.length > 0 ? `Columnas: ${template.columns.join(', ')}` : ''}

FORMATO:
| Col1 | Col2 | Col3 |
| dato1 | dato2 | 100 |
| dato3 | dato4 | 200 |`;

    let userMessage = `Genera Excel para: ${description}`;
    
    if (hasImportedData) {
      userMessage += `\n\nDATOS CSV:\n${importedData.substring(0, 5000)}`;
    }

    console.log("generate-xlsx: Calling AI API");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
      }),
    });

    console.log("generate-xlsx: AI response status", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("generate-xlsx: AI API Error", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta en unos momentos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Error al conectar con el servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("generate-xlsx: AI response received");
    
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      console.error("generate-xlsx: Empty content from AI");
      return new Response(
        JSON.stringify({ error: "No se generó contenido. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("generate-xlsx: Success, content length", content.length);

    return new Response(
      JSON.stringify({
        content,
        title: customTitle || template.title,
        templateType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("generate-xlsx: Error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
