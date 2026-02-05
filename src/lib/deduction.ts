/**
 * One-Away Deduction Engine
 *
 * When you guess 4 words and get "one away", it means exactly 3 of those 4
 * words belong to the same group. This creates a constraint we can use.
 *
 * Key insight: If we have multiple one-away guesses, we can combine them
 * to deduce which words MUST or CANNOT be in the same group.
 */

export interface OneAwayGuess {
  id: string;
  words: [string, string, string, string];
}

export interface Constraint {
  // Exactly 3 of these 4 words are in the same group
  words: [string, string, string, string];
}

export interface Deduction {
  type: "must_be_together" | "cannot_be_together" | "exactly_three";
  words: string[];
  reason: string;
}

/**
 * Given a one-away guess, generate the 4 possible "true groups" of 3.
 * One of these groups of 3 is definitely correct.
 */
export function getPossibleTriplets(
  guess: OneAwayGuess
): [string, string, string][] {
  const [a, b, c, d] = guess.words;
  return [
    [a, b, c], // d is the odd one out
    [a, b, d], // c is the odd one out
    [a, c, d], // b is the odd one out
    [b, c, d], // a is the odd one out
  ];
}

/**
 * Check if two triplets are compatible (could both be subsets of the same group of 4)
 */
function tripletsCompatible(
  t1: [string, string, string],
  t2: [string, string, string]
): boolean {
  const set1 = new Set(t1);
  const set2 = new Set(t2);
  const union = new Set([...t1, ...t2]);

  // If union is 4 or fewer, they could be from the same group
  // If union is more than 4, they can't both be correct for the same group
  // But they could be from different groups...

  // Two triplets from the same group must share at least 2 elements
  let overlap = 0;
  for (const word of t1) {
    if (set2.has(word)) overlap++;
  }

  // If they share 2+ words and union <= 4, they're compatible for same group
  // If they share 0-1 words, they could be from different groups (also compatible)
  return union.size <= 4 || overlap <= 1;
}

/**
 * Find words that appear in ALL possible triplets from a guess.
 * These words are definitely part of the correct group (at least 2 of them together).
 */
export function findDefiniteWords(guesses: OneAwayGuess[]): Deduction[] {
  const deductions: Deduction[] = [];

  for (const guess of guesses) {
    // For a single one-away guess, we know 3 of 4 are together
    deductions.push({
      type: "exactly_three",
      words: [...guess.words],
      reason: `Exactly 3 of these 4 words are in the same group`,
    });
  }

  // Cross-reference multiple guesses
  if (guesses.length >= 2) {
    for (let i = 0; i < guesses.length; i++) {
      for (let j = i + 1; j < guesses.length; j++) {
        const g1 = guesses[i];
        const g2 = guesses[j];

        // Find common words between guesses
        const common = g1.words.filter((w) => g2.words.includes(w));

        if (common.length >= 3) {
          // If 3+ words appear in both guesses, those 3 are definitely together
          deductions.push({
            type: "must_be_together",
            words: common,
            reason: `These words appear in multiple one-away guesses`,
          });
        }

        if (common.length === 2) {
          // If exactly 2 words are shared, and both guesses are one-away,
          // we can deduce these 2 are likely together (appear in the true triplet of both)
          // But this isn't certain - need more analysis
        }
      }
    }
  }

  return deductions;
}

/**
 * Given all one-away guesses, compute which groupings are still possible.
 * Returns a list of valid "scenarios" - each scenario is a possible assignment.
 */
export function computePossibleGroupings(
  allWords: string[],
  guesses: OneAwayGuess[]
): string[][] {
  if (guesses.length === 0) {
    return [];
  }

  // For each guess, one of 4 triplets is correct
  // We need to find combinations where all guesses can be satisfied

  // Start with all possible triplets from first guess
  let possibleScenarios: Set<string>[] = getPossibleTriplets(guesses[0]).map(
    (t) => new Set(t)
  );

  // For each additional guess, filter/expand scenarios
  for (let i = 1; i < guesses.length; i++) {
    const guessTriplets = getPossibleTriplets(guesses[i]);
    const newScenarios: Set<string>[] = [];

    for (const scenario of possibleScenarios) {
      for (const triplet of guessTriplets) {
        // Check if this triplet is compatible with the scenario
        const tripletSet = new Set(triplet);
        const union = new Set([...scenario, ...tripletSet]);

        // They're from the same group if union <= 4
        if (union.size <= 4) {
          newScenarios.push(union);
        }
        // They could also be from different groups - scenario stays valid
        // But we're tracking groups, so we'd need more complex state
      }
    }

    possibleScenarios = newScenarios;
  }

  // Convert back to arrays and dedupe
  const seen = new Set<string>();
  const result: string[][] = [];

  for (const scenario of possibleScenarios) {
    const key = [...scenario].sort().join(",");
    if (!seen.has(key)) {
      seen.add(key);
      result.push([...scenario]);
    }
  }

  return result;
}

/**
 * Analyze guesses and produce human-readable insights
 */
export function analyzeGuesses(
  allWords: string[],
  guesses: OneAwayGuess[]
): {
  deductions: Deduction[];
  possibleGroups: string[][];
  insights: string[];
} {
  const deductions = findDefiniteWords(guesses);
  const possibleGroups = computePossibleGroupings(allWords, guesses);
  const insights: string[] = [];

  if (guesses.length === 0) {
    insights.push("Log a one-away guess to start deducing!");
    return { deductions, possibleGroups, insights };
  }

  if (guesses.length === 1) {
    insights.push(
      `One of these 4 words doesn't belong with the other 3: ${guesses[0].words.join(", ")}`
    );
  }

  if (possibleGroups.length === 1) {
    insights.push(
      `Found a definite group: ${possibleGroups[0].join(", ")}`
    );
  } else if (possibleGroups.length > 1 && possibleGroups.length <= 4) {
    insights.push(
      `Narrowed down to ${possibleGroups.length} possible groupings`
    );
  }

  // Find words that appear in ALL possible groups
  if (possibleGroups.length > 0) {
    const firstGroup = new Set(possibleGroups[0]);
    const definitelyTogether = [...firstGroup].filter((word) =>
      possibleGroups.every((group) => group.includes(word))
    );

    if (definitelyTogether.length >= 2) {
      insights.push(
        `These words are definitely together: ${definitelyTogether.join(", ")}`
      );
    }
  }

  return { deductions, possibleGroups, insights };
}
