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
updateUnreadBadgeFromAPI();
syncAlarmsFromStorage();

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
    updateUnreadBadgeFromAPI();
  } else if (alarm.name.startsWith('reminder_')) {
    showReminderAlarmNotification(alarm.name);
  }
});

// Runtime Message Listener (from popup.js when settings change)
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'settingsChanged') {
    console.log('[Chatwoot Helper] Settings updated. Reconnecting WebSocket...');
    initConnection(true); // Force reconnect even if another initialization is in progress
    updateUnreadBadgeFromAPI();
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
    const result = await chrome.storage.sync.get(['chatwootSettings']);
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

        updateUnreadBadgeFromAPI();
        showNotification(msgData, accountId);

        // Broadcast to popup to reload lists instantly
        chrome.runtime.sendMessage({
          action: 'newMessageReceived',
          conversationId: msgData.conversation_id
        }).catch(() => {});
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
  const conversationId = msg.conversation_id;
  const notificationId = `chatwoot_conv_${accountId}_${conversationId}`;

  // Fetch all pending notifications from synced storage to group them
  chrome.storage.sync.get(['chatwootNotifications'], (result) => {
    const list = result.chatwootNotifications || [];
    
    // Filter notifications for this specific conversation
    const convMsgs = list.filter(item => 
      String(item.accountId) === String(accountId) && 
      String(item.conversationId) === String(conversationId)
    );

    let messageText = '';
    if (convMsgs.length > 0) {
      // Sort chronologically (oldest first)
      const sortedMsgs = [...convMsgs].sort((a, b) => a.timestamp - b.timestamp);
      messageText = sortedMsgs.map(item => item.content).join('\n');
    } else {
      messageText = msg.content || 'Nova mensagem (mídia/anexo)';
    }
    
    const title = convMsgs.length > 1 
      ? `[${convMsgs.length} novas mensagens] de ${senderName}` 
      : `Nova mensagem de ${senderName}`;

    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: title,
      message: messageText,
      priority: 2,
      requireInteraction: true
    }, (id) => {
      if (chrome.runtime.lastError) {
        console.error('[Chatwoot Helper] Notification creation error:', chrome.runtime.lastError);
      } else {
        console.log('[Chatwoot Helper] Notification created successfully:', id);
      }
    });
  });
}

// Listen for clicks on the notification cards
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('chatwoot_conv_') || notificationId.startsWith('alarm_conv_')) {
    const parts = notificationId.split('_');
    const accountId = parts[2];
    const conversationId = parts[3];

    openConversationInWindow(conversationId, 'Cliente', accountId, '');
    chrome.notifications.clear(notificationId);
  }
});

function showReminderAlarmNotification(reminderId) {
  // Fetch the reminder from synced storage
  chrome.storage.sync.get(['chatwootReminders'], (result) => {
    const list = result.chatwootReminders || [];
    const reminder = list.find(item => item.id === reminderId);
    
    if (reminder) {
      // Build notification
      const notificationId = `alarm_conv_${reminder.accountId}_${reminder.conversationId}`;
      const title = `Lembrete: Responder ${reminder.contactName}`;
      const message = reminder.notes 
        ? `${reminder.title}\nNotas: ${reminder.notes}` 
        : `${reminder.title}`;

      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: title,
        message: message,
        priority: 2,
        requireInteraction: true
      });
    }
  });
}

// SYNC ALARMS & STORAGE WATCHERS
function syncAlarms(reminders) {
  chrome.alarms.getAll((currentAlarms) => {
    const alarmMap = new Map();
    currentAlarms.forEach(alarm => {
      if (alarm.name.startsWith('reminder_')) {
        alarmMap.set(alarm.name, alarm);
      }
    });

    const now = Date.now();
    const activeReminderIds = new Set();

    reminders.forEach(reminder => {
      if (reminder.alarmTime && reminder.alarmTime > now) {
        activeReminderIds.add(reminder.id);
        const existingAlarm = alarmMap.get(reminder.id);
        if (!existingAlarm) {
          console.log(`[Chatwoot Helper] Creating synced alarm for: ${reminder.id}`);
          chrome.alarms.create(reminder.id, { when: reminder.alarmTime });
        } else {
          if (Math.abs(existingAlarm.scheduledTime - reminder.alarmTime) > 1000) {
            console.log(`[Chatwoot Helper] Updating synced alarm for: ${reminder.id}`);
            chrome.alarms.create(reminder.id, { when: reminder.alarmTime });
          }
        }
      }
    });

    alarmMap.forEach((alarm, alarmName) => {
      if (!activeReminderIds.has(alarmName)) {
        console.log(`[Chatwoot Helper] Clearing obsolete alarm: ${alarmName}`);
        chrome.alarms.clear(alarmName);
      }
    });
  });
}

function syncAlarmsFromStorage() {
  chrome.storage.sync.get(['chatwootReminders'], (result) => {
    const list = result.chatwootReminders || [];
    syncAlarms(list);
  });
}

// Watch sync storage changes to keep local alarms in sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.chatwootReminders) {
      console.log('[Chatwoot Helper] Synced reminders updated. Updating local alarms...');
      syncAlarms(changes.chatwootReminders.newValue || []);
    }
  }
});

// UNREAD BADGE FROM API LOGIC
async function updateUnreadBadgeFromAPI() {
  try {
    const result = await chrome.storage.sync.get(['chatwootSettings']);
    const savedConfig = result.chatwootSettings;
    if (!savedConfig || !savedConfig.url || !savedConfig.token) return;
    
    let accountId = savedConfig.defaultAccount;
    if (!accountId) {
      const profile = await fetchProfile(savedConfig.url, savedConfig.token);
      if (profile && profile.accounts && profile.accounts.length > 0) {
        accountId = profile.accounts[0].id;
      }
    }
    if (!accountId) return;
    
    const endpoint = `${savedConfig.url}/api/v1/accounts/${accountId}/conversations?status=open&assignee_type=all`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': savedConfig.token
      }
    });
    if (!response.ok) return;
    const data = await response.json();
    
    const conversations = extractConversationsArray(data);
    
    let totalUnread = 0;
    conversations.forEach(item => {
      if (item && item.unread_count) {
        totalUnread += item.unread_count;
      }
    });
    
    chrome.action.setBadgeText({ text: totalUnread > 0 ? String(totalUnread) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF3B30' });
  } catch (err) {
    console.error('[Chatwoot Helper] Error updating unread badge from API:', err);
  }
}

function extractConversationsArray(response) {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.payload)) return response.payload;
  if (response.payload && Array.isArray(response.payload.conversations)) return response.payload.conversations;
  if (Array.isArray(response.conversations)) return response.conversations;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && Array.isArray(response.data.conversations)) return response.data.conversations;

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

function openConversationInWindow(conversationId, contactName, accountId, inboxId) {
  const targetUrl = chrome.runtime.getURL(`popup.html?convId=${conversationId}`);
  
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(targetUrl));
    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true });
      chrome.windows.update(existingTab.windowId, { focused: true });
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

