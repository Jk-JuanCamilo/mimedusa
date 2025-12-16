import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sistema de prompts dinámico basado en categorías
const getSystemPrompt = (templateType: string): string => {
  const prompts: Record<string, string> = {
    // Documentos Comerciales
    contract: "Genera un contrato profesional con cláusulas legales, términos claros y estructura formal.",
    invoice: "Genera una factura comercial con datos de emisor, receptor, conceptos, cantidades, precios, impuestos y totales.",
    quote: "Genera una cotización profesional con descripción de productos/servicios, precios y condiciones.",
    receipt: "Genera un recibo de pago con datos del pagador, receptor, concepto, monto y forma de pago.",
    proposal: "Genera una propuesta comercial persuasiva con objetivos, alcance, metodología e inversión.",
    "purchase-order": "Genera una orden de compra con datos del proveedor, productos, cantidades y condiciones.",
    "delivery-note": "Genera una nota de remisión/entrega de mercancía con detalles de productos entregados.",
    "credit-note": "Genera una nota de crédito con justificación, montos y referencias.",
    
    // Contratos Específicos
    "rental-contract": "Genera un contrato de arrendamiento completo con términos, obligaciones y condiciones legales.",
    "work-contract": "Genera un contrato laboral con funciones, salario, jornada y términos de empleo.",
    "service-contract": "Genera un contrato de prestación de servicios profesionales con alcance y honorarios.",
    "sales-contract": "Genera un contrato de compraventa con descripción del bien, precio y condiciones.",
    "loan-contract": "Genera un contrato de préstamo con monto, intereses, plazos y garantías.",
    "partnership-agreement": "Genera un acuerdo de sociedad con aportes, participaciones y responsabilidades.",
    "franchise-agreement": "Genera un contrato de franquicia con derechos, obligaciones y regalías.",
    
    // Documentos Laborales
    cv: "Genera un currículum profesional estructurado con perfil, experiencia, educación y habilidades.",
    letter: "Genera una carta formal profesional con estructura correcta y tono apropiado.",
    "recommendation-letter": "Genera una carta de recomendación destacando cualidades y logros profesionales.",
    "resignation-letter": "Genera una carta de renuncia profesional y respetuosa.",
    "termination-letter": "Genera una carta de terminación de contrato con motivos y fechas.",
    "work-certificate": "Genera una constancia laboral certificando empleo, cargo y período.",
    "salary-certificate": "Genera un certificado de ingresos/salario con datos verificables.",
    "experience-certificate": "Genera un certificado de experiencia laboral detallando funciones y logros.",
    
    // Documentos Legales
    nda: "Genera un acuerdo de confidencialidad (NDA) con definiciones, obligaciones y consecuencias.",
    "power-of-attorney": "Genera un poder notarial con facultades específicas y limitaciones.",
    affidavit: "Genera una declaración jurada formal con hechos bajo juramento.",
    "promissory-note": "Genera un pagaré con monto, plazo, intereses y condiciones de pago.",
    "lease-termination": "Genera un documento de terminación de contrato de arrendamiento.",
    waiver: "Genera un documento de exoneración de responsabilidad.",
    
    // Documentos Judiciales
    tutela: "Genera una acción de tutela según legislación colombiana con hechos, derechos vulnerados y pretensiones.",
    lawsuit: "Genera una demanda con identificación de partes, hechos, pretensiones y fundamentos de derecho.",
    petition: "Genera un derecho de petición formal con hechos, fundamentos y solicitud específica.",
    pqr: "Genera un PQR (Petición, Queja o Reclamo) estructurado con hechos y solicitud.",
    complaint: "Genera una queja formal con hechos detallados, normativa vulnerada y solicitud.",
    appeal: "Genera un recurso de apelación con fundamentos y argumentos legales.",
    "habeas-corpus": "Genera un habeas corpus para protección de libertad personal.",
    "custody-request": "Genera una solicitud de custodia de menores con fundamentos.",
    
    // Documentos Corporativos
    report: "Genera un informe profesional con resumen ejecutivo, análisis, resultados y recomendaciones.",
    memo: "Genera un memorando empresarial interno con asunto claro y contenido directo.",
    minutes: "Genera un acta de reunión con asistentes, temas tratados, acuerdos y compromisos.",
    "board-resolution": "Genera una resolución de junta directiva con decisiones formales.",
    "shareholders-meeting": "Genera un acta de asamblea de accionistas/socios.",
    "company-policy": "Genera un documento de política empresarial con procedimientos y normas.",
    
    // Documentos Académicos
    "thesis-cover": "Genera una portada formal de tesis con título, autor e institución.",
    "academic-certificate": "Genera un certificado académico con información de estudios.",
    "enrollment-letter": "Genera una constancia de matrícula académica.",
    "academic-recommendation": "Genera una carta de recomendación académica para estudios o becas.",
    "research-proposal": "Genera una propuesta de investigación con objetivos, metodología y cronograma.",
    
    // Certificados
    certificate: "Genera un certificado formal de reconocimiento o logro.",
    "achievement-award": "Genera un reconocimiento o premio por logros destacados.",
    "participation-certificate": "Genera un certificado de participación en evento o actividad.",
    "training-certificate": "Genera un certificado de capacitación o curso completado.",
    
    // Documentos Personales
    authorization: "Genera una autorización formal para trámites o representación.",
    "consent-form": "Genera un formulario de consentimiento informado.",
    "medical-excuse": "Genera una excusa médica o justificación por motivos de salud.",
    "travel-authorization": "Genera un permiso de viaje para menores de edad.",
    "will-testament": "Genera un testamento o documento de última voluntad.",
  };
  
  return prompts[templateType] || `Genera un documento profesional de tipo "${templateType}" con estructura apropiada y contenido de calidad.`;
};

const getDocumentTitle = (templateType: string): string => {
  const titles: Record<string, string> = {
    contract: "Contrato", invoice: "Factura", quote: "Cotización", receipt: "Recibo",
    proposal: "Propuesta Comercial", "purchase-order": "Orden de Compra",
    "delivery-note": "Remisión", "credit-note": "Nota Crédito",
    "rental-contract": "Contrato de Arrendamiento", "work-contract": "Contrato Laboral",
    "service-contract": "Contrato de Servicios", "sales-contract": "Contrato de Compraventa",
    "loan-contract": "Contrato de Préstamo", "partnership-agreement": "Acuerdo de Sociedad",
    "franchise-agreement": "Contrato de Franquicia",
    cv: "Currículum Vitae", letter: "Carta Formal",
    "recommendation-letter": "Carta de Recomendación", "resignation-letter": "Carta de Renuncia",
    "termination-letter": "Carta de Terminación", "work-certificate": "Constancia Laboral",
    "salary-certificate": "Certificado Salarial", "experience-certificate": "Certificado de Experiencia",
    nda: "Acuerdo de Confidencialidad", "power-of-attorney": "Poder Notarial",
    affidavit: "Declaración Jurada", "promissory-note": "Pagaré",
    "lease-termination": "Terminación de Arriendo", waiver: "Exoneración",
    tutela: "Acción de Tutela", lawsuit: "Demanda", petition: "Derecho de Petición",
    pqr: "PQR", complaint: "Queja Formal", appeal: "Recurso de Apelación",
    "habeas-corpus": "Habeas Corpus", "custody-request": "Solicitud de Custodia",
    report: "Informe", memo: "Memorando", minutes: "Acta de Reunión",
    "board-resolution": "Resolución de Junta", "shareholders-meeting": "Acta de Asamblea",
    "company-policy": "Política Empresarial",
    "thesis-cover": "Portada de Tesis", "academic-certificate": "Certificado Académico",
    "enrollment-letter": "Constancia de Matrícula", "academic-recommendation": "Recomendación Académica",
    "research-proposal": "Propuesta de Investigación",
    certificate: "Certificado", "achievement-award": "Reconocimiento",
    "participation-certificate": "Certificado de Participación", "training-certificate": "Certificado de Capacitación",
    authorization: "Autorización", "consent-form": "Consentimiento Informado",
    "medical-excuse": "Excusa Médica", "travel-authorization": "Permiso de Viaje",
    "will-testament": "Testamento",
  };
  return titles[templateType] || templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 'unknown';
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: isAllowed } = await supabase.rpc('check_api_rate_limit', { 
      p_ip_address: clientIp, p_endpoint: 'generate-pdf', p_max_requests: 10, p_window_minutes: 1
    });
    
    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Por favor espera un momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    void supabase.rpc('record_api_request', { p_ip_address: clientIp, p_endpoint: 'generate-pdf' });
    
    const { templateType, description, customTitle } = await req.json();

    if (!templateType || !description) {
      return new Response(JSON.stringify({ error: 'Se requiere tipo de plantilla y descripción' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (description.length > 5000) {
      return new Response(JSON.stringify({ error: 'La descripción es muy larga (máx. 5000 caracteres)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Servicio temporalmente no disponible." }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = getSystemPrompt(templateType);
    const docTitle = getDocumentTitle(templateType);
    
    console.log(`Generating PDF: ${templateType}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `${systemPrompt}\n\nREGLAS:\n1. Genera contenido profesional y completo\n2. Usa formato con secciones claras (##)\n3. Incluye todos los datos necesarios\n4. Responde SOLO con el contenido del documento, sin explicaciones\n5. En español` },
          { role: "user", content: `Genera un ${docTitle} basado en:\n\n${description}` }
        ],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error("Error al generar contenido");
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || "";

    if (!generatedContent) throw new Error("No se pudo generar contenido");

    return new Response(JSON.stringify({
      success: true, content: generatedContent, templateType, title: customTitle || docTitle
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error. Por favor intenta de nuevo.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
