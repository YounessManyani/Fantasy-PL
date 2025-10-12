/**
 * Calculate Z-score
 */
export function zScore(value: number, mean: number = 0, stddev: number = 1): number {
    if (stddev === 0) return 0;
    return (value - mean) / stddev;
  }
  
  /**
   * Round to decimal places
   */
  export function round(value: number, decimals: number = 2): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }
  
  /**
   * Clamp value between min and max
   */
  export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }