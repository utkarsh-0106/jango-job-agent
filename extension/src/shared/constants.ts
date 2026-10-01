import { FieldType } from './types';

export interface FieldPattern {
  type: string;
  pattern: string;
  weight: number;
}

export const FIELD_TYPE_PATTERNS: Record<FieldType, FieldPattern[]> = {
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
    { type: 'name', pattern: '^name$|full.?name|applicant.?name|candidate.?name', weight: 0.8 },
    { type: 'id', pattern: '^name$|full.?name|applicant.?name|candidate.?name', weight: 0.7 },
    { type: 'label', pattern: 'full.?name|applicant.?name|candidate.?name|your.?name|name.?of.?applicant', weight: 0.9 },
    { type: 'placeholder', pattern: 'full.?name|applicant.?name|candidate.?name|your.?name', weight: 0.8 },
  ],
  INSTITUTION: [
    { type: 'name', pattern: 'college|institution|university|school', weight: 0.9 },
    { type: 'id', pattern: 'college|institution|university|school', weight: 0.8 },
    { type: 'label', pattern: 'college|institution|university|school', weight: 0.8 },
    { type: 'placeholder', pattern: 'college|institution|university|school', weight: 0.7 },
  ],
  ROLL_NUMBER: [
    { type: 'name', pattern: 'roll.?no|roll.?number|university.?roll|uni.?roll', weight: 0.9 },
    { type: 'id', pattern: 'roll.?no|roll.?number|university.?roll|uni.?roll', weight: 0.8 },
    { type: 'label', pattern: 'roll.?no|roll.?number|university.?roll|uni.?roll', weight: 0.8 },
    { type: 'placeholder', pattern: 'roll.?no|roll.?number|university.?roll|uni.?roll', weight: 0.7 },
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
};

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
};

export const SENSITIVE_FIELD_TYPES: FieldType[] = [
  'UNKNOWN',
];

export const MAX_CONFIDENCE = 1.0;
export const MIN_CONFIDENCE = 0.0;