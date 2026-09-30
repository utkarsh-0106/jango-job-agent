import { createFieldDetector } from '../field-detector';
import { autofillEngine } from '../autofill';
import { Profile, DetectedField, AutofillResult } from '../shared/types';

console.log('Jango Job Agent content script loaded');

export function detectFieldsInPage(): DetectedField[] {
  const detector = createFieldDetector();
  return detector.detect(document);
}

export function autofillInPage(profile: Profile, minConfidence: number = 0.5): AutofillResult {
  const fields = detectFieldsInPage();
  return autofillEngine.autofill({ profile, fields, minConfidence });
}

if (typeof window !== 'undefined') {
  (window as unknown as { __jangoDetectFields: typeof detectFieldsInPage; __jangoAutofill: typeof autofillInPage }).__jangoDetectFields = detectFieldsInPage;
  (window as unknown as { __jangoDetectFields: typeof detectFieldsInPage; __jangoAutofill: typeof autofillInPage }).__jangoAutofill = autofillInPage;
}