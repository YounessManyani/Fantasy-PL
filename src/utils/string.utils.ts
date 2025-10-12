/**
 * Remove accents from string
 */
export function stripAccents(str: string): string {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  
  /**
   * Normalize name for comparison
   */
  export function normalizeName(str: string): string {
    let normalized = stripAccents((str || '').toLowerCase());
    normalized = normalized
      .replace(/[^a-z0-9\s.\-']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return normalized;
  }
  
  /**
   * Extract surname from full name
   */
  export function extractSurname(fullName: string): string {
    const parts = fullName.split(' ').filter(Boolean);
    return parts[parts.length - 1] || fullName;
  }
  
  /**
   * Calculate string similarity (0-1)
   */
  export function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  
  /**
   * Levenshtein distance
   */
  function getEditDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }