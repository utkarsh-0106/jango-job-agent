import React, { useState, useEffect } from 'react';
import { Profile, DetectedField } from '../shared/types';
import { sendMessage, GetProfileMessage, SetProfileMessage, AutofillMessage } from '../messaging';
import { createEmptyProfile } from '../profile';

interface FormData {
  personal: { firstName: string; lastName: string; fullName: string };
  contact: { email: string; phone: string; city: string; state: string; country: string; zipCode: string };
  links: { linkedin: string; github: string; portfolio: string; website: string };
}

const INITIAL_FORM: FormData = {
  personal: { firstName: '', lastName: '', fullName: '' },
  contact: { email: '', phone: '', city: '', state: '', country: '', zipCode: '' },
  links: { linkedin: '', github: '', portfolio: '', website: '' },
};

export function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await sendMessage<{ success: boolean; profile: Profile | null }>({ type: 'GET_PROFILE' });
      if (response.profile) {
        setProfile(response.profile);
        setForm(profileToForm(response.profile));
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  function profileToForm(p: Profile): FormData {
    return {
      personal: { firstName: p.personal.firstName, lastName: p.personal.lastName, fullName: p.personal.fullName },
      contact: { email: p.contact.email, phone: p.contact.phone, city: p.contact.city, state: p.contact.state, country: p.contact.country, zipCode: p.contact.zipCode },
      links: { linkedin: p.links.linkedin, github: p.links.github, portfolio: p.links.portfolio, website: p.links.website },
    };
  }

  function formToProfile(f: FormData): Profile {
    const base = profile || createEmptyProfile();
    return {
      ...base,
      personal: { firstName: f.personal.firstName, lastName: f.personal.lastName, fullName: f.personal.fullName },
      contact: { email: f.contact.email, phone: f.contact.phone, city: f.contact.city, state: f.contact.state, country: f.contact.country, zipCode: f.contact.zipCode },
      links: { linkedin: f.links.linkedin, github: f.links.github, portfolio: f.links.portfolio, website: f.links.website },
    };
  }

  async function handleSave() {
    setLoading(true);
    setStatus(null);
    try {
      const newProfile = formToProfile(form);
      await sendMessage({ type: 'SET_PROFILE', payload: newProfile } as SetProfileMessage);
      setProfile(newProfile);
      setStatus({ type: 'success', message: 'Profile saved successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to save: ${error}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleDetect() {
    setLoading(true);
    setStatus(null);
    try {
      const response = await sendMessage<{ success: boolean; fields: DetectedField[] }>({ type: 'DETECT_FIELDS' });
      setDetectedFields(response.fields);
      setStatus({ type: 'info', message: `Detected ${response.fields.length} fields` });
    } catch (error) {
      setStatus({ type: 'error', message: `Detection failed: ${error}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleAutofill() {
    if (!profile) {
      setStatus({ type: 'error', message: 'No profile saved' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const response = await sendMessage<{ success: boolean; result: { filled: number; skipped: number; errors: Array<{ fieldType: string; selector: string; error: string }> } }>({ 
        type: 'AUTOFILL', 
        payload: { minConfidence: 0.5 } 
      } as AutofillMessage);
      const { filled, skipped, errors } = response.result;
      const diagnosticMessage = errors.length
        ? ` | ${errors
            .slice(0, 6)
            .map(error => `${error.fieldType}:${error.error}`)
            .join(' | ')}`
        : '';

      setStatus({
        type: 'success',
        message: `Filled ${filled} fields, skipped ${skipped}${errors.length ? ` (${errors.length} errors)` : ''}${diagnosticMessage}`,
      });
    } catch (error) {
      setStatus({ type: 'error', message: `Autofill failed: ${error}` });
    } finally {
      setLoading(false);
    }
  }

  function getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title">Jango Job Agent</div>
      </div>

      {status && (
        <div className={`status status-${status.type}`}>
          {status.message}
        </div>
      )}

      <div className="section">
        <div className="section-title">Profile</div>
        <div className="profile-form">
          <div className="field-row">
            <div className="field-group">
              <label>First Name</label>
              <input
                value={form.personal.firstName}
                onChange={e => setForm({ ...form, personal: { ...form.personal, firstName: e.target.value } })}
                placeholder="John"
              />
            </div>
            <div className="field-group">
              <label>Last Name</label>
              <input
                value={form.personal.lastName}
                onChange={e => setForm({ ...form, personal: { ...form.personal, lastName: e.target.value } })}
                placeholder="Doe"
              />
            </div>
          </div>
          <div className="field-group">
            <label>Full Name</label>
            <input
              value={form.personal.fullName}
              onChange={e => setForm({ ...form, personal: { ...form.personal, fullName: e.target.value } })}
              placeholder="John Doe"
            />
          </div>
          <div className="field-group">
            <label>Email</label>
            <input
              type="email"
              value={form.contact.email}
              onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
              placeholder="john@example.com"
            />
          </div>
          <div className="field-group">
            <label>Phone</label>
            <input
              type="tel"
              value={form.contact.phone}
              onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>City</label>
              <input
                value={form.contact.city}
                onChange={e => setForm({ ...form, contact: { ...form.contact, city: e.target.value } })}
                placeholder="San Francisco"
              />
            </div>
            <div className="field-group">
              <label>State</label>
              <input
                value={form.contact.state}
                onChange={e => setForm({ ...form, contact: { ...form.contact, state: e.target.value } })}
                placeholder="CA"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>Country</label>
              <input
                value={form.contact.country}
                onChange={e => setForm({ ...form, contact: { ...form.contact, country: e.target.value } })}
                placeholder="USA"
              />
            </div>
            <div className="field-group">
              <label>ZIP</label>
              <input
                value={form.contact.zipCode}
                onChange={e => setForm({ ...form, contact: { ...form.contact, zipCode: e.target.value } })}
                placeholder="94105"
              />
            </div>
          </div>
          <div className="field-group">
            <label>LinkedIn</label>
            <input
              type="url"
              value={form.links.linkedin}
              onChange={e => setForm({ ...form, links: { ...form.links, linkedin: e.target.value } })}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
          <div className="field-group">
            <label>GitHub</label>
            <input
              type="url"
              value={form.links.github}
              onChange={e => setForm({ ...form, links: { ...form.links, github: e.target.value } })}
              placeholder="https://github.com/johndoe"
            />
          </div>
          <div className="field-group">
            <label>Portfolio</label>
            <input
              type="url"
              value={form.links.portfolio}
              onChange={e => setForm({ ...form, links: { ...form.links, portfolio: e.target.value } })}
              placeholder="https://johndoe.dev"
            />
          </div>
          <div className="field-group">
            <label>Website</label>
            <input
              type="url"
              value={form.links.website}
              onChange={e => setForm({ ...form, links: { ...form.links, website: e.target.value } })}
              placeholder="https://johndoe.com"
            />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Actions</div>
        <button className="btn btn-primary" onClick={handleDetect} disabled={loading} style={{ width: '100%', marginBottom: '8px' }}>
          {loading ? 'Detecting...' : 'Detect Fields'}
        </button>
        <button className="btn btn-primary" onClick={handleAutofill} disabled={loading || !profile} style={{ width: '100%' }}>
          {loading ? 'Filling...' : 'Autofill Form'}
        </button>
      </div>

      {detectedFields.length > 0 && (
        <div className="section">
          <div className="section-title">Detected Fields ({detectedFields.length})</div>
          <div className="detected-fields">
            {detectedFields.map((field, idx) => (
              <div key={idx} className={`detected-field ${getConfidenceClass(field.classification.confidence)}`}>
                <div className="field-info">
                  <span className="field-type">{field.classification.fieldType}</span>
                  <span className="field-confidence">Confidence: {(field.classification.confidence * 100).toFixed(0)}%</span>
                </div>
                <span style={{ fontSize: '11px', color: '#999' }}>{field.selector.slice(0, 40)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}