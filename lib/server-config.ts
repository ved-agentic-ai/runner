import fs from 'fs';
import path from 'path';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  settingKey: string;
  oldValue: any;
  newValue: any;
  actor: string;
  ip: string;
}

export interface ServerConfigData {
  config: Record<string, any>;
  auditLogs: AuditLogEntry[];
}

const CONFIG_FILE = path.join(process.cwd(), 'server_config.json');

function readServerConfig(): ServerConfigData {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading server_config.json:', err);
  }
  return {
    config: {
      workspaceMode: process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_MODE || 'light',
      disclaimerMode: process.env.NEXT_PUBLIC_DEFAULT_DISCLAIMER_MODE || 'modal',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
      adSenseClientId: process.env.ADSENSE_CLIENT_ID || 'ca-pub-2966115619566020',
      allowMfaReset: process.env.ALLOW_MFA_RESET === 'true'
    },
    auditLogs: [
      {
        id: `log_init`,
        timestamp: new Date().toISOString(),
        action: 'System Config Initialized',
        settingKey: 'system',
        oldValue: null,
        newValue: 'Production Server Config & Audit Engine Active',
        actor: 'Owner (System Root)',
        ip: '127.0.0.1'
      }
    ]
  };
}

function writeServerConfig(data: ServerConfigData) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing server_config.json:', err);
  }
}

export const serverConfigEngine = {
  get: (): ServerConfigData => {
    return readServerConfig();
  },

  updateSetting: (
    key: string,
    newValue: any,
    actor: string = 'Owner (MFA Verified)',
    ip: string = '::1'
  ): ServerConfigData => {
    const data = readServerConfig();
    const oldValue = data.config[key] !== undefined ? data.config[key] : null;

    // Prevent duplicate logs if values are identical
    if (oldValue === newValue) return data;

    // Update config key
    data.config[key] = newValue;

    // Helper to get friendly action name
    const getFriendlyAction = (k: string, val: any): string => {
      switch (k) {
        case 'workspaceMode':
          return `Workspace Mode: switched to ${val === 'full' ? 'Full Enterprise' : 'Light Team View'}`;
        case 'disclaimerMode':
          return `Legal Disclaimer: set display to ${val === 'modal' ? 'Page Popup Modal' : 'Standalone Tab'}`;
        case 'stripeSecretKey':
          return `Payment Gateway: Stripe Secret API Key updated`;
        case 'paypalClientId':
          return `Payment Gateway: PayPal Client ID updated`;
        case 'adSenseClientId':
          return `Monetization: Google AdSense ID updated to [${val}]`;
        default:
          if (k.startsWith('show')) {
            const component = k.replace('show', '');
            return `Layout Settings: ${val ? 'Enabled' : 'Disabled'} ${component} widget visibility`;
          }
          return `System Config: Updated [${k}] parameter`;
      }
    };

    // Create Audit Log Entry
    const auditEntry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: getFriendlyAction(key, newValue),
      settingKey: key,
      oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
      newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
      actor,
      ip
    };

    // Keep up to 200 audit logs
    data.auditLogs.unshift(auditEntry);
    if (data.auditLogs.length > 200) {
      data.auditLogs = data.auditLogs.slice(0, 200);
    }

    writeServerConfig(data);
    return data;
  }
};
