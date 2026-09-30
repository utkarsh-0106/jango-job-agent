export type FieldType =
  | 'FIRST_NAME'
  | 'LAST_NAME'
  | 'FULL_NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'LINKEDIN'
  | 'GITHUB'
  | 'PORTFOLIO'
  | 'WEBSITE'
  | 'CITY'
  | 'STATE'
  | 'COUNTRY'
  | 'ZIP_CODE'
  | 'UNKNOWN';

export interface ClassificationSignal {
  source: 'name' | 'id' | 'label' | 'placeholder' | 'aria-label' | 'autocomplete' | 'type' | 'surrounding-text';
  value: string;
  weight: number;
}

export interface ClassificationResult {
  fieldType: FieldType;
  confidence: number;
  signals: ClassificationSignal[];
}

export interface DetectedField {
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  classification: ClassificationResult;
  selector: string;
}

export interface Profile {
  personal: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    currentLocation: string;
  };
  contact: {
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  links: {
    linkedin: string;
    github: string;
    portfolio: string;
    website: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    currentStudent: boolean;
    cgpa: string;
    percentage: string;
    graduationYear: string;
    relevantCoursework: string;
    academicAchievements: string;
  }>;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    url: string;
  }>;
  preferences: {
    willingToRelocate: boolean;
    remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
    noticePeriod: string;
  };
  answers: Record<string, string>;
}

export interface ProfileStore {
  get(): Promise<Profile | null>;
  set(profile: Profile): Promise<void>;
  clear(): Promise<void>;
}

export interface AutofillOptions {
  profile: Profile;
  fields: DetectedField[];
  minConfidence?: number;
}

export interface AutofillResult {
  filled: number;
  skipped: number;
  errors: Array<{
    fieldType: string;
    selector: string;
    error: string;
  }>;
}

export interface ChromeMessage {
  type: string;
  payload?: unknown;
}

export interface GetProfileMessage extends ChromeMessage {
  type: 'GET_PROFILE';
}

export interface SetProfileMessage extends ChromeMessage {
  type: 'SET_PROFILE';
  payload: Profile;
}

export interface DetectFieldsMessage extends ChromeMessage {
  type: 'DETECT_FIELDS';
}

export interface AutofillMessage extends ChromeMessage {
  type: 'AUTOFILL';
  payload: { minConfidence?: number };
}

export interface FieldsDetectedMessage extends ChromeMessage {
  type: 'FIELDS_DETECTED';
  payload: DetectedField[];
}

export interface AutofillCompleteMessage extends ChromeMessage {
  type: 'AUTOFILL_COMPLETE';
  payload: AutofillResult;
}