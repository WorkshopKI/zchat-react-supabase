/**
 * Utility functions for calculating context usage in chats
 */

import { Message } from '../types';

/**
 * Rough token estimation - approximately 4 characters per token
 * This is a simplified calculation and may not be perfectly accurate for all models
 */
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

/**
 * Calculate total context usage for a chat
 */
export const calculateChatContextUsage = (messages: Message[]): number => {
  let totalTokens = 0;
  
  for (const message of messages) {
    // Add tokens for the message content
    totalTokens += estimateTokens(message.content);
    
    // Add overhead for role and formatting (roughly 10-20 tokens per message)
    totalTokens += 15;
  }
  
  return totalTokens;
};

/**
 * Get context usage percentage
 */
export const getContextUsagePercentage = (usedTokens: number, maxTokens: number): number => {
  return Math.min(100, Math.round((usedTokens / maxTokens) * 100));
};

/**
 * Get context usage color based on percentage
 */
export const getContextUsageColor = (percentage: number): string => {
  if (percentage < 50) {
    return 'text-green-500';
  } else if (percentage < 80) {
    return 'text-yellow-500';
  } else {
    return 'text-red-500';
  }
};

/**
 * Format context usage for display
 */
export const formatContextUsage = (usedTokens: number, maxTokens: number): string => {
  const percentage = getContextUsagePercentage(usedTokens, maxTokens);
  
  if (usedTokens < 1000) {
    return `${usedTokens}/${maxTokens} (${percentage}%)`;
  } else if (usedTokens < 1000000) {
    const usedK = (usedTokens / 1000).toFixed(1);
    const maxK = (maxTokens / 1000).toFixed(0);
    return `${usedK}k/${maxK}k (${percentage}%)`;
  } else {
    const usedM = (usedTokens / 1000000).toFixed(1);
    const maxM = (maxTokens / 1000000).toFixed(1);
    return `${usedM}M/${maxM}M (${percentage}%)`;
  }
};