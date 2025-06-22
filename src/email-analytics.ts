import { FastmailClient } from './fastmail-client.js';

export interface EmailAnalytics {
  // Volume Analytics
  emailVolume: {
    totalEmails: number;
    sentEmails: number;
    receivedEmails: number;
    periodStart: string;
    periodEnd: string;
  };
  
  // Sender Analytics  
  topSenders: Array<{
    email: string;
    name?: string;
    count: number;
    percentage: number;
  }>;
  
  // Temporal Analytics
  activityPatterns: {
    byHour: Array<{ hour: number; count: number }>;
    byDay: Array<{ day: string; count: number }>;
    byMonth: Array<{ month: string; count: number }>;
  };
  
  // Folder Analytics
  folderUsage: Array<{
    folderName: string;
    emailCount: number;
    percentage: number;
  }>;
  
  // Content Analytics
  contentInsights: {
    averageEmailLength: number;
    totalAttachments: number;
    commonKeywords: Array<{ word: string; frequency: number }>;
    subjectAnalysis: Array<{ pattern: string; count: number }>;
  };
  
  // Response Analytics
  responseMetrics: {
    averageResponseTime: number; // in hours
    unreadCount: number;
    unreadPercentage: number;
    oldestUnread?: string;
  };
}

export class EmailAnalyticsEngine {
  private fastmailClient: FastmailClient;
  
  constructor(fastmailClient: FastmailClient) {
    this.fastmailClient = fastmailClient;
  }
  
  /**
   * Generate comprehensive email analytics for a given period
   */
  async generateAnalytics(
    options: {
      startDate?: string;
      endDate?: string;
      maxEmails?: number;
      includeContent?: boolean;
    } = {}
  ): Promise<EmailAnalytics> {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      endDate = new Date().toISOString(),
      maxEmails = 1000,
      includeContent = true
    } = options;
    
    console.error(`Generating analytics from ${startDate} to ${endDate}`);
    
    // Get all emails in the period
    const emails = await this.getEmailsInPeriod(startDate, endDate, maxEmails);
    
    console.error(`Analyzing ${emails.length} emails...`);
    
    // Generate analytics
    const analytics: EmailAnalytics = {
      emailVolume: this.calculateVolumeAnalytics(emails, startDate, endDate),
      topSenders: this.calculateSenderAnalytics(emails),
      activityPatterns: this.calculateTemporalAnalytics(emails),
      folderUsage: await this.calculateFolderAnalytics(emails),
      contentInsights: includeContent ? this.calculateContentAnalytics(emails) : {
        averageEmailLength: 0,
        totalAttachments: 0,
        commonKeywords: [],
        subjectAnalysis: []
      },
      responseMetrics: this.calculateResponseMetrics(emails)
    };
    
    return analytics;
  }
  
  /**
   * Get volume analytics for the specified period
   */
  async getVolumeAnalytics(days: number = 30): Promise<EmailAnalytics['emailVolume']> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const emails = await this.getEmailsInPeriod(startDate, endDate, 1000);
    return this.calculateVolumeAnalytics(emails, startDate, endDate);
  }
  
  /**
   * Get top senders analytics
   */
  async getTopSenders(limit: number = 10, days: number = 30): Promise<EmailAnalytics['topSenders']> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const emails = await this.getEmailsInPeriod(startDate, endDate, 1000);
    return this.calculateSenderAnalytics(emails).slice(0, limit);
  }
  /**
   * Get activity patterns for visualization
   */
  async getActivityPatterns(days: number = 30): Promise<EmailAnalytics['activityPatterns']> {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const emails = await this.getEmailsInPeriod(startDate, endDate, 1000);
    return this.calculateTemporalAnalytics(emails);
  }
  
  /**
   * Generate a comprehensive email report
   */
  async generateEmailReport(days: number = 30): Promise<string> {
    const analytics = await this.generateAnalytics({
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      maxEmails: 1000,
      includeContent: true
    });
    
    return this.formatAnalyticsReport(analytics, days);
  }
  
  // Private helper methods
  
  private async getEmailsInPeriod(startDate: string, endDate: string, maxEmails: number) {
    const emails = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    try {
      // Get emails from inbox and sent folders
      const inboxEmails = await this.fastmailClient.getEmails({
        limit: Math.floor(maxEmails / 2),
        filter: {
          after: start.toISOString()
        }
      });
      
      // For sent emails, we'll try to find a sent folder
      // This is a simplified approach - in a real implementation you'd get the Sent mailbox ID
      const sentEmails = await this.fastmailClient.getEmails({
        limit: Math.floor(maxEmails / 2),
        filter: {
          after: start.toISOString()
        }
      });
      
      // Combine all emails
      const allEmails = [...inboxEmails.emails, ...sentEmails.emails];
      
      // Filter by date range
      return allEmails.filter(email => {
        const receivedDate = new Date(email.receivedAt);
        return receivedDate >= start && receivedDate <= end;
      });
      
    } catch (error) {
      console.error('Error fetching emails for analytics:', error);
      return [];
    }
  }
  
  private calculateVolumeAnalytics(emails: any[], startDate: string, endDate: string): EmailAnalytics['emailVolume'] {
    const userEmail = process.env.FASTMAIL_EMAIL?.toLowerCase();
    
    const sentEmails = emails.filter(email => 
      email.from?.email?.toLowerCase() === userEmail
    );
    
    const receivedEmails = emails.filter(email => 
      email.from?.email?.toLowerCase() !== userEmail
    );
    
    return {
      totalEmails: emails.length,
      sentEmails: sentEmails.length,
      receivedEmails: receivedEmails.length,
      periodStart: startDate,
      periodEnd: endDate
    };
  }
  
  private calculateSenderAnalytics(emails: any[]): EmailAnalytics['topSenders'] {
    const userEmail = process.env.FASTMAIL_EMAIL?.toLowerCase();
    const senderCounts = new Map<string, { name?: string; count: number }>();
    
    // Only count received emails (not sent)
    const receivedEmails = emails.filter(email => 
      email.from?.email?.toLowerCase() !== userEmail
    );
    
    receivedEmails.forEach(email => {
      if (email.from?.email) {
        const senderEmail = email.from.email.toLowerCase();
        const existing = senderCounts.get(senderEmail);
        
        if (existing) {
          existing.count++;
        } else {
          senderCounts.set(senderEmail, {
            name: email.from.name,
            count: 1
          });
        }
      }
    });
    
    const totalReceived = receivedEmails.length;
    const topSenders = Array.from(senderCounts.entries())
      .map(([email, data]) => ({
        email,
        name: data.name,
        count: data.count,
        percentage: Math.round((data.count / totalReceived) * 100 * 100) / 100
      }))
      .sort((a, b) => b.count - a.count);
    
    return topSenders;
  }
  
  private calculateTemporalAnalytics(emails: any[]): EmailAnalytics['activityPatterns'] {
    const hourCounts = new Array(24).fill(0);
    const dayCounts: { [key: string]: number } = {};
    const monthCounts: { [key: string]: number } = {};
    
    emails.forEach(email => {
      const date = new Date(email.receivedAt);
      
      // Hour analysis
      hourCounts[date.getHours()]++;
      
      // Day analysis  
      const dayKey = date.toISOString().split('T')[0];
      dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
      
      // Month analysis
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    });
    
    return {
      byHour: hourCounts.map((count, hour) => ({ hour, count })),
      byDay: Object.entries(dayCounts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      byMonth: Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
    };
  }
  private async calculateFolderAnalytics(emails: any[]): Promise<EmailAnalytics['folderUsage']> {
    const folderCounts = new Map<string, number>();
    
    try {
      // Get all mailboxes to map IDs to names
      const mailboxes = await this.fastmailClient.getMailboxes();
      const mailboxMap = new Map<string, string>();
      
      mailboxes?.forEach((mailbox: any) => {
        mailboxMap.set(mailbox.id, mailbox.name);
      });
      
      // Count emails per folder
      emails.forEach(email => {
        if (email.mailboxIds) {
          Object.keys(email.mailboxIds).forEach(mailboxId => {
            const folderName = mailboxMap.get(mailboxId) || mailboxId;
            folderCounts.set(folderName, (folderCounts.get(folderName) || 0) + 1);
          });
        }
      });
      
      const totalEmails = emails.length;
      return Array.from(folderCounts.entries())
        .map(([folderName, emailCount]) => ({
          folderName,
          emailCount,
          percentage: Math.round((emailCount / totalEmails) * 100 * 100) / 100
        }))
        .sort((a, b) => b.emailCount - a.emailCount);
        
    } catch (error) {
      console.error('Error calculating folder analytics:', error);
      return [];
    }
  }
  
  private calculateContentAnalytics(emails: any[]): EmailAnalytics['contentInsights'] {
    let totalLength = 0;
    let totalAttachments = 0;
    const wordFrequency = new Map<string, number>();
    const subjectPatterns = new Map<string, number>();
    
    emails.forEach(email => {
      // Calculate email length
      if (email.preview) {
        totalLength += email.preview.length;
      }
      
      // Count attachments
      if (email.hasAttachment) {
        totalAttachments++;
      }
      
      // Analyze subject for patterns
      if (email.subject) {
        const subject = email.subject.toLowerCase();
        
        // Check for common patterns
        if (subject.includes('re:')) {
          subjectPatterns.set('Replies (Re:)', (subjectPatterns.get('Replies (Re:)') || 0) + 1);
        }
        if (subject.includes('fwd:') || subject.includes('fw:')) {
          subjectPatterns.set('Forwards (Fwd:)', (subjectPatterns.get('Forwards (Fwd:)') || 0) + 1);
        }
        if (subject.includes('newsletter') || subject.includes('unsubscribe')) {
          subjectPatterns.set('Newsletters', (subjectPatterns.get('Newsletters') || 0) + 1);
        }
        if (subject.includes('invoice') || subject.includes('payment') || subject.includes('bill')) {
          subjectPatterns.set('Financial', (subjectPatterns.get('Financial') || 0) + 1);
        }
        if (subject.includes('meeting') || subject.includes('calendar')) {
          subjectPatterns.set('Meetings/Calendar', (subjectPatterns.get('Meetings/Calendar') || 0) + 1);
        }
        
        // Extract keywords (simple implementation)
        const words = subject.split(/\s+/).filter((word: string) => 
          word.length > 3 && 
          !['from', 'with', 'your', 'this', 'that', 'have', 'will', 'been', 'were'].includes(word)
        );
        
        words.forEach((word: string) => {
          const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
          if (cleanWord.length > 3) {
            wordFrequency.set(cleanWord, (wordFrequency.get(cleanWord) || 0) + 1);
          }
        });
      }
    });
    
    // Get top keywords
    const topKeywords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, frequency]) => ({ word, frequency }));
      
    // Get subject patterns
    const topSubjectPatterns = Array.from(subjectPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pattern, count]) => ({ pattern, count }));
    
    return {
      averageEmailLength: emails.length > 0 ? Math.round(totalLength / emails.length) : 0,
      totalAttachments,
      commonKeywords: topKeywords,
      subjectAnalysis: topSubjectPatterns
    };
  }
  
  private calculateResponseMetrics(emails: any[]): EmailAnalytics['responseMetrics'] {
    const userEmail = process.env.FASTMAIL_EMAIL?.toLowerCase();
    
    // Count unread emails
    const unreadEmails = emails.filter(email => 
      !email.isRead && email.from?.email?.toLowerCase() !== userEmail
    );
    
    // Find oldest unread email
    const oldestUnread = unreadEmails.length > 0 
      ? unreadEmails.reduce((oldest, email) => 
          new Date(email.receivedAt) < new Date(oldest.receivedAt) ? email : oldest
        )
      : null;
    
    // Calculate average response time (simplified - would need thread analysis for accuracy)
    const receivedEmails = emails.filter(email => 
      email.from?.email?.toLowerCase() !== userEmail
    );
    
    const totalEmails = receivedEmails.length;
    const unreadCount = unreadEmails.length;
    
    return {
      averageResponseTime: 0, // Would need thread analysis to calculate properly
      unreadCount,
      unreadPercentage: totalEmails > 0 ? Math.round((unreadCount / totalEmails) * 100 * 100) / 100 : 0,
      oldestUnread: oldestUnread?.receivedAt
    };
  }
  
  private formatAnalyticsReport(analytics: EmailAnalytics, days: number): string {
    const report = `
📊 EMAIL ANALYTICS REPORT (Last ${days} days)
${'='.repeat(50)}

📈 VOLUME SUMMARY
• Total Emails: ${analytics.emailVolume.totalEmails}
• Sent: ${analytics.emailVolume.sentEmails}
• Received: ${analytics.emailVolume.receivedEmails}
• Daily Average: ${Math.round(analytics.emailVolume.totalEmails / days)} emails/day

👥 TOP SENDERS
${analytics.topSenders.slice(0, 5).map((sender, i) => 
  `${i + 1}. ${sender.name || sender.email} (${sender.count} emails, ${sender.percentage}%)`
).join('\n')}

⏰ PEAK ACTIVITY HOURS
${analytics.activityPatterns.byHour
  .map((hour, i) => ({ hour: i, count: hour.count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 3)
  .map((h, i) => `${i + 1}. ${h.hour}:00 - ${h.hour + 1}:00 (${h.count} emails)`)
  .join('\n')}

📁 FOLDER USAGE
${analytics.folderUsage.slice(0, 5).map((folder, i) => 
  `${i + 1}. ${folder.folderName}: ${folder.emailCount} emails (${folder.percentage}%)`
).join('\n')}

📝 CONTENT INSIGHTS
• Average Email Length: ${analytics.contentInsights.averageEmailLength} characters
• Total Attachments: ${analytics.contentInsights.totalAttachments}
• Top Keywords: ${analytics.contentInsights.commonKeywords.slice(0, 3).map(k => k.word).join(', ')}

⚡ PRODUCTIVITY METRICS
• Unread Emails: ${analytics.responseMetrics.unreadCount}
• Unread Percentage: ${analytics.responseMetrics.unreadPercentage}%
${analytics.responseMetrics.oldestUnread ? `• Oldest Unread: ${new Date(analytics.responseMetrics.oldestUnread).toLocaleDateString()}` : ''}

🎯 RECOMMENDATIONS
${this.generateRecommendations(analytics)}
`;
    
    return report.trim();
  }
  
  private generateRecommendations(analytics: EmailAnalytics): string {
    const recommendations = [];
    
    if (analytics.responseMetrics.unreadPercentage > 20) {
      recommendations.push("• Consider setting aside specific times for email processing");
    }
    
    if (analytics.topSenders.length > 0 && analytics.topSenders[0].percentage > 30) {
      recommendations.push(`• ${analytics.topSenders[0].name || analytics.topSenders[0].email} sends 30%+ of your emails - consider filters`);
    }
    
    if (analytics.contentInsights.totalAttachments > analytics.emailVolume.totalEmails * 0.5) {
      recommendations.push("• High attachment volume - consider cloud storage integration");
    }
    
    const peakHour = analytics.activityPatterns.byHour.reduce((max, hour, i) => 
      hour.count > analytics.activityPatterns.byHour[max].count ? i : max, 0
    );
    
    if (peakHour < 9 || peakHour > 17) {
      recommendations.push("• Most emails arrive outside business hours - consider notification schedules");
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : "• Your email management looks healthy!";
  }
}
