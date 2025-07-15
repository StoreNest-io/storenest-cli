/**
 * Sample Plugin Template
 * 
 * This is a template for creating external plugins for Storenest.
 * Copy this template and modify it to create your own plugin.
 * 
 * @author Your Name
 * @version 1.0.0
 * @license MIT
 */

/*
@manifest {
  "name": "Sample Plugin",
  "description": "A sample plugin template for Storenest",
  "version": "1.0.0",
  "author": "Your Name",
  "authorEmail": "your.email@example.com",
  "authorWebsite": "https://yourwebsite.com",
  "pluginCode": "sample-plugin",
  "category": "Utilities",
  "tags": ["template", "example"],
  "license": "MIT",
  "minStorenestVersion": "1.0.0",
  "permissions": [
    "database.read",
    "api.read"
  ],
  "hooks": [
    "afterOrderCreate",
    "onPluginInstall",
    "onPluginUninstall"
  ]
}
*/

// ============================================================================
// PLUGIN SETTINGS SCHEMA
// ============================================================================

const settings = {
  // Basic configuration
  is_enabled: {
    type: 'boolean',
    label: 'Enable Plugin',
    description: 'Enable or disable this plugin',
    default: true
  },

  // API configuration
  api_key: {
    type: 'string',
    label: 'API Key',
    description: 'Your external service API key',
    required: true,
    sensitive: true
  },

  api_url: {
    type: 'string',
    label: 'API URL',
    description: 'URL of your external service API',
    required: true,
    default: 'https://api.example.com'
  },

  // Feature toggles
  enable_notifications: {
    type: 'boolean',
    label: 'Enable Notifications',
    description: 'Send notifications for events',
    default: true
  },

  enable_logging: {
    type: 'boolean',
    label: 'Enable Logging',
    description: 'Log plugin activities',
    default: true
  },

  // Numeric settings
  sync_interval: {
    type: 'number',
    label: 'Sync Interval (minutes)',
    description: 'How often to sync with external service',
    default: 30,
    min: 5,
    max: 1440
  },

  retry_attempts: {
    type: 'number',
    label: 'Retry Attempts',
    description: 'Number of retry attempts for failed operations',
    default: 3,
    min: 1,
    max: 10
  },

  // Select options
  notification_type: {
    type: 'select',
    label: 'Notification Type',
    description: 'Type of notifications to send',
    options: [
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'webhook', label: 'Webhook' }
    ],
    default: 'email'
  },

  // Textarea for templates
  email_template: {
    type: 'textarea',
    label: 'Email Template',
    description: 'Template for email notifications',
    default: 'New order #{{orderNumber}} received for {{total}}',
    rows: 4,
    maxLength: 1000
  }
};

// ============================================================================
// PLUGIN CONFIGURATION
// ============================================================================

const config = {
  // Plugin configuration
  name: 'Sample Plugin',
  version: '1.0.0',
  
  // API configuration
  apiTimeout: 10000, // 10 seconds
  maxRetries: 3,
  
  // Logging configuration
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  
  // Feature flags
  features: {
    notifications: true,
    logging: true,
    autoSync: true
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get plugin setting with fallback to default
 */
const getSetting = async (key, defaultValue = null) => {
  try {
    const value = await storenest.api.settings.get(key);
    return value !== null && value !== undefined ? value : defaultValue;
  } catch (error) {
    storenest.api.log.warn(`Failed to get setting ${key}:`, error.message);
    return defaultValue;
  }
};

/**
 * Set plugin setting
 */
const setSetting = async (key, value) => {
  try {
    await storenest.api.settings.set(key, value);
    return true;
  } catch (error) {
    storenest.api.log.error(`Failed to set setting ${key}:`, error.message);
    return false;
  }
};

/**
 * Log message with plugin prefix
 */
const log = (level, message, data = null) => {
  const isLoggingEnabled = config.features.logging;
  if (!isLoggingEnabled) return;

  const logMessage = `[${config.name}] ${message}`;
  
  switch (level) {
    case 'debug':
      storenest.api.log.info(logMessage, data);
      break;
    case 'info':
      storenest.api.log.info(logMessage, data);
      break;
    case 'warn':
      storenest.api.log.warn(logMessage, data);
      break;
    case 'error':
      storenest.api.log.error(logMessage, data);
      break;
    default:
      storenest.api.log.info(logMessage, data);
  }
};

/**
 * Validate email address
 */
const validateEmail = (email) => {
  return storenest.utils.validate.email(email);
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'EUR') => {
  return storenest.utils.format.currency(amount, currency);
};

/**
 * Make API request with retry logic
 */
const apiRequest = async (url, options = {}, retries = 3) => {
  const apiKey = await getSetting('api_key');
  const apiUrl = await getSetting('api_url');
  
  if (!apiKey || !apiUrl) {
    throw new Error('API configuration not found');
  }

  const requestOptions = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    timeout: config.apiTimeout,
    ...options
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      log('debug', `API request attempt ${attempt}/${retries}`, { url, method: requestOptions.method });
      
      const response = await fetch(`${apiUrl}${url}`, requestOptions);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      log('debug', 'API request successful', { url, status: response.status });
      
      return data;
    } catch (error) {
      log('warn', `API request attempt ${attempt} failed`, { url, error: error.message });
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Send notification
 */
const sendNotification = async (type, data) => {
  const isNotificationsEnabled = await getSetting('enable_notifications', true);
  if (!isNotificationsEnabled) {
    log('debug', 'Notifications disabled, skipping notification');
    return;
  }

  const notificationType = await getSetting('notification_type', 'email');
  
  try {
    switch (notificationType) {
      case 'email':
        await sendEmailNotification(type, data);
        break;
      case 'sms':
        await sendSMSNotification(type, data);
        break;
      case 'webhook':
        await sendWebhookNotification(type, data);
        break;
      default:
        log('warn', `Unknown notification type: ${notificationType}`);
    }
    
    log('info', 'Notification sent successfully', { type, notificationType });
  } catch (error) {
    log('error', 'Failed to send notification', { type, error: error.message });
  }
};

/**
 * Send email notification
 */
const sendEmailNotification = async (type, data) => {
  const template = await getSetting('email_template', 'New event: {{type}}');
  const recipient = await getSetting('recipient_email');
  
  if (!recipient) {
    throw new Error('No recipient email configured');
  }
  
  const message = template
    .replace('{{type}}', type)
    .replace('{{data}}', JSON.stringify(data));
  
  // Here you would integrate with your email service
  // For now, we'll just log the email
  log('info', 'Email notification prepared', { recipient, message });
};

/**
 * Send SMS notification
 */
const sendSMSNotification = async (type, data) => {
  const phoneNumber = await getSetting('phone_number');
  
  if (!phoneNumber) {
    throw new Error('No phone number configured');
  }
  
  const message = `New event: ${type}`;
  
  // Here you would integrate with your SMS service
  log('info', 'SMS notification prepared', { phoneNumber, message });
};

/**
 * Send webhook notification
 */
const sendWebhookNotification = async (type, data) => {
  const webhookUrl = await getSetting('webhook_url');
  
  if (!webhookUrl) {
    throw new Error('No webhook URL configured');
  }
  
  const payload = {
    event: type,
    timestamp: new Date().toISOString(),
    data: data
  };
  
  // Here you would send the webhook
  log('info', 'Webhook notification prepared', { webhookUrl, payload });
};

// ============================================================================
// HOOK HANDLERS
// ============================================================================

/**
 * Hook: After order is created
 */
const afterOrderCreate = async (data) => {
  const { order, shopId } = data;
  
  log('info', 'Order created', { orderId: order.id, shopId });
  
  try {
    // Send notification
    await sendNotification('order_created', {
      orderId: order.id,
      total: formatCurrency(order.total),
      customerEmail: order.customerEmail
    });
    
    // Sync with external system
    await syncOrderToExternalSystem(order, shopId);
    
    // Update plugin statistics
    await updatePluginStats(shopId, 'orders_processed');
    
  } catch (error) {
    log('error', 'Failed to process order creation', { orderId: order.id, error: error.message });
  }
};

/**
 * Hook: Before product is updated
 */
const beforeProductUpdate = async (data) => {
  const { product, shopId } = data;
  
  log('info', 'Product update requested', { productId: product.id, shopId });
  
  try {
    // Validate product data
    if (product.price && product.price < 0) {
      throw new Error('Product price cannot be negative');
    }
    
    if (product.stock && product.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
    
    // Log the update
    log('debug', 'Product validation passed', { productId: product.id });
    
  } catch (error) {
    log('error', 'Product validation failed', { productId: product.id, error: error.message });
    throw error; // This will prevent the update
  }
};

/**
 * Hook: After product is updated
 */
const afterProductUpdate = async (data) => {
  const { product, shopId } = data;
  
  log('info', 'Product updated', { productId: product.id, shopId });
  
  try {
    // Sync with external inventory system
    await syncProductToExternalSystem(product, shopId);
    
    // Send notification if stock is low
    if (product.stock && product.stock < 10) {
      await sendNotification('low_stock', {
        productId: product.id,
        productName: product.name,
        currentStock: product.stock
      });
    }
    
  } catch (error) {
    log('error', 'Failed to process product update', { productId: product.id, error: error.message });
  }
};

/**
 * Hook: When plugin is installed
 */
const onPluginInstall = async (data) => {
  const { shopId, installationId } = data;
  
  log('info', 'Plugin installation started', { shopId, installationId });
  
  try {
    // Initialize plugin data
    await initializePluginData(shopId);
    
    // Set default settings
    await setDefaultSettings(shopId);
    
    // Create database tables if needed
    await createPluginTables(shopId);
    
    // Start background tasks
    await startBackgroundTasks(shopId);
    
    log('info', 'Plugin installation completed successfully', { shopId });
    
  } catch (error) {
    log('error', 'Plugin installation failed', { shopId, error: error.message });
    throw error;
  }
};

/**
 * Hook: When plugin is uninstalled
 */
const onPluginUninstall = async (data) => {
  const { shopId, installationId } = data;
  
  log('info', 'Plugin uninstallation started', { shopId, installationId });
  
  try {
    // Stop background tasks
    await stopBackgroundTasks(shopId);
    
    // Clean up plugin data
    await cleanupPluginData(shopId);
    
    // Remove plugin tables
    await removePluginTables(shopId);
    
    log('info', 'Plugin uninstallation completed successfully', { shopId });
    
  } catch (error) {
    log('error', 'Plugin uninstallation failed', { shopId, error: error.message });
    // Don't throw error during uninstall to avoid blocking the process
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Initialize plugin data for a shop
 */
const initializePluginData = async (shopId) => {
  log('debug', 'Initializing plugin data', { shopId });
  
  // Create plugin statistics record
  await storenest.api.db.execute(`
    INSERT INTO plugin_statistics (shop_id, plugin_code, stats_data, created_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE updated_at = NOW()
  `, [shopId, config.name, JSON.stringify({
    orders_processed: 0,
    notifications_sent: 0,
    last_sync: null
  })]);
  
  log('debug', 'Plugin data initialized', { shopId });
};

/**
 * Set default settings for a shop
 */
const setDefaultSettings = async (shopId) => {
  log('debug', 'Setting default settings', { shopId });
  
  const defaultSettings = {
    is_enabled: true,
    enable_notifications: true,
    enable_logging: true,
    sync_interval: 30,
    retry_attempts: 3,
    notification_type: 'email'
  };
  
  for (const [key, value] of Object.entries(defaultSettings)) {
    await setSetting(key, value);
  }
  
  log('debug', 'Default settings applied', { shopId });
};

/**
 * Create plugin-specific database tables
 */
const createPluginTables = async (shopId) => {
  log('debug', 'Creating plugin tables', { shopId });
  
  // Example: Create a table for plugin-specific data
  await storenest.api.db.execute(`
    CREATE TABLE IF NOT EXISTS sample_plugin_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shop_id INT NOT NULL,
      data_type VARCHAR(50) NOT NULL,
      data_value JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_shop_type (shop_id, data_type)
    )
  `);
  
  log('debug', 'Plugin tables created', { shopId });
};

/**
 * Start background tasks
 */
const startBackgroundTasks = async (shopId) => {
  log('debug', 'Starting background tasks', { shopId });
  
  // Example: Start periodic sync task
  const syncInterval = await getSetting('sync_interval', 30);
  const intervalId = setInterval(async () => {
    await performPeriodicSync(shopId);
  }, syncInterval * 60 * 1000);
  
  // Store interval ID for cleanup
  await setSetting('sync_interval_id', intervalId);
  
  log('debug', 'Background tasks started', { shopId });
};

/**
 * Stop background tasks
 */
const stopBackgroundTasks = async (shopId) => {
  log('debug', 'Stopping background tasks', { shopId });
  
  const intervalId = await getSetting('sync_interval_id');
  if (intervalId) {
    clearInterval(intervalId);
    await setSetting('sync_interval_id', null);
  }
  
  log('debug', 'Background tasks stopped', { shopId });
};

/**
 * Clean up plugin data
 */
const cleanupPluginData = async (shopId) => {
  log('debug', 'Cleaning up plugin data', { shopId });
  
  // Remove plugin statistics
  await storenest.api.db.execute(`
    DELETE FROM plugin_statistics 
    WHERE shop_id = ? AND plugin_code = ?
  `, [shopId, config.name]);
  
  // Remove plugin-specific data
  await storenest.api.db.execute(`
    DELETE FROM sample_plugin_data 
    WHERE shop_id = ?
  `, [shopId]);
  
  log('debug', 'Plugin data cleaned up', { shopId });
};

/**
 * Remove plugin tables
 */
const removePluginTables = async (shopId) => {
  log('debug', 'Removing plugin tables', { shopId });
  
  // Drop plugin-specific tables
  await storenest.api.db.execute(`
    DROP TABLE IF EXISTS sample_plugin_data
  `);
  
  log('debug', 'Plugin tables removed', { shopId });
};

/**
 * Sync order to external system
 */
const syncOrderToExternalSystem = async (order, shopId) => {
  log('debug', 'Syncing order to external system', { orderId: order.id });
  
  try {
    const response = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.id,
        shop_id: shopId,
        total: order.total,
        items: order.items,
        customer: order.customer
      })
    });
    
    log('info', 'Order synced successfully', { orderId: order.id, externalId: response.id });
    return response;
    
  } catch (error) {
    log('error', 'Failed to sync order', { orderId: order.id, error: error.message });
    throw error;
  }
};

/**
 * Sync product to external system
 */
const syncProductToExternalSystem = async (product, shopId) => {
  log('debug', 'Syncing product to external system', { productId: product.id });
  
  try {
    const response = await apiRequest(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        shop_id: shopId,
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description
      })
    });
    
    log('info', 'Product synced successfully', { productId: product.id });
    return response;
    
  } catch (error) {
    log('error', 'Failed to sync product', { productId: product.id, error: error.message });
    throw error;
  }
};

/**
 * Update plugin statistics
 */
const updatePluginStats = async (shopId, statType) => {
  try {
    await storenest.api.db.execute(`
      UPDATE plugin_statistics 
      SET stats_data = JSON_SET(stats_data, '$.${statType}', COALESCE(JSON_EXTRACT(stats_data, '$.${statType}'), 0) + 1)
      WHERE shop_id = ? AND plugin_code = ?
    `, [shopId, config.name]);
    
    log('debug', 'Plugin statistics updated', { shopId, statType });
  } catch (error) {
    log('error', 'Failed to update plugin statistics', { shopId, statType, error: error.message });
  }
};

/**
 * Perform periodic sync
 */
const performPeriodicSync = async (shopId) => {
  log('debug', 'Performing periodic sync', { shopId });
  
  try {
    // Get recent orders
    const orders = await storenest.api.db.query(`
      SELECT * FROM orders 
      WHERE shop_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [shopId]);
    
    // Sync each order
    for (const order of orders) {
      await syncOrderToExternalSystem(order, shopId);
    }
    
    // Update last sync timestamp
    await storenest.api.db.execute(`
      UPDATE plugin_statistics 
      SET stats_data = JSON_SET(stats_data, '$.last_sync', NOW())
      WHERE shop_id = ? AND plugin_code = ?
    `, [shopId, config.name]);
    
    log('info', 'Periodic sync completed', { shopId, ordersProcessed: orders.length });
    
  } catch (error) {
    log('error', 'Periodic sync failed', { shopId, error: error.message });
  }
};

// ============================================================================
// PLUGIN EXPORTS
// ============================================================================

// Export hooks
const hooks = {
  afterOrderCreate,
  beforeProductUpdate,
  afterProductUpdate,
  onPluginInstall,
  onPluginUninstall
};

// Export settings schema
const settingsSchema = settings;

// Export initialization function
const init = async (data) => {
  const { shopId } = data;
  
  log('info', 'Plugin initialized', { shopId, version: config.version });
  
  // Load configuration
  const isEnabled = await getSetting('is_enabled', true);
  if (!isEnabled) {
    log('info', 'Plugin is disabled', { shopId });
    return;
  }
  
  // Start background tasks
  await startBackgroundTasks(shopId);
  
  log('info', 'Plugin initialization completed', { shopId });
};

// Export cleanup function
const destroy = async (data) => {
  const { shopId } = data;
  
  log('info', 'Plugin destruction started', { shopId });
  
  // Stop background tasks
  await stopBackgroundTasks(shopId);
  
  log('info', 'Plugin destruction completed', { shopId });
};

// Export configuration
const pluginConfig = config; 