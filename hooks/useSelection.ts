/**
 * 选择Hook - 封装多选逻辑
 */
import { useState, useCallback } from 'react';

export const useSelection = <T extends { id: string }>(items: T[] = []) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedIds(prev => new Set(prev).add(id));
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length && items.length > 0) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll]);

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const selectedItems = items.filter(item => selectedIds.has(item.id));

  return {
    selectedIds,
    selectedItems,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    deselectAll,
    toggleAll,
    count: selectedIds.size,
  };
};

