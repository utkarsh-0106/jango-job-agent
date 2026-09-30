import { Profile, ProfileStore } from '../shared/types';
import { ChromeStorageProfileStore } from './chrome-store';

export type { ProfileStore } from '../shared/types';

let storeInstance: ProfileStore | null = null;
let forceMemoryStore = false;

export function createProfileStore(): ProfileStore {
  if (storeInstance) return storeInstance;
  
  if (forceMemoryStore || !(typeof chrome !== 'undefined' && chrome.storage?.local)) {
    storeInstance = new MemoryProfileStore();
  } else {
    storeInstance = new ChromeStorageProfileStore();
  }
  
  return storeInstance;
}

export function resetProfileStore(): void {
  storeInstance = null;
}

export function setForceMemoryStore(value: boolean): void {
  forceMemoryStore = value;
  resetProfileStore();
}

class MemoryProfileStore implements ProfileStore {
  private profile: Profile | null = null;

  async get(): Promise<Profile | null> {
    return this.profile;
  }

  async set(profile: Profile): Promise<void> {
    this.profile = profile;
  }

  async clear(): Promise<void> {
    this.profile = null;
  }
}