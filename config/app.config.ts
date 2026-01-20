/**
 * Application Configuration
 * Core application settings and constants
 */

export interface AppConfig {
  name: string;
  version: string;
  description: string;
  features: FeatureFlags;
  limits: AppLimits;
  ui: UIConfig;
}

export interface FeatureFlags {
  enableRAG: boolean;
  enableMultiModel: boolean;
  enableExport: boolean;
  enableCollaboration: boolean;
  enableVersionHistory: boolean;
  enableAutoSave: boolean;
}

export interface AppLimits {
  maxMessageLength: number;
  maxHistoryLength: number;
  maxComponentsPerSchematic: number;
  maxConnectionsPerSchematic: number;
  maxCacheSize: number;
  sessionTimeout: number;
}

export interface UIConfig {
  theme: 'dark' | 'light' | 'system';
  primaryColor: string;
  accentColor: string;
  animationsEnabled: boolean;
  compactMode: boolean;
}

export const appConfig: AppConfig = {
  name: 'LightRail AI',
  version: '1.0.0',
  description: 'Advanced PCB schematic assistant with intelligent component routing',

  features: {
    enableRAG: true,
    enableMultiModel: true,
    enableExport: true,
    enableCollaboration: false,
    enableVersionHistory: true,
    enableAutoSave: true,
  },

  limits: {
    maxMessageLength: 10000,
    maxHistoryLength: 100,
    maxComponentsPerSchematic: 500,
    maxConnectionsPerSchematic: 1000,
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  ui: {
    theme: 'dark',
    primaryColor: '#39FF14',
    accentColor: '#00FF00',
    animationsEnabled: true,
    compactMode: false,
  },
};

export const PCB_CONSTANTS = {
  CANVAS_WIDTH: 1000,
  CANVAS_HEIGHT: 800,
  DEFAULT_COMPONENT_WIDTH: 85,
  MIN_COMPONENT_HEIGHT: 60,
  PIN_SPACING: 20,
  PIN_OFFSET: 30,
  GRID_SIZE: 10,
};

export const QUICK_START_PROMPTS = [
  'Build a 5V regulator circuit',
  'Design an ESP32 dev board',
  'Create a dual LED flasher',
  'Design a USB-C power delivery circuit',
  'Build an Arduino shield for motor control',
];
