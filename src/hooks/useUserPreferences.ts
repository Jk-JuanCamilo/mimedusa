import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  
  return [...new Set(detectedTopics)];
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUid(user?.uid || null);
      if (!user) {
        setPreferences(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load preferences when user logs in
  useEffect(() => {
    const loadPreferences = async () => {
      if (!firebaseUid) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase.functions.invoke("user-preferences", {
          body: { action: "get", firebaseUid }
        });
        
        if (error) {
          console.error('Error loading preferences:', error);
        }
        
        if (data?.data) {
          setPreferences({
            ...data.data,
            interests: data.data.interests || [],
            topics_count: (data.data.topics_count as Record<string, number>) || {},
            last_topics: data.data.last_topics || []
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (firebaseUid) {
      loadPreferences();
    }
  }, [firebaseUid]);

  // Update preferences based on a message
  const updateFromMessage = useCallback(async (message: string) => {
    if (!firebaseUid) return;
    
    const detectedTopics = detectTopics(message);
    if (detectedTopics.length === 0) return;
    
    // Calculate new counts
    const newTopicsCount = { ...(preferences?.topics_count || {}) };
    detectedTopics.forEach(topic => {
      newTopicsCount[topic] = (newTopicsCount[topic] || 0) + 1;
    });
    
    // Calculate main interests (top 5 most frequent topics)
    const sortedTopics = Object.entries(newTopicsCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
    
    // Last 10 topics consulted
    const lastTopics = [...detectedTopics, ...(preferences?.last_topics || [])]
      .slice(0, 10);
    
    try {
      const { error } = await supabase.functions.invoke("user-preferences", {
        body: {
          action: "update",
          firebaseUid,
          interests: sortedTopics,
          topicsCount: newTopicsCount,
          lastTopics
        }
      });
      
      if (error) throw error;
      
      setPreferences(prev => ({
        id: prev?.id || '',
        user_id: firebaseUid,
        preferred_language: prev?.preferred_language || 'es',
        interests: sortedTopics,
        topics_count: newTopicsCount,
        last_topics: lastTopics,
      }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }, [firebaseUid, preferences]);

  // Get preferences context for AI
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
