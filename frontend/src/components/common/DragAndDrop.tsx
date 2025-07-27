import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Icon } from './Icon';
import { GlassCard } from './GlassCard';

// Draggable Item Interface
export interface DraggableItem {
  id: string;
  content: React.ReactNode;
  data?: any;
}

// Sortable List Component
export interface SortableListProps {
  items: DraggableItem[];
  onReorder: (items: DraggableItem[]) => void;
  isDark?: boolean;
  className?: string;
}

export function SortableList({ 
  items, 
  onReorder, 
  isDark = false, 
  className = '' 
}: SortableListProps) {
  return (
    <Reorder.Group
      axis="y"
      values={items}
      onReorder={onReorder}
      className={`sortable-list ${className}`}
    >
      <AnimatePresence>
        {items.map((item) => (
          <Reorder.Item
            key={item.id}
            value={item}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            whileDrag={{
              scale: 1.05,
              boxShadow: isDark 
                ? '0 10px 25px rgba(0, 0, 0, 0.3)' 
                : '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
          >
            <GlassCard
              isDark={isDark}
              style={{
                marginBottom: '8px',
                cursor: 'grab',
                userSelect: 'none',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
              }}>
                <Icon
                  name="action-drag"
                  size="sm"
                  color={isDark ? '#666666' : '#999999'}
                  style={{ cursor: 'grab' }}
                />
                <div style={{ flex: 1 }}>
                  {item.content}
                </div>
              </div>
            </GlassCard>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
}

// Drop Zone Component
export interface DropZoneProps {
  onDrop: (items: DraggableItem[]) => void;
  acceptTypes?: string[];
  isDark?: boolean;
  className?: string;
  children?: React.ReactNode;
  placeholder?: string;
}

export function DropZone({ 
  onDrop, 
  isDark = false, 
  className = '', 
  children, 
  placeholder = 'Drop items here' 
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const dataTransfer = e.dataTransfer;
    if (dataTransfer) {
      try {
        const itemsData = dataTransfer.getData('application/json');
        if (itemsData) {
          const items: DraggableItem[] = JSON.parse(itemsData);
          onDrop(items);
        }
      } catch (error) {
        console.error('Error parsing dropped data:', error);
      }
    }
  };

  return (
    <div
      className={`drop-zone ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver 
          ? '#3B82F6' 
          : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: isDragOver 
          ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'),
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        minHeight: '120px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children || (
        <div style={{ textAlign: 'center' }}>
          <Icon
            name="action-upload"
            size="xl"
            color={isDragOver ? '#3B82F6' : (isDark ? '#666666' : '#999999')}
            style={{ marginBottom: '16px' }}
          />
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: isDark ? '#ffffff' : '#333333',
          }}>
            {placeholder}
          </div>
        </div>
      )}
    </div>
  );
}

// Draggable Card Component
export interface DraggableCardProps {
  item: DraggableItem;
  isDark?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function DraggableCard({ 
  item, 
  isDark = false, 
  className = '', 
  children 
}: DraggableCardProps) {



  return (
    <motion.div
      className={`draggable-card ${className}`}
      draggable

      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{ duration: 0.2 }}
      style={{
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      <GlassCard isDark={isDark}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
        }}>
          <Icon
            name="action-drag"
            size="sm"
            color={isDark ? '#666666' : '#999999'}
            style={{ cursor: 'grab' }}
          />
          <div style={{ flex: 1 }}>
            {children || item.content}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Kanban Board Component
export interface KanbanColumn {
  id: string;
  title: string;
  items: DraggableItem[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
  onColumnUpdate: (columns: KanbanColumn[]) => void;
  isDark?: boolean;
  className?: string;
}

export function KanbanBoard({ 
  columns, 
  onColumnUpdate, 
  isDark = false, 
  className = '' 
}: KanbanBoardProps) {




  const handleDrop = (columnId: string) => {
    // TODO: Implement drag and drop functionality
    console.log('Drop on column:', columnId);

    // TODO: Implement column update logic
    console.log('Update columns');
  };

  const handleColumnReorder = (columnId: string, items: DraggableItem[]) => {
    const newColumns = columns.map(column => {
      if (column.id === columnId) {
        return { ...column, items };
      }
      return column;
    });
    onColumnUpdate(newColumns);
  };

  return (
    <div className={`kanban-board ${className}`} style={{
      display: 'flex',
      gap: '16px',
      overflowX: 'auto',
      padding: '16px 0',
    }}>
      {columns.map(column => (
        <div
          key={column.id}
          style={{
            minWidth: '300px',
            flex: 1,
          }}
        >
          <div style={{
            padding: '12px 16px',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            borderRadius: '8px 8px 0 0',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: isDark ? '#ffffff' : '#333333',
            }}>
              {column.title}
            </h3>
            <span style={{
              fontSize: '12px',
              color: isDark ? '#666666' : '#999999',
            }}>
              {column.items.length} items
            </span>
          </div>

                     <DropZone
             onDrop={() => handleDrop(column.id)}
             isDark={isDark}
           >
            <SortableList
              items={column.items}
              onReorder={(items) => handleColumnReorder(column.id, items)}
              isDark={isDark}
            />
          </DropZone>
        </div>
      ))}
    </div>
  );
}

// File Drop Zone Component
export interface FileDropZoneProps {
  onFilesDrop: (files: File[]) => void;
  acceptTypes?: string[];
  maxFiles?: number;
  isDark?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({ 
  onFilesDrop, 
  acceptTypes, 
  maxFiles, 
  isDark = false, 
  className = '', 
  children 
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    
    // Filter by accepted types
    const filteredFiles = acceptTypes 
      ? files.filter(file => acceptTypes.some(type => file.type.includes(type)))
      : files;

    // Limit number of files
    const limitedFiles = maxFiles 
      ? filteredFiles.slice(0, maxFiles)
      : filteredFiles;

    onFilesDrop(limitedFiles);
  };

  return (
    <div
      className={`file-drop-zone ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver 
          ? '#3B82F6' 
          : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: '8px',
        padding: '32px 16px',
        backgroundColor: isDragOver 
          ? (isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)')
          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'),
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
        textAlign: 'center',
      }}
    >
      {children || (
        <div>
          <Icon
            name="action-upload"
            size="xl"
            color={isDragOver ? '#3B82F6' : (isDark ? '#666666' : '#999999')}
            style={{ marginBottom: '16px' }}
          />
          <div style={{
            fontSize: '16px',
            fontWeight: '500',
            color: isDark ? '#ffffff' : '#333333',
            marginBottom: '8px',
          }}>
            Drop files here
          </div>
          <div style={{
            fontSize: '14px',
            color: isDark ? '#666666' : '#999999',
          }}>
            {acceptTypes && `Accepted: ${acceptTypes.join(', ')}`}
            {maxFiles && ` (Max: ${maxFiles} files)`}
          </div>
        </div>
      )}
    </div>
  );
} 