#!/usr/bin/env node

// Script de prueba para las Analytics de Email
import dotenv from 'dotenv';
import { FastmailClient } from './build/fastmail-client.js';
import { EmailAnalyticsEngine } from './build/email-analytics.js';

dotenv.config();

async function testAnalytics() {
  console.log('🧪 Testing Email Analytics Engine...\n');
  
  const email = process.env.FASTMAIL_EMAIL;
  const apiToken = process.env.FASTMAIL_API_TOKEN;
  
  if (!email || !apiToken) {
    console.error('❌ Error: Missing credentials');
    process.exit(1);
  }
  
  // Initialize clients
  const fastmail = new FastmailClient(email, apiToken);
  const analytics = new EmailAnalyticsEngine(fastmail);
  
  try {
    await fastmail.initialize();
    console.log('✅ Fastmail client initialized');
    
    // Test 1: Get volume analytics for last 7 days
    console.log('\n📊 TEST 1: Email Volume Analytics (Last 7 days)');
    console.log('='.repeat(50));
    
    const volumeStats = await analytics.getVolumeAnalytics(7);
    console.log('Volume Stats:', JSON.stringify(volumeStats, null, 2));
    
    // Test 2: Get top senders
    console.log('\n👥 TEST 2: Top 5 Senders (Last 7 days)');
    console.log('='.repeat(50));
    
    const topSenders = await analytics.getTopSenders(5, 7);
    console.log('Top Senders:');
    topSenders.forEach((sender, i) => {
      console.log(`${i + 1}. ${sender.name || sender.email} - ${sender.count} emails (${sender.percentage}%)`);
    });
    
    // Test 3: Generate comprehensive report
    console.log('\n📋 TEST 3: Comprehensive Email Report (Last 7 days)');
    console.log('='.repeat(50));
    
    const report = await analytics.generateEmailReport(7);
    console.log(report);
    
    console.log('\n✅ All analytics tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAnalytics().catch(console.error);
