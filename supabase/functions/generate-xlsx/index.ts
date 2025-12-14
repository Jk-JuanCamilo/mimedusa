import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fórmulas por categoría
const formulaCategories = {
  contabilidad: `
FÓRMULAS DE CONTABILIDAD (incluir según aplique):
- Activo Total = Activo Corriente + Activo No Corriente
- Pasivo Total = Pasivo Corriente + Pasivo No Corriente
- Patrimonio = Activo Total - Pasivo Total
- Capital de Trabajo = Activo Corriente - Pasivo Corriente
- Razón Corriente = Activo Corriente / Pasivo Corriente
- Prueba Ácida = (Activo Corriente - Inventario) / Pasivo Corriente
- Rotación de Inventario = Costo de Ventas / Inventario Promedio
- Días de Inventario = 365 / Rotación de Inventario
- Rotación de Cuentas por Cobrar = Ventas / Cuentas por Cobrar Promedio
- Días de Cobro = 365 / Rotación de Cuentas por Cobrar
- Rotación de Cuentas por Pagar = Compras / Cuentas por Pagar Promedio
- Días de Pago = 365 / Rotación de Cuentas por Pagar
- Ciclo de Conversión de Efectivo = Días Inventario + Días Cobro - Días Pago
- Depreciación Lineal = (Costo - Valor Residual) / Vida Útil
- Depreciación Acelerada (Suma de Dígitos)
- Amortización de Préstamo = PMT(tasa, períodos, valor_presente)
- IVA = Subtotal * Tasa_IVA
- Retención en la Fuente = Base * Tasa_Retención
- Utilidad Bruta = Ventas - Costo de Ventas
- Utilidad Operacional = Utilidad Bruta - Gastos Operacionales
- Utilidad Neta = Utilidad Operacional - Impuestos`,

  finanzas: `
FÓRMULAS FINANCIERAS (incluir según aplique):
- ROI = (Ganancia - Inversión) / Inversión * 100
- ROE = Utilidad Neta / Patrimonio * 100
- ROA = Utilidad Neta / Activos Totales * 100
- Margen Bruto = (Ventas - Costo) / Ventas * 100
- Margen Operacional = Utilidad Operacional / Ventas * 100
- Margen Neto = Utilidad Neta / Ventas * 100
- EBITDA = Utilidad Operacional + Depreciación + Amortización
- Margen EBITDA = EBITDA / Ventas * 100
- VAN (NPV) = Suma de Flujos / (1+tasa)^período - Inversión
- TIR (IRR) = Tasa donde VAN = 0
- Payback = Inversión / Flujo Anual Promedio
- Punto de Equilibrio (Unidades) = Costos Fijos / (Precio - Costo Variable)
- Punto de Equilibrio ($) = Costos Fijos / (1 - Costo Variable / Precio)
- Apalancamiento Financiero = Deuda / Patrimonio
- Cobertura de Intereses = EBIT / Gastos por Intereses
- Valor Futuro = VP * (1 + tasa)^períodos
- Valor Presente = VF / (1 + tasa)^períodos
- Tasa Efectiva Anual = (1 + tasa_nominal/n)^n - 1
- Interés Compuesto = Capital * (1 + tasa)^períodos - Capital
- Cuota Fija (Amortización) = PMT(tasa, períodos, capital)
- WACC = (E/V * Re) + (D/V * Rd * (1-T))
- Beta Apalancado = Beta_Desapalancado * (1 + (1-T) * D/E)
- Costo de Capital = Rf + Beta * (Rm - Rf)`,

  ventas: `
FÓRMULAS DE VENTAS (incluir según aplique):
- Total Venta = Cantidad * Precio Unitario
- Subtotal = SUMA de Totales
- Descuento = Subtotal * Porcentaje_Descuento
- IVA = (Subtotal - Descuento) * Tasa_IVA
- Total con IVA = Subtotal - Descuento + IVA
- Comisión = Total Venta * Tasa_Comisión
- Ganancia = Precio Venta - Costo
- Margen por Producto = (Precio - Costo) / Precio * 100
- Ventas Promedio = PROMEDIO(Ventas)
- Ventas Máximas = MAX(Ventas)
- Ventas Mínimas = MIN(Ventas)
- Cantidad Total = SUMA(Cantidades)
- Ticket Promedio = Total Ventas / Número de Transacciones
- Tasa de Conversión = Ventas Cerradas / Leads * 100
- Crecimiento Ventas = (Ventas_Actual - Ventas_Anterior) / Ventas_Anterior * 100
- Meta Alcanzada = Ventas Reales / Meta * 100
- Pronóstico de Ventas = TENDENCIA o FORECAST
- Ventas por Vendedor = SUMAR.SI(Vendedor, Ventas)
- Ranking = JERARQUIA(Venta, Rango_Ventas)`,

  inventario: `
FÓRMULAS DE INVENTARIO (incluir según aplique):
- Valor Total Stock = Stock * Precio Unitario
- Costo Total Inventario = SUMA(Stock * Costo)
- Valor de Venta Total = SUMA(Stock * Precio_Venta)
- Ganancia Potencial = Valor Venta - Costo Total
- Rotación = Ventas / Inventario Promedio
- Días de Stock = Inventario / (Ventas / 365)
- Punto de Reorden = (Demanda Diaria * Lead Time) + Stock Seguridad
- Stock de Seguridad = Z * Desv_Est * RAIZ(Lead_Time)
- EOQ (Cantidad Óptima) = RAIZ(2 * Demanda * Costo_Pedido / Costo_Mantener)
- Costo de Mantener = Stock_Promedio * Costo_Unitario * Tasa_Mantener
- Valoración FIFO/LIFO/Promedio Ponderado
- Margen por Producto = (Precio_Venta - Costo) / Precio_Venta * 100
- Productos Bajo Mínimo = SI(Stock < Stock_Mínimo, "Reabastecer", "OK")
- ABC Analysis = Clasificación por valor/volumen`,

  nomina: `
FÓRMULAS DE NÓMINA (incluir según aplique):
- Salario Bruto = Salario Base + Bonificaciones + Horas Extra
- Horas Extra Diurnas = Horas * Valor_Hora * 1.25
- Horas Extra Nocturnas = Horas * Valor_Hora * 1.75
- Horas Extra Dominicales = Horas * Valor_Hora * 2.0
- Auxilio de Transporte (si aplica según salario)
- Salud (Empleado) = Salario Base * 4%
- Pensión (Empleado) = Salario Base * 4%
- Total Deducciones = Salud + Pensión + Otros
- Salario Neto = Salario Bruto - Total Deducciones
- Aportes Empleador Salud = Salario * 8.5%
- Aportes Empleador Pensión = Salario * 12%
- ARL = Salario * Tasa_Riesgo
- Parafiscales = SENA + ICBF + Caja Compensación
- Prima = Salario * Días_Trabajados / 360
- Cesantías = Salario * Días_Trabajados / 360
- Intereses Cesantías = Cesantías * 12% * Días/360
- Vacaciones = Salario Base * Días / 720
- Liquidación Total = Prima + Cesantías + Int.Cesantías + Vacaciones`,

  presupuesto: `
FÓRMULAS DE PRESUPUESTO (incluir según aplique):
- Total Presupuestado = SUMA(Montos_Presupuestados)
- Total Ejecutado = SUMA(Montos_Ejecutados)
- Variación = Ejecutado - Presupuestado
- Variación % = (Ejecutado - Presupuestado) / Presupuestado * 100
- Disponible = Presupuestado - Ejecutado
- % Ejecución = Ejecutado / Presupuestado * 100
- Proyección Anual = (Ejecutado / Meses_Transcurridos) * 12
- Desviación Estándar = DESVEST(Valores)
- Presupuesto Acumulado = SUMA Acumulativa
- Tendencia = TENDENCIA(Datos)
- Estado = SI(Ejecutado > Presupuestado, "Sobrepasado", "Dentro del Presupuesto")`,

  kpi: `
FÓRMULAS DE KPIs (incluir según aplique):
- % Cumplimiento = (Valor_Actual / Meta) * 100
- Variación vs Meta = Valor_Actual - Meta
- Estado = SI(Cumplimiento >= 100%, "Logrado", SI(Cumplimiento >= 80%, "En Progreso", "Crítico"))
- Crecimiento = (Actual - Anterior) / Anterior * 100
- Promedio Móvil = PROMEDIO de últimos N períodos
- Tendencia = TENDENCIA(Histórico)
- Índice de Desempeño = SUMA_PONDERADA(KPIs * Pesos)
- Desviación = (Valor - Promedio) / Desv_Est
- Ranking = JERARQUIA(Valor, Rango)`,

  facturas: `
FÓRMULAS DE FACTURACIÓN (incluir según aplique):
- Subtotal = Cantidad * Precio_Unitario
- Descuento = Subtotal * %Descuento
- Base Gravable = Subtotal - Descuento
- IVA = Base_Gravable * Tasa_IVA
- Retención Fuente = Base * Tasa_Retención (si aplica)
- Retención ICA = Base * Tasa_ICA (si aplica)
- Retención IVA = IVA * %Retención_IVA (si aplica)
- Total Factura = Base + IVA - Retenciones
- Días Vencidos = HOY() - Fecha_Vencimiento
- Estado = SI(Días_Vencidos > 0, "Vencida", "Vigente")
- Interés Mora = Monto * Tasa_Mora * Días_Vencidos / 365
- Total con Mora = Monto + Interés_Mora
- Aging (Antigüedad) = Clasificación por días vencidos`
};

const templates: Record<string, { title: string; systemPrompt: string; columns: string[]; formulas: string[] }> = {
  "data-analysis": {
    title: "Análisis de Datos",
    systemPrompt: "Genera una tabla de datos para análisis con columnas relevantes, incluyendo fórmulas estadísticas y de análisis.",
    columns: ["ID", "Categoría", "Valor", "Fecha", "Observación"],
    formulas: ["contabilidad", "finanzas"]
  },
  "finance": {
    title: "Control Financiero",
    systemPrompt: "Genera una tabla de control financiero completa con ingresos, gastos, balance, categorías y todas las fórmulas financieras necesarias.",
    columns: ["Fecha", "Descripción", "Categoría", "Ingreso", "Gasto", "Balance"],
    formulas: ["contabilidad", "finanzas", "presupuesto"]
  },
  "sales": {
    title: "Seguimiento de Ventas",
    systemPrompt: "Genera una tabla de ventas profesional con productos, cantidades, precios, totales, comisiones y todas las fórmulas de ventas.",
    columns: ["Fecha", "Vendedor", "Producto", "Cantidad", "Precio Unitario", "Descuento", "IVA", "Total", "Comisión"],
    formulas: ["ventas", "facturas"]
  },
  "inventory": {
    title: "Control de Inventario",
    systemPrompt: "Genera una tabla de inventario completa con productos, stock, precios, valoración y fórmulas de gestión de inventario.",
    columns: ["Código", "Producto", "Stock Actual", "Stock Mínimo", "Precio Compra", "Precio Venta", "Valor Total", "Estado"],
    formulas: ["inventario", "ventas"]
  },
  "budget": {
    title: "Presupuesto",
    systemPrompt: "Genera una tabla de presupuesto detallada con categorías, montos, variaciones y fórmulas de control presupuestario.",
    columns: ["Categoría", "Subcategoría", "Presupuestado", "Ejecutado", "Variación", "% Ejecución", "Estado"],
    formulas: ["presupuesto", "finanzas"]
  },
  "report": {
    title: "Informe",
    systemPrompt: "Genera una tabla estructurada para informes con métricas, comparativos y fórmulas de análisis.",
    columns: ["Período", "Métrica", "Valor Actual", "Valor Anterior", "Variación", "% Cambio"],
    formulas: ["finanzas", "kpi"]
  },
  "project": {
    title: "Gestión de Proyecto",
    systemPrompt: "Genera una tabla de seguimiento de proyecto con tareas, responsables, fechas, costos y fórmulas de gestión.",
    columns: ["Tarea", "Responsable", "Fecha Inicio", "Fecha Fin", "Días", "Costo Estimado", "Costo Real", "Variación", "Estado"],
    formulas: ["presupuesto", "kpi"]
  },
  "payroll": {
    title: "Nómina",
    systemPrompt: "Genera una tabla de nómina completa con empleados, salarios, deducciones, aportes y todas las fórmulas de nómina colombiana.",
    columns: ["Empleado", "Cargo", "Salario Base", "Aux. Transporte", "Horas Extra", "Bonificaciones", "Salud", "Pensión", "Otras Deducciones", "Neto a Pagar"],
    formulas: ["nomina"]
  },
  "invoice-tracker": {
    title: "Seguimiento de Facturas",
    systemPrompt: "Genera una tabla de facturas completa con clientes, montos, vencimientos, estados y fórmulas de facturación.",
    columns: ["No. Factura", "Cliente", "Fecha Emisión", "Fecha Vencimiento", "Subtotal", "IVA", "Retenciones", "Total", "Días Vencidos", "Estado"],
    formulas: ["facturas", "contabilidad"]
  },
  "kpi": {
    title: "Indicadores KPI",
    systemPrompt: "Genera una tabla de KPIs profesional con indicadores, metas, valores actuales, cumplimiento y fórmulas de seguimiento.",
    columns: ["KPI", "Área", "Meta", "Valor Actual", "% Cumplimiento", "Tendencia", "Estado"],
    formulas: ["kpi", "finanzas"]
  },
  "macros": {
    title: "Plantilla con Macros",
    systemPrompt: "Genera una tabla con datos de ejemplo, fórmulas avanzadas y código VBA para automatización.",
    columns: ["Dato 1", "Dato 2", "Dato 3", "Fórmula", "Resultado"],
    formulas: ["contabilidad", "finanzas", "ventas"]
  },
  "custom": {
    title: "Personalizado",
    systemPrompt: "Genera una tabla personalizada según la descripción, incluyendo las fórmulas más relevantes para el caso.",
    columns: [],
    formulas: ["contabilidad", "finanzas", "ventas", "inventario", "nomina", "presupuesto", "kpi", "facturas"]
  }
};

serve(async (req) => {
  console.log("generate-xlsx: Request received", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check rate limit (10 requests per minute for XLSX generation)
    const { data: isAllowed, error: rateLimitError } = await supabase
      .rpc('check_api_rate_limit', { 
        p_ip_address: clientIp, 
        p_endpoint: 'generate-xlsx',
        p_max_requests: 10,
        p_window_minutes: 1
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }
    
    if (isAllowed === false) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera un momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Record this request (fire and forget)
    void supabase.rpc('record_api_request', { 
      p_ip_address: clientIp, 
      p_endpoint: 'generate-xlsx' 
    });
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

    // Build formulas section based on template type
    const relevantFormulas = template.formulas
      .map(cat => formulaCategories[cat as keyof typeof formulaCategories])
      .filter(Boolean)
      .join('\n\n');

    const chartInstructions = includeCharts ? `
También crea una sección adicional separada con "--- HOJA: Resumen y Análisis" que incluya:
- Resumen con totales, promedios, máximos, mínimos
- KPIs calculados automáticamente
- Datos agregados por categoría listos para gráficos
- Fórmulas de tendencia y proyección` : '';

    const systemPrompt = `Eres un experto en Excel, contabilidad, finanzas y análisis de datos. ${template.systemPrompt}

REGLAS OBLIGATORIAS:
1. Genera datos en formato tabla usando | (pipe) como separador
2. Primera fila = encabezados
3. Datos realistas, profesionales y útiles
4. Para múltiples hojas usa "--- HOJA: NombreHoja"
5. INCLUYE TODAS LAS FÓRMULAS RELEVANTES en notación Excel (=SUMA, =PROMEDIO, =SI, etc.)
6. Agrega una fila de TOTALES con fórmulas al final de cada tabla numérica
7. Incluye columnas calculadas con fórmulas donde sea apropiado
${hasImportedData ? '8. Usa los datos CSV importados como base y aplica las fórmulas' : ''}
${chartInstructions}

${relevantFormulas}

FÓRMULAS EXCEL COMUNES A USAR:
- =SUMA(rango) para totales
- =PROMEDIO(rango) para promedios
- =MAX(rango), =MIN(rango) para extremos
- =SI(condición, verdadero, falso) para condicionales
- =BUSCARV(valor, rango, columna, falso) para búsquedas
- =SUMAR.SI(rango_criterio, criterio, rango_suma) para sumas condicionales
- =CONTAR.SI(rango, criterio) para conteos
- =REDONDEAR(número, decimales) para redondeos
- =CONCATENAR() o & para unir texto
- =HOY() para fecha actual
- =DIAS(fecha_fin, fecha_inicio) para diferencia de días

${template.columns.length > 0 ? `Columnas sugeridas: ${template.columns.join(', ')}` : ''}

FORMATO EJEMPLO:
--- HOJA: Datos
| Producto | Cantidad | Precio | Total | Margen |
| Producto A | 10 | 100 | =B2*C2 | =D2*0.3 |
| Producto B | 5 | 200 | =B3*C3 | =D3*0.3 |
| TOTAL | =SUMA(B2:B3) | =PROMEDIO(C2:C3) | =SUMA(D2:D3) | =SUMA(E2:E3) |`;

    let userMessage = `Genera un Excel profesional para: ${description}

IMPORTANTE: 
- Incluye TODAS las fórmulas necesarias para cálculos automáticos
- Agrega filas de totales con =SUMA(), =PROMEDIO(), etc.
- Incluye columnas calculadas donde aplique
- Usa formato de fórmula Excel real (=FORMULA)`;
    
    if (hasImportedData) {
      userMessage += `\n\nDATOS CSV IMPORTADOS (usar como base):\n${importedData.substring(0, 8000)}`;
    }

    console.log("generate-xlsx: Calling AI API with formulas");

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
      JSON.stringify({ error: "Ocurrió un error inesperado. Por favor intenta de nuevo." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
