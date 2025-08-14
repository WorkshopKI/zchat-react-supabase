import { useState, useRef, useCallback, useEffect } from 'react';

interface UseResizableSidebarProps {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

interface UseResizableSidebarReturn {
  sidebarWidth: number;
  isResizing: boolean;
  sidebarRef: React.RefObject<HTMLDivElement>;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for managing resizable sidebar functionality
 * Handles width state, mouse events, and localStorage persistence
 */
export const useResizableSidebar = ({
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 600,
  storageKey = 'zchat-sidebar-width'
}: UseResizableSidebarProps = {}): UseResizableSidebarReturn => {
  // Initialize width from localStorage or use default
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  // Handle mouse up to end resize
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Set up global mouse event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Persist width to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, sidebarWidth.toString());
  }, [sidebarWidth, storageKey]);

  return {
    sidebarWidth,
    isResizing,
    sidebarRef,
    handleMouseDown
  };
};