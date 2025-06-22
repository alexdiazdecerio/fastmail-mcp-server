#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import { FastmailClient } from './fastmail-client.js';

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
        description: 'Send a new email',
        inputSchema: {
          type: 'object',
          properties: {
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
