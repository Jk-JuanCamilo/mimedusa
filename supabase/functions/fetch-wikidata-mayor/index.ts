const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WikidataMayorResult {
  alcalde: string;
  ciudad: string;
  pais?: string;
  fechaInicio?: string;
  imagen?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ciudad } = await req.json();

    if (!ciudad) {
      return new Response(
        JSON.stringify({ success: false, error: 'Se requiere el nombre de la ciudad' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Buscando alcalde de:', ciudad);

    // Query SPARQL simplificada para Wikidata - busca ciudades y su jefe de gobierno
    const sparqlQuery = `
      SELECT ?alcalde ?alcaldeLabel ?ciudad ?ciudadLabel ?pais ?paisLabel WHERE {
        ?ciudad wdt:P31/wdt:P279* wd:Q515 .
        ?ciudad rdfs:label ?nombre .
        FILTER(LANG(?nombre) = "es")
        FILTER(LCASE(?nombre) = LCASE("${ciudad.replace(/"/g, '\\"').trim()}"))
        ?ciudad wdt:P6 ?alcalde .
        OPTIONAL { ?ciudad wdt:P17 ?pais }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
      }
      LIMIT 3
    `;

    const wikidataUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;

    const response = await fetch(wikidataUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MedussaBot/1.0 (https://medussa.app; info@medussa.app)'
      }
    });

    if (!response.ok) {
      console.error('Wikidata error status:', response.status);
      const errorText = await response.text();
      console.error('Wikidata error response:', errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Error al consultar Wikidata',
          details: response.status 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const bindings = data.results?.bindings || [];

    console.log('Wikidata results:', bindings.length);

    if (bindings.length === 0) {
      // Intentar búsqueda con CONTAINS para coincidencias parciales
      const simpleQuery = `
        SELECT ?alcalde ?alcaldeLabel ?ciudad ?ciudadLabel ?pais ?paisLabel WHERE {
          ?ciudad wdt:P31 wd:Q515 .
          ?ciudad rdfs:label ?ciudadLabel .
          FILTER(LANG(?ciudadLabel) = "es")
          FILTER(CONTAINS(LCASE(?ciudadLabel), LCASE("${ciudad.replace(/"/g, '\\"').trim()}")))
          ?ciudad wdt:P6 ?alcalde .
          OPTIONAL { ?ciudad wdt:P17 ?pais }
          SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
        }
        LIMIT 3
      `;

      const simpleUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(simpleQuery)}&format=json`;
      
      const simpleResponse = await fetch(simpleUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MedussaBot/1.0 (https://medussa.app; info@medussa.app)'
        }
      });

      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        const simpleBindings = simpleData.results?.bindings || [];
        
        if (simpleBindings.length > 0) {
          const results: WikidataMayorResult[] = simpleBindings.map((binding: any) => ({
            alcalde: binding.alcaldeLabel?.value || 'No disponible',
            ciudad: binding.ciudadLabel?.value || ciudad,
            pais: binding.paisLabel?.value,
          }));

          return new Response(
            JSON.stringify({ 
              success: true, 
              results,
              fuente: 'Wikidata',
              consultadoEn: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No se encontró información del alcalde de "${ciudad}" en Wikidata`,
          sugerencia: 'La ciudad puede no estar registrada o no tener información actualizada en Wikidata'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Procesar resultados
    const results: WikidataMayorResult[] = bindings.map((binding: any) => ({
      alcalde: binding.alcaldeLabel?.value || 'No disponible',
      ciudad: binding.ciudadLabel?.value || ciudad,
      pais: binding.paisLabel?.value,
      fechaInicio: binding.fechaInicio?.value ? new Date(binding.fechaInicio.value).toLocaleDateString('es-CO') : undefined,
      imagen: binding.imagen?.value,
    }));

    // Eliminar duplicados basados en nombre de alcalde
    const uniqueResults = results.filter((result, index, self) =>
      index === self.findIndex((r) => r.alcalde === result.alcalde)
    );

    console.log('Resultados procesados:', uniqueResults.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        results: uniqueResults,
        fuente: 'Wikidata',
        consultadoEn: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching mayor from Wikidata:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al buscar información del alcalde' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
