# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Known Issues
- **Email Threading/Reply Issues**: Intermittent failures when using `inReplyTo` parameter for email replies
  - Symptoms: Function returns success but email is not sent or stored
  - Frequency: ~30-40% of threaded replies
  - Workaround: Send new emails instead of replies for critical communications
  - Status: Under investigation, target fix in v1.2.0

### Added
- Comprehensive troubleshooting documentation
- GitHub issue templates for bug reports and feature requests
- Known issues documentation in README
- Email send verification patterns and workarounds

## [1.1.0] - 2025-06-22

### Added
- ✅ **Advanced Analytics** - Email usage insights and reports
- Enhanced error handling and logging
- Performance optimizations for large mailboxes
- Better TypeScript type definitions
- Improved documentation and examples

### Changed
- Updated CI/CD pipeline for more comprehensive testing
- Enhanced NPM package metadata and keywords
- Improved installation scripts and setup process

### Fixed
- Various minor bug fixes and stability improvements
- Better handling of large attachment processing
- Improved connection timeout handling

## [1.0.0] - 2025-06-22

### Added
- 🎉 **Initial public release**
- Complete MCP server implementation for Fastmail integration
- Full JMAP API coverage with 12+ email management tools
- TypeScript-first development with comprehensive type safety
- Professional NPM package distribution
- Automated CI/CD pipeline with multi-version Node.js testing
- Claude Desktop integration support
- Enterprise-grade security with token-based authentication
- Comprehensive documentation and API reference

## Project Milestones

### v1.2.0 (Planned - Q3 2025)
- **Threading Reliability Fix** - Address inReplyTo parameter issues
- **Email Templates** - Reusable email template system
- **Enhanced Error Handling** - Better error reporting and recovery

### v1.3.0 (Planned - Q4 2025)  
- **Multi-Account Support** - Manage multiple Fastmail accounts
- **Webhook Integration** - Real-time email notifications
- **Advanced Search** - Enhanced search capabilities and indexing

## Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Priorities
1. **Fix threading issues** - High priority reliability improvement
2. **Enhance documentation** - Continuous improvement based on user feedback
3. **Performance optimization** - Scale for larger deployments
4. **Feature expansion** - Based on community requests and roadmap

## Support

- **Documentation**: [GitHub Repository](https://github.com/alexdiazdecerio/fastmail-mcp-server)
- **Issues**: [GitHub Issues](https://github.com/alexdiazdecerio/fastmail-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alexdiazdecerio/fastmail-mcp-server/discussions)

---

*For more details on any release, see the corresponding [GitHub Release](https://github.com/alexdiazdecerio/fastmail-mcp-server/releases) page.*