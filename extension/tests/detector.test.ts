import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DOMFieldDetector } from '../src/field-detector/detector';
import { DetectedField } from '../src/shared/types';

describe('DOMFieldDetector', () => {
  let detector: DOMFieldDetector;
  let container: HTMLDivElement;

  beforeEach(() => {
    detector = new DOMFieldDetector({ minConfidence: 0.3 });
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function createInput(attrs: Record<string, string> = {}): HTMLInputElement {
    const input = document.createElement('input');
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'type') input.type = value;
      else input.setAttribute(key, value);
    });
    container.appendChild(input);
    return input;
  }

  function createSelect(attrs: Record<string, string> = {}, options: string[] = []): HTMLSelectElement {
    const select = document.createElement('select');
    Object.entries(attrs).forEach(([key, value]) => select.setAttribute(key, value));
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    container.appendChild(select);
    return select;
  }

  it('detects email input', () => {
    createInput({ name: 'email', type: 'email', id: 'email', placeholder: 'Enter email' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(1);
    expect(fields[0].classification.fieldType).toBe('EMAIL');
  });

  it('detects first name and last name', () => {
    createInput({ name: 'firstName', id: 'firstName', autocomplete: 'given-name' });
    createInput({ name: 'lastName', id: 'lastName', autocomplete: 'family-name' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(2);
    const types = fields.map(f => f.classification.fieldType).sort();
    expect(types).toEqual(['FIRST_NAME', 'LAST_NAME']);
  });

  it('detects phone with tel type', () => {
    createInput({ name: 'phone', type: 'tel', autocomplete: 'tel' });
    const fields = detector.detect(document);
    expect(fields[0].classification.fieldType).toBe('PHONE');
  });

  it('detects select for country', () => {
    createSelect({ name: 'country', autocomplete: 'country' }, ['USA', 'Canada', 'UK']);
    const fields = detector.detect(document);
    expect(fields.length).toBe(1);
    expect(fields[0].classification.fieldType).toBe('COUNTRY');
  });

  it('skips hidden fields by default', () => {
    createInput({ name: 'email', type: 'email', style: 'display: none' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(0);
  });

  it('includes hidden fields when option set', () => {
    const detectorWithHidden = new DOMFieldDetector({ includeHidden: true, minConfidence: 0.3 });
    createInput({ name: 'email', type: 'email', style: 'display: none' });
    const fields = detectorWithHidden.detect(document);
    expect(fields.length).toBe(1);
  });

  it('skips disabled fields by default', () => {
    createInput({ name: 'email', type: 'email', disabled: 'true' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(0);
  });

  it('skips readonly fields', () => {
    createInput({ name: 'email', type: 'email', readOnly: 'true' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(0);
  });

  it('skips submit, button, hidden, checkbox, radio, file inputs', () => {
    createInput({ name: 'submit', type: 'submit' });
    createInput({ name: 'button', type: 'button' });
    createInput({ name: 'hidden', type: 'hidden' });
    createInput({ name: 'checkbox', type: 'checkbox' });
    createInput({ name: 'radio', type: 'radio' });
    createInput({ name: 'file', type: 'file' });
    createInput({ name: 'image', type: 'image' });
    const fields = detector.detect(document);
    expect(fields.length).toBe(0);
  });

  it('detects textarea with identifiable attributes', () => {
    const textarea = document.createElement('textarea');
    textarea.name = 'coverLetter';
    textarea.placeholder = 'Cover letter';
    textarea.autocomplete = 'off';
    container.appendChild(textarea);
    
    // Use lower confidence to detect textarea (will be UNKNOWN type)
    const detectorLow = new DOMFieldDetector({ minConfidence: 0.0 });
    const fields = detectorLow.detect(document);
    expect(fields.length).toBe(1);
    expect(fields[0].element.tagName).toBe('TEXTAREA');
  });

  it('generates selector for detected fields', () => {
    const input = createInput({ name: 'email', id: 'user-email', type: 'email' });
    const fields = detector.detect(document);
    expect(fields[0].selector).toContain('#user-email');
  });

  it('returns empty array for no form elements', () => {
    const fields = detector.detect(document);
    expect(fields.length).toBe(0);
  });
});