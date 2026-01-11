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

// Función para normalizar texto (quitar acentos)
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Función para hacer query a Wikidata
async function queryWikidata(sparqlQuery: string): Promise<any[]> {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'MedussaBot/1.0 (https://medussa.app; info@medussa.app)'
    }
  });

  if (!response.ok) {
    console.error('Wikidata query error:', response.status);
    return [];
  }

  const data = await response.json();
  return data.results?.bindings || [];
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

    const ciudadLimpia = ciudad.replace(/"/g, '\\"').trim();
    const ciudadNormalizada = normalizeText(ciudad);
    
    console.log('Buscando alcalde de:', ciudadLimpia, '(normalizado:', ciudadNormalizada, ')');

    // Queries para diferentes tipos de entidades administrativas
    const queries = [
      // Query 1: Ciudades (Q515) - búsqueda exacta
      `SELECT ?alcalde ?alcaldeLabel ?ciudad ?ciudadLabel ?pais ?paisLabel WHERE {
        ?ciudad wdt:P31 wd:Q515 .
        ?ciudad rdfs:label ?nombre .
        FILTER(LANG(?nombre) = "es")
        FILTER(LCASE(?nombre) = LCASE("${ciudadLimpia}"))
        ?ciudad wdt:P6 ?alcalde .
        OPTIONAL { ?ciudad wdt:P17 ?pais }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
      } LIMIT 3`,
      
      // Query 2: Municipios de Colombia (Q2555896)
      `SELECT ?alcalde ?alcaldeLabel ?ciudad ?ciudadLabel ?pais ?paisLabel WHERE {
        ?ciudad wdt:P31 wd:Q2555896 .
        ?ciudad rdfs:label ?nombre .
        FILTER(LANG(?nombre) = "es")
        FILTER(CONTAINS(LCASE(?nombre), LCASE("${ciudadLimpia}")))
        ?ciudad wdt:P6 ?alcalde .
        OPTIONAL { ?ciudad wdt:P17 ?pais }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
      } LIMIT 3`,
      
      // Query 3: Cualquier asentamiento humano con jefe de gobierno
      `SELECT ?alcalde ?alcaldeLabel ?ciudad ?ciudadLabel ?pais ?paisLabel WHERE {
        ?ciudad wdt:P6 ?alcalde .
        ?ciudad rdfs:label ?nombre .
        FILTER(LANG(?nombre) = "es")
        FILTER(CONTAINS(LCASE(?nombre), LCASE("${ciudadLimpia}")))
        OPTIONAL { ?ciudad wdt:P17 ?pais }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en" }
      } LIMIT 5`,
    ];

    let allResults: WikidataMayorResult[] = [];

    // Ejecutar queries en orden hasta encontrar resultados
    for (const query of queries) {
      console.log('Ejecutando query...');
      const bindings = await queryWikidata(query);
      
      if (bindings.length > 0) {
        console.log('Encontrados', bindings.length, 'resultados');
        
        const results: WikidataMayorResult[] = bindings.map((binding: any) => ({
          alcalde: binding.alcaldeLabel?.value || 'No disponible',
          ciudad: binding.ciudadLabel?.value || ciudad,
          pais: binding.paisLabel?.value,
        }));

        // Filtrar resultados que coincidan mejor con la búsqueda
        const filteredResults = results.filter(r => {
          const ciudadResultNorm = normalizeText(r.ciudad);
          return ciudadResultNorm.includes(ciudadNormalizada) || 
                 ciudadNormalizada.includes(ciudadResultNorm);
        });

        if (filteredResults.length > 0) {
          allResults = filteredResults;
          break;
        } else if (results.length > 0) {
          allResults = results;
          break;
        }
      }
    }

    if (allResults.length === 0) {
      console.log('No se encontraron resultados para:', ciudadLimpia);
      
      // Devolver 200 para que el cliente no lo trate como error de ejecución.
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `No se encontró información del alcalde de "${ciudad}" en Wikidata`,
          sugerencia: 'La ciudad puede no estar registrada o no tener información actualizada en Wikidata. Intenta con el nombre oficial completo.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Eliminar duplicados
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex((r) => r.alcalde === result.alcalde && r.ciudad === result.ciudad)
    );

    console.log('Resultados únicos:', uniqueResults.length);

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
