import fetch from 'node-fetch';

interface JMAPSession {
  accounts: Record<string, {
    name: string;
    isPersonal: boolean;
    isReadOnly: boolean;
    accountCapabilities: Record<string, any>;
  }>;
  primaryAccounts: Record<string, string>;
  username: string;
  apiUrl: string;
  downloadUrl: string;
  uploadUrl: string;
  eventSourceUrl: string;
  state: string;
}

interface JMAPRequest {
  using: string[];
  methodCalls: Array<[string, any, string]>;
}

interface JMAPResponse {
  methodResponses: Array<[string, any, string]>;
  sessionState?: string;
}

interface Email {
  id: string;
  blobId: string;
  threadId: string;
  mailboxIds: Record<string, boolean>;
  keywords: Record<string, boolean>;
  size: number;
  receivedAt: string;
  subject?: string;
  from?: Array<{ email: string; name?: string }>;
  to?: Array<{ email: string; name?: string }>;
  cc?: Array<{ email: string; name?: string }>;
  bcc?: Array<{ email: string; name?: string }>;
  replyTo?: Array<{ email: string; name?: string }>;
  sentAt?: string;
  hasAttachment: boolean;
  preview: string;
  bodyValues?: Record<string, { value: string; isEncodingProblem: boolean }>;
  textBody?: Array<{ partId: string; type: string }>;
  htmlBody?: Array<{ partId: string; type: string }>;
  attachments?: Array<{
    partId: string;
    blobId: string;
    size: number;
    name?: string;
    type: string;
    disposition?: string;
  }>;
}

interface Mailbox {
  id: string;
  name: string;
  parentId?: string;
  role?: string;
  sortOrder: number;
  totalEmails: number;
  unreadEmails: number;
  totalThreads: number;
  unreadThreads: number;
  myRights: {
    mayReadItems: boolean;
    mayAddItems: boolean;
    mayRemoveItems: boolean;
    maySetSeen: boolean;
    maySetKeywords: boolean;
    mayCreateChild: boolean;
    mayRename: boolean;
    mayDelete: boolean;
    maySubmit: boolean;
  };
  isSubscribed: boolean;
}

export class FastmailClient {
  private session: JMAPSession | null = null;
  private accountId: string | null = null;

  constructor(
    private email: string,
    private apiToken: string
  ) {}

  async initialize(): Promise<void> {
    console.error('🚀 FASTMAIL CLIENT INITIALIZE - VERSION NUEVA CON LOGS');
    
    // Get session
    const sessionResponse = await fetch('https://api.fastmail.com/jmap/session', {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to get session: ${sessionResponse.statusText}`);
    }

    this.session = await sessionResponse.json() as JMAPSession;
    
    // Get primary account ID
    this.accountId = this.session.primaryAccounts['urn:ietf:params:jmap:mail'];
    
    if (!this.accountId) {
      throw new Error('No primary mail account found');
    }
  }

  private async makeRequest(request: JMAPRequest): Promise<JMAPResponse> {
    if (!this.session) {
      throw new Error('Client not initialized. Call initialize() first.');
    }

    const response = await fetch(this.session.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`JMAP request failed: ${response.statusText}`);
    }

    return await response.json() as JMAPResponse;
  }

  async getMailboxes(): Promise<Mailbox[]> {
    const response = await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Mailbox/get', {
          accountId: this.accountId,
          ids: null
        }, '0']
      ]
    });

    const [, result] = response.methodResponses[0];
    return result.list;
  }

  async getEmails(options: {
    mailboxId?: string;
    limit?: number;
    position?: number;
    filter?: {
      text?: string;
      from?: string;
      to?: string;
      subject?: string;
      after?: string;
      before?: string;
      hasAttachment?: boolean;
      isUnread?: boolean;
    };
  } = {}): Promise<{ emails: Email[]; total: number }> {
    // Build filter
    const filter: any = {};
    
    if (options.mailboxId) {
      filter.inMailbox = options.mailboxId;
    }
    
    if (options.filter) {
      Object.assign(filter, options.filter);
      
      // Convert isUnread to notKeyword
      if ('isUnread' in options.filter) {
        if (options.filter.isUnread) {
          filter.notKeyword = '$seen';
        } else {
          filter.hasKeyword = '$seen';
        }
        delete filter.isUnread;
      }
    }

    // First, query for email IDs
    const queryResponse = await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/query', {
          accountId: this.accountId,
          filter,
          sort: [{ property: 'receivedAt', isAscending: false }],
          limit: options.limit || 50,
          position: options.position || 0
        }, '0']
      ]
    });

    const [, queryResult] = queryResponse.methodResponses[0];
    const emailIds = queryResult.ids;
    const total = queryResult.total;

    if (emailIds.length === 0) {
      return { emails: [], total: 0 };
    }

    // Then, get the email details
    const getResponse = await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/get', {
          accountId: this.accountId,
          ids: emailIds,
          properties: [
            'id', 'blobId', 'threadId', 'mailboxIds', 'keywords',
            'size', 'receivedAt', 'subject', 'from', 'to', 'cc', 'bcc',
            'replyTo', 'sentAt', 'hasAttachment', 'preview',
            'bodyValues', 'textBody', 'htmlBody', 'attachments'
          ],
          fetchTextBodyValues: true,
          fetchHTMLBodyValues: true,
          maxBodyValueBytes: 256
        }, '1']
      ]
    });

    const [, getResult] = getResponse.methodResponses[0];
    return { emails: getResult.list, total };
  }

  async getEmail(emailId: string): Promise<Email | null> {
    const response = await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/get', {
          accountId: this.accountId,
          ids: [emailId],
          properties: null, // Get all properties
          fetchTextBodyValues: true,
          fetchHTMLBodyValues: true,
          maxBodyValueBytes: 100000 // Get more body content
        }, '0']
      ]
    });

    const [, result] = response.methodResponses[0];
    return result.list[0] || null;
  }

  async sendEmail(options: {
    from?: string;
    to: Array<{ email: string; name?: string }>;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    subject: string;
    textBody?: string;
    htmlBody?: string;
    attachments?: Array<{
      blobId: string;
      name: string;
      type: string;
    }>;
    inReplyTo?: string;
    references?: string[];
  }): Promise<{ emailId: string; sentAt: string }> {
    
    try {
      // Get the drafts mailbox ID
      const draftsMailboxId = await this.getDraftsMailbox();
      
      // Get the identity for the specified from address
      const identityId = await this.getIdentityByEmail(options.from || this.email);
    
    // Create email draft
    const bodyParts: any[] = [];
    
    if (options.textBody) {
      bodyParts.push({
        type: 'text/plain',
        value: options.textBody
      });
    }
    
    if (options.htmlBody) {
      bodyParts.push({
        type: 'text/html',
        value: options.htmlBody
      });
    }

    const fromEmail = options.from || this.email;
    const email: any = {
      from: [{ email: fromEmail }],
      to: options.to,
      subject: options.subject,
      keywords: { '$draft': true },
      mailboxIds: { [draftsMailboxId]: true }, // Place in drafts mailbox
      bodyValues: {},
      textBody: [],
      htmlBody: [],
      attachments: options.attachments || []
    };

    if (options.cc) email.cc = options.cc;
    if (options.bcc) email.bcc = options.bcc;
    if (options.inReplyTo) email.inReplyTo = options.inReplyTo;
    if (options.references) email.references = options.references;

    // Add body parts
    bodyParts.forEach((part, index) => {
      const partId = `part${index}`;
      email.bodyValues[partId] = {
        value: part.value,
        charset: 'utf-8'
      };
      
      if (part.type === 'text/plain') {
        email.textBody.push({ partId, type: 'text/plain' });
      } else if (part.type === 'text/html') {
        email.htmlBody.push({ partId, type: 'text/html' });
      }
    });
    
    // Only include htmlBody if we actually have HTML content
    if (email.htmlBody.length === 0) {
      delete email.htmlBody;
    }

    // Create draft and send
    const response = await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail', 'urn:ietf:params:jmap:submission'],
      methodCalls: [
        // Create email draft
        ['Email/set', {
          accountId: this.accountId,
          create: {
            'draft': email
          }
        }, '0'],
        // Send the email
        ['EmailSubmission/set', {
          accountId: this.accountId,
          onSuccessDestroyEmail: ['#sendIt'],
          create: {
            'sendIt': {
              emailId: '#draft',
              identityId: identityId,
              envelope: {
                mailFrom: { email: fromEmail },
                rcptTo: [
                  ...options.to.map(t => ({ email: t.email })),
                  ...(options.cc || []).map(t => ({ email: t.email })),
                  ...(options.bcc || []).map(t => ({ email: t.email }))
                ]
              }
            }
          }
        }, '1']
      ]
    });

    // Check if we have the correct number of method responses
    if (!response.methodResponses || response.methodResponses.length < 2) {
      console.error('❌ Invalid JMAP response structure:', response);
      throw new Error(`Invalid JMAP response: expected at least 2 method responses, got ${response.methodResponses?.length || 0}`);
    }

    const [, createResult] = response.methodResponses[0];
    const [, sendResult] = response.methodResponses[1];
    
    // Enhanced error checking for draft creation
    if (!createResult) {
      console.error('❌ No create result received');
      throw new Error('No create result received from JMAP server');
    }
    
    if (createResult.notCreated) {
      console.error('❌ Draft creation failed:', createResult.notCreated);
      throw new Error(`Failed to create draft: ${JSON.stringify(createResult.notCreated)}`);
    }
    
    if (!createResult.created || !createResult.created.draft) {
      console.error('❌ Draft not created properly:', createResult);
      throw new Error(`Failed to create draft: ${JSON.stringify(createResult)}`);
    }
    
    const draftId = createResult.created.draft.id;
    
    // Enhanced error checking for email submission
    if (!sendResult) {
      console.error('❌ No send result received');
      throw new Error('No send result received from JMAP server');
    }
    
    if (sendResult.notCreated) {
      console.error('❌ Email submission failed:', sendResult.notCreated);
      throw new Error(`Failed to send email: ${JSON.stringify(sendResult.notCreated)}`);
    }
    
    if (!sendResult.created || !sendResult.created.sendIt) {
      console.error('❌ Email submission not created properly:', sendResult);
      throw new Error(`Failed to send email: ${JSON.stringify(sendResult)}`);
    }
    
    const sentAt = sendResult.created.sendIt.sendAt;
    
    return { emailId: draftId, sentAt };
    } catch (error) {
      console.error('❌ CRITICAL ERROR in sendEmail operation:');
      console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('  - Error message:', error instanceof Error ? error.message : String(error));
      console.error('  - Parameters that failed:');
      console.error('    - From:', options.from || this.email);
      console.error('    - To:', JSON.stringify(options.to));
      console.error('    - Subject:', options.subject);
      console.error('    - Has text body:', !!options.textBody);
      console.error('    - Has HTML body:', !!options.htmlBody);
      
      if (error instanceof Error && error.stack) {
        console.error('  - Stack trace:', error.stack);
      }
      
      // Re-throw with additional context
      const enhancedError = new Error(`SendEmail failed: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error) {
        enhancedError.stack = error.stack;
      }
      throw enhancedError;
    }
  }

  async markAsRead(emailId: string, read: boolean = true): Promise<void> {
    await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/set', {
          accountId: this.accountId,
          update: {
            [emailId]: {
              [`keywords/$seen`]: read
            }
          }
        }, '0']
      ]
    });
  }

  async moveEmail(emailId: string, targetMailboxId: string): Promise<void> {
    // First get current mailboxes
    const email = await this.getEmail(emailId);
    if (!email) {
      throw new Error('Email not found');
    }

    // Create new mailboxIds with only the target
    const newMailboxIds = { [targetMailboxId]: true };

    await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/set', {
          accountId: this.accountId,
          update: {
            [emailId]: {
              mailboxIds: newMailboxIds
            }
          }
        }, '0']
      ]
    });
  }

  async deleteEmail(emailId: string): Promise<void> {
    await this.makeRequest({
      using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
      methodCalls: [
        ['Email/set', {
          accountId: this.accountId,
          destroy: [emailId]
        }, '0']
      ]
    });
  }

  async deleteEmails(emailIds: string[]): Promise<{ success: string[]; failed: Array<{ emailId: string; error: string }> }> {
    const results = {
      success: [] as string[],
      failed: [] as Array<{ emailId: string; error: string }>
    };

    // Process emails in batches for better performance and error handling
    for (const emailId of emailIds) {
      try {
        await this.deleteEmail(emailId);
        results.success.push(emailId);
      } catch (error) {
        results.failed.push({
          emailId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return results;
  }

  async searchEmails(query: string, limit: number = 50): Promise<{ emails: Email[]; total: number }> {
    return this.getEmails({
      filter: { text: query },
      limit
    });
  }

  private async getDraftsMailbox(): Promise<string> {
    try {
      const mailboxes = await this.getMailboxes();
      const draftsMailbox = mailboxes.find(mb => mb.role === 'drafts');
      
      if (!draftsMailbox) {
        throw new Error('Drafts mailbox not found');
      }
      
      return draftsMailbox.id;
    } catch (error) {
      console.error('❌ Error en getDraftsMailbox:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async getIdentityByEmail(emailAddress: string): Promise<string> {
    try {
      const response = await this.makeRequest({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:submission'],
        methodCalls: [
          ['Identity/get', {
            accountId: this.accountId,
            ids: null
          }, '0']
        ]
      });
      
      const [, result] = response.methodResponses[0];
      
      if (!result.list || result.list.length === 0) {
        throw new Error('No identities found');
      }
      
      // Find identity that matches the email address
      const identity = result.list.find((id: any) => id.email === emailAddress);
      
      if (!identity) {
        console.error(`❌ No identity found for email address: ${emailAddress}`);
        console.error('Available identities:', result.list.map((id: any) => id.email));
        throw new Error(`No identity found for email address: ${emailAddress}`);
      }
      
      return identity.id;
    } catch (error) {
      console.error('❌ Error en getIdentityByEmail:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private async getPrimaryIdentity(): Promise<string> {
    try {
      const response = await this.makeRequest({
        using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:submission'],
        methodCalls: [
          ['Identity/get', {
            accountId: this.accountId,
            ids: null
          }, '0']
        ]
      });
      
      const [, result] = response.methodResponses[0];
      
      // Use the first identity (usually the primary one)
      if (!result.list || result.list.length === 0) {
        throw new Error('No identities found');
      }
      
      return result.list[0].id;
    } catch (error) {
      console.error('❌ Error en getPrimaryIdentity:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
