import { FieldDetector, FieldDetectorOptions } from './types';
import { DetectedField, ClassificationResult, FieldType, ClassificationSignal } from '../shared/types';
import { classifier } from './classifier';
import { extractSignals, createSelector } from './types';

const DEFAULT_OPTIONS: Required<FieldDetectorOptions> = {
  includeHidden: false,
  includeDisabled: false,
  minConfidence: 0.3,
};

function isReadOnly(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return (element as HTMLInputElement | HTMLTextAreaElement).readOnly;
  }
  return false;
}

export class DOMFieldDetector implements FieldDetector {
  private options: Required<FieldDetectorOptions>;

  constructor(options: FieldDetectorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  detect(document: Document): DetectedField[] {
    const elements = this.getFormElements(document);
    const fields: DetectedField[] = [];

    for (const element of elements) {
      if (!this.shouldProcessElement(element)) continue;

      const signals = extractSignals(element);
      const classification = classifier.classify(signals);
      
      if (classification.confidence >= this.options.minConfidence) {
        fields.push({
          element,
          classification,
          selector: createSelector(element),
        });
      }
    }

    return fields;
  }

  private getFormElements(doc: Document): (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] {
    const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]), textarea, select';
    return Array.from(doc.querySelectorAll(selector));
  }

  private shouldProcessElement(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    if (!this.options.includeHidden && this.isHidden(element)) return false;
    if (!this.options.includeDisabled && element.disabled) return false;
    if (isReadOnly(element)) return false;
    return true;
  }

  private isHidden(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }
}

export function createFieldDetector(options?: FieldDetectorOptions): FieldDetector {
  return new DOMFieldDetector(options);
}