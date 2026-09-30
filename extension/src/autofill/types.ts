import { DetectedField, Profile } from '../shared/types';
import { AutofillOptions, AutofillResult } from '../shared/types';

export interface AutofillEngine {
  autofill(options: AutofillOptions): AutofillResult;
}

export interface FillStrategy {
  canFill(field: DetectedField, value: string): boolean;
  fill(field: DetectedField, value: string): boolean;
}

export const FILL_STRATEGIES: FillStrategy[] = [
  {
    canFill: (field) => field.element.tagName === 'INPUT' && field.element.type !== 'file',
    fill: (field, value) => {
      const input = field.element as HTMLInputElement;
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.blur();
      return true;
    },
  },
  {
    canFill: (field) => field.element.tagName === 'TEXTAREA',
    fill: (field, value) => {
      const textarea = field.element as HTMLTextAreaElement;
      textarea.focus();
      textarea.value = value;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
      textarea.blur();
      return true;
    },
  },
  {
    canFill: (field) => field.element.tagName === 'SELECT',
    fill: (field, value) => {
      const select = field.element as HTMLSelectElement;
      const option = Array.from(select.options).find(
        opt => opt.value.toLowerCase() === value.toLowerCase() ||
               opt.text.toLowerCase().includes(value.toLowerCase())
      );
      if (option) {
        select.focus();
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.blur();
        return true;
      }
      return false;
    },
  },
];

export type { AutofillOptions, AutofillResult } from '../shared/types';