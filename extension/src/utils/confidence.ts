import { ClassificationSignal, FieldType } from '../shared/types';
import { FIELD_TYPE_PATTERNS, CONFIDENCE_THRESHOLDS, MAX_CONFIDENCE, MIN_CONFIDENCE } from '../shared/constants';

function calculateSignalScore(signal: ClassificationSignal): number {
  return Math.min(signal.weight * 1.0, MAX_CONFIDENCE);
}

function combineScores(scores: number[]): number {
  if (scores.length === 0) return MIN_CONFIDENCE;
  const sorted = scores.sort((a, b) => b - a);
  const topScore = sorted[0];
  const bonus = sorted.slice(1).reduce((acc, s) => acc + s * 0.1, 0);
  return Math.min(topScore + bonus, MAX_CONFIDENCE);
}

export function calculateConfidence(signals: ClassificationSignal[]): number {
  const scores = signals.map(calculateSignalScore);
  return combineScores(scores);
}

export function getConfidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

export function shouldAutofill(confidence: number, minConfidence: number = CONFIDENCE_THRESHOLDS.MEDIUM): boolean {
  return confidence >= minConfidence;
}

export function normalizeFieldType(type: string): FieldType {
  const upper = type.toUpperCase() as FieldType;
  const validTypes: FieldType[] = [
    'FIRST_NAME', 'LAST_NAME', 'FULL_NAME', 'EMAIL', 'PHONE',
    'LINKEDIN', 'GITHUB', 'PORTFOLIO', 'WEBSITE',
    'CITY', 'STATE', 'COUNTRY', 'ZIP_CODE', 'UNKNOWN'
  ];
  return validTypes.includes(upper) ? upper : 'UNKNOWN';
}

export function getFieldValueForType(profile: Record<string, unknown>, fieldType: FieldType): string | undefined {
  const pathMap: Record<FieldType, string[]> = {
    FIRST_NAME: ['personal', 'firstName'],
    LAST_NAME: ['personal', 'lastName'],
    FULL_NAME: ['personal', 'fullName'],
    EMAIL: ['contact', 'email'],
    PHONE: ['contact', 'phone'],
    LINKEDIN: ['links', 'linkedin'],
    GITHUB: ['links', 'github'],
    PORTFOLIO: ['links', 'portfolio'],
    WEBSITE: ['links', 'website'],
    CITY: ['contact', 'city'],
    STATE: ['contact', 'state'],
    COUNTRY: ['contact', 'country'],
    ZIP_CODE: ['contact', 'zipCode'],
    UNKNOWN: [],
  };

  const path = pathMap[fieldType];
  if (!path || path.length === 0) return undefined;

  let current: unknown = profile;
  for (const key of path) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export { CONFIDENCE_THRESHOLDS } from '../shared/constants';