# 🚀 Fastmail MCP Server

[![CI/CD](https://github.com/alexdiazdecerio/fastmail-mcp-server/workflows/CI%2FCD/badge.svg)](https://github.com/alexdiazdecerio/fastmail-mcp-server/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

> **Professional MCP (Model Context Protocol) server for seamless Fastmail integration with Claude Desktop and other AI assistants.**

Transform your email workflow with AI-powered email management using Fastmail's enterprise-grade JMAP API.

![Demo](https://via.placeholder.com/800x400/1a1a1a/00ff00?text=Fastmail+MCP+Server+Demo)

## ✨ Features

### 🔥 **Core Capabilities**
- 📧 **Complete Email Management** - Read, send, search, and organize emails
- 🔍 **Advanced Search** - AI-powered email search with natural language queries  
- 📁 **Smart Organization** - Automated folder management and email classification
- 🚀 **Real-time Sync** - Instant synchronization with your Fastmail account
- 🛡️ **Enterprise Security** - Token-based authentication with granular permissions

### 🤖 **AI Integration**
- 💬 **Natural Language Commands** - "Show me emails from John about the project"
- 📊 **Email Analytics** - Automated insights and summaries
- ✏️ **Smart Composition** - AI-assisted email writing and responses
- 🎯 **Intelligent Filtering** - Context-aware email prioritization

### 🛠️ **Developer Experience**
- 🏗️ **TypeScript First** - Full type safety and excellent IDE support
- 📚 **Comprehensive API** - 12+ tools covering all email operations
- 🧪 **Automated Testing** - CI/CD with multi-version Node.js testing
- 📖 **Rich Documentation** - Examples, guides, and API reference

## 🚀 Quick Start

### One-Line Installation
```bash
curl -fsSL https://raw.githubusercontent.com/alexdiazdecerio/fastmail-mcp-server/main/install.sh | bash
```

### Manual Installation
```bash
git clone https://github.com/alexdiazdecerio/fastmail-mcp-server.git
cd fastmail-mcp-server
npm install
npm run build
```

### Configuration
1. Get your Fastmail API token: [Fastmail API Tokens](https://www.fastmail.com/settings/security/tokens)
2. Copy `.env.example` to `.env`
3. Add your credentials to `.env`

## 📋 Requirements

- **Node.js** 18+ 
- **Fastmail Account** with API access
- **Claude Desktop** or any MCP-compatible client

## 🎯 Usage Examples

### Basic Commands
```bash
# List recent emails
"Show me my recent emails"

# Search functionality  
"Find emails from alice@example.com about the meeting"

# Email composition
"Send an email to bob@example.com with subject 'Project Update'"

# Organization
"Move the email with subject 'Invoice' to the Archive folder"
```

### Advanced Workflows
```bash
# AI-powered insights
"Summarize my unread emails"

# Batch operations
"Mark all emails from newsletters as read"

# Smart search
"Find all emails with attachments from last week"
```

## 🔧 API Reference

<details>
<summary><strong>📧 Email Management (click to expand)</strong></summary>

### `list_emails`
Lists emails with advanced filtering options.

**Parameters:**
- `mailboxId` (optional) - Specific folder ID
- `limit` (optional) - Max number of emails (default: 50)
- `isUnread` (optional) - Filter unread emails only
- `searchText` (optional) - Search in email content
- `from` (optional) - Filter by sender
- `subject` (optional) - Filter by subject

### `get_email`
Retrieves complete email details including body content.

### `send_email`
Composes and sends new emails with rich formatting support.

### `search_emails`
Performs full-text search across all email content.

</details>

<details>
<summary><strong>📁 Organization Tools (click to expand)</strong></summary>

### `list_mailboxes`
Lists all folders and their properties.

### `move_email`
Moves emails between folders.

### `mark_email_read`
Updates read/unread status.

### `delete_email`
Permanently deletes emails.

</details>

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude        │────│  MCP Server      │────│   Fastmail      │
│   Desktop       │    │  (This Project)  │    │   JMAP API      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

- **MCP Protocol** - Standardized AI-to-service communication
- **JMAP API** - Modern, efficient email protocol (successor to IMAP)
- **TypeScript** - Type-safe implementation with excellent tooling

## 🧪 Development

### Available Scripts
```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode for development  
npm run dev        # Build and run server
npm run inspector  # Debug with MCP inspector
```

### Testing
```bash
npm test           # Run test suite
npm run lint       # Code quality checks
npm audit          # Security vulnerability scan
```

## 🌟 Advanced Configuration

### Claude Desktop Setup
Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fastmail": {
      "command": "node",
      "args": ["/absolute/path/to/fastmail-mcp-server/build/index.js"],
      "env": {
        "FASTMAIL_EMAIL": "your-email@fastmail.com",
        "FASTMAIL_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Production Deployment
- Use process managers like PM2 for production
- Set up log rotation and monitoring
- Consider using Docker for containerized deployment

## 🛡️ Security

- **Token-based Authentication** - No password storage
- **Granular Permissions** - Minimum required access scope
- **Environment Variables** - Secure credential management
- **Audit Logging** - Track all API interactions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📈 Roadmap

- [ ] **Email Templates** - Reusable email templates
- [ ] **Advanced Analytics** - Email usage insights and reports  
- [ ] **Multi-Account Support** - Manage multiple Fastmail accounts
- [ ] **Webhook Support** - Real-time email notifications
- [ ] **Plugin System** - Extensible architecture for custom features

## 🏆 Why This Project?

### vs. Traditional Email Clients
- **AI-Native** - Built for AI interaction from the ground up
- **Programmable** - Automate complex email workflows
- **Cross-Platform** - Works everywhere Claude Desktop runs

### vs. Other MCP Servers
- **Production Ready** - Comprehensive testing and CI/CD
- **Feature Complete** - Full JMAP API coverage
- **Well Documented** - Extensive examples and guides

## 📞 Support

- **Documentation** - Comprehensive guides and API reference
- **Issues** - Report bugs or request features on GitHub
- **Discussions** - Community support and feature discussions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Fastmail** - For their excellent JMAP API
- **Anthropic** - For the MCP protocol and Claude integration
- **Community** - For feedback, contributions, and support

---

<div align="center">

**⭐ If this project helped you, please give it a star on GitHub! ⭐**

[⚡ Get Started](mailto:hello@fastmail.com) • [📚 Documentation](docs/) • [🐛 Report Bug](../../issues) • [💡 Request Feature](../../discussions)

</div>