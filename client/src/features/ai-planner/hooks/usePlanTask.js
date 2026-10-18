import { useCallback, useRef, useState } from 'react';
import { aiApi } from '../api/ai.api.js';

/**
 * AI plan generation state: request lifecycle, error text, and retryable failures.
 * The plan comes from the backend, which validates the model output before returning it.
 */
export function usePlanTask() {
  const [plan, setPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null); // numeric HTTP status when known
  const abortRef = useRef(null);

  const generate = useCallback(async (description) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsGenerating(true);
    setError(null);
    setStatus(null);

    try {
      const result = await aiApi.planTask(description, controller.signal);
      setPlan(result);
      return result;
    } catch (err) {
      if (err?.name === 'AbortError') return null;
      setError(err.message || 'Could not generate a plan.');
      setStatus(err.status ?? null);
      setPlan(null);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setPlan(null);
    setError(null);
    setStatus(null);
    setIsGenerating(false);
  }, []);

  return { plan, isGenerating, error, status, generate, reset };
}
