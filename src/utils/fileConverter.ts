/**
 * File conversion utilities for knowledge base
 */

import { estimateTokens } from './contextCalculator';

export interface ConversionResult {
  markdown: string;
  tokens: number;
  needsCompaction: boolean;
  originalSize: number;
}

/**
 * Convert various file types to markdown (simplified version)
 */
export const convertFileToMarkdown = async (
  file: File,
  maxContextLength: number
): Promise<ConversionResult> => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  let markdown = '';
  
  // Simple text file conversion
  if (['txt', 'md'].includes(fileExtension || '')) {
    markdown = await file.text();
  } else {
    // For other files, create metadata
    markdown = `# ${file.name}\n\n**File Information:**\n- Type: ${file.type || 'Unknown'}\n- Size: ${formatFileSize(file.size)}\n- Last Modified: ${new Date(file.lastModified).toLocaleString()}\n\n*This file type requires additional processing for full content extraction.*`;
  }
  
  const tokens = estimateTokens(markdown);
  const needsCompaction = tokens > maxContextLength * 0.8;
  
  return {
    markdown,
    tokens,
    needsCompaction,
    originalSize: file.size,
  };
};

/**
 * Compact document using LLM (placeholder implementation)
 */
export const compactDocument = async (
  markdown: string,
  targetLength: number,
  _llmProvider: 'lmstudio' | 'openrouter',
  _modelName: string
): Promise<string> => {
  try {
    // Placeholder implementation - would integrate with LLM
    const estimatedOriginalTokens = estimateTokens(markdown);
    return `# Compacted Document Summary

*This document has been automatically compacted from ${estimatedOriginalTokens.toLocaleString()} tokens to fit within context limits.*

## Original Content Summary

${markdown.substring(0, targetLength * 2)}

... [Content would be compacted by AI] ...

*Note: Document compaction feature is not yet fully implemented. This is a placeholder showing where the LLM-compacted content would appear.*`;
  } catch (error) {
    console.error('Error compacting document:', error);
    throw new Error('Failed to compact document');
  }
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};