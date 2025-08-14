import React from 'react';
import { GripVertical } from 'lucide-react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

/**
 * Resize handle component for resizable sidebar
 * Provides visual feedback and drag functionality
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, isResizing }) => {
  return (
    <div
      className={`
        absolute top-0 right-0 w-2 h-full bg-transparent 
        hover:bg-blue-500 hover:bg-opacity-30 
        cursor-col-resize transition-all duration-200 group
        ${isResizing ? 'bg-blue-500 bg-opacity-30 w-1' : ''}
      `}
      onMouseDown={onMouseDown}
      title="Drag to resize sidebar"
    >
      <div 
        className={`
          absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 
          transition-opacity duration-200
          ${isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <GripVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
    </div>
  );
};

export default ResizeHandle;