const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fuentes de noticias confiables
const TRUSTED_SOURCES = [
  'reuters.com',
  'apnews.com',
  'bbc.com',
  'cnn.com',
  'elpais.com',
  'nytimes.com',
  'theguardian.com',
  'france24.com',
  'dw.com',
  'aljazeera.com'
];

interface NewsArticle {
  title: string;
  description: string;
  source: { name: string };
  url: string;
  publishedAt: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, limit = 8 } = await req.json();

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Servicio de noticias no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construir query optimizada para noticias de fuentes confiables
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // Filtrar solo fuentes confiables
    const sourcesFilter = TRUSTED_SOURCES.slice(0, 5).map(s => `site:${s}`).join(' OR ');
    const newsQuery = query 
      ? `(${query}) (${sourcesFilter}) noticias ${dateStr}`
      : `últimas noticias importantes hoy ${dateStr} (${sourcesFilter})`;

    console.log('Fetching news:', newsQuery);

    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: newsQuery,
        limit: Math.min(limit, 10),
        lang: 'es',
        country: 'co',
        scrapeOptions: { formats: ['markdown'] },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('News fetch error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Error al obtener noticias' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar resultados al formato de noticias estructurado
    const articles: NewsArticle[] = (data.data || []).map((result: any) => {
      // Extraer nombre de fuente de la URL
      let sourceName = 'Fuente desconocida';
      try {
        const url = new URL(result.url);
        const domain = url.hostname.replace('www.', '');
        // Mapear dominio a nombre de fuente
        const sourceMap: Record<string, string> = {
          'reuters.com': 'Reuters',
          'apnews.com': 'Associated Press',
          'bbc.com': 'BBC',
          'cnn.com': 'CNN',
          'elpais.com': 'El País',
          'nytimes.com': 'The New York Times',
          'theguardian.com': 'The Guardian',
          'france24.com': 'France 24',
          'dw.com': 'Deutsche Welle',
          'aljazeera.com': 'Al Jazeera',
        };
        sourceName = sourceMap[domain] || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
      } catch {
        // Mantener fuente desconocida
      }

      // Extraer descripción del markdown
      const description = result.markdown 
        ? result.markdown.slice(0, 250).replace(/[\n\r]+/g, ' ').trim() + '...'
        : result.description || 'Sin descripción disponible';

      return {
        title: result.title || 'Sin título',
        description,
        source: { name: sourceName },
        url: result.url,
        publishedAt: new Date().toISOString().split('T')[0], // Usar fecha actual
      };
    });

    console.log('News fetched successfully:', articles.length, 'articles');

    return new Response(
      JSON.stringify({ 
        success: true, 
        articles,
        fetchedAt: new Date().toISOString(),
        query: query || 'general'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Error al buscar noticias' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
