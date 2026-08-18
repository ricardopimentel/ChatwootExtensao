// STATE VARIABLES
let socket = null;
let pubsubToken = null;
let userId = null;
let accounts = [];
let config = null;
let reconnectTimeout = null;
let heartbeatInterval = null;
let isInitializing = false;

// INITIALIZATION
// Run immediately when service worker starts
console.log('[Chatwoot Helper] Service worker starting...');
initConnection();
updateBadgeFromStorage();

// Set up Chrome Alarms to ensure persistent connection
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('check-websocket-state', { periodInMinutes: 1 });
  console.log('[Chatwoot Helper] Extension installed. Alarm registered.');
  // No need to call initConnection() here; it already runs at the top level when the worker starts
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[Chatwoot Helper] Browser startup.');
  // No need to call initConnection() here; it already runs at the top level when the worker starts
});

// Alarm Listener to keep connection alive or reconnect if closed
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-websocket-state') {
    console.log('[Chatwoot Helper] Alarm tick: Checking WebSocket status...');
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      console.log('[Chatwoot Helper] WebSocket is offline. Reinitializing...');
      initConnection();
    }
  }
});

// Runtime Message Listener (from popup.js when settings change)
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'settingsChanged') {
    console.log('[Chatwoot Helper] Settings updated. Reconnecting WebSocket...');
    initConnection(true); // Force reconnect even if another initialization is in progress
  }
});

// CONNECTION MANAGEMENT
async function initConnection(force = false) {
  if (isInitializing && !force) {
    console.log('[Chatwoot Helper] Connection initialization already in progress. Skipping.');
    return;
  }
  isInitializing = true;

  closeConnection();

  try {
    // Retrieve configuration
    const result = await chrome.storage.local.get(['chatwootSettings']);
    config = result.chatwootSettings;

    if (!config || !config.url || !config.token) {
      console.log('[Chatwoot Helper] Configuration missing (URL/Token). Connection aborted.');
      isInitializing = false;
      return;
    }

    console.log('[Chatwoot Helper] Fetching user profile from Chatwoot API...');
    const profile = await fetchProfile(config.url, config.token);
    pubsubToken = profile.pubsub_token;
    userId = profile.id;
    accounts = profile.accounts || [];

    if (!pubsubToken || !userId || accounts.length === 0) {
      throw new Error('Missing pubsub_token, user id, or accounts list in profile response.');
    }

    console.log(`[Chatwoot Helper] Profile loaded successfully. User ID: ${userId}, Accounts: ${accounts.length}`);
    connectWebSocket();
  } catch (err) {
    console.error('[Chatwoot Helper] Connection initialization failed:', err.message);
    scheduleReconnect(10000); // Retry after 10 seconds
  } finally {
    isInitializing = false;
  }
}

async function fetchProfile(baseUrl, token) {
  const url = `${baseUrl}/api/v1/profile`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': token
    }
  });

  if (!response.ok) {
    throw new Error(`Profile request failed with status: ${response.status}`);
  }

  return response.json();
}

function connectWebSocket() {
  if (!config || !config.url) return;

  // Convert http(s) to ws(s)
  const wsUrl = config.url.replace(/^http/, 'ws') + '/cable';
  console.log('[Chatwoot Helper] Connecting to WebSocket:', wsUrl);

  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('[Chatwoot Helper] WebSocket connection established.');
    subscribeChannels();
    startHeartbeat();
  };

  socket.onmessage = (event) => {
    handleWebSocketMessage(event.data);
  };

  socket.onerror = (error) => {
    console.error('[Chatwoot Helper] WebSocket error occurred:', error);
  };

  socket.onclose = (event) => {
    console.log(`[Chatwoot Helper] WebSocket closed (Code: ${event.code}, Reason: ${event.reason || 'None'}).`);
    stopHeartbeat();
    scheduleReconnect(5000); // Reconnect in 5 seconds
  };
}

function closeConnection() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  stopHeartbeat();
  if (socket) {
    // Unbind listeners to prevent reconnection loops during explicit teardown
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    try {
      socket.close();
    } catch (e) {}
    socket = null;
  }
}

function scheduleReconnect(delayMs) {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }
  console.log(`[Chatwoot Helper] Reconnecting in ${delayMs / 1000} seconds...`);
  reconnectTimeout = setTimeout(() => {
    initConnection();
  }, delayMs);
}

// SUBSCRIBING & MESSAGES
function subscribeChannels() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  console.log('[Chatwoot Helper] Subscribing to RoomChannel for active accounts...');
  accounts.forEach((acc) => {
    const identifier = JSON.stringify({
      channel: 'RoomChannel',
      pubsub_token: pubsubToken,
      account_id: acc.id,
      user_id: userId
    });

    socket.send(JSON.stringify({
      command: 'subscribe',
      identifier: identifier
    }));
    console.log(`[Chatwoot Helper] Subscription request sent for Account ID #${acc.id}`);
  });
}

function handleWebSocketMessage(rawData) {
  try {
    const data = JSON.parse(rawData);

    // Keepalive ping from ActionCable
    if (data.type === 'ping') {
      return;
    }

    if (data.type === 'welcome') {
      console.log('[Chatwoot Helper] ActionCable connection welcome received.');
      return;
    }

    if (data.type === 'confirm_subscription') {
      console.log('[Chatwoot Helper] Subscription confirmed for identifier:', data.identifier);
      return;
    }

    // Process broadcast events
    if (data.message && data.message.event === 'message.created') {
      const msgData = data.message.data;
      
      // We only want to notify on incoming messages from contacts
      if (msgData && (msgData.message_type === 0 || msgData.message_type === 'incoming')) {
        console.log('[Chatwoot Helper] New incoming message detected.');
        
        // Extract account ID from identifier wrapper if missing in message data
        let accountId = msgData.account_id;
        if (!accountId && data.identifier) {
          try {
            const parsedIdentifier = JSON.parse(data.identifier);
            accountId = parsedIdentifier.account_id;
          } catch (e) {}
        }
        
        if (!accountId && accounts.length > 0) {
          accountId = accounts[0].id;
        }

        // Save notification to local storage, which will then trigger showNotification
        saveNotificationToStorage(msgData, accountId);
      }
    }
  } catch (err) {
    console.error('[Chatwoot Helper] Error handling WebSocket message:', err);
  }
}

// HEARTBEAT
function startHeartbeat() {
  stopHeartbeat();
  // Heartbeat message to prevent connection from going stale
  heartbeatInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ command: 'ping' }));
    }
  }, 20000); // Send keepalive every 20 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// NOTIFICATION DISPLAY & ACTION
function showNotification(msg, accountId) {
  const senderName = msg.sender ? msg.sender.name : 'Cliente';
  const messageContent = msg.content || 'Nova mensagem (mídia/anexo)';
  const conversationId = msg.conversation_id;

  // Statelessly encode needed URL components into the notification ID
  // Format: chatwoot_conv_<accountId>_<conversationId>_<timestamp>
  const notificationId = `chatwoot_conv_${accountId}_${conversationId}_${Date.now()}`;

  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title: `Nova mensagem de ${senderName}`,
    message: messageContent,
    priority: 2,
    requireInteraction: true
  }, (id) => {
    if (chrome.runtime.lastError) {
      console.error('[Chatwoot Helper] Notification creation error:', chrome.runtime.lastError);
    } else {
      console.log('[Chatwoot Helper] Notification created successfully:', id);
    }
  });
}

// Listen for clicks on the notification cards
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('chatwoot_conv_')) {
    const parts = notificationId.split('_');
    const accountId = parts[2];
    const conversationId = parts[3];

    // Clear notifications for this conversation
    removeNotificationsForConversation(accountId, conversationId);

    chrome.storage.local.get(['chatwootSettings'], (result) => {
      const savedConfig = result.chatwootSettings;
      if (savedConfig && savedConfig.url) {
        const targetUrl = `${savedConfig.url}/app/accounts/${accountId}/conversations/${conversationId}`;
        
        // Search if the conversation is already open in any tab
        chrome.tabs.query({}, (tabs) => {
          const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(targetUrl));
          
          if (existingTab) {
            // Activate the tab and focus its window
            chrome.tabs.update(existingTab.id, { active: true });
            chrome.windows.update(existingTab.windowId, { focused: true });
          } else {
            // Open a new tab
            chrome.tabs.create({ url: targetUrl });
          }
          
          // Clear the notification
          chrome.notifications.clear(notificationId);
        });
      }
    });
  }
});

// NOTIFICATION STORAGE HELPERS
function saveNotificationToStorage(msgData, accountId) {
  const notificationId = `msg_${msgData.id}`;
  const conversationId = msgData.conversation_id;
  const senderName = msgData.sender ? msgData.sender.name : 'Cliente';
  const content = msgData.content || 'Nova mensagem (mídia/anexo)';

  chrome.storage.local.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    
    const newNotification = {
      id: notificationId,
      conversationId: conversationId,
      accountId: accountId,
      inboxId: msgData.inbox_id,
      senderName: senderName,
      content: content,
      timestamp: Date.now(),
      read: false
    };

    // Filter out duplicates (if any)
    const filteredList = list.filter(item => item.id !== notificationId);
    filteredList.unshift(newNotification);

    chrome.storage.local.set({ chatwootNotifications: filteredList }, () => {
      updateExtensionBadge(filteredList);
      showNotification(msgData, accountId);
    });
  });
}

function updateBadgeFromStorage() {
  chrome.storage.local.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    updateExtensionBadge(list);
  });
}

function updateExtensionBadge(list) {
  const unreadCount = list.filter(item => !item.read).length;
  chrome.action.setBadgeText({ text: unreadCount > 0 ? String(unreadCount) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' });
}

function removeNotificationsForConversation(accountId, conversationId) {
  chrome.storage.local.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    const filteredList = list.filter(item => 
      !(item.accountId == accountId && item.conversationId == conversationId)
    );
    chrome.storage.local.set({ chatwootNotifications: filteredList }, () => {
      updateExtensionBadge(filteredList);
    });
  });
}
