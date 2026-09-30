import { ClassificationSignal, ClassificationResult, FieldType } from '../shared/types';
import { FIELD_TYPE_PATTERNS, CONFIDENCE_THRESHOLDS } from '../shared/constants';
import { calculateConfidence, normalizeFieldType } from '../utils/confidence';

export interface Classifier {
  classify(signals: ClassificationSignal[]): ClassificationResult;
}

export class RuleBasedClassifier implements Classifier {
  classify(signals: ClassificationSignal[]): ClassificationResult {
    const typeScores: Record<FieldType, number> = {
      FIRST_NAME: 0, LAST_NAME: 0, FULL_NAME: 0, EMAIL: 0, PHONE: 0,
      LINKEDIN: 0, GITHUB: 0, PORTFOLIO: 0, WEBSITE: 0,
      CITY: 0, STATE: 0, COUNTRY: 0, ZIP_CODE: 0, UNKNOWN: 0,
    };

    const typeSignals: Record<FieldType, ClassificationSignal[]> = {
      FIRST_NAME: [], LAST_NAME: [], FULL_NAME: [], EMAIL: [], PHONE: [],
      LINKEDIN: [], GITHUB: [], PORTFOLIO: [], WEBSITE: [],
      CITY: [], STATE: [], COUNTRY: [], ZIP_CODE: [], UNKNOWN: [],
    };

    for (const signal of signals) {
      const matches = this.matchSignalToTypes(signal);
      for (const { type, weight } of matches) {
        typeScores[type] += signal.weight * weight;
        typeSignals[type].push(signal);
      }
    }

    let bestType: FieldType = 'UNKNOWN';
    let bestScore = 0;

    for (const [type, score] of Object.entries(typeScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = type as FieldType;
      }
    }

    const confidence = Math.min(bestScore / 2.5, 1.0);
    
    return {
      fieldType: bestType,
      confidence,
      signals: typeSignals[bestType],
    };
  }

  private matchSignalToTypes(signal: ClassificationSignal): { type: FieldType; weight: number }[] {
    const matches: { type: FieldType; weight: number }[] = [];
    const value = signal.value.toLowerCase();
    const source = signal.source;

    for (const [fieldType, patterns] of Object.entries(FIELD_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (this.sourceMatches(pattern.type, source)) {
          const regex = new RegExp(pattern.pattern, 'i');
          if (regex.test(value)) {
            matches.push({ type: normalizeFieldType(fieldType), weight: pattern.weight });
          }
        }
      }
    }

    return matches;
  }

  private sourceMatches(patternSource: string, signalSource: string): boolean {
    if (patternSource === 'tag' && signalSource === 'type') return true;
    return patternSource === signalSource;
  }
}

export const classifier = new RuleBasedClassifier();