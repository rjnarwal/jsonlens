import { JSONHistoryItem } from '../types/json';

const HISTORY_KEY = 'jsonlens_history_v1';

export function loadJsonHistory(): JSONHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveJsonHistory(
  title: string,
  leftJson: string,
  rightJson?: string,
  mode: 'diff' | 'formatter' = 'diff'
): JSONHistoryItem[] {
  try {
    const current = loadJsonHistory();
    const newItem: JSONHistoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      title,
      leftJson,
      rightJson,
      mode,
    };
    const updated = [newItem, ...current].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteJsonHistoryItem(id: string): JSONHistoryItem[] {
  try {
    const current = loadJsonHistory();
    const updated = current.filter((i) => i.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearJsonHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// Sample JSON Comparison Presets
export const SAMPLE_JSON_DIFF = {
  left: `{
  "service": "checkout-api",
  "version": "1.0.4",
  "environment": "staging",
  "timeoutSeconds": 30,
  "features": {
    "applePay": true,
    "cryptoPayments": false,
    "taxCalculation": true
  },
  "database": {
    "host": "staging-db.internal",
    "port": 5432,
    "poolSize": 10
  },
  "endpoints": [
    "/v1/health",
    "/v1/cart",
    "/v1/pay"
  ]
}`,
  right: `{
  "service": "checkout-api",
  "version": "1.1.0",
  "environment": "production",
  "timeoutSeconds": 45,
  "features": {
    "applePay": true,
    "cryptoPayments": true,
    "taxCalculation": true,
    "fraudDetectionV2": true
  },
  "database": {
    "host": "prod-db-cluster.internal",
    "port": 5432,
    "poolSize": 25,
    "sslMode": "require"
  },
  "endpoints": [
    "/v1/health",
    "/v1/cart",
    "/v1/pay",
    "/v1/refund"
  ]
}`,
};
