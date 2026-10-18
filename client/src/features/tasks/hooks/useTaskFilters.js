import { useMemo, useState } from 'react';
import { filterTasks, sortTasks } from '../utils/taskUtils.js';

/**
 * Search / status filter / sort state for the All Tasks page.
 * Filtering happens client-side on the already-fetched list so results update instantly.
 */
export function useTaskFilters(tasks) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');

  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(tasks, { search, status }), sort),
    [tasks, search, status, sort]
  );

  const isFiltering = search.trim().length > 0 || status !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setSort('newest');
  };

  return {
    search,
    setSearch,
    status,
    setStatus,
    sort,
    setSort,
    visibleTasks,
    isFiltering,
    resetFilters,
  };
}
