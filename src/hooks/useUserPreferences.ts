import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  id: string;
  user_id: string;
  interests: string[];
  topics_count: Record<string, number>;
  last_topics: string[];
  preferred_language: string;
}

// Categorías de temas para detectar intereses
const TOPIC_CATEGORIES: Record<string, string[]> = {
  tecnología: ['ia', 'inteligencia artificial', 'programación', 'código', 'software', 'hardware', 'computadora', 'app', 'aplicación', 'web', 'internet', 'tecnología', 'tech', 'ai', 'machine learning', 'python', 'javascript', 'react', 'developer', 'programar', 'código', 'api', 'database', 'datos'],
  política: ['presidente', 'alcalde', 'gobernador', 'elecciones', 'congreso', 'senado', 'partido', 'gobierno', 'ministro', 'política', 'ley', 'decreto', 'reforma', 'votación'],
  deportes: ['fútbol', 'futbol', 'baloncesto', 'tenis', 'partido', 'gol', 'mundial', 'champions', 'liga', 'equipo', 'jugador', 'copa', 'olimpiadas', 'deporte'],
  economía: ['dinero', 'dólar', 'euro', 'bitcoin', 'crypto', 'bolsa', 'inversión', 'economía', 'finanzas', 'precio', 'inflación', 'mercado', 'banco', 'ahorro'],
  entretenimiento: ['película', 'serie', 'música', 'canción', 'artista', 'actor', 'actriz', 'concierto', 'netflix', 'spotify', 'videojuegos', 'gaming', 'anime', 'manga'],
  ciencia: ['ciencia', 'científico', 'experimento', 'estudio', 'investigación', 'universo', 'espacio', 'nasa', 'biología', 'química', 'física', 'medicina', 'salud'],
  educación: ['aprender', 'estudiar', 'universidad', 'colegio', 'curso', 'libro', 'leer', 'conocimiento', 'examen', 'tarea', 'educación'],
  viajes: ['viajar', 'viaje', 'turismo', 'hotel', 'vuelo', 'país', 'ciudad', 'vacaciones', 'playa', 'montaña', 'destino'],
  cocina: ['cocina', 'cocinar', 'receta', 'comida', 'restaurante', 'ingrediente', 'plato', 'postre', 'cena', 'almuerzo', 'desayuno'],
  noticias: ['noticias', 'actualidad', 'última hora', 'breaking', 'hoy', 'suceso', 'evento', 'acontecimiento']
};

// Detectar temas en un mensaje
function detectTopics(message: string): string[] {
  const lowerMsg = message.toLowerCase();
  const detectedTopics: string[] = [];
  
  for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    if (keywords.some(keyword => lowerMsg.includes(keyword))) {
      detectedTopics.push(category);
    }
  }
  
  return [...new Set(detectedTopics)]; // Eliminar duplicados
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Cargar preferencias al montar
  useEffect(() => {
    const loadPreferences = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      
      setUserId(session.user.id);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading preferences:', error);
      }
      
      if (data) {
        setPreferences({
          ...data,
          interests: data.interests || [],
          topics_count: (data.topics_count as Record<string, number>) || {},
          last_topics: data.last_topics || []
        });
      }
      
      setIsLoading(false);
    };
    
    loadPreferences();
    
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        setUserId(session.user.id);
        loadPreferences();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setPreferences(null);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  // Actualizar preferencias basándose en un mensaje
  const updateFromMessage = useCallback(async (message: string) => {
    if (!userId) return;
    
    const detectedTopics = detectTopics(message);
    if (detectedTopics.length === 0) return;
    
    // Calcular nuevos conteos
    const newTopicsCount = { ...(preferences?.topics_count || {}) };
    detectedTopics.forEach(topic => {
      newTopicsCount[topic] = (newTopicsCount[topic] || 0) + 1;
    });
    
    // Calcular intereses principales (top 5 temas más frecuentes)
    const sortedTopics = Object.entries(newTopicsCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
    
    // Últimos 10 temas consultados
    const lastTopics = [...detectedTopics, ...(preferences?.last_topics || [])]
      .slice(0, 10);
    
    try {
      const updateData = {
        interests: sortedTopics,
        topics_count: newTopicsCount,
        last_topics: lastTopics,
      };
      
      if (preferences) {
        // Actualizar existente
        const { error } = await supabase
          .from('user_preferences')
          .update(updateData)
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('user_preferences')
          .insert({ user_id: userId, ...updateData });
        
        if (error) throw error;
      }
      
      setPreferences(prev => ({
        id: prev?.id || '',
        user_id: userId,
        preferred_language: prev?.preferred_language || 'es',
        ...updateData,
      }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [userId, preferences]);

  // Obtener contexto de preferencias para el AI
  const getPreferencesContext = useCallback((): string => {
    if (!preferences || !preferences.interests.length) return '';
    
    let context = '\n\n═══════════════════════════════════════\n';
    context += '🧠 MEMORIA DEL USUARIO\n';
    context += '═══════════════════════════════════════\n\n';
    
    context += `🎯 Intereses principales: ${preferences.interests.join(', ')}\n`;
    
    if (preferences.last_topics.length > 0) {
      context += `📌 Temas recientes: ${preferences.last_topics.slice(0, 5).join(', ')}\n`;
    }
    
    context += '\n💡 Usa esta información para:\n';
    context += '- Priorizar respuestas relacionadas a sus intereses\n';
    context += '- Dar ejemplos relevantes a lo que le importa\n';
    context += '- Mencionar temas conectados que podrían interesarle\n';
    context += '- Hacer la conversación más personal y relevante\n';
    
    return context;
  }, [preferences]);

  return {
    preferences,
    isLoading,
    updateFromMessage,
    getPreferencesContext,
    mainInterests: preferences?.interests || [],
    lastTopics: preferences?.last_topics || [],
  };
}
