# Contributing to Y-Not Radio Site

Thank you for your interest in contributing to the Y-Not Radio site! This guide will help you get started.

## For GitHub Copilot Agents

If you're a GitHub Copilot agent working on this repository, please start with the **[Agent Quick Start Guide](docs/AGENT_QUICK_START.md)**. This provides a checklist-based approach to ensure your changes are properly verified.

**Essential Agent Resources:**
- 🚀 **[Agent Quick Start](docs/AGENT_QUICK_START.md)** - Checklist for agents
- 📖 **[Agent Verification Guide](docs/AGENT_VERIFICATION.md)** - Comprehensive verification procedures
- 💡 **[Verification Examples](docs/AGENT_VERIFICATION_EXAMPLES.md)** - Practical examples for common scenarios
- 🔧 **[Helper Scripts](bin/agent-helpers/README.md)** - Automated verification tools

**Quick Verification Commands:**
```bash
npm run verify:payload    # Verify Payload CMS instance
npm run verify:legacy     # Verify legacy PHP/MySQL site
npm run verify:all        # Verify both systems
```

## For Human Contributors

### Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone git@github.com:YOUR-USERNAME/site.git
   cd site
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment** - See [README.md](README.md) for development setup instructions

### Branch Naming

Follow these conventions for branch names:

- New features: `feature/new-feature-name`
- Bug fixes: `fix/bugfix-description`
- Releases: `release/release-2.0.0`

### Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run lint          # Check code style
   npm test              # Run test suite
   npm run verify:payload    # If working on Payload
   npm run verify:legacy     # If working on legacy site
   ```

4. **Commit your changes** with clear commit messages:
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

### Pull Request Guidelines

When opening a pull request:

- **Write a clear title** that describes the change
- **Describe what changed and why** in the PR description
- **Include screenshots** for UI changes
- **Reference related issues** using `#issue-number`
- **Include verification results**:
  - ✅ Tests pass
  - ✅ Linting passes
  - ✅ Verification scripts pass (if applicable)
- **Wait for CI checks** to pass before requesting review
- **Respond to review feedback** promptly

### Code Standards

#### JavaScript/TypeScript
- Follow the ESLint configuration (`.eslintrc.json`)
- Use TypeScript for new code when possible
- Write clear, self-documenting code
- Add comments for complex logic

#### PHP
- Follow PHP_CodeSniffer rules (`src/phpcs.xml`)
- Use PSR-12 coding standards
- Properly escape output to prevent XSS
- Use parameterized queries to prevent SQL injection

#### Tests
- Write tests for new functionality
- Ensure existing tests continue to pass
- Aim for good code coverage (see `vitest.config.ts` for thresholds)

### Commit Messages

Write clear, descriptive commit messages:

**Good:**
- `Add DJ import migration script with MusicBrainz integration`
- `Fix concert date display formatting on homepage`
- `Update Payload collection schema for multi-person DJs`

**Bad:**
- `fix bug`
- `update code`
- `changes`

### Migration Work

This repository is undergoing a migration from legacy PHP/MySQL to Payload CMS with PostgreSQL. When contributing:

1. **Read the migration docs**: [docs/payload-migration/README.md](docs/payload-migration/README.md)
2. **Understand the strategy**: Both systems need to work during transition
3. **Don't break the legacy site**: Ensure backward compatibility
4. **Follow collection patterns**: Match existing Payload collection structure
5. **Verify both systems**: Use the verification scripts

### Reporting Issues

When reporting issues:

- **Search existing issues** first to avoid duplicates
- **Use issue templates** if available
- **Provide clear reproduction steps**
- **Include error messages** and relevant logs
- **Specify environment** (OS, Node version, Docker version, etc.)

### Getting Help

- **Read the docs**: Start with [README.md](README.md) and [docs/](docs/)
- **Check troubleshooting**: See [docs/AGENT_VERIFICATION.md#troubleshooting](docs/AGENT_VERIFICATION.md#troubleshooting)
- **Open an issue**: If you're stuck, create an issue with details
- **Be patient**: Maintainers will respond as soon as possible

## Continuous Integration

The repository uses GitHub Actions for CI. All PRs must pass:

- **ESLint**: JavaScript/TypeScript code style checks
- **Vitest**: Test suite with coverage requirements
- **PHP_CodeSniffer**: PHP code style checks

View results in the "Checks" tab of your PR.

## License

By contributing to this repository, you agree that your contributions will be licensed under the same license as the project.

## Code of Conduct

Be respectful and constructive in all interactions. We aim to maintain a welcoming and inclusive community.

## Questions?

If you have questions not covered here:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/ynotradio/site/issues)
3. Open a new issue with the "question" label

---

Thank you for contributing to Y-Not Radio! 🎵📻
