import { useState, useEffect, useRef } from 'react';

interface UseTypingEffectOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
}

export function useTypingEffect({ text, speed = 15, enabled = true }: UseTypingEffectOptions) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const previousTextRef = useRef('');
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    // If text was added (streaming), type only the new part
    if (text.startsWith(previousTextRef.current)) {
      const newContent = text.slice(previousTextRef.current.length);
      
      if (newContent.length > 0) {
        setIsTyping(true);
        let localIndex = 0;
        
        const typeEffect = () => {
          if (localIndex < newContent.length) {
            setDisplayedText(prev => prev + newContent.charAt(localIndex));
            localIndex++;
            setTimeout(typeEffect, speed);
          } else {
            setIsTyping(false);
            previousTextRef.current = text;
          }
        };
        
        typeEffect();
      }
    } else {
      // Text completely changed, reset and type from beginning
      setDisplayedText('');
      previousTextRef.current = '';
      indexRef.current = 0;
      setIsTyping(true);
      
      let localIndex = 0;
      
      const typeEffect = () => {
        if (localIndex < text.length) {
          setDisplayedText(prev => prev + text.charAt(localIndex));
          localIndex++;
          setTimeout(typeEffect, speed);
        } else {
          setIsTyping(false);
          previousTextRef.current = text;
        }
      };
      
      typeEffect();
    }
  }, [text, speed, enabled]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      previousTextRef.current = text;
      setDisplayedText(text);
    }
  }, [enabled, text]);

  return { displayedText, isTyping };
}
