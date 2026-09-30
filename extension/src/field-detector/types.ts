import { DetectedField, ClassificationResult, ClassificationSignal, FieldType } from '../shared/types';

export interface FieldDetectorOptions {
  includeHidden?: boolean;
  includeDisabled?: boolean;
  minConfidence?: number;
}

export interface FieldDetector {
  detect(document: Document): DetectedField[];
}

export function createSelector(element: Element): string {
  if (element.id) {
    return `#${CSS.escape(element.id)}`;
  }
  
  const parts: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(Boolean);
      if (classes.length > 0) {
        selector += '.' + classes.map(c => CSS.escape(c)).join('.');
      }
    }
    
    const parentElement: Element | null = current.parentElement;
    if (parentElement) {
      const siblings = Array.from(parentElement.querySelectorAll(`:scope > ${current.tagName}`)) as Element[];
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
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

export function getSurroundingText(element: Element, radius: number = 50): string {
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

export function extractSignals(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
): ClassificationSignal[] {
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

function findLabel(element: HTMLElement): string | null {
  const htmlElement = element as HTMLInputElement & { labels?: NodeListOf<HTMLLabelElement> };
  if (htmlElement.labels && htmlElement.labels.length > 0) {
    return htmlElement.labels[0].textContent?.trim() || null;
  }
  
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
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