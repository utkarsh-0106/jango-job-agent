import { AutofillEngine, AutofillOptions, AutofillResult, FILL_STRATEGIES } from './types';
import { DetectedField, Profile } from '../shared/types';
import { getFieldValueForType, shouldAutofill, CONFIDENCE_THRESHOLDS } from '../utils/confidence';

function isReadOnly(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    return (el as HTMLInputElement | HTMLTextAreaElement).readOnly;
  }
  return false;
}

export class DefaultAutofillEngine implements AutofillEngine {
  autofill(options: AutofillOptions): AutofillResult {
    const { profile, fields, minConfidence = CONFIDENCE_THRESHOLDS.MEDIUM } = options;
    
    let filled = 0;
    let skipped = 0;
    const errors: AutofillResult['errors'] = [];

    for (const field of fields) {
      if (!shouldAutofill(field.classification.confidence, minConfidence)) {
        skipped++;
        continue;
      }

      const value = getFieldValueForType(profile as unknown as Record<string, unknown>, field.classification.fieldType);
      
      if (!value) {
        skipped++;
        continue;
      }

      // Skip disabled or readonly elements
      const el = field.element;
      if (el.disabled || isReadOnly(el)) {
        skipped++;
        errors.push({
          fieldType: field.classification.fieldType,
          selector: field.selector,
          error: 'Element is disabled or readonly',
        });
        continue;
      }

      try {
        const success = this.fillField(field, value);
        if (success) {
          filled++;
        } else {
          skipped++;
          errors.push({
              fieldType: field.classification.fieldType,
              selector: field.selector,
              error: 'No suitable fill strategy',
            });
        }
      } catch (error) {
        skipped++;
        errors.push({
          fieldType: field.classification.fieldType,
          selector: field.selector,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { filled, skipped, errors };
  }

  private fillField(field: DetectedField, value: string): boolean {
    for (const strategy of FILL_STRATEGIES) {
      if (strategy.canFill(field, value)) {
        return strategy.fill(field, value);
      }
    }
    return false;
  }
}

export const autofillEngine = new DefaultAutofillEngine();