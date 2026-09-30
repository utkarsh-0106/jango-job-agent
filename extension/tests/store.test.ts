import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChromeStorageProfileStore } from '../src/profile/chrome-store';

describe('ChromeStorageProfileStore', () => {
  let store: ChromeStorageProfileStore;
  const testProfile = {
    personal: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
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
    store = new ChromeStorageProfileStore();
    vi.clearAllMocks();
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
    chrome.storage.local.set.mockImplementation((items, callback) => callback?.());
    chrome.storage.local.remove.mockImplementation((keys, callback) => callback?.());
    chrome.runtime.lastError = null;
  });

  it('gets profile from storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => 
      callback({ 'jango:profile': testProfile })
    );
    
    const profile = await store.get();
    expect(profile).toEqual(testProfile);
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['jango:profile'], expect.any(Function));
  });

  it('returns null when no profile stored', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
    
    const profile = await store.get();
    expect(profile).toBeNull();
  });

  it('sets profile in storage', async () => {
    await store.set(testProfile);
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { 'jango:profile': testProfile },
      expect.any(Function)
    );
  });

  it('clears profile from storage', async () => {
    await store.clear();
    expect(chrome.storage.local.remove).toHaveBeenCalledWith(['jango:profile'], expect.any(Function));
  });

  it('rejects on chrome runtime error', async () => {
    chrome.runtime.lastError = new Error('Storage error');
    chrome.storage.local.get.mockImplementation((keys, callback) => callback({}));
    
    await expect(store.get()).rejects.toThrow('Storage error');
  });

  it('rejects set on chrome runtime error', async () => {
    chrome.runtime.lastError = new Error('Quota exceeded');
    chrome.storage.local.set.mockImplementation((items, callback) => callback?.());
    
    await expect(store.set(testProfile)).rejects.toThrow('Quota exceeded');
  });
});