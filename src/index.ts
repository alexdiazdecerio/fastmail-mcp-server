#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { FastmailClient } from './fastmail-client.js';
import { EmailAnalyticsEngine } from './email-analytics.js';

// Load environment variables
dotenv.config();

// Validate environment variables
const email = process.env.FASTMAIL_EMAIL;
const apiToken = process.env.FASTMAIL_API_TOKEN;

if (!email || !apiToken) {
  console.error('Error: Missing required environment variables');
  console.error('Please set FASTMAIL_EMAIL and FASTMAIL_API_TOKEN in your .env file');
  console.error('See .env.example for details');
  process.exit(1);
}

// Create Fastmail client
const fastmail = new FastmailClient(email, apiToken);

// Create Analytics engine
const analytics = new EmailAnalyticsEngine(fastmail);

// Create MCP server
const server = new Server({
  name: 'fastmail-mcp',
  version: '0.1.0'
}, {
  capabilities: {
    tools: {},
    prompts: {}
  }
});

// Initialize Fastmail client when server starts
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    try {
      await fastmail.initialize();
      initialized = true;
      console.error('Fastmail client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Fastmail client:', error);
      throw error;
    }
  }
}

// Define Zod schemas for requests
const ToolsListRequestSchema = z.object({
  method: z.literal('tools/list')
});

const ToolsCallRequestSchema = z.object({
  method: z.literal('tools/call'),
  params: z.object({
    name: z.string(),
    arguments: z.any().optional()
  })
});

const PromptsListRequestSchema = z.object({
  method: z.literal('prompts/list')
});

const PromptsGetRequestSchema = z.object({
  method: z.literal('prompts/get'),
  params: z.object({
    name: z.string(),
    arguments: z.any().optional()
  })
});

// Tools list handler
server.setRequestHandler(ToolsListRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_mailboxes',
        description: 'List all email folders/mailboxes in your Fastmail account',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      },
      {
        name: 'list_emails',
        description: 'List emails from your Fastmail account with optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            mailboxId: { type: 'string', description: 'ID of the mailbox to list emails from' },
            limit: { type: 'number', description: 'Maximum number of emails to return (default: 50)' },
            isUnread: { type: 'boolean', description: 'Filter for unread emails only' },
            searchText: { type: 'string', description: 'Search for emails containing this text' },
            from: { type: 'string', description: 'Filter emails from this sender' },
            subject: { type: 'string', description: 'Filter emails with this subject' }
          }
        }
      },
      {
        name: 'get_email',
        description: 'Get full details of a specific email including body content',
        inputSchema: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'The ID of the email to retrieve' }
          },
          required: ['emailId']
        }
      },
      {
        name: 'send_email',
        description: 'Send a new email. Supports sending from different identities/aliases when "from" parameter is specified.',
        inputSchema: {
          type: 'object',
          properties: {
            from: { 
              type: 'string', 
              description: 'From email address (must be a valid alias/identity). Optional - if not specified, uses the default account email. Available identities can be found by checking your Fastmail aliases.' 
            },
            to: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email']
              },
              description: 'Recipients'
            },
            cc: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email']
              },
              description: 'CC recipients'
            },
            bcc: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  name: { type: 'string' }
                },
                required: ['email']
              },
              description: 'BCC recipients'
            },
            subject: { type: 'string', description: 'Email subject' },
            textBody: { type: 'string', description: 'Plain text body' },
            htmlBody: { type: 'string', description: 'HTML body' },
            inReplyTo: { type: 'string', description: 'Email ID this is replying to' }
          },
          required: ['to', 'subject']
        }
      },
      {
        name: 'mark_email_read',
        description: 'Mark an email as read or unread',
        inputSchema: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'The ID of the email' },
            read: { type: 'boolean', description: 'True to mark as read, false to mark as unread' }
          },
          required: ['emailId', 'read']
        }
      },
      {
        name: 'move_email',
        description: 'Move an email to a different mailbox/folder',
        inputSchema: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'The ID of the email to move' },
            targetMailboxId: { type: 'string', description: 'The ID of the target mailbox' }
          },
          required: ['emailId', 'targetMailboxId']
        }
      },
      {
        name: 'move_emails',
        description: 'Move multiple emails to a different mailbox/folder',
        inputSchema: {
          type: 'object',
          properties: {
            emailIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Array of email IDs to move' 
            },
            targetMailboxId: { type: 'string', description: 'The ID of the target mailbox' }
          },
          required: ['emailIds', 'targetMailboxId']
        }
      },
      {
        name: 'delete_email',
        description: 'Permanently delete an email',
        inputSchema: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'The ID of the email to delete' }
          },
          required: ['emailId']
        }
      },
      {
        name: 'mark_emails_read',
        description: 'Mark multiple emails as read or unread',
        inputSchema: {
          type: 'object',
          properties: {
            emailIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Array of email IDs to mark as read/unread' 
            },
            read: { type: 'boolean', description: 'True to mark as read, false to mark as unread' }
          },
          required: ['emailIds', 'read']
        }
      },
      {
        name: 'delete_emails',
        description: 'Permanently delete multiple emails',
        inputSchema: {
          type: 'object',
          properties: {
            emailIds: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Array of email IDs to delete' 
            }
          },
          required: ['emailIds']
        }
      },
      {
        name: 'search_emails',
        description: 'Search for emails containing specific text',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Maximum number of results (default: 50)' }
          },
          required: ['query']
        }
      },
      {
        name: 'search_advanced',
        description: 'Advanced JMAP email search with full filtering capabilities. Note: JMAP servers enforce per-query limits - use pagination (limit + position) for large result sets.',
        inputSchema: {
          type: 'object',
          properties: {
            filter: {
              type: 'object',
              description: 'JMAP filter conditions',
              properties: {
                // Mailbox filters
                inMailbox: { type: 'string', description: 'Search in specific mailbox ID' },
                inMailboxOtherThan: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Exclude specific mailbox IDs' 
                },
                
                // Date filters
                before: { type: 'string', description: 'Emails received before this date (ISO format)' },
                after: { type: 'string', description: 'Emails received on/after this date (ISO format)' },
                
                // Size filters
                minSize: { type: 'number', description: 'Minimum email size in bytes' },
                maxSize: { type: 'number', description: 'Maximum email size in bytes' },
                
                // Text search filters
                text: { type: 'string', description: 'Search across all text fields (from, to, cc, bcc, subject, body)' },
                from: { type: 'string', description: 'Search in From field only' },
                to: { type: 'string', description: 'Search in To field only' },
                cc: { type: 'string', description: 'Search in Cc field only' },
                bcc: { type: 'string', description: 'Search in Bcc field only' },
                subject: { type: 'string', description: 'Search in Subject field only' },
                body: { type: 'string', description: 'Search in message body only' },
                
                // Keyword/flag filters
                hasKeyword: { type: 'string', description: 'Email must have this keyword/flag (e.g., $seen, $flagged, $draft)' },
                notKeyword: { type: 'string', description: 'Email must NOT have this keyword/flag' },
                allInThreadHaveKeyword: { type: 'string', description: 'All emails in thread must have this keyword' },
                someInThreadHaveKeyword: { type: 'string', description: 'At least one email in thread has this keyword' },
                noneInThreadHaveKeyword: { type: 'string', description: 'No emails in thread have this keyword' },
                
                // Attachment filter
                hasAttachment: { type: 'boolean', description: 'Filter by attachment presence' },
                
                // Convenience filters
                isUnread: { type: 'boolean', description: 'Filter for unread emails (converted to notKeyword: $seen)' },
                isFlagged: { type: 'boolean', description: 'Filter for flagged emails (converted to hasKeyword: $flagged)' },
                isDraft: { type: 'boolean', description: 'Filter for draft emails (converted to hasKeyword: $draft)' }
              }
            },
            sort: {
              type: 'array',
              description: 'Sort criteria',
              items: {
                type: 'object',
                properties: {
                  property: { 
                    type: 'string', 
                    enum: ['receivedAt', 'from', 'subject', 'size'],
                    description: 'Property to sort by' 
                  },
                  isAscending: { type: 'boolean', description: 'Sort direction (default: false)' }
                },
                required: ['property']
              }
            },
            limit: { type: 'number', description: 'Maximum number of results per query (default: 50, server may enforce lower caps)' },
            position: { type: 'number', description: 'Starting position for pagination - use with limit to retrieve large result sets (default: 0)' }
          }
        }
      },
      // 📊 ANALYTICS TOOLS
      {
        name: 'generate_email_analytics',
        description: 'Generate comprehensive email analytics and insights for a specified period',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default: 30)' },
            maxEmails: { type: 'number', description: 'Maximum number of emails to analyze (default: 1000)' },
            includeContent: { type: 'boolean', description: 'Include content analysis (default: true)' }
          }
        }
      },
      {
        name: 'get_email_volume_stats',
        description: 'Get email volume statistics (sent/received counts) for a period',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default: 30)' }
          }
        }
      },
      {
        name: 'get_top_senders',
        description: 'Get top email senders analysis with counts and percentages',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of top senders to return (default: 10)' },
            days: { type: 'number', description: 'Number of days to analyze (default: 30)' }
          }
        }
      },
      {
        name: 'get_activity_patterns',
        description: 'Get email activity patterns by hour, day, and month',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default: 30)' }
          }
        }
      },
      {
        name: 'generate_email_report',
        description: 'Generate a comprehensive email analytics report with insights and recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default: 30)' }
          }
        }
      }
    ]
  };
});

// Tools call handler
server.setRequestHandler(ToolsCallRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    await ensureInitialized();

    switch (name) {
      case 'list_mailboxes': {
        const mailboxes = await fastmail.getMailboxes();
        
        const formattedMailboxes = mailboxes.map(mb => ({
          id: mb.id,
          name: mb.name,
          role: mb.role,
          totalEmails: mb.totalEmails,
          unreadEmails: mb.unreadEmails,
          path: mb.name
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formattedMailboxes, null, 2)
          }]
        };
      }

      case 'list_emails': {
        const filter: any = {};
        
        if (args.isUnread !== undefined) filter.isUnread = args.isUnread;
        if (args.searchText) filter.text = args.searchText;
        if (args.from) filter.from = args.from;
        if (args.subject) filter.subject = args.subject;
        
        const { emails, total } = await fastmail.getEmails({
          mailboxId: args.mailboxId,
          limit: args.limit || 50,
          filter: Object.keys(filter).length > 0 ? filter : undefined
        });
        
        const formattedEmails = emails.map(email => ({
          id: email.id,
          subject: email.subject || '(no subject)',
          from: email.from?.[0] || { email: 'unknown', name: 'Unknown' },
          to: email.to,
          receivedAt: email.receivedAt,
          preview: email.preview,
          hasAttachment: email.hasAttachment,
          isRead: email.keywords['$seen'] || false,
          isFlagged: email.keywords['$flagged'] || false
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total,
              count: emails.length,
              emails: formattedEmails
            }, null, 2)
          }]
        };
      }

      case 'get_email': {
        const { emailId } = args;
        const email = await fastmail.getEmail(emailId);
        
        if (!email) {
          return {
            content: [{
              type: 'text',
              text: 'Email not found'
            }],
            isError: true
          };
        }
        
        // Extract text body
        let textBody = '';
        if (email.textBody && email.textBody.length > 0 && email.bodyValues) {
          const textPartId = email.textBody[0].partId;
          textBody = email.bodyValues[textPartId]?.value || '';
        }
        
        // Extract HTML body
        let htmlBody = '';
        if (email.htmlBody && email.htmlBody.length > 0 && email.bodyValues) {
          const htmlPartId = email.htmlBody[0].partId;
          htmlBody = email.bodyValues[htmlPartId]?.value || '';
        }
        
        const formattedEmail = {
          id: email.id,
          subject: email.subject || '(no subject)',
          from: email.from?.[0] || { email: 'unknown', name: 'Unknown' },
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          receivedAt: email.receivedAt,
          sentAt: email.sentAt,
          textBody: textBody,
          htmlBody: htmlBody,
          hasAttachment: email.hasAttachment,
          attachments: email.attachments?.map(att => ({
            name: att.name,
            type: att.type,
            size: att.size,
            blobId: att.blobId
          })),
          isRead: email.keywords['$seen'] || false,
          isFlagged: email.keywords['$flagged'] || false,
          threadId: email.threadId
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(formattedEmail, null, 2)
          }]
        };
      }

      case 'send_email': {
        if (!args.textBody && !args.htmlBody) {
          return {
            content: [{
              type: 'text',
              text: 'Error: Must provide either textBody or htmlBody'
            }],
            isError: true
          };
        }
        
        const result = await fastmail.sendEmail(args);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              emailId: result.emailId,
              sentAt: result.sentAt
            }, null, 2)
          }]
        };
      }

      case 'mark_email_read': {
        const { emailId, read } = args;
        await fastmail.markAsRead(emailId, read);
        
        return {
          content: [{
            type: 'text',
            text: `Email marked as ${read ? 'read' : 'unread'}`
          }]
        };
      }

      case 'move_email': {
        const { emailId, targetMailboxId } = args;
        await fastmail.moveEmail(emailId, targetMailboxId);
        
        return {
          content: [{
            type: 'text',
            text: 'Email moved successfully'
          }]
        };
      }

      case 'move_emails': {
        const { emailIds, targetMailboxId } = args;
        const result = await fastmail.moveEmails(emailIds, targetMailboxId);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case 'delete_email': {
        const { emailId } = args;
        await fastmail.deleteEmail(emailId);
        
        return {
          content: [{
            type: 'text',
            text: 'Email deleted successfully'
          }]
        };
      }

      case 'mark_emails_read': {
        const { emailIds, read } = args;
        
        if (!Array.isArray(emailIds) || emailIds.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Error: emailIds must be a non-empty array'
            }],
            isError: true
          };
        }

        const results = await fastmail.markEmailsAsRead(emailIds, read);
        
        const summary = {
          total: emailIds.length,
          successful: results.success.length,
          failed: results.failed.length,
          successfulIds: results.success,
          failedDetails: results.failed
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(summary, null, 2)
          }]
        };
      }

      case 'delete_emails': {
        const { emailIds } = args;
        
        if (!Array.isArray(emailIds) || emailIds.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'Error: emailIds must be a non-empty array'
            }],
            isError: true
          };
        }

        const results = await fastmail.deleteEmails(emailIds);
        
        const summary = {
          total: emailIds.length,
          successful: results.success.length,
          failed: results.failed.length,
          successfulIds: results.success,
          failedDetails: results.failed
        };
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(summary, null, 2)
          }]
        };
      }

      case 'search_emails': {
        const { query, limit } = args;
        const { emails, total } = await fastmail.searchEmails(query, limit);
        
        const formattedEmails = emails.map(email => ({
          id: email.id,
          subject: email.subject || '(no subject)',
          from: email.from?.[0] || { email: 'unknown', name: 'Unknown' },
          receivedAt: email.receivedAt,
          preview: email.preview,
          isRead: email.keywords['$seen'] || false
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total,
              count: emails.length,
              query,
              emails: formattedEmails
            }, null, 2)
          }]
        };
      }

      case 'search_advanced': {
        const { filter = {}, sort, limit, position } = args;
        
        const { emails, total } = await fastmail.searchJMAP({
          filter,
          sort,
          limit,
          position
        });
        
        const formattedEmails = emails.map(email => ({
          id: email.id,
          subject: email.subject || '(no subject)',
          from: email.from?.[0] || { email: 'unknown', name: 'Unknown' },
          to: email.to || [],
          cc: email.cc || [],
          bcc: email.bcc || [],
          receivedAt: email.receivedAt,
          size: email.size,
          preview: email.preview,
          hasAttachment: email.hasAttachment || false,
          isRead: email.keywords['$seen'] || false,
          isFlagged: email.keywords['$flagged'] || false,
          isDraft: email.keywords['$draft'] || false,
          keywords: email.keywords || {},
          mailboxIds: email.mailboxIds || []
        }));
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              total,
              count: emails.length,
              requestedLimit: limit || 50,
              actualLimit: emails.length,
              position: position || 0,
              hasMoreResults: emails.length === (limit || 50),
              paginationNote: emails.length === (limit || 50) ? "Results equal requested limit - may indicate more data available. Use position parameter to paginate." : null,
              filter,
              sort,
              emails: formattedEmails
            }, null, 2)
          }]
        };
      }

      // 📊 ANALYTICS TOOLS HANDLERS
      case 'generate_email_analytics': {
        const { days = 30, maxEmails = 1000, includeContent = true } = args;
        
        const analyticsData = await analytics.generateAnalytics({
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          maxEmails,
          includeContent
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analyticsData, null, 2)
          }]
        };
      }

      case 'get_email_volume_stats': {
        const { days = 30 } = args;
        const volumeStats = await analytics.getVolumeAnalytics(days);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(volumeStats, null, 2)
          }]
        };
      }

      case 'get_top_senders': {
        const { limit = 10, days = 30 } = args;
        const topSenders = await analytics.getTopSenders(limit, days);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(topSenders, null, 2)
          }]
        };
      }

      case 'get_activity_patterns': {
        const { days = 30 } = args;
        const patterns = await analytics.getActivityPatterns(days);
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(patterns, null, 2)
          }]
        };
      }

      case 'generate_email_report': {
        const { days = 30 } = args;
        const report = await analytics.generateEmailReport(days);
        
        return {
          content: [{
            type: 'text',
            text: report
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});

// Prompts list handler
server.setRequestHandler(PromptsListRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'inbox_summary',
        description: 'Get a summary of unread emails in the inbox'
      },
      {
        name: 'compose_reply',
        description: 'Compose a reply to an email',
        arguments: [
          {
            name: 'emailId',
            description: 'ID of the email to reply to',
            required: true
          },
          {
            name: 'tone',
            description: 'Tone of the reply',
            required: true
          }
        ]
      }
    ]
  };
});

// Prompts get handler
server.setRequestHandler(PromptsGetRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  switch (name) {
    case 'inbox_summary':
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: 'Please give me a summary of my unread emails in the inbox. List the sender, subject, and a brief preview for each.'
          }
        }]
      };

    case 'compose_reply': {
      const { emailId, tone } = args;
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me compose a ${tone} reply to the email with ID ${emailId}. First, get the email details to understand the context, then draft an appropriate response.`
          }
        }]
      };
    }

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Start the server
async function main() {
  console.error('Starting Fastmail MCP Server...');
  console.error('Email:', email);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Fastmail MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
