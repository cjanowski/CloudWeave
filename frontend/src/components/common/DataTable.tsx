import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { GlassInput } from './GlassInput';
import { GlassButton } from './GlassButton';
import { GlassCard } from './GlassCard';

export interface Column<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  selectable?: boolean;
  className?: string;
  isDark?: boolean;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: string;
}

export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  emptyMessage = 'No data available',
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  onRowClick,
  onSelectionChange,
  selectable = false,
  className = '',
  isDark = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Generate unique row IDs
  const getRowId = useCallback((row: T, index: number) => {
    return (row as any).id || `row-${index}`;
  }, []);

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = (row as any)[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    filters.forEach(filter => {
      filtered = filtered.filter(row => {
        const value = (row as any)[filter.key];
        return value && value.toString().toLowerCase().includes(filter.value.toLowerCase());
      });
    });

    return filtered;
  }, [data, searchTerm, filters, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, showPagination]);

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Handle filtering
  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(current => {
      const existing = current.find(f => f.key === key);
      if (existing) {
        if (value) {
          return current.map(f => f.key === key ? { ...f, value } : f);
        } else {
          return current.filter(f => f.key !== key);
        }
      } else if (value) {
        return [...current, { key, value }];
      }
      return current;
    });
  }, []);

  // Handle row selection
  const handleRowSelection = useCallback((rowId: string, checked: boolean) => {
    setSelectedRows(current => {
      const newSet = new Set(current);
      if (checked) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((row, index) => getRowId(row, index));
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData, getRowId]);

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedData = data.filter((row, index) => 
        selectedRows.has(getRowId(row, index))
      );
      onSelectionChange(selectedData);
    }
  }, [selectedRows, data, onSelectionChange, getRowId]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  return (
    <GlassCard className={`data-table ${className}`} isDark={isDark}>
      {/* Search and Filters */}
      {(showSearch || showFilters) && (
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {showSearch && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <GlassInput
                placeholder="Search..."
                value={searchTerm}
                onChange={(value: string) => setSearchTerm(value)}
                icon={<Icon name="action-search" size="sm" />}
                isDark={isDark}
              />
            </div>
          )}
          
          {showFilters && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {columns
                .filter(col => col.filterable)
                .map(column => (
                  <GlassInput
                    key={column.key}
                    placeholder={`Filter ${column.label}...`}
                    value={filters.find(f => f.key === column.key)?.value || ''}
                    onChange={(value: string) => handleFilter(column.key, value)}
                    style={{ minWidth: '150px' }}
                    isDark={isDark}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}>
              {selectable && (
                <th style={{ 
                  padding: '12px 8px',
                  textAlign: 'center',
                  width: '40px'
                }}>
                  <input
                    type="checkbox"
                    checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                    }}
                  />
                </th>
              )}
              
              {columns.map(column => (
                <th
                  key={column.key}
                  style={{
                    padding: '12px 8px',
                    textAlign: column.align || 'left',
                    fontWeight: '600',
                    cursor: column.sortable ? 'pointer' : 'default',
                    width: column.width,
                    color: isDark ? '#ffffff' : '#333333',
                    userSelect: 'none',
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    justifyContent: column.align === 'center' ? 'center' : 
                                   column.align === 'right' ? 'flex-end' : 'flex-start'
                  }}>
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <Icon
                        name={sortConfig.direction === 'asc' ? 'nav-up' : 'nav-down'}
                        size="sm"
                        color={isDark ? '#ffffff' : '#333333'}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            <AnimatePresence>
              {loading ? (
                <tr>
                  <td 
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{ 
                      padding: '40px',
                      textAlign: 'center',
                      color: isDark ? '#ffffff' : '#666666'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Icon name="status-loading" size="md" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    style={{ 
                      padding: '40px',
                      textAlign: 'center',
                      color: isDark ? '#ffffff' : '#666666'
                    }}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = getRowId(row, index);
                  const isSelected = selectedRows.has(rowId);
                  
                  return (
                    <motion.tr
                      key={rowId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
                        backgroundColor: isSelected 
                          ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                          : 'transparent',
                        cursor: onRowClick ? 'pointer' : 'default',
                      }}
                      onClick={() => onRowClick?.(row)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = isDark 
                            ? 'rgba(255, 255, 255, 0.05)' 
                            : 'rgba(0, 0, 0, 0.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {selectable && (
                        <td style={{ 
                          padding: '12px 8px',
                          textAlign: 'center',
                          width: '40px'
                        }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer',
                            }}
                          />
                        </td>
                      )}
                      
                      {columns.map(column => (
                        <td
                          key={column.key}
                          style={{
                            padding: '12px 8px',
                            textAlign: column.align || 'left',
                            color: isDark ? '#ffffff' : '#333333',
                          }}
                        >
                          {column.render 
                            ? column.render((row as any)[column.key], row)
                            : (row as any)[column.key] || '-'
                          }
                        </td>
                      ))}
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          padding: '16px 0',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        }}>
          <div style={{ color: isDark ? '#ffffff' : '#666666' }}>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <GlassButton
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              isDark={isDark}
              size="small"
            >
              <Icon name="nav-back" size="sm" />
              Previous
            </GlassButton>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                                     <GlassButton
                     key={pageNum}
                     onClick={() => setCurrentPage(pageNum)}
                     variant={currentPage === pageNum ? 'primary' : 'outline'}
                     isDark={isDark}
                     size="small"
                     style={{ minWidth: '40px' }}
                   >
                    {pageNum}
                  </GlassButton>
                );
              })}
            </div>
            
            <GlassButton
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              isDark={isDark}
              size="small"
            >
              Next
              <Icon name="nav-forward" size="sm" />
            </GlassButton>
          </div>
        </div>
      )}
    </GlassCard>
  );
} 