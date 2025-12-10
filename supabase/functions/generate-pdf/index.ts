import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plantillas de documentos
const templates: Record<string, { title: string; systemPrompt: string; sections: string[] }> = {
  contract: {
    title: "Contrato",
    systemPrompt: `Eres un experto en redacción de contratos legales. Genera un contrato profesional basado en la descripción del usuario. El contrato debe incluir todas las cláusulas necesarias, términos claros y lenguaje legal apropiado. Responde SOLO con el contenido del contrato, sin explicaciones adicionales.`,
    sections: ["Partes", "Objeto", "Obligaciones", "Duración", "Precio", "Incumplimiento", "Jurisdicción", "Firmas"]
  },
  invoice: {
    title: "Factura",
    systemPrompt: `Eres un experto en documentos comerciales. Genera una factura profesional basada en la descripción del usuario. Incluye todos los campos necesarios como datos del emisor, receptor, conceptos, cantidades, precios unitarios, subtotales, impuestos y total. Responde SOLO con el contenido de la factura en formato estructurado.`,
    sections: ["Datos Emisor", "Datos Cliente", "Fecha", "Número de Factura", "Conceptos", "Subtotal", "IVA", "Total"]
  },
  cv: {
    title: "Currículum Vitae",
    systemPrompt: `Eres un experto en recursos humanos y redacción de CVs. Genera un currículum profesional basado en la información del usuario. Debe ser claro, conciso y destacar las habilidades y experiencia relevantes. Responde SOLO con el contenido del CV estructurado.`,
    sections: ["Datos Personales", "Perfil Profesional", "Experiencia Laboral", "Educación", "Habilidades", "Idiomas", "Referencias"]
  },
  letter: {
    title: "Carta Formal",
    systemPrompt: `Eres un experto en comunicación empresarial. Genera una carta formal profesional basada en la descripción del usuario. Debe tener un tono apropiado, estructura correcta y contenido claro. Responde SOLO con el contenido de la carta.`,
    sections: ["Encabezado", "Fecha", "Destinatario", "Saludo", "Cuerpo", "Despedida", "Firma"]
  },
  quote: {
    title: "Cotización",
    systemPrompt: `Eres un experto en documentos comerciales. Genera una cotización profesional basada en la descripción del usuario. Incluye descripción detallada de productos/servicios, precios, condiciones y validez. Responde SOLO con el contenido de la cotización estructurada.`,
    sections: ["Datos Empresa", "Cliente", "Fecha", "Validez", "Descripción", "Precios", "Condiciones", "Total"]
  },
  certificate: {
    title: "Certificado",
    systemPrompt: `Eres un experto en documentos oficiales. Genera un certificado profesional basado en la descripción del usuario. Debe tener un formato formal y contenido apropiado para el tipo de certificación. Responde SOLO con el contenido del certificado.`,
    sections: ["Título", "Institución", "Beneficiario", "Logro/Reconocimiento", "Fecha", "Firma", "Sello"]
  },
  nda: {
    title: "Acuerdo de Confidencialidad (NDA)",
    systemPrompt: `Eres un experto en documentos legales. Genera un acuerdo de confidencialidad (NDA) profesional basado en la descripción del usuario. Debe incluir definición de información confidencial, obligaciones, excepciones, duración y consecuencias. Responde SOLO con el contenido del NDA.`,
    sections: ["Partes", "Definiciones", "Información Confidencial", "Obligaciones", "Excepciones", "Duración", "Incumplimiento", "Firmas"]
  },
  report: {
    title: "Reporte/Informe",
    systemPrompt: `Eres un experto en redacción de informes profesionales. Genera un informe estructurado basado en la descripción del usuario. Debe ser claro, objetivo y bien organizado. Responde SOLO con el contenido del informe.`,
    sections: ["Título", "Resumen Ejecutivo", "Introducción", "Desarrollo", "Resultados", "Conclusiones", "Recomendaciones"]
  },
  receipt: {
    title: "Recibo",
    systemPrompt: `Eres un experto en documentos comerciales. Genera un recibo de pago profesional basado en la descripción del usuario. Incluye datos del pagador, receptor, concepto, monto, fecha y forma de pago. Responde SOLO con el contenido del recibo estructurado.`,
    sections: ["Número de Recibo", "Fecha", "Receptor", "Pagador", "Concepto", "Monto", "Forma de Pago", "Firma"]
  },
  memo: {
    title: "Memorando",
    systemPrompt: `Eres un experto en comunicación corporativa. Genera un memorando profesional basado en la descripción del usuario. Debe ser claro, directo y con formato empresarial estándar. Responde SOLO con el contenido del memorando.`,
    sections: ["Para", "De", "Fecha", "Asunto", "Cuerpo", "Anexos", "Firma"]
  },
  minutes: {
    title: "Acta",
    systemPrompt: `Eres un experto en documentación corporativa. Genera un acta de reunión profesional basada en la descripción del usuario. Debe incluir todos los puntos tratados, decisiones tomadas y compromisos. Responde SOLO con el contenido del acta estructurada.`,
    sections: ["Fecha y Hora", "Lugar", "Asistentes", "Orden del Día", "Desarrollo", "Acuerdos", "Compromisos", "Firmas"]
  },
  tutela: {
    title: "Acción de Tutela",
    systemPrompt: `Eres un experto en derecho constitucional colombiano. Genera una acción de tutela profesional basada en la descripción del usuario. Debe incluir los hechos, derechos vulnerados, pretensiones y fundamentos jurídicos según la legislación colombiana. Responde SOLO con el contenido de la tutela estructurada.`,
    sections: ["Accionante", "Accionado", "Hechos", "Derechos Fundamentales Vulnerados", "Pretensiones", "Fundamentos Jurídicos", "Pruebas", "Notificaciones", "Firma"]
  },
  lawsuit: {
    title: "Demanda",
    systemPrompt: `Eres un experto en derecho procesal. Genera una demanda profesional basada en la descripción del usuario. Debe incluir identificación de las partes, hechos, pretensiones, fundamentos de derecho y pruebas según normativa legal. Responde SOLO con el contenido de la demanda estructurada.`,
    sections: ["Demandante", "Demandado", "Pretensiones", "Hechos", "Fundamentos de Derecho", "Pruebas", "Cuantía", "Competencia", "Notificaciones", "Firma"]
  },
  petition: {
    title: "Derecho de Petición",
    systemPrompt: `Eres un experto en derecho administrativo colombiano. Genera un derecho de petición profesional basado en la descripción del usuario. Debe ser claro, respetuoso y fundamentado en el artículo 23 de la Constitución Política. Responde SOLO con el contenido del derecho de petición estructurado.`,
    sections: ["Destinatario", "Peticionario", "Asunto", "Hechos", "Petición", "Fundamentos", "Notificaciones", "Firma"]
  },
  pqr: {
    title: "PQR (Petición, Queja o Reclamo)",
    systemPrompt: `Eres un experto en atención al ciudadano y derechos del consumidor. Genera un PQR profesional basado en la descripción del usuario. Debe ser claro, con hechos concretos y la solicitud específica. Responde SOLO con el contenido del PQR estructurado.`,
    sections: ["Tipo (Petición/Queja/Reclamo)", "Entidad Destinataria", "Datos del Ciudadano", "Asunto", "Hechos", "Solicitud", "Fundamentos", "Anexos", "Firma"]
  },
  complaint: {
    title: "Queja Formal",
    systemPrompt: `Eres un experto en derecho y procedimientos de queja. Genera una queja formal profesional basada en la descripción del usuario. Debe incluir los hechos detallados, la normativa vulnerada y la solicitud específica. Responde SOLO con el contenido de la queja estructurada.`,
    sections: ["Autoridad Destinataria", "Quejoso", "Querellado", "Hechos", "Normativa Vulnerada", "Pruebas", "Solicitud", "Notificaciones", "Firma"]
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateType, description, customTitle } = await req.json();

    // Validación de entrada
    if (!templateType || !description) {
      return new Response(
        JSON.stringify({ error: 'Se requiere tipo de plantilla y descripción' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (description.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'La descripción es muy larga (máx. 5000 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const template = templates[templateType];
    if (!template) {
      return new Response(
        JSON.stringify({ error: 'Tipo de plantilla no válido', availableTemplates: Object.keys(templates) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating PDF content for template: ${templateType}`);

    // Generar contenido con IA
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: template.systemPrompt },
          { role: "user", content: `Genera un ${template.title} basado en esta descripción:\n\n${description}\n\nAsegúrate de incluir las siguientes secciones: ${template.sections.join(", ")}.` }
        ],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Por favor recarga tu cuenta." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error("Error al generar contenido");
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || "";

    if (!generatedContent) {
      throw new Error("No se pudo generar contenido");
    }

    console.log("Content generated successfully");

    // Devolver el contenido generado para que el frontend cree el PDF
    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        templateType,
        title: customTitle || template.title,
        sections: template.sections
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
