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
let activeSearchCategoryTab = 'all'; // 'all', 'contacts', 'conversations', 'messages'
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
var isLightboxHandlersSetup = false;

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
  newChatPhoneName: document.getElementById('new-chat-phone-name'),
  newChatContactsDropdown: document.getElementById('new-chat-contacts-dropdown'),
  newChatAccount: document.getElementById('new-chat-account'),
  newChatInbox: document.getElementById('new-chat-inbox'),
  inboxWarning: document.getElementById('inbox-channel-warning'),
  btnModeContact: document.getElementById('btn-mode-contact'),
  btnModePhone: document.getElementById('btn-mode-phone'),
  groupContactSearch: document.getElementById('group-contact-search'),
  groupPhoneInput: document.getElementById('group-phone-input'),
  groupPhoneNameOptional: document.getElementById('group-phone-name-optional'),
  selectedContactCard: document.getElementById('selected-contact-card'),
  selectedContactName: document.getElementById('selected-contact-name'),
  selectedContactPhone: document.getElementById('selected-contact-phone'),
  btnRemoveSelectedContact: document.getElementById('btn-remove-selected-contact'),
  
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
  settingsGeminiKey: document.getElementById('settings-gemini-key'),
  btnToggleGeminiKey: document.getElementById('btn-toggle-gemini-key'),
  settingsDefaultAccount: document.getElementById('settings-default-account'),
  settingsDefaultInbox: document.getElementById('settings-default-inbox'),
  btnAiCorrectText: document.getElementById('btn-ai-correct-text'),
  
  // Toast
  toast: document.getElementById('toast'),
  toastMessage: document.querySelector('.toast-message'),

  // Tab: Conversations
  chatsSearchInput: document.getElementById('chats-search-input'),
  btnChatsSearchClear: document.getElementById('btn-chats-search-clear'),
  chatsDefaultFilterBar: document.getElementById('chats-default-filter-bar'),
  chatsSearchFilterBar: document.getElementById('chats-search-filter-bar'),
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
  chatReplyInput: document.getElementById('chat-reply-input'),
  btnTogglePrivateNote: document.getElementById('btn-toggle-private-note'),
  mentionPicker: document.getElementById('mention-picker'),
  mentionPickerList: document.getElementById('mention-picker-list'),
  mentionChipsBar: document.getElementById('mention-chips-bar'),
  mentionChipsList: document.getElementById('mention-chips-list'),
  contactInfoModal: document.getElementById('contact-info-modal'),
  btnContactInfoClose: document.getElementById('btn-contact-info-close'),
  btnContactInfoDismiss: document.getElementById('btn-contact-info-dismiss'),
  btnContactInfoViewPhoto: document.getElementById('btn-contact-info-view-photo'),
  contactModalAvatarWrapper: document.getElementById('contact-modal-avatar-wrapper'),
  contactModalAvatar: document.getElementById('contact-modal-avatar'),
  contactModalName: document.getElementById('contact-modal-name'),
  btnEditContactName: document.getElementById('btn-edit-contact-name'),
  contactNameDisplayContainer: document.getElementById('contact-name-display-container'),
  contactNameEditContainer: document.getElementById('contact-name-edit-container'),
  contactNameInput: document.getElementById('contact-name-input'),
  btnSaveContactName: document.getElementById('btn-save-contact-name'),
  btnCancelContactName: document.getElementById('btn-cancel-contact-name'),
  contactModalPhone: document.getElementById('contact-modal-phone'),
  contactModalValPhone: document.getElementById('contact-modal-val-phone'),
  contactModalValEmail: document.getElementById('contact-modal-val-email'),
  contactModalValInbox: document.getElementById('contact-modal-val-inbox'),
  contactModalValId: document.getElementById('contact-modal-val-id'),
  btnCopyContactPhone: document.getElementById('btn-copy-contact-phone'),
  aiOptionsPopover: document.getElementById('ai-options-popover'),
  btnAiOptCorrect: document.getElementById('btn-ai-opt-correct'),
  btnAiOptGenerate: document.getElementById('btn-ai-opt-generate'),
  aiGenerateModal: document.getElementById('ai-generate-modal'),
  btnAiGenerateClose: document.getElementById('btn-ai-generate-close'),
  btnAiGenerateCancel: document.getElementById('btn-ai-generate-cancel'),
  btnAiGenerateSubmit: document.getElementById('btn-ai-generate-submit'),
  btnAttachFile: document.getElementById('btn-attach-file'),
  chatFileInput: document.getElementById('chat-file-input'),
  btnAttachContact: document.getElementById('btn-attach-contact'),
  attachMenuPopover: document.getElementById('attach-menu-popover'),
  btnMenuAttachFiles: document.getElementById('btn-menu-attach-files'),
  btnMenuAttachContact: document.getElementById('btn-menu-attach-contact'),
  attachContactModal: document.getElementById('attach-contact-modal'),
  btnAttachContactClose: document.getElementById('btn-attach-contact-close'),
  attachContactSearchInput: document.getElementById('attach-contact-search-input'),
  attachContactDropdown: document.getElementById('attach-contact-dropdown'),
  attachContactName: document.getElementById('attach-contact-name'),
  attachContactPhone: document.getElementById('attach-contact-phone'),
  btnConfirmAttachContact: document.getElementById('btn-confirm-attach-contact')
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

    initPopupResizeHandler();

    // Setup tab navigation & event listeners first
    setupTabs();
    setupSettingsHandlers();
    setupTagHandlers();
    setupReportsHandlers();
    setupLightboxHandlers();
    setupContactNameEditing();
    setupAttachContactModal();
    setupContextMenuHandlers();
    setupBulkMessaging();
    if (typeof setupNewChatContactSearch === 'function') {
      setupNewChatContactSearch();
    }

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

    // Drag to Resize Extension Popup Height Handler
    function initPopupResizeHandler() {
      const footer = document.getElementById('app-footer-bar');
      if (!footer) return;

      const isWindowMode = document.body.classList.contains('standalone-app-mode') || document.body.classList.contains('chat-window-mode');
      const maxAllowedHeight = isWindowMode ? Math.min(950, (window.screen?.availHeight || 900) - 60) : 600;

      chrome.storage.local.get(['popupCustomHeight'], (res) => {
        if (res && res.popupCustomHeight) {
          const savedH = parseInt(res.popupCustomHeight, 10);
          if (!isNaN(savedH) && savedH >= 480) {
            const clampedH = Math.min(maxAllowedHeight, Math.max(480, savedH));
            document.body.style.height = `${clampedH}px`;
            document.documentElement.style.height = `${clampedH}px`;
          }
        }
      });

      let isDragging = false;
      let startY = 0;
      let startH = 0;

      footer.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const currentIsWindowMode = document.body.classList.contains('standalone-app-mode') || document.body.classList.contains('chat-window-mode');
        if (currentIsWindowMode) return;
        e.preventDefault();

        isDragging = true;
        startY = e.clientY;
        startH = document.body.offsetHeight || window.innerHeight || 560;
        footer.classList.add('resizing');
        document.body.style.userSelect = 'none';

        const onMouseMove = (moveEvent) => {
          if (!isDragging) return;
          const deltaY = moveEvent.clientY - startY;
          const newHeight = Math.max(480, Math.min(maxAllowedHeight, startH + deltaY));
          document.body.style.height = `${newHeight}px`;
          document.documentElement.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
          if (!isDragging) return;
          isDragging = false;
          footer.classList.remove('resizing');
          document.body.style.userSelect = '';

          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);

          const finalH = Math.min(maxAllowedHeight, Math.max(480, document.body.offsetHeight || parseInt(document.body.style.height, 10)));
          if (!isNaN(finalH)) {
            chrome.storage.local.set({ popupCustomHeight: finalH });
          }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

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
  let newChatPhoneDebounce = null;
  elements.newChatPhone.addEventListener('input', () => {
    if (newChatPhoneDebounce) clearTimeout(newChatPhoneDebounce);
    newChatPhoneDebounce = setTimeout(lookupContactByPhone, 350);
  });
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
  if (elements.chatsSearchInput) {
    elements.chatsSearchInput.addEventListener('input', () => {
      filterAndRenderConversations();
    });
  }

  // Conversations search clear button
  if (elements.btnChatsSearchClear) {
    elements.btnChatsSearchClear.addEventListener('click', () => {
      if (elements.chatsSearchInput) {
        elements.chatsSearchInput.value = '';
        activeSearchCategoryTab = 'all';
        filterAndRenderConversations();
      }
    });
  }

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

  // AI Correct Text Button (Opens AI Options Popover)
  if (elements.btnAiCorrectText) {
    elements.btnAiCorrectText.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.aiOptionsPopover) {
        elements.aiOptionsPopover.classList.toggle('hidden');
      }
    });
  }

  // AI Options Popover Handlers
  if (elements.btnAiOptCorrect) {
    elements.btnAiOptCorrect.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.aiOptionsPopover) elements.aiOptionsPopover.classList.add('hidden');
      correctTextWithGemini();
    });
  }

  if (elements.btnAiOptGenerate) {
    elements.btnAiOptGenerate.addEventListener('click', (e) => {
      e.stopPropagation();
      if (elements.aiOptionsPopover) elements.aiOptionsPopover.classList.add('hidden');
      openAiGenerateModal();
    });
  }

  // Close AI Options Popover & handle contact card chat button on click outside/delegation
  document.addEventListener('click', (e) => {
    if (elements.aiOptionsPopover && !elements.aiOptionsPopover.classList.contains('hidden')) {
      if (!e.target.closest('#ai-options-popover') && !e.target.closest('#btn-ai-correct-text')) {
        elements.aiOptionsPopover.classList.add('hidden');
      }
    }

    // Handle "Conversar" button click on WhatsApp Contact Cards
    const btnCardChat = e.target.closest('.btn-whatsapp-card-chat');
    if (btnCardChat) {
      e.preventDefault();
      e.stopPropagation();
      const rawPhone = btnCardChat.getAttribute('data-phone') || '';
      const name = btnCardChat.getAttribute('data-name') || '';
      const cleanPhone = rawPhone.replace(/[^\d]/g, '');

      // Check if a conversation with this phone number is already active/open in fetchedConversations or openConversationsCache
      const allConvs = [...fetchedConversations, ...openConversationsCache];
      const existingConv = allConvs.find(c => {
        if (!c) return false;
        const senderPhone = c.meta?.sender?.phone_number || c.sender?.phone_number || c.meta?.sender?.identifier || c.sender?.identifier || '';
        return isSamePhoneNumber(senderPhone, rawPhone);
      });

      if (existingConv) {
        showToast(`Abrindo conversa existente com ${existingConv.meta?.sender?.name || name}...`, 'info');
        openConversationChat(existingConv.id, existingConv.meta?.sender?.name || name, existingConv.account_id || config.defaultAccount, existingConv.inbox_id || config.defaultInbox);
        return;
      }

      // Save previous conversation context so user can easily navigate back
      const previousChatContext = currentActiveChat ? { ...currentActiveChat } : null;

      // If no active conversation found in local list, proceed to New Chat tab with prefilled phone
      switchTab('new-chat');

      // Show back button on new-chat tab if coming from an active conversation
      const btnBackToConv = document.getElementById('btn-new-chat-back-to-conversation');
      if (btnBackToConv) {
        if (previousChatContext) {
          btnBackToConv.classList.remove('hidden');
          btnBackToConv.onclick = (backEvt) => {
            backEvt.preventDefault();
            btnBackToConv.classList.add('hidden');
            openConversationChat(previousChatContext.id, previousChatContext.contactName, previousChatContext.accountId, previousChatContext.inboxId);
          };
        } else {
          btnBackToConv.classList.add('hidden');
        }
      }

      // Force switch mode to 'phone' via button click if available
      const btnModePhone = elements.btnModePhone || document.getElementById('btn-mode-phone');
      if (btnModePhone) {
        btnModePhone.click();
      }

      if (elements.newChatPhone && rawPhone) {
        elements.newChatPhone.value = rawPhone;
      }
      if (elements.newChatPhoneName && name) {
        elements.newChatPhoneName.value = name;
      }

      if (rawPhone) {
        lookupContactByPhone();
      }
    }
  });

  // AI Generate Modal Handlers
  if (elements.btnAiGenerateClose) {
    elements.btnAiGenerateClose.addEventListener('click', closeAiGenerateModal);
  }
  if (elements.btnAiGenerateCancel) {
    elements.btnAiGenerateCancel.addEventListener('click', closeAiGenerateModal);
  }
  if (elements.aiGenerateModal) {
    elements.aiGenerateModal.addEventListener('click', (e) => {
      if (e.target === elements.aiGenerateModal) closeAiGenerateModal();
    });
  }
  if (elements.btnAiGenerateSubmit) {
    elements.btnAiGenerateSubmit.addEventListener('click', generateTextWithGemini);
  }

  // Toggle Private Note mode
  if (elements.btnTogglePrivateNote) {
    elements.btnTogglePrivateNote.addEventListener('click', togglePrivateNoteMode);
  }

  // Agent Mention Event Listeners
  if (elements.chatReplyInput) {
    elements.chatReplyInput.addEventListener('input', handleChatInputForMentions);
    elements.chatReplyInput.addEventListener('keydown', handleChatKeydownForMentions);
  }

  // Contact Info Modal Handlers
  if (elements.chatHeaderAvatar) {
    elements.chatHeaderAvatar.addEventListener('click', () => openContactInfoModal());
  }
  if (elements.chatHeaderName) {
    elements.chatHeaderName.addEventListener('click', () => openContactInfoModal());
  }
  if (elements.btnContactInfoClose) {
    elements.btnContactInfoClose.addEventListener('click', closeContactInfoModal);
  }
  if (elements.btnContactInfoDismiss) {
    elements.btnContactInfoDismiss.addEventListener('click', closeContactInfoModal);
  }
  if (elements.contactInfoModal) {
    elements.contactInfoModal.addEventListener('click', (e) => {
      if (e.target === elements.contactInfoModal) closeContactInfoModal();
    });
  }
  if (elements.btnCopyContactPhone) {
    elements.btnCopyContactPhone.addEventListener('click', copyContactPhoneToClipboard);
  }

  // Global CSP-compliant image error handler for avatars
  document.addEventListener('error', (e) => {
    if (e.target && e.target.tagName === 'IMG' && e.target.getAttribute('data-initials')) {
      const initials = e.target.getAttribute('data-initials') || 'C';
      const parent = e.target.parentNode;
      if (parent) {
        parent.innerHTML = initials;
      }
    }
  }, true);

  // Global CSP-compliant click listener for top chat header
  document.addEventListener('click', (e) => {
    // Exclude header action buttons
    if (e.target.closest('#btn-chat-back, #btn-chat-popout, #btn-chat-reminder, #btn-chat-resolve, .btn-action-icon')) return;

    const headerTarget = e.target.closest('.chat-header-avatar, .chat-header-name, .chat-header-info');
    if (headerTarget) {
      openContactInfoModal();
    }
  });

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
  const chatFileInput = document.getElementById('chat-file-input');
  if (chatFileInput) {
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

let newChatSearchTimeout = null;
let currentNewChatMode = 'contact'; // 'contact' or 'phone'

function setupNewChatContactSearch() {
  const nameInput = elements.newChatName;
  const phoneInput = elements.newChatPhone;
  const phoneNameInput = elements.newChatPhoneName;
  const dropdown = elements.newChatContactsDropdown;
  const btnModeContact = elements.btnModeContact;
  const btnModePhone = elements.btnModePhone;
  const groupContactSearch = elements.groupContactSearch;
  const groupPhoneInput = elements.groupPhoneInput;
  const groupPhoneNameOptional = elements.groupPhoneNameOptional;
  const selectedContactCard = elements.selectedContactCard;
  const selectedContactName = elements.selectedContactName;
  const selectedContactPhone = elements.selectedContactPhone;
  const btnRemoveSelected = elements.btnRemoveSelectedContact;

  if (!btnModeContact || !btnModePhone) return;

  // Toggle Mode Handler
  const switchMode = (mode) => {
    currentNewChatMode = mode;
    if (mode === 'contact') {
      btnModeContact.classList.add('active');
      btnModePhone.classList.remove('active');
      groupContactSearch?.classList.remove('hidden');
      groupPhoneInput?.classList.add('hidden');
      groupPhoneNameOptional?.classList.add('hidden');
      if (phoneInput) phoneInput.required = false;
    } else {
      btnModePhone.classList.add('active');
      btnModeContact.classList.remove('active');
      groupContactSearch?.classList.add('hidden');
      groupPhoneInput?.classList.remove('hidden');
      groupPhoneNameOptional?.classList.remove('hidden');
      if (phoneInput) phoneInput.required = true;
      if (dropdown) dropdown.classList.add('hidden');
    }
  };

  btnModeContact.addEventListener('click', () => switchMode('contact'));
  btnModePhone.addEventListener('click', () => switchMode('phone'));

  // Clear selected contact card
  if (btnRemoveSelected) {
    btnRemoveSelected.addEventListener('click', () => {
      if (nameInput) nameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      selectedContactCard?.classList.add('hidden');
      nameInput?.classList.remove('hidden');
      nameInput?.focus();
    });
  }

  // Live Contact Search logic
  const performSearch = (query) => {
    if (currentNewChatMode !== 'contact') return;
    if (newChatSearchTimeout) clearTimeout(newChatSearchTimeout);

    const q = query.trim();
    if (q.length < 2) {
      if (dropdown) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
      }
      return;
    }

    newChatSearchTimeout = setTimeout(async () => {
      const accountId = elements.newChatAccount?.value || config?.defaultAccount;
      if (!accountId) {
        dropdown?.classList.add('hidden');
        return;
      }

      try {
        if (dropdown) {
          dropdown.innerHTML = `<div style="padding: 10px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Pesquisando contatos...</div>`;
          dropdown.classList.remove('hidden');
        }

        const res = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(q)}`);
        const contacts = res && Array.isArray(res) ? res : (res && Array.isArray(res.payload) ? res.payload : []);

        if (!dropdown) return;

        if (contacts.length === 0) {
          dropdown.innerHTML = `<div style="padding: 10px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Nenhum contato encontrado com esse nome. Mude para o modo "Telefone" para criar.</div>`;
          return;
        }

        dropdown.innerHTML = contacts.map(c => {
          const cName = c.name || 'Sem nome';
          const cPhone = c.phone_number || c.email || 'Sem telefone';
          const initial = (cName.charAt(0) || 'C').toUpperCase();
          const avatarUrl = c.thumbnail || c.avatar_url;

          return `
            <div class="contact-search-item" data-id="${c.id}" data-name="${encodeURIComponent(cName)}" data-phone="${encodeURIComponent(cPhone)}">
              ${avatarUrl ? `<img src="${avatarUrl}" class="contact-search-avatar">` : `<div class="contact-search-avatar">${initial}</div>`}
              <div class="contact-search-info">
                <span class="contact-search-name">${escapeHtml(cName)}</span>
                <span class="contact-search-detail">${escapeHtml(cPhone)}</span>
              </div>
            </div>
          `;
        }).join('');

        dropdown.querySelectorAll('.contact-search-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const selName = decodeURIComponent(item.getAttribute('data-name') || '');
            const selPhone = decodeURIComponent(item.getAttribute('data-phone') || '');

            if (nameInput) nameInput.value = selName;
            if (phoneInput && selPhone && selPhone !== 'Sem telefone') {
              phoneInput.value = selPhone;
            }

            if (dropdown) {
              dropdown.classList.add('hidden');
              dropdown.innerHTML = '';
            }

            // Show selected contact card summary
            if (selectedContactCard && selectedContactName && selectedContactPhone) {
              selectedContactName.textContent = selName;
              selectedContactPhone.textContent = selPhone !== 'Sem telefone' ? selPhone : 'Sem telefone registrado';
              selectedContactCard.classList.remove('hidden');
              if (nameInput) nameInput.classList.add('hidden');
            }

            showToast(`Contato "${selName}" selecionado!`, 'success');
          });
        });

      } catch (err) {
        console.warn('Error searching contacts:', err);
        if (dropdown) dropdown.classList.add('hidden');
      }
    }, 280);
  };

  if (nameInput) {
    nameInput.addEventListener('input', (e) => performSearch(e.target.value));
  }

  document.addEventListener('click', (e) => {
    if (dropdown && !e.target.closest('#new-chat-name') && !e.target.closest('#new-chat-contacts-dropdown')) {
      dropdown.classList.add('hidden');
    }
  });
}

// HELPER TO COMPARE BRAZILIAN PHONE NUMBERS FLEXIBLY (HANDLING 9TH DIGIT DIFFERENCES)
function isSamePhoneNumber(phone1, phone2) {
  if (!phone1 || !phone2) return false;
  const p1 = String(phone1).replace(/[^\d]/g, '');
  const p2 = String(phone2).replace(/[^\d]/g, '');
  if (!p1 || !p2) return false;

  // Exact digits match
  if (p1 === p2) return true;

  // Direct suffix match (e.g. 5563991017954 vs 6391017954 or 556391017954)
  if (p1.endsWith(p2) || p2.endsWith(p1)) return true;

  // Compare last 8 digits (main phone number body in Brazil)
  if (p1.length >= 8 && p2.length >= 8) {
    const tail1_8 = p1.slice(-8);
    const tail2_8 = p2.slice(-8);
    
    if (tail1_8 === tail2_8) {
      // Extract DDD (2 digits before the 8 digits or before the 9th digit '9')
      // p1 DDD:
      let ddd1 = '';
      if (p1.length === 10) ddd1 = p1.slice(0, 2);          // e.g. 63 91017954
      else if (p1.length === 11) ddd1 = p1.slice(0, 2);     // e.g. 63 9 91017954
      else if (p1.length === 12) ddd1 = p1.slice(2, 4);     // e.g. 55 63 91017954
      else if (p1.length >= 13) ddd1 = p1.slice(2, 4);      // e.g. 55 63 9 91017954

      // p2 DDD:
      let ddd2 = '';
      if (p2.length === 10) ddd2 = p2.slice(0, 2);          // e.g. 63 91017954
      else if (p2.length === 11) ddd2 = p2.slice(0, 2);     // e.g. 63 9 91017954
      else if (p2.length === 12) ddd2 = p2.slice(2, 4);     // e.g. 55 63 91017954
      else if (p2.length >= 13) ddd2 = p2.slice(2, 4);      // e.g. 55 63 9 91017954

      if (!ddd1 || !ddd2 || ddd1 === ddd2) {
        return true;
      }
    }
  }

  return false;
}

// GENERATE VCARD FILE FOR WHATSAPP CONTACT ATTACHMENT
function generateVCardFile(name, phone) {
  const cleanName = (name || 'Contato').trim();
  let cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  if (cleanPhone && !cleanPhone.startsWith('+')) {
    const defaultCountry = config.defaultCountryCode ? config.defaultCountryCode.replace(/[^\d+]/g, '') : '55';
    const country = defaultCountry.startsWith('+') ? defaultCountry : `+${defaultCountry}`;
    cleanPhone = `${country}${cleanPhone}`;
  }

  const nameParts = cleanName.split(' ');
  const firstName = nameParts[0] || cleanName;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  const vCardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${lastName};${firstName};;;`,
    `FN:${cleanName}`,
    `TEL;TYPE=CELL;TYPE=VOICE;TYPE=pref:${cleanPhone}`,
    'END:VCARD'
  ];

  const vCardString = vCardLines.join('\r\n');
  const safeFilename = cleanName.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.vcf';
  const blob = new Blob([vCardString], { type: 'text/vcard;charset=utf-8' });
  return new File([blob], safeFilename, { type: 'text/vcard' });
}

let attachContactSearchTimeout = null;

function setupAttachContactModal() {
  const modal = elements.attachContactModal || document.getElementById('attach-contact-modal');
  const btnClose = elements.btnAttachContactClose || document.getElementById('btn-attach-contact-close');
  const searchInput = elements.attachContactSearchInput || document.getElementById('attach-contact-search-input');
  const dropdown = elements.attachContactDropdown || document.getElementById('attach-contact-dropdown');
  const nameInput = elements.attachContactName || document.getElementById('attach-contact-name');
  const phoneInput = elements.attachContactPhone || document.getElementById('attach-contact-phone');
  const btnConfirm = elements.btnConfirmAttachContact || document.getElementById('btn-confirm-attach-contact');

  if (!modal) return;

  const openModal = () => {
    if (searchInput) searchInput.value = '';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (dropdown) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
    }
    modal.classList.remove('hidden');
    if (searchInput) searchInput.focus();
  };

  const closeModal = () => {
    modal.classList.add('hidden');
    if (dropdown) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
    }
  };

  // Robust global event delegation for attachment options
  document.addEventListener('click', (e) => {
    const btnAttachFile = e.target.closest('#btn-attach-file');
    const btnMenuFiles = e.target.closest('#btn-menu-attach-files');
    const btnMenuContact = e.target.closest('#btn-menu-attach-contact');
    const attachMenuPopover = document.getElementById('attach-menu-popover');

    if (btnAttachFile) {
      e.stopPropagation();
      e.preventDefault();
      if (attachMenuPopover) attachMenuPopover.classList.toggle('hidden');
      return;
    }

    if (btnMenuFiles) {
      e.stopPropagation();
      e.preventDefault();
      if (attachMenuPopover) attachMenuPopover.classList.add('hidden');
      const fileInput = elements.chatFileInput || document.getElementById('chat-file-input');
      if (fileInput) fileInput.click();
      return;
    }

    if (btnMenuContact) {
      e.stopPropagation();
      e.preventDefault();
      if (attachMenuPopover) attachMenuPopover.classList.add('hidden');
      openModal();
      return;
    }

    // Dismiss popover on outside click
    if (attachMenuPopover && !attachMenuPopover.classList.contains('hidden')) {
      if (!e.target.closest('#btn-attach-file') && !e.target.closest('#attach-menu-popover')) {
        attachMenuPopover.classList.add('hidden');
      }
    }
  });

  if (btnClose) btnClose.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Live Contact Search within Attach Contact Modal
  if (searchInput && dropdown) {
    searchInput.addEventListener('input', (e) => {
      if (attachContactSearchTimeout) clearTimeout(attachContactSearchTimeout);

      const q = e.target.value.trim();
      if (q.length < 2) {
        dropdown.classList.add('hidden');
        dropdown.innerHTML = '';
        return;
      }

      attachContactSearchTimeout = setTimeout(async () => {
        const accountId = currentActiveChat?.accountId || config?.defaultAccount;
        if (!accountId) return;

        try {
          dropdown.innerHTML = `<div style="padding: 10px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Pesquisando contatos...</div>`;
          dropdown.classList.remove('hidden');

          const res = await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(q)}`);
          const contacts = res && Array.isArray(res) ? res : (res && Array.isArray(res.payload) ? res.payload : []);

          if (contacts.length === 0) {
            dropdown.innerHTML = `<div style="padding: 10px; font-size: 11.5px; color: var(--text-muted); text-align: center;">Nenhum contato encontrado. Preencha manualmente abaixo.</div>`;
            return;
          }

          dropdown.innerHTML = contacts.map(c => {
            const cName = c.name || 'Sem nome';
            const cPhone = c.phone_number || c.email || 'Sem telefone';
            const initial = (cName.charAt(0) || 'C').toUpperCase();
            const avatarUrl = c.thumbnail || c.avatar_url;

            return `
              <div class="contact-search-item" data-name="${encodeURIComponent(cName)}" data-phone="${encodeURIComponent(cPhone)}">
                ${avatarUrl ? `<img src="${avatarUrl}" class="contact-search-avatar">` : `<div class="contact-search-avatar">${initial}</div>`}
                <div class="contact-search-info">
                  <span class="contact-search-name">${escapeHtml(cName)}</span>
                  <span class="contact-search-detail">${escapeHtml(cPhone)}</span>
                </div>
              </div>
            `;
          }).join('');

          dropdown.querySelectorAll('.contact-search-item').forEach(item => {
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              const selName = decodeURIComponent(item.getAttribute('data-name') || '');
              const selPhone = decodeURIComponent(item.getAttribute('data-phone') || '');

              if (nameInput) nameInput.value = selName;
              if (phoneInput && selPhone && selPhone !== 'Sem telefone') {
                phoneInput.value = selPhone;
              }

              dropdown.classList.add('hidden');
              dropdown.innerHTML = '';
              showToast(`Contato "${selName}" selecionado!`, 'info');
            });
          });

        } catch (err) {
          console.warn('Error searching contacts for attachment:', err);
          dropdown.classList.add('hidden');
        }
      }, 280);
    });
  }

  // Confirm Attach Contact
  if (btnConfirm) {
    btnConfirm.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';

      if (!name || !phone) {
        showToast('Preencha o nome e o telefone do contato.', 'error');
        return;
      }

      const vCardFile = generateVCardFile(name, phone);
      pendingAttachments.push(vCardFile);
      renderAttachmentsPreview();

      closeModal();
      showToast(`Contato "${name}" anexado como vCard (WhatsApp)!`, 'success');
    });
  }
}

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
        let finalConfig = null;
        if (syncData && syncData.url && syncData.token) {
          finalConfig = syncData;
          chrome.storage.local.set({ chatwootSettings: syncData });
        } else if (localData && localData.url && localData.token) {
          finalConfig = localData;
          chrome.storage.sync.set({ chatwootSettings: localData });
        } else {
          finalConfig = syncData || localData || null;
        }
        resolve(finalConfig);
      });
    });
  });
}

async function saveSettingsToStorage(newConfig) {
  return new Promise((resolve) => {
    isSelfSavingStorage = true;
    chrome.storage.sync.set({ chatwootSettings: newConfig }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Storage] Sync settings save notice:', chrome.runtime.lastError.message);
      }
      chrome.storage.local.set({ chatwootSettings: newConfig }, () => {
        setTimeout(() => { isSelfSavingStorage = false; }, 400);
        resolve();
      });
    });
  });
}

async function getRemindersFromStorage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (syncRes) => {
      const syncItemsMap = new Map();

      if (Array.isArray(syncRes?.chatwootReminders)) {
        syncRes.chatwootReminders.forEach(item => {
          if (item && item.id) syncItemsMap.set(String(item.id), item);
        });
      }

      if (syncRes) {
        Object.keys(syncRes).forEach(key => {
          if (key.startsWith('rem_')) {
            const item = syncRes[key];
            if (item && item.id) syncItemsMap.set(String(item.id), item);
          }
        });
      }

      chrome.storage.local.get(['chatwootReminders'], (localRes) => {
        const localList = Array.isArray(localRes?.chatwootReminders) ? localRes.chatwootReminders : [];
        const mergedMap = new Map();

        localList.forEach(item => {
          if (item && item.id) mergedMap.set(String(item.id), item);
        });

        syncItemsMap.forEach((syncItem, id) => {
          const localItem = mergedMap.get(id);
          if (!localItem) {
            mergedMap.set(id, syncItem);
          } else {
            const syncTime = syncItem.savedAt || 0;
            const localTime = localItem.savedAt || 0;
            if (syncTime >= localTime) {
              mergedMap.set(id, syncItem);
            }
          }
        });

        const mergedList = Array.from(mergedMap.values());
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

    chrome.storage.local.set({ chatwootReminders: sanitized }, () => {
      chrome.storage.sync.get(null, (existingSync) => {
        const currentSyncKeys = existingSync ? Object.keys(existingSync) : [];
        const newIds = new Set(sanitized.map(i => String(i.id)));
        const keysToRemove = currentSyncKeys.filter(k => k.startsWith('rem_') && !newIds.has(k.replace('rem_', '')));

        if (keysToRemove.length > 0) {
          chrome.storage.sync.remove(keysToRemove);
        }

        const syncPayload = {
          chatwootReminders: sanitized,
          chatwootReminderIndex: Array.from(newIds)
        };

        sanitized.forEach(item => {
          syncPayload[`rem_${item.id}`] = item;
        });

        chrome.storage.sync.set(syncPayload, () => {
          if (chrome.runtime.lastError) {
            console.warn('[Storage] Sync reminders save notice:', chrome.runtime.lastError.message);
          }
          setTimeout(() => { isSelfSavingStorage = false; }, 400);
          resolve(sanitized);
        });
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

    const autoTranscriptCheck = document.getElementById('settings-auto-transcript-email');
    if (autoTranscriptCheck && config.autoTranscriptEmail !== undefined) {
      autoTranscriptCheck.checked = config.autoTranscriptEmail;
    }

    if (elements.settingsGeminiKey) {
      elements.settingsGeminiKey.value = config.geminiApiKey || '';
    }

    updateAiButtonVisibility();
  }
}

function setupSettingsHandlers() {
  // Toggle password visibility
  elements.btnToggleToken.addEventListener('click', () => {
    const type = elements.settingsToken.getAttribute('type') === 'password' ? 'text' : 'password';
    elements.settingsToken.setAttribute('type', type);
  });

  if (elements.btnToggleGeminiKey && elements.settingsGeminiKey) {
    elements.btnToggleGeminiKey.addEventListener('click', () => {
      const type = elements.settingsGeminiKey.getAttribute('type') === 'password' ? 'text' : 'password';
      elements.settingsGeminiKey.setAttribute('type', type);
    });
  }

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
    
    const autoTranscriptCheck = document.getElementById('settings-auto-transcript-email');
    if (autoTranscriptCheck) {
      config.autoTranscriptEmail = autoTranscriptCheck.checked;
    }

    if (elements.settingsGeminiKey) {
      config.geminiApiKey = elements.settingsGeminiKey.value.trim();
    }

    updateAiButtonVisibility();

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

  if (response.status === 204) {
    return {};
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
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

  showToast('Lembrete salvo e sincronizado na conta Google!', 'success');
  
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

// INICIAR CONVERSA POR TELEFONE OU CONTATO
async function handleNewChatSubmit(e) {
  e.preventDefault();

  let phoneRaw = '';
  let name = '';

  if (currentNewChatMode === 'contact') {
    phoneRaw = elements.newChatPhone.value.trim();
    name = elements.newChatName.value.trim();
    if (!phoneRaw) {
      showToast('Pesquise e selecione um contato na lista.', 'error');
      return;
    }
  } else {
    phoneRaw = elements.newChatPhone.value.trim();
    name = elements.newChatPhoneName ? elements.newChatPhoneName.value.trim() : '';
    if (!phoneRaw) {
      showToast('Digite o número de telefone.', 'error');
      return;
    }
  }
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

const INBOX_PALETTE = [
  { text: '#34d399', bg: 'rgba(52, 211, 153, 0.22)', border: 'rgba(52, 211, 153, 0.55)' }, // Emerald Green
  { text: '#c084fc', bg: 'rgba(192, 132, 252, 0.22)', border: 'rgba(192, 132, 252, 0.55)' }, // Electric Purple
  { text: '#fbbf24', bg: 'rgba(251, 191, 36, 0.22)', border: 'rgba(251, 191, 36, 0.55)' }, // Amber Gold
  { text: '#38bdf8', bg: 'rgba(56, 189, 248, 0.22)', border: 'rgba(56, 189, 248, 0.55)' }, // Ocean Blue
  { text: '#f472b6', bg: 'rgba(244, 114, 182, 0.22)', border: 'rgba(244, 114, 182, 0.55)' }, // Neon Pink
  { text: '#22d3ee', bg: 'rgba(34, 211, 238, 0.22)', border: 'rgba(34, 211, 238, 0.55)' }, // Bright Cyan
  { text: '#f87171', bg: 'rgba(248, 113, 113, 0.22)', border: 'rgba(248, 113, 113, 0.55)' }, // Coral Red
  { text: '#a3e635', bg: 'rgba(163, 230, 53, 0.22)', border: 'rgba(163, 230, 53, 0.55)' }, // Lime Green
  { text: '#818cf8', bg: 'rgba(129, 140, 248, 0.22)', border: 'rgba(129, 140, 248, 0.55)' }, // Indigo
  { text: '#fb923c', bg: 'rgba(251, 146, 60, 0.22)', border: 'rgba(251, 146, 60, 0.55)' }  // Bright Orange
];

const inboxColorMap = new Map();

function getInboxColorStyles(inboxName) {
  const key = String(inboxName || '').trim().toUpperCase();
  if (!key) return INBOX_PALETTE[0];

  if (inboxColorMap.has(key)) {
    return inboxColorMap.get(key);
  }

  const assignedIndex = inboxColorMap.size % INBOX_PALETTE.length;
  const chosen = INBOX_PALETTE[assignedIndex];
  inboxColorMap.set(key, chosen);
  return chosen;
}

function resolveInboxNames() {
  const elementsToResolve = document.querySelectorAll('.inbox-name-badge:not(.resolved)');
  elementsToResolve.forEach(async (el) => {
    const accId = el.getAttribute('data-acc');
    const inboxId = el.getAttribute('data-inbox');
    const phone = el.getAttribute('data-phone');
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
    
    const nameFormGroup = elements.groupPhoneNameOptional || elements.newChatPhoneName?.closest('.form-group') || elements.newChatName?.closest('.form-group');

    if (contactFound) {
      // Contact found!
      if (elements.newChatPhoneName) elements.newChatPhoneName.value = contactFound.name || '';
      if (elements.newChatName) elements.newChatName.value = contactFound.name || '';
      
      // Hide the optional name input field completely since contact exists
      if (nameFormGroup) nameFormGroup.classList.add('hidden');
      
      searchHelper.innerHTML = `✓ Contato encontrado: <strong style="color:var(--success);">${escapeHtml(contactFound.name || 'Cliente')}</strong>`;
      searchHelper.className = 'helper-text success-text';
    } else {
      // Contact not found!
      if (elements.newChatPhoneName) elements.newChatPhoneName.value = '';
      
      // Show the optional name input field so user can type the name
      if (nameFormGroup) nameFormGroup.classList.remove('hidden');
      
      searchHelper.textContent = 'Novo contato (preencha o nome abaixo se desejar salvar).';
      searchHelper.className = 'helper-text';
    }
  } catch (err) {
    console.error('Error searching contact:', err);
    searchHelper.textContent = 'Erro ao verificar número na API.';
    searchHelper.className = 'helper-text warning-text';
    if (nameFormGroup) nameFormGroup.classList.remove('hidden');
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

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightSearchTerm(text, query) {
  if (!text) return '';
  if (!query) return escapeHtml(text);
  const safeText = escapeHtml(text);
  const safeQuery = escapeHtml(query);
  const regex = new RegExp(`(${safeQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safeText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

let searchDebounceTimeout = null;
let apiSearchResults = [];
let lastSearchQuery = '';
let currentSearchPage = 1;
let isLoadingMoreSearch = false;
let hasMoreSearchResults = true;
let currentTotalSearchMatches = 0;

async function loadMoreSearchPages(query) {
  if (!query || isLoadingMoreSearch || !currentAccountId || !hasMoreSearchResults) return;
  isLoadingMoreSearch = true;

  const btn = document.getElementById('btn-load-more-search');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:12px; height:12px; border-width:2px; margin:0 4px 0 0; display:inline-block; vertical-align:middle;"></span> Carregando mais antigas...`;
  }

  // Multi-container scroll position capture
  const scrollTargets = [
    document.querySelector('.app-content'),
    elements.chatsListView,
    document.querySelector('#chats'),
    document.documentElement,
    document.body
  ].filter(Boolean);

  const savedPositions = scrollTargets.map(el => ({ el, scrollTop: el.scrollTop }));

  const restoreScroll = () => {
    savedPositions.forEach(({ el, scrollTop }) => {
      if (scrollTop > 0) el.scrollTop = scrollTop;
    });
  };

  const countBefore = currentTotalSearchMatches;

  try {
    currentSearchPage++;
    const qEncoded = encodeURIComponent(query);
    const pageConvsMap = new Map();

    // 1. Search conversations endpoint page N
    try {
      const searchRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/conversations/search?q=${qEncoded}&page=${currentSearchPage}`);
      const convs = extractConversationsArray(searchRes);
      convs.forEach(c => { if (c && c.id) pageConvsMap.set(String(c.id), c); });
    } catch (e) {}

    // 2. Search conversations list endpoint page N with q
    try {
      const listRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/conversations?status=all&q=${qEncoded}&page=${currentSearchPage}`);
      const convs = extractConversationsArray(listRes);
      convs.forEach(c => { if (c && c.id) pageConvsMap.set(String(c.id), c); });
    } catch (e) {}

    // 3. Load all conversations list page N
    try {
      const allRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/conversations?status=all&page=${currentSearchPage}`);
      const convs = extractConversationsArray(allRes);
      convs.forEach(c => { if (c && c.id) pageConvsMap.set(String(c.id), c); });
    } catch (e) {}

    const newConvs = Array.from(pageConvsMap.values());
    if (newConvs.length > 0) {
      const existingMap = new Map();
      apiSearchResults.forEach(c => { if (c && c.id) existingMap.set(String(c.id), c); });
      newConvs.forEach(c => {
        if (c && c.id && !existingMap.has(String(c.id))) {
          existingMap.set(String(c.id), c);
        }
      });
      apiSearchResults = Array.from(existingMap.values());

      filterAndRenderConversations();
      restoreScroll();
      requestAnimationFrame(restoreScroll);
      setTimeout(restoreScroll, 50);

      const countAfter = currentTotalSearchMatches;
      const actualAdded = countAfter - countBefore;

      if (actualAdded > 0) {
        showToast(`${actualAdded} ${actualAdded === 1 ? 'nova mensagem adicionada' : 'novas mensagens adicionadas'}.`, 'success');
      } else {
        hasMoreSearchResults = false;
        showToast('Você chegou ao fim da lista. Não há mais mensagens para carregar.', 'info');
        filterAndRenderConversations();
        restoreScroll();
      }
    } else {
      hasMoreSearchResults = false;
      showToast('Você chegou ao fim da lista. Não há mais mensagens para carregar.', 'info');
      filterAndRenderConversations();
      restoreScroll();
    }
  } catch (err) {
    console.error('Error loading more search pages:', err);
    showToast('Erro ao carregar mensagens antigas.', 'danger');
  } finally {
    isLoadingMoreSearch = false;
    restoreScroll();
    requestAnimationFrame(restoreScroll);
  }
}

async function performApiSearch(query) {
  if (!query || query.length < 2 || !currentAccountId) return [];
  
  try {
    const qEncoded = encodeURIComponent(query);
    const resultsMap = new Map();

    // 1. Chatwoot Search Conversations Endpoint
    try {
      const searchRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/conversations/search?q=${qEncoded}`);
      const convs = extractConversationsArray(searchRes);
      convs.forEach(c => {
        if (c && c.id) resultsMap.set(String(c.id), c);
      });
    } catch (e) {}

    // 2. Chatwoot Search Conversations with q param on list
    try {
      const listRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/conversations?status=all&q=${qEncoded}`);
      const convs = extractConversationsArray(listRes);
      convs.forEach(c => {
        if (c && c.id) resultsMap.set(String(c.id), c);
      });
    } catch (e) {}

    // 3. Chatwoot Search Contacts Endpoint
    try {
      const contactsRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/contacts/search?q=${qEncoded}`);
      const contacts = Array.isArray(contactsRes) ? contactsRes : (contactsRes?.payload || contactsRes?.data || []);
      if (Array.isArray(contacts) && contacts.length > 0) {
        for (const contact of contacts.slice(0, 5)) {
          if (!contact.id) continue;
          try {
            const contactConvsRes = await chatwootFetch(`/api/v1/accounts/${currentAccountId}/contacts/${contact.id}/conversations`);
            const convs = extractConversationsArray(contactConvsRes);
            convs.forEach(c => {
              if (c && c.id) resultsMap.set(String(c.id), c);
            });
          } catch (err) {}
        }
      }
    } catch (e) {}

    return Array.from(resultsMap.values());
  } catch (err) {
    console.error('Error during API search:', err);
    return [];
  }
}

function normalizeSearchString(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function filterAndRenderConversations() {
  try {
    const rawQuery = elements.chatsSearchInput ? elements.chatsSearchInput.value : '';
    const query = rawQuery.trim();
    const normalizedQuery = normalizeSearchString(query);
    
    // Decide which source array to use based on active filter
    let sourceConversations;
    if (activeChatFilter === 'resolved') {
      sourceConversations = fetchedConversations.filter(item => item && item.status === 'resolved');
    } else {
      const openSource = openConversationsCache.length > 0 ? openConversationsCache : fetchedConversations;
      sourceConversations = openSource.filter(item => item && item.status !== 'resolved');
    }

    if (!normalizedQuery) {
      apiSearchResults = [];
      lastSearchQuery = '';
      currentSearchPage = 1;
      hasMoreSearchResults = true;
      if (elements.btnChatsSearchClear) elements.btnChatsSearchClear.classList.add('hidden');
      if (elements.chatsDefaultFilterBar) elements.chatsDefaultFilterBar.classList.remove('hidden');
      if (elements.chatsSearchFilterBar) elements.chatsSearchFilterBar.classList.add('hidden');
      activeSearchCategoryTab = 'all';

      sourceConversations.forEach(item => { if (item) delete item._searchMatch; });
      renderConversationsList(sourceConversations, currentAccountId, '');
      return;
    }

    if (normalizedQuery !== lastSearchQuery) {
      hasMoreSearchResults = true;
    }

    // Show clear button & search filter category tabs bar
    if (elements.btnChatsSearchClear) elements.btnChatsSearchClear.classList.remove('hidden');
    if (elements.chatsDefaultFilterBar) elements.chatsDefaultFilterBar.classList.add('hidden');
    if (elements.chatsSearchFilterBar) elements.chatsSearchFilterBar.classList.remove('hidden');

    // Merge all available conversation sources for deep search across ALL conversations (open and resolved)
    const mergedMap = new Map();
    [...openConversationsCache, ...fetchedConversations, ...apiSearchResults].forEach(item => {
      if (item && item.id) {
        mergedMap.set(String(item.id), item);
      }
    });

    const combinedList = Array.from(mergedMap.values());

    const contactsMatches = [];
    const conversationsMatches = [];
    const messagesMatches = [];

    combinedList.forEach(item => {
      if (!item) return;

      const contactName = normalizeSearchString(item.meta?.sender?.name);
      const contactPhone = normalizeSearchString(item.meta?.sender?.phone_number);
      const contactEmail = normalizeSearchString(item.meta?.sender?.email);
      const channelName = normalizeSearchString(item.inbox?.name || item.meta?.channel);
      const convIdStr = normalizeSearchString(item.id);
      const lastNonActMsg = normalizeSearchString(item.last_non_activity_message?.content);

      const nameMatch = contactName.includes(normalizedQuery);
      const phoneMatch = contactPhone.includes(normalizedQuery);
      const emailMatch = contactEmail.includes(normalizedQuery);
      const channelMatch = channelName.includes(normalizedQuery);
      const idMatch = convIdStr.includes(normalizedQuery) || (`#${convIdStr}`).includes(normalizedQuery);
      const lastMsgMatch = lastNonActMsg.includes(normalizedQuery);

      let matchingMsgContent = null;
      if (lastMsgMatch && item.last_non_activity_message?.content) {
        matchingMsgContent = item.last_non_activity_message.content;
      }

      if (Array.isArray(item.messages)) {
        for (let i = item.messages.length - 1; i >= 0; i--) {
          const msg = item.messages[i];
          if (msg && msg.content) {
            const normContent = normalizeSearchString(msg.content);
            if (normContent.includes(normalizedQuery)) {
              matchingMsgContent = msg.content;
              break;
            }
          }
        }
      }

      if (nameMatch || phoneMatch || emailMatch || idMatch || channelMatch) {
        const cloned = Object.assign({}, item, { _searchMatch: { type: 'contact' } });
        contactsMatches.push(cloned);
      }

      if (matchingMsgContent) {
        const cloned = Object.assign({}, item, { _searchMatch: { type: 'message', content: matchingMsgContent } });
        messagesMatches.push(cloned);
      }
    });

    const cCount = contactsMatches.length;
    const mCount = messagesMatches.length;
    const totalCount = cCount + mCount;
    currentTotalSearchMatches = totalCount;

    // Render Search Category Chips (Todos, Contatos, Mensagens)
    if (elements.chatsSearchFilterBar) {
      elements.chatsSearchFilterBar.innerHTML = `
        <button type="button" class="search-category-chip ${activeSearchCategoryTab === 'all' ? 'active' : ''}" data-category="all">
          Todos <span class="search-category-count">(${totalCount})</span>
        </button>
        <button type="button" class="search-category-chip ${activeSearchCategoryTab === 'contacts' ? 'active' : ''}" data-category="contacts">
          Contatos <span class="search-category-count">(${cCount})</span>
        </button>
        <button type="button" class="search-category-chip ${activeSearchCategoryTab === 'messages' ? 'active' : ''}" data-category="messages">
          Mensagens <span class="search-category-count">(${mCount})</span>
        </button>
      `;

      elements.chatsSearchFilterBar.querySelectorAll('.search-category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          activeSearchCategoryTab = chip.getAttribute('data-category') || 'all';
          filterAndRenderConversations();
        });
      });
    }

    if (activeSearchCategoryTab === 'contacts') {
      renderConversationsList(contactsMatches, currentAccountId, rawQuery.trim());
    } else if (activeSearchCategoryTab === 'messages') {
      renderConversationsList(messagesMatches, currentAccountId, rawQuery.trim());
    } else {
      renderConversationsList({
        isCategorized: true,
        contacts: contactsMatches,
        messages: messagesMatches
      }, currentAccountId, rawQuery.trim());
    }

    // Trigger API search in background if query changed
    if (normalizedQuery.length >= 2 && normalizedQuery !== lastSearchQuery) {
      lastSearchQuery = normalizedQuery;
      if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(async () => {
        const apiConvs = await performApiSearch(query);
        if (apiConvs.length > 0) {
          apiSearchResults = apiConvs;
          filterAndRenderConversations();
        }
      }, 350);
    }
  } catch (err) {
    console.error('Error filtering conversations:', err);
  }
}

function getSenderAvatarUrl(sender) {
  if (!sender) return '';
  return sender.avatar_url || sender.thumbnail || sender.additional_attributes?.avatar_url || sender.additional_attributes?.profile_user?.avatar_url || '';
}

function getAvatarContent(contactName, avatarUrl) {
  const initials = contactName ? contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim()) {
    let fullUrl = avatarUrl.trim();
    if (!fullUrl.startsWith('http')) {
      const baseUrl = (config.url || '').endsWith('/') ? config.url.slice(0, -1) : (config.url || '');
      const relativeUrl = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
      fullUrl = baseUrl + relativeUrl;
    }
    return `<img src="${fullUrl}" alt="${escapeHtml(contactName)}" data-initials="${initials}" />`;
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

function createConversationCardElement(item, accountId, searchQuery, openIds) {
  const strId = String(item.id);
  const isOpenWindow = openIds && openIds.has(strId);
  if (isOpenWindow) {
    item.unread_count = 0;
  }

  const contactName = item.meta?.sender?.name || 'Cliente';
  const avatarUrl = getSenderAvatarUrl(item.meta?.sender || item.sender);
  const avatarContent = getAvatarContent(contactName, avatarUrl);
  
  const lastMsgObj = Array.isArray(item.messages) && item.messages.length > 0 ? item.messages[item.messages.length - 1] : null;
  let lastMsgText = 'Nova conversa criada';
  let isMatchSnippet = false;

  if (item._searchMatch && item._searchMatch.type === 'message' && item._searchMatch.content) {
    lastMsgText = `💬 "${item._searchMatch.content}"`;
    isMatchSnippet = true;
  } else if (lastMsgObj) {
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

  const phoneNumber = item.meta?.sender?.phone_number || item.meta?.sender?.identifier || '';
  const displayNameHtml = searchQuery ? highlightSearchTerm(contactName, searchQuery) : escapeHtml(contactName);
  const displayPhoneHtml = searchQuery && phoneNumber ? highlightSearchTerm(phoneNumber, searchQuery) : escapeHtml(phoneNumber);
  const displayMsgHtml = searchQuery ? highlightSearchTerm(lastMsgText, searchQuery) : escapeHtml(lastMsgText);

  const card = document.createElement('div');
  card.className = itemClass;
  card.setAttribute('data-id', strId);
  card.innerHTML = `
    <div class="chat-item-avatar">${avatarContent}</div>
    <div class="chat-item-content">
      <div class="chat-item-top">
        <span class="chat-item-name">${displayNameHtml}</span>
        <span class="chat-item-time">${timeStr}</span>
      </div>
      ${phoneNumber ? `<div class="chat-item-phone">${displayPhoneHtml}</div>` : ''}
      <div class="chat-item-bottom">
        <span class="chat-item-msg ${isMatchSnippet ? 'matching-msg' : ''}">${displayMsgHtml}</span>
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

  return card;
}

async function renderConversationsList(data, accountId, searchQuery = '') {
  try {
    if (!elements.chatsList) return;

    // Search results banner
    let bannerEl = elements.chatsList.parentElement ? elements.chatsList.parentElement.querySelector('.search-results-banner') : null;
    if (searchQuery) {
      const bannerHtml = `
        <div class="search-results-banner">
          <span>🔍 "${escapeHtml(searchQuery)}"</span>
        </div>
      `;
      if (bannerEl) {
        bannerEl.outerHTML = bannerHtml;
      } else if (elements.chatsList.parentElement) {
        elements.chatsList.insertAdjacentHTML('beforebegin', bannerHtml);
      }
    } else if (bannerEl) {
      bannerEl.remove();
    }

    // Categorized layout for 'Todos' tab
    if (data && data.isCategorized) {
      const { contacts = [], messages = [] } = data;
      const totalMatches = contacts.length + messages.length;

      if (totalMatches === 0) {
        elements.chatsList.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <h3>Nenhum resultado encontrado</h3>
            <p>Não foram encontrados resultados contendo "${escapeHtml(searchQuery)}".</p>
          </div>
        `;
        return;
      }

      elements.chatsList.innerHTML = '';

      let openIds = new Set();
      try { openIds = await getCurrentlyOpenConversationIds(); } catch (e) {}

      // Contatos Section
      if (contacts.length > 0) {
        const sectionGroup = document.createElement('div');
        sectionGroup.className = 'search-section-group';
        sectionGroup.innerHTML = `
          <div class="search-section-header">
            <div class="search-section-title-wrap">
              <span class="search-section-arrow">▼</span>
              <span>Contatos (${contacts.length})</span>
            </div>
          </div>
          <div class="search-section-items"></div>
        `;
        const itemsContainer = sectionGroup.querySelector('.search-section-items');
        contacts.forEach(item => {
          itemsContainer.appendChild(createConversationCardElement(item, accountId, searchQuery, openIds));
        });
        sectionGroup.querySelector('.search-section-header').addEventListener('click', () => {
          sectionGroup.classList.toggle('collapsed');
        });
        elements.chatsList.appendChild(sectionGroup);
      }

      // Mensagens Section
      if (messages.length > 0) {
        const sectionGroup = document.createElement('div');
        sectionGroup.className = 'search-section-group';
        sectionGroup.innerHTML = `
          <div class="search-section-header">
            <div class="search-section-title-wrap">
              <span class="search-section-arrow">▼</span>
              <span>Mensagens (${messages.length})</span>
            </div>
          </div>
          <div class="search-section-items"></div>
        `;
        const itemsContainer = sectionGroup.querySelector('.search-section-items');
        messages.forEach(item => {
          itemsContainer.appendChild(createConversationCardElement(item, accountId, searchQuery, openIds));
        });
        sectionGroup.querySelector('.search-section-header').addEventListener('click', () => {
          sectionGroup.classList.toggle('collapsed');
        });
        elements.chatsList.appendChild(sectionGroup);
      }

      appendLoadMoreSearchButton(searchQuery);

      if (typeof updateUnreadBadgeLocal === 'function') updateUnreadBadgeLocal();
      if (typeof resolveInboxNames === 'function') resolveInboxNames();
      return;
    }

    // Single array list rendering (individual tab selected or default list)
    const conversations = Array.isArray(data) ? data : [];
    const safeConversations = conversations.filter(c => c && c.id);

    if (safeConversations.length === 0) {
      elements.chatsList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <h3>${searchQuery ? 'Nenhum resultado encontrado' : 'Nenhuma Conversa'}</h3>
          <p>${searchQuery ? `Não foram encontradas conversas ou mensagens contendo "${escapeHtml(searchQuery)}".` : 'Não há conversas abertas correspondentes ao filtro atual.'}</p>
        </div>
      `;
      appendLoadMoreSearchButton(searchQuery);
      return;
    }

    let openIds = new Set();
    try { openIds = await getCurrentlyOpenConversationIds(); } catch (e) {}

    const validIds = new Set(safeConversations.map(c => String(c.id)));

    // Clean up loading indicators, empty states, or non-chat-item elements
    Array.from(elements.chatsList.children).forEach(child => {
      if (!child.classList.contains('chat-item') && !child.classList.contains('search-load-more-container')) {
        child.remove();
      } else if (child.classList.contains('chat-item')) {
        const cardId = child.getAttribute('data-id');
        if (cardId && !validIds.has(cardId)) {
          child.remove();
        }
      }
    });

    safeConversations.forEach(item => {
      const card = createConversationCardElement(item, accountId, searchQuery, openIds);
      const strId = String(item.id);
      const existingCard = elements.chatsList.querySelector(`[data-id="${strId}"]`);
      if (existingCard) {
        existingCard.replaceWith(card);
      } else {
        elements.chatsList.appendChild(card);
      }
    });

    appendLoadMoreSearchButton(searchQuery);

    if (typeof updateUnreadBadgeLocal === 'function') updateUnreadBadgeLocal();
    if (typeof resolveInboxNames === 'function') resolveInboxNames();
  } catch (err) {
    console.error('Error rendering conversations list:', err);
  }
}

function appendLoadMoreSearchButton(searchQuery) {
  if (!elements.chatsList) return;
  const existingWrapper = elements.chatsList.querySelector('.search-load-more-container');

  if (!searchQuery || !hasMoreSearchResults) {
    if (existingWrapper) existingWrapper.remove();
    return;
  }

  if (!existingWrapper) {
    const loadMoreWrapper = document.createElement('div');
    loadMoreWrapper.className = 'search-load-more-container';
    loadMoreWrapper.style.cssText = 'text-align: center; margin: 16px 0 12px 0; width: 100%;';
    loadMoreWrapper.innerHTML = `
      <button type="button" id="btn-load-more-search" class="btn btn-secondary btn-sm" style="font-size: 11.5px; padding: 6px 14px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; margin: 0 auto; border-radius: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
        Carregar mensagens mais antigas
      </button>
    `;
    elements.chatsList.appendChild(loadMoreWrapper);

    const btnLoadMore = loadMoreWrapper.querySelector('#btn-load-more-search');
    if (btnLoadMore) {
      btnLoadMore.addEventListener('click', () => {
        loadMoreSearchPages(searchQuery);
      });
    }
  } else {
    elements.chatsList.appendChild(existingWrapper);
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

  const conversation = [...fetchedConversations, ...openConversationsCache].find(c => c && c.id === conversationId);
  const senderObj = conversation?.meta?.sender || conversation?.sender;
  const senderId = senderObj?.id;

  let avatarUrl = '';
  let phoneNumber = '';
  if (conversation) {
    avatarUrl = getSenderAvatarUrl(senderObj);
    phoneNumber = senderObj?.phone_number || senderObj?.identifier || '';
  }

  currentActiveChat = {
    id: conversationId,
    contactName: contactName,
    accountId: accountId,
    inboxId: inboxId,
    contactId: senderId,
    senderId: senderId,
    sender: senderObj,
    phone: phoneNumber
  };

  currentChatMessages = [];
  hasOlderMessages = false;
  isLoadingOlderMessages = false;
  lastRenderedRawHtml = '';

  elements.chatHeaderAvatar.innerHTML = getAvatarContent(contactName, avatarUrl);

  elements.chatHeaderMeta.textContent = phoneNumber ? `${phoneNumber} • Carregando caixa de entrada...` : 'Carregando caixa de entrada...';
  
  getInboxName(accountId, inboxId).then(inboxName => {
    if (inboxName && currentActiveChat && currentActiveChat.id === conversationId) {
      elements.chatHeaderMeta.textContent = phoneNumber ? `${phoneNumber} • ${inboxName}` : inboxName;
    }
  });

  chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}`)
    .then(conv => {
      if (conv && currentActiveChat && currentActiveChat.id === conversationId) {
        const fetchedAvatar = getSenderAvatarUrl(conv.meta?.sender || conv.sender);
        if (fetchedAvatar) {
          elements.chatHeaderAvatar.innerHTML = getAvatarContent(contactName, fetchedAvatar);
        }
        const fetchedPhone = conv.meta?.sender?.phone_number || conv.meta?.sender?.identifier || '';
        if (fetchedPhone) {
          phoneNumber = fetchedPhone;
          if (currentActiveChat && currentActiveChat.id === conversationId) {
            currentActiveChat.phone = fetchedPhone;
          }
          getInboxName(accountId, inboxId).then(inboxName => {
            if (inboxName && currentActiveChat && currentActiveChat.id === conversationId) {
              elements.chatHeaderMeta.textContent = `${phoneNumber} • ${inboxName}`;
            }
          });
        }
      }
    }).catch(err => console.warn('Could not fetch conversation details:', err));

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
      const isActivity = type === 2 || type === 'activity';
      const isPrivateNote = (msg.private === true || type === 'private') && !isActivity;
      
      let bubbleClass = 'chat-msg-bubble';
      if (isActivity) {
        bubbleClass += ' activity';
      } else if (isPrivateNote) {
        bubbleClass += ' private-note';
      } else if (type === 0 || type === 'incoming') {
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
      let isTextContact = false;

      // Check if message content is a text-formatted contact sent by WhatsApp/Chatwoot
      if (msg.content) {
        const textContent = msg.content.trim();
        const lowerText = textContent.toLowerCase();
        const isContactTextPattern = lowerText.includes('contato:') || (lowerText.includes('nome:') && (lowerText.includes('número') || lowerText.includes('numero') || lowerText.includes('telefone')));
        
        if (isContactTextPattern) {
          isTextContact = true;
          let cardName = 'Contato';
          let cardPhone = '';

          const nameMatch = textContent.match(/Nome:\s*([^\r\n]+)/i);
          if (nameMatch) cardName = nameMatch[1].replace(/^[\s\*_`"']+|[\s\*_`"']+$/g, '').trim();

          const phoneMatch = textContent.match(/(?:Número|Numero|Telefone)(?:\s*\(\d+\))?:\s*([^\r\n]+)/i) || textContent.match(/\+?\d[\d\s\-\(\)]{7,}\d/);
          if (phoneMatch) cardPhone = (phoneMatch[1] || phoneMatch[0]).replace(/^[\s\*_`"']+|[\s\*_`"']+$/g, '').trim();

          const initial = cardName ? cardName.charAt(0).toUpperCase() : '👤';

          // Check if contact phone matches current active conversation's contact phone or sender phone (own contact)
          const headerMetaText = elements.chatHeaderMeta ? elements.chatHeaderMeta.textContent : '';
          const headerPhoneMatch = headerMetaText ? headerMetaText.match(/\+?\d[\d\s\-\(\)]{7,}\d/) : null;
          const headerPhone = headerPhoneMatch ? headerPhoneMatch[0] : '';

          const activePhone = currentActiveChat?.phone || currentActiveChat?.sender?.phone_number || currentActiveChat?.sender?.identifier || headerPhone || '';
          const isSelfContact = isSamePhoneNumber(cardPhone, activePhone);

          const btnChatHtml = isSelfContact ? '' : `
            <div class="whatsapp-card-divider"></div>
            <button type="button" class="btn-whatsapp-card-chat" data-phone="${escapeHtml(cardPhone)}" data-name="${escapeHtml(cardName)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Conversar
            </button>
          `;

          contentHtml = `
            <div class="msg-attachment whatsapp-contact-card" style="margin-top: 0;">
              <div class="whatsapp-card-header">
                <div class="whatsapp-card-avatar">${initial}</div>
                <div class="whatsapp-card-info">
                  <span class="whatsapp-card-name">${escapeHtml(cardName)}</span>
                  <span class="whatsapp-card-phone">${cardPhone ? escapeHtml(cardPhone) : 'Contato WhatsApp'}</span>
                </div>
              </div>
              ${btnChatHtml}
            </div>
          `;
        } else {
          contentHtml = `<span class="chat-msg-text">${formatWhatsAppMarkdown(msg.content)}</span>`;
        }
      }

      // Render attachments (images, video players, audio players, files, contacts/vCards)
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          const filename = att.file_name || (att.data_url ? att.data_url.split('/').pop() : 'arquivo');
          const isVCard = (att.file_type === 'fallback' && (filename.toLowerCase().endsWith('.vcf') || (att.data_url && att.data_url.includes('.vcf')))) || att.file_type === 'vcard';

          if (isVCard) {
            let cardName = filename.replace(/\.vcf$/i, '').replace(/_/g, ' ');
            let cardPhone = '';
            
            // Try extracting phone if embedded in filename or content
            const phoneMatch = cardName.match(/\+?\d{8,15}/);
            if (phoneMatch) {
              cardPhone = phoneMatch[0];
              cardName = cardName.replace(cardPhone, '').trim() || 'Contato';
            }

            const initial = cardName ? cardName.charAt(0).toUpperCase() : '👤';

            // Check if contact phone matches current active conversation's contact phone or sender phone (own contact)
            const headerMetaText = elements.chatHeaderMeta ? elements.chatHeaderMeta.textContent : '';
            const headerPhoneMatch = headerMetaText ? headerMetaText.match(/\+?\d[\d\s\-\(\)]{7,}\d/) : null;
            const headerPhone = headerPhoneMatch ? headerPhoneMatch[0] : '';

            const activePhone = currentActiveChat?.phone || currentActiveChat?.sender?.phone_number || currentActiveChat?.sender?.identifier || headerPhone || '';
            const isSelfContact = isSamePhoneNumber(cardPhone, activePhone);

            const btnChatHtml = isSelfContact ? '' : `
              <div class="whatsapp-card-divider"></div>
              <button type="button" class="btn-whatsapp-card-chat" data-phone="${escapeHtml(cardPhone)}" data-name="${escapeHtml(cardName)}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                Conversar
              </button>
            `;

            contentHtml += `
              <div class="msg-attachment whatsapp-contact-card">
                <div class="whatsapp-card-header">
                  <div class="whatsapp-card-avatar">${initial}</div>
                  <div class="whatsapp-card-info">
                    <span class="whatsapp-card-name">${escapeHtml(cardName)}</span>
                    <span class="whatsapp-card-phone">${cardPhone ? escapeHtml(cardPhone) : 'Contato WhatsApp'}</span>
                  </div>
                </div>
                ${btnChatHtml}
              </div>
            `;
          } else if (att.file_type === 'image') {
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
        let avatarUrl = getSenderAvatarUrl(msg.sender);
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const baseUrl = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
          const relativeUrl = avatarUrl.startsWith('/') ? avatarUrl : '/' + avatarUrl;
          avatarUrl = baseUrl + relativeUrl;
        }

        const initials = senderName ? senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
        const avatarHtml = avatarUrl
          ? `<img src="${avatarUrl}" class="chat-msg-sender-avatar" title="${senderName}" alt="${senderName}" data-initials="${initials}" />`
          : `<div class="chat-msg-sender-avatar-initials" title="${senderName}">${initials}</div>`;

        const privateNoteBadge = isPrivateNote ? `
          <span class="private-note-badge" title="Nota Privada (visível apenas para a equipe)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </span>
        ` : '';

        if (isOutgoing || isPrivateNote) {
          messagesHtml += `
            <div class="chat-msg-row outgoing${isPrivateNote ? ' private-row' : ''}">
              <div class="${bubbleClass}${agentColorClass}" data-msg-id="${msg.id}" data-msg-content="${cleanContent}" data-sender-name="${senderName}">
                <button type="button" class="btn-msg-menu" title="Opções da mensagem">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                ${quoteHtml}
                ${contentHtml}
                ${linkPreviewHtml}
                ${reactionsHtml}
                ${privateNoteBadge}
                <span class="chat-msg-time">${timeStr}</span>
              </div>
              ${avatarHtml}
            </div>
          `;
        } else {
          messagesHtml += `
            <div class="chat-msg-row incoming">
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

const sentTranscriptsSet = new Set();

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
    
    if (newStatus === 'resolved') {
      const autoTranscriptCheck = document.getElementById('settings-auto-transcript-email');
      const shouldSend = autoTranscriptCheck ? autoTranscriptCheck.checked : (config.autoTranscriptEmail !== false);
      const transcriptKey = `${accountId}_${conversationId}`;
      
      if (shouldSend && !sentTranscriptsSet.has(transcriptKey)) {
        sentTranscriptsSet.add(transcriptKey);
        try {
          let agentEmail = config.agentEmail;
          if (!agentEmail) {
            const profile = await chatwootFetch('/api/v1/profile');
            if (profile && profile.email) {
              agentEmail = profile.email;
              config.agentEmail = agentEmail;
              saveSettingsToStorage(config);
            }
          }
          if (agentEmail) {
            await chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}/transcript`, {
              method: 'POST',
              body: JSON.stringify({ email: agentEmail })
            });
            showToast(`✉️ Transcrição enviada para ${agentEmail}!`, 'success');
          }
        } catch (tErr) {
          console.warn('Could not send transcript email:', tErr.message);
          showToast(`Aviso: Servidor de e-mail do Chatwoot indisponível (${tErr.message})`, 'info');
        }
      }
    }
    
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
    
    // Convert clean @Agent Name text into Chatwoot Markdown format before sending
    let processedText = replyText;
    if (activeMentionedAgents.length > 0) {
      activeMentionedAgents.forEach(agent => {
        const cleanTag = `@${agent.name}`;
        const chatwootTag = `[@${agent.name}](mention://user/${agent.id}/${encodeURIComponent(agent.name)})`;
        processedText = processedText.split(cleanTag).join(chatwootTag);
      });
    }

    let bodyData;
    if (pendingAttachments.length > 0) {
      bodyData = new FormData();
      bodyData.append('message_type', 'outgoing');
      bodyData.append('private', String(isPrivateNoteMode));
      bodyData.append('content', processedText || ''); // Always append content parameter
      if (replyParentMessageId) {
        bodyData.append('parent_id', replyParentMessageId);
        bodyData.append('content_attributes[in_reply_to]', replyParentMessageId);
      }
      pendingAttachments.forEach(file => {
        bodyData.append('attachments[]', file, file.name);
      });
    } else {
      const payload = {
        content: processedText,
        message_type: 'outgoing',
        private: isPrivateNoteMode
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
    activeMentionedAgents = [];
    updateMentionChipsUI();
    
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
      const isVCard = (file.name && file.name.endsWith('.vcf')) || (file.type && file.type.includes('vcard'));
      const icon = isVCard ? '🪪' : '📄';
      item.innerHTML = `
        <div class="attachment-icon-placeholder">${icon}</div>
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
let currentLightboxGallery = [];
let currentLightboxIndex = 0;

function normalizeMediaUrl(url) {
  if (!url) return '';
  let fullUrl = url.trim();
  if (!fullUrl.startsWith('http') && !fullUrl.startsWith('data:') && !fullUrl.startsWith('blob:')) {
    const baseUrl = (config.url || '').endsWith('/') ? config.url.slice(0, -1) : (config.url || '');
    const relativeUrl = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
    fullUrl = baseUrl + relativeUrl;
  }
  return fullUrl;
}

function collectActiveConversationMedia() {
  const mediaList = [];
  const container = elements.chatMessagesArea || document.getElementById('chat-messages-area');
  if (!container) return mediaList;

  const seenUrls = new Set();
  const nodes = container.querySelectorAll('.chat-img-preview, .chat-video-preview, .btn-video-fullscreen, .chat-file-download-link');

  nodes.forEach(el => {
    if (el.closest('.chat-msg-sender-avatar, .chat-header-avatar, .contact-modal-avatar, .mention-avatar, .chat-item-avatar')) {
      return;
    }

    let rawUrl = '';
    let fileType = '';
    let filename = '';

    if (el.classList.contains('chat-img-preview')) {
      rawUrl = el.getAttribute('src');
      fileType = 'image';
      filename = el.getAttribute('data-filename') || (rawUrl ? rawUrl.split('/').pop().split('?')[0] : 'imagem.png');
    } else if (el.classList.contains('chat-video-preview') || el.classList.contains('btn-video-fullscreen')) {
      rawUrl = el.getAttribute('data-url') || el.getAttribute('src');
      fileType = 'video';
      filename = el.getAttribute('data-filename') || (rawUrl ? rawUrl.split('/').pop().split('?')[0] : 'video.mp4');
    } else if (el.classList.contains('chat-file-download-link')) {
      rawUrl = el.getAttribute('data-url');
      fileType = 'file';
      filename = el.getAttribute('data-filename') || 'documento';
    }

    const normUrl = normalizeMediaUrl(rawUrl);
    if (normUrl && !seenUrls.has(normUrl)) {
      seenUrls.add(normUrl);
      mediaList.push({ url: normUrl, fileType, filename });
    }
  });

  return mediaList;
}

function renderLightboxMediaAtIndex(index) {
  const modal = document.getElementById('lightbox-modal');
  const content = document.getElementById('lightbox-content');
  const filenameDisplay = document.getElementById('lightbox-filename');
  const counterDisplay = document.getElementById('lightbox-counter');
  const btnPrev = document.getElementById('btn-lightbox-prev');
  const btnNext = document.getElementById('btn-lightbox-next');

  if (!modal || !content || !filenameDisplay) return;
  if (index < 0 || index >= currentLightboxGallery.length) return;

  currentLightboxIndex = index;
  const item = currentLightboxGallery[index];
  currentLightboxItem = item;
  filenameDisplay.textContent = item.filename;

  const oldVideo = content.querySelector('video');
  if (oldVideo) oldVideo.pause();
  const oldAudio = content.querySelector('audio');
  if (oldAudio) oldAudio.pause();

  content.innerHTML = '';

  if (item.fileType === 'image') {
    const img = document.createElement('img');
    img.src = item.url;
    content.appendChild(img);
  } else if (item.fileType === 'video') {
    const video = document.createElement('video');
    video.src = item.url;
    video.controls = true;
    video.autoplay = true;
    content.appendChild(video);
  } else if (item.fileType === 'audio' || /\.(oga|ogg|mp3|wav|m4a|aac)$/i.test(item.filename)) {
    const audioContainer = document.createElement('div');
    audioContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; width: 100%; padding: 20px; box-sizing: border-box;';
    audioContainer.innerHTML = `
      <div style="font-size: 52px; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));">🎵</div>
      <div style="font-size: 14px; color: var(--text-primary); font-weight: 600; text-align: center; word-break: break-all; padding: 0 10px;">${escapeHtml(item.filename)}</div>
      <audio src="${item.url}" controls autoplay style="width: 100%; max-width: 360px; border-radius: 20px; outline: none; margin-top: 10px;"></audio>
    `;
    content.appendChild(audioContainer);
  } else {
    const docDiv = document.createElement('div');
    docDiv.className = 'document-preview';
    docDiv.innerHTML = `
      <div class="document-icon">📄</div>
      <div style="font-size: 14px; margin-top: 8px; color: var(--text-primary); font-weight: 500; text-align: center; word-break: break-all; padding: 0 20px;">${escapeHtml(item.filename)}</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Este documento pode ser baixado clicando no botão abaixo.</div>
    `;
    content.appendChild(docDiv);
  }

  const total = currentLightboxGallery.length;
  if (total > 1) {
    if (counterDisplay) {
      counterDisplay.textContent = `${index + 1} de ${total}`;
      counterDisplay.classList.remove('hidden');
    }
    if (btnPrev) {
      if (index > 0) btnPrev.classList.remove('hidden');
      else btnPrev.classList.add('hidden');
    }
    if (btnNext) {
      if (index < total - 1) btnNext.classList.remove('hidden');
      else btnNext.classList.add('hidden');
    }
  } else {
    if (counterDisplay) counterDisplay.classList.add('hidden');
    if (btnPrev) btnPrev.classList.add('hidden');
    if (btnNext) btnNext.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

window.openLightbox = function(url, fileType, filename, galleryOverride) {
  const targetUrl = normalizeMediaUrl(url);
  let mediaList = [];

  if (Array.isArray(galleryOverride) && galleryOverride.length > 0) {
    mediaList = galleryOverride.map(m => {
      const fname = m.filename || m.file_name || 'arquivo';
      const isAudio = /\.(oga|ogg|mp3|wav|m4a|aac)$/i.test(fname);
      return {
        url: normalizeMediaUrl(m.url || m.data_url || m.src),
        fileType: m.fileType || m.type || (isAudio ? 'audio' : 'image'),
        filename: fname
      };
    });
  }

  if (mediaList.length === 0) {
    mediaList = collectActiveConversationMedia();
  }

  let foundIndex = mediaList.findIndex(m => {
    const mUrl = normalizeMediaUrl(m.url);
    return mUrl === targetUrl || mUrl.endsWith(targetUrl) || targetUrl.endsWith(mUrl);
  });

  if (foundIndex !== -1) {
    currentLightboxGallery = mediaList;
  } else {
    currentLightboxGallery = mediaList.length > 0 ? mediaList : [{ url: targetUrl, fileType, filename }];
    foundIndex = currentLightboxGallery.findIndex(m => m.url.includes(targetUrl) || targetUrl.includes(m.url));
    if (foundIndex === -1) {
      currentLightboxGallery.push({ url: targetUrl, fileType, filename });
      foundIndex = currentLightboxGallery.length - 1;
    }
  }

  renderLightboxMediaAtIndex(foundIndex);
};

function setupLightboxHandlers() {
  if (isLightboxHandlersSetup) return;
  isLightboxHandlersSetup = true;

  const modal = document.getElementById('lightbox-modal');
  const closeBtn = document.getElementById('btn-lightbox-close');
  const downloadBtn = document.getElementById('btn-lightbox-download');
  const btnPrev = document.getElementById('btn-lightbox-prev');
  const btnNext = document.getElementById('btn-lightbox-next');

  if (!modal || !closeBtn || !downloadBtn) return;

  closeBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const video = modal.querySelector('video');
    if (video) video.pause();
    const audio = modal.querySelector('audio');
    if (audio) audio.pause();

    modal.classList.add('hidden');
    currentLightboxItem = null;
  };

  if (btnPrev) {
    btnPrev.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentLightboxIndex > 0) {
        renderLightboxMediaAtIndex(currentLightboxIndex - 1);
      }
    };
  }

  if (btnNext) {
    btnNext.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentLightboxIndex < currentLightboxGallery.length - 1) {
        renderLightboxMediaAtIndex(currentLightboxIndex + 1);
      }
    };
  }

  downloadBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentLightboxItem && currentLightboxItem.url) {
      triggerDirectFileDownload(currentLightboxItem.url, currentLightboxItem.filename || 'media');
    }
  };

  // Keyboard Navigation for Lightbox (Seta esquerda, Seta direita, Esc)
  document.addEventListener('keydown', (e) => {
    const modalEl = document.getElementById('lightbox-modal');
    if (!modalEl || modalEl.classList.contains('hidden')) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentLightboxIndex > 0) {
        renderLightboxMediaAtIndex(currentLightboxIndex - 1);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentLightboxIndex < currentLightboxGallery.length - 1) {
        renderLightboxMediaAtIndex(currentLightboxIndex + 1);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      const video = modalEl.querySelector('video');
      if (video) video.pause();
      const audio = modalEl.querySelector('audio');
      if (audio) audio.pause();
      modalEl.classList.add('hidden');
      currentLightboxItem = null;
    }
  });

  downloadBtn.onclick = (e) => {
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
        const a = document.createElement('a');
        a.href = currentLightboxItem.url;
        a.download = currentLightboxItem.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    });
  };
}

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
          menu.classList.remove('hidden');
          
          const rect = btnMenu.getBoundingClientRect();
          const menuWidth = menu.offsetWidth || 220;
          const menuHeight = menu.offsetHeight || 180;

          let top = rect.bottom + 4;
          let left;

          if (isOutgoing) {
            // Outgoing message (on the right): align menu to the right side of button
            left = rect.right - menuWidth;
          } else {
            // Incoming message (on the left): align menu to the left side of button
            left = rect.left;
          }

          // Strict boundary protection against screen edges
          const padding = 10;
          if (left + menuWidth > window.innerWidth - padding) {
            left = window.innerWidth - menuWidth - padding;
          }
          if (left < padding) {
            left = padding;
          }

          if (top + menuHeight > window.innerHeight - padding) {
            top = rect.top - menuHeight - 4; // Position above button if no space below
          }
          if (top < padding) {
            top = padding;
          }

          menu.style.top = `${top}px`;
          menu.style.left = `${left}px`;
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

  // Format Chatwoot Mentions: [@Agent Name](mention://user/123/Agent%20Name) -> Badge
  formatted = formatted.replace(/\[@([^\]]+)\]\(mention:\/\/user\/\d+\/[^\)]+\)/g, '<span class="chat-mention-badge">@$1</span>');

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

async function callGeminiAPI(promptText) {
  const apiKey = config.geminiApiKey ? config.geminiApiKey.trim() : '';
  if (!apiKey) {
    throw new Error('Configure sua Gemini API Key na aba Ajustes.');
  }

  const models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  let lastErrMsg = '';
  for (const modelName of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      if (resp.ok) {
        const resData = await resp.json();
        const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim()) {
          let text = candidateText.trim();
          if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
            text = text.substring(1, text.length - 1).trim();
          }
          return text;
        }
      } else {
        const errBody = await resp.json().catch(() => ({}));
        const msg = errBody.error?.message || `HTTP ${resp.status}`;
        lastErrMsg = msg;
        if (resp.status === 503 || resp.status === 429 || msg.includes('high demand') || msg.includes('Quota')) {
          await new Promise(r => setTimeout(r, 400));
        }
      }
    } catch (e) {
      lastErrMsg = e.message;
    }
  }

  if (lastErrMsg.includes('high demand') || lastErrMsg.includes('Quota') || lastErrMsg.includes('503')) {
    throw new Error('A IA do Gemini está com alta demanda temporária. Tente novamente em instantes!');
  }
  throw new Error(lastErrMsg || 'Falha na conexão com a API do Gemini.');
}

async function correctTextWithGemini() {
  if (!config || !config.geminiApiKey || !config.geminiApiKey.trim()) {
    showToast('Configure sua Gemini API Key na aba Ajustes.', 'warning');
    return;
  }

  const input = elements.chatReplyInput;
  if (!input) return;

  const rawText = input.value.trim();
  if (!rawText) {
    showToast('Digite uma mensagem na caixa antes de corrigir com IA.', 'info');
    return;
  }

  const btn = elements.btnAiCorrectText;
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳';
  }

  try {
    const promptText = `Você é um especialista em comunicação e atendimento ao cliente em Português do Brasil (pt-BR).

Sua tarefa é aprimorar o seguinte rascunho de mensagem para torná-lo:
1. Extremamente claro, organizado e de fácil entendimento.
2. Com ortografia, gramática e pontuação impecáveis (pt-BR).
3. Em um tom altamente profissional, empático, cortês e objetivo para atendimento.

Instruções estritas:
- Mantenha a intenção e sentido original da mensagem.
- Reorganize a estrutura das frases para garantir máxima clareza se o texto for confuso.
- Não adicione comentários, saudações/despedidas extras ou aspas.
- Retorne APENAS o texto aprimorado final.

Rascunho: "${rawText}"`;

    const correctedText = await callGeminiAPI(promptText);
    input.value = correctedText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    showToast('✨ Texto corrigido com sucesso pela IA!', 'success');
  } catch (err) {
    console.error('[Gemini AI Error]:', err);
    showToast(err.message.includes('alta demanda') ? err.message : `Erro ao corrigir com IA: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

function openAiGenerateModal() {
  const modal = document.getElementById('ai-generate-modal') || elements.aiGenerateModal;
  const promptInput = document.getElementById('ai-prompt-input') || elements.aiPromptInput;

  if (promptInput) {
    promptInput.value = '';
  }

  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      if (promptInput) promptInput.focus();
    }, 100);
  } else {
    console.error('Modal #ai-generate-modal não encontrado no DOM!');
  }
}

function closeAiGenerateModal() {
  if (elements.aiGenerateModal) elements.aiGenerateModal.classList.add('hidden');
}

async function generateTextWithGemini() {
  const promptInput = elements.aiPromptInput;
  if (!promptInput) return;

  const userInstruction = promptInput.value.trim();
  if (!userInstruction) {
    showToast('Por favor, informe a instrução para a IA gerar a resposta.', 'info');
    return;
  }

  const submitBtn = elements.btnAiGenerateSubmit;
  const originalText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Gerando...';
  }

  try {
    const promptText = `Você é um assistente especialista em atendimento ao cliente via suporte de chat no Brasil (pt-BR).
Sua missão é criar uma mensagem de resposta perfeita para o cliente com base na seguinte instrução do atendente:

Instrução do atendente: "${userInstruction}"

Regras de resposta:
- Escreva uma mensagem curta, clara, gentil, objetiva e em tom estritamente profissional (pt-BR).
- Pronta para ser enviada diretamente ao cliente.
- Não adicione introduções, explicações extras, comentários ou aspas em volta da mensagem.
- Retorne APENAS o texto da mensagem final.`;

    const generatedText = await callGeminiAPI(promptText);
    if (generatedText && elements.chatReplyInput) {
      elements.chatReplyInput.value = generatedText;
      elements.chatReplyInput.dispatchEvent(new Event('input', { bubbles: true }));
      showToast('✨ Resposta gerada com sucesso pela IA!', 'success');
      closeAiGenerateModal();
    }
  } catch (err) {
    console.error('[Gemini AI Generate Error]:', err);
    showToast(err.message.includes('alta demanda') ? err.message : `Erro ao gerar texto com IA: ${err.message}`, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
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

// GOOGLE GEMINI AI TEXT CORRECTION
function updateAiButtonVisibility() {
  if (elements.btnAiCorrectText) {
    if (config && config.geminiApiKey && config.geminiApiKey.trim().length > 0) {
      elements.btnAiCorrectText.classList.remove('hidden');
    } else {
      elements.btnAiCorrectText.classList.add('hidden');
    }
  }
}

// PRIVATE NOTE MODE TOGGLE
let isPrivateNoteMode = false;

function togglePrivateNoteMode() {
  isPrivateNoteMode = !isPrivateNoteMode;
  const replyContainer = document.querySelector('.chat-reply-container');
  const btn = elements.btnTogglePrivateNote;
  const input = elements.chatReplyInput;
  
  if (!btn || !input || !replyContainer) return;

  const unlockedIcon = btn.querySelector('.lock-icon-unlocked');
  const lockedIcon = btn.querySelector('.lock-icon-locked');

  if (isPrivateNoteMode) {
    replyContainer.classList.add('private-mode');
    btn.classList.add('active');
    if (unlockedIcon) unlockedIcon.classList.add('hidden');
    if (lockedIcon) lockedIcon.classList.remove('hidden');
    input.placeholder = 'Digite uma nota privada...';
    btn.title = 'Modo Nota Privada ATIVO (Clique para voltar para mensagem pública)';
  } else {
    replyContainer.classList.remove('private-mode');
    btn.classList.remove('active');
    if (unlockedIcon) unlockedIcon.classList.remove('hidden');
    if (lockedIcon) lockedIcon.classList.add('hidden');
    input.placeholder = 'Digite uma mensagem...';
    btn.title = 'Alternar modo Nota Privada (visível apenas para a equipe)';
    
    // Clear mentions when returning to public message mode
    activeMentionedAgents = [];
    if (elements.mentionPicker) elements.mentionPicker.classList.add('hidden');
    if (elements.mentionChipsBar) elements.mentionChipsBar.classList.add('hidden');
  }
}

// AGENT MENTIONS (@mention)
let accountAgentsCache = {};
let filteredAgentsList = [];
let selectedMentionIndex = 0;

async function fetchAccountAgents(accountId) {
  if (!accountId) return [];
  if (accountAgentsCache[accountId]) return accountAgentsCache[accountId];

  try {
    let agents = await chatwootFetch(`/api/v1/accounts/${accountId}/agents`).catch(() => null);
    if (!agents || !Array.isArray(agents)) {
      agents = await chatwootFetch(`/api/v1/accounts/${accountId}/account_users`).catch(() => []);
    }
    if (Array.isArray(agents)) {
      accountAgentsCache[accountId] = agents;
      return agents;
    }
  } catch (err) {
    console.warn('Could not fetch account agents:', err);
  }
  return [];
}

async function handleChatInputForMentions() {
  const input = elements.chatReplyInput;
  if (!input || !currentActiveChat || !elements.mentionPicker) return;

  // Only allow mentions in Private Note mode
  if (!isPrivateNoteMode) {
    if (elements.mentionPicker) elements.mentionPicker.classList.add('hidden');
    if (elements.mentionChipsBar) elements.mentionChipsBar.classList.add('hidden');
    return;
  }

  updateMentionChipsUI();

  const val = input.value;
  const cursorIndex = input.selectionStart;
  const textBeforeCursor = val.slice(0, cursorIndex);
  
  const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_À-ÿ]*)$/);
  if (atMatch) {
    const searchTerm = atMatch[1].toLowerCase();
    const agents = await fetchAccountAgents(currentActiveChat.accountId);
    if (agents && agents.length > 0) {
      filteredAgentsList = agents.filter(a => {
        const name = (a.name || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
      });

      if (filteredAgentsList.length > 0) {
        selectedMentionIndex = 0;
        renderMentionPicker(filteredAgentsList);
        elements.mentionPicker.classList.remove('hidden');
        return;
      }
    }
  }

  elements.mentionPicker.classList.add('hidden');
}

function handleChatKeydownForMentions(e) {
  if (!elements.mentionPicker || elements.mentionPicker.classList.contains('hidden')) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedMentionIndex = (selectedMentionIndex + 1) % filteredAgentsList.length;
    updateSelectedMentionItem();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedMentionIndex = (selectedMentionIndex - 1 + filteredAgentsList.length) % filteredAgentsList.length;
    updateSelectedMentionItem();
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    if (filteredAgentsList[selectedMentionIndex]) {
      e.preventDefault();
      insertAgentMention(filteredAgentsList[selectedMentionIndex]);
    }
  } else if (e.key === 'Escape') {
    elements.mentionPicker.classList.add('hidden');
  }
}

function renderMentionPicker(agents) {
  if (!elements.mentionPickerList) return;

  elements.mentionPickerList.innerHTML = agents.map((agent, index) => {
    const initials = (agent.name || 'Agente').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const avatarHtml = agent.avatar_url
      ? `<img src="${agent.avatar_url}" class="mention-avatar" alt="${agent.name}">`
      : `<div class="mention-avatar">${initials}</div>`;

    return `
      <div class="mention-picker-item ${index === selectedMentionIndex ? 'selected' : ''}" data-index="${index}">
        ${avatarHtml}
        <div class="mention-info">
          <span class="mention-name">${escapeHtml(agent.name || 'Agente')}</span>
          <span class="mention-email">${escapeHtml(agent.email || '')}</span>
        </div>
      </div>
    `;
  }).join('');

  elements.mentionPickerList.querySelectorAll('.mention-picker-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = parseInt(item.getAttribute('data-index'), 10);
      if (filteredAgentsList[idx]) {
        insertAgentMention(filteredAgentsList[idx]);
      }
    });
  });
}

function updateSelectedMentionItem() {
  if (!elements.mentionPickerList) return;
  const items = elements.mentionPickerList.querySelectorAll('.mention-picker-item');
  items.forEach((item, index) => {
    if (index === selectedMentionIndex) {
      item.classList.add('selected');
      item.scrollIntoView({ block: 'nearest' });
    } else {
      item.classList.remove('selected');
    }
  });
}

let activeMentionedAgents = [];

function insertAgentMention(agent) {
  const input = elements.chatReplyInput;
  if (!input) return;

  const val = input.value;
  const cursorIndex = input.selectionStart;
  const textBeforeCursor = val.slice(0, cursorIndex);
  const textAfterCursor = val.slice(cursorIndex);

  const atIndex = textBeforeCursor.lastIndexOf('@');
  if (atIndex !== -1) {
    const cleanTag = `@${agent.name} `;
    const newText = val.slice(0, atIndex) + cleanTag + textAfterCursor;
    
    input.value = newText;
    const newCursorPos = atIndex + cleanTag.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
    input.focus();

    if (!activeMentionedAgents.some(a => a.id === agent.id)) {
      activeMentionedAgents.push(agent);
    }

    updateMentionChipsUI();

    // Trigger input event to resize textarea
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  elements.mentionPicker.classList.add('hidden');
}

function updateMentionChipsUI() {
  if (!elements.mentionChipsBar || !elements.mentionChipsList || !elements.chatReplyInput) return;

  const text = elements.chatReplyInput.value;
  // Keep only agents whose clean @Name tag is still in text
  activeMentionedAgents = activeMentionedAgents.filter(agent => text.includes(`@${agent.name}`));

  if (activeMentionedAgents.length === 0) {
    elements.mentionChipsBar.classList.add('hidden');
    elements.mentionChipsList.innerHTML = '';
    return;
  }

  elements.mentionChipsList.innerHTML = activeMentionedAgents.map(agent => `
    <span class="mention-chip">
      @${escapeHtml(agent.name)}
      <button type="button" class="btn-remove-chip" data-id="${agent.id}" title="Remover marcação">&times;</button>
    </span>
  `).join('');

  elements.mentionChipsList.querySelectorAll('.btn-remove-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const agentId = parseInt(btn.getAttribute('data-id'), 10);
      const targetAgent = activeMentionedAgents.find(a => a.id === agentId);
      if (targetAgent && elements.chatReplyInput) {
        elements.chatReplyInput.value = elements.chatReplyInput.value.split(`@${targetAgent.name}`).join('');
        activeMentionedAgents = activeMentionedAgents.filter(a => a.id !== agentId);
        updateMentionChipsUI();
        elements.chatReplyInput.focus();
      }
    });
  });

  elements.mentionChipsBar.classList.remove('hidden');
}

// WHATSAPP-STYLE CONTACT INFO MODAL & PHOTO LIGHTBOX
let currentModalPhotoUrl = '';
let currentModalContactName = '';
let currentModalContactId = null;
let currentModalAccountId = null;

function setupContactNameEditing() {
  const btnEdit = elements.btnEditContactName;
  const btnSave = elements.btnSaveContactName;
  const btnCancel = elements.btnCancelContactName;
  const displayContainer = elements.contactNameDisplayContainer;
  const editContainer = elements.contactNameEditContainer;
  const input = elements.contactNameInput;

  if (!btnEdit || !btnSave || !input) return;

  const startEdit = () => {
    input.value = elements.contactModalName ? elements.contactModalName.textContent.trim() : currentModalContactName;
    if (displayContainer) displayContainer.classList.add('hidden');
    if (editContainer) editContainer.classList.remove('hidden');
    input.focus();
    input.select();
  };

  const cancelEdit = () => {
    if (editContainer) editContainer.classList.add('hidden');
    if (displayContainer) displayContainer.classList.remove('hidden');
  };

  const saveEdit = async () => {
    const newName = input.value.trim();
    if (!newName) {
      showToast('O nome do contato não pode ficar em branco.', 'error');
      return;
    }

    if (!currentModalContactId || currentModalContactId === '-') {
      showToast('ID do contato não encontrado.', 'error');
      return;
    }

    const accountId = currentModalAccountId || config.defaultAccount;
    if (!accountId) {
      showToast('Conta Chatwoot não identificada.', 'error');
      return;
    }

    btnSave.disabled = true;

    try {
      showToast('Salvando nome no Chatwoot...', 'info');

      // PUT /api/v1/accounts/{account_id}/contacts/{id}
      await chatwootFetch(`/api/v1/accounts/${accountId}/contacts/${currentModalContactId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName })
      });

      // Update modal display
      if (elements.contactModalName) elements.contactModalName.textContent = newName;
      currentModalContactName = newName;

      // Update current active chat if open
      if (currentActiveChat && (String(currentActiveChat.senderId) === String(currentModalContactId) || String(currentActiveChat.contactId) === String(currentModalContactId))) {
        currentActiveChat.contactName = newName;
        
        // Update popup header title
        const headerNameEl = document.querySelector('.chat-header-name');
        if (headerNameEl) headerNameEl.textContent = newName;
        if (isChatWindowMode) {
          document.title = `${newName} - Chatwoot`;
        }
      }

      // Update matching conversations in cache and DOM list cards
      const updateMatchingConvs = (convList) => {
        if (!Array.isArray(convList)) return;
        convList.forEach(conv => {
          if (!conv) return;
          const senderId = conv.meta?.sender?.id || conv.sender?.id;
          if (String(senderId) === String(currentModalContactId)) {
            if (conv.meta && conv.meta.sender) conv.meta.sender.name = newName;
            if (conv.sender) conv.sender.name = newName;
            
            // Update conversation card in list DOM
            const cardNameEl = document.querySelector(`.chat-card[data-conv-id="${conv.id}"] .chat-card-name`);
            if (cardNameEl) {
              cardNameEl.textContent = newName;
            }
          }
        });
      };

      updateMatchingConvs(fetchedConversations);
      updateMatchingConvs(openConversationsCache);

      cancelEdit();
      showToast('Nome do contato atualizado com sucesso no Chatwoot!', 'success');
    } catch (err) {
      console.error('Error updating contact name:', err);
      showToast('Erro ao salvar o nome do contato no Chatwoot.', 'error');
    } finally {
      btnSave.disabled = false;
    }
  };

  btnEdit.addEventListener('click', startEdit);
  btnCancel.addEventListener('click', cancelEdit);
  btnSave.addEventListener('click', saveEdit);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
}

async function openContactInfoModal(overrideSender) {
  if (!elements.contactInfoModal) return;

  const conversationId = currentActiveChat ? currentActiveChat.id : null;
  const conversation = [...fetchedConversations, ...openConversationsCache].find(c => c && c.id === conversationId);

  let sender = overrideSender || conversation?.meta?.sender || conversation?.sender || currentActiveChat?.sender;
  let contactName = sender?.name || currentActiveChat?.contactName || 'Cliente';
  let avatarUrl = getSenderAvatarUrl(sender);
  let phone = sender?.phone_number || sender?.identifier || '';
  let email = sender?.email || '';
  let contactId = sender?.id || conversation?.meta?.sender?.id || currentActiveChat?.contactId || currentActiveChat?.senderId || '-';
  const inboxId = currentActiveChat?.inboxId;
  const accountId = currentActiveChat?.accountId || config.defaultAccount;

  // Fallback API lookup for closed/resolved conversations or un-cached contacts
  if ((!contactId || contactId === '-' || !sender) && conversationId && accountId) {
    try {
      const convRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations/${conversationId}`);
      if (convRes) {
        sender = convRes.meta?.sender || convRes.sender || sender;
        if (sender) {
          contactId = sender.id || contactId;
          contactName = sender.name || contactName;
          avatarUrl = getSenderAvatarUrl(sender) || avatarUrl;
          phone = sender.phone_number || sender.identifier || phone;
          email = sender.email || email;
          
          if (currentActiveChat) {
            currentActiveChat.sender = sender;
            currentActiveChat.contactId = contactId;
            currentActiveChat.senderId = contactId;
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch conversation details for contact modal:', err);
    }
  }

  currentModalContactName = contactName;
  currentModalContactId = contactId;
  currentModalAccountId = accountId || currentActiveChat?.accountId || config?.defaultAccount;

  // Reset name edit mode
  if (elements.contactNameDisplayContainer) elements.contactNameDisplayContainer.classList.remove('hidden');
  if (elements.contactNameEditContainer) elements.contactNameEditContainer.classList.add('hidden');

  // Render Name & Phone
  if (elements.contactModalName) elements.contactModalName.textContent = contactName;
  if (elements.contactModalPhone) elements.contactModalPhone.textContent = phone || 'Sem número informado';
  if (elements.contactModalValPhone) elements.contactModalValPhone.textContent = phone || 'Não informado';
  if (elements.contactModalValEmail) elements.contactModalValEmail.textContent = email || 'Não informado';
  if (elements.contactModalValId) elements.contactModalValId.textContent = contactId;

  // Inbox Name
  if (elements.contactModalValInbox) {
    elements.contactModalValInbox.textContent = 'Carregando...';
    if (accountId && inboxId) {
      getInboxName(accountId, inboxId).then(name => {
        if (elements.contactModalValInbox) elements.contactModalValInbox.textContent = name || `Inbox #${inboxId}`;
      });
    } else {
      elements.contactModalValInbox.textContent = 'N/D';
    }
  }

  // Render Avatar inside Modal
  const initials = contactName ? contactName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C';
  if (elements.contactModalAvatar) {
    if (avatarUrl) {
      let fullUrl = avatarUrl.trim();
      if (!fullUrl.startsWith('http')) {
        const baseUrl = (config.url || '').endsWith('/') ? config.url.slice(0, -1) : (config.url || '');
        const relativeUrl = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
        fullUrl = baseUrl + relativeUrl;
      }
      currentModalPhotoUrl = fullUrl;
      elements.contactModalAvatar.innerHTML = `<img src="${fullUrl}" alt="${escapeHtml(contactName)}" data-initials="${initials}" />`;
      if (elements.btnContactInfoViewPhoto) elements.btnContactInfoViewPhoto.classList.remove('hidden');
    } else {
      currentModalPhotoUrl = '';
      elements.contactModalAvatar.innerHTML = initials;
      if (elements.btnContactInfoViewPhoto) elements.btnContactInfoViewPhoto.classList.add('hidden');
    }
  }

  // Setup click on Avatar Wrapper to open Lightbox in full size (Standalone Profile Picture)
  if (elements.contactModalAvatarWrapper) {
    elements.contactModalAvatarWrapper.onclick = () => {
      if (currentModalPhotoUrl) {
        const photoTitle = `Foto de perfil - ${contactName}`;
        window.openLightbox(currentModalPhotoUrl, 'image', photoTitle, [{ url: currentModalPhotoUrl, fileType: 'image', filename: photoTitle }]);
      } else {
        showToast('Nenhuma foto de perfil disponível para ampliar.', 'info');
      }
    };
  }

  if (elements.btnContactInfoViewPhoto) {
    elements.btnContactInfoViewPhoto.onclick = () => {
      if (currentModalPhotoUrl) {
        const photoTitle = `Foto de perfil - ${contactName}`;
        window.openLightbox(currentModalPhotoUrl, 'image', photoTitle, [{ url: currentModalPhotoUrl, fileType: 'image', filename: photoTitle }]);
      }
    };
  }

  // Populate Shared Media, Docs, Audio & Links Tabs
  const conversationMessages = (typeof currentChatMessages !== 'undefined' && Array.isArray(currentChatMessages))
    ? currentChatMessages
    : [];
  populateContactMediaSection(conversationMessages);

  // Show Modal
  elements.contactInfoModal.classList.remove('hidden');
}

let currentContactMediaData = {
  media: [],
  docs: [],
  audio: [],
  links: []
};

let activeContactMediaTab = 'media';

function populateContactMediaSection(messages) {
  const contentEl = document.getElementById('contact-media-content');
  const countMedia = document.getElementById('count-contact-media');
  const countDocs = document.getElementById('count-contact-docs');
  const countAudio = document.getElementById('count-contact-audio');
  const countLinks = document.getElementById('count-contact-links');

  if (!contentEl) return;

  currentContactMediaData = { media: [], docs: [], audio: [], links: [] };

  const baseUrl = (config.url || '').endsWith('/') ? config.url.slice(0, -1) : (config.url || '');

  function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
    return baseUrl + (url.startsWith('/') ? url : '/' + url);
  }

  // Method 1: Process API messages array
  if (Array.isArray(messages)) {
    messages.forEach(msg => {
      const attachments = msg.attachments || (msg.content_attributes && msg.content_attributes.attachments) || [];
      if (Array.isArray(attachments)) {
        attachments.forEach(att => {
          let url = fixUrl(att.data_url || att.file_url || att.thumb_url);
          if (!url) return;

          const fileType = (att.file_type || '').toLowerCase();
          const filename = att.extension || att.filename || (url.split('/').pop().split('?')[0]) || 'arquivo';

          if (fileType.includes('image') || fileType.includes('video') || /\.(png|jpe?g|gif|webp|mp4|mov|webm)$/i.test(filename)) {
            const isVideo = fileType.includes('video') || /\.(mp4|mov|webm)$/i.test(filename);
            if (!currentContactMediaData.media.some(m => m.url === url)) {
              currentContactMediaData.media.push({ url, type: isVideo ? 'video' : 'image', filename });
            }
          } else if (fileType.includes('audio') || fileType.includes('voice') || /\.(ogg|mp3|wav|m4a|aac)$/i.test(filename)) {
            if (!currentContactMediaData.audio.some(a => a.url === url)) {
              currentContactMediaData.audio.push({ url, filename, created_at: msg.created_at });
            }
          } else {
            if (!currentContactMediaData.docs.some(d => d.url === url)) {
              currentContactMediaData.docs.push({ url, filename, created_at: msg.created_at });
            }
          }
        });
      }

      // Parse URLs in content
      if (msg.content) {
        const urlMatches = msg.content.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatches) {
          urlMatches.forEach(rawUrl => {
            let url = rawUrl;
            if (url.endsWith('.') || url.endsWith(',') || url.endsWith(')') || url.endsWith(']')) {
              url = url.slice(0, -1);
            }
            if (!currentContactMediaData.links.some(l => l.url === url)) {
              currentContactMediaData.links.push({ url, created_at: msg.created_at });
            }
          });
        }
      }
    });
  }

  // Method 2: DOM fallback (scan #chat-messages-area directly)
  const chatArea = elements.chatMessagesArea || document.getElementById('chat-messages-area');
  if (chatArea) {
    // Images & Videos from DOM
    chatArea.querySelectorAll('.chat-img-preview').forEach(img => {
      const url = fixUrl(img.getAttribute('src'));
      const filename = img.getAttribute('data-filename') || 'imagem.png';
      if (url && !currentContactMediaData.media.some(m => m.url === url)) {
        currentContactMediaData.media.push({ url, type: 'image', filename });
      }
    });

    chatArea.querySelectorAll('.btn-video-fullscreen, video').forEach(vid => {
      const url = fixUrl(vid.getAttribute('data-url') || vid.getAttribute('src'));
      const filename = vid.getAttribute('data-filename') || 'video.mp4';
      if (url && !currentContactMediaData.media.some(m => m.url === url)) {
        currentContactMediaData.media.push({ url, type: 'video', filename });
      }
    });

    // Audios from DOM
    chatArea.querySelectorAll('audio, .chat-audio-player').forEach(aud => {
      const url = fixUrl(aud.getAttribute('src') || aud.getAttribute('data-url'));
      const filename = aud.getAttribute('data-filename') || 'audio.ogg';
      if (url && !currentContactMediaData.audio.some(a => a.url === url)) {
        currentContactMediaData.audio.push({ url, filename });
      }
    });

    // Docs from DOM
    chatArea.querySelectorAll('.chat-file-download-link').forEach(link => {
      const url = fixUrl(link.getAttribute('data-url') || link.getAttribute('href'));
      const filename = link.getAttribute('data-filename') || link.textContent.trim() || 'documento';
      if (url && !currentContactMediaData.docs.some(d => d.url === url)) {
        currentContactMediaData.docs.push({ url, filename });
      }
    });

    // Links from DOM
    chatArea.querySelectorAll('.link-preview-container, .chat-msg-text a').forEach(a => {
      let url = a.getAttribute('data-url') || a.getAttribute('href');
      if (url && url.startsWith('http') && !url.includes('chatwoot')) {
        if (url.endsWith('.') || url.endsWith(',')) url = url.slice(0, -1);
        if (!currentContactMediaData.links.some(l => l.url === url)) {
          currentContactMediaData.links.push({ url });
        }
      }
    });
  }

  // Update counts
  if (countMedia) countMedia.textContent = currentContactMediaData.media.length;
  if (countDocs) countDocs.textContent = currentContactMediaData.docs.length;
  if (countAudio) countAudio.textContent = currentContactMediaData.audio.length;
  if (countLinks) countLinks.textContent = currentContactMediaData.links.length;

  // Setup Tab Clicks
  const tabs = document.querySelectorAll('.contact-media-tab');
  tabs.forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeContactMediaTab = tab.getAttribute('data-tab');
      renderContactMediaTabContent(activeContactMediaTab);
    };
  });

  renderContactMediaTabContent(activeContactMediaTab);
}

function renderContactMediaTabContent(tabName) {
  const contentEl = document.getElementById('contact-media-content');
  if (!contentEl) return;

  contentEl.innerHTML = '';

  const items = currentContactMediaData[tabName] || [];

  if (items.length === 0) {
    const emptyLabels = {
      media: 'Nenhuma foto ou vídeo nesta conversa.',
      docs: 'Nenhum documento ou arquivo nesta conversa.',
      audio: 'Nenhum áudio compartilhado nesta conversa.',
      links: 'Nenhum link encontrado nesta conversa.'
    };
    contentEl.innerHTML = `<div class="contact-media-empty">${emptyLabels[tabName] || 'Nenhum item encontrado.'}</div>`;
    return;
  }

  if (tabName === 'media') {
    const grid = document.createElement('div');
    grid.className = 'contact-media-grid';

    items.forEach(item => {
      const thumb = document.createElement('div');
      thumb.className = 'contact-media-thumb';
      thumb.title = item.filename;

      if (item.type === 'video') {
        thumb.innerHTML = `
          <video src="${item.url}#t=0.5" preload="metadata"></video>
          <div class="contact-media-video-icon">▶</div>
        `;
      } else {
        thumb.innerHTML = `<img src="${item.url}" alt="${escapeHtml(item.filename)}" />`;
      }

      thumb.onclick = (e) => {
        e.preventDefault();
        window.openLightbox(item.url, item.type, item.filename, currentContactMediaData.media);
      };

      grid.appendChild(thumb);
    });

    contentEl.appendChild(grid);
  } else if (tabName === 'docs') {
    const list = document.createElement('div');
    list.className = 'contact-media-list';

    items.forEach(item => {
      const docItem = document.createElement('div');
      docItem.className = 'contact-media-item';
      docItem.innerHTML = `
        <span style="font-size: 16px; flex-shrink: 0;">📄</span>
        <div class="contact-media-item-info">
          <span class="contact-media-item-title">${escapeHtml(item.filename)}</span>
          <span class="contact-media-item-sub">Documento</span>
        </div>
        <span style="font-size: 12px; color: var(--primary);">📥</span>
      `;
      docItem.onclick = (e) => {
        e.preventDefault();
        window.openLightbox(item.url, 'file', item.filename, currentContactMediaData.docs);
      };
      list.appendChild(docItem);
    });

    contentEl.appendChild(list);
  } else if (tabName === 'audio') {
    const list = document.createElement('div');
    list.className = 'contact-media-list';

    items.forEach(item => {
      const audioItem = document.createElement('div');
      audioItem.className = 'contact-media-item';
      audioItem.innerHTML = `
        <span style="font-size: 16px; flex-shrink: 0;">🎵</span>
        <div class="contact-media-item-info">
          <span class="contact-media-item-title">${escapeHtml(item.filename)}</span>
          <span class="contact-media-item-sub">Mensagem de Áudio</span>
        </div>
        <span style="font-size: 12px; color: var(--primary);">▶️</span>
      `;
      audioItem.onclick = (e) => {
        e.preventDefault();
        window.openLightbox(item.url, 'audio', item.filename, currentContactMediaData.audio);
      };
      list.appendChild(audioItem);
    });

    contentEl.appendChild(list);
  } else if (tabName === 'links') {
    const list = document.createElement('div');
    list.className = 'contact-media-list';

    items.forEach(item => {
      const linkItem = document.createElement('div');
      linkItem.className = 'contact-media-item';
      let hostname = item.url;
      try {
        hostname = new URL(item.url).hostname;
      } catch (e) {}

      linkItem.innerHTML = `
        <span style="font-size: 16px; flex-shrink: 0;">🔗</span>
        <div class="contact-media-item-info">
          <span class="contact-media-item-title">${escapeHtml(item.url)}</span>
          <span class="contact-media-item-sub">${escapeHtml(hostname)}</span>
        </div>
        <button type="button" class="btn-copy-detail" style="font-size: 11px;" title="Abrir link">🌐</button>
      `;
      linkItem.onclick = (e) => {
        e.preventDefault();
        window.open(item.url, '_blank');
      };
      list.appendChild(linkItem);
    });

    contentEl.appendChild(list);
  }
}

function closeContactInfoModal() {
  if (elements.contactInfoModal) {
    elements.contactInfoModal.classList.add('hidden');
  }
}

function copyContactPhoneToClipboard() {
  const phone = elements.contactModalValPhone ? elements.contactModalValPhone.textContent : '';
  if (!phone || phone === 'Não informado') {
    showToast('Nenhum telefone para copiar.', 'info');
    return;
  }
  navigator.clipboard.writeText(phone).then(() => {
    showToast('📱 Telefone copiado para a área de transferência!', 'success');
  }).catch(() => {
    showToast('Falha ao copiar telefone.', 'error');
  });
}


