import { useState, useEffect } from 'react';
import { sendMessage } from '../../messaging';
import { Profile } from '../../shared/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await sendMessage<{ success: boolean; profile: Profile | null }>({ type: 'GET_PROFILE' });
      setProfile(response.profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(newProfile: Profile) {
    await sendMessage({ type: 'SET_PROFILE', payload: newProfile });
    setProfile(newProfile);
  }

  return { profile, loading, saveProfile, refresh: loadProfile };
}