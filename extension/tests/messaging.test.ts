import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveTargetTabId } from '../src/messaging/handlers';

describe('resolveTargetTabId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns sender.tab.id when available', async () => {
    const sender = { tab: { id: 123 } } as chrome.runtime.MessageSender;
    const tabId = await resolveTargetTabId(sender);
    expect(tabId).toBe(123);
  });

  it('queries active tab when sender.tab is undefined', async () => {
    const sender = { tab: undefined } as chrome.runtime.MessageSender;
    chrome.tabs.query.mockResolvedValue([{ id: 456, active: true }]);
    
    const tabId = await resolveTargetTabId(sender);
    
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(tabId).toBe(456);
  });

  it('queries active tab when sender.tab exists but has no id', async () => {
    const sender = { tab: { id: undefined } } as chrome.runtime.MessageSender;
    chrome.tabs.query.mockResolvedValue([{ id: 789, active: true }]);
    
    const tabId = await resolveTargetTabId(sender);
    
    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(tabId).toBe(789);
  });

  it('returns null when no active tab found', async () => {
    const sender = { tab: undefined } as chrome.runtime.MessageSender;
    chrome.tabs.query.mockResolvedValue([]);
    
    const tabId = await resolveTargetTabId(sender);
    
    expect(tabId).toBeNull();
  });

  it('returns null when chrome.tabs.query throws', async () => {
    const sender = { tab: undefined } as chrome.runtime.MessageSender;
    chrome.tabs.query.mockRejectedValue(new Error('Permission denied'));
    
    const tabId = await resolveTargetTabId(sender);
    
    expect(tabId).toBeNull();
  });
});