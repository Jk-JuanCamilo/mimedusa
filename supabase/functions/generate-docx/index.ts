import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Dynamic template system for all document types
const getDocxConfig = (templateType: string): { title: string; prompt: string; sections: string[] } => {
  const configs: Record<string, { title: string; prompt: string; sections: string[] }> = {
    // Cartas Empresariales
    "business-letter": { title: "Carta Empresarial", prompt: "Genera carta empresarial profesional con membrete y formato formal.", sections: ["Membrete", "Fecha", "Destinatario", "Saludo", "Cuerpo", "Despedida", "Firma"] },
    "cover-letter": { title: "Carta de Presentación", prompt: "Genera carta de presentación para empleo destacando habilidades.", sections: ["Fecha", "Destinatario", "Presentación", "Experiencia", "Motivación", "Cierre", "Firma"] },
    "introduction-letter": { title: "Carta de Introducción", prompt: "Genera carta de introducción de empresa o servicios.", sections: ["Membrete", "Fecha", "Presentación", "Servicios", "Propuesta", "Contacto", "Firma"] },
    "invitation-letter": { title: "Carta de Invitación", prompt: "Genera invitación formal a eventos.", sections: ["Fecha", "Destinatario", "Evento", "Detalles", "RSVP", "Despedida", "Firma"] },
    "thank-you-letter": { title: "Carta de Agradecimiento", prompt: "Genera carta de agradecimiento profesional.", sections: ["Fecha", "Destinatario", "Agradecimiento", "Motivo", "Despedida", "Firma"] },
    "apology-letter": { title: "Carta de Disculpa", prompt: "Genera carta de disculpa profesional y sincera.", sections: ["Fecha", "Destinatario", "Reconocimiento", "Disculpa", "Compromiso", "Despedida", "Firma"] },
    "follow-up-letter": { title: "Carta de Seguimiento", prompt: "Genera carta de seguimiento a reuniones o propuestas.", sections: ["Fecha", "Referencia", "Recordatorio", "Próximos Pasos", "Contacto", "Firma"] },
    "confirmation-letter": { title: "Carta de Confirmación", prompt: "Genera carta de confirmación de acuerdos.", sections: ["Fecha", "Destinatario", "Confirmación", "Detalles", "Términos", "Firma"] },
    
    // Documentos Laborales
    "resume": { title: "Hoja de Vida", prompt: "Genera CV profesional y moderno.", sections: ["Datos Personales", "Perfil", "Experiencia", "Educación", "Habilidades", "Idiomas", "Referencias"] },
    "functional-resume": { title: "CV Funcional", prompt: "Genera CV enfocado en habilidades y competencias.", sections: ["Datos Personales", "Competencias", "Logros", "Experiencia", "Formación"] },
    "academic-cv": { title: "CV Académico", prompt: "Genera CV para entorno universitario.", sections: ["Datos", "Formación", "Publicaciones", "Investigación", "Docencia", "Conferencias"] },
    "recommendation-letter": { title: "Carta de Recomendación", prompt: "Genera carta de recomendación destacando cualidades.", sections: ["Membrete", "Fecha", "Presentación", "Cualidades", "Logros", "Recomendación", "Contacto", "Firma"] },
    "reference-letter": { title: "Carta de Referencia", prompt: "Genera referencia personal o de conducta.", sections: ["Fecha", "Declaración", "Tiempo Conocimiento", "Cualidades", "Recomendación", "Contacto", "Firma"] },
    "work-certificate": { title: "Constancia Laboral", prompt: "Genera certificación de trabajo oficial.", sections: ["Membrete", "Certificación", "Empleado", "Cargo", "Período", "Funciones", "Firma", "Sello"] },
    "salary-certificate": { title: "Certificado de Ingresos", prompt: "Genera constancia de salario verificable.", sections: ["Membrete", "Certificación", "Empleado", "Cargo", "Salario", "Deducciones", "Firma"] },
    "experience-certificate": { title: "Certificado de Experiencia", prompt: "Genera constancia de experiencia laboral.", sections: ["Membrete", "Certificación", "Empleado", "Cargo", "Funciones", "Logros", "Período", "Firma"] },
    "resignation-letter": { title: "Carta de Renuncia", prompt: "Genera carta de renuncia profesional.", sections: ["Fecha", "Destinatario", "Comunicación", "Agradecimientos", "Disposición", "Firma"] },
    "termination-letter": { title: "Carta de Terminación", prompt: "Genera carta de terminación de contrato.", sections: ["Fecha", "Destinatario", "Referencia", "Comunicación", "Motivo", "Fecha Efectiva", "Liquidación", "Firma"] },
    "promotion-letter": { title: "Carta de Promoción", prompt: "Genera notificación de ascenso.", sections: ["Fecha", "Empleado", "Felicitación", "Nuevo Cargo", "Responsabilidades", "Salario", "Firma"] },
    "warning-letter": { title: "Carta de Amonestación", prompt: "Genera llamado de atención formal.", sections: ["Fecha", "Empleado", "Antecedentes", "Falta", "Compromiso", "Consecuencias", "Firma"] },
    "job-offer": { title: "Oferta de Empleo", prompt: "Genera carta de oferta laboral.", sections: ["Fecha", "Candidato", "Posición", "Responsabilidades", "Compensación", "Beneficios", "Términos", "Firma"] },
    
    // Contratos
    "contract": { title: "Contrato General", prompt: "Genera contrato legal con cláusulas.", sections: ["Encabezado", "Partes", "Antecedentes", "Objeto", "Obligaciones", "Vigencia", "Incumplimiento", "Firmas"] },
    "rental-contract": { title: "Contrato de Arrendamiento", prompt: "Genera contrato de arriendo completo.", sections: ["Partes", "Inmueble", "Canon", "Duración", "Obligaciones", "Garantías", "Terminación", "Firmas"] },
    "work-contract": { title: "Contrato de Trabajo", prompt: "Genera contrato laboral.", sections: ["Partes", "Objeto", "Funciones", "Salario", "Jornada", "Duración", "Obligaciones", "Terminación", "Firmas"] },
    "service-contract": { title: "Contrato de Servicios", prompt: "Genera contrato de prestación de servicios.", sections: ["Partes", "Objeto", "Alcance", "Honorarios", "Pago", "Duración", "Confidencialidad", "Firmas"] },
    "sales-contract": { title: "Contrato de Compraventa", prompt: "Genera contrato de compraventa.", sections: ["Partes", "Objeto", "Precio", "Forma Pago", "Entrega", "Garantías", "Firmas"] },
    "loan-contract": { title: "Contrato de Préstamo", prompt: "Genera contrato de préstamo de dinero.", sections: ["Partes", "Monto", "Intereses", "Plazo", "Forma Pago", "Garantías", "Incumplimiento", "Firmas"] },
    "partnership-contract": { title: "Contrato de Sociedad", prompt: "Genera contrato de constitución de sociedad.", sections: ["Partes", "Objeto Social", "Aportes", "Participación", "Administración", "Utilidades", "Duración", "Firmas"] },
    "franchise-contract": { title: "Contrato de Franquicia", prompt: "Genera acuerdo de franquicia.", sections: ["Partes", "Marca", "Territorio", "Regalías", "Obligaciones", "Capacitación", "Duración", "Firmas"] },
    "maintenance-contract": { title: "Contrato de Mantenimiento", prompt: "Genera contrato de servicios de mantenimiento.", sections: ["Partes", "Servicios", "Frecuencia", "Tarifas", "Garantías", "Duración", "Firmas"] },
    "consulting-contract": { title: "Contrato de Consultoría", prompt: "Genera contrato de servicios de consultoría.", sections: ["Partes", "Alcance", "Entregables", "Honorarios", "Confidencialidad", "Duración", "Firmas"] },
    "freelance-contract": { title: "Contrato Freelance", prompt: "Genera contrato de trabajo independiente.", sections: ["Partes", "Proyecto", "Entregables", "Honorarios", "Plazos", "Propiedad Intelectual", "Firmas"] },
    "internship-contract": { title: "Contrato de Pasantía", prompt: "Genera contrato de prácticas profesionales.", sections: ["Partes", "Objeto", "Funciones", "Duración", "Horario", "Beneficios", "Firmas"] },
    "confidentiality-contract": { title: "Contrato de Confidencialidad", prompt: "Genera NDA completo.", sections: ["Partes", "Definiciones", "Obligaciones", "Excepciones", "Duración", "Penalidades", "Firmas"] },
    
    // Documentos Comerciales
    "invoice": { title: "Factura", prompt: "Genera factura comercial detallada.", sections: ["Emisor", "Cliente", "Número", "Fecha", "Conceptos", "Subtotal", "Impuestos", "Total"] },
    "quote": { title: "Cotización", prompt: "Genera cotización de productos/servicios.", sections: ["Empresa", "Cliente", "Fecha", "Validez", "Descripción", "Precios", "Condiciones", "Total"] },
    "receipt": { title: "Recibo de Pago", prompt: "Genera comprobante de pago.", sections: ["Número", "Fecha", "Receptor", "Pagador", "Concepto", "Monto", "Forma Pago", "Firma"] },
    "proposal": { title: "Propuesta Comercial", prompt: "Genera propuesta de negocios.", sections: ["Portada", "Resumen", "Objetivos", "Alcance", "Metodología", "Inversión", "Términos"] },
    "purchase-order": { title: "Orden de Compra", prompt: "Genera pedido a proveedores.", sections: ["Emisor", "Proveedor", "Fecha", "Productos", "Cantidades", "Precios", "Condiciones", "Firma"] },
    "delivery-receipt": { title: "Acta de Entrega", prompt: "Genera recepción de productos/servicios.", sections: ["Fecha", "Partes", "Productos", "Estado", "Observaciones", "Firmas"] },
    "credit-note": { title: "Nota de Crédito", prompt: "Genera ajuste de facturación.", sections: ["Número", "Fecha", "Factura Referencia", "Motivo", "Monto", "Firma"] },
    "sponsorship-proposal": { title: "Propuesta de Patrocinio", prompt: "Genera solicitud de patrocinio.", sections: ["Presentación", "Evento", "Beneficios", "Paquetes", "Inversión", "Contacto"] },
    
    // Informes y Actas
    "report": { title: "Informe Ejecutivo", prompt: "Genera informe profesional.", sections: ["Portada", "Resumen", "Introducción", "Análisis", "Resultados", "Conclusiones", "Recomendaciones"] },
    "technical-report": { title: "Informe Técnico", prompt: "Genera reporte técnico detallado.", sections: ["Objetivo", "Metodología", "Análisis", "Resultados", "Conclusiones", "Anexos"] },
    "audit-report": { title: "Informe de Auditoría", prompt: "Genera resultados de auditoría.", sections: ["Alcance", "Metodología", "Hallazgos", "Observaciones", "Recomendaciones", "Conclusión"] },
    "progress-report": { title: "Informe de Avance", prompt: "Genera progreso de proyecto.", sections: ["Período", "Avances", "Pendientes", "Riesgos", "Próximos Pasos", "Recursos"] },
    "incident-report": { title: "Informe de Incidente", prompt: "Genera reporte de incidentes.", sections: ["Fecha/Hora", "Ubicación", "Descripción", "Afectados", "Acciones", "Recomendaciones"] },
    "meeting-minutes": { title: "Acta de Reunión", prompt: "Genera acta formal de reunión.", sections: ["Fecha/Hora", "Asistentes", "Orden del Día", "Desarrollo", "Acuerdos", "Próxima Reunión", "Firmas"] },
    "board-minutes": { title: "Acta de Junta Directiva", prompt: "Genera acta de junta directiva.", sections: ["Convocatoria", "Asistentes", "Quórum", "Agenda", "Decisiones", "Votaciones", "Firmas"] },
    "shareholders-minutes": { title: "Acta de Asamblea", prompt: "Genera acta de asamblea de socios.", sections: ["Convocatoria", "Asistentes", "Capital", "Agenda", "Deliberaciones", "Resoluciones", "Firmas"] },
    
    // Comunicaciones Internas
    "memo": { title: "Memorando", prompt: "Genera comunicación interna.", sections: ["Para", "De", "Fecha", "Asunto", "Cuerpo", "Acciones", "Firma"] },
    "circular": { title: "Circular", prompt: "Genera comunicado general.", sections: ["Número", "Fecha", "Destinatarios", "Asunto", "Contenido", "Vigencia", "Firma"] },
    "notice": { title: "Aviso", prompt: "Genera notificación interna.", sections: ["Fecha", "Asunto", "Contenido", "Acciones", "Vigencia", "Responsable"] },
    "policy-document": { title: "Política Empresarial", prompt: "Genera documento de políticas.", sections: ["Objetivo", "Alcance", "Definiciones", "Políticas", "Responsables", "Vigencia"] },
    "procedure-document": { title: "Procedimiento", prompt: "Genera manual de procedimientos.", sections: ["Objetivo", "Alcance", "Responsables", "Pasos", "Registros", "Control"] },
    "manual": { title: "Manual", prompt: "Genera manual de usuario o empleado.", sections: ["Introducción", "Objetivo", "Contenido", "Procedimientos", "FAQ", "Contacto"] },
    
    // Documentos Legales
    "agreement": { title: "Acuerdo de Confidencialidad", prompt: "Genera NDA profesional.", sections: ["Partes", "Definiciones", "Obligaciones", "Excepciones", "Duración", "Jurisdicción", "Firmas"] },
    "power-of-attorney": { title: "Poder Notarial", prompt: "Genera poder legal.", sections: ["Otorgante", "Apoderado", "Facultades", "Vigencia", "Limitaciones", "Revocación", "Notaría"] },
    "authorization": { title: "Autorización", prompt: "Genera autorización para trámites.", sections: ["Autorizante", "Autorizado", "Objeto", "Alcance", "Vigencia", "Identificación", "Firma"] },
    "promissory-note": { title: "Pagaré", prompt: "Genera documento de deuda.", sections: ["Lugar/Fecha", "Monto", "Deudor", "Acreedor", "Plazo", "Intereses", "Lugar Pago", "Firma"] },
    "affidavit": { title: "Declaración Jurada", prompt: "Genera declaración bajo juramento.", sections: ["Declarante", "Identificación", "Declaración", "Hechos", "Juramento", "Fecha", "Firma"] },
    "waiver": { title: "Exoneración", prompt: "Genera liberación de responsabilidad.", sections: ["Partes", "Actividad", "Riesgos", "Liberación", "Aceptación", "Firma"] },
    "consent-form": { title: "Consentimiento Informado", prompt: "Genera autorización con información.", sections: ["Paciente", "Procedimiento", "Riesgos", "Beneficios", "Alternativas", "Consentimiento", "Firma"] },
    "will-testament": { title: "Testamento", prompt: "Genera última voluntad.", sections: ["Testador", "Declaraciones", "Bienes", "Herederos", "Legados", "Ejecutor", "Testigos", "Firma"] },
    
    // Peticiones y Quejas
    "petition": { title: "Derecho de Petición", prompt: "Genera petición legal formal.", sections: ["Destinatario", "Peticionario", "Hechos", "Fundamentos", "Petición", "Pruebas", "Notificaciones", "Firma"] },
    "complaint": { title: "Queja o Reclamo", prompt: "Genera queja formal.", sections: ["Destinatario", "Quejoso", "Hechos", "Perjuicios", "Solicitud", "Pruebas", "Notificaciones", "Firma"] },
    "appeal": { title: "Recurso de Apelación", prompt: "Genera apelación de decisiones.", sections: ["Autoridad", "Apelante", "Decisión Impugnada", "Fundamentos", "Pretensión", "Pruebas", "Firma"] },
    "tutela": { title: "Acción de Tutela", prompt: "Genera tutela para protección de derechos.", sections: ["Juez", "Accionante", "Accionado", "Hechos", "Derechos", "Pretensiones", "Pruebas", "Firma"] },
    "pqr": { title: "PQR", prompt: "Genera Petición, Queja o Reclamo.", sections: ["Tipo", "Entidad", "Ciudadano", "Asunto", "Hechos", "Solicitud", "Anexos", "Firma"] },
    
    // Certificados
    "certificate": { title: "Certificado General", prompt: "Genera certificado formal.", sections: ["Título", "Institución", "Certificación", "Beneficiario", "Descripción", "Fecha", "Firma", "Sello"] },
    "achievement-certificate": { title: "Certificado de Logro", prompt: "Genera reconocimiento de logros.", sections: ["Título", "Institución", "Reconocimiento", "Beneficiario", "Logro", "Fecha", "Firma"] },
    "completion-certificate": { title: "Certificado de Finalización", prompt: "Genera constancia de curso completado.", sections: ["Título", "Institución", "Programa", "Participante", "Duración", "Fecha", "Firma"] },
    "participation-certificate": { title: "Certificado de Participación", prompt: "Genera constancia de asistencia.", sections: ["Título", "Evento", "Participante", "Fecha", "Duración", "Firma"] },
    "training-certificate": { title: "Certificado de Capacitación", prompt: "Genera constancia de formación.", sections: ["Título", "Institución", "Curso", "Participante", "Horas", "Fecha", "Firma"] },
    "diploma": { title: "Diploma", prompt: "Genera diploma académico.", sections: ["Título", "Institución", "Otorgamiento", "Graduado", "Programa", "Fecha", "Autoridades"] },
    
    // Documentos Académicos
    "thesis-cover": { title: "Portada de Tesis", prompt: "Genera portada formal de tesis.", sections: ["Universidad", "Facultad", "Título", "Autor", "Director", "Fecha", "Ciudad"] },
    "abstract": { title: "Resumen Ejecutivo", prompt: "Genera abstract o resumen.", sections: ["Título", "Objetivo", "Metodología", "Resultados", "Conclusiones", "Palabras Clave"] },
    "research-proposal": { title: "Propuesta de Investigación", prompt: "Genera proyecto de investigación.", sections: ["Título", "Problema", "Objetivos", "Marco Teórico", "Metodología", "Cronograma", "Bibliografía"] },
    "academic-letter": { title: "Carta Académica", prompt: "Genera comunicación universitaria.", sections: ["Membrete", "Fecha", "Destinatario", "Asunto", "Contenido", "Despedida", "Firma"] },
    "recommendation-academic": { title: "Recomendación Académica", prompt: "Genera carta para estudios o becas.", sections: ["Membrete", "Fecha", "Presentación", "Cualidades", "Desempeño", "Recomendación", "Contacto", "Firma"] },
    
    // Documentos Personales
    "travel-authorization": { title: "Permiso de Viaje", prompt: "Genera autorización de viaje para menores.", sections: ["Padres", "Menor", "Destino", "Fechas", "Acompañante", "Autorización", "Notaría"] },
    "medical-excuse": { title: "Excusa Médica", prompt: "Genera justificación por salud.", sections: ["Fecha", "Paciente", "Diagnóstico", "Recomendación", "Período", "Médico", "Registro"] },
    "personal-reference": { title: "Referencia Personal", prompt: "Genera carta de recomendación personal.", sections: ["Fecha", "Declaración", "Relación", "Cualidades", "Recomendación", "Contacto", "Firma"] },
    "character-reference": { title: "Referencia de Carácter", prompt: "Genera testimonio de conducta.", sections: ["Fecha", "Declaración", "Conocimiento", "Cualidades", "Conducta", "Recomendación", "Firma"] },
  };
  
  const config = configs[templateType];
  if (config) return config;
  
  return {
    title: templateType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    prompt: `Genera un documento profesional de tipo "${templateType}" con estructura apropiada.`,
    sections: ["Encabezado", "Contenido", "Cierre", "Firma"]
  };
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
      p_ip_address: clientIp, p_endpoint: 'generate-docx', p_max_requests: 10, p_window_minutes: 1
    });
    
    if (isAllowed === false) {
      return new Response(JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    void supabase.rpc('record_api_request', { p_ip_address: clientIp, p_endpoint: 'generate-docx' });
    
    const { templateType, description, customTitle } = await req.json();

    if (!templateType || !description) {
      return new Response(JSON.stringify({ error: "Se requiere tipo de plantilla y descripción" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (description.length > 5000) {
      return new Response(JSON.stringify({ error: "Descripción muy larga (máx. 5000)" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const templateConfig = getDocxConfig(templateType);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Error de configuración" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log("generate-docx:", templateType);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { 
            role: 'system', 
            content: `${templateConfig.prompt}

REGLAS:
1. Contenido profesional y estructurado
2. Secciones: ${templateConfig.sections.join(', ')}
3. Marca cada sección con ## antes del título
4. Contenido realista y útil
5. Solo el documento, sin explicaciones
6. En español` 
          },
          { role: 'user', content: `Genera "${templateConfig.title}" basado en: ${description}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite excedido." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error("Error de conexión");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      return new Response(JSON.stringify({ error: "No se generó contenido." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      content, title: customTitle || templateConfig.title, templateType, sections: templateConfig.sections
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("generate-docx:", error);
    return new Response(JSON.stringify({ error: "Error inesperado." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
