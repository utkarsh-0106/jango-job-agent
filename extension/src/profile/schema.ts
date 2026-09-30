import { Profile } from '../shared/types';

export const DEFAULT_PROFILE: Profile = {
  personal: {
    firstName: '',
    lastName: '',
    fullName: '',
    dateOfBirth: '',
    currentLocation: '',
  },
  contact: {
    email: '',
    phone: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  },
  links: {
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
  },
  education: [],
  skills: [],
  experience: [],
  projects: [],
  preferences: {
    willingToRelocate: false,
    remotePreference: 'any',
    noticePeriod: '',
  },
  answers: {},
};

export function createEmptyProfile(): Profile {
  return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
}

export function validateProfile(profile: unknown): profile is Profile {
  if (!profile || typeof profile !== 'object') return false;
  
  const p = profile as Record<string, unknown>;
  
  const requiredSections = ['personal', 'contact', 'links', 'education', 'skills', 'experience', 'projects', 'preferences', 'answers'];
  for (const section of requiredSections) {
    if (!(section in p)) return false;
  }
  
  return true;
}

export function mergeProfile(base: Profile, updates: Partial<Profile>): Profile {
  const merged = JSON.parse(JSON.stringify(base));
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
  }
  
  return merged;
}