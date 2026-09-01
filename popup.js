// CONFIGURATIONS & STATE STATE
let config = {
  url: '',
  token: '',
  defaultCountryCode: '+55',
  defaultAccount: '',
  defaultInbox: ''
};

let currentTabInfo = {
  url: '',
  accountId: '',
  conversationId: '',
  inboxId: '',
  contactName: '',
  isChatwootConv: false
};

let activeTags = [];
let availableLabels = [];

// Conversations state
let activeChatFilter = 'progress';
let currentActiveChat = null;
let chatPollInterval = null;
let fetchedConversations = [];  // Active tab conversations (open or resolved depending on filter)
let openConversationsCache = []; // Always open conversations (for badges + new/progress filters)
let currentAccountId = '';
let isChatWindowMode = false;
let currentChatMessages = [];
let hasOlderMessages = false;
let isLoadingOlderMessages = false;
let lastRenderedRawHtml = '';
let currentUserId = null;

// Attachments & Voice Recording state
let pendingAttachments = [];
let mediaRecorder = null;
let audioChunks = [];
let recordingStartTime = 0;
let recordingTimerInterval = null;
let replyParentMessageId = null;
let editParentMessageId = null;

// Bulk Messaging state
let bulkContactsList = [];
let isBulkRunning = false;
let isBulkPaused = false;
let isBulkCancelled = false;

// DOM SELECTORS
const elements = {
  // Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  apiStatus: document.getElementById('api-status'),
  
  // Tab: Reminders
  searchInput: document.getElementById('search-input'),
  remindersList: document.getElementById('reminders-list'),

  // Tab: Reports
  reportsPeriodSelect: document.getElementById('reports-period-select'),
  reportsHeaderProgress: document.getElementById('reports-header-progress'),
  reportsContentLoading: document.getElementById('reports-content-loading'),
  reportsContentError: document.getElementById('reports-content-error'),
  reportsErrorText: document.getElementById('reports-error-text'),
  btnRetryReports: document.getElementById('btn-retry-reports'),
  reportsContentArea: document.getElementById('reports-content-area'),
  reportValMessages: document.getElementById('report-val-messages'),
  reportValReplied: document.getElementById('report-val-replied'),
  reportValResolved: document.getElementById('report-val-resolved'),
  reportValOpen: document.getElementById('report-val-open'),
  reportInboxBreakdown: document.getElementById('report-inbox-breakdown'),
  reportProductivityText: document.getElementById('report-productivity-text'),

  // Tab: Save Current
  notChatwootWarning: document.getElementById('not-chatwoot-warning'),
  btnGoToChatwoot: document.getElementById('btn-go-to-chatwoot'),
  saveCurrentForm: document.getElementById('save-current-form'),
  currentConvDisplay: document.getElementById('current-conv-display'),
  saveTitle: document.getElementById('save-title'),
  saveContactInfo: document.getElementById('save-contact-info'),
  saveTagInput: document.getElementById('save-tag'),
  labelSuggestions: document.getElementById('label-suggestions'),
  activeTagsList: document.getElementById('active-tags-list'),
  saveNotes: document.getElementById('save-notes'),
  saveAlarmEnable: document.getElementById('save-alarm-enable'),
  saveAlarmDatetimeWrapper: document.getElementById('save-alarm-datetime-wrapper'),
  saveAlarmDatetime: document.getElementById('save-alarm-datetime'),
  
  // Tab: New Chat
  newChatForm: document.getElementById('new-chat-form'),
  newChatPhone: document.getElementById('new-chat-phone'),
  newChatName: document.getElementById('new-chat-name'),
  newChatAccount: document.getElementById('new-chat-account'),
  newChatInbox: document.getElementById('new-chat-inbox'),
  inboxWarning: document.getElementById('inbox-channel-warning'),
  
  // Bulk Messaging Selectors
  subpaneIndividual: document.getElementById('subpane-individual'),
  subpaneBulk: document.getElementById('subpane-bulk'),
  bulkChatForm: document.getElementById('bulk-chat-form'),
  bulkChatAccount: document.getElementById('bulk-chat-account'),
  bulkChatInbox: document.getElementById('bulk-chat-inbox'),
  csvDropZone: document.getElementById('csv-drop-zone'),
  csvFileInput: document.getElementById('csv-file-input'),
  csvLoadedBadge: document.getElementById('csv-loaded-badge'),
  csvFilenameText: document.getElementById('csv-filename-text'),
  btnRemoveCsv: document.getElementById('btn-remove-csv'),
  csvPreviewContainer: document.getElementById('csv-preview-container'),
  csvContactsCount: document.getElementById('csv-contacts-count'),
  csvContactsTbody: document.getElementById('csv-contacts-tbody'),
  bulkMessageTemplate: document.getElementById('bulk-message-template'),
  bulkMessagePreviewCard: document.getElementById('bulk-message-preview-card'),
  bulkMessagePreviewText: document.getElementById('bulk-message-preview-text'),
  bulkDelayMin: document.getElementById('bulk-delay-min'),
  bulkDelayMax: document.getElementById('bulk-delay-max'),
  bulkBatchPause: document.getElementById('bulk-batch-pause'),
  bulkExecutionArea: document.getElementById('bulk-execution-area'),
  bulkProgressLabel: document.getElementById('bulk-progress-label'),
  bulkTimerLabel: document.getElementById('bulk-timer-label'),
  bulkProgressFill: document.getElementById('bulk-progress-fill'),
  bulkLogBox: document.getElementById('bulk-log-box'),
  btnStartBulk: document.getElementById('btn-start-bulk'),
  btnPauseBulk: document.getElementById('btn-pause-bulk'),
  btnCancelBulk: document.getElementById('btn-cancel-bulk'),
  
  // Tab: Settings
  settingsForm: document.getElementById('settings-form'),
  settingsUrl: document.getElementById('settings-url'),
  settingsToken: document.getElementById('settings-token'),
  btnToggleToken: document.getElementById('btn-toggle-token'),
  settingsCountry: document.getElementById('settings-country'),
  settingsDefaultAccount: document.getElementById('settings-default-account'),
  settingsDefaultInbox: document.getElementById('settings-default-inbox'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.querySelector('.toast-message'),

  // Tab: Conversations
  chatsSearchInput: document.getElementById('chats-search-input'),
  chatsList: document.getElementById('chats-list'),
  chatsListView: document.querySelector('.chats-list-view'),
  
  // Tab: Chat Detail
  chatsDetailView: document.querySelector('.chats-detail-view'),
  btnChatBack: document.getElementById('btn-chat-back'),
  btnChatPopout: document.getElementById('btn-chat-popout'),
  btnAppPopout: document.getElementById('btn-app-popout'),
  chatHeaderAvatar: document.getElementById('chat-header-avatar'),
  chatHeaderName: document.getElementById('chat-header-name'),
  chatHeaderMeta: document.getElementById('chat-header-meta'),
  chatMessagesArea: document.getElementById('chat-messages-area'),
  chatReplyBar: document.getElementById('chat-reply-bar'),
  chatReplyInput: document.getElementById('chat-reply-input')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Detect if running in standalone full-app window mode or separate chat mode
    const urlParams = new URLSearchParams(window.location.search);
    const isStandaloneApp = urlParams.get('mode') === 'standaloneApp';
    if (isStandaloneApp) {
      document.body.classList.add('standalone-app-mode');
    }

    const paramConvId = urlParams.get('convId');
    if (paramConvId) {
      isChatWindowMode = true;
      document.body.classList.add('chat-window-mode');
      const contactName = urlParams.get('contactName') || 'Cliente';
      document.title = `${contactName} - Chatwoot`;
      startActiveConversationHeartbeat(paramConvId);

      // Register windowId and tabId for instant cross-session focus
      chrome.tabs.getCurrent((currTab) => {
        if (currTab) {
          chrome.storage.local.get(['openConversationWindows'], (res) => {
            const winMap = res.openConversationWindows || {};
            winMap[String(paramConvId)] = {
              tabId: currTab.id,
              windowId: currTab.windowId,
              openedAt: Date.now()
            };
            chrome.storage.local.set({ openConversationWindows: winMap });
          });
        }
      });

      window.addEventListener('beforeunload', () => {
        stopActiveConversationHeartbeat(paramConvId);
        chrome.storage.local.get(['openConversationWindows'], (res) => {
          const winMap = res.openConversationWindows || {};
          delete winMap[String(paramConvId)];
          chrome.storage.local.set({ openConversationWindows: winMap });
        });
      });
    }

    if (elements.btnAppPopout) {
      elements.btnAppPopout.addEventListener('click', () => {
        openAppInWindow();
      });
    }

    // Set dynamic manifest version display in footer bar
    const versionEl = document.getElementById('app-version-display');
    if (versionEl) {
      versionEl.textContent = `v${chrome.runtime.getManifest().version}`;
    }

    // Setup tab navigation & event listeners first
    setupTabs();
    setupSettingsHandlers();
    setupTagHandlers();
    setupReportsHandlers();
    setupLightboxHandlers();
    setupContextMenuHandlers();
    setupBulkMessaging();

    // Close buttons
    const btnReplyPreviewClose = document.getElementById('btn-reply-preview-close');
    if (btnReplyPreviewClose) {
      btnReplyPreviewClose.addEventListener('click', (e) => {
        e.preventDefault();
        cancelMessageReply();
      });
    }
    const btnEditPreviewClose = document.getElementById('btn-edit-preview-close');
    if (btnEditPreviewClose) {
      btnEditPreviewClose.addEventListener('click', (e) => {
        e.preventDefault();
        cancelMessageEdit();
      });
    }

    // Dismiss context menu
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('msg-context-menu');
      if (menu && !menu.classList.contains('hidden')) {
        if (!e.target.closest('.btn-msg-menu') && !e.target.closest('#msg-context-menu')) {
          menu.classList.add('hidden');
        }
      }
    });

    // Real-time WebSocket and interaction event listener
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'newMessageReceived' || message.action === 'newMessageReceivedInActiveChat' || message.action === 'messageSentByAgent') {
        const convId = message.conversationId;
        const convInCache = openConversationsCache.find(c => c && c.id == convId);
        const inFetched = fetchedConversations.find(c => c && c.id == convId);

        if (message.action === 'newMessageReceivedInActiveChat') {
          if (convInCache) convInCache.unread_count = 0;
          if (inFetched) inFetched.unread_count = 0;
          
          if (elements.chatsList) {
            const card = elements.chatsList.querySelector(`[data-id="${convId}"]`);
            if (card) {
              card.classList.remove('unread');
              const badge = card.querySelector('.chat-item-badge');
              if (badge) badge.remove();
            }
          }
          updateUnreadBadgeLocal();
          filterAndRenderConversations();
        } else if (message.action === 'newMessageReceived') {
          if (convInCache) {
            convInCache.unread_count = (convInCache.unread_count || 0) + 1;
            if (inFetched) inFetched.unread_count = convInCache.unread_count;
            updateUnreadBadgeLocal();
            filterAndRenderConversations();
          } else {
            loadConversations();
          }
        } else if (message.action === 'messageSentByAgent') {
          const updateConv = (arr) => {
            const conversation = arr.find(c => c && c.id == message.conversationId);
            if (conversation) {
              if (!conversation.first_reply_created_at) {
                conversation.first_reply_created_at = Math.floor(Date.now() / 1000);
              }
              conversation.unread_count = 0;
            }
          };
          updateConv(openConversationsCache);
          updateConv(fetchedConversations);
          updateUnreadBadgeLocal();
          filterAndRenderConversations();
        }

        if (currentActiveChat && message.conversationId == currentActiveChat.id) {
          loadChatMessages(currentActiveChat.accountId, currentActiveChat.id, true);
        }
      } else if (message.action === 'activeTabsChanged') {
        filterAndRenderConversations();
      } else if (message.action === 'conversationStatusChanged') {
        const markStatus = (arr) => {
          const conversation = arr.find(c => c && c.id == message.conversationId);
          if (conversation) {
            conversation.status = message.status;
          }
        };
        markStatus(openConversationsCache);
        markStatus(fetchedConversations);
        updateUnreadBadgeLocal();
        filterAndRenderConversations();
      }
    });

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (isSelfSavingStorage) return;
      if (namespace === 'sync' || namespace === 'local') {
        if (changes.chatwootReminders) {
          loadReminders(elements.searchInput?.value || '');
        }
        if (changes.chatwootSettings) {
          loadSettings().then(() => {
            updateConnectionStatus();
          });
        }
      }
    });

    chrome.storage.local.get(['activeOpenConversations'], (res) => {
      activeOpenConversationsCache = res.activeOpenConversations || {};
    });

    // Load settings safely
    try {
      await loadSettings();
      updateConnectionStatus();
    } catch (err) {
      console.warn('loadSettings error:', err);
    }

    if (config.url && config.token) {
      chatwootFetch('/api/v1/profile').then(profile => {
        if (profile) currentUserId = profile.id;
      }).catch(err => console.warn('Could not load profile on init:', err));
    }

    // Restore last navigation state (loads conversations list)
    restoreNavigationState();

    // Check active tab and load reminders
    checkActiveTab().catch(err => console.warn('checkActiveTab error:', err));
    loadReminders();

  } catch (err) {
    console.error('Critical initialization error in DOMContentLoaded:', err);
  }
});
  
  // Setup search filter
  elements.searchInput.addEventListener('input', (e) => {
    loadReminders(e.target.value);
  });
  
  // Alarm checkbox toggle listener
  elements.saveAlarmEnable.addEventListener('change', (e) => {
    if (e.target.checked) {
      elements.saveAlarmDatetimeWrapper.classList.remove('hidden');
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      const tzOffset = now.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
      elements.saveAlarmDatetime.value = localISOTime;
      elements.saveAlarmDatetime.min = localISOTime;
    } else {
      elements.saveAlarmDatetimeWrapper.classList.add('hidden');
      elements.saveAlarmDatetime.value = '';
    }
  });

  // Phone contact search listeners
  elements.newChatPhone.addEventListener('blur', lookupContactByPhone);
  elements.newChatPhone.addEventListener('change', lookupContactByPhone);
  elements.newChatAccount.addEventListener('change', lookupContactByPhone);

  // Conversations filters setup
  const filterChips = document.querySelectorAll('.chats-filter-bar .filter-chip');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeChatFilter = chip.getAttribute('data-filter');
      loadConversations();
    });
  });

  // Conversations search input
  elements.chatsSearchInput.addEventListener('input', () => {
    filterAndRenderConversations();
  });

  // Chat back button
  elements.btnChatBack.addEventListener('click', closeChatView);

  // Chat popout button
  if (elements.btnChatPopout) {
    elements.btnChatPopout.addEventListener('click', () => {
      if (currentActiveChat) {
        openConversationInWindow(
          currentActiveChat.id,
          currentActiveChat.contactName,
          currentActiveChat.accountId,
          currentActiveChat.inboxId
        );
        closeChatView();
      }
    });
  }

  // Chat header action buttons
  const btnChatReminder = document.getElementById('btn-chat-reminder');
  if (btnChatReminder) {
    btnChatReminder.addEventListener('click', createReminderFromActiveChat);
  }

  const btnReminderBackToChat = document.getElementById('btn-reminder-back-to-chat');
  if (btnReminderBackToChat) {
    btnReminderBackToChat.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab('chats');
    });
  }

  const btnChatResolve = document.getElementById('btn-chat-resolve');
  if (btnChatResolve) {
    btnChatResolve.addEventListener('click', resolveCurrentConversation);
  }

  // Chat reply submit
  elements.chatReplyBar.addEventListener('submit', sendChatMessage);

  // Form submission listeners
  elements.saveCurrentForm.addEventListener('submit', handleSaveCurrentSubmit);
  elements.newChatForm.addEventListener('submit', handleNewChatSubmit);

  // Toggle Quick Reminder Form (inside Reminders tab)
  const btnToggleReminderForm = document.getElementById('btn-toggle-reminder-form');
  const quickReminderSection = document.getElementById('quick-reminder-section');
  if (btnToggleReminderForm && quickReminderSection) {
    btnToggleReminderForm.addEventListener('click', () => {
      quickReminderSection.classList.toggle('hidden');
      if (!quickReminderSection.classList.contains('hidden')) {
        checkActiveTab();
      }
    });
  }

  // Toggle Formatting Toolbar
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');
  const chatFormatToolbar = document.getElementById('chat-format-toolbar');
  if (btnToggleToolbar && chatFormatToolbar) {
    btnToggleToolbar.addEventListener('click', (e) => {
      e.preventDefault();
      chatFormatToolbar.classList.toggle('hidden');
      btnToggleToolbar.classList.toggle('active');
      
      // Auto-close emoji picker if toolbar is collapsed
      if (chatFormatToolbar.classList.contains('hidden')) {
        const emojiPicker = document.getElementById('emoji-picker');
        if (emojiPicker) emojiPicker.classList.add('hidden');
      }
    });
  }

  // Emoji picker setup
  setupEmojiPicker();

  // File upload trigger
  const btnAttachFile = document.getElementById('btn-attach-file');
  const chatFileInput = document.getElementById('chat-file-input');
  if (btnAttachFile && chatFileInput) {
    btnAttachFile.addEventListener('click', (e) => {
      e.preventDefault();
      chatFileInput.click();
    });

    chatFileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        pendingAttachments.push(...files);
        renderAttachmentsPreview();
      }
      chatFileInput.value = ''; // Reset to allow re-selection
    });
  }



  // Audio recording trigger & controls
  const btnAudioRecord = document.getElementById('btn-audio-record');
  const btnRecordingCancel = document.getElementById('btn-recording-cancel');
  const btnRecordingSend = document.getElementById('btn-recording-send');

  if (btnAudioRecord) {
    btnAudioRecord.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Request microphone access
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          startAudioRecording(stream);
        })
        .catch(err => {
          console.error('Microphone access denied:', err);
          showToast('Solicitando permissão de microfone em nova aba...', 'success');
          chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
        });
    });
  }

  if (btnRecordingCancel) {
    btnRecordingCancel.addEventListener('click', (e) => {
      e.preventDefault();
      cancelAudioRecording();
    });
  }

  if (btnRecordingSend) {
    btnRecordingSend.addEventListener('click', (e) => {
      e.preventDefault();
      stopAndSendAudioRecording();
    });
  }

  // Textarea enter key submit & auto-grow (WhatsApp style)
  function adjustChatReplyInputHeight() {
    elements.chatReplyInput.style.height = 'auto';
    elements.chatReplyInput.style.height = `${Math.min(elements.chatReplyInput.scrollHeight, 140)}px`;
  }

  elements.chatReplyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        elements.chatReplyBar.dispatchEvent(new Event('submit'));
      } else {
        // Shift+Enter inserts newline. Request instant height adjustment to avoid lag
        setTimeout(adjustChatReplyInputHeight, 0);
      }
    }
  });

  elements.chatReplyInput.addEventListener('input', adjustChatReplyInputHeight);

  // Handle paste events (Ctrl+V) for images
  elements.chatReplyInput.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        editingAttachmentIndex = -1; // New attachment from paste
        openImageEditor(file);
        e.preventDefault(); // Prevent pasting raw file names/text
        break;
      }
    }
  });

  // Setup Image Editor drawing events
  setupCanvasDrawingEvents();

  // Drag and Drop Files handling
  const dragDropOverlay = document.getElementById('drag-drop-overlay');
  if (elements.chatsDetailView && dragDropOverlay) {
    let dragCounter = 0;

    elements.chatsDetailView.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        dragDropOverlay.classList.remove('hidden');
      }
    });

    elements.chatsDetailView.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    elements.chatsDetailView.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        dragDropOverlay.classList.add('hidden');
      }
    });

    elements.chatsDetailView.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dragDropOverlay.classList.add('hidden');

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        pendingAttachments.push(...files);
        renderAttachmentsPreview();
        showToast(`${files.length} arquivo(s) adicionado(s) com sucesso.`, 'success');
      }
    });
  }

  // Setup Lightbox Modal events
  setupLightboxHandlers();

// TAB HANDLING
function setupTabs() {
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
  
  elements.btnGoToChatwoot.addEventListener('click', (e) => {
    e.preventDefault();
    const chatwootUrl = config.url || 'https://typebotifto.duckdns.org/';
    chrome.tabs.create({ url: chatwootUrl });
  });
}

function switchTab(tabId) {
  // Clean polling if leaving chats tab
  if (tabId !== 'chats' && chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }

  // Update buttons
  elements.tabButtons.forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Update panes
  elements.tabPanes.forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Persist tab state
  saveNavigationState({ activeTab: tabId });

  // Action on tab entry
  if (tabId === 'chats') {
    if (currentActiveChat) {
      // Restore polling if chat view was open
      loadChatMessages(currentActiveChat.accountId, currentActiveChat.id);
      chatPollInterval = setInterval(() => {
        if (currentActiveChat) {
          loadChatMessages(currentActiveChat.accountId, currentActiveChat.id, true);
        }
      }, 4000);
    } else {
      loadConversations();
    }
  } else if (tabId === 'save-current') {
    checkActiveTab();
  } else if (tabId === 'reminders') {
    loadReminders();
  } else if (tabId === 'reports') {
    loadReportsDashboard();
  } else if (tabId === 'new-chat') {
    // Populate dropdowns for new chat if connection is good
    if (config.token && config.url) {
      populateAccountsAndInboxes();
    }
  }
}

// ==========================================
// ROBUST CLOUD & LOCAL STORAGE HELPERS
// ==========================================

let isSelfSavingStorage = false;

async function getSettingsFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['chatwootSettings'], (syncRes) => {
      const syncData = syncRes?.chatwootSettings;
      chrome.storage.local.get(['chatwootSettings'], (localRes) => {
        const localData = localRes?.chatwootSettings;
        if (syncData && syncData.url && syncData.token) {
          chrome.storage.local.set({ chatwootSettings: syncData });
          return resolve(syncData);
        }
        if (localData && localData.url && localData.token) {
          chrome.storage.sync.set({ chatwootSettings: localData });
          return resolve(localData);
        }
        resolve(syncData || localData || null);
      });
    });
  });
}

async function saveSettingsToStorage(newConfig) {
  return new Promise((resolve) => {
    isSelfSavingStorage = true;
    chrome.storage.sync.set({ chatwootSettings: newConfig }, () => {
      chrome.storage.local.set({ chatwootSettings: newConfig }, () => {
        setTimeout(() => { isSelfSavingStorage = false; }, 400);
        resolve();
      });
    });
  });
}

async function getRemindersFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['chatwootReminders'], (syncRes) => {
      const syncList = Array.isArray(syncRes?.chatwootReminders) ? syncRes.chatwootReminders : null;
      chrome.storage.local.get(['chatwootReminders'], (localRes) => {
        const localList = Array.isArray(localRes?.chatwootReminders) ? localRes.chatwootReminders : [];
        let mergedList = [];
        if (syncList && syncList.length > 0) {
          const map = new Map();
          localList.forEach(item => item && item.id && map.set(String(item.id), item));
          syncList.forEach(item => item && item.id && map.set(String(item.id), item));
          mergedList = Array.from(map.values());
        } else {
          mergedList = localList;
        }
        if (mergedList.length > 0) {
          chrome.storage.sync.set({ chatwootReminders: mergedList });
          chrome.storage.local.set({ chatwootReminders: mergedList });
        }
        resolve(mergedList);
      });
    });
  });
}

async function saveRemindersToStorage(list) {
  return new Promise((resolve) => {
    isSelfSavingStorage = true;
    const sanitized = list.map(item => ({
      id: String(item.id),
      url: String(item.url || ''),
      accountId: String(item.accountId || ''),
      conversationId: String(item.conversationId || ''),
      inboxId: String(item.inboxId || ''),
      contactName: String(item.contactName || 'Cliente'),
      title: String(item.title || ''),
      tags: Array.isArray(item.tags) ? item.tags : [],
      notes: String(item.notes || '').substring(0, 1000),
      alarmTime: item.alarmTime || null,
      savedAt: item.savedAt || Date.now()
    }));

    chrome.storage.sync.set({ chatwootReminders: sanitized }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Chatwoot Storage] Sync reminders save notice:', chrome.runtime.lastError.message);
      }
      chrome.storage.local.set({ chatwootReminders: sanitized }, () => {
        setTimeout(() => { isSelfSavingStorage = false; }, 400);
        resolve(sanitized);
      });
    });
  });
}

// STORAGE & SETTINGS LOAD
async function loadSettings() {
  const savedSettings = await getSettingsFromStorage();
  if (savedSettings && savedSettings.url && savedSettings.token) {
    config = { ...config, ...savedSettings };
    elements.settingsUrl.value = config.url || '';
    elements.settingsToken.value = config.token || '';
    elements.settingsCountry.value = config.defaultCountryCode || '+55';

    // Populate dropdowns & restore saved account and inbox
    try {
      await populateAccountsAndInboxes();
      if (config.defaultAccount) {
        elements.settingsDefaultAccount.value = config.defaultAccount;
        await loadInboxesDropdown(config.defaultAccount, 'settings-default-inbox', config.defaultInbox);
      }
    } catch (err) {
      console.warn('Could not populate accounts/inboxes on loadSettings:', err);
    }
  }
}

function setupSettingsHandlers() {
  // Toggle password visibility
  elements.btnToggleToken.addEventListener('click', () => {
    const type = elements.settingsToken.getAttribute('type') === 'password' ? 'text' : 'password';
    elements.settingsToken.setAttribute('type', type);
  });

  // Settings form submit
  elements.settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Normalize URL (strip trailing slash)
    let url = elements.settingsUrl.value.trim();
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1);
    }

    config.url = url;
    config.token = elements.settingsToken.value.trim();
    config.defaultCountryCode = elements.settingsCountry.value.trim() || '+55';
    config.defaultAccount = elements.settingsDefaultAccount.value;
    config.defaultInbox = elements.settingsDefaultInbox.value;

    // Save to cloud storage
    await saveSettingsToStorage(config);
    showToast('Configurações salvas e sincronizadas!', 'success');
    updateConnectionStatus();
    
    // Notify background service worker of settings change
    chrome.runtime.sendMessage({ action: 'settingsChanged' }).catch(err => {
      console.warn('Could not notify background worker:', err);
    });
    
    // Reload dropdown selections for direct chat
    if (config.url && config.token) {
      await populateAccountsAndInboxes();
    }
  });

  // Load accounts/inboxes when settings tab is active
  elements.settingsDefaultAccount.addEventListener('change', async (e) => {
    const accId = e.target.value;
    if (accId) {
      await loadInboxesDropdown(accId, 'settings-default-inbox', config.defaultInbox);
    } else {
      elements.settingsDefaultInbox.innerHTML = '<option value="">Selecione...</option>';
    }
  });

  // Quick Sync Code Copy
  const btnCopySyncCode = document.getElementById('btn-copy-sync-code');
  if (btnCopySyncCode) {
    btnCopySyncCode.addEventListener('click', async () => {
      try {
        const settings = await getSettingsFromStorage();
        const reminders = await getRemindersFromStorage();
        const payload = { settings: settings || {}, reminders: reminders || [] };
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        await navigator.clipboard.writeText(b64);
        showToast('Código de sincronização copiado! 📋', 'success');
      } catch (err) {
        showToast('Erro ao gerar código de sincronização: ' + err.message, 'error');
      }
    });
  }

  // Quick Sync Code Apply
  const btnApplySyncCode = document.getElementById('btn-apply-sync-code');
  const syncCodeInput = document.getElementById('sync-code-input');
  if (btnApplySyncCode && syncCodeInput) {
    btnApplySyncCode.addEventListener('click', async () => {
      const code = syncCodeInput.value.trim();
      if (!code) {
        showToast('Por favor, cole o código de sincronização no campo.', 'error');
        return;
      }
      try {
        const jsonStr = decodeURIComponent(escape(atob(code)));
        const payload = JSON.parse(jsonStr);

        if (payload.settings) {
          await saveSettingsToStorage(payload.settings);
          await loadSettings();
          updateConnectionStatus();
        }

        if (Array.isArray(payload.reminders)) {
          await saveRemindersToStorage(payload.reminders);
          loadReminders();
        }

        showToast('Sincronização concluída com sucesso! 🎉', 'success');
        syncCodeInput.value = '';
        chrome.runtime.sendMessage({ action: 'settingsChanged' }).catch(() => {});
      } catch (err) {
        showToast('Código de sincronização inválido ou corrompido.', 'error');
      }
    });
  }

  // Backup Export
  const btnExport = document.getElementById('btn-export-backup');
  if (btnExport) {
    btnExport.addEventListener('click', async () => {
      try {
        const settings = await getSettingsFromStorage();
        const reminders = await getRemindersFromStorage();
        const backupData = {
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          settings: settings || {},
          reminders: reminders || []
        };
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `chatwoot_backup_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Backup exportado com sucesso!', 'success');
      } catch (err) {
        showToast('Erro ao exportar backup: ' + err.message, 'error');
      }
    });
  }

  // Backup Import
  const btnImport = document.getElementById('btn-import-backup');
  const importFileInput = document.getElementById('import-backup-file-input');
  if (btnImport && importFileInput) {
    btnImport.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (backup.settings) {
          await saveSettingsToStorage(backup.settings);
          await loadSettings();
          updateConnectionStatus();
        }

        if (Array.isArray(backup.reminders)) {
          await saveRemindersToStorage(backup.reminders);
          loadReminders();
        }

        showToast('Backup importado com sucesso!', 'success');
        chrome.runtime.sendMessage({ action: 'settingsChanged' }).catch(() => {});
      } catch (err) {
        showToast('Erro ao importar backup: ' + err.message, 'error');
      } finally {
        importFileInput.value = '';
      }
    });
  }

  // GitHub Update Check
  const btnCheckUpdate = document.getElementById('btn-check-github-update');
  const updateBox = document.getElementById('update-status-box');

  if (btnCheckUpdate && updateBox) {
    btnCheckUpdate.addEventListener('click', async () => {
      btnCheckUpdate.disabled = true;
      const originalHtml = btnCheckUpdate.innerHTML;
      btnCheckUpdate.innerHTML = 'Verificando...';
      updateBox.classList.remove('hidden');
      updateBox.style.background = 'var(--bg-tertiary)';
      updateBox.style.color = 'var(--text-secondary)';
      updateBox.style.border = '1px solid var(--border-color)';
      updateBox.innerHTML = '🔍 Conectando ao repositório GitHub (ricardopimentel/ChatwootExtensao)...';

      try {
        let res = await fetch('https://raw.githubusercontent.com/ricardopimentel/ChatwootExtensao/master/manifest.json', { cache: 'no-store' });
        if (!res.ok) {
          res = await fetch('https://raw.githubusercontent.com/ricardopimentel/ChatwootExtensao/main/manifest.json', { cache: 'no-store' });
        }
        
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const remoteManifest = await res.json();
        const remoteVersion = remoteManifest.version || '1.0.0';
        const localVersion = chrome.runtime.getManifest().version;

        const isNewer = (() => {
          const rParts = remoteVersion.split('.').map(Number);
          const lParts = localVersion.split('.').map(Number);
          for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
            const r = rParts[i] || 0;
            const l = lParts[i] || 0;
            if (r > l) return true;
            if (r < l) return false;
          }
          return false;
        })();

        if (isNewer) {
          updateBox.style.background = 'rgba(16, 185, 129, 0.12)';
          updateBox.style.color = 'var(--success)';
          updateBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
          updateBox.innerHTML = `
            🚀 <strong>Nova versão disponível: v${remoteVersion}</strong> (Sua versão atual: v${localVersion})<br>
            <span style="font-size: 10px; color: var(--text-primary);">Baixe o arquivo ZIP da versão mais recente no GitHub para atualizar:</span><br>
            <a href="https://github.com/ricardopimentel/ChatwootExtensao/archive/refs/heads/master.zip" target="_blank" class="btn btn-primary btn-small" style="display: inline-flex; align-items: center; gap: 4px; margin-top: 8px; text-decoration: none; padding: 4px 10px; font-size: 11px;">
              📥 Baixar ZIP da Atualização (v${remoteVersion})
            </a>
          `;
        } else {
          updateBox.style.background = 'rgba(37, 99, 235, 0.1)';
          updateBox.style.color = 'var(--primary-light)';
          updateBox.style.border = '1px solid rgba(37, 99, 235, 0.3)';
          updateBox.innerHTML = `✔️ <strong>Você já possui a versão mais recente!</strong> (v${localVersion})`;
        }
      } catch (err) {
        updateBox.style.background = 'rgba(239, 68, 68, 0.1)';
        updateBox.style.color = 'var(--danger)';
        updateBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        updateBox.innerHTML = `❌ Não foi possível verificar atualizações: ${err.message}. Verifique sua conexão com o GitHub.`;
      } finally {
        btnCheckUpdate.disabled = false;
        btnCheckUpdate.innerHTML = originalHtml;
      }
    });
  }
}

// Global CSP-compliant avatar image error handler
document.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG' && e.target.getAttribute('data-initials')) {
    const initials = e.target.getAttribute('data-initials');
    const title = e.target.getAttribute('title') || e.target.getAttribute('alt') || '';
    const wrapper = document.createElement('div');
    if (e.target.classList.contains('chat-msg-sender-avatar')) {
      wrapper.className = 'chat-msg-sender-avatar-initials';
    }
    if (title) wrapper.setAttribute('title', title);
    wrapper.textContent = initials;
    e.target.replaceWith(wrapper);
  }
}, true);

// DYNAMIC DROPDOWNS POPULATION
async function populateAccountsAndInboxes() {
  try {
    // Fetch user profile to get accounts
    const profile = await chatwootFetch('/api/v1/profile');
    const accounts = profile ? profile.accounts : null;
    if (!accounts || !Array.isArray(accounts)) return;

    const selectSingleAccount = accounts.length === 1;
    let selectedAccId = '';

    // Populate Settings accounts dropdown
    let accOptions = '';
    if (!selectSingleAccount) {
      accOptions += '<option value="">Selecione...</option>';
    }
    
    accounts.forEach(acc => {
      const selectedAttr = selectSingleAccount ? 'selected' : '';
      if (selectSingleAccount) {
        selectedAccId = acc.id;
      }
      accOptions += `<option value="${acc.id}" ${selectedAttr}>${acc.name || `Conta #${acc.id}`}</option>`;
    });
    
    elements.settingsDefaultAccount.innerHTML = accOptions;
    elements.newChatAccount.innerHTML = accOptions;
    if (elements.bulkChatAccount) elements.bulkChatAccount.innerHTML = accOptions;

    // Pre-select saved default
    if (config.defaultAccount) {
      elements.settingsDefaultAccount.value = config.defaultAccount;
      elements.newChatAccount.value = config.defaultAccount;
      if (elements.bulkChatAccount) elements.bulkChatAccount.value = config.defaultAccount;
      
      // Load inboxes for default account
      await loadInboxesDropdown(config.defaultAccount, 'settings-default-inbox', config.defaultInbox);
      await loadInboxesDropdown(config.defaultAccount, 'new-chat-inbox', config.defaultInbox);
      await loadInboxesDropdown(config.defaultAccount, 'bulk-chat-inbox', config.defaultInbox);
    } else if (selectSingleAccount && selectedAccId) {
      // Auto-load inboxes if there's only one account
      await loadInboxesDropdown(selectedAccId, 'settings-default-inbox', config.defaultInbox);
      await loadInboxesDropdown(selectedAccId, 'new-chat-inbox', config.defaultInbox);
      await loadInboxesDropdown(selectedAccId, 'bulk-chat-inbox', config.defaultInbox);
    }

    // Connect New Chat Account change listener
    elements.newChatAccount.addEventListener('change', async (e) => {
      const accId = e.target.value;
      if (accId) {
        await loadInboxesDropdown(accId, 'new-chat-inbox');
      } else {
        elements.newChatInbox.innerHTML = '<option value="">Selecione uma conta primeiro...</option>';
      }
    });

    if (elements.bulkChatAccount) {
      elements.bulkChatAccount.addEventListener('change', async (e) => {
        const accId = e.target.value;
        if (accId) {
          await loadInboxesDropdown(accId, 'bulk-chat-inbox');
        } else {
          elements.bulkChatInbox.innerHTML = '<option value="">Selecione uma conta primeiro...</option>';
        }
      });
    }

  } catch (err) {
    console.error('Error populating accounts:', err);
  }
}

async function loadInboxesDropdown(accountId, selectElementId, defaultValue = '') {
  const selectEl = document.getElementById(selectElementId);
  if (!selectEl) return;

  selectEl.innerHTML = '<option value="">Buscando canais...</option>';

  try {
    const response = await chatwootFetch(`/api/v1/accounts/${accountId}/inboxes`);
    const inboxes = response && Array.isArray(response) ? response : (response && Array.isArray(response.payload) ? response.payload : null);
    if (!inboxes || !Array.isArray(inboxes)) {
      selectEl.innerHTML = '<option value="">Nenhum canal encontrado</option>';
      return;
    }

    const selectSingleInbox = inboxes.length === 1;
    let options = '';
    
    if (!selectSingleInbox) {
      options += '<option value="">Selecione...</option>';
    }
    
    inboxes.forEach(inbox => {
      // Clean display name with channel type
      const channelDisplay = inbox.channel_type ? inbox.channel_type.replace('Channel::', '') : 'Outros';
      const selectedAttr = selectSingleInbox ? 'selected' : '';
      options += `<option value="${inbox.id}" data-type="${inbox.channel_type}" ${selectedAttr}>${inbox.name} (${channelDisplay})</option>`;
    });
    
    selectEl.innerHTML = options;
    
    if (defaultValue && !selectSingleInbox) {
      selectEl.value = defaultValue;
    }

    // Connect warning indicator for the new chat inbox select
    if (selectElementId === 'new-chat-inbox') {
      selectEl.addEventListener('change', () => updateInboxWarning(selectEl));
      // Run once immediately in case of auto-selection
      updateInboxWarning(selectEl);
    }

  } catch (err) {
    selectEl.innerHTML = '<option value="">Erro ao carregar canais</option>';
    console.error(err);
  }
}

// API UTILITIES
async function chatwootFetch(endpoint, options = {}) {
  if (!config.url || !config.token) {
    throw new Error('Chatwoot URL ou Token de API não configurados.');
  }

  const url = `${config.url}${endpoint}`;
  const headers = {
    'api_access_token': config.token,
    ...(options.headers || {})
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function updateConnectionStatus() {
  if (!config.url || !config.token) {
    elements.apiStatus.className = 'status-indicator offline';
    elements.apiStatus.title = 'Desconectado: Configurações ausentes';
    return;
  }

  elements.apiStatus.className = 'status-indicator checking';
  elements.apiStatus.title = 'Testando conexão...';

  try {
    // Call profile endpoint to test connection
    await chatwootFetch('/api/v1/profile');
    elements.apiStatus.className = 'status-indicator online';
    elements.apiStatus.title = 'Conectado com sucesso!';
  } catch (err) {
    elements.apiStatus.className = 'status-indicator offline';
    elements.apiStatus.title = `Conexão falhou: ${err.message}`;
  }
}

// ACTIVE TAB DETECTOR
async function checkActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || tabs.length === 0) {
        setNotChatwootState();
        resolve();
        return;
      }

      const activeTab = tabs[0];
      currentTabInfo.url = activeTab.url || '';

      // Match conversation URL: e.g. /app/accounts/{accountId}/conversations/{conversationId}
      const match = currentTabInfo.url.match(/\/app\/accounts\/(\d+)\/conversations\/(\d+)/);
      
      if (match) {
        currentTabInfo.isChatwootConv = true;
        currentTabInfo.accountId = match[1];
        currentTabInfo.conversationId = match[2];

        // Update UI info
        elements.currentConvDisplay.querySelector('.conv-id').textContent = `ID: #${currentTabInfo.conversationId}`;
        elements.currentConvDisplay.querySelector('.conv-url').textContent = currentTabInfo.url;
        
        elements.notChatwootWarning.classList.add('hidden');
        elements.saveCurrentForm.classList.remove('hidden');

        // Fetch contact details
        await loadConversationContactInfo();
      } else {
        setNotChatwootState();
      }
      resolve();
    });
  });
}

function setNotChatwootState() {
  currentTabInfo.isChatwootConv = false;
  currentTabInfo.accountId = '';
  currentTabInfo.conversationId = '';
  currentTabInfo.contactName = '';
  
  elements.notChatwootWarning.classList.remove('hidden');
  elements.saveCurrentForm.classList.add('hidden');
}

async function loadConversationContactInfo() {
  if (!config.url || !config.token) {
    elements.saveContactInfo.textContent = 'Configure a API para buscar dados do contato.';
    elements.saveTitle.value = `Conversa #${currentTabInfo.conversationId}`;
    return;
  }

  elements.saveContactInfo.textContent = 'Buscando contato na API...';

  try {
    // Endpoint to retrieve a specific conversation: GET /api/v1/accounts/{account_id}/conversations/{conversation_id}
    const convData = await chatwootFetch(`/api/v1/accounts/${currentTabInfo.accountId}/conversations/${currentTabInfo.conversationId}`);
    
    // In chatwoot, contact is inside meta.sender
    const contact = convData?.meta?.sender;
    const name = contact?.name || 'Cliente';
    const identifier = contact?.phone_number || contact?.email || '';
    
    currentTabInfo.contactName = name;
    currentTabInfo.inboxId = convData?.inbox_id || '';
    elements.saveContactInfo.innerHTML = `Contato: <span class="highlight">${name}</span> ${identifier ? `(${identifier})` : ''}`;
    elements.saveTitle.value = `Retornar com ${name}`;

    // Dynamically load account labels
    loadAccountLabels(currentTabInfo.accountId);

  } catch (err) {
    console.error('Error fetching contact info:', err);
    elements.saveContactInfo.textContent = 'Erro ao conectar na API. Digite o título manualmente.';
    elements.saveTitle.value = `Conversa #${currentTabInfo.conversationId}`;
  }
}

// TAGS / LABELS HANDLERS
async function loadAccountLabels(accountId) {
  try {
    const labelsData = await chatwootFetch(`/api/v1/accounts/${accountId}/labels`);
    if (labelsData && Array.isArray(labelsData.payload)) {
      availableLabels = labelsData.payload.map(l => l.title);
    }
  } catch (err) {
    console.error('Error loading account labels:', err);
  }
}

function setupTagHandlers() {
  elements.saveTagInput.addEventListener('keydown', (e) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const tagVal = elements.saveTagInput.value.trim().replace(/,/g, '');
      if (tagVal && !activeTags.includes(tagVal)) {
        addTag(tagVal);
        elements.saveTagInput.value = '';
        elements.labelSuggestions.style.display = 'none';
      }
    }
  });

  // Suggestion list logic
  elements.saveTagInput.addEventListener('input', () => {
    const val = elements.saveTagInput.value.trim().toLowerCase();
    if (!val) {
      elements.labelSuggestions.style.display = 'none';
      return;
    }

    const filtered = availableLabels.filter(label => 
      label.toLowerCase().includes(val) && !activeTags.includes(label)
    );

    if (filtered.length > 0) {
      elements.labelSuggestions.innerHTML = '';
      filtered.forEach(label => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = label;
        item.addEventListener('click', () => {
          addTag(label);
          elements.saveTagInput.value = '';
          elements.labelSuggestions.style.display = 'none';
        });
        elements.labelSuggestions.appendChild(item);
      });
      elements.labelSuggestions.style.display = 'block';
    } else {
      elements.labelSuggestions.style.display = 'none';
    }
  });

  // Close suggestions click outside
  document.addEventListener('click', (e) => {
    if (!elements.saveTagInput.contains(e.target) && !elements.labelSuggestions.contains(e.target)) {
      elements.labelSuggestions.style.display = 'none';
    }
  });
}

function addTag(tag) {
  if (activeTags.includes(tag)) return;
  activeTags.push(tag);
  renderTags();
}

function removeTag(tag) {
  activeTags = activeTags.filter(t => t !== tag);
  renderTags();
}

function renderTags() {
  elements.activeTagsList.innerHTML = '';
  activeTags.forEach(tag => {
    const badge = document.createElement('div');
    badge.className = 'tag-item';
    badge.innerHTML = `
      <span>${tag}</span>
      <button type="button" class="tag-remove" data-tag="${tag}">✕</button>
    `;
    badge.querySelector('.tag-remove').addEventListener('click', () => removeTag(tag));
    elements.activeTagsList.appendChild(badge);
  });
}

// SAVE CURRENT CONVERSATION SUBMIT
async function handleSaveCurrentSubmit(e) {
  e.preventDefault();

  const title = elements.saveTitle.value.trim();
  const notes = elements.saveNotes.value.trim();
  
  if (!title) {
    showToast('Digite um título para o lembrete.', 'error');
    return;
  }

  const alarmEnabled = elements.saveAlarmEnable.checked;
  let alarmTime = '';
  if (alarmEnabled) {
    const val = elements.saveAlarmDatetime.value; // Format: YYYY-MM-DDTHH:MM
    const match = val.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      showToast('Formato de data e hora inválido.', 'error');
      return;
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 0-indexed
    const day = parseInt(match[3], 10);
    const hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    const selectedTime = new Date(year, month, day, hour, minute).getTime();

    if (isNaN(selectedTime) || selectedTime <= Date.now()) {
      showToast('Selecione uma data e hora futura para o alarme.', 'error');
      return;
    }
    alarmTime = selectedTime;
  }

  const reminder = {
    id: `reminder_${currentTabInfo.accountId}_${currentTabInfo.conversationId}`,
    url: currentTabInfo.url,
    accountId: currentTabInfo.accountId,
    conversationId: currentTabInfo.conversationId,
    inboxId: currentTabInfo.inboxId || '',
    contactName: currentTabInfo.contactName || 'Cliente',
    title: title,
    tags: [...activeTags],
    notes: notes,
    alarmTime: alarmTime,
    savedAt: Date.now()
  };

  const currentList = await getRemindersFromStorage();
  const filteredList = currentList.filter(item => item.id !== reminder.id);
  filteredList.unshift(reminder);

  await saveRemindersToStorage(filteredList);

  // Create alarm if time is set
  if (alarmTime) {
    chrome.alarms.create(reminder.id, { when: alarmTime });
  }

  // Post private note to Chatwoot conversation for server-side persistence across PCs
  if (currentTabInfo.accountId && currentTabInfo.conversationId) {
    chatwootFetch(`/api/v1/accounts/${currentTabInfo.accountId}/conversations/${currentTabInfo.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: `📌 [Lembrete Extensão] ${title}${notes ? '\nNotas: ' + notes : ''}`,
        private: true
      })
    }).catch(err => console.warn('Could not post private note to Chatwoot:', err));
  }

  showToast('Lembrete salvo e sincronizado!', 'success');
  
  // Reset form
  elements.saveNotes.value = '';
  elements.saveAlarmEnable.checked = false;
  elements.saveAlarmDatetimeWrapper.classList.add('hidden');
  elements.saveAlarmDatetime.value = '';
  activeTags = [];
  renderTags();
  
  // Collapse quick reminder section and refresh list
  const quickReminderSection = document.getElementById('quick-reminder-section');
  if (quickReminderSection) {
    quickReminderSection.classList.add('hidden');
  }
  loadReminders();
  if (isChatWindowMode) {
    switchTab('chats');
  }
}

// LOAD & RENDER REMINDERS
async function loadReminders(searchQuery = '') {
  const list = await getRemindersFromStorage();
  elements.remindersList.innerHTML = '';

    const query = searchQuery.trim().toLowerCase();
    const filtered = list.filter(item => {
      if (!query) return true;
      const titleMatch = (item.title || '').toLowerCase().includes(query);
      const contactMatch = (item.contactName || '').toLowerCase().includes(query);
      const notesMatch = (item.notes || '').toLowerCase().includes(query);
      const tagsMatch = Array.isArray(item.tags) && item.tags.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || contactMatch || notesMatch || tagsMatch;
    });

    if (filtered.length === 0) {
      elements.remindersList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <h3>Nenhum Lembrete Encontrado</h3>
          <p>${query ? 'Não há lembretes correspondentes à sua busca.' : 'Abra uma conversa nas suas Conversas para criar seu primeiro lembrete.'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      if (!item) return;
      const card = document.createElement('div');
      card.className = 'reminder-card';
      
      // Build tags HTML
      let tagsHtml = '';
      if (item.tags && item.tags.length > 0) {
        tagsHtml = '<div class="reminder-tags">';
        item.tags.forEach(t => {
          tagsHtml += `<span class="tag-badge">${t}</span>`;
        });
        tagsHtml += '</div>';
      }

      // Build notes HTML
      let notesHtml = '';
      if (item.notes) {
        notesHtml = `<div class="reminder-notes">${item.notes}</div>`;
      }

      // Build alarm HTML
      let alarmHtml = '';
      if (item.alarmTime) {
        const date = new Date(item.alarmTime);
        const dateStr = date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const hasPassed = date.getTime() <= Date.now();
        const alarmClass = hasPassed ? 'alarm-tag passed' : 'alarm-tag';
        alarmHtml = `
          <div class="${alarmClass}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Lembrete programado: ${dateStr}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="reminder-header">
          <a href="#" class="reminder-title-link" title="Abrir conversa na extensão">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            ${item.title}
          </a>
          <button class="btn-delete" data-id="${item.id}" title="Excluir Lembrete">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
        
        <div class="reminder-meta">
          <span>Contato: <strong>${item.contactName}</strong></span>
          <span>•</span>
          <span>ID: #${item.conversationId} <span class="inbox-name-badge" data-acc="${item.accountId}" data-inbox="${item.inboxId || ''}"></span></span>
        </div>
        
        ${alarmHtml}
        ${notesHtml}
        ${tagsHtml}

        <div class="reminder-actions-row" style="margin-top: 12px; display: flex; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 10px;">
          <!-- Open in Chatwoot (browser tab) -->
          <button class="btn btn-secondary btn-small btn-open-chatwoot" style="flex: 1; padding: 4px 8px; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px;" title="Abrir no painel do Chatwoot">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            Abrir Chatwoot
          </button>
          
          <!-- Edit Reminder -->
          <button class="btn btn-secondary btn-small btn-edit-reminder" style="padding: 4px 10px; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px;" title="Editar Lembrete">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Editar
          </button>
        </div>
      `;

      // Open conversation directly in a window when clicking title link
      const titleLink = card.querySelector('.reminder-title-link');
      if (titleLink) {
        titleLink.addEventListener('click', (e) => {
          e.preventDefault();
          openConversationInWindow(item.conversationId, item.contactName, item.accountId, item.inboxId || '');
        });
      }

      // Open in Chatwoot tab
      const btnOpenChatwoot = card.querySelector('.btn-open-chatwoot');
      if (btnOpenChatwoot) {
        btnOpenChatwoot.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: item.url || `${config.url}/app/accounts/${item.accountId}/conversations/${item.conversationId}` });
        });
      }

      // Edit Reminder
      const btnEditReminder = card.querySelector('.btn-edit-reminder');
      if (btnEditReminder) {
        btnEditReminder.addEventListener('click', (e) => {
          e.preventDefault();
          
          currentTabInfo.isChatwootConv = true;
          currentTabInfo.accountId = item.accountId;
          currentTabInfo.conversationId = item.conversationId;
          currentTabInfo.contactName = item.contactName;
          currentTabInfo.inboxId = item.inboxId || '';
          currentTabInfo.url = item.url || `${config.url}/app/accounts/${item.accountId}/conversations/${item.conversationId}`;

          elements.saveTitle.value = item.title || '';
          elements.saveNotes.value = item.notes || '';
          
          if (item.alarmTime) {
            elements.saveAlarmEnable.checked = true;
            elements.saveAlarmDatetimeWrapper.classList.remove('hidden');
            elements.saveAlarmDatetime.value = formatTimestampToLocalDatetime(item.alarmTime);
          } else {
            elements.saveAlarmEnable.checked = false;
            elements.saveAlarmDatetimeWrapper.classList.add('hidden');
            elements.saveAlarmDatetime.value = '';
          }

          activeTags = Array.isArray(item.tags) ? [...item.tags] : [];
          renderTags();

          elements.notChatwootWarning.classList.add('hidden');
          elements.saveCurrentForm.classList.remove('hidden');

          const tabPane = elements.remindersList.closest('.tab-pane');
          if (tabPane) tabPane.scrollTop = 0;

          const quickReminderSection = document.getElementById('quick-reminder-section');
          if (quickReminderSection) {
            quickReminderSection.classList.remove('hidden');
          }

          elements.saveTitle.focus();
        });
      }

      // Delete behavior
      const btnDelete = card.querySelector('.btn-delete');
      if (btnDelete) {
        btnDelete.addEventListener('click', () => {
          deleteReminder(item.id);
        });
      }

      elements.remindersList.appendChild(card);
    });
    resolveInboxNames();
}


async function deleteReminder(id) {
  // Cancel chrome alarm
  chrome.alarms.clear(id);

  const list = await getRemindersFromStorage();
  const filteredList = list.filter(item => item.id !== id);
  await saveRemindersToStorage(filteredList);
  showToast('Lembrete excluído.', 'success');
  loadReminders(elements.searchInput?.value || '');
}

// INICIAR CONVERSA POR TELEFONE
async function handleNewChatSubmit(e) {
  e.preventDefault();

  const phoneRaw = elements.newChatPhone.value.trim();
  const name = elements.newChatName.value.trim();
  const accountId = elements.newChatAccount.value;
  const inboxId = elements.newChatInbox.value;

  if (!phoneRaw || !accountId || !inboxId) {
    showToast('Preencha os campos obrigatórios.', 'error');
    return;
  }

  // Clean phone number (keep only digits and '+')
  let phone = phoneRaw.replace(/[^\d+]/g, '');
  
  // Format check: if no country code, prepend default
  if (!phone.startsWith('+')) {
    const country = config.defaultCountryCode ? config.defaultCountryCode.replace(/[^\d+]/g, '') : '55';
    // Append default country if phone doesn't already start with it
    const cleanCountry = country.startsWith('+') ? country : `+${country}`;
    phone = `${cleanCountry}${phone}`;
  }

  const btnSubmit = elements.newChatForm.querySelector('button[type="submit"]');
  const origBtnContent = btnSubmit.innerHTML;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = 'Processando...';

  try {
    showToast('Buscando contato...', 'success');
    
    // Step 1: Search contact in Chatwoot
    // GET /api/v1/accounts/{account_id}/contacts/search?q={phone}
    const searchRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(phone)}`);
    
    let contactId = null;
    let contactName = name || phone;
    
    let conversationId = null;

    if (searchRes && searchRes.payload && searchRes.payload.length > 0) {
      // Contact exists
      contactId = searchRes.payload[0].id;
      contactName = searchRes.payload[0].name || contactName;
      showToast('Contato encontrado no Chatwoot!', 'success');

      // Check for active conversation in the same inbox
      try {
        const response = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${contactId}/conversations`);
        const convs = response && Array.isArray(response) ? response : (response && Array.isArray(response.payload) ? response.payload : null);
        if (convs && Array.isArray(convs)) {
          // Find an active (non-resolved) conversation for this inbox
          const activeConv = convs.find(c => 
            String(c.inbox_id) === String(inboxId) && 
            c.status !== 'resolved'
          );
          if (activeConv) {
            conversationId = activeConv.id;
            showToast('Conversa ativa encontrada!', 'success');
          }
        }
      } catch (err) {
        console.warn('Error checking existing conversations:', err);
      }
    } else {
      // Step 2: Create Contact
      // POST /api/v1/accounts/{account_id}/contacts
      showToast('Criando novo contato...', 'success');
      const createRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          name: contactName,
          phone_number: phone
        })
      });
      contactId = createRes?.payload?.contact?.id;
      if (!contactId) {
        throw new Error('Falha ao obter ID do contato criado.');
      }
    }

    // Step 3: Link contact to inbox
    // Check if association exists, if not create it
    showToast('Configurando canal de conversa...', 'success');
    let sourceId = phone;

    try {
      const inboxLinkRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${contactId}/contact_inboxes`, {
        method: 'POST',
        body: JSON.stringify({
          inbox_id: parseInt(inboxId),
          source_id: phone
        })
      });
      sourceId = inboxLinkRes?.source_id || sourceId;
    } catch (err) {
      console.warn('Contact Inbox already linked or error: ', err);
      // Usually, it means already linked, which is fine, we can proceed
    }

    // Step 4: Create Conversation (only if no active conversation exists)
    if (!conversationId) {
      showToast('Iniciando conversa...', 'success');
      const convRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({
          contact_id: parseInt(contactId),
          inbox_id: parseInt(inboxId),
          status: 'open'
        })
      });

      conversationId = convRes?.id;
      if (!conversationId) {
        throw new Error('Não foi possível iniciar a conversa na API.');
      }
    }

    // Open conversation in a separate window
    showToast('Abrindo conversa em nova janela...', 'success');
    openConversationInWindow(conversationId, contactName, accountId, inboxId);
    
    // Reset form
    elements.newChatPhone.value = '';
    elements.newChatName.value = '';
    
    const searchHelper = document.getElementById('new-chat-phone-search-status');
    if (searchHelper) {
      searchHelper.textContent = '';
      searchHelper.className = 'helper-text';
    }
    const nameFormGroup = elements.newChatName.closest('.form-group');
    if (nameFormGroup) {
      nameFormGroup.classList.remove('hidden');
    }

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = origBtnContent;

  } catch (err) {
    console.error('Error starting conversation:', err);
    showToast(`Erro: ${err.message}`, 'error');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = origBtnContent;
  }
}

// ==========================================
// BULK MESSAGING FUNCTIONS (CSV & ANTI-BAN)
// ==========================================

function getDynamicGreeting() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function setupBulkMessaging() {
  // Sub-tabs switching
  const subtabBtns = document.querySelectorAll('.sub-tab-btn');
  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetSubtab = btn.getAttribute('data-subtab');
      if (targetSubtab === 'individual') {
        if (elements.subpaneIndividual) elements.subpaneIndividual.classList.remove('hidden');
        if (elements.subpaneBulk) elements.subpaneBulk.classList.add('hidden');
      } else {
        if (elements.subpaneIndividual) elements.subpaneIndividual.classList.add('hidden');
        if (elements.subpaneBulk) elements.subpaneBulk.classList.remove('hidden');
      }
    });
  });

  // Dropzone click & drag drop
  if (elements.csvDropZone && elements.csvFileInput) {
    elements.csvDropZone.addEventListener('click', () => {
      elements.csvFileInput.click();
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      elements.csvDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.csvDropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      elements.csvDropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.csvDropZone.classList.remove('dragover');
      });
    });

    elements.csvDropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        processCSVFile(files[0]);
      }
    });

    elements.csvFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processCSVFile(e.target.files[0]);
      }
    });
  }

  // Remove CSV
  if (elements.btnRemoveCsv) {
    elements.btnRemoveCsv.addEventListener('click', (e) => {
      e.stopPropagation();
      resetCSVState();
    });
  }

  // Template Variable Chips
  document.querySelectorAll('.chip-var').forEach(chip => {
    chip.addEventListener('click', () => {
      const varTag = chip.getAttribute('data-var');
      const input = elements.bulkMessageTemplate;
      if (!input) return;
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;
      input.value = input.value.substring(0, start) + varTag + input.value.substring(end);
      input.focus();
      input.selectionStart = input.selectionEnd = start + varTag.length;
      renderBulkPreview();
    });
  });

  // Live Preview on template input
  if (elements.bulkMessageTemplate) {
    elements.bulkMessageTemplate.addEventListener('input', renderBulkPreview);
  }

  // Action Buttons
  if (elements.btnStartBulk) {
    elements.btnStartBulk.addEventListener('click', handleStartBulkSubmit);
  }
  if (elements.btnPauseBulk) {
    elements.btnPauseBulk.addEventListener('click', togglePauseBulk);
  }
  if (elements.btnCancelBulk) {
    elements.btnCancelBulk.addEventListener('click', cancelBulkExecution);
  }
}

function resetCSVState() {
  bulkContactsList = [];
  if (elements.csvFileInput) elements.csvFileInput.value = '';
  if (elements.csvLoadedBadge) elements.csvLoadedBadge.classList.add('hidden');
  if (elements.csvPreviewContainer) elements.csvPreviewContainer.classList.add('hidden');
  if (elements.csvDropZone) elements.csvDropZone.classList.remove('hidden');
  if (elements.csvContactsTbody) elements.csvContactsTbody.innerHTML = '';
  if (elements.csvContactsCount) elements.csvContactsCount.textContent = '0';
  renderBulkPreview();
}

function processCSVFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showToast('Por favor, selecione um arquivo válido no formato .CSV', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    parseCSVContent(text, file.name);
  };
  reader.readAsText(file, 'UTF-8');
}

function parseCSVContent(text, filename) {
  const lines = text.split(/\r\n|\n|\r/).map(line => line.trim()).filter(line => line.length > 0);
  if (lines.length === 0) {
    showToast('O arquivo CSV está vazio.', 'error');
    return;
  }

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const splitRow = (rowStr) => {
    const pattern = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
    const entries = [];
    let match;
    while ((match = pattern.exec(rowStr)) !== null) {
      entries.push((match[1] !== undefined ? match[1] : match[2]).trim());
    }
    return entries;
  };

  const headers = splitRow(lines[0]).map(h => h.toLowerCase());
  
  let nameIdx = headers.findIndex(h => h.includes('nome') || h.includes('name') || h.includes('contato'));
  let phoneIdx = headers.findIndex(h => h.includes('telef') || h.includes('phone') || h.includes('cel') || h.includes('whats') || h.includes('num') || h.includes('tel'));

  if (nameIdx === -1) nameIdx = 0;
  if (phoneIdx === -1) phoneIdx = headers.length > 1 ? 1 : 0;

  const contacts = [];
  const startRow = (nameIdx >= 0 || phoneIdx >= 0) ? 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const row = splitRow(lines[i]);
    if (row.length === 0) continue;

    const rawName = row[nameIdx] || `Contato ${i}`;
    const rawPhone = row[phoneIdx] || '';

    let cleanPhone = rawPhone.replace(/[^\d+]/g, '');
    if (!cleanPhone) continue;

    if (!cleanPhone.startsWith('+')) {
      const country = config.defaultCountryCode ? config.defaultCountryCode.replace(/[^\d+]/g, '') : '55';
      const cleanCountry = country.startsWith('+') ? country : `+${country}`;
      cleanPhone = `${cleanCountry}${cleanPhone}`;
    }

    contacts.push({
      index: contacts.length + 1,
      name: rawName,
      phone: cleanPhone,
      status: 'pending'
    });
  }

  if (contacts.length === 0) {
    showToast('Nenhum número de telefone válido encontrado no CSV.', 'error');
    return;
  }

  bulkContactsList = contacts;
  if (elements.csvFilenameText) elements.csvFilenameText.textContent = `${filename} (${contacts.length} contatos)`;
  if (elements.csvDropZone) elements.csvDropZone.classList.add('hidden');
  if (elements.csvLoadedBadge) elements.csvLoadedBadge.classList.remove('hidden');
  if (elements.csvPreviewContainer) elements.csvPreviewContainer.classList.remove('hidden');
  if (elements.csvContactsCount) elements.csvContactsCount.textContent = contacts.length;

  renderCSVPreviewTable();
  renderBulkPreview();
  showToast(`${contacts.length} contatos carregados com sucesso!`, 'success');
}

function renderCSVPreviewTable() {
  if (!elements.csvContactsTbody) return;
  let html = '';
  bulkContactsList.forEach((c) => {
    let statusBadge = '<span style="color: var(--text-secondary);">Pendente</span>';
    if (c.status === 'sent') {
      statusBadge = '<span style="color: var(--success); font-weight: 600;">Enviado ✔️</span>';
    } else if (c.status === 'error') {
      statusBadge = '<span style="color: var(--danger); font-weight: 600;">Erro ❌</span>';
    } else if (c.status === 'processing') {
      statusBadge = '<span style="color: var(--primary-color); font-weight: 600;">Enviando...</span>';
    }

    html += `
      <tr id="csv-row-${c.index}">
        <td>${c.index}</td>
        <td><strong>${c.name}</strong></td>
        <td><code>${c.phone}</code></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  });
  elements.csvContactsTbody.innerHTML = html;
}

function renderBulkPreview() {
  if (!elements.bulkMessagePreviewText) return;

  const firstContact = bulkContactsList.length > 0 ? bulkContactsList[0] : { name: 'João Silva', phone: '+5511999999999' };
  let template = elements.bulkMessageTemplate?.value || '';

  if (!template) {
    elements.bulkMessagePreviewText.innerHTML = '<em>Digite uma mensagem acima para visualizar...</em>';
    return;
  }

  const greeting = getDynamicGreeting();
  let preview = template;

  if (!preview.includes('{saudacao}')) {
    preview = `${greeting}, {nome}!\n` + preview;
  }

  preview = preview.split('{saudacao}').join(greeting);
  preview = preview.split('{nome}').join(firstContact.name);
  preview = preview.split('{telefone}').join(firstContact.phone);

  elements.bulkMessagePreviewText.textContent = preview;
}

async function handleStartBulkSubmit() {
  if (isBulkRunning) return;

  const accountId = elements.bulkChatAccount.value;
  const inboxId = elements.bulkChatInbox.value;
  const template = elements.bulkMessageTemplate.value.trim();

  if (!accountId || !inboxId) {
    showToast('Selecione a Conta e a Caixa de Entrada.', 'error');
    return;
  }

  if (bulkContactsList.length === 0) {
    showToast('Carregue um arquivo CSV com os contatos.', 'error');
    return;
  }

  if (!template) {
    showToast('Digite a mensagem a ser enviada.', 'error');
    return;
  }

  const minDelaySec = parseInt(elements.bulkDelayMin.value, 10) || 15;
  const maxDelaySec = parseInt(elements.bulkDelayMax.value, 10) || 30;
  const batchPauseSec = parseInt(elements.bulkBatchPause.value, 10) || 60;

  isBulkRunning = true;
  isBulkPaused = false;
  isBulkCancelled = false;

  elements.btnStartBulk.classList.add('hidden');
  elements.btnPauseBulk.classList.remove('hidden');
  elements.btnCancelBulk.classList.remove('hidden');
  elements.bulkExecutionArea.classList.remove('hidden');
  elements.btnPauseBulk.textContent = '⏸️ Pausar';
  if (elements.bulkLogBox) elements.bulkLogBox.innerHTML = '';

  addBulkLog('🚀 Iniciando fila de envio em massa...', 'info');

  let sentCount = 0;
  let errorCount = 0;
  const total = bulkContactsList.length;

  for (let i = 0; i < total; i++) {
    if (isBulkCancelled) {
      addBulkLog('🛑 Envio em massa cancelado pelo usuário.', 'error');
      break;
    }

    while (isBulkPaused) {
      if (elements.bulkTimerLabel) elements.bulkTimerLabel.textContent = 'Pausado ⏸️';
      await new Promise(r => setTimeout(r, 500));
      if (isBulkCancelled) break;
    }

    if (isBulkCancelled) break;

    const contact = bulkContactsList[i];
    contact.status = 'processing';
    renderCSVPreviewTable();

    const rowEl = document.getElementById(`csv-row-${contact.index}`);
    if (rowEl) rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const greeting = getDynamicGreeting();
    let msgText = template;
    if (!msgText.includes('{saudacao}')) {
      msgText = `${greeting}, {nome}!\n` + msgText;
    }
    msgText = msgText.split('{saudacao}').join(greeting);
    msgText = msgText.split('{nome}').join(contact.name);
    msgText = msgText.split('{telefone}').join(contact.phone);

    addBulkLog(`[${i + 1}/${total}] Enviando para ${contact.name} (${contact.phone})...`, 'info');

    try {
      // 1. Search or create contact
      const searchRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(contact.phone)}`);
      let cId = null;

      if (searchRes && searchRes.payload && searchRes.payload.length > 0) {
        cId = searchRes.payload[0].id;
      } else {
        const createRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts`, {
          method: 'POST',
          body: JSON.stringify({ name: contact.name, phone_number: contact.phone })
        });
        cId = createRes?.payload?.contact?.id;
      }

      if (!cId) throw new Error('Não foi possível obter ID do contato.');

      // 2. Link to inbox
      try {
        await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${cId}/contact_inboxes`, {
          method: 'POST',
          body: JSON.stringify({ inbox_id: parseInt(inboxId), source_id: contact.phone })
        });
      } catch (err) {
        // Inbox link exists
      }

      // 3. Find or create conversation
      let convId = null;
      try {
        const convsRes = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${cId}/conversations`);
        const convs = Array.isArray(convsRes) ? convsRes : (convsRes?.payload || null);
        if (Array.isArray(convs)) {
          const active = convs.find(c => String(c.inbox_id) === String(inboxId) && c.status !== 'resolved');
          if (active) convId = active.id;
        }
      } catch (e) {}

      if (!convId) {
        const newConvRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations`, {
          method: 'POST',
          body: JSON.stringify({ contact_id: parseInt(cId), inbox_id: parseInt(inboxId), status: 'open' })
        });
        convId = newConvRes?.id;
      }

      if (!convId) throw new Error('Não foi possível abrir a conversa.');

      // 4. Send Message
      await chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: msgText, message_type: 'outgoing', private: false })
      });

      contact.status = 'sent';
      sentCount++;
      addBulkLog(`✔️ Enviado com sucesso para ${contact.name}!`, 'success');

    } catch (err) {
      console.error('Bulk send error for contact:', contact, err);
      contact.status = 'error';
      errorCount++;
      addBulkLog(`❌ Erro no envio para ${contact.name}: ${err.message}`, 'error');
    }

    renderCSVPreviewTable();
    const progressPct = Math.round(((i + 1) / total) * 100);
    if (elements.bulkProgressFill) elements.bulkProgressFill.style.width = `${progressPct}%`;
    if (elements.bulkProgressLabel) {
      elements.bulkProgressLabel.textContent = `Enviando: ${i + 1} / ${total} (${sentCount} sucessos, ${errorCount} erros)`;
    }

    if (i === total - 1) break;

    // Pauses & delays
    if ((i + 1) % 10 === 0 && batchPauseSec > 0) {
      addBulkLog(`🛡️ Pausa de segurança Meta/WhatsApp: aguardando ${batchPauseSec}s...`, 'info');
      await runCountdownTimer(batchPauseSec, 'Pausa de segurança Meta');
    } else {
      const randomDelay = Math.floor(Math.random() * (maxDelaySec - minDelaySec + 1)) + minDelaySec;
      addBulkLog(`⏳ Aguardando ${randomDelay}s (Delay anti-bloqueio)...`, 'info');
      await runCountdownTimer(randomDelay, 'Próximo envio');
    }
  }

  isBulkRunning = false;
  elements.btnStartBulk.classList.remove('hidden');
  elements.btnPauseBulk.classList.add('hidden');
  elements.btnCancelBulk.classList.add('hidden');
  if (elements.bulkTimerLabel) {
    elements.bulkTimerLabel.textContent = isBulkCancelled ? 'Cancelado' : 'Concluído! 🎉';
  }

  if (!isBulkCancelled) {
    showToast(`Envio em massa concluído! ${sentCount} mensagens enviadas.`, 'success');
  }
}

async function runCountdownTimer(seconds, label) {
  for (let s = seconds; s > 0; s--) {
    if (isBulkCancelled) return;
    while (isBulkPaused) {
      if (elements.bulkTimerLabel) elements.bulkTimerLabel.textContent = 'Pausado ⏸️';
      await new Promise(r => setTimeout(r, 500));
      if (isBulkCancelled) return;
    }
    if (elements.bulkTimerLabel) elements.bulkTimerLabel.textContent = `${label}: ${s}s`;
    await new Promise(r => setTimeout(r, 1000));
  }
}

function togglePauseBulk() {
  isBulkPaused = !isBulkPaused;
  if (isBulkPaused) {
    if (elements.btnPauseBulk) elements.btnPauseBulk.textContent = '▶️ Retomar';
    addBulkLog('⏸️ Disparos em massa pausados pelo usuário.', 'info');
  } else {
    if (elements.btnPauseBulk) elements.btnPauseBulk.textContent = '⏸️ Pausar';
    addBulkLog('▶️ Disparos em massa retomados.', 'info');
  }
}

function cancelBulkExecution() {
  if (confirm('Tem certeza que deseja cancelar os envios restantes em massa?')) {
    isBulkCancelled = true;
    isBulkPaused = false;
    elements.btnStartBulk.classList.remove('hidden');
    elements.btnPauseBulk.classList.add('hidden');
    elements.btnCancelBulk.classList.add('hidden');
    if (elements.bulkTimerLabel) elements.bulkTimerLabel.textContent = 'Cancelado 🛑';
  }
}

function addBulkLog(msg, type = 'info') {
  if (!elements.bulkLogBox) return;
  const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const item = document.createElement('div');
  item.className = `bulk-log-item ${type}`;
  item.textContent = `[${timeStr}] ${msg}`;
  elements.bulkLogBox.appendChild(item);
  elements.bulkLogBox.scrollTop = elements.bulkLogBox.scrollHeight;
}

// TOAST UTILITIES
let toastTimeout;
function showToast(message, type = 'success') {
  clearTimeout(toastTimeout);
  
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast ${type}`;
  
  // Show toast
  elements.toast.classList.remove('hidden');
  
  // Hide toast after 3.5 seconds
  toastTimeout = setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3500);
}

// ==========================================
// NOTIFICATION CENTER FUNCTIONS
// ==========================================

function loadNotifications() {
  chrome.storage.sync.get(['chatwootNotifications'], (result) => {
    try {
      const list = result.chatwootNotifications || [];
      
      if (!Array.isArray(list)) {
        console.warn('[Chatwoot Helper] Saved notifications is not an array:', list);
        elements.notificationsList.innerHTML = `
          <div class="empty-state">
            <h3>Erro de Dados</h3>
            <p>Os dados de notificações salvos são inválidos. Clique em "Limpar Todas" para redefinir.</p>
          </div>
        `;
        return;
      }

      const unreadList = list.filter(item => item && !item.read);
      const unreadCount = unreadList.length;

      // Update Badge in Popup Tab
      if (unreadCount > 0) {
        elements.notificationBadge.textContent = unreadCount;
        elements.notificationBadge.classList.remove('hidden');
        elements.btnClearAllNotifications.classList.remove('hidden');
      } else {
        elements.notificationBadge.classList.add('hidden');
        elements.btnClearAllNotifications.classList.add('hidden');
      }

      elements.notificationsList.innerHTML = '';

      if (list.length === 0) {
        elements.notificationsList.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <h3>Nenhuma mensagem pendente</h3>
            <p>Tudo limpo por aqui! Novas mensagens recebidas serão exibidas nesta central.</p>
          </div>
        `;
        return;
      }

      // GROUP MESSAGES BY CONVERSATION
      const grouped = {};
      list.forEach(item => {
        if (!item || !item.conversationId) return;
        const key = `${item.accountId || 'default'}_${item.conversationId}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountId: item.accountId || '',
            conversationId: item.conversationId,
            inboxId: item.inboxId || '',
            senderName: item.senderName || 'Cliente',
            latestTimestamp: item.timestamp || Date.now(),
            messages: []
          };
        }
        grouped[key].messages.push(item);
        if (item.timestamp && item.timestamp > grouped[key].latestTimestamp) {
          grouped[key].latestTimestamp = item.timestamp;
        }
      });

      const groupedList = Object.values(grouped);
      // Sort so conversations with the newest messages show first
      groupedList.sort((a, b) => b.latestTimestamp - a.latestTimestamp);

      groupedList.forEach(group => {
        const card = document.createElement('div');
        card.className = 'notification-card';
        
        // Calculate relative time for the latest message
        const timeStr = formatRelativeTime(group.latestTimestamp);

        // Sort messages within the conversation chronologically (oldest first)
        group.messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Render individual message bubbles
        let bubblesHtml = '<div class="notification-bubbles-list">';
        group.messages.forEach(msg => {
          if (msg) {
            bubblesHtml += `<div class="notification-bubble">${msg.content || 'Nova mensagem (mídia/anexo)'}</div>`;
          }
        });
        bubblesHtml += '</div>';

        card.innerHTML = `
          <div class="notification-header">
            <div class="notification-sender">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              ${group.senderName}
            </div>
            <span class="notification-time">${timeStr}</span>
          </div>
          
          ${bubblesHtml}
          
          <div class="notification-meta">
            <span>Conversa: #${group.conversationId} <span class="inbox-name-badge" data-acc="${group.accountId}" data-inbox="${group.inboxId}"></span></span>
            <div class="notification-actions">
              <button class="btn-action-icon open" title="Abrir no Chatwoot" data-acc="${group.accountId}" data-conv="${group.conversationId}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </button>
              <button class="btn-action-icon delete" title="Excluir Notificações" data-acc="${group.accountId}" data-conv="${group.conversationId}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          
          <div class="notification-reply-wrapper">
            <form class="reply-form" data-acc="${group.accountId}" data-conv="${group.conversationId}">
              <input type="text" class="reply-input" placeholder="Digite uma resposta rápida..." required>
              <button type="submit" class="btn-reply-send">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                Responder
              </button>
            </form>
          </div>
        `;

        // Connect button actions safely
        const btnOpen = card.querySelector('.btn-action-icon.open');
        if (btnOpen) {
          btnOpen.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            openNotificationConversation(btn.getAttribute('data-acc'), btn.getAttribute('data-conv'));
          });
        }

        const btnDel = card.querySelector('.btn-action-icon.delete');
        if (btnDel) {
          btnDel.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            deleteConversationNotifications(btn.getAttribute('data-acc'), btn.getAttribute('data-conv'));
          });
        }

        const replyForm = card.querySelector('.reply-form');
        if (replyForm) {
          replyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const input = form.querySelector('.reply-input');
            const btn = form.querySelector('.btn-reply-send');
            sendQuickReply(
              form.getAttribute('data-acc'),
              form.getAttribute('data-conv'),
              input,
              btn
            );
          });
        }

        elements.notificationsList.appendChild(card);
      });
      resolveInboxNames();
    } catch (err) {
      console.error('[Chatwoot Helper] Error in loadNotifications:', err);
      elements.notificationsList.innerHTML = `
        <div class="empty-state">
          <h3>Erro ao Carregar</h3>
          <p>Ocorreu um erro ao renderizar as mensagens pendentes: ${err.message}</p>
        </div>
      `;
    }
  });
}

function formatTimestampToLocalDatetime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
}

function formatRelativeTime(timestamp) {
  if (!timestamp || isNaN(Number(timestamp))) return 'data desconhecida';
  
  const diffMs = Date.now() - timestamp;
  if (isNaN(diffMs)) return 'data desconhecida';
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  
  // Default date format
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'data desconhecida';
  return date.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function deleteConversationNotifications(accountId, conversationId) {
  chrome.storage.sync.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    const filteredList = list.filter(item => 
      !(item.accountId == accountId && item.conversationId == conversationId)
    );
    chrome.storage.sync.set({ chatwootNotifications: filteredList }, () => {
      // Update action badge
      chrome.action.setBadgeText({ text: filteredList.length > 0 ? String(filteredList.length) : '' });
      loadNotifications();
    });
  });
}

function clearAllNotifications() {
  chrome.storage.sync.set({ chatwootNotifications: [] }, () => {
    chrome.action.setBadgeText({ text: '' });
    loadNotifications();
    showToast('Todas as notificações limpas.', 'success');
  });
}

function openNotificationConversation(accountId, conversationId) {
  if (!config.url) return;
  const targetUrl = `${config.url}/app/accounts/${accountId}/conversations/${conversationId}`;
  
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(targetUrl));
    
    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true });
      chrome.windows.update(existingTab.windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
    
    // Remove notifications for this conversation after opening
    deleteConversationNotifications(accountId, conversationId);
  });
}

async function sendQuickReply(accountId, conversationId, inputEl, buttonEl) {
  const replyText = inputEl.value.trim();
  if (!replyText) return;

  inputEl.disabled = true;
  buttonEl.disabled = true;
  const originalText = buttonEl.innerHTML;
  buttonEl.innerHTML = 'Enviando...';

  try {
    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    await chatwootFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        content: replyText,
        message_type: 'outgoing',
        private: false
      })
    });

    showToast('Resposta enviada com sucesso!', 'success');
    notifyMessageSent(conversationId, accountId);
    
    // Remove notifications for this conversation on success
    deleteConversationNotifications(accountId, conversationId);
  } catch (err) {
    console.error('Error sending quick reply:', err);
    showToast(`Erro ao enviar: ${err.message}`, 'error');
    inputEl.disabled = false;
    buttonEl.disabled = false;
    buttonEl.innerHTML = originalText;
  }
}

async function sendReminderReply(accountId, conversationId, inputEl, buttonEl) {
  const replyText = inputEl.value.trim();
  if (!replyText) return;

  inputEl.disabled = true;
  buttonEl.disabled = true;
  const originalText = buttonEl.innerHTML;
  buttonEl.innerHTML = 'Enviando...';

  try {
    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    await chatwootFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        content: replyText,
        message_type: 'outgoing',
        private: false
      })
    });

    showToast('Resposta enviada com sucesso!', 'success');
    notifyMessageSent(conversationId, accountId);
    inputEl.value = ''; // Clean input field
  } catch (err) {
    console.error('Error sending reminder reply:', err);
    showToast(`Erro ao enviar: ${err.message}`, 'error');
  } finally {
    inputEl.disabled = false;
    buttonEl.disabled = false;
    buttonEl.innerHTML = originalText;
  }
}

// INBOX NAMES RESOLVER HELPERS
async function getInboxName(accountId, inboxId) {
  if (!accountId || !inboxId) return '';
  const cacheKey = `inboxName_${accountId}_${inboxId}`;
  
  // Try to read from storage
  const cached = await new Promise(resolve => {
    chrome.storage.local.get([cacheKey], res => resolve(res[cacheKey]));
  });
  
  if (cached) {
    return cached;
  }
  
  // If not cached, fetch all inboxes for this account and cache them
  try {
    const response = await chatwootFetch(`/api/v1/accounts/${accountId}/inboxes`);
    const inboxes = response && Array.isArray(response) ? response : (response && Array.isArray(response.payload) ? response.payload : null);
    if (inboxes && Array.isArray(inboxes)) {
      let targetName = '';
      const cacheObj = {};
      inboxes.forEach(inbox => {
        const key = `inboxName_${accountId}_${inbox.id}`;
        cacheObj[key] = inbox.name;
        if (inbox.id == inboxId) {
          targetName = inbox.name;
        }
      });
      // Save all to storage
      chrome.storage.local.set(cacheObj);
      return targetName;
    }
  } catch (err) {
    console.error('Error fetching inboxes for cache:', err);
  }
  
  return '';
}

function getInboxColorStyles(inboxName) {
  const str = String(inboxName);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Consistent color hue based on inbox name (using HSL)
  const hue = Math.abs(hash) % 360;
  
  return {
    bg: `hsla(${hue}, 65%, 45%, 0.18)`,
    border: `hsla(${hue}, 65%, 50%, 0.35)`,
    text: `hsl(${hue}, 85%, 72%)`
  };
}

function resolveInboxNames() {
  const elementsToResolve = document.querySelectorAll('.inbox-name-badge:not(.resolved)');
  elementsToResolve.forEach(async (el) => {
    const accId = el.getAttribute('data-acc');
    const inboxId = el.getAttribute('data-inbox');
    if (accId && inboxId) {
      el.classList.add('resolved');
      const name = await getInboxName(accId, inboxId);
      if (name) {
        el.textContent = name.toUpperCase();
        
        // Generate and apply dynamic HSL color styles based on inbox name
        const colors = getInboxColorStyles(name);
        el.style.backgroundColor = colors.bg;
        el.style.color = colors.text;
        el.style.borderColor = colors.border;
        el.style.borderStyle = 'solid';
        el.style.borderWidth = '1px';
        el.style.padding = '1px 6px';
        el.style.borderRadius = '4px';
        el.style.fontSize = '9px';
        el.style.fontWeight = '700';
        el.style.marginLeft = '6px';
        el.style.display = 'inline-block';
        el.style.letterSpacing = '0.02em';
      }
    }
  });
}

// LOOKUP CONTACT BY PHONE
let isSearchingContact = false;

async function lookupContactByPhone() {
  const phoneRaw = elements.newChatPhone.value.trim();
  const accountId = elements.newChatAccount.value;
  
  if (!phoneRaw || !accountId || isSearchingContact) {
    return;
  }
  
  const digits = phoneRaw.replace(/\D/g, '');
  if (digits.length < 8) {
    return; // Ignore inputs that are too short
  }

  isSearchingContact = true;
  
  // Create or get helper element for phone search status
  let searchHelper = document.getElementById('new-chat-phone-search-status');
  if (!searchHelper) {
    searchHelper = document.createElement('span');
    searchHelper.id = 'new-chat-phone-search-status';
    searchHelper.className = 'helper-text';
    elements.newChatPhone.parentNode.appendChild(searchHelper);
  }
  
  searchHelper.textContent = 'Buscando contato no Chatwoot...';
  searchHelper.className = 'helper-text info-text';
  
  const nameFormGroup = elements.newChatName.closest('.form-group');

  // Build query variations to ensure robust searching
  const searchQueries = [];

  // 1. Raw digits as typed (e.g. 5511999999999 or 11999999999)
  searchQueries.push(digits);

  // 2. Prepend country code if it doesn't already start with it
  const defaultCountry = config.defaultCountryCode ? config.defaultCountryCode.replace(/\D/g, '') : '55';
  if (!digits.startsWith(defaultCountry)) {
    searchQueries.push(`${defaultCountry}${digits}`);
    searchQueries.push(`+${defaultCountry}${digits}`);
  } else {
    // If it already starts with the country code, try with '+'
    searchQueries.push(`+${digits}`);
    
    // Also try the local version (without country code)
    const local = digits.substring(defaultCountry.length);
    if (local.length >= 8) {
      searchQueries.push(local);
    }
  }

  // 3. Special handling for Brazil's 9th digit variation (country code 55)
  if (defaultCountry === '55' || digits.startsWith('55')) {
    let localNumber = digits.startsWith('55') ? digits.substring(2) : digits;

    if (localNumber.length === 11 && localNumber[2] === '9') {
      // It has the 9th digit. Try the 8-digit variation
      const without9th = localNumber.substring(0, 2) + localNumber.substring(3);
      searchQueries.push(without9th);
      searchQueries.push(`55${without9th}`);
      searchQueries.push(`+55${without9th}`);
    } else if (localNumber.length === 10) {
      // It is 8-digit. Try the 9-digit variation
      const with9th = localNumber.substring(0, 2) + '9' + localNumber.substring(2);
      searchQueries.push(with9th);
      searchQueries.push(`55${with9th}`);
      searchQueries.push(`+55${with9th}`);
    }
  }

  const uniqueQueries = [...new Set(searchQueries)];
  let contactFound = null;

  try {
    // Perform sequential search queries until we find a match
    for (const query of uniqueQueries) {
      const response = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(query)}`);
      if (response && response.payload && response.payload.length > 0) {
        contactFound = response.payload[0];
        break; // Stop on first match!
      }
    }
    
    if (contactFound) {
      // Contact found!
      elements.newChatName.value = contactFound.name || '';
      
      // Hide the name input container since contact exists
      nameFormGroup.classList.add('hidden');
      
      searchHelper.innerHTML = `✓ Contato encontrado: <strong style="color:var(--success);">${contactFound.name}</strong> (Nome preenchido automaticamente)`;
      searchHelper.className = 'helper-text success-text';
    } else {
      // Contact not found!
      elements.newChatName.value = '';
      
      // Show the name input container so they can type
      nameFormGroup.classList.remove('hidden');
      
      searchHelper.textContent = 'Novo contato. Digite o nome dele abaixo.';
      searchHelper.className = 'helper-text';
    }
  } catch (err) {
    console.error('Error searching contact:', err);
    searchHelper.textContent = 'Erro ao verificar número na API.';
    searchHelper.className = 'helper-text warning-text';
    
    // Fallback: show the name field so the user can input it manually
    nameFormGroup.classList.remove('hidden');
  } finally {
    isSearchingContact = false;
  }
}

function updateInboxWarning(selectEl) {
  const selectedOption = selectEl.options[selectEl.selectedIndex];
  const channelType = selectedOption ? selectedOption.getAttribute('data-type') : '';
  
  if (channelType && (channelType.includes('WebWidget') || channelType.includes('Email'))) {
    elements.inboxWarning.classList.remove('hidden');
  } else {
    elements.inboxWarning.classList.add('hidden');
  }
}

// ==========================================
// CONVERSATIONS & CHAT THREAD FUNCTIONS
// ==========================================

function extractConversationsArray(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.payload)) return response.payload;
  if (response.payload && Array.isArray(response.payload.conversations)) return response.payload.conversations;
  if (Array.isArray(response.conversations)) return response.conversations;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.conversations)) return response.data.conversations;

  // Search all keys of the object for an array
  for (const key of Object.keys(response)) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
    if (response[key] && typeof response[key] === 'object') {
      for (const subKey of Object.keys(response[key])) {
        if (Array.isArray(response[key][subKey])) {
          return response[key][subKey];
        }
      }
    }
  }
  return [];
}

async function loadConversations() {
  if (!config.url || !config.token) {
    elements.chatsList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
        <h3>Configurações Ausentes</h3>
        <p>Por favor, vá para a aba de Ajustes e configure sua URL e Token da API.</p>
      </div>
    `;
    return;
  }

  elements.chatsList.innerHTML = '<div style="text-align:center; padding: 20px; color:var(--text-secondary);">Carregando conversas...</div>';

  try {
    let accountId = config.defaultAccount;
    if (!accountId) {
      const profile = await chatwootFetch('/api/v1/profile');
      if (profile && profile.accounts && profile.accounts.length > 0) {
        accountId = profile.accounts[0].id;
      }
    }

    if (!accountId) {
      elements.chatsList.innerHTML = `
        <div class="empty-state">
          <h3>Nenhuma Conta Encontrada</h3>
          <p>Não foi possível encontrar uma conta válida para o seu perfil.</p>
        </div>
      `;
      return;
    }

    currentAccountId = accountId;
    
    // Always load open conversations to populate the cache for badges + new/progress filters
    const openRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations?status=open&assignee_type=all`);
    openConversationsCache = extractConversationsArray(openRes);

    // For resolved filter, also load resolved conversations
    if (activeChatFilter === 'resolved') {
      const resolvedRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations?status=resolved&assignee_type=all`);
      fetchedConversations = extractConversationsArray(resolvedRes);
    } else {
      // For new/progress filters, use the open conversations cache
      fetchedConversations = openConversationsCache;
    }
    
    fetchedConversations.sort((a, b) => {
      if (!a || !b) return 0;
      const timeA = a.last_activity_at || a.timestamp || 0;
      const timeB = b.last_activity_at || b.timestamp || 0;
      return timeB - timeA;
    });

    // Calculate unread total for Em Atendimento (In Progress / Open)
    let progressUnreadCount = 0;
    openConversationsCache.forEach(item => {
      if (item && item.unread_count > 0 && item.status !== 'resolved') {
        progressUnreadCount += item.unread_count;
      }
    });

    updateFilterBadges(progressUnreadCount);

    filterAndRenderConversations();
  } catch (err) {
    console.error('Error loading conversations:', err);
    elements.chatsList.innerHTML = `
      <div class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <h3>Erro ao Carregar</h3>
        <p>${err.message || 'Erro ao conectar à API do Chatwoot.'}</p>
      </div>
    `;
  }
}

function filterAndRenderConversations() {
  try {
    const query = elements.chatsSearchInput.value.trim().toLowerCase();
    
    // Decide which source array to use based on active filter
    let sourceConversations;
    if (activeChatFilter === 'resolved') {
      // For resolved: use fetchedConversations (contains resolved ones when that tab is active)
      sourceConversations = fetchedConversations.filter(item => item && item.status === 'resolved');
    } else {
      // For new/progress: prefer openConversationsCache (always open convs)
      // Fall back to fetchedConversations if cache is still empty (e.g. first load race condition)
      const openSource = openConversationsCache.length > 0 ? openConversationsCache : fetchedConversations;
      sourceConversations = openSource.filter(item => item && item.status !== 'resolved');
    }

    const filtered = sourceConversations.filter(item => {
      if (!item) return false;
      
      if (!query) return true;
      const contactName = (item.meta?.sender?.name || '').toLowerCase();
      const lastMsgContent = (Array.isArray(item.messages) && item.messages.length > 0 ? item.messages[item.messages.length - 1]?.content || '' : '').toLowerCase();
      return contactName.includes(query) || lastMsgContent.includes(query);
    });

    renderConversationsList(filtered, currentAccountId);
  } catch (err) {
    console.error('Error filtering conversations:', err);
    elements.chatsList.innerHTML = `
      <div class="empty-state">
        <h3>Erro ao Renderizar</h3>
        <p>Ocorreu um erro ao filtrar as conversas: ${err.message}</p>
      </div>
    `;
  }
}

function getAvatarContent(contactName, avatarUrl) {
  const initials = contactName ? contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
  if (avatarUrl) {
    let fullUrl = avatarUrl;
    if (!fullUrl.startsWith('http')) {
      const baseUrl = (config.url || '').endsWith('/') ? config.url.slice(0, -1) : (config.url || '');
      const relativeUrl = avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl;
      fullUrl = baseUrl + relativeUrl;
    }
    return `<img src="${fullUrl}" alt="${contactName}" data-initials="${initials}" />`;
  }
  return initials;
}

function getCurrentlyOpenConversationIds() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const openIds = new Set();
      if (Array.isArray(tabs)) {
        tabs.forEach(tab => {
          if (tab.url && tab.url.includes('convId=')) {
            try {
              const url = new URL(tab.url);
              const cid = url.searchParams.get('convId');
              if (cid) openIds.add(String(cid));
            } catch (e) {}
          }
        });
      }
      resolve(openIds);
    });
  });
}

async function renderConversationsList(conversations, accountId) {
  try {
    if (!elements.chatsList) return;

    if (conversations.length === 0) {
      elements.chatsList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <h3>Nenhuma Conversa</h3>
          <p>Não há conversas abertas correspondentes ao filtro atual.</p>
        </div>
      `;
      return;
    }

    const openIds = await getCurrentlyOpenConversationIds();
    const validIds = new Set(conversations.map(c => String(c.id)));

    // Clean up loading indicators, empty states, or non-chat-item elements
    Array.from(elements.chatsList.children).forEach(child => {
      if (!child.classList.contains('chat-item')) {
        child.remove();
      } else {
        const cardId = child.getAttribute('data-id');
        if (cardId && !validIds.has(cardId)) {
          child.remove();
        }
      }
    });

    conversations.forEach(item => {
      if (!item) return;

      const strId = String(item.id);
      const isOpenWindow = openIds.has(strId);

      if (isOpenWindow) {
        item.unread_count = 0; // Force 0 unread when open in window
      }

      const contactName = item.meta?.sender?.name || 'Cliente';
      const avatarUrl = item.meta?.sender?.avatar_url;
      const avatarContent = getAvatarContent(contactName, avatarUrl);
      
      const lastMsgObj = Array.isArray(item.messages) && item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
      let lastMsgText = 'Nova conversa criada';
      if (lastMsgObj) {
        lastMsgText = lastMsgObj.content || 'Nova mensagem (mídia/anexo)';
      }

      const timestamp = item.last_activity_at || item.timestamp;
      const timeStr = timestamp ? formatRelativeTime(timestamp * 1000) : '';

      const isUnread = !isOpenWindow && item.unread_count > 0;

      let itemClass = 'chat-item';
      if (isOpenWindow) {
        itemClass += ' window-active';
      } else if (isUnread) {
        itemClass += ' unread';
      }

      const badgeHtml = isOpenWindow 
        ? `<span class="chat-item-open-tag" title="Conversa aberta em uma janela flutuante">🌐 Aberta</span>`
        : (isUnread ? `<span class="chat-item-badge">${item.unread_count}</span>` : '');

      const existingCard = elements.chatsList.querySelector(`[data-id="${strId}"]`);

      if (existingCard) {
        // SMOOTH IN-PLACE DOM RECONCILIATION (NO FLICKER)
        if (existingCard.className !== itemClass) {
          existingCard.className = itemClass;
        }

        const nameEl = existingCard.querySelector('.chat-item-name');
        if (nameEl && nameEl.textContent !== contactName) nameEl.textContent = contactName;

        const timeEl = existingCard.querySelector('.chat-item-time');
        if (timeEl && timeEl.textContent !== timeStr) timeEl.textContent = timeStr;

        const msgEl = existingCard.querySelector('.chat-item-msg');
        if (msgEl && msgEl.textContent !== lastMsgText) msgEl.textContent = lastMsgText;

        const metaEl = existingCard.querySelector('.chat-item-meta');
        if (metaEl) {
          const oldBadge = metaEl.querySelector('.chat-item-open-tag, .chat-item-badge');
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = badgeHtml;
          const newBadge = tempContainer.firstElementChild;

          if (oldBadge) {
            if (newBadge) {
              if (oldBadge.outerHTML !== newBadge.outerHTML) {
                oldBadge.replaceWith(newBadge);
              }
            } else {
              oldBadge.remove();
            }
          } else if (newBadge) {
            metaEl.appendChild(newBadge);
          }
        }
      } else {
        // Create new card if not existing
        const card = document.createElement('div');
        card.className = itemClass;
        card.setAttribute('data-id', strId);
        card.innerHTML = `
          <div class="chat-item-avatar">${avatarContent}</div>
          <div class="chat-item-content">
            <div class="chat-item-top">
              <span class="chat-item-name">${contactName}</span>
              <span class="chat-item-time">${timeStr}</span>
            </div>
            <div class="chat-item-bottom">
              <span class="chat-item-msg">${lastMsgText}</span>
              <div class="chat-item-meta">
                <span class="chat-item-inbox inbox-name-badge" data-acc="${accountId}" data-inbox="${item.inbox_id}"></span>
                ${badgeHtml}
              </div>
            </div>
          </div>
        `;

        card.addEventListener('click', () => {
          openConversationInWindow(item.id, contactName, accountId, item.inbox_id);
        });

        elements.chatsList.appendChild(card);
      }
    });

    updateUnreadBadgeLocal();
    resolveInboxNames();
  } catch (err) {
    console.error('Error rendering conversations list:', err);
  }
}

function updateUnreadBadgeLocal() {
  // Always use openConversationsCache (always open convs, regardless of active filter)
  const source = Array.isArray(openConversationsCache) && openConversationsCache.length > 0
    ? openConversationsCache
    : (Array.isArray(fetchedConversations) ? fetchedConversations : []);
  
  let totalUnread = 0;
  source.forEach(item => {
    if (item && item.unread_count && item.status !== 'resolved') {
      totalUnread += item.unread_count;
    }
  });
  
  chrome.action.setBadgeText({ text: totalUnread > 0 ? String(totalUnread) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' });

  // Update filter chip badges using the open conversations cache
  let progressUnread = 0;
  source.forEach(item => {
    if (item && item.unread_count > 0 && item.status !== 'resolved') {
      progressUnread += item.unread_count;
    }
  });
  updateFilterBadges(progressUnread);
}

function updateFilterBadges(progressCount) {
  const badgeProgress = document.getElementById('badge-filter-progress');

  if (badgeProgress) {
    if (progressCount > 0) {
      badgeProgress.textContent = progressCount;
      badgeProgress.classList.remove('hidden');
    } else {
      badgeProgress.classList.add('hidden');
    }
  }
}
// ==========================================
// ACTIVE OPEN CONVERSATION TRACKER
// ==========================================

let activeOpenConversationsCache = {};
let activeConversationHeartbeat = null;

function startActiveConversationHeartbeat(convId) {
  if (!convId) return;
  stopActiveConversationHeartbeat();

  const updateStorage = () => {
    chrome.storage.local.get(['activeOpenConversations'], (res) => {
      const activeMap = res.activeOpenConversations || {};
      activeMap[convId] = Date.now();
      
      const now = Date.now();
      for (const id in activeMap) {
        if (now - activeMap[id] > 30000) {
          delete activeMap[id];
        }
      }
      chrome.storage.local.set({ activeOpenConversations: activeMap });
    });
  };

  updateStorage();
  activeConversationHeartbeat = setInterval(updateStorage, 4000);
}

function stopActiveConversationHeartbeat(convId) {
  if (activeConversationHeartbeat) {
    clearInterval(activeConversationHeartbeat);
    activeConversationHeartbeat = null;
  }
  const idToRemove = convId || (currentActiveChat ? currentActiveChat.id : null);
  if (idToRemove) {
    chrome.storage.local.get(['activeOpenConversations'], (res) => {
      const activeMap = res.activeOpenConversations || {};
      delete activeMap[idToRemove];
      chrome.storage.local.set({ activeOpenConversations: activeMap });
    });
  }
}

function openConversationChat(conversationId, contactName, accountId, inboxId) {
  startActiveConversationHeartbeat(conversationId);
  switchTab('chats');
  // Collapse formatting toolbar and emoji picker by default
  const chatFormatToolbar = document.getElementById('chat-format-toolbar');
  if (chatFormatToolbar) chatFormatToolbar.classList.add('hidden');
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');
  if (btnToggleToolbar) btnToggleToolbar.classList.remove('active');
  const emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) emojiPicker.classList.add('hidden');

  currentActiveChat = {
    id: conversationId,
    contactName: contactName,
    accountId: accountId,
    inboxId: inboxId
  };

  currentChatMessages = [];
  hasOlderMessages = false;
  isLoadingOlderMessages = false;
  lastRenderedRawHtml = '';

  elements.chatHeaderName.textContent = contactName;
  
  let avatarUrl = '';
  if (Array.isArray(fetchedConversations)) {
    const conversation = fetchedConversations.find(c => c && c.id === conversationId);
    if (conversation) {
      avatarUrl = conversation.meta?.sender?.avatar_url || '';
    }
  }

  elements.chatHeaderAvatar.innerHTML = getAvatarContent(contactName, avatarUrl);

  if (!avatarUrl) {
    chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}`)
      .then(conv => {
        if (conv && conv.meta?.sender?.avatar_url && currentActiveChat && currentActiveChat.id === conversationId) {
          elements.chatHeaderAvatar.innerHTML = getAvatarContent(contactName, conv.meta.sender.avatar_url);
        }
      }).catch(err => console.warn('Could not fetch conversation avatar:', err));
  }

  elements.chatHeaderMeta.textContent = 'Carregando caixa de entrada...';
  
  getInboxName(accountId, inboxId).then(inboxName => {
    if (inboxName && currentActiveChat && currentActiveChat.id === conversationId) {
      elements.chatHeaderMeta.textContent = inboxName;
    }
  });

  // Mark conversation as read in Chatwoot
  chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}/update_last_seen`, {
    method: 'POST'
  }).catch(err => {
    console.error('Error marking conversation as read:', err);
  });

  // Update local model unread count in BOTH caches
  [fetchedConversations, openConversationsCache].forEach(arr => {
    if (Array.isArray(arr)) {
      const conversation = arr.find(c => c && c.id === conversationId);
      if (conversation) conversation.unread_count = 0;
    }
  });
  updateUnreadBadgeLocal();

  // Instantly remove unread visual indicators from the DOM
  const chatItemEl = elements.chatsList.querySelector(`.chat-item[data-id="${conversationId}"]`);
  if (chatItemEl) {
    chatItemEl.classList.remove('unread');
    const badgeEl = chatItemEl.querySelector('.chat-item-badge');
    if (badgeEl) {
      badgeEl.remove();
    }
  }

  elements.chatMessagesArea.innerHTML = '<div style="text-align:center; padding: 20px; color:var(--text-secondary);">Carregando histórico...</div>';

  // Default status button to checkmark (Finalizar)
  updateChatStatusUI('open');

  // Fetch conversation metadata to get the actual status (open vs resolved)
  chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}`)
    .then(convData => {
      if (convData && currentActiveChat && currentActiveChat.id === conversationId) {
        currentActiveChat.status = convData.status;
        updateChatStatusUI(convData.status);
      }
    })
    .catch(err => {
      console.warn('Could not fetch conversation status:', err);
    });

  elements.chatsListView.classList.add('hidden');
  elements.chatsDetailView.classList.remove('hidden');

  // Persist open conversation state
  saveNavigationState({
    activeTab: 'chats',
    openConversationId: conversationId,
    openContactName: contactName,
    openAccountId: accountId,
    openInboxId: inboxId
  });

  loadChatMessages(accountId, conversationId);

  if (chatPollInterval) {
    clearInterval(chatPollInterval);
  }
  chatPollInterval = setInterval(() => {
    if (currentActiveChat && currentActiveChat.id === conversationId) {
      loadChatMessages(accountId, conversationId, true);
    }
  }, 4000);
}

function openAppInWindow() {
  chrome.tabs.query({}, (tabs) => {
    const existing = tabs.find(t => t.url && t.url.includes('mode=standaloneApp'));
    if (existing) {
      chrome.windows.update(existing.windowId, { focused: true });
      chrome.tabs.update(existing.id, { active: true });
      window.close();
    } else {
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html?mode=standaloneApp'),
        type: 'popup',
        width: 420,
        height: 600,
        focused: true
      }, () => {
        window.close();
      });
    }
  });
}

function openConversationInWindow(conversationId, contactName, accountId, inboxId) {
  const strConvId = String(conversationId);
  startActiveConversationHeartbeat(strConvId);
  
  // Clean unread status in BOTH caches instantly for a premium responsive feel
  const clearUnread = (arr) => {
    if (!Array.isArray(arr)) return;
    const conversation = arr.find(c => c && String(c.id) === strConvId);
    if (conversation) {
      conversation.unread_count = 0;
    }
  };
  clearUnread(fetchedConversations);
  clearUnread(openConversationsCache);
  updateUnreadBadgeLocal();

  if (elements.chatsList) {
    const card = elements.chatsList.querySelector(`[data-id="${conversationId}"]`);
    if (card) {
      card.classList.remove('unread');
      card.classList.add('window-active');
      const badge = card.querySelector('.chat-item-badge');
      if (badge) {
        badge.remove();
      }
    }
  }

  // Update last seen API call immediately
  chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}/update_last_seen`, {
    method: 'POST'
  }).then(() => {
    chrome.runtime.sendMessage({ action: 'conversationRead' }).catch(() => {});
  }).catch(err => {
    console.error('Error marking conversation as read on click:', err);
  });

  // DUAL CHECK TO PREVENT DUPLICATE WINDOWS ACROSS ALL PROFILES:
  chrome.storage.local.get(['openConversationWindows'], (res) => {
    const winMap = res.openConversationWindows || {};
    const winInfo = winMap[strConvId];

    if (winInfo && winInfo.windowId && winInfo.tabId) {
      chrome.windows.get(winInfo.windowId, (existingWin) => {
        if (!chrome.runtime.lastError && existingWin) {
          chrome.tabs.update(winInfo.tabId, { active: true }).catch(() => {});
          chrome.windows.update(winInfo.windowId, { focused: true }).catch(() => {});
          return; // Focused existing window! STOP!
        }
        
        // Stale mapping -> remove & fallback to tab query
        delete winMap[strConvId];
        chrome.storage.local.set({ openConversationWindows: winMap });
        findTabAndFocusOrCreate();
      });
    } else {
      findTabAndFocusOrCreate();
    }

    function findTabAndFocusOrCreate() {
      chrome.tabs.query({}, (tabs) => {
        const existingTab = Array.isArray(tabs) && tabs.find(tab => {
          const u = tab.url || tab.pendingUrl || '';
          return u.includes(`convId=${strConvId}`);
        });

        if (existingTab) {
          chrome.tabs.update(existingTab.id, { active: true }).catch(() => {});
          chrome.windows.update(existingTab.windowId, { focused: true }).catch(() => {});
        } else {
          const url = chrome.runtime.getURL(`popup.html?convId=${conversationId}&contactName=${encodeURIComponent(contactName)}&accountId=${accountId}&inboxId=${inboxId || ''}`);
          chrome.windows.create({
            url: url,
            type: 'popup',
            width: 380,
            height: 560,
            focused: true
          });
        }
      });
    }
  });
}

async function loadChatMessages(accountId, conversationId, silent = false, beforeId = null) {
  try {
    let endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    if (beforeId) {
      endpoint += `?before=${beforeId}`;
    }
    
    const response = await chatwootFetch(endpoint);
    const messages = Array.isArray(response) ? response : (response?.payload || []);
    
    if (beforeId) {
      if (messages.length < 20) {
        hasOlderMessages = false;
      } else {
        hasOlderMessages = true;
      }
      
      messages.forEach(msg => {
        if (!currentChatMessages.some(m => m.id === msg.id)) {
          currentChatMessages.push(msg);
        }
      });
    } else {
      if (currentChatMessages.length === 0) {
        currentChatMessages = [...messages];
        if (messages.length >= 20) {
          hasOlderMessages = true;
        } else {
          hasOlderMessages = false;
        }
      } else {
        messages.forEach(newMsg => {
          const existingIdx = currentChatMessages.findIndex(m => m.id === newMsg.id);
          if (existingIdx !== -1) {
            currentChatMessages[existingIdx] = newMsg;
          } else {
            currentChatMessages.push(newMsg);
          }
        });
      }
    }
    
    currentChatMessages.sort((a, b) => {
      const timeA = a.created_at || 0;
      const timeB = b.created_at || 0;
      return timeA - timeB;
    });

    renderChatMessages(currentChatMessages, silent, beforeId !== null);
  } catch (err) {
    console.error('Error loading chat messages:', err);
    if (!silent && currentChatMessages.length === 0) {
      elements.chatMessagesArea.innerHTML = `<div style="text-align:center; padding:20px; color:var(--danger);">Erro ao carregar mensagens: ${err.message}</div>`;
    }
  }
}

async function loadOlderMessages() {
  if (isLoadingOlderMessages || !currentActiveChat) return;
  
  const oldestMsg = currentChatMessages[0];
  if (!oldestMsg) return;
  
  isLoadingOlderMessages = true;
  
  const btn = document.getElementById('btn-load-older');
  if (btn) {
    btn.disabled = true;
    const spinner = btn.querySelector('.spinner');
    if (spinner) spinner.classList.remove('hidden');
  }
  
  try {
    await loadChatMessages(currentActiveChat.accountId, currentActiveChat.id, true, oldestMsg.id);
  } catch (err) {
    console.error('Error loading older messages:', err);
    showToast('Erro ao carregar mensagens anteriores.', 'error');
  } finally {
    isLoadingOlderMessages = false;
    if (btn) {
      btn.disabled = false;
      const spinner = btn.querySelector('.spinner');
      if (spinner) spinner.classList.add('hidden');
    }
  }
}

function renderChatMessages(messages, silent, isPrepend = false) {
  const oldScrollHeight = elements.chatMessagesArea.scrollHeight;
  const oldScrollTop = elements.chatMessagesArea.scrollTop;
  const isNearBottom = oldScrollHeight - oldScrollTop - elements.chatMessagesArea.clientHeight < 150;
  let messagesHtml = '';

  // Prepended load button HTML
  if (hasOlderMessages) {
    messagesHtml += `
      <div class="load-older-container" style="text-align: center; padding: 10px 0;">
        <button type="button" id="btn-load-older" class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 6px 12px; margin: 0 auto; display: flex; align-items: center; gap: 6px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="spinner hidden"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
          Carregar mensagens anteriores
        </button>
      </div>
    `;
  }

  const reactionsMap = {};
  const activeMessages = messages.filter(msg => {
    const parentId = msg.parent_id || (msg.content_attributes && msg.content_attributes.in_reply_to);
    
    // In Chatwoot, reactions can have a content_attributes.is_reaction flag or contain a single emoji as a reply
    const isSingleEmoji = msg.content && msg.content.length <= 8 && isEmojiString(msg.content);
    const isReaction = (msg.content_attributes && (msg.content_attributes.is_reaction || msg.content_attributes.reaction || msg.content_attributes.reaction_type)) || (isSingleEmoji && parentId);

    if (isReaction && parentId) {
      const pId = parentId;
      reactionsMap[pId] = reactionsMap[pId] || [];
      
      // Prevent duplicate emojis from the same sender to look clean
      const senderName = msg.sender ? msg.sender.name : (msg.message_type === 0 || msg.message_type === 'incoming' ? (currentTabInfo.contactName || 'Contato') : 'Você');
      const alreadyReacted = reactionsMap[pId].some(r => r.sender === senderName && r.emoji === msg.content);
      if (!alreadyReacted) {
        reactionsMap[pId].push({
          id: msg.id,
          emoji: msg.content,
          sender: senderName
        });
      }
      return false; // Exclude reaction message from chat bubbles listing
    }
    return true; // Keep standard messages
  });
  
  if (activeMessages.length === 0) {
    messagesHtml = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Nenhuma mensagem nesta conversa.</div>';
  } else {
    activeMessages.forEach(msg => {
      const type = msg.message_type;
      
      let bubbleClass = 'chat-msg-bubble';
      if (type === 0 || type === 'incoming') {
        bubbleClass += ' incoming';
      } else if (type === 1 || type === 'outgoing' || type === 3 || type === 'template') {
        bubbleClass += ' outgoing';
      } else {
        bubbleClass += ' activity';
      }

      let timeStr = '';
      if (msg.created_at) {
        const date = new Date(msg.created_at * 1000);
        timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }

      let contentHtml = '';
      if (msg.content) {
        contentHtml = `<span class="chat-msg-text">${formatWhatsAppMarkdown(msg.content)}</span>`;
      }

      // Render attachments (images, video players, audio players, files)
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          const filename = att.file_name || (att.data_url ? att.data_url.split('/').pop() : 'arquivo');
          
          if (att.file_type === 'image') {
            contentHtml += `
              <div class="msg-attachment image-attachment" style="margin-top: 4px;">
                <img src="${att.data_url}" alt="Imagem" class="chat-img-preview" style="max-width: 100%; max-height: 180px; border-radius: 6px; cursor: pointer; object-fit: cover;" data-filename="${filename}">
              </div>
            `;
          } else if (att.file_type === 'video') {
            contentHtml += `
              <div class="msg-attachment video-attachment" style="margin-top: 4px; position: relative;">
                <video src="${att.data_url}" controls class="chat-video-preview" style="max-width: 100%; max-height: 180px; border-radius: 6px; display: block;"></video>
                <button type="button" class="btn-video-fullscreen" data-url="${att.data_url}" data-filename="${filename}" style="position: absolute; top: 6px; right: 6px; background: rgba(10,15,30,0.7); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;" title="Tela Cheia">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                </button>
              </div>
            `;
          } else if (att.file_type === 'audio') {
            contentHtml += `
              <div class="msg-attachment audio-attachment" style="margin-top: 4px; min-width: 185px; display: flex; align-items: center; gap: 6px;">
                <audio src="${att.data_url}" controls class="chat-audio-preview" style="flex: 1; height: 28px;"></audio>
                <button type="button" class="btn-audio-speed" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 10px; font-size: 9.5px; padding: 2px 4px; cursor: pointer; font-weight: bold; flex-shrink: 0; min-width: 26px; line-height: 1; text-align: center;">1x</button>
              </div>
            `;
          } else {
            contentHtml += `
              <div class="msg-attachment file-attachment" style="margin-top: 6px;">
                <a href="#" class="chat-file-download-link" data-url="${att.data_url}" data-filename="${filename}" style="display: flex; align-items: center; gap: 6px; color: var(--success); text-decoration: none; font-size: 11px; background: var(--bg-tertiary); padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Visualizar Documento
                </a>
              </div>
            `;
          }
        });
      }

      // If both text and attachments are empty, show empty message placeholder
      if (!msg.content && (!msg.attachments || msg.attachments.length === 0)) {
        contentHtml = `<span class="chat-msg-text" style="font-style: italic; color: var(--text-muted);">Mensagem vazia/anexo indisponível</span>`;
      }

      let quoteHtml = '';
      const parentId = msg.parent_id || (msg.content_attributes && msg.content_attributes.in_reply_to);
      let parentMsg = msg.parent_message;
      if (!parentMsg && parentId) {
        parentMsg = messages.find(m => m.id == parentId);
      }

      if (parentMsg) {
        let senderName = 'Agente';
        if (parentMsg.sender) {
          senderName = parentMsg.sender.name || 'Contato';
        } else if (parentMsg.message_type === 0 || parentMsg.message_type === 'incoming') {
          senderName = currentTabInfo.contactName || 'Contato';
        } else {
          senderName = 'Você';
        }
        quoteHtml = `
          <div class="chat-msg-reply-quote" data-target-id="${parentMsg.id || parentId}" style="cursor: pointer;">
            <span class="reply-quote-sender">${senderName}</span>
            <span class="reply-quote-text">${parentMsg.content || 'Mensagem de Mídia/Anexo'}</span>
          </div>
        `;
      }

      if (bubbleClass.includes('activity')) {
        messagesHtml += `
          <div class="chat-msg-row activity">
            <div class="${bubbleClass}">
              ${contentHtml}
            </div>
          </div>
        `;
      } else {
        const senderName = msg.sender ? msg.sender.name : (type === 0 || type === 'incoming' ? (currentTabInfo.contactName || 'Contato') : 'Você');
        const cleanContent = (msg.content || '').replace(/"/g, '&quot;');
        
        let reactionsHtml = '';
        if (reactionsMap[msg.id] && reactionsMap[msg.id].length > 0) {
          reactionsHtml = `
            <div class="chat-msg-reactions">
              ${reactionsMap[msg.id].map(r => `<span class="chat-msg-reaction-item" title="Reagido por ${r.sender}">${r.emoji}</span>`).join('')}
            </div>
          `;
        }

        let linkPreviewHtml = '';
        if (msg.content) {
          const urlMatch = msg.content.match(/(https?:\/\/[^\s]+)/);
          if (urlMatch) {
            // Strip any trailing punctuation (like brackets, quotes, dots) from match
            let url = urlMatch[0];
            if (url.endsWith('.') || url.endsWith(',') || url.endsWith(')') || url.endsWith(']')) {
              url = url.slice(0, -1);
            }
            linkPreviewHtml = `<div class="link-preview-container" data-url="${url}"></div>`;
          }
        }

        // Differentiate color for other agents
        const senderId = msg.sender ? msg.sender.id : null;
        let agentColorClass = '';
        const isOutgoing = type === 1 || type === 'outgoing' || type === 3 || type === 'template';
        if (isOutgoing) {
          if (senderId && currentUserId && senderId !== currentUserId) {
            const colorIndex = Math.abs(senderId) % 4;
            agentColorClass = ` agent-color-${colorIndex}`;
          }
        }

        // Generate avatar HTML
        let avatarUrl = msg.sender?.avatar_url || '';
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
          const relativeUrl = avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl;
          avatarUrl = baseUrl + relativeUrl;
        }

        const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
        const avatarHtml = avatarUrl
          ? `<img src="${avatarUrl}" class="chat-msg-sender-avatar" title="${senderName}" alt="${senderName}" data-initials="${initials}" />`
          : `<div class="chat-msg-sender-avatar-initials" title="${senderName}">${initials}</div>`;

        if (isOutgoing) {
          messagesHtml += `
            <div class="chat-msg-row outgoing">
              <div class="${bubbleClass}${agentColorClass}" data-msg-id="${msg.id}" data-msg-content="${cleanContent}" data-sender-name="${senderName}">
                <button type="button" class="btn-msg-menu" title="Opções da mensagem">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                ${quoteHtml}
                ${contentHtml}
                ${linkPreviewHtml}
                ${reactionsHtml}
                <span class="chat-msg-time">${timeStr}</span>
              </div>
              ${avatarHtml}
            </div>
          `;
        } else {
          messagesHtml += `
            <div class="chat-msg-row incoming">
              ${avatarHtml}
              <div class="${bubbleClass}" data-msg-id="${msg.id}" data-msg-content="${cleanContent}" data-sender-name="${senderName}">
                <button type="button" class="btn-msg-menu" title="Opções da mensagem">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                ${quoteHtml}
                ${contentHtml}
                ${linkPreviewHtml}
                ${reactionsHtml}
                <span class="chat-msg-time">${timeStr}</span>
              </div>
            </div>
          `;
        }
      }
    });
  }

  if (lastRenderedRawHtml !== messagesHtml) {
    lastRenderedRawHtml = messagesHtml;
    // Check if any audio or video player is currently active/playing to avoid cutting it off
    const playingMedias = elements.chatMessagesArea.querySelectorAll('audio, video');
    const isAnyPlaying = Array.from(playingMedias).some(media => !media.paused && media.currentTime > 0 && !media.ended);
    
    if (isAnyPlaying) {
      return; // Defer DOM update until playback finishes or pauses
    }

    elements.chatMessagesArea.innerHTML = messagesHtml;
    
    // Bind load events to all media elements so that when they finish loading, we scroll down if needed
    elements.chatMessagesArea.querySelectorAll('img, video, audio').forEach(media => {
      if (media.tagName.toLowerCase() === 'img') {
        media.addEventListener('load', () => scrollToBottom());
      } else {
        media.addEventListener('loadedmetadata', () => scrollToBottom());
      }
    });

    // Bind load older button event listener
    const btnLoadOlder = document.getElementById('btn-load-older');
    if (btnLoadOlder) {
      btnLoadOlder.addEventListener('click', loadOlderMessages);
    }

    // Load link previews asynchronously
    loadLinkPreviews();

    if (isPrepend) {
      const newScrollHeight = elements.chatMessagesArea.scrollHeight;
      elements.chatMessagesArea.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
    } else if (!silent || isNearBottom) {
      scrollToBottom(true);
    } else {
      scrollToBottom();
    }
  } else {
    // Even if innerHTML is identical, make sure previews load if any container is empty
    loadLinkPreviews();
  }
}

function closeChatView() {
  if (isChatWindowMode) {
    stopActiveConversationHeartbeat(currentActiveChat?.id);
    window.close();
    return;
  }
  stopActiveConversationHeartbeat(currentActiveChat?.id);
  lastRenderedRawHtml = '';
  if (chatPollInterval) {
    clearInterval(chatPollInterval);
    chatPollInterval = null;
  }
  currentActiveChat = null;
  cancelMessageReply();
  cancelMessageEdit();
  elements.chatReplyInput.value = '';
  
  // Collapse formatting toolbar and emoji picker
  const chatFormatToolbar = document.getElementById('chat-format-toolbar');
  if (chatFormatToolbar) chatFormatToolbar.classList.add('hidden');
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');
  if (btnToggleToolbar) btnToggleToolbar.classList.remove('active');
  const emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) emojiPicker.classList.add('hidden');

  elements.chatsDetailView.classList.add('hidden');
  elements.chatsListView.classList.remove('hidden');

  // Clear open conversation from state, stay on chats tab
  saveNavigationState({ activeTab: 'chats', openConversationId: null });

  loadConversations();
}

function createReminderFromActiveChat() {
  if (!currentActiveChat) return;

  const { id: conversationId, accountId, contactName, inboxId } = currentActiveChat;

  // Pre-populate currentTabInfo with active chat data to bypass browser tab URL checking
  currentTabInfo.isChatwootConv = true;
  currentTabInfo.accountId = accountId;
  currentTabInfo.conversationId = conversationId;
  currentTabInfo.contactName = contactName;
  currentTabInfo.inboxId = inboxId || '';
  currentTabInfo.url = `${config.url}/app/accounts/${accountId}/conversations/${conversationId}`;

  // Update DOM fields in the reminder widget
  elements.currentConvDisplay.querySelector('.conv-id').textContent = `ID: #${conversationId}`;
  elements.currentConvDisplay.querySelector('.conv-url').textContent = currentTabInfo.url;
  elements.saveContactInfo.innerHTML = `Contato: <span class="highlight">${contactName}</span>`;
  elements.saveTitle.value = `Retornar com ${contactName}`;

  // Reset fields
  elements.saveNotes.value = '';
  elements.saveAlarmEnable.checked = false;
  elements.saveAlarmDatetimeWrapper.classList.add('hidden');
  elements.saveAlarmDatetime.value = '';
  activeTags = [];
  renderTags();

  // Show form, hide warning
  elements.notChatwootWarning.classList.add('hidden');
  elements.saveCurrentForm.classList.remove('hidden');

  // Switch to Reminders tab
  switchTab('reminders');

  // Expand the quick reminder section
  const quickReminderSection = document.getElementById('quick-reminder-section');
  if (quickReminderSection) {
    quickReminderSection.classList.remove('hidden');
  }

  // Focus title input
  elements.saveTitle.focus();
}

async function resolveCurrentConversation() {
  if (!currentActiveChat) return;

  const { id: conversationId, accountId, contactName, status } = currentActiveChat;
  
  const isResolved = status === 'resolved';
  const actionText = isResolved ? 'reabrir' : 'finalizar';
  const newStatus = isResolved ? 'open' : 'resolved';

  if (!confirm(`Deseja realmente ${actionText} a conversa com ${contactName}?`)) {
    return;
  }

  const btnResolve = document.getElementById('btn-chat-resolve');
  if (btnResolve) btnResolve.disabled = true;

  try {
    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_status`;
    await chatwootFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus })
    });

    showToast(`Conversa ${isResolved ? 'reaberta' : 'finalizada'} com sucesso!`, 'success');
    notifyConversationStatusChanged(conversationId, newStatus);
    
    if (isChatWindowMode) {
      if (newStatus === 'resolved') {
        window.close();
      } else {
        currentActiveChat.status = 'open';
        updateChatStatusUI('open');
      }
    } else {
      if (newStatus === 'resolved') {
        closeChatView();
      } else {
        currentActiveChat.status = 'open';
        updateChatStatusUI('open');
      }
    }
  } catch (err) {
    console.error(`Error toggling conversation status:`, err);
    showToast(`Erro ao ${actionText} conversa: ${err.message}`, 'error');
  } finally {
    if (btnResolve) btnResolve.disabled = false;
  }
}

function updateChatStatusUI(status) {
  const btnResolve = document.getElementById('btn-chat-resolve');
  if (!btnResolve) return;

  if (status === 'resolved') {
    btnResolve.title = 'Reabrir Conversa';
    btnResolve.style.color = 'var(--warning)';
    btnResolve.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
    `;
  } else {
    btnResolve.title = 'Finalizar Conversa';
    btnResolve.style.color = 'var(--success)';
    btnResolve.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    `;
  }
}

async function sendChatMessage(e) {
  e.preventDefault();
  
  if (!currentActiveChat) return;
  const replyText = elements.chatReplyInput.value.trim();
  
  // Prevent sending empty messages
  if (!replyText && pendingAttachments.length === 0) return;

  const { id: conversationId, accountId } = currentActiveChat;
  
  elements.chatReplyInput.disabled = true;
  const sendBtn = elements.chatReplyBar.querySelector('button[type="submit"]');
  if (sendBtn) sendBtn.disabled = true;

  try {
    if (editParentMessageId) {
      // Step 1: Delete/Revoke original message
      const deleteEndpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages/${editParentMessageId}`;
      await chatwootFetch(deleteEndpoint, {
        method: 'DELETE'
      });

      // Step 2: Send new message with corrected text set as reply to the deleted message
      const sendEndpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
      await chatwootFetch(sendEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          content: replyText,
          message_type: 'outgoing',
          private: false,
          parent_id: editParentMessageId,
          content_attributes: {
            in_reply_to: editParentMessageId
          }
        })
      });

      elements.chatReplyInput.value = '';
      elements.chatReplyInput.style.height = 'auto'; // Reset textarea height
      cancelMessageEdit();
      await loadChatMessages(accountId, conversationId, true);
      notifyMessageSent(conversationId, accountId);
      return;
    }

    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    
    let bodyData;
    if (pendingAttachments.length > 0) {
      bodyData = new FormData();
      bodyData.append('message_type', 'outgoing');
      bodyData.append('private', 'false');
      bodyData.append('content', replyText || ''); // Always append content parameter
      if (replyParentMessageId) {
        bodyData.append('parent_id', replyParentMessageId);
        bodyData.append('content_attributes[in_reply_to]', replyParentMessageId);
      }
      pendingAttachments.forEach(file => {
        bodyData.append('attachments[]', file, file.name);
      });
    } else {
      const payload = {
        content: replyText,
        message_type: 'outgoing',
        private: false
      };
      if (replyParentMessageId) {
        payload.parent_id = replyParentMessageId;
        payload.content_attributes = {
          in_reply_to: replyParentMessageId
        };
      }
      bodyData = JSON.stringify(payload);
    }

    await chatwootFetch(endpoint, {
      method: 'POST',
      body: bodyData
    });

    elements.chatReplyInput.value = '';
    elements.chatReplyInput.style.height = 'auto'; // Reset textarea height
    
    // Clear pending attachments & replies
    pendingAttachments = [];
    renderAttachmentsPreview();
    cancelMessageReply();
    
    notifyMessageSent(conversationId, accountId);
    await loadChatMessages(accountId, conversationId, true);
  } catch (err) {
    console.error('Error sending message:', err);
    showToast(`Erro ao enviar: ${err.message}`, 'error');
  } finally {
    elements.chatReplyInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    elements.chatReplyInput.focus();
  }
}

// ==========================================
// EMOJI & TEXT FORMATTING SYSTEM
// ==========================================

const EMOJI_CATEGORIES = {
  recent: { name: 'Recentes', icon: '🕒', list: [] },
  smileys: {
    name: 'Smileys e pessoas',
    icon: '😀',
    list: [
      { char: '😀', keywords: 'sorriso alegre feliz risada smile happy face' },
      { char: '😃', keywords: 'sorriso alegre feliz risada smile happy face' },
      { char: '😄', keywords: 'sorriso alegre feliz risada smile happy face' },
      { char: '😁', keywords: 'sorriso dentes alegre feliz risada smile happy face' },
      { char: '😆', keywords: 'sorriso riso alegre feliz risada smile happy face' },
      { char: '😅', keywords: 'suor frio alegre feliz risada smile sweat happy' },
      { char: '😂', keywords: 'chorar de rir chorando gargalhada riso cry laugh tears' },
      { char: '🤣', keywords: 'rolar de rir gargalhada riso cry laugh rofl' },
      { char: '😊', keywords: 'sorriso corado timido feliz smile blush happy' },
      { char: '😇', keywords: 'anjo inocente feliz angel halo' },
      { char: '🙂', keywords: 'sorriso leve smile slight' },
      { char: '🙃', keywords: 'cabeça para baixo invertido upside down' },
      { char: '😉', keywords: 'piscando piscadela wink' },
      { char: '😌', keywords: 'aliviado calmo relived calm' },
      { char: '😍', keywords: 'olhos de coraçao amor apaixonado love eyes heart' },
      { char: '🥰', keywords: 'apaixonado amor coraçao love face hearts' },
      { char: '😘', keywords: 'beijo coraçao amor kiss blow' },
      { char: '😗', keywords: 'beijo kiss' },
      { char: '😙', keywords: 'beijo kiss smile eyes' },
      { char: '😚', keywords: 'beijo fechado kiss closed eyes' },
      { char: '😋', keywords: 'delicioso gostoso comida nham yum tongue delicious' },
      { char: '😛', keywords: 'lingua smile tongue' },
      { char: '😝', keywords: 'lingua fechada tongue closed eyes' },
      { char: '😜', keywords: 'lingua piscando wink tongue' },
      { char: '🤪', keywords: 'louco zangado crazy goofy' },
      { char: '🤨', keywords: 'sobrancelha desconfiado raised eyebrow' },
      { char: '🧐', keywords: 'monoculo intelectual monocle' },
      { char: '🤓', keywords: 'nerd inteligente nerd' },
      { char: '😎', keywords: 'oculos escuros legal descolado cool sunglasses' },
      { char: '🤩', keywords: 'estrela olhos star eyes' },
      { char: '🥳', keywords: 'festa comemoraçao party celebrate' },
      { char: '😏', keywords: 'sorriso malicioso safado smirk' },
      { char: '😒', keywords: 'descontente chateado unamused' },
      { char: '😞', keywords: 'decepcionado triste disappointed sad' },
      { char: '😔', keywords: 'pensativo triste pensive sad' },
      { char: '😟', keywords: 'preocupado triste worried sad' },
      { char: '😕', keywords: 'confuso confused' },
      { char: '🙁', keywords: 'triste slight frown' },
      { char: '☹️', keywords: 'muito triste frown' },
      { char: '😣', keywords: 'perseverante persevering' },
      { char: '😖', keywords: 'confuso chateado confounded' },
      { char: '😫', keywords: 'cansado tired' },
      { char: '😩', keywords: 'exausto weary' },
      { char: '🥺', keywords: 'pedinte implorando fofo plead eyes' },
      { char: '😢', keywords: 'choro triste lagrima cry sad tear' },
      { char: '😭', keywords: 'choro alto desespero lagrimas cry loud sob' },
      { char: '😤', keywords: 'triunfo raiva sopro steam nose' },
      { char: '😠', keywords: 'bravo com raiva angry' },
      { char: '😡', keywords: 'muito bravo com raiva vermelho pout angry' },
      { char: '🤬', keywords: 'xingando palavrao boca angry swear symbols' },
      { char: '🤯', keywords: 'mente explodindo cabeca explode mind' },
      { char: '😳', keywords: 'corado surpreso vergonha flushed' },
      { char: '🥵', keywords: 'calor quente vermelho hot sweat' },
      { char: '🥶', keywords: 'frio azul congelado cold ice' },
      { char: '😱', keywords: 'panico grito susto medo scream fear' },
      { char: '😨', keywords: 'medo temeroso fearful' },
      { char: '😰', keywords: 'preocupado suor azul anxious sweat' },
      { char: '😥', keywords: 'alivio triste lagrima sad relieved' },
      { char: '😓', keywords: 'suor frio desapontado sweat' },
      { char: '🤗', keywords: 'abraço hug' },
      { char: '🤔', keywords: 'pensando duvida thinking' },
      { char: '🤭', keywords: 'risada mao na boca hand mouth' },
      { char: '🤫', keywords: 'silencio shush quiet' },
      { char: '🤥', keywords: 'mentiroso pinocquio liar nose' },
      { char: '😐', keywords: 'neutro neutral' },
      { char: '😑', keywords: 'sem expressao expressionless' },
      { char: '😬', keywords: 'careta tenso grimace' },
      { char: '🙄', keywords: 'olhos rolando desdem roll eyes' },
      { char: '😴', keywords: 'dormindo zzz sleep' },
      { char: '💩', keywords: 'coco bosta poop shit' },
      { char: 'ghost', keywords: 'fantasma ghost halloween' },
      { char: '💀', keywords: 'caveira morte skull death' },
      { char: '👽', keywords: 'alien et alien extraterrestrial' },
      { char: '🤖', keywords: 'robo robot' }
    ]
  },
  gestures: {
    name: 'Mãos e gestos',
    icon: '👋',
    list: [
      { char: '👋', keywords: 'tchau aceno wave hand hello' },
      { char: '🤚', keywords: 'mao levantada costas backhand raised' },
      { char: '🖐️', keywords: 'mao aberta dedos espalmados hand fingers' },
      { char: '✋', keywords: 'mao aberta parar stop hand' },
      { char: '🖖', keywords: 'saudaçao vulcana spock live long prosper' },
      { char: '👌', keywords: 'ok combinado perfeito correct' },
      { char: '✌️', keywords: 'paz amor vitoria victory peace' },
      { char: '🤞', keywords: 'dedos cruzados sorte crossed fingers luck' },
      { char: '🤟', keywords: 'te amo amor love rock' },
      { char: '🤘', keywords: 'rock chifrinho metal sign' },
      { char: '🤙', keywords: 'liga nois telefone shaka call' },
      { char: '👈', keywords: 'apontar esquerda point left' },
      { char: '👉', keywords: 'apontar direita point right' },
      { char: '👆', keywords: 'apontar cima point up' },
      { char: '👇', keywords: 'apontar baixo point down' },
      { char: '👍', keywords: 'joia positivo sim curti like thumb up' },
      { char: '👎', keywords: 'descurti negativo nao deslike thumb down' },
      { char: '✊', keywords: 'punho levantado poder fist power' },
      { char: '👊', keywords: 'soco punho fist punch' },
      { char: '👏', keywords: 'palmas bater palmas parabens clap hands' },
      { char: '🙌', keywords: 'maos para cima comemorar celebration hands' },
      { char: '👐', keywords: 'maos abertas open hands' },
      { char: '🤲', keywords: 'maos juntas rezar oferta palms together' },
      { char: '🤝', keywords: 'aperto de mao acordo handshake trust' },
      { char: '🙏', keywords: 'por favor obrigado rezar oraçao pray please' },
      { char: '💪', keywords: 'muque forte braço força biceps flex strength' }
    ]
  },
  animals: {
    name: 'Animais e natureza',
    icon: '🐾',
    list: [
      { char: '🐶', keywords: 'cachorro cao dog pup' },
      { char: '🐱', keywords: 'gato felino cat' },
      { char: '🐭', keywords: 'rato mouse' },
      { char: '🐹', keywords: 'hamster' },
      { char: '🐰', keywords: 'coelho rabbit bunny' },
      { char: '🦊', keywords: 'raposa fox' },
      { char: ' Bear Bear', keywords: 'urso bear' },
      { char: '🐼', keywords: 'panda' },
      { char: '🦁', keywords: 'leao lion' },
      { char: '🐮', keywords: 'vaca cow' },
      { char: '🐷', keywords: 'porco pig' },
      { char: '🐸', keywords: 'sapo frog' },
      { char: '🐒', keywords: 'macaco monkey' },
      { char: '🐔', keywords: 'galinha chicken' },
      { char: '🐧', keywords: 'pinguim penguin' },
      { char: '🐦', keywords: 'passaro bird' },
      { char: '🐤', keywords: 'pintinho baby chick' },
      { char: '🦆', keywords: 'pato duck' },
      { char: '🦅', keywords: 'aguia eagle' },
      { char: '🦉', keywords: 'coruja owl' },
      { char: '🐺', keywords: 'lobo wolf' },
      { char: '🐝', keywords: 'abelha bee insect' },
      { char: '🐛', keywords: 'lagarta worm bug' },
      { char: '🦋', keywords: 'borboleta butterfly' },
      { char: '🐌', keywords: 'caracol snail' },
      { char: '🐞', keywords: 'joaninha ladybug' },
      { char: '🐜', keywords: 'formiga ant' },
      { char: '🕷️', keywords: 'aranha spider' },
      { char: '🦂', keywords: 'escorpiao scorpion' },
      { char: '🐢', keywords: 'tartaruga turtle' },
      { char: '🐍', keywords: 'cobra serpent snake' },
      { char: '🐙', keywords: 'polvo octopus' },
      { char: '🦑', keywords: 'lula squid' },
      { char: '🦐', keywords: 'camarao shrimp' },
      { char: '🦀', keywords: 'caranguejo crab' },
      { char: '🐠', keywords: 'peixe tropical fish' },
      { char: '🐟', keywords: 'peixe fish' },
      { char: '🐬', keywords: 'golfinho dolphin' },
      { char: '🐳', keywords: 'baleia whale' },
      { char: '🦈', keywords: 'tubarao shark' },
      { char: '🐊', keywords: 'jacare crocodile alligator' },
      { char: '🐅', keywords: 'tigre tiger' },
      { char: '🐆', keywords: 'leopardo leopard' },
      { char: '🐘', keywords: 'elefante elephant' },
      { char: '🦒', keywords: 'girafa giraffe' },
      { char: '🐐', keywords: 'cabra goat' },
      { char: '🦌', keywords: 'veado deer' },
      { char: '🕊️', keywords: 'pomba paz dove peace' },
      { char: '🌲', keywords: 'pinheiro arvore pine tree' },
      { char: '🌳', keywords: 'arvore deciduous tree' },
      { char: '🌴', keywords: 'palmeira palm tree' },
      { char: '🌱', keywords: 'broto seedling leaf' },
      { char: '🌿', keywords: 'erva herb plant' },
      { char: '🍀', keywords: 'trevo sorte clover luck' },
      { char: '🍁', keywords: 'folha outono maple leaf fall' },
      { char: '🍂', keywords: 'folhas caídas fallen leaves' },
      { char: '🍃', keywords: 'folha ao vento leaf wind' },
      { char: '🌸', keywords: 'flor cerejeira cherry blossom' },
      { char: '🌹', keywords: 'rosa rose flower' },
      { char: '🌺', keywords: 'hibisco hibiscus' },
      { char: '🌻', keywords: 'girassol sunflower' },
      { char: '🌼', keywords: 'flor amarela blossom' },
      { char: '🌷', keywords: 'tulipa tulip' },
      { char: '🍄', keywords: 'cogumelo mushroom' },
      { char: '💐', keywords: 'buque flores bouquet' }
    ]
  },
  food: {
    name: 'Alimentos e bebidas',
    icon: '🍔',
    list: [
      { char: '🍏', keywords: 'maca verde green apple' },
      { char: '🍎', keywords: 'maca vermelha red apple' },
      { char: '🍐', keywords: 'pera pear' },
      { char: '🍊', keywords: 'laranja orange tangerine' },
      { char: '🍋', keywords: 'limao lemon' },
      { char: '🍌', keywords: 'banana' },
      { char: '🍉', keywords: 'melancia watermelon' },
      { char: '🍇', keywords: 'uva grapes' },
      { char: '🍓', keywords: 'morango strawberry' },
      { char: '🍒', keywords: 'cereja cherries' },
      { char: '🍍', keywords: 'abacaxi pineapple' },
      { char: '🥥', keywords: 'coco coconut' },
      { char: '🥑', keywords: 'abacate avocado' },
      { char: '🍆', keywords: 'berinjela eggplant' },
      { char: '🥔', keywords: 'batata potato' },
      { char: '🥕', keywords: 'cenoura carrot' },
      { char: '🌽', keywords: 'milho corn' },
      { char: '🌶️', keywords: 'pimenta hot pepper spicy' },
      { char: '🥦', keywords: 'brocolis broccoli' },
      { char: '🍄', keywords: 'cogumelo mushroom' },
      { char: '🍞', keywords: 'pao bread' },
      { char: '🥐', keywords: 'croissant' },
      { char: '🧀', keywords: 'queijo cheese' },
      { char: '🍖', keywords: 'carne osso meat bone' },
      { char: '🍗', keywords: 'coxa frango poultry leg chicken' },
      { char: '🥩', keywords: 'bife carne steak meat' },
      { char: '🥓', keywords: 'bacon' },
      { char: '🍔', keywords: 'hamburguer burger' },
      { char: '🍟', keywords: 'batata frita french fries' },
      { char: '🍕', keywords: 'pizza' },
      { char: '🌭', keywords: 'cachorro quente hotdog' },
      { char: '🥪', keywords: 'sanduiche sandwich' },
      { char: '🌮', keywords: 'taco' },
      { char: '🍳', keywords: 'ovo frito frigideira cooking egg' },
      { char: '🍲', keywords: 'sopa pote pot food soup' },
      { char: '🥗', keywords: 'salada green salad' },
      { char: '🍿', keywords: 'pipoca popcorn' },
      { char: '🧈', keywords: 'manteiga butter' },
      { char: '🧂', keywords: 'sal salt' },
      { char: '🍣', keywords: 'sushi' },
      { char: '🍛', keywords: 'curry rice' },
      { char: '🍚', keywords: 'arroz cozido cooked rice' },
      { char: '🍜', keywords: 'ramen macarrao noodles soup' },
      { char: '🍝', keywords: 'espaguete pasta spaghetti' },
      { char: '🍩', keywords: 'rosquinha donut' },
      { char: '🍪', keywords: 'cookie biscoito' },
      { char: '🎂', keywords: 'bolo aniversario birthday cake' },
      { char: '🍰', keywords: 'fatia bolo shortcake' },
      { char: '🍫', keywords: 'chocolate bar' },
      { char: '🍬', keywords: 'bala doce candy' },
      { char: '🍭', keywords: 'pirulito lollipop' },
      { char: '🍯', keywords: 'mel honey' },
      { char: '🥛', keywords: 'copo leite milk glass' },
      { char: '☕', keywords: 'cafe quente hot drink coffee tea' },
      { char: '🥤', keywords: 'copo canudo cup straw soda' },
      { char: '🍺', keywords: 'cerveja beer mug' },
      { char: '🍻', keywords: 'brinde cervejas clinking beers toast' },
      { char: '🥂', keywords: 'brinde taças clinking glasses champagne' },
      { char: '🍷', keywords: 'vinho wine glass' },
      { char: '🥃', keywords: 'copo whisky tumbler glass' },
      { char: '🍸', keywords: 'cocktail drink martini' },
      { char: '🍹', keywords: 'drink tropical cocktail' },
      { char: '🍾', keywords: 'espumante champagne bottle' },
      { char: '🧊', keywords: 'gelo ice' }
    ]
  },
  activities: {
    name: 'Atividades',
    icon: '⚽',
    list: [
      { char: '⚽', keywords: 'futebol soccer ball sports' },
      { char: '🏀', keywords: 'basquete basketball' },
      { char: '🏈', keywords: 'futebol americano football' },
      { char: '⚾', keywords: 'beisebol baseball' },
      { char: '🎾', keywords: 'tenis tennis ball' },
      { char: '🏐', keywords: 'volei volleyball' },
      { char: '🏓', keywords: 'ping pong tenis de mesa table tennis' },
      { char: '🎯', keywords: 'alvo dardo bullseye dart' },
      { char: '🎮', keywords: 'video game controle gamepad play' },
      { char: '🎲', keywords: 'dado jogo game die dice' },
      { char: '🧩', keywords: 'quebra cabeça jigsaw puzzle piece' },
      { char: '🛹', keywords: 'skate skateboard' }
    ]
  },
  travel: {
    name: 'Viagens e lugares',
    icon: '🚗',
    list: [
      { char: '🚗', keywords: 'carro automovel car auto' },
      { char: '🚕', keywords: 'taxi' },
      { char: '🚌', keywords: 'onibus bus' },
      { char: '🚓', keywords: 'policia police car' },
      { char: ' ambulances', keywords: 'ambulancia ambulance' },
      { char: '🚒', keywords: 'bombeiro fire engine' },
      { char: '🚚', keywords: 'caminhao delivery truck' },
      { char: '🚲', keywords: 'bicicleta bike bicycle' },
      { char: '🏍️', keywords: 'moto motocicleta motorcycle' },
      { char: '🚨', keywords: 'giroflex sirene police light revolving' },
      { char: '✈️', keywords: 'aviao airplane plane' },
      { char: '🚀', keywords: 'foguete rocket space' },
      { char: '⛵', keywords: 'veleiro sailboat ship' },
      { char: '🚢', keywords: 'navio cargueiro ship' },
      { char: '⚓', keywords: 'ancora anchor' },
      { char: '🌋', keywords: 'vulcao volcano' },
      { char: '⛰️', keywords: 'montanha mountain' },
      { char: '🏕️', keywords: 'camping acampamento tent' },
      { char: '🏖️', keywords: 'praia guarda sol beach umbrella' },
      { char: '🏜️', keywords: 'deserto desert' },
      { char: '🏙️', keywords: 'cidade skyline cityscape' },
      { char: '🏠', keywords: 'casa house' }
    ]
  },
  objects: {
    name: 'Objetos',
    icon: '💡',
    list: [
      { char: '⌚', keywords: 'relogio pulso watch time' },
      { char: '📱', keywords: 'celular smartphone mobile' },
      { char: '💻', keywords: 'notebook computador laptop' },
      { char: '⌨️', keywords: 'teclado keyboard' },
      { char: '📷', keywords: 'camera camera photo' },
      { char: '📺', keywords: 'televisao tv television' },
      { char: '🎙️', keywords: 'microfone estúdio studio microphone' },
      { char: '🔋', keywords: 'bateria battery' },
      { char: '🔌', keywords: 'tomada eletrica electric plug' },
      { char: '💡', keywords: 'lampada ideia light bulb idea' },
      { char: '🔦', keywords: 'lanterna flashlight' },
      { char: '🕯️', keywords: 'vela candle' },
      { char: '🗑️', keywords: 'lixo wastebasket trash bin' },
      { char: '💵', keywords: 'dolar dollar bills money' },
      { char: '🪙', keywords: 'moeda coin' },
      { char: '💰', keywords: 'saco dinheiro bag money gold' },
      { char: '💳', keywords: 'cartao credito credit card' },
      { char: '💎', keywords: 'diamante pedra preciosa gem diamond' },
      { char: '🔧', keywords: 'chave inglesa wrench tool' },
      { char: '🔨', keywords: 'martelo hammer tool' },
      { char: '🛠️', keywords: 'ferramentas tools' },
      { char: '⚙️', keywords: 'engrenagem gear cog wheel' },
      { char: '🔫', keywords: 'arma agua pistol water gun' },
      { char: '💣', keywords: 'bomba bomb explosion' },
      { char: '🔪', keywords: 'faca cozinha kitchen knife' },
      { char: '🛡️', keywords: 'escudo shield protection' },
      { char: '🔑', keywords: 'chave key' },
      { char: '🔒', keywords: 'cadeado lock' },
      { char: '✉️', keywords: 'envelope carta email' },
      { char: '✏️', keywords: 'lapis pencil' },
      { char: '🖊️', keywords: 'caneta pen' },
      { char: '📎', keywords: 'clips paperclip' }
    ]
  },
  symbols: {
    name: 'Símbolos',
    icon: '❤️',
    list: [
      { char: '❤️', keywords: 'coraçao vermelho red heart love' },
      { char: '🧡', keywords: 'coraçao laranja orange heart love' },
      { char: '💛', keywords: 'coraçao amarelo yellow heart love' },
      { char: '💚', keywords: 'coraçao verde green heart love' },
      { char: '💙', keywords: 'coraçao azul blue heart love' },
      { char: '💜', keywords: 'coraçao roxo purple heart love' },
      { char: '🖤', keywords: 'coraçao preto black heart' },
      { char: '🤍', keywords: 'coraçao branco white heart' },
      { char: '🤎', keywords: 'coraçao marrom brown heart' },
      { char: '💔', keywords: 'coraçao partido broken heart' },
      { char: '❣️', keywords: 'exclamaçao coraçao heart exclamation' },
      { char: '💕', keywords: 'dois coraçoes two hearts' },
      { char: '💞', keywords: 'coraçoes girando revolving hearts' },
      { char: '💓', keywords: 'coraçao batendo beating heart' },
      { char: '💗', keywords: 'coraçao crescendo growing heart' },
      { char: '💖', keywords: 'coraçao brilhante sparkling heart' },
      { char: '💘', keywords: 'coraçao flecha arrow heart cupid' },
      { char: '💝', keywords: 'coraçao fita ribbon heart present' },
      { char: '💟', keywords: 'decoraçao coraçao heart decoration' },
      { char: '⭐', keywords: 'estrela star gold' },
      { char: '🌟', keywords: 'estrela brilhante glowing star' },
      { char: '✨', keywords: 'brilhos sparkles magic' },
      { char: '⚡', keywords: 'raio relampago lightning bolt energy' },
      { char: '💥', keywords: 'explosao colisao collision spark' },
      { char: '🔥', keywords: 'fogo chama quente fire flame hot' },
      { char: '☀️', keywords: 'sol calor dia sun warm' },
      { char: '☁️', keywords: 'nuvem cloud' },
      { char: '❄️', keywords: 'neve floco snowflake cold' },
      { char: '💧', keywords: 'gota agua drop water' },
      { char: '💦', keywords: 'gotas suor splash water sweat' },
      { char: '💤', keywords: 'sono zzz sleep' }
    ]
  },
  flags: {
    name: 'Bandeiras',
    icon: '🚩',
    list: [
      { char: '🇧🇷', keywords: 'bandeira brasil brazil flag' },
      { char: '🇺🇸', keywords: 'bandeira estados unidos usa flag united states' },
      { char: '🇵🇹', keywords: 'bandeira portugal flag' },
      { char: '🇪🇸', keywords: 'bandeira espanha spain flag' },
      { char: '🇦🇷', keywords: 'bandeira argentina flag' },
      { char: '🇫🇷', keywords: 'bandeira frança france flag' },
      { char: '🇮🇹', keywords: 'bandeira italia italy flag' },
      { char: '🇩🇪', keywords: 'bandeira alemanha germany flag' },
      { char: '🇬🇧', keywords: 'bandeira reino unido uk flag britain' },
      { char: '🇯🇵', keywords: 'bandeira japao japan flag' },
      { char: '🇨🇳', keywords: 'bandeira china flag' },
      { char: '🇨🇦', keywords: 'bandeira canada flag' },
      { char: '🇲🇽', keywords: 'bandeira mexico flag' },
      { char: '🚩', keywords: 'bandeira vermelha red flag' },
      { char: '🏳️‍🌈', keywords: 'bandeira arco iris lgbt pride flag' },
      { char: '🏴‍☠️', keywords: 'bandeira pirata pirate flag skull' }
    ]
  }
};

function setupEmojiPicker() {
  const emojiCategories = document.getElementById('emoji-picker-categories');
  const emojiPickerScroll = document.getElementById('emoji-picker-scroll');
  const btnEmojiToggle = document.getElementById('btn-emoji-toggle');
  const emojiSearchInput = document.getElementById('emoji-search-input');
  const emojiPicker = document.getElementById('emoji-picker');

  if (!emojiCategories || !emojiPickerScroll || !btnEmojiToggle || !emojiSearchInput || !emojiPicker) return;

  // Load recent emojis from storage (persist between sessions)
  chrome.storage.local.get(['chatwootRecentEmojis'], (res) => {
    let recent = res.chatwootRecentEmojis || ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];
    EMOJI_CATEGORIES.recent.list = recent.map(char => ({ char, keywords: 'recente recent' }));
    
    initializeEmojiPickerUI();
  });

  function initializeEmojiPickerUI() {
    // 1. Render Category Tabs
    emojiCategories.innerHTML = '';
    Object.keys(EMOJI_CATEGORIES).forEach((catKey, index) => {
      const tab = document.createElement('div');
      tab.className = `emoji-cat-tab ${index === 0 ? 'active' : ''}`;
      tab.setAttribute('data-cat', catKey);
      tab.setAttribute('title', EMOJI_CATEGORIES[catKey].name);
      tab.textContent = EMOJI_CATEGORIES[catKey].icon;

      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // If searching, clear search first
        if (emojiSearchInput.value) {
          emojiSearchInput.value = '';
          renderCategorizedEmojiList();
        }

        const section = document.getElementById(`emoji-sec-${catKey}`);
        if (section && emojiPickerScroll) {
          // Localized offset scroll (won't affect parent viewport scrolling)
          emojiPickerScroll.scrollTop = section.offsetTop - emojiPickerScroll.offsetTop;
        }
      });
      emojiCategories.appendChild(tab);
    });

    // 2. Render Categorized Emojis
    renderCategorizedEmojiList();

    // 3. Scroll spy logic to highlight tabs on scroll
    emojiPickerScroll.addEventListener('scroll', () => {
      if (emojiSearchInput.value.trim() !== '') return; // Disable scroll spy on search results

      const sections = emojiPickerScroll.querySelectorAll('.emoji-category-section');
      let activeCatKey = 'recent';
      
      sections.forEach(sec => {
        const relativeTop = sec.offsetTop - emojiPickerScroll.offsetTop;
        if (emojiPickerScroll.scrollTop >= relativeTop - 15) {
          activeCatKey = sec.id.replace('emoji-sec-', '');
        }
      });

      const tabs = emojiCategories.querySelectorAll('.emoji-cat-tab');
      tabs.forEach(tab => {
        if (tab.getAttribute('data-cat') === activeCatKey) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    });

    // 4. Search input event
    emojiSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query === '') {
        renderCategorizedEmojiList();
      } else {
        renderSearchedEmojiList(query);
      }
    });

    // 5. Toggle picker popover
    btnEmojiToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      emojiPicker.classList.toggle('hidden');
      if (!emojiPicker.classList.contains('hidden')) {
        emojiSearchInput.value = '';
        renderCategorizedEmojiList();
        emojiSearchInput.focus();
      }
    });

    // Close on clicking outside
    document.addEventListener('click', (e) => {
      if (!emojiPicker.classList.contains('hidden') && 
          !emojiPicker.contains(e.target) && 
          e.target !== btnEmojiToggle) {
        emojiPicker.classList.add('hidden');
      }
    });
  }

  function renderCategorizedEmojiList() {
    emojiPickerScroll.innerHTML = '';
    
    Object.keys(EMOJI_CATEGORIES).forEach(catKey => {
      const cat = EMOJI_CATEGORIES[catKey];
      if (catKey === 'recent' && cat.list.length === 0) return; // Hide Recentes header if empty

      const sec = document.createElement('div');
      sec.className = 'emoji-category-section';
      sec.id = `emoji-sec-${catKey}`;

      const title = document.createElement('div');
      title.className = 'emoji-category-title';
      title.textContent = cat.name;

      const grid = document.createElement('div');
      grid.className = 'emoji-category-grid';
      grid.id = `emoji-grid-${catKey}`;

      cat.list.forEach(emoji => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.textContent = emoji.char;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          insertTextAtCursor(elements.chatReplyInput, emoji.char);
          addToRecent(emoji.char);
          elements.chatReplyInput.focus();
        });
        grid.appendChild(item);
      });

      sec.appendChild(title);
      sec.appendChild(grid);
      emojiPickerScroll.appendChild(sec);
    });

    // Restore active tab highlight to the first item (Recentes or Smileys)
    const tabs = emojiCategories.querySelectorAll('.emoji-cat-tab');
    tabs.forEach((tab, index) => {
      if (index === 0) tab.classList.add('active');
      else tab.classList.remove('active');
    });
    emojiPickerScroll.scrollTop = 0;
  }

  function renderSearchedEmojiList(query) {
    emojiPickerScroll.innerHTML = '';
    
    // Find matches
    const matches = [];
    Object.keys(EMOJI_CATEGORIES).forEach(catKey => {
      if (catKey === 'recent') return; // Skip Recentes category
      EMOJI_CATEGORIES[catKey].list.forEach(emoji => {
        if (emoji.keywords.includes(query) && !matches.includes(emoji.char)) {
          matches.push(emoji.char);
        }
      });
    });

    // Render results in flat grid
    const sec = document.createElement('div');
    sec.className = 'emoji-category-section';

    const title = document.createElement('div');
    title.className = 'emoji-category-title';
    title.textContent = `Resultados da busca ("${query}")`;
    sec.appendChild(title);

    if (matches.length === 0) {
      const placeholder = document.createElement('div');
      placeholder.style.color = 'var(--text-muted)';
      placeholder.style.fontSize = '12.5px';
      placeholder.style.padding = '12px 6px';
      placeholder.textContent = 'Nenhum emoji correspondente encontrado.';
      sec.appendChild(placeholder);
    } else {
      const grid = document.createElement('div');
      grid.className = 'emoji-category-grid';

      matches.forEach(char => {
        const item = document.createElement('div');
        item.className = 'emoji-item';
        item.textContent = char;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          insertTextAtCursor(elements.chatReplyInput, char);
          addToRecent(char);
          elements.chatReplyInput.focus();
        });
        grid.appendChild(item);
      });
      sec.appendChild(grid);
    }
    
    emojiPickerScroll.appendChild(sec);

    // Remove active category tab highlight during searches
    const tabs = emojiCategories.querySelectorAll('.emoji-cat-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
  }

  function addToRecent(char) {
    chrome.storage.local.get(['chatwootRecentEmojis'], (res) => {
      let recent = res.chatwootRecentEmojis || ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏'];
      recent = recent.filter(c => c !== char);
      recent.unshift(char);
      recent = recent.slice(0, 24); // Cap recent emojis at 24

      chrome.storage.local.set({ chatwootRecentEmojis: recent }, () => {
        EMOJI_CATEGORIES.recent.list = recent.map(c => ({ char: c, keywords: 'recente recent' }));
        
        // Re-render recent grid container smoothly if it currently exists
        const recentGrid = document.getElementById('emoji-grid-recent');
        if (recentGrid) {
          recentGrid.innerHTML = '';
          recent.forEach(c => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.textContent = c;
            item.addEventListener('click', (e) => {
              e.preventDefault();
              insertTextAtCursor(elements.chatReplyInput, c);
              addToRecent(c);
              elements.chatReplyInput.focus();
            });
            recentGrid.appendChild(item);
          });
        }
      });
    });
  }
}

function insertTextAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentText = textarea.value;
  
  textarea.value = currentText.substring(0, start) + text + currentText.substring(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  
  // Trigger auto-grow update
  textarea.dispatchEvent(new Event('input'));
}

function applyFormatting(textarea, symbol) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const currentText = textarea.value;
  const selectedText = currentText.substring(start, end);
  
  // WhatsApp Markdown style bold (*), italic (_), strikethrough (~), code (`)
  const formattedText = `${symbol}${selectedText}${symbol}`;
  
  textarea.value = currentText.substring(0, start) + formattedText + currentText.substring(end);
  
  if (selectedText.length === 0) {
    textarea.selectionStart = textarea.selectionEnd = start + symbol.length;
  } else {
    textarea.selectionStart = textarea.selectionEnd = start + formattedText.length;
  }
  
  textarea.dispatchEvent(new Event('input'));
  textarea.focus();
}

// ==========================================
// FILE ATTACHMENTS & VOICE RECORDING SYSTEM
// ==========================================

function renderAttachmentsPreview() {
  const bar = document.getElementById('attachment-preview-bar');
  const list = document.getElementById('attachment-preview-list');
  if (!bar || !list) return;

  if (pendingAttachments.length === 0) {
    bar.classList.add('hidden');
    return;
  }

  bar.classList.remove('hidden');
  list.innerHTML = '';

  pendingAttachments.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'attachment-preview-item';

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        item.innerHTML = `
          <img src="${e.target.result}" class="attachment-thumbnail">
          <span class="attachment-name" title="${file.name}">${file.name}</span>
          <button type="button" class="btn-edit-attachment" title="Editar Imagem">✏️</button>
          <button type="button" class="btn-remove-attachment" title="Remover">&times;</button>
        `;
        const btnRem = item.querySelector('.btn-remove-attachment');
        if (btnRem) {
          btnRem.addEventListener('click', () => {
            pendingAttachments.splice(index, 1);
            renderAttachmentsPreview();
          });
        }
        const btnEd = item.querySelector('.btn-edit-attachment');
        if (btnEd) {
          btnEd.addEventListener('click', () => {
            editingAttachmentIndex = index;
            openImageEditor(file);
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      item.innerHTML = `
        <div class="attachment-icon-placeholder">📄</div>
        <span class="attachment-name" title="${file.name}">${file.name}</span>
        <button type="button" class="btn-remove-attachment" title="Remover">&times;</button>
      `;
      const btnRem = item.querySelector('.btn-remove-attachment');
      if (btnRem) {
        btnRem.addEventListener('click', () => {
          pendingAttachments.splice(index, 1);
          renderAttachmentsPreview();
        });
      }
    }

    list.appendChild(item);
  });
}

function startAudioRecording(stream) {
  const chatReplyBar = document.getElementById('chat-reply-bar');
  const audioRecordingBar = document.getElementById('audio-recording-bar');
  const chatFormatToolbar = document.getElementById('chat-format-toolbar');
  const btnToggleToolbar = document.getElementById('btn-toggle-toolbar');
  const recordingTimer = document.getElementById('recording-timer');

  if (!chatReplyBar || !audioRecordingBar || !recordingTimer) return;

  // Hide formatting toolbar if open
  if (chatFormatToolbar) chatFormatToolbar.classList.add('hidden');
  if (btnToggleToolbar) btnToggleToolbar.classList.remove('active');

  // Switch reply bars
  chatReplyBar.classList.add('hidden');
  audioRecordingBar.classList.remove('hidden');

  // Initialize MediaRecorder with correct Opus codec support check
  let options = {};
  if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
    options = { mimeType: 'audio/ogg;codecs=opus' };
  } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    options = { mimeType: 'audio/webm;codecs=opus' };
  }

  mediaRecorder = new MediaRecorder(stream, options);
  audioChunks = [];

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      audioChunks.push(e.data);
    }
  };

  // Start recording
  mediaRecorder.start();
  recordingStartTime = Date.now();

  // Start timer interval
  recordingTimer.textContent = '00:00';
  recordingTimerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
    const mm = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const ss = String(elapsedSeconds % 60).padStart(2, '0');
    recordingTimer.textContent = `${mm}:${ss}`;
  }, 1000);
}

function cancelAudioRecording() {
  if (!mediaRecorder) return;

  // Stop timer
  clearInterval(recordingTimerInterval);
  recordingTimerInterval = null;

  // Discard chunks on stop
  mediaRecorder.onstop = null;
  
  // Stop mic tracks
  mediaRecorder.stream.getTracks().forEach(track => track.stop());

  mediaRecorder.stop();
  mediaRecorder = null;

  // Reset UI
  document.getElementById('audio-recording-bar').classList.add('hidden');
  document.getElementById('chat-reply-bar').classList.remove('hidden');
}

function stopAndSendAudioRecording() {
  if (!mediaRecorder) return;

  // Stop timer
  clearInterval(recordingTimerInterval);
  recordingTimerInterval = null;

  // Handle recorded output
  mediaRecorder.onstop = async () => {
    // WhatsApp expects audio/ogg files. Package it as audio/ogg and .ogg extension
    const audioBlob = new Blob(audioChunks, { type: 'audio/ogg' });
    const audioFile = new File([audioBlob], `voice_note_${Date.now()}.ogg`, { type: 'audio/ogg' });

    // Stop mic tracks
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    mediaRecorder = null;

    // Send via API
    await sendAudioMessage(audioFile);
  };

  mediaRecorder.stop();
}

async function sendAudioMessage(file) {
  if (!currentActiveChat) return;
  const { id: conversationId, accountId } = currentActiveChat;

  showToast('Enviando áudio gravado...', 'success');

  const formData = new FormData();
  formData.append('message_type', 'outgoing');
  formData.append('private', 'false');
  formData.append('attachments[]', file, file.name);

  try {
    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    await chatwootFetch(endpoint, {
      method: 'POST',
      body: formData
    });

    showToast('Áudio enviado com sucesso!', 'success');
    notifyMessageSent(conversationId, accountId);
    await loadChatMessages(accountId, conversationId, true);
  } catch (err) {
    console.error('Error sending audio message:', err);
    showToast(`Erro ao enviar áudio: ${err.message}`, 'error');
  } finally {
    document.getElementById('audio-recording-bar').classList.add('hidden');
    document.getElementById('chat-reply-bar').classList.remove('hidden');
  }
}

// Speed controller for voice messages (1x -> 1.5x -> 2x)
window.toggleAudioSpeed = function(btn) {
  const audio = btn.parentElement.querySelector('audio');
  if (!audio) return;

  const currentSpeed = parseFloat(btn.textContent) || 1.0;
  let nextSpeed = 1.0;

  if (currentSpeed === 1.0) {
    nextSpeed = 1.5;
  } else if (currentSpeed === 1.5) {
    nextSpeed = 2.0;
  } else {
    nextSpeed = 1.0;
  }

  audio.playbackRate = nextSpeed;
  btn.textContent = `${nextSpeed}x`;
  
  // Apply visual feedback classes
  if (nextSpeed > 1.0) {
    btn.style.backgroundColor = 'var(--primary)';
    btn.style.color = 'white';
    btn.style.borderColor = 'var(--primary)';
  } else {
    btn.style.backgroundColor = 'var(--bg-tertiary)';
    btn.style.color = 'var(--text-primary)';
    btn.style.borderColor = 'var(--border-color)';
  }
};

// Lightbox Modal for fullscreen previews and file downloads
let currentLightboxItem = null;

window.openLightbox = function(url, fileType, filename) {
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  const filenameDisplay = document.getElementById('lightbox-filename');

  if (!modal || !content || !filenameDisplay) return;

  currentLightboxItem = { url, filename };
  filenameDisplay.textContent = filename;
  content.innerHTML = '';

  if (fileType === 'image') {
    const img = document.createElement('img');
    img.src = url;
    content.appendChild(img);
  } else if (fileType === 'video') {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.autoplay = true;
    content.appendChild(video);
  } else {
    const docDiv = document.createElement('div');
    docDiv.className = 'document-preview';
    docDiv.innerHTML = `
      <div class="document-icon">📄</div>
      <div style="font-size: 14px; margin-top: 8px; color: var(--text-primary); font-weight: 500; text-align: center; word-break: break-all; padding: 0 20px;">${filename}</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Este documento pode ser baixado clicando no botão abaixo.</div>
    `;
    content.appendChild(docDiv);
  }

  modal.classList.remove('hidden');
};

function setupLightboxHandlers() {
  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('btn-lightbox-close');
  const downloadBtn = document.getElementById('btn-lightbox-download');

  if (!modal || !closeBtn || !downloadBtn) return;

  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const video = modal.querySelector('video');
    if (video) video.pause();

    modal.classList.add('hidden');
    currentLightboxItem = null;
  });

  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!currentLightboxItem) return;

    showToast('Iniciando download...', 'success');

    chrome.downloads.download({
      url: currentLightboxItem.url,
      filename: currentLightboxItem.filename,
      saveAs: true
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error using chrome.downloads:', chrome.runtime.lastError);
        // Fallback to iframe/new tab download
        const a = document.createElement('a');
        a.href = currentLightboxItem.url;
        a.download = currentLightboxItem.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  });

  // Event delegation to capture media preview clicks (prevents CSP violations)
  if (elements.chatMessagesArea) {
    elements.chatMessagesArea.addEventListener('click', (e) => {
      // 1. Click on Image preview
      const img = e.target.closest('.chat-img-preview');
      if (img) {
        e.preventDefault();
        const url = img.getAttribute('src');
        const filename = img.getAttribute('data-filename') || 'imagem.png';
        openLightbox(url, 'image', filename);
        return;
      }

      // 2. Click on Video fullscreen overlay
      const btnVideo = e.target.closest('.btn-video-fullscreen');
      if (btnVideo) {
        e.preventDefault();
        const url = btnVideo.getAttribute('data-url');
        const filename = btnVideo.getAttribute('data-filename') || 'video.mp4';
        openLightbox(url, 'video', filename);
        return;
      }

      // 3. Click on Audio speed multiplier
      const btnSpeed = e.target.closest('.btn-audio-speed');
      if (btnSpeed) {
        e.preventDefault();
        toggleAudioSpeed(btnSpeed);
        return;
      }

      // 4. Click on Document/File link
      const linkDoc = e.target.closest('.chat-file-download-link');
      if (linkDoc) {
        e.preventDefault();
        const url = linkDoc.getAttribute('data-url');
        const filename = linkDoc.getAttribute('data-filename') || 'documento';
        openLightbox(url, 'file', filename);
        return;
      }

      // 5. Click on Message context menu caret (btn-msg-menu)
      const btnMenu = e.target.closest('.btn-msg-menu');
      if (btnMenu) {
        e.preventDefault();
        const bubble = btnMenu.closest('.chat-msg-bubble');
        if (!bubble) return;

        const msgId = bubble.getAttribute('data-msg-id');
        const msgContent = bubble.getAttribute('data-msg-content');
        const senderName = bubble.getAttribute('data-sender-name');

        activeContextMessage = { id: msgId, content: msgContent, senderName: senderName };

        // Hide Edit & Delete options for incoming messages
        const isOutgoing = bubble.classList.contains('outgoing');
        const btnEdit = document.getElementById('btn-msg-edit');
        const btnDelete = document.getElementById('btn-msg-delete');
        if (btnEdit) btnEdit.style.display = isOutgoing ? 'flex' : 'none';
        if (btnDelete) btnDelete.style.display = isOutgoing ? 'flex' : 'none';

        // Position and show dropdown menu
        const menu = document.getElementById('msg-context-menu');
        if (menu) {
          const rect = btnMenu.getBoundingClientRect();
          let top = rect.bottom;
          let left = rect.left - 90;

          // Align bounds safely
          if (left < 10) left = 10;
          if (left + 120 > window.innerWidth) left = window.innerWidth - 130;
          if (top + 130 > window.innerHeight) top = rect.top - 120; // Position above if no room below

          menu.style.top = `${top}px`;
          menu.style.left = `${left}px`;
          menu.classList.remove('hidden');
        }
        return;
      }

      // 6. Click on Quote preview (scroll to parent message)
      const quote = e.target.closest('.chat-msg-reply-quote');
      if (quote) {
        e.preventDefault();
        const targetId = quote.getAttribute('data-target-id');
        if (targetId) {
          scrollToMessageId(targetId);
        }
        return;
      }
    });
  }
}

// Convert WhatsApp Markdown format symbols (*bold*, _italic_, ~strikethrough~, `code`) to secure HTML equivalents
function formatWhatsAppMarkdown(text) {
  if (!text) return '';

  // Decode decimal, hex, and named HTML entities for markdown characters
  let formatted = text
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&ast;/g, '*')
    .replace(/&tilde;/g, '~')
    .replace(/&lowbar;/g, '_');

  const hasHtml = /<[a-z/][^>]*>/i.test(formatted);

  if (!hasHtml) {
    // Escape HTML to prevent cross-site scripting (XSS)
    formatted = formatted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Convert URLs to clickable hyperlinks
    formatted = formatted.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="chat-msg-link" rel="noopener noreferrer">$1</a>');
  }

  // Bold (Double and Single): **text** or *text* -> <strong>text</strong>
  formatted = formatted.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*([^*]+?)\*/g, '<strong>$1</strong>');

  // Italic (Double and Single): __text__ or _text_ -> <em>text</em>
  formatted = formatted.replace(/__([^_]+?)__/g, '<em>$1</em>');
  formatted = formatted.replace(/_([^_]+?)_/g, '<em>$1</em>');

  // Strikethrough (Double and Single): ~~text~~ or ~text~ -> <del>text</del>
  formatted = formatted.replace(/~~([^~]+?)~~/g, '<del>$1</del>');
  formatted = formatted.replace(/~([^~]+?)~/g, '<del>$1</del>');

  // Monospace/Code: `text` -> <code>text</code>
  formatted = formatted.replace(/`([^`]+?)`/g, '<code>$1</code>');

  return formatted;
}

// ==========================================
// IMAGE EDITOR SYSTEM
// ==========================================
let editingAttachmentIndex = -1;
let editorCanvas = null;
let editorCtx = null;
let isDrawing = false;
let canvasStates = [];
let originalFile = null;

function openImageEditor(file) {
  const modal = document.getElementById('image-editor-modal');
  editorCanvas = document.getElementById('editor-canvas');
  if (!modal || !editorCanvas) return;

  originalFile = file;
  editorCtx = editorCanvas.getContext('2d');
  canvasStates = [];

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      // Fit or use original image dimensions for drawing quality
      editorCanvas.width = img.width;
      editorCanvas.height = img.height;
      
      // Draw image to canvas
      editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
      editorCtx.drawImage(img, 0, 0);
      
      // Save initial state
      saveCanvasState();
      
      // Open modal
      modal.classList.remove('hidden');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveCanvasState() {
  if (canvasStates.length >= 15) {
    canvasStates.shift();
  }
  canvasStates.push(editorCanvas.toDataURL());
}

function undoCanvasState() {
  if (canvasStates.length <= 1) return; // Keep initial background image state
  canvasStates.pop(); // Remove current state
  const prevStateUrl = canvasStates[canvasStates.length - 1];
  
  const img = new Image();
  img.onload = () => {
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    editorCtx.drawImage(img, 0, 0);
  };
  img.src = prevStateUrl;
}

function getCanvasMouseCoords(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  
  // Handle touch events
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  // Translate coordinate scale ratio
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

function setupCanvasDrawingEvents() {
  const canvas = document.getElementById('editor-canvas');
  const brushColor = document.getElementById('editor-brush-color');
  const brushSize = document.getElementById('editor-brush-size');
  
  const btnUndo = document.getElementById('btn-editor-undo');
  const btnClear = document.getElementById('btn-editor-clear');
  const btnCancel = document.getElementById('btn-editor-cancel');
  const btnConfirm = document.getElementById('btn-editor-confirm');
  const modal = document.getElementById('image-editor-modal');

  if (!canvas || !brushColor || !brushSize) return;

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const coords = getCanvasMouseCoords(canvas, e);
    
    editorCtx.beginPath();
    editorCtx.moveTo(coords.x, coords.y);
    editorCtx.strokeStyle = brushColor.value;
    editorCtx.lineWidth = parseInt(brushSize.value) || 6;
    editorCtx.lineCap = 'round';
    editorCtx.lineJoin = 'round';
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasMouseCoords(canvas, e);
    editorCtx.lineTo(coords.x, coords.y);
    editorCtx.stroke();
  }

  function stopDraw(e) {
    if (!isDrawing) return;
    isDrawing = false;
    editorCtx.closePath();
    saveCanvasState();
  }

  // Mouse bindings
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // Touch bindings
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  // Undo button
  if (btnUndo) {
    btnUndo.addEventListener('click', (e) => {
      e.preventDefault();
      undoCanvasState();
    });
  }

  // Clear button
  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.preventDefault();
      if (canvasStates.length <= 1) return;
      
      // Restore initial state (background image)
      const initialState = canvasStates[0];
      const img = new Image();
      img.onload = () => {
        editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
        editorCtx.drawImage(img, 0, 0);
        canvasStates = [initialState];
        saveCanvasState();
      };
      img.src = initialState;
    });
  }

  // Cancel button
  if (btnCancel) {
    btnCancel.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('hidden');
      editingAttachmentIndex = -1;
    });
  }

  // Confirm/Save button
  if (btnConfirm) {
    btnConfirm.addEventListener('click', (e) => {
      e.preventDefault();
      canvas.toBlob((blob) => {
        const fileName = originalFile ? originalFile.name : `edit_${Date.now()}.png`;
        const editedFile = new File([blob], fileName, { type: 'image/png' });
        
        if (editingAttachmentIndex >= 0) {
          // Replace existing attachment
          pendingAttachments[editingAttachmentIndex] = editedFile;
        } else {
          // Push new attachment
          pendingAttachments.push(editedFile);
        }
        
        renderAttachmentsPreview();
        modal.classList.add('hidden');
        editingAttachmentIndex = -1;
      }, 'image/png');
    });
  }
}

// ==========================================
// MESSAGE REPLIES & CONTEXT MENUS SYSTEM
// ==========================================
let activeContextMessage = null;

function cancelMessageReply() {
  replyParentMessageId = null;
  const replyBar = document.getElementById('reply-preview-bar');
  if (replyBar) replyBar.classList.add('hidden');
}

function cancelMessageEdit() {
  editParentMessageId = null;
  const editBar = document.getElementById('edit-preview-bar');
  if (editBar) editBar.classList.add('hidden');
  
  // Clear textarea input and restore submit button layout
  elements.chatReplyInput.value = '';
  elements.chatReplyInput.placeholder = 'Digite uma mensagem...';
  elements.chatReplyInput.style.height = 'auto';
}

function isEmojiString(str) {
  if (!str) return false;
  // Emoji unicode block regex matching single emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F6D0}-\u{1F6DF}\u{1F6E0}-\u{1F6EF}\u{1F7E0}-\u{1F7EF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2702}\u{2705}\u{270A}\u{270B}\u{2728}\u{274C}\u{274E}\u{2753}-\u{2757}\u{2795}-\u{2797}\u{27B0}\u{27BF}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/u;
  return emojiRegex.test(str);
}

async function sendReaction(messageId, emoji) {
  if (!currentActiveChat) return;
  const { accountId, id: conversationId } = currentActiveChat;

  try {
    const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages`;
    await chatwootFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        content: emoji,
        message_type: 'outgoing',
        private: false,
        parent_id: messageId,
        content_attributes: {
          in_reply_to: messageId,
          is_reaction: true
        }
      })
    });

    await loadChatMessages(accountId, conversationId, true);
  } catch (err) {
    console.error('Error sending reaction:', err);
    showToast('Erro ao reagir.', 'error');
  } finally {
    const menu = document.getElementById('msg-context-menu');
    if (menu) menu.classList.add('hidden');
  }
}

function setupContextMenuHandlers() {
  const replyBtn = document.getElementById('btn-msg-reply');
  const editBtn = document.getElementById('btn-msg-edit');
  const copyBtn = document.getElementById('btn-msg-copy');
  const deleteBtn = document.getElementById('btn-msg-delete');
  const menu = document.getElementById('msg-context-menu');

  const replyBar = document.getElementById('reply-preview-bar');
  const replySender = document.getElementById('reply-preview-sender');
  const replyText = document.getElementById('reply-preview-text');

  const editBar = document.getElementById('edit-preview-bar');
  const editPreviewText = document.getElementById('edit-preview-text');

  const reactionsContainer = document.getElementById('msg-context-reactions');

  if (!replyBtn || !editBtn || !copyBtn || !deleteBtn || !menu) return;

  // Handle Emoji reactions click
  if (reactionsContainer) {
    reactionsContainer.addEventListener('click', (e) => {
      const emojiBtn = e.target.closest('.btn-reaction-emoji');
      if (emojiBtn && activeContextMessage) {
        e.preventDefault();
        const emoji = emojiBtn.getAttribute('data-emoji');
        sendReaction(activeContextMessage.id, emoji);
      }
    });
  }

  // Handle "Responder" option click
  replyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!activeContextMessage) return;

    // Clear editing mode if active
    cancelMessageEdit();

    replyParentMessageId = activeContextMessage.id;
    
    if (replySender && replyText && replyBar) {
      replySender.textContent = activeContextMessage.senderName;
      replyText.textContent = activeContextMessage.content || 'Mensagem de Mídia/Anexo';
      replyBar.classList.remove('hidden');

      // Scroll chat area to bottom after DOM layout reflow
      setTimeout(() => {
        if (elements.chatMessagesArea) {
          elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
        }
      }, 50);
    }

    menu.classList.add('hidden');
    elements.chatReplyInput.focus();
  });

  // Handle "Editar" option click
  editBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!activeContextMessage) return;

    // Clear replying mode if active
    cancelMessageReply();

    editParentMessageId = activeContextMessage.id;
    
    if (editPreviewText && editBar) {
      editPreviewText.textContent = activeContextMessage.content || '';
      editBar.classList.remove('hidden');

      // Set input text and focus
      elements.chatReplyInput.value = activeContextMessage.content || '';
      elements.chatReplyInput.placeholder = 'Edite sua mensagem...';
      elements.chatReplyInput.focus();

      // Scroll chat area to bottom after DOM layout reflow
      setTimeout(() => {
        if (elements.chatMessagesArea) {
          elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
        }
      }, 50);
    }

    menu.classList.add('hidden');
  });

  // Handle "Copiar" option click
  copyBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!activeContextMessage) return;

    const contentToCopy = activeContextMessage.content || '';
    navigator.clipboard.writeText(contentToCopy).then(() => {
      showToast('Mensagem copiada para a área de transferência!', 'success');
    }).catch(err => {
      console.error('Failed to copy text:', err);
      showToast('Erro ao copiar mensagem.', 'error');
    });

    menu.classList.add('hidden');
  });

  // Handle "Excluir" option click
  deleteBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!activeContextMessage) return;

    const confirmDelete = confirm('Tem certeza que deseja excluir esta mensagem?');
    if (!confirmDelete) {
      menu.classList.add('hidden');
      return;
    }

    const { accountId, id: conversationId } = currentActiveChat;
    try {
      const endpoint = `/api/v1/accounts/${accountId}/conversations/${conversationId}/messages/${activeContextMessage.id}`;
      await chatwootFetch(endpoint, {
        method: 'DELETE'
      });

      showToast('Mensagem excluída com sucesso.', 'success');
      await loadChatMessages(accountId, conversationId, true);
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast(`Erro ao excluir: ${err.message}`, 'error');
    } finally {
      menu.classList.add('hidden');
    }
  });
}

// Scroll viewport to target message ID and play flash highlight animation
function scrollToMessageId(id) {
  const targetEl = elements.chatMessagesArea.querySelector(`[data-msg-id="${id}"]`);
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Apply flash highlight animation overlay
    targetEl.classList.remove('highlight-flash');
    void targetEl.offsetWidth; // Trigger reflow to restart CSS animation
    targetEl.classList.add('highlight-flash');

    // Clean up class after animation ends
    setTimeout(() => {
      targetEl.classList.remove('highlight-flash');
    }, 1400);
  } else {
    showToast('Mensagem original não carregada no histórico atual.', 'error');
  }
}

// ==========================================
// LINK PREVIEWS SYSTEM
// ==========================================
const linkPreviewsCache = {};

async function fetchLinkPreview(url) {
  if (linkPreviewsCache[url]) return linkPreviewsCache[url];

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent || 
                  doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || 
                  doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';

    const preview = { 
      title: title.trim(), 
      description: description.trim(), 
      image: image.trim(), 
      url 
    };
    linkPreviewsCache[url] = preview;
    return preview;
  } catch (err) {
    console.error('Failed to scrape link preview metadata:', url, err);
    return null;
  }
}

async function loadLinkPreviews() {
  if (!elements.chatMessagesArea) return;
  
  const containers = elements.chatMessagesArea.querySelectorAll('.link-preview-container:not(.loaded)');
  containers.forEach(async (container) => {
    container.classList.add('loaded');
    const url = container.getAttribute('data-url');
    if (!url) return;

    const preview = await fetchLinkPreview(url);
    if (preview && (preview.title || preview.description)) {
      const wasNearBottom = elements.chatMessagesArea.scrollHeight - elements.chatMessagesArea.scrollTop - elements.chatMessagesArea.clientHeight < 150;

      container.innerHTML = `
        <a href="${preview.url}" target="_blank" class="msg-link-preview-card" rel="noopener noreferrer">
          ${preview.image ? `<img src="${preview.image}" alt="Preview" class="link-preview-img">` : ''}
          <div class="link-preview-info">
            <span class="link-preview-title">${preview.title}</span>
            ${preview.description ? `<span class="link-preview-desc">${preview.description}</span>` : ''}
            <span class="link-preview-domain">${new URL(preview.url).hostname}</span>
          </div>
        </a>
      `;
      
      const img = container.querySelector('.link-preview-img');
      if (img) {
        img.addEventListener('load', () => scrollToBottom(wasNearBottom));
      }
      
      if (wasNearBottom) {
        scrollToBottom(true);
      }
    }
  });
}

function scrollToBottom(force = false) {
  if (!elements.chatMessagesArea) return;
  const isNearBottom = elements.chatMessagesArea.scrollHeight - elements.chatMessagesArea.scrollTop - elements.chatMessagesArea.clientHeight < 150;
  if (force || isNearBottom) {
    elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
  }
}

// ==========================================
// NAVIGATION STATE PERSISTENCE
// ==========================================

function saveNavigationState(updates) {
  if (isChatWindowMode) return;
  chrome.storage.local.get(['navState'], (result) => {
    const current = result.navState || {};
    const next = Object.assign({}, current, updates);
    if ('openConversationId' in updates && !updates.openConversationId) {
      delete next.openConversationId;
      delete next.openContactName;
      delete next.openAccountId;
      delete next.openInboxId;
    }
    chrome.storage.local.set({ navState: next });
  });
}

function restoreNavigationState() {
  if (isChatWindowMode) {
    switchTab('chats');
    const urlParams = new URLSearchParams(window.location.search);
    const convId = parseInt(urlParams.get('convId'), 10);
    const contactName = urlParams.get('contactName') || 'Cliente';
    const accountId = parseInt(urlParams.get('accountId'), 10) || config.defaultAccount;
    const inboxId = parseInt(urlParams.get('inboxId'), 10) || '';
    if (convId) {
      openConversationChat(convId, contactName, accountId, inboxId);
    }
    return;
  }
  chrome.storage.local.get(['navState'], (result) => {
    const state = result.navState || {};
    const activeTab = state.activeTab || 'chats';

    switchTab(activeTab);

    if (activeTab === 'chats') {
      if (state.openConversationId) {
        openConversationChat(
          state.openConversationId,
          state.openContactName || 'Contato',
          state.openAccountId,
          state.openInboxId || ''
        );
        loadConversations();
      } else {
        loadConversations();
      }
    }
  });
}

let currentReportData = null;

function setupReportsHandlers() {
  const select = document.getElementById('reports-period-select');
  if (select) {
    select.addEventListener('change', () => {
      loadReportsDashboard(true);
    });
  }
  const btnRetry = document.getElementById('btn-retry-reports');
  if (btnRetry) {
    btnRetry.addEventListener('click', () => {
      loadReportsDashboard();
    });
  }
  const btnPdf = document.getElementById('btn-export-pdf');
  if (btnPdf) {
    btnPdf.addEventListener('click', () => {
      exportReportToPDF();
    });
  }
}

async function exportReportToPDF() {
  if (!currentReportData) {
    showToast('Aguarde o carregamento do relatório para exportar.', 'error');
    return;
  }
  
  try {
    const profile = await chatwootFetch('/api/v1/profile');
    const agentName = profile ? profile.name : 'Agente';
    
    const periodValue = elements.reportsPeriodSelect.value;
    let periodLabel = 'Hoje';
    if (periodValue === '7days') {
      periodLabel = 'Últimos 7 dias';
    } else if (periodValue === '30days') {
      periodLabel = 'Últimos 30 dias';
    }

    const pdfData = {
      agentName,
      periodLabel,
      messagesSent: currentReportData.messagesSent,
      repliedCount: currentReportData.repliedCount,
      resolvedCount: currentReportData.resolvedCount,
      openCount: currentReportData.openCount,
      breakdownItems: currentReportData.breakdownItems,
      productivityText: currentReportData.productivityText
    };

    chrome.storage.local.set({ pdfReportData: pdfData }, () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
    });
  } catch (err) {
    console.error('Error preparing PDF data:', err);
    showToast('Erro ao preparar relatório PDF.', 'error');
  }
}

async function loadReportsDashboard(silent = false) {
  if (!config.url || !config.token) {
    showReportsError('Configurações do Chatwoot não definidas. Acesse a aba "Ajustes".');
    return;
  }

  if (!silent) {
    elements.reportsContentLoading.classList.remove('hidden');
    elements.reportsContentError.classList.add('hidden');
    elements.reportsContentArea.classList.add('hidden');
  }

  // Show subtle linear progress bar and disable control elements while fetching
  if (elements.reportsHeaderProgress) {
    elements.reportsHeaderProgress.classList.remove('hidden');
  }
  if (elements.reportsPeriodSelect) {
    elements.reportsPeriodSelect.disabled = true;
  }
  const btnPdf = document.getElementById('btn-export-pdf');
  if (btnPdf) {
    btnPdf.disabled = true;
  }

  try {
    const profile = await chatwootFetch('/api/v1/profile');
    if (!profile) {
      throw new Error('Não foi possível obter dados do perfil do agente.');
    }
    const currentUserId = profile.id;
    
    let accountId = config.defaultAccount;
    if (!accountId && profile.accounts && profile.accounts.length > 0) {
      accountId = profile.accounts[0].id;
    }
    if (!accountId) {
      throw new Error('Nenhuma conta Chatwoot encontrada ou selecionada.');
    }

    const period = elements.reportsPeriodSelect.value;
    let sinceTimeSeconds = 0;
    const nowMs = Date.now();

    if (period === 'today') {
      sinceTimeSeconds = new Date().setHours(0, 0, 0, 0) / 1000;
    } else if (period === '7days') {
      sinceTimeSeconds = (nowMs - 7 * 24 * 60 * 60 * 1000) / 1000;
    } else if (period === '30days') {
      sinceTimeSeconds = (nowMs - 30 * 24 * 60 * 60 * 1000) / 1000;
    }

    // 1. Fetch conversations dynamically based on selected period length
    let maxPages = 1;
    if (period === '7days') {
      maxPages = 3;
    } else if (period === '30days') {
      maxPages = 6;
    }

    const pagePromises = [];
    for (let p = 1; p <= maxPages; p++) {
      pagePromises.push(
        chatwootFetch(`/api/v1/accounts/${accountId}/conversations?status=all&assignee_type=all&page=${p}`)
          .catch(e => {
            console.warn(`Error fetching page ${p} for reports:`, e);
            return [];
          })
      );
    }
    const pagesData = await Promise.all(pagePromises);

    const mergedMap = new Map();
    pagesData.forEach(pageData => {
      const pageConvs = extractConversationsArray(pageData);
      pageConvs.forEach(c => {
        if (c && c.id) {
          mergedMap.set(c.id, c);
        }
      });
    });
    const conversations = Array.from(mergedMap.values());

    // Filter conversations that had any activity in the selected period
    const activeConversations = conversations.filter(c => {
      if (!c) return false;
      const ts = c.last_activity_at || c.timestamp || 0;
      return ts >= sinceTimeSeconds;
    });

    // 2. Fetch full message history for active conversations in parallel
    const messagesFetchPromises = activeConversations.map(async (conv) => {
      try {
        const msgsData = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conv.id}/messages`);
        conv.fullMessages = Array.isArray(msgsData) ? msgsData : (msgsData?.payload || []);
      } catch (e) {
        console.warn(`Error fetching messages for conversation ${conv.id}:`, e);
        conv.fullMessages = Array.isArray(conv.messages) ? conv.messages : [];
      }
    });
    await Promise.all(messagesFetchPromises);

    // 3. Compute stats client-side using full message history
    let messagesSent = 0;
    let repliedCount = 0;
    let resolvedCount = 0;
    let openCount = 0;
    const inboxMetrics = {};

    conversations.forEach(item => {
      if (!item) return;

      const msgs = Array.isArray(item.fullMessages) ? item.fullMessages : (Array.isArray(item.messages) ? item.messages : []);
      
      let hasOutgoingFromMeInPeriod = false;
      let hasOutgoingFromMeEver = false;
      
      msgs.forEach(msg => {
        if (!msg) return;
        
        const isOutgoing = msg.message_type === 1 || msg.message_type === 'outgoing';
        const isMe = msg.sender && msg.sender.id === currentUserId;

        if (isOutgoing && isMe) {
          hasOutgoingFromMeEver = true;
          
          const inPeriod = msg.created_at >= sinceTimeSeconds;
          if (inPeriod) {
            messagesSent++;
            hasOutgoingFromMeInPeriod = true;
          }
        }
      });

      const hasMeInteracted = (item.meta?.assignee?.id === currentUserId) || hasOutgoingFromMeEver;

      if (item.status === 'open' && hasMeInteracted) {
        openCount++;
      }
      if (item.status === 'resolved' && item.updated_at >= sinceTimeSeconds && hasMeInteracted) {
        resolvedCount++;
      }

      if (hasOutgoingFromMeInPeriod) {
        repliedCount++;

        const inboxId = item.inbox_id;
        if (inboxId) {
          inboxMetrics[inboxId] = (inboxMetrics[inboxId] || 0) + 1;
        }
      }
    });

    const breakdownItems = [];
    for (const [inboxId, count] of Object.entries(inboxMetrics)) {
      const name = await getInboxName(accountId, inboxId) || `Caixa #${inboxId}`;
      breakdownItems.push({ id: inboxId, name, count });
    }
    breakdownItems.sort((a, b) => b.count - a.count);

    if (elements.reportValMessages) elements.reportValMessages.textContent = messagesSent;
    if (elements.reportValReplied) elements.reportValReplied.textContent = repliedCount;
    if (elements.reportValResolved) elements.reportValResolved.textContent = resolvedCount;
    if (elements.reportValOpen) elements.reportValOpen.textContent = openCount;

    if (elements.reportInboxBreakdown) {
      elements.reportInboxBreakdown.innerHTML = '';
      if (breakdownItems.length === 0) {
        elements.reportInboxBreakdown.innerHTML = `<div style="text-align: center; font-size: 11px; color: var(--text-muted); padding: 10px 0;">Nenhuma conversa ativa com você por caixa de entrada no período.</div>`;
      } else {
        const maxCount = breakdownItems[0].count || 1;
        breakdownItems.forEach(item => {
          const percentage = Math.round((item.count / maxCount) * 100);
          const itemEl = document.createElement('div');
          itemEl.className = 'report-breakdown-item';
          itemEl.innerHTML = `
            <div class="report-breakdown-info">
              <span class="report-breakdown-name">${item.name}</span>
              <span class="report-breakdown-count">${item.count} ${item.count === 1 ? 'atendimento' : 'atendimentos'}</span>
            </div>
            <div class="report-breakdown-bar-bg">
              <div class="report-breakdown-bar-fill" style="width: ${percentage}%"></div>
            </div>
          `;
          elements.reportInboxBreakdown.appendChild(itemEl);
        });
      }
    }

    let insightText = '';
    const maxInbox = breakdownItems[0];

    if (messagesSent === 0 && repliedCount === 0 && resolvedCount === 0) {
      insightText = `Nenhuma atividade de resposta registrada por você no período selecionado. Continue monitorando seus atendimentos na lista de chats!`;
    } else {
      insightText = `No período selecionado, você teve um desempenho produtivo: enviou <strong>${messagesSent} mensagens</strong> e atendeu ativamente <strong>${repliedCount} conversas</strong>. `;
      
      if (resolvedCount > 0) {
        insightText += `Conseguiu finalizar e resolver com sucesso <strong>${resolvedCount} atendimentos</strong>, reduzindo a fila de espera. `;
      } else {
        insightText += `Nenhum atendimento foi finalizado ainda neste período. `;
      }
      
      if (openCount > 0) {
        insightText += `Atualmente, você possui <strong>${openCount} conversas em andamento</strong> sob sua responsabilidade que requerem atenção contínua. `;
      }
      
      if (maxInbox && maxInbox.count > 0) {
        insightText += `Sua caixa de entrada mais movimentada foi a <strong>${maxInbox.name}</strong>, onde você concentrou <strong>${maxInbox.count} atendimentos</strong>. `;
      }
      
      if (resolvedCount >= 5) {
        insightText += `<br><br>✨ <strong>Excelente produtividade!</strong> Você está finalizando atendimentos de forma ágil e eficaz. Parabéns!`;
      } else {
        insightText += `<br><br>👍 <strong>Bom trabalho!</strong> Continue prestando suporte de excelência aos clientes.`;
      }
    }

    if (elements.reportProductivityText) {
      elements.reportProductivityText.innerHTML = insightText;
    }

    currentReportData = {
      messagesSent,
      repliedCount,
      resolvedCount,
      openCount,
      breakdownItems,
      productivityText: insightText
    };

    hideReportsProgress();
    if (elements.reportsContentLoading) elements.reportsContentLoading.classList.add('hidden');
    if (elements.reportsContentError) elements.reportsContentError.classList.add('hidden');
    if (elements.reportsContentArea) elements.reportsContentArea.classList.remove('hidden');

  } catch (err) {
    console.error('Error loading reports dashboard:', err);
    hideReportsProgress();
    showReportsError(err.message || 'Erro ao carregar dados de relatórios.');
  }
}

function showReportsError(message) {
  elements.reportsErrorText.textContent = message;
  hideReportsProgress();
  elements.reportsContentLoading.classList.add('hidden');
  elements.reportsContentArea.classList.add('hidden');
  elements.reportsContentError.classList.remove('hidden');
}

function hideReportsProgress() {
  if (elements.reportsHeaderProgress) {
    elements.reportsHeaderProgress.classList.add('hidden');
  }
  if (elements.reportsPeriodSelect) {
    elements.reportsPeriodSelect.disabled = false;
  }
  const btnPdf = document.getElementById('btn-export-pdf');
  if (btnPdf) {
    btnPdf.disabled = false;
  }
}

function notifyMessageSent(conversationId, accountId) {
  chrome.runtime.sendMessage({
    action: 'messageSentByAgent',
    conversationId: conversationId,
    accountId: accountId
  }).catch(() => {});
}

function notifyConversationStatusChanged(conversationId, newStatus) {
  chrome.runtime.sendMessage({
    action: 'conversationStatusChanged',
    conversationId: conversationId,
    status: newStatus
  }).catch(() => {});
}


