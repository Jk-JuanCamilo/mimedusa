import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const templates: Record<string, { title: string; systemPrompt: string; sections: string[] }> = {
  "business-letter": {
    title: "Carta Empresarial",
    systemPrompt: "Genera una carta empresarial profesional con formato formal, incluyendo membrete, fecha, destinatario, saludo, cuerpo, despedida y firma.",
    sections: ["Membrete", "Fecha", "Destinatario", "Referencia", "Saludo", "Cuerpo", "Despedida", "Firma"]
  },
  "resume": {
    title: "Hoja de Vida",
    systemPrompt: "Genera una hoja de vida profesional y moderna con secciones claras y bien organizadas.",
    sections: ["Datos Personales", "Perfil Profesional", "Experiencia Laboral", "Educación", "Habilidades", "Idiomas", "Referencias"]
  },
  "contract": {
    title: "Contrato",
    systemPrompt: "Genera un contrato legal profesional con todas las cláusulas necesarias y lenguaje jurídico apropiado.",
    sections: ["Encabezado", "Partes", "Antecedentes", "Cláusulas", "Obligaciones", "Vigencia", "Firmas"]
  },
  "rental-contract": {
    title: "Contrato de Arrendamiento",
    systemPrompt: "Genera un contrato de arrendamiento de vivienda o local comercial con todas las cláusulas legales necesarias.",
    sections: ["Partes", "Inmueble", "Canon", "Duración", "Obligaciones Arrendador", "Obligaciones Arrendatario", "Garantías", "Causales de Terminación", "Firmas"]
  },
  "work-contract": {
    title: "Contrato de Trabajo",
    systemPrompt: "Genera un contrato de trabajo con todas las condiciones laborales y cláusulas según la legislación laboral.",
    sections: ["Partes", "Objeto", "Funciones", "Salario", "Jornada", "Lugar de Trabajo", "Duración", "Obligaciones", "Terminación", "Firmas"]
  },
  "service-contract": {
    title: "Contrato de Prestación de Servicios",
    systemPrompt: "Genera un contrato de prestación de servicios profesionales independientes.",
    sections: ["Partes", "Objeto", "Alcance", "Honorarios", "Forma de Pago", "Duración", "Obligaciones", "Confidencialidad", "Firmas"]
  },
  "recommendation-letter": {
    title: "Carta de Recomendación",
    systemPrompt: "Genera una carta de recomendación laboral o académica profesional y convincente.",
    sections: ["Membrete", "Fecha", "Destinatario", "Presentación", "Relación Laboral", "Cualidades", "Logros", "Recomendación", "Datos de Contacto", "Firma"]
  },
  "work-certificate": {
    title: "Constancia Laboral",
    systemPrompt: "Genera una constancia o certificación laboral oficial que acredite la vinculación de un empleado.",
    sections: ["Membrete Empresa", "Fecha", "Título", "Certificación", "Datos del Empleado", "Cargo", "Período", "Salario", "Firma", "Sello"]
  },
  "resignation-letter": {
    title: "Carta de Renuncia",
    systemPrompt: "Genera una carta de renuncia profesional y respetuosa.",
    sections: ["Fecha", "Destinatario", "Asunto", "Comunicación de Renuncia", "Agradecimientos", "Disposición", "Despedida", "Firma"]
  },
  "invoice": {
    title: "Factura",
    systemPrompt: "Genera una factura comercial profesional con todos los datos fiscales y detalles de productos/servicios.",
    sections: ["Datos Emisor", "Datos Cliente", "Número Factura", "Fecha", "Conceptos", "Subtotal", "Impuestos", "Total"]
  },
  "quote": {
    title: "Cotización",
    systemPrompt: "Genera una cotización comercial detallada con productos/servicios y condiciones.",
    sections: ["Datos Empresa", "Cliente", "Fecha", "Validez", "Descripción", "Precios", "Condiciones de Pago", "Garantía", "Total"]
  },
  "proposal": {
    title: "Propuesta Comercial",
    systemPrompt: "Genera una propuesta comercial persuasiva y profesional con estructura clara.",
    sections: ["Portada", "Resumen Ejecutivo", "Objetivos", "Alcance", "Metodología", "Cronograma", "Inversión", "Términos"]
  },
  "report": {
    title: "Informe Ejecutivo",
    systemPrompt: "Genera un informe ejecutivo profesional con análisis claro y recomendaciones.",
    sections: ["Portada", "Resumen", "Introducción", "Análisis", "Resultados", "Conclusiones", "Recomendaciones"]
  },
  "meeting-minutes": {
    title: "Acta de Reunión",
    systemPrompt: "Genera un acta de reunión formal con todos los puntos tratados y acuerdos.",
    sections: ["Encabezado", "Fecha y Hora", "Asistentes", "Orden del Día", "Desarrollo", "Acuerdos", "Próxima Reunión", "Firmas"]
  },
  "memo": {
    title: "Memorando",
    systemPrompt: "Genera un memorando interno profesional con formato corporativo estándar.",
    sections: ["Para", "De", "Fecha", "Asunto", "Cuerpo", "Acciones Requeridas", "Firma"]
  },
  "certificate": {
    title: "Certificado",
    systemPrompt: "Genera un certificado formal y elegante con diseño profesional.",
    sections: ["Título", "Institución", "Certificación", "Beneficiario", "Descripción", "Fecha", "Firma", "Sello"]
  },
  "agreement": {
    title: "Acuerdo de Confidencialidad",
    systemPrompt: "Genera un acuerdo de confidencialidad (NDA) profesional con términos legales claros.",
    sections: ["Partes", "Definiciones", "Obligaciones", "Excepciones", "Duración", "Penalidades", "Jurisdicción", "Firmas"]
  },
  "power-of-attorney": {
    title: "Poder Notarial",
    systemPrompt: "Genera un poder notarial formal con facultades específicas y lenguaje legal.",
    sections: ["Otorgante", "Apoderado", "Facultades", "Vigencia", "Limitaciones", "Revocación", "Firmas", "Notaría"]
  },
  "petition": {
    title: "Derecho de Petición",
    systemPrompt: "Genera un derecho de petición formal según la legislación colombiana.",
    sections: ["Destinatario", "Peticionario", "Hechos", "Fundamentos", "Petición", "Pruebas", "Notificaciones", "Firma"]
  },
  "authorization": {
    title: "Autorización",
    systemPrompt: "Genera un documento de autorización formal para trámites o representación.",
    sections: ["Autorizante", "Autorizado", "Objeto", "Alcance", "Vigencia", "Documento de Identidad", "Firma"]
  },
  "promissory-note": {
    title: "Pagaré",
    systemPrompt: "Genera un pagaré formal con todos los elementos legales requeridos.",
    sections: ["Lugar y Fecha", "Monto", "Deudor", "Acreedor", "Plazo", "Intereses", "Lugar de Pago", "Firma"]
  },
  "complaint": {
    title: "Queja o Reclamo",
    systemPrompt: "Genera una queja o reclamo formal ante una entidad o empresa.",
    sections: ["Destinatario", "Datos del Quejoso", "Hechos", "Perjuicios", "Solicitud", "Pruebas", "Notificaciones", "Firma"]
  },
  "reference-letter": {
    title: "Carta de Referencia Personal",
    systemPrompt: "Genera una carta de referencia personal o de buena conducta.",
    sections: ["Fecha", "Destinatario", "Declaración", "Tiempo de Conocimiento", "Cualidades", "Recomendación", "Datos de Contacto", "Firma"]
  },
  "sales-contract": {
    title: "Contrato de Compraventa",
    systemPrompt: "Genera un contrato de compraventa de bienes muebles o inmuebles.",
    sections: ["Partes", "Objeto", "Precio", "Forma de Pago", "Entrega", "Garantías", "Obligaciones", "Firmas"]
  },
  "receipt": {
    title: "Recibo de Pago",
    systemPrompt: "Genera un recibo de pago formal con todos los datos necesarios.",
    sections: ["Número", "Fecha", "Receptor", "Pagador", "Concepto", "Monto", "Forma de Pago", "Firma"]
  },
  "apology-letter": {
    title: "Carta de Disculpa",
    systemPrompt: "Genera una carta de disculpa profesional y sincera.",
    sections: ["Fecha", "Destinatario", "Reconocimiento", "Explicación", "Disculpa", "Compromiso", "Despedida", "Firma"]
  },
  "termination-letter": {
    title: "Carta de Terminación de Contrato",
    systemPrompt: "Genera una carta formal de terminación de contrato laboral o comercial.",
    sections: ["Fecha", "Destinatario", "Referencia al Contrato", "Comunicación", "Motivo", "Fecha Efectiva", "Liquidación", "Firma"]
  }
};

serve(async (req) => {
  console.log("generate-docx: Request received", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("generate-docx: Body parsed");
    
    const { templateType, description, customTitle } = body;

    if (!templateType || !description) {
      return new Response(
        JSON.stringify({ error: "Se requiere tipo de plantilla y descripción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description.length > 5000) {
      return new Response(
        JSON.stringify({ error: "La descripción es muy larga (máx. 5000 caracteres)" }),
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
      console.error("generate-docx: LOVABLE_API_KEY not found");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("generate-docx: Calling AI API");

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { 
            role: 'system', 
            content: `${template.systemPrompt}

REGLAS:
1. Genera contenido profesional y bien estructurado
2. Usa las siguientes secciones: ${template.sections.join(', ')}
3. Marca cada sección con ## antes del título
4. El contenido debe ser realista y útil
5. No incluyas explicaciones, solo el documento
6. Responde en español` 
          },
          { role: 'user', content: `Genera un documento "${template.title}" basado en: ${description}` }
        ],
      }),
    });

    console.log("generate-docx: AI response status", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("generate-docx: AI API Error", response.status, errorText);
      
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
    console.log("generate-docx: AI response received");
    
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      return new Response(
        JSON.stringify({ error: "No se generó contenido. Intenta de nuevo." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("generate-docx: Success");

    return new Response(
      JSON.stringify({
        content,
        title: customTitle || template.title,
        templateType,
        sections: template.sections
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("generate-docx: Error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
