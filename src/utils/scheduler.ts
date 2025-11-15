/**
 * Scheduler utilities for deferring expensive computations
 * Uses requestIdleCallback when available, falls back to setTimeout
 */

interface SchedulerOptions {
  timeout?: number;
}

/**
 * Schedule a callback to run when the browser is idle
 */
export function scheduleIdleCallback(
  callback: () => void,
  options: SchedulerOptions = {}
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, { timeout: options.timeout || 100 });
  } else {
    // Fallback to setTimeout
    return (setTimeout as any)(callback, 0);
  }
}

/**
 * Cancel a scheduled idle callback
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(handle);
  } else {
    // Fallback to clearTimeout
    (clearTimeout as any)(handle);
  }
}

/**
 * Schedule multiple tasks with delays
 * Returns a cleanup function
 */
export function scheduleTasks(
  tasks: Array<{ callback: () => void; delay: number }>
): () => void {
  const handles: number[] = [];
  
  tasks.forEach(({ callback, delay }) => {
    const handle = (setTimeout as any)(callback, delay);
    handles.push(handle);
  });
  
  return () => {
    handles.forEach((handle) => {
      (clearTimeout as any)(handle);
    });
  };
}

