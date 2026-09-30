import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProfileStore, resetProfileStore, setForceMemoryStore } from '../src/profile/store';
import { validateProfile, createEmptyProfile, mergeProfile, DEFAULT_PROFILE } from '../src/profile/schema';
import { Profile } from '../src/shared/types';

describe('Profile Schema', () => {
  it('creates empty profile with all required sections', () => {
    const profile = createEmptyProfile();
    expect(validateProfile(profile)).toBe(true);
    expect(profile.personal).toBeDefined();
    expect(profile.contact).toBeDefined();
    expect(profile.links).toBeDefined();
    expect(profile.education).toEqual([]);
    expect(profile.skills).toEqual([]);
    expect(profile.experience).toEqual([]);
    expect(profile.projects).toEqual([]);
    expect(profile.preferences).toBeDefined();
    expect(profile.answers).toEqual({});
  });

  it('validates correct profile structure', () => {
    expect(validateProfile(DEFAULT_PROFILE)).toBe(true);
  });

  it('rejects invalid profile', () => {
    expect(validateProfile(null)).toBe(false);
    expect(validateProfile({})).toBe(false);
    expect(validateProfile({ personal: {} })).toBe(false);
  });

  it('merges profile updates', () => {
    const base = createEmptyProfile();
    const updates = {
      personal: { firstName: 'Jane' },
      contact: { email: 'jane@example.com' },
    };
    const merged = mergeProfile(base, updates);
    expect(merged.personal.firstName).toBe('Jane');
    expect(merged.personal.lastName).toBe('');
    expect(merged.contact.email).toBe('jane@example.com');
    expect(merged.contact.phone).toBe('');
  });

  it('does not mutate base profile', () => {
    const base = createEmptyProfile();
    mergeProfile(base, { personal: { firstName: 'Jane' } });
    expect(base.personal.firstName).toBe('');
  });
});

describe('MemoryProfileStore', () => {
  let store: ReturnType<typeof createProfileStore>;
  const testProfile: Profile = {
    ...DEFAULT_PROFILE,
    personal: {
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      dateOfBirth: '',
      currentLocation: '',
    },
    contact: { email: 'test@example.com', phone: '', city: '', state: '', country: '', zipCode: '' },
    links: { linkedin: '', github: '', portfolio: '', website: '' },
    education: [],
    skills: [],
    experience: [],
    projects: [],
    preferences: { willingToRelocate: false, remotePreference: 'any', noticePeriod: '' },
    answers: {},
  };

  beforeEach(() => {
    setForceMemoryStore(true);
    store = createProfileStore();
  });

  afterEach(() => {
    setForceMemoryStore(false);
  });

  it('returns null for empty store', async () => {
    const profile = await store.get();
    expect(profile).toBeNull();
  });

  it('stores and retrieves profile', async () => {
    await store.set(testProfile);
    const profile = await store.get();
    expect(profile).toEqual(testProfile);
  });

  it('clears profile', async () => {
    await store.set(testProfile);
    await store.clear();
    const profile = await store.get();
    expect(profile).toBeNull();
  });

  it('overwrites existing profile', async () => {
    await store.set(testProfile);
    const updated = { ...testProfile, personal: { ...testProfile.personal, firstName: 'Updated' } };
    await store.set(updated);
    const profile = await store.get();
    expect(profile?.personal.firstName).toBe('Updated');
  });
});