import { 
  ChromeMessage, 
  GetProfileMessage, 
  SetProfileMessage, 
  DetectFieldsMessage, 
  AutofillMessage,
  FieldsDetectedMessage,
  AutofillCompleteMessage,
  Profile,
  DetectedField,
  ClassificationSignal,
  ClassificationResult,
  FieldType,
  AutofillResult
} from '../shared/types';
import { createProfileStore } from '../profile';
import { createFieldDetector } from '../field-detector';
import { autofillEngine } from '../autofill';

type MessageHandler = (message: ChromeMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => void | Promise<void>;

async function resolveTargetTabId(sender: chrome.runtime.MessageSender): Promise<number | null> {
  if (sender.tab?.id) {
    return sender.tab.id;
  }
  
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Self-contained page-context field detection function.
 * This function is injected into the target page via chrome.scripting.executeScript.
 * It must NOT depend on any external imports or extension modules.
 * All detection logic is inlined here.
 */
function detectFieldsInPage(): {
  selector: string;
  classification: ClassificationResult;
}[] {
  // --- Inlined FIELD_TYPE_PATTERNS (from shared/constants.ts) ---
  const FIELD_TYPE_PATTERNS = {
    FIRST_NAME: [
      { type: 'autocomplete', pattern: 'given-name', weight: 1.0 },
      { type: 'name', pattern: 'first.?name|fname|given.?name', weight: 0.9 },
      { type: 'id', pattern: 'first.?name|fname|given.?name', weight: 0.8 },
      { type: 'label', pattern: 'first.?name|given.?name', weight: 0.8 },
      { type: 'placeholder', pattern: 'first.?name|given.?name', weight: 0.7 },
    ],
    LAST_NAME: [
      { type: 'autocomplete', pattern: 'family-name', weight: 1.0 },
      { type: 'name', pattern: 'last.?name|lname|surname|family.?name', weight: 0.9 },
      { type: 'id', pattern: 'last.?name|lname|surname|family.?name', weight: 0.8 },
      { type: 'label', pattern: 'last.?name|surname|family.?name', weight: 0.8 },
      { type: 'placeholder', pattern: 'last.?name|surname', weight: 0.7 },
    ],
    FULL_NAME: [
      { type: 'autocomplete', pattern: 'name', weight: 0.9 },
      { type: 'name', pattern: '^name$|full.?name', weight: 0.8 },
      { type: 'id', pattern: '^name$|full.?name', weight: 0.7 },
      { type: 'label', pattern: 'full.?name|name', weight: 0.7 },
    ],
    EMAIL: [
      { type: 'type', pattern: 'email', weight: 1.0 },
      { type: 'autocomplete', pattern: 'email', weight: 1.0 },
      { type: 'name', pattern: 'email|e.?mail', weight: 0.9 },
      { type: 'id', pattern: 'email|e.?mail', weight: 0.8 },
      { type: 'label', pattern: 'email|e.?mail', weight: 0.8 },
      { type: 'placeholder', pattern: 'email|e.?mail|.*@.*', weight: 0.7 },
    ],
    PHONE: [
      { type: 'type', pattern: 'tel', weight: 1.0 },
      { type: 'autocomplete', pattern: 'tel', weight: 1.0 },
      { type: 'name', pattern: 'phone|tel|mobile|cell', weight: 0.9 },
      { type: 'id', pattern: 'phone|tel|mobile|cell', weight: 0.8 },
      { type: 'label', pattern: 'phone|telephone|mobile|cell', weight: 0.8 },
      { type: 'placeholder', pattern: 'phone|telephone|mobile|cell|\\d{3}[-.]?\\d{3}[-.]?\\d{4}', weight: 0.7 },
    ],
    LINKEDIN: [
      { type: 'name', pattern: 'linkedin', weight: 0.9 },
      { type: 'id', pattern: 'linkedin', weight: 0.8 },
      { type: 'label', pattern: 'linkedin', weight: 0.8 },
      { type: 'placeholder', pattern: 'linkedin|linked.in', weight: 0.7 },
    ],
    GITHUB: [
      { type: 'name', pattern: 'github', weight: 0.9 },
      { type: 'id', pattern: 'github', weight: 0.8 },
      { type: 'label', pattern: 'github', weight: 0.8 },
      { type: 'placeholder', pattern: 'github', weight: 0.7 },
    ],
    PORTFOLIO: [
      { type: 'name', pattern: 'portfolio', weight: 0.9 },
      { type: 'id', pattern: 'portfolio', weight: 0.8 },
      { type: 'label', pattern: 'portfolio', weight: 0.8 },
      { type: 'placeholder', pattern: 'portfolio', weight: 0.7 },
    ],
    WEBSITE: [
      { type: 'type', pattern: 'url', weight: 0.9 },
      { type: 'autocomplete', pattern: 'url', weight: 0.9 },
      { type: 'name', pattern: 'website|url|homepage|site', weight: 0.8 },
      { type: 'id', pattern: 'website|url|homepage|site', weight: 0.7 },
      { type: 'label', pattern: 'website|url|homepage|site', weight: 0.7 },
      { type: 'placeholder', pattern: 'website|url|homepage|https?://', weight: 0.6 },
    ],
    CITY: [
      { type: 'autocomplete', pattern: 'address-level2', weight: 1.0 },
      { type: 'name', pattern: 'city|town', weight: 0.9 },
      { type: 'id', pattern: 'city|town', weight: 0.8 },
      { type: 'label', pattern: 'city|town', weight: 0.8 },
    ],
    STATE: [
      { type: 'autocomplete', pattern: 'address-level1', weight: 1.0 },
      { type: 'name', pattern: 'state|province|region', weight: 0.9 },
      { type: 'id', pattern: 'state|province|region', weight: 0.8 },
      { type: 'label', pattern: 'state|province|region', weight: 0.8 },
    ],
    COUNTRY: [
      { type: 'autocomplete', pattern: 'country', weight: 1.0 },
      { type: 'name', pattern: 'country', weight: 0.9 },
      { type: 'id', pattern: 'country', weight: 0.8 },
      { type: 'label', pattern: 'country', weight: 0.8 },
      { type: 'tag', pattern: 'select', weight: 0.5 },
    ],
    ZIP_CODE: [
      { type: 'autocomplete', pattern: 'postal-code', weight: 1.0 },
      { type: 'name', pattern: 'zip|postal|postcode', weight: 0.9 },
      { type: 'id', pattern: 'zip|postal|postcode', weight: 0.8 },
      { type: 'label', pattern: 'zip|postal code|postcode', weight: 0.8 },
      { type: 'placeholder', pattern: 'zip|postal|postcode|\\d{5}(-\\d{4})?', weight: 0.7 },
    ],
    UNKNOWN: [],
  } as const;

  const CONFIDENCE_THRESHOLDS = { HIGH: 0.8, MEDIUM: 0.5, LOW: 0.3 };
  const MAX_CONFIDENCE = 1.0;
  const MIN_CONFIDENCE = 0.0;
  const DETECTION_MIN_CONFIDENCE = 0.3;

  // --- Helper functions (inlined from field-detector/types.ts and utils/confidence.ts) ---
  
  function escapeCSS(str: string): string {
    return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
  }

  function createSelector(element: Element): string {
    if (element.id) {
      return '#' + escapeCSS(element.id);
    }
    
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.trim().split(/\s+/).filter(Boolean);
        if (classes.length > 0) {
          selector += '.' + classes.map(c => escapeCSS(c)).join('.');
        }
      }
      
      const parentElement: Element | null = current.parentElement;
      if (parentElement) {
        const siblings = Array.from(parentElement.querySelectorAll(':scope > ' + current.tagName)) as Element[];
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      
      parts.unshift(selector);
      current = parentElement;
    }
    
    return parts.join(' > ');
  }

  function getElementRect(element: Element): DOMRect | null {
    try {
      return element.getBoundingClientRect();
    } catch {
      return null;
    }
  }

  function getSurroundingText(element: Element, radius: number = 50): string {
    const texts: string[] = [];
    const elRect = getElementRect(element);
    
    if (!elRect) return '';
    
    const walker = document.createTreeWalker(
      element.parentElement || document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const range = document.createRange();
      range.selectNode(node);
      const rect = getElementRect(range.startContainer.parentElement || element);
      
      if (!rect) continue;
      
      const distance = Math.min(
        Math.abs(rect.left - elRect.left),
        Math.abs(rect.right - elRect.right),
        Math.abs(rect.top - elRect.top),
        Math.abs(rect.bottom - elRect.bottom)
      );
      
      if (distance < radius && node.textContent?.trim()) {
        texts.push(node.textContent.trim());
      }
    }
    
    return texts.join(' ').slice(0, 200);
  }

  function isInputOrTextArea(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): element is HTMLInputElement | HTMLTextAreaElement {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA';
  }

  function findLabel(element: HTMLElement): string | null {
    const htmlElement = element as HTMLInputElement & { labels?: NodeListOf<HTMLLabelElement> };
    if (htmlElement.labels && htmlElement.labels.length > 0) {
      return htmlElement.labels[0].textContent?.trim() || null;
    }
    
    const id = element.id;
    if (id) {
      const label = document.querySelector('label[for="' + escapeCSS(id) + '"]');
      if (label) return label.textContent?.trim() || null;
    }
    
    let parent: HTMLElement | null = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName === 'LABEL') {
        return parent.textContent?.trim() || null;
      }
      parent = parent.parentElement;
    }
    
    return null;
  }

  function extractSignals(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): ClassificationSignal[] {
    const signals: ClassificationSignal[] = [];
    
    const addSignal = (source: ClassificationSignal['source'], value: string, weight: number) => {
      if (value) signals.push({ source, value, weight });
    };
    
    addSignal('name', element.name || '', 1.0);
    addSignal('id', element.id || '', 1.0);
    addSignal('type', element.type || '', 1.0);
    
    if (isInputOrTextArea(element)) {
      addSignal('placeholder', element.placeholder || '', 0.8);
    }
    
    addSignal('aria-label', element.getAttribute('aria-label') || '', 0.9);
    addSignal('autocomplete', element.getAttribute('autocomplete') || '', 1.0);
    
    const label = findLabel(element);
    if (label) addSignal('label', label, 0.9);
    
    const surrounding = getSurroundingText(element);
    if (surrounding) addSignal('surrounding-text', surrounding, 0.4);
    
    return signals;
  }

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

  function calculateConfidence(signals: ClassificationSignal[]): number {
    const scores = signals.map(calculateSignalScore);
    return combineScores(scores);
  }

  function normalizeFieldType(type: string): FieldType {
    const upper = type.toUpperCase() as FieldType;
    const validTypes: FieldType[] = [
      'FIRST_NAME', 'LAST_NAME', 'FULL_NAME', 'EMAIL', 'PHONE',
      'LINKEDIN', 'GITHUB', 'PORTFOLIO', 'WEBSITE',
      'CITY', 'STATE', 'COUNTRY', 'ZIP_CODE', 'UNKNOWN'
    ];
    return validTypes.includes(upper) ? upper : 'UNKNOWN';
  }

  function matchSignalToTypes(signal: ClassificationSignal): { type: FieldType; weight: number }[] {
    const matches: { type: FieldType; weight: number }[] = [];
    const value = signal.value.toLowerCase();
    const source = signal.source;

    for (const [fieldType, patterns] of Object.entries(FIELD_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (sourceMatches(pattern.type, source)) {
          const regex = new RegExp(pattern.pattern, 'i');
          if (regex.test(value)) {
            matches.push({ type: normalizeFieldType(fieldType), weight: pattern.weight });
          }
        }
      }
    }

    return matches;
  }

  function sourceMatches(patternSource: string, signalSource: string): boolean {
    if (patternSource === 'tag' && signalSource === 'type') return true;
    return patternSource === signalSource;
  }

  function classify(signals: ClassificationSignal[]): ClassificationResult {
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
      const matches = matchSignalToTypes(signal);
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

  // --- Main detection logic ---

  function isHidden(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }

  function isReadOnly(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      return (element as HTMLInputElement | HTMLTextAreaElement).readOnly;
    }
    return false;
  }

  // Get form elements (same selector as detector.ts)
  const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="image"]), textarea, select';
  const elements = Array.from(document.querySelectorAll(selector)) as (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[];

  const results: { selector: string; classification: ClassificationResult }[] = [];

  for (const element of elements) {
    // Skip hidden/disabled/readonly
    if (isHidden(element)) continue;
    if (element.disabled) continue;
    if (isReadOnly(element)) continue;

    const signals = extractSignals(element);
    const classification = classify(signals);
    
    if (classification.confidence >= DETECTION_MIN_CONFIDENCE) {
      results.push({
        selector: createSelector(element),
        classification,
      });
    }
  }

  return results;
}

const handlers: Record<string, MessageHandler> = {
  GET_PROFILE: async (_message, _sender, sendResponse) => {
    try {
      const store = createProfileStore();
      const profile = await store.get();
      sendResponse({ success: true, profile });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  },

  SET_PROFILE: async (message, _sender, sendResponse) => {
    try {
      const { payload } = message as SetProfileMessage;
      const store = createProfileStore();
      await store.set(payload as Profile);
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  },

  DETECT_FIELDS: async (_message, sender, sendResponse) => {
    try {
      const tabId = await resolveTargetTabId(sender);
      
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }
      
      chrome.scripting.executeScript({
        target: { tabId },
        func: detectFieldsInPage,
      }, (results) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        const fields = results?.[0]?.result || [];
        sendResponse({ success: true, fields });
      });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  },

  AUTOFILL: async (message, sender, sendResponse) => {
    try {
      const { payload } = message as AutofillMessage;
      const { minConfidence } = payload || {};
      
      const store = createProfileStore();
      const profile = await store.get();
      
      if (!profile) {
        sendResponse({ success: false, error: 'No profile found' });
        return;
      }

      const tabId = await resolveTargetTabId(sender);
      
      if (!tabId) {
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: autofillInPage,
        args: [profile, minConfidence],
      });

      const autofillResult = result?.[0]?.result as AutofillResult;
      sendResponse({ success: true, result: autofillResult });
    } catch (error) {
      sendResponse({ success: false, error: String(error) });
    }
  },
};

function autofillInPage(profile: Profile, minConfidence: number = 0.5): AutofillResult {
  type SafeFieldType =
    | 'FIRST_NAME'
    | 'LAST_NAME'
    | 'FULL_NAME'
    | 'EMAIL'
    | 'PHONE'
    | 'CITY'
    | 'STATE'
    | 'COUNTRY'
    | 'ZIP_CODE'
    | 'LINKEDIN'
    | 'GITHUB'
    | 'PORTFOLIO'
    | 'WEBSITE'
    | 'UNKNOWN';

  const normalize = (value: string): string =>
    value.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  const classify = (
    element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  ): { fieldType: SafeFieldType; confidence: number } => {
    const label = element.id
      ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent ?? ''
      : element.closest('label')?.textContent ?? '';

    const text = [
      element.getAttribute('name') ?? '',
      element.id,
      element.getAttribute('placeholder') ?? '',
      element.getAttribute('aria-label') ?? '',
      element.getAttribute('autocomplete') ?? '',
      element.getAttribute('type') ?? '',
      label,
    ]
      .map(normalize)
      .filter(Boolean)
      .join(' ');

    const rules: Array<[SafeFieldType, RegExp, number]> = [
      ['EMAIL', /\b(email|e mail|email address)\b/, 0.98],
      ['PHONE', /\b(phone|mobile|telephone|tel|phone number)\b/, 0.96],
      ['LINKEDIN', /\blinkedin\b/, 0.98],
      ['GITHUB', /\bgithub\b/, 0.98],
      ['PORTFOLIO', /\b(portfolio|personal website)\b/, 0.95],
      ['WEBSITE', /\b(website|web site|personal site)\b/, 0.92],
      ['FIRST_NAME', /\b(first name|given name|forename)\b/, 0.96],
      ['LAST_NAME', /\b(last name|surname|family name)\b/, 0.96],
      ['FULL_NAME', /\b(full name|your name|candidate name)\b/, 0.94],
      ['ZIP_CODE', /\b(zip|zip code|postal code|postcode)\b/, 0.96],
      ['CITY', /\bcity\b/, 0.90],
      ['STATE', /\b(state|province|region)\b/, 0.88],
      ['COUNTRY', /\bcountry\b/, 0.90],
    ];

    for (const [fieldType, rule, confidence] of rules) {
      if (rule.test(text)) {
        return { fieldType, confidence };
      }
    }

    return { fieldType: 'UNKNOWN', confidence: 0 };
  };

  const getProfileValue = (fieldType: SafeFieldType): string | undefined => {
    const data = profile as unknown as Record<string, unknown>;
    const personal = (data.personal ?? {}) as Record<string, unknown>;
    const contact = (data.contact ?? {}) as Record<string, unknown>;
    const links = (data.links ?? {}) as Record<string, unknown>;

    const values: Partial<Record<SafeFieldType, unknown>> = {
      FIRST_NAME: personal.firstName,
      LAST_NAME: personal.lastName,
      FULL_NAME: personal.fullName,
      EMAIL: contact.email,
      PHONE: contact.phone,
      CITY: contact.city,
      STATE: contact.state,
      COUNTRY: contact.country,
      ZIP_CODE: contact.zip ?? contact.zipCode ?? contact.postalCode,
      LINKEDIN: links.linkedin,
      GITHUB: links.github,
      PORTFOLIO: links.portfolio ?? links.website,
      WEBSITE: links.website,
    };

    const value = values[fieldType];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  const elements = Array.from(
    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select'
    )
  );

  let filled = 0;
  let skipped = 0;
  const errors: AutofillResult['errors'] = [];

  for (const element of elements) {
    const inputType =
      element instanceof HTMLInputElement ? element.type.toLowerCase() : '';

    if (
      element.disabled ||
      ('readOnly' in element && element.readOnly) ||
      ['hidden', 'submit', 'button', 'reset', 'image', 'file', 'checkbox', 'radio'].includes(
        inputType
      )
    ) {
      skipped++;
      continue;
    }

    const classification = classify(element);

    if (
      classification.fieldType === 'UNKNOWN' ||
      classification.confidence < minConfidence
    ) {
      skipped++;
      errors.push({
        fieldType: classification.fieldType,
        selector: element.id || element.getAttribute('name') || element.tagName.toLowerCase(),
        error: `CLASSIFICATION_SKIP confidence=${classification.confidence}`,
      } as AutofillResult['errors'][number]);
      continue;
    }

    const value = getProfileValue(classification.fieldType);

    if (!value) {
      skipped++;
      errors.push({
        fieldType: classification.fieldType,
        selector: element.id || element.getAttribute('name') || element.tagName.toLowerCase(),
        error: 'PROFILE_VALUE_MISSING',
      } as AutofillResult['errors'][number]);
      continue;
    }

    const selector = element.id
      ? `#${CSS.escape(element.id)}`
      : element.getAttribute('name')
        ? `${element.tagName.toLowerCase()}[name="${CSS.escape(element.getAttribute('name')!)}"]`
        : element.tagName.toLowerCase();

    try {
      if (element instanceof HTMLSelectElement) {
        const normalizedValue = normalize(value);

        const option = Array.from(element.options).find(
          (candidate) =>
            normalize(candidate.value) === normalizedValue ||
            normalize(candidate.textContent ?? '') === normalizedValue
        );

        if (!option) {
          skipped++;
          continue;
        }

        element.value = option.value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      } else {
        const prototype =
          element instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;

        const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      }

      filled++;
    } catch (error) {
      skipped++;
      errors.push({
        fieldType: classification.fieldType,
        selector,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as AutofillResult['errors'][number]);
    }
  }

  return { filled, skipped, errors };
}

export function setupMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers[message.type];
    if (handler) {
      handler(message, sender, sendResponse);
      return true;
    }
    sendResponse({ success: false, error: 'Unknown message type' });
  });
}

export function sendMessage<T>(message: ChromeMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      if (response?.success === false) {
        reject(new Error(response.error as string));
        return;
      }
      resolve(response as T);
    });
  });
}

export { resolveTargetTabId };