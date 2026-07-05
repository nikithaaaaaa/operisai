import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3001`;

export const useAI = (language) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const callAI = useCallback(async (mode, selectedCode, fullContent, promptStr = '') => {
    setIsLoading(true);
    setResponse(null);
    try {
      const res = await fetch(`${API_URL}/api/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          selectedCode,
          fullContent,
          language,
          prompt: promptStr
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setResponse(data.response);
      } else {
        setResponse('Error: AI failed to process request.');
      }
    } catch (e) {
      console.error(e);
      setResponse('Error: Network/Server issue calling AI.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  const explain = (selectedCode, fullContent) => callAI('explain', selectedCode, fullContent);
  const fix = (selectedCode, fullContent) => callAI('fix', selectedCode, fullContent);
  const generate = (promptStr, fullContent) => callAI('generate', null, fullContent, promptStr);

  return { isLoading, response, explain, fix, generate };
};
