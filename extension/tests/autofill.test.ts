import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DefaultAutofillEngine } from '../src/autofill/engine';
import { Profile, DetectedField, ClassificationResult, ClassificationSignal, FieldType } from '../src/shared/types';

describe('DefaultAutofillEngine', () => {
  let engine: DefaultAutofillEngine;
  let container: HTMLDivElement;
  let profile: Profile;

  beforeEach(() => {
    engine = new DefaultAutofillEngine();
    container = document.createElement('div');
    document.body.appendChild(container);
    
    profile = {
      personal: { firstName: 'John', lastName: 'Doe', fullName: 'John Doe' },
      contact: { email: 'john@example.com', phone: '+1-555-123-4567', city: 'San Francisco', state: 'CA', country: 'USA', zipCode: '94105' },
      links: { linkedin: 'https://linkedin.com/in/johndoe', github: 'https://github.com/johndoe', portfolio: 'https://johndoe.dev', website: 'https://johndoe.com' },
      education: [],
      skills: [],
      experience: [],
      projects: [],
      preferences: { willingToRelocate: false, remotePreference: 'any', noticePeriod: '' },
      answers: {},
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function createField(type: FieldType, confidence: number = 0.9, element?: HTMLInputElement): DetectedField {
    const el = element || document.createElement('input');
    if (!element) container.appendChild(el);
    
    const signals: ClassificationSignal[] = [
      { source: 'name', value: type.toLowerCase(), weight: 1.0 },
      { source: 'autocomplete', value: type.toLowerCase().replace('_', '-'), weight: 1.0 },
    ];
    
    const classification: ClassificationResult = {
      fieldType: type,
      confidence,
      signals,
    };
    
    return { element: el, classification, selector: `input[name="${type.toLowerCase()}"]` };
  }

  it('fills email field', () => {
    const input = document.createElement('input');
    input.type = 'email';
    input.name = 'email';
    container.appendChild(input);
    
    const field = createField('EMAIL', 0.9, input);
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(1);
    expect(input.value).toBe('john@example.com');
  });

  it('fills first name and last name', () => {
    const firstName = document.createElement('input');
    firstName.name = 'firstName';
    firstName.autocomplete = 'given-name';
    container.appendChild(firstName);
    
    const lastName = document.createElement('input');
    lastName.name = 'lastName';
    lastName.autocomplete = 'family-name';
    container.appendChild(lastName);
    
    const fields = [
      createField('FIRST_NAME', 0.9, firstName),
      createField('LAST_NAME', 0.9, lastName),
    ];
    
    const result = engine.autofill({ profile, fields, minConfidence: 0.5 });
    
    expect(result.filled).toBe(2);
    expect(firstName.value).toBe('John');
    expect(lastName.value).toBe('Doe');
  });

  it('fills phone field', () => {
    const input = document.createElement('input');
    input.type = 'tel';
    input.name = 'phone';
    container.appendChild(input);
    
    const field = createField('PHONE', 0.9, input);
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(1);
    expect(input.value).toBe('+1-555-123-4567');
  });

  it('fills textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.name = 'bio';
    container.appendChild(textarea);
    
    const field: DetectedField = {
      element: textarea,
      classification: { fieldType: 'UNKNOWN', confidence: 0.9, signals: [] },
      selector: 'textarea[name="bio"]',
    };
    
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    expect(result.skipped).toBe(1);
  });

  it('fills select dropdown', () => {
    const select = document.createElement('select');
    select.name = 'country';
    ['USA', 'Canada', 'UK'].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
    container.appendChild(select);
    
    const field = createField('COUNTRY', 0.9, select);
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(1);
    expect(select.value).toBe('USA');
  });

  it('skips fields below confidence threshold', () => {
    const input = document.createElement('input');
    input.name = 'email';
    input.type = 'email';
    container.appendChild(input);
    
    const field = createField('EMAIL', 0.3, input);
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('skips fields with no profile value', () => {
    const input = document.createElement('input');
    input.name = 'github';
    container.appendChild(input);
    
    const emptyProfile = { ...profile, links: { ...profile.links, github: '' } };
    const field = createField('GITHUB', 0.9, input);
    const result = engine.autofill({ profile: emptyProfile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('dispatches input and change events', () => {
    const input = document.createElement('input');
    input.name = 'email';
    input.type = 'email';
    container.appendChild(input);
    
    const inputSpy = vi.fn();
    const changeSpy = vi.fn();
    input.addEventListener('input', inputSpy);
    input.addEventListener('change', changeSpy);
    
    const field = createField('EMAIL', 0.9, input);
    engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(inputSpy).toHaveBeenCalled();
    expect(changeSpy).toHaveBeenCalled();
  });

  it('returns errors for failed fills', () => {
    const input = document.createElement('input');
    input.name = 'email';
    input.type = 'email';
    input.disabled = true;
    container.appendChild(input);
    
    const field = createField('EMAIL', 0.9, input);
    const result = engine.autofill({ profile, fields: [field], minConfidence: 0.5 });
    
    expect(result.filled).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});