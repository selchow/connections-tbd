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

export interface Deduction {
  type: "must_be_together" | "cannot_be_together" | "exactly_three";
  words: string[];
  reason: string;
}

/**
 * Given a one-away guess, generate the 4 possible "true triplets" of 3.
 * One of these groups of 3 is definitely correct.
 */
export function getPossibleTriplets(
  guess: OneAwayGuess,
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
 * Check if two triplets could be from the same group of 4.
 * They must share at least 2 words and their union must be <= 4 words.
 */
function tripletsFromSameGroup(
  t1: string[],
  t2: string[],
): { compatible: boolean; union: string[] } {
  const set1 = new Set(t1);
  const union = [...new Set([...t1, ...t2])];
  const overlap = t2.filter((w) => set1.has(w)).length;

  // Two triplets from the same group must share at least 2 elements
  // and their union can't exceed 4
  return {
    compatible: overlap >= 2 && union.length <= 4,
    union,
  };
}

/**
 * Analyze guesses and produce human-readable insights.
 *
 * The key insight: each one-away guess tells us "exactly 3 of these 4 are together".
 * When we have multiple guesses, we look for:
 * 1. Overlapping guesses that might be about the same group
 * 2. Words that appear in all valid scenarios
 */
export function analyzeGuesses(
  allWords: string[],
  guesses: OneAwayGuess[],
): {
  deductions: Deduction[];
  possibleGroups: string[][];
  insights: string[];
} {
  const deductions: Deduction[] = [];
  const insights: string[] = [];
  let possibleGroups: string[][] = [];

  if (guesses.length === 0) {
    insights.push("Log a one-away guess to start deducing!");
    return { deductions, possibleGroups, insights };
  }

  // For each guess, add the basic deduction
  for (const guess of guesses) {
    deductions.push({
      type: "exactly_three",
      words: [...guess.words],
      reason: `Exactly 3 of these 4 words are in the same group`,
    });
  }

  if (guesses.length === 1) {
    // With one guess, we have 4 possible triplets
    possibleGroups = getPossibleTriplets(guesses[0]);
    insights.push(
      `One of these 4 words doesn't belong with the other 3: ${guesses[0].words.join(", ")}`,
    );
    insights.push(`4 possible groupings for this category`);
    return { deductions, possibleGroups, insights };
  }

  // With multiple guesses, we need to figure out which might be about the same group
  // and find compatible triplet combinations

  // For now, let's handle the case of 2 guesses
  if (guesses.length === 2) {
    const triplets1 = getPossibleTriplets(guesses[0]);
    const triplets2 = getPossibleTriplets(guesses[1]);

    const commonWords = guesses[0].words.filter((w) =>
      guesses[1].words.includes(w),
    );

    if (commonWords.length === 0) {
      // No overlap - these are definitely about different groups
      insights.push(
        `These two guesses have no words in common - they're about different categories`,
      );
      // Each guess still has 4 possible triplets independently
      possibleGroups = triplets1;
      insights.push(`First guess still has 4 possible groupings`);
    } else if (commonWords.length >= 1) {
      // Some overlap - might be same group or different groups

      // Find all compatible pairs (triplets that could be from same group)
      const compatiblePairs: string[][] = [];

      for (const t1 of triplets1) {
        for (const t2 of triplets2) {
          const { compatible, union } = tripletsFromSameGroup(t1, t2);
          if (compatible) {
            // Check if we already have this union
            const key = [...union].sort().join(",");
            if (!compatiblePairs.some((p) => [...p].sort().join(",") === key)) {
              compatiblePairs.push(union);
            }
          }
        }
      }

      if (compatiblePairs.length > 0) {
        possibleGroups = compatiblePairs;
        insights.push(
          `${commonWords.length} word${commonWords.length > 1 ? "s" : ""} in common: ${commonWords.join(", ")}`,
        );

        if (compatiblePairs.length === 1) {
          insights.push(`Found the group: ${compatiblePairs[0].join(", ")}`);
        } else {
          insights.push(
            `Narrowed down to ${compatiblePairs.length} possible groupings`,
          );
        }

        // Find words that appear in ALL possible groups
        if (compatiblePairs.length > 1) {
          const definitelyTogether = compatiblePairs[0].filter((word) =>
            compatiblePairs.every((group) => group.includes(word)),
          );
          if (definitelyTogether.length >= 2) {
            deductions.push({
              type: "must_be_together",
              words: definitelyTogether,
              reason: "These words appear in all possible groupings",
            });
            insights.push(
              `Definitely together: ${definitelyTogether.join(", ")}`,
            );
          }
        }
      } else {
        // No compatible pairs - guesses must be about different groups
        insights.push(
          `Despite ${commonWords.length} common word${commonWords.length > 1 ? "s" : ""}, these guesses seem to be about different categories`,
        );
        possibleGroups = triplets1;
      }
    }
  }

  // Handle 3+ guesses - simplified for now
  if (guesses.length >= 3) {
    insights.push(
      `${guesses.length} one-away guesses logged. Complex analysis coming soon!`,
    );

    // For now just show the triplets from the first guess
    possibleGroups = getPossibleTriplets(guesses[0]);
  }

  return { deductions, possibleGroups, insights };
}
