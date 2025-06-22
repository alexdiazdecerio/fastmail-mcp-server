#!/usr/bin/env node

/**
 * 🚀 Fastmail MCP Server - Raspberry Pi Edition
 * Servidor híbrido: MCP Server + Webhook Receiver + Notificaciones
 * Diseñado para correr 24/7 en Raspberry Pi
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { FastmailClient } from './fastmail-client.js';
import { EmailAnalyticsEngine } from './email-analytics.js';

// Load environment variables
dotenv.config();

// Validate environment variables
const email = process.env.FASTMAIL_EMAIL;
const apiToken = process.env.FASTMAIL_API_TOKEN;
const slackWebhook = process.env.SLACK_WEBHOOK_URL;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

if (!email || !apiToken) {
  console.error('❌ Error: Missing required environment variables');
  console.error('Please set FASTMAIL_EMAIL and FASTMAIL_API_TOKEN in your .env file');
  process.exit(1);
}

// Initialize clients
const fastmail = new FastmailClient(email, apiToken);
const analytics = new EmailAnalyticsEngine(fastmail);
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    try {
      await fastmail.initialize();
      initialized = true;
      console.log('✅ Fastmail client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Fastmail client:', error);
      throw error;
    }
  }
}

// Create Express app for webhooks
const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📊 In-memory storage for processed emails (in production, use Redis/DB)
const emailCache = new Map();
const notificationQueue = [];

// 🔧 Utility functions
function analyzeUrgency(emailEvent) {
  const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'importante', 'urgente'];
  const subject = (emailEvent.subject || '').toLowerCase();
  const from = (emailEvent.from || '').toLowerCase();
  
  return urgentKeywords.some(keyword => 
    subject.includes(keyword) || from.includes('boss') || from.includes('jefe')
  );
}

function categorizeEmail(emailEvent) {
  const from = (emailEvent.from || '').toLowerCase();
  const subject = (emailEvent.subject || '').toLowerCase();
  
  if (from.includes('noreply') || from.includes('newsletter')) return 'Newsletter';
  if (subject.includes('invoice') || subject.includes('factura')) return 'Financial';
  if (from.includes('@cliente.com') || from.includes('@client.')) return 'VIP';
  if (subject.includes('meeting') || subject.includes('reunión')) return 'Meeting';
  
  return 'General';
}

async function sendSlackNotification(message) {
  if (!slackWebhook) return;
  
  try {
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    
    if (response.ok) {
      console.log('📱 Slack notification sent');
    }
  } catch (error) {
    console.error('❌ Slack notification failed:', error);
  }
}

async function sendTelegramMessage(message) {
  if (!telegramToken || !telegramChatId) return;
  
  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
    
    if (response.ok) {
      console.log('📱 Telegram notification sent');
    }
  } catch (error) {
    console.error('❌ Telegram notification failed:', error);
  }
}