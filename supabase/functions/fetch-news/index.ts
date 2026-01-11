const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface NewsArticle {
  title: string;
  description: string;
  source: { name: string };
  url: string;
  publishedAt: string;
  image?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, category, limit = 5 } = await req.json();

    const apiKey = Deno.env.get('GNEWS_API_KEY');
    if (!apiKey) {
      console.error('GNEWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Servicio de noticias no configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limpiar query para GNews - remover caracteres especiales que no soporta
    const cleanQuery = (query || 'últimas noticias')
      .replace(/[¿?¡!,;:()"\[\]{}]/g, ' ')  // Remover caracteres especiales
      .replace(/\s+/g, ' ')                   // Colapsar espacios múltiples
      .trim()
      .slice(0, 100);                         // Limitar longitud
    
    const searchQuery = cleanQuery || 'noticias';
    const maxResults = Math.min(limit, 10);
    
    const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(searchQuery)}&lang=es&country=co&max=${maxResults}&apikey=${apiKey}`;

    console.log('Fetching news from GNews:', searchQuery);

    const response = await fetch(gnewsUrl);
    const data = await response.json();

    if (!response.ok || data.errors) {
      console.error('GNews error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.errors?.[0] || 'Error al obtener noticias' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transformar artículos de GNews al formato esperado
    const articles: NewsArticle[] = (data.articles || []).map((article: GNewsArticle) => ({
      title: article.title,
      description: article.description || article.content?.slice(0, 200) + '...',
      source: { name: article.source.name },
      url: article.url,
      publishedAt: article.publishedAt,
      image: article.image,
    }));

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
