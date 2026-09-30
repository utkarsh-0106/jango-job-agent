import { Profile, ProfileStore } from '../shared/types';

const STORAGE_KEY = 'jango:profile';

export class ChromeStorageProfileStore implements ProfileStore {
  async get(): Promise<Profile | null> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(result[STORAGE_KEY] || null);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async set(profile: Profile): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.set({ [STORAGE_KEY]: profile }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.remove([STORAGE_KEY], () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}