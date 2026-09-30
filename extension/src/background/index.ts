import { setupMessageHandlers } from '../messaging';

console.log('Jango Job Agent background service worker started');

setupMessageHandlers();

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
});

chrome.action.onClicked.addListener((tab) => {
  console.log('Action clicked on tab:', tab.id);
});