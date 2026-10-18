import { useCallback, useEffect, useRef, useState } from 'react';
import { tasksApi } from '../api/tasks.api.js';

/**
 * Loads tasks from the API and exposes mutation helpers that keep local state in
 * sync with server responses (server is the source of truth).
 *
 * No global state library: the task list is page-level state, and each mutation
 * returns the server's canonical task object.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMutating, setIsMutating] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchTasks = useCallback(async ({ silent = false, signal } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const data = await tasksApi.list({}, signal);
      if (isMountedRef.current) setTasks(data);
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') return [];
      if (isMountedRef.current) setError(err.message || 'Failed to load tasks.');
      return null;
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchTasks({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchTasks]);

  const withMutation = useCallback(async (operation) => {
    setIsMutating(true);
    try {
      return await operation();
    } finally {
      if (isMountedRef.current) setIsMutating(false);
    }
  }, []);

  const createTask = useCallback(
    (payload) =>
      withMutation(async () => {
        const created = await tasksApi.create(payload);
        setTasks((current) => [created, ...current]);
        return created;
      }),
    [withMutation]
  );

  const updateTask = useCallback(
    (id, payload) =>
      withMutation(async () => {
        const updated = await tasksApi.update(id, payload);
        setTasks((current) => current.map((task) => (task._id === updated._id ? updated : task)));
        return updated;
      }),
    [withMutation]
  );

  const deleteTask = useCallback(
    (id) =>
      withMutation(async () => {
        await tasksApi.remove(id);
        setTasks((current) => current.filter((task) => task._id !== id));
        return id;
      }),
    [withMutation]
  );

  return {
    tasks,
    isLoading,
    error,
    isMutating,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
