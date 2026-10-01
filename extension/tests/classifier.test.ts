import { describe, it, expect } from 'vitest';
import { RuleBasedClassifier } from '../src/field-detector/classifier';
import { ClassificationSignal } from '../src/shared/types';

describe('RuleBasedClassifier', () => {
  const classifier = new RuleBasedClassifier();

  function createSignal(source: ClassificationSignal['source'], value: string, weight = 1.0): ClassificationSignal {
    return { source, value, weight };
  }

  it('classifies email fields with high confidence', () => {
    const signals = [
      createSignal('type', 'email'),
      createSignal('name', 'email'),
      createSignal('autocomplete', 'email'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('EMAIL');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('classifies first name fields', () => {
    const signals = [
      createSignal('name', 'firstName'),
      createSignal('autocomplete', 'given-name'),
      createSignal('label', 'First Name'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('FIRST_NAME');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies last name fields', () => {
    const signals = [
      createSignal('name', 'lastName'),
      createSignal('autocomplete', 'family-name'),
      createSignal('label', 'Last Name'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('LAST_NAME');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies phone fields', () => {
    const signals = [
      createSignal('type', 'tel'),
      createSignal('autocomplete', 'tel'),
      createSignal('name', 'phone'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('PHONE');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('classifies LinkedIn fields', () => {
    const signals = [
      createSignal('name', 'linkedin'),
      createSignal('label', 'LinkedIn Profile'),
      createSignal('placeholder', 'linkedin.com/in/...'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('LINKEDIN');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies GitHub fields', () => {
    const signals = [
      createSignal('name', 'github'),
      createSignal('label', 'GitHub'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('GITHUB');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies address fields', () => {
    const signals = [
      createSignal('autocomplete', 'address-level2'),
      createSignal('name', 'city'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('CITY');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies institution fields', () => {
    const signals = [
      createSignal('name', 'collegeName'),
      createSignal('label', 'College Name'),
    ];

    const result = classifier.classify(signals);

    expect(result.fieldType).toBe('INSTITUTION');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies university institution fields', () => {
    const signals = [
      createSignal('name', 'university'),
      createSignal('label', 'University Name'),
    ];

    const result = classifier.classify(signals);

    expect(result.fieldType).toBe('INSTITUTION');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies roll number fields', () => {
    const signals = [
      createSignal('name', 'rollNo'),
      createSignal('label', 'Roll No.'),
    ];

    const result = classifier.classify(signals);

    expect(result.fieldType).toBe('ROLL_NUMBER');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('classifies full name aliases', () => {
    const signals = [
      createSignal('label', 'Applicant Name'),
    ];

    const result = classifier.classify(signals);

    expect(result.fieldType).toBe('FULL_NAME');
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('returns UNKNOWN for unrecognized fields', () => {
    const signals = [
      createSignal('name', 'randomfield123'),
      createSignal('id', 'xyz789'),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('UNKNOWN');
    expect(result.confidence).toBeLessThan(0.3);
  });

  it('handles empty signals', () => {
    const result = classifier.classify([]);
    expect(result.fieldType).toBe('UNKNOWN');
    expect(result.confidence).toBe(0);
  });

  it('prioritizes autocomplete over name', () => {
    const signals = [
      createSignal('autocomplete', 'email', 1.0),
      createSignal('name', 'phone', 1.0),
    ];
    const result = classifier.classify(signals);
    expect(result.fieldType).toBe('EMAIL');
  });
});