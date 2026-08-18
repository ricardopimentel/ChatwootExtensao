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

// DOM SELECTORS
const elements = {
  // Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  apiStatus: document.getElementById('api-status'),
  
  // Tab: Reminders
  searchInput: document.getElementById('search-input'),
  remindersList: document.getElementById('reminders-list'),
  
  // Tab: Notifications Center
  notificationsList: document.getElementById('notifications-list'),
  btnClearAllNotifications: document.getElementById('btn-clear-all-notifications'),
  notificationBadge: document.getElementById('notification-badge'),
  
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
  
  // Tab: New Chat
  newChatForm: document.getElementById('new-chat-form'),
  newChatPhone: document.getElementById('new-chat-phone'),
  newChatName: document.getElementById('new-chat-name'),
  newChatAccount: document.getElementById('new-chat-account'),
  newChatInbox: document.getElementById('new-chat-inbox'),
  inboxWarning: document.getElementById('inbox-channel-warning'),
  
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
  toastMessage: document.querySelector('.toast-message')
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  await loadSettings();
  
  // Setup tab navigation
  setupTabs();
  
  // Setup settings features
  setupSettingsHandlers();
  
  // Setup tag features
  setupTagHandlers();
  
  // Check active tab and adjust UI
  await checkActiveTab();
  
  // Load saved reminders
  loadReminders();
  
  // Load notifications center
  loadNotifications();

  // Clear all notifications listener
  elements.btnClearAllNotifications.addEventListener('click', clearAllNotifications);

  // Sync notifications list in real-time if storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.chatwootNotifications) {
      loadNotifications();
    }
  });
  
  // Initialize connection state check
  updateConnectionStatus();

  // Setup search filter
  elements.searchInput.addEventListener('input', (e) => {
    loadReminders(e.target.value);
  });
  
  // Phone contact search listeners
  elements.newChatPhone.addEventListener('blur', lookupContactByPhone);
  elements.newChatPhone.addEventListener('change', lookupContactByPhone);
  elements.newChatAccount.addEventListener('change', lookupContactByPhone);

  // Form submission listeners
  elements.saveCurrentForm.addEventListener('submit', handleSaveCurrentSubmit);
  elements.newChatForm.addEventListener('submit', handleNewChatSubmit);
});

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

  // Action on tab entry
  if (tabId === 'save-current') {
    checkActiveTab();
  } else if (tabId === 'reminders') {
    loadReminders();
  } else if (tabId === 'notifications') {
    loadNotifications();
  } else if (tabId === 'new-chat') {
    // Populate dropdowns for new chat if connection is good
    if (config.token && config.url) {
      populateAccountsAndInboxes();
    }
  }
}

// STORAGE & SETTINGS LOAD
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['chatwootSettings'], (result) => {
      if (result.chatwootSettings) {
        config = { ...config, ...result.chatwootSettings };
        // Populate inputs
        elements.settingsUrl.value = config.url || '';
        elements.settingsToken.value = config.token || '';
        elements.settingsCountry.value = config.defaultCountryCode || '+55';
      }
      resolve();
    });
  });
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

    // Save to storage
    chrome.storage.local.set({ chatwootSettings: config }, async () => {
      showToast('Configurações salvas com sucesso!', 'success');
      updateConnectionStatus();
      
      // Notify background service worker of settings change
      chrome.runtime.sendMessage({ action: 'settingsChanged' }).catch(err => {
        // Ignore if background script is not ready or has no listeners
        console.warn('Could not notify background worker:', err);
      });
      
      // Reload dropdown selections for direct chat
      if (config.url && config.token) {
        await populateAccountsAndInboxes();
      }
    });
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
}

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

    // Pre-select saved default
    if (config.defaultAccount) {
      elements.settingsDefaultAccount.value = config.defaultAccount;
      elements.newChatAccount.value = config.defaultAccount;
      
      // Load inboxes for default account
      await loadInboxesDropdown(config.defaultAccount, 'settings-default-inbox', config.defaultInbox);
      await loadInboxesDropdown(config.defaultAccount, 'new-chat-inbox', config.defaultInbox);
    } else if (selectSingleAccount && selectedAccId) {
      // Auto-load inboxes if there's only one account
      await loadInboxesDropdown(selectedAccId, 'settings-default-inbox', config.defaultInbox);
      await loadInboxesDropdown(selectedAccId, 'new-chat-inbox', config.defaultInbox);
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
    'Content-Type': 'application/json',
    'api_access_token': config.token,
    ...(options.headers || {})
  };

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
function handleSaveCurrentSubmit(e) {
  e.preventDefault();

  const title = elements.saveTitle.value.trim();
  const notes = elements.saveNotes.value.trim();
  
  if (!title) {
    showToast('Digite um título para o lembrete.', 'error');
    return;
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
    savedAt: Date.now()
  };

  chrome.storage.local.get(['chatwootReminders'], (result) => {
    const list = result.chatwootReminders || [];
    // Remove if exists to update
    const filteredList = list.filter(item => item.id !== reminder.id);
    filteredList.unshift(reminder); // Add to the top of list
    
    chrome.storage.local.set({ chatwootReminders: filteredList }, () => {
      showToast('Lembrete salvo com sucesso!', 'success');
      
      // Reset form
      elements.saveNotes.value = '';
      activeTags = [];
      renderTags();
      
      // Redirect to bookmarks tab
      switchTab('reminders');
    });
  });
}

// LOAD & RENDER REMINDERS
function loadReminders(searchQuery = '') {
  chrome.storage.local.get(['chatwootReminders'], (result) => {
    const list = result.chatwootReminders || [];
    elements.remindersList.innerHTML = '';

    const query = searchQuery.trim().toLowerCase();
    const filtered = list.filter(item => {
      if (!query) return true;
      const titleMatch = item.title.toLowerCase().includes(query);
      const contactMatch = item.contactName.toLowerCase().includes(query);
      const notesMatch = item.notes.toLowerCase().includes(query);
      const tagsMatch = item.tags.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || contactMatch || notesMatch || tagsMatch;
    });

    if (filtered.length === 0) {
      elements.remindersList.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          <h3>Nenhum Lembrete Encontrado</h3>
          <p>${query ? 'Não há lembretes correspondentes à sua busca.' : 'Abra uma conversa no Chatwoot e clique na aba \"Salvar Atual\" para criar seu primeiro lembrete.'}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
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

      card.innerHTML = `
        <div class="reminder-header">
          <a href="#" class="reminder-title-link" data-url="${item.url}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
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
        
        ${notesHtml}
        ${tagsHtml}
        
        <div class="notification-reply-wrapper">
          <form class="reminder-reply-form" data-acc="${item.accountId}" data-conv="${item.conversationId}">
            <input type="text" class="reply-input" placeholder="Digite uma resposta rápida..." required>
            <button type="submit" class="btn-reply-send">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              Responder
            </button>
          </form>
        </div>
      `;

      // Add click behavior to open the conversation in a new tab
      card.querySelector('.reminder-title-link').addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: item.url });
      });

      // Add delete behavior
      card.querySelector('.btn-delete').addEventListener('click', () => {
        deleteReminder(item.id);
      });

      // Add reply behavior
      card.querySelector('.reminder-reply-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('.reply-input');
        const btn = form.querySelector('.btn-reply-send');
        sendReminderReply(
          form.getAttribute('data-acc'),
          form.getAttribute('data-conv'),
          input,
          btn
        );
      });

      elements.remindersList.appendChild(card);
    });
    resolveInboxNames();
  });
}

function deleteReminder(id) {
  chrome.storage.local.get(['chatwootReminders'], (result) => {
    const list = result.chatwootReminders || [];
    const filteredList = list.filter(item => item.id !== id);
    chrome.storage.local.set({ chatwootReminders: filteredList }, () => {
      showToast('Lembrete excluído.', 'success');
      loadReminders(elements.searchInput.value);
    });
  });
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
    
    if (searchRes && searchRes.payload && searchRes.payload.length > 0) {
      // Contact exists
      contactId = searchRes.payload[0].id;
      contactName = searchRes.payload[0].name || contactName;
      showToast('Contato encontrado no Chatwoot!', 'success');
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

    // Step 4: Create Conversation
    // POST /api/v1/accounts/{account_id}/conversations
    showToast('Iniciando conversa...', 'success');
    const convRes = await chatwootFetch(`/api/v1/accounts/${accountId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({
        contact_id: parseInt(contactId),
        inbox_id: parseInt(inboxId),
        status: 'open'
      })
    });

    const conversationId = convRes?.id;
    if (!conversationId) {
      throw new Error('Não foi possível iniciar a conversa na API.');
    }

    // Redirect user to the new conversation
    showToast('Redirecionando...', 'success');
    const targetUrl = `${config.url}/app/accounts/${accountId}/conversations/${conversationId}`;
    
    // Update active tab or open new
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.update(tabs[0].id, { url: targetUrl });
      } else {
        chrome.tabs.create({ url: targetUrl });
      }
      
      // Reset form
      elements.newChatPhone.value = '';
      elements.newChatName.value = '';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = origBtnContent;
      
      // Close popup automatically
      setTimeout(() => window.close(), 1000);
    });

  } catch (err) {
    console.error('Error starting conversation:', err);
    showToast(`Erro: ${err.message}`, 'error');
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = origBtnContent;
  }
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
  chrome.storage.local.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    const unreadList = list.filter(item => !item.read);
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
      const key = `${item.accountId}_${item.conversationId}`;
      if (!grouped[key]) {
        grouped[key] = {
          accountId: item.accountId,
          conversationId: item.conversationId,
          inboxId: item.inboxId || '',
          senderName: item.senderName,
          latestTimestamp: item.timestamp,
          messages: []
        };
      }
      grouped[key].messages.push(item);
      if (item.timestamp > grouped[key].latestTimestamp) {
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
      group.messages.sort((a, b) => a.timestamp - b.timestamp);

      // Render individual message bubbles
      let bubblesHtml = '<div class="notification-bubbles-list">';
      group.messages.forEach(msg => {
        bubblesHtml += `<div class="notification-bubble">${msg.content}</div>`;
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

      // Connect button actions
      card.querySelector('.btn-action-icon.open').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        openNotificationConversation(btn.getAttribute('data-acc'), btn.getAttribute('data-conv'));
      });

      card.querySelector('.btn-action-icon.delete').addEventListener('click', (e) => {
        const btn = e.currentTarget;
        deleteConversationNotifications(btn.getAttribute('data-acc'), btn.getAttribute('data-conv'));
      });

      card.querySelector('.reply-form').addEventListener('submit', (e) => {
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

      elements.notificationsList.appendChild(card);
    });
    resolveInboxNames();
  });
}

function formatRelativeTime(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `há ${diffMins} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  
  // Default date format
  const date = new Date(timestamp);
  return date.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function deleteConversationNotifications(accountId, conversationId) {
  chrome.storage.local.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    const filteredList = list.filter(item => 
      !(item.accountId == accountId && item.conversationId == conversationId)
    );
    chrome.storage.local.set({ chatwootNotifications: filteredList }, () => {
      // Update action badge
      chrome.action.setBadgeText({ text: filteredList.length > 0 ? String(filteredList.length) : '' });
      loadNotifications();
    });
  });
}

function clearAllNotifications() {
  chrome.storage.local.set({ chatwootNotifications: [] }, () => {
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

function resolveInboxNames() {
  const elementsToResolve = document.querySelectorAll('.inbox-name-badge:not(.resolved)');
  elementsToResolve.forEach(async (el) => {
    const accId = el.getAttribute('data-acc');
    const inboxId = el.getAttribute('data-inbox');
    if (accId && inboxId) {
      el.classList.add('resolved');
      const name = await getInboxName(accId, inboxId);
      if (name) {
        el.textContent = `(${name})`;
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
