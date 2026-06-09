export type ModerationStep = 'image' | 'text';

export type ModerationResult = {
  step: ModerationStep;
  isApproved: boolean;
  reason: string;
  requiresManualReview: boolean;
};

const isModerationStep = (value: unknown): value is ModerationStep =>
  value === 'image' || value === 'text';

const extractJsonPayload = (value: string) => {
  const trimmedValue = value.trim();
  const fencedJson = trimmedValue.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  const jsonObject = trimmedValue.match(/\{[\s\S]*\}/);
  return jsonObject?.[0] ?? trimmedValue;
};

const parseObject = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(extractJsonPayload(value)) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const createModerationResult = (
  step: ModerationStep,
  isApproved: boolean,
  reason: string,
  requiresManualReview = false
): ModerationResult => ({
  step,
  isApproved,
  reason,
  requiresManualReview
});

export const createManualReviewResult = (
  step: ModerationStep,
  reason: string
) => createModerationResult(step, false, reason, true);

export const parseAiModerationAnswer = (
  answer: unknown,
  step: ModerationStep
): ModerationResult => {
  const parsedAnswer = parseObject(answer);

  if (typeof parsedAnswer?.isApproved !== 'boolean') {
    return createManualReviewResult(
      step,
      'AI moderation returned an invalid response'
    );
  }

  return createModerationResult(
    step,
    parsedAnswer.isApproved,
    typeof parsedAnswer.reason === 'string'
      ? parsedAnswer.reason
      : parsedAnswer.isApproved
        ? 'Approved'
        : 'Rejected'
  );
};

export const normalizeModerationResult = (
  value: unknown,
  fallbackStep: ModerationStep
): ModerationResult => {
  const parsedValue = parseObject(value);

  if (!parsedValue) {
    return createManualReviewResult(
      fallbackStep,
      'Moderation worker returned an invalid result'
    );
  }

  const step = isModerationStep(parsedValue.step)
    ? parsedValue.step
    : fallbackStep;

  if (typeof parsedValue.isApproved !== 'boolean') {
    return createManualReviewResult(
      step,
      'Moderation worker result is missing approval status'
    );
  }

  return createModerationResult(
    step,
    parsedValue.isApproved,
    typeof parsedValue.reason === 'string'
      ? parsedValue.reason
      : parsedValue.isApproved
        ? 'Approved'
        : 'Rejected',
    parsedValue.requiresManualReview === true
  );
};

export const stringifyModerationResult = (result: ModerationResult) =>
  JSON.stringify(result);
