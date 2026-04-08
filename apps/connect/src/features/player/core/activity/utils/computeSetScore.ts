export type ComputeSetScoreResult = {
  score: number;
  correctSelected: number;
  totalCorrect: number;
  incorrectSelected: number;
};

export function computeSetScore(params: {
  selected: string[];
  correct: string[];
  points: number;
}): ComputeSetScoreResult {
  const { selected, correct, points } = params;

  const correctSet = new Set(correct);
  const selectedSet = new Set(selected);

  let correctSelected = 0;
  let incorrectSelected = 0;

  selectedSet.forEach((value) => {
    if (correctSet.has(value)) {
      correctSelected += 1;
    } else {
      incorrectSelected += 1;
    }
  });

  const totalCorrect = correctSet.size;

  const ratio =
    totalCorrect > 0
      ? (correctSelected - incorrectSelected) / totalCorrect
      : 0;

  const clampedRatio = Math.max(0, Math.min(1, ratio));

  return {
    score: Math.round(clampedRatio * points),
    correctSelected,
    totalCorrect,
    incorrectSelected,
  };
}