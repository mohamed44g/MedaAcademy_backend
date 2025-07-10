import fuzz from 'fuzzball';

/**
 * Compares two device fingerprints and returns a similarity score
 * @param fingerprint1 First fingerprint to compare
 * @param fingerprint2 Second fingerprint to compare
 * @returns A promise that resolves to a number between 0 and 100 representing the similarity percentage
 */
export async function compareFingerprints(
  fingerprint1: string,
  fingerprint2: string,
): Promise<number> {
  // If either fingerprint is the unknown device, return 0% match
  if (fingerprint1 === 'unknown-device' || fingerprint2 === 'unknown-device') {
    return 0;
  }

  // If fingerprints are exactly the same, return 100%
  if (fingerprint1 === fingerprint2) {
    return 100;
  }

  try {
    // Import fuzzball dynamically to avoid server-side issues

    // Calculate similarity using fuzzball's token_sort_ratio
    // This handles cases where the same information might be in a different order
    const similarity = fuzz.token_sort_ratio(fingerprint1, fingerprint2);

    // Return the similarity score (0-100)
    return Math.round(similarity);
  } catch (error) {
    console.error('Error comparing fingerprints:', error);

    // Fallback to a simple character-based comparison if fuzzball fails
    const maxLength = Math.max(fingerprint1.length, fingerprint2.length);
    if (maxLength === 0) return 0;

    const distance = levenshteinDistance(fingerprint1, fingerprint2);
    const similarity = Math.max(0, 100 - (distance / maxLength) * 100);

    return Math.round(similarity);
  }
}

/**
 * Calculates the Levenshtein distance between two strings
 * This is used as a fallback when fuzzball is not available
 */
function levenshteinDistance(a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: any[] = [];

  // Initialize the matrix
  for (let i: any = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j: any = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          ),
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
