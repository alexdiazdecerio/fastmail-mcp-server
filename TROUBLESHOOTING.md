
### Development Guidelines

#### Safe Email Sending Pattern
```javascript
async function safeSendEmail(emailData) {
  let attempt = 0;
  const maxAttempts = 2;
  
  while (attempt < maxAttempts) {
    try {
      const result = await send_email(emailData);
      
      // Verify email exists
      await get_email(result.emailId);
      return result;
      
    } catch (error) {
      attempt++;
      
      // If threading failed, retry without inReplyTo
      if (attempt === 1 && emailData.inReplyTo) {
        console.warn("Retrying without threading");
        const { inReplyTo, ...retryData } = emailData;
        emailData = retryData;
      } else {
        throw error;
      }
    }
  }
}
```

#### Testing Threading Issues
```javascript
// Test pattern for reply functionality
async function testThreading() {
  // Send initial email
  const initial = await send_email({
    to: [{email: "test@example.com"}],
    subject: "Test Thread",
    textBody: "Initial message"
  });
  
  // Try to reply (may fail silently)
  const reply = await send_email({
    to: [{email: "test@example.com"}],
    subject: "Re: Test Thread",
    textBody: "Reply message",
    inReplyTo: initial.emailId
  });
  
  // Verify reply exists
  try {
    await get_email(reply.emailId);
    console.log("Threading works");
  } catch (error) {
    console.error("Threading failed");
  }
}
```

## 📞 Getting Help

### Before Reporting Issues
1. Check this troubleshooting guide
2. Verify your setup against the installation docs
3. Test with minimal reproduction case
4. Collect relevant logs and error messages

### Issue Reporting
- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and community support
- **Email**: For security-related issues

### Information to Include
- Fastmail MCP Server version
- Node.js version
- Operating system
- Configuration (sanitized)
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs

---

*Last updated: June 22, 2025*
*Version: 1.1.0*