---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''

---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Expected Behavior
A clear and concise description of what you expected to happen.

## 📝 Actual Behavior
A clear and concise description of what actually happened.

## 🚨 Issue Type
- [ ] Email Threading/Reply Issues (inReplyTo parameter)
- [ ] Authentication Problems
- [ ] Connection/Network Issues
- [ ] Configuration Issues
- [ ] Performance Issues
- [ ] Other

## 📋 Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## 🖼️ Screenshots/Logs
If applicable, add screenshots or log outputs to help explain your problem.

```
Paste relevant logs here
```

## 🏗️ Environment
- **Fastmail MCP Server Version**: [e.g., 1.1.0]
- **Node.js Version**: [e.g., 18.17.0]
- **Operating System**: [e.g., macOS 13.4, Ubuntu 22.04, Windows 11]
- **Installation Method**: [NPM Global/Local/Manual/Docker]
- **Claude Desktop Version**: [if applicable]

## ⚙️ Configuration
```json
// Sanitized configuration (remove sensitive data)
{
  "mcpServers": {
    "fastmail": {
      "command": "...",
      "env": {
        "FASTMAIL_EMAIL": "user@domain.com"
        // DON'T include FASTMAIL_API_TOKEN
      }
    }
  }
}
```

## 🔍 Additional Context
Add any other context about the problem here.

### For Email Threading Issues:
- [ ] Are you using `inReplyTo` parameter?
- [ ] Did `send_email` return `success: true`?
- [ ] Does the email appear in your Sent folder?
- [ ] Can you retrieve the email using the returned ID?
- [ ] Did the recipient receive the email?

## 🔧 Attempted Solutions
List any solutions you've already tried:
- [ ] Checked troubleshooting guide
- [ ] Verified configuration
- [ ] Restarted application
- [ ] Updated to latest version
- [ ] Other: ___________

## 📊 Impact Assessment
- **Severity**: [Low/Medium/High/Critical]
- **Frequency**: [Always/Often/Sometimes/Rarely]
- **Workaround Available**: [Yes/No - describe if yes]