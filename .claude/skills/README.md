# Agent Skills

This directory contains Agent Skills for GitHub Copilot and Claude AI agents working on the Y-Not Radio site.

## What are Agent Skills?

Agent Skills are structured instructions that help AI agents perform specialized tasks more effectively. They follow the [Agent Skills standard](https://github.com/agentskills/agentskills) and are supported by:
- GitHub Copilot coding agent
- GitHub Copilot CLI  
- Claude (Desktop, Code, and API)
- Visual Studio Code Insiders

For more information:
- [GitHub: About Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [Claude: Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)

## Available Skills

### testing-pr-changes
Complete testing and verification workflow for agent-created pull requests. Covers:
- Critical success criteria and proof requirements
- Docker setup and database seeding
- Performance baselines and environment detection
- Incremental verification strategy
- Fallback strategies and common pitfalls

**Use when:** Preparing to submit a PR, verifying changes work correctly, or ensuring all evidence requirements are met.

### agent-automation-infrastructure
Current state of CI/CD automation, pre-built Docker images, and optimization strategies. Covers:
- Pre-built images available (Payload, PHP-FPM, Postgres)
- Performance metrics and optimization approaches
- Usage examples for fast vs slow workflows
- Database seeding strategies

**Use when:** Dealing with slow builds, container timeouts, yarn install issues, or understanding available automation tooling.

### detecting-agent-environment
Utilities for detecting execution environment and creating environment-aware scripts. Covers:
- Environment detection patterns (CI/CD vs local)
- Network access and port availability checks
- Timeout configuration
- Script creation best practices

**Use when:** Need to adapt scripts based on execution environment or creating helper utilities.

## Skill Structure

Each skill follows this structure:
```
skill-name/
├── SKILL.md          # Main instructions with YAML frontmatter
└── [optional files]  # Additional resources loaded on-demand
```

### SKILL.md Format
```markdown
---
name: skill-name
description: What the skill does and when to use it
---

# Skill Title

[Instructions and content]
```

## Best Practices

Skills in this repository follow these principles:

1. **Concise** - Under 500 lines per SKILL.md, assume agents are smart
2. **Focused** - Each skill addresses specific capabilities or workflows
3. **Progressive disclosure** - Main SKILL.md provides overview, references additional files for details
4. **Tested** - Content based on real usage and proven workflows
5. **Third person** - Descriptions written in third person for consistency

## Migration from Legacy Docs

These skills were refactored from:
- `docs/AGENT_TESTING_CHECKLIST.md` → `testing-pr-changes`
- `docs/AGENT_AUTOMATION_STATUS.md` → `agent-automation-infrastructure`
- `bin/agent-helpers/README.md` → `detecting-agent-environment`

Legacy documentation files remain in place with notes pointing to skills.

## Contributing

When adding new skills:

1. Create a subdirectory with a descriptive name (lowercase, hyphens)
2. Add SKILL.md with proper frontmatter
3. Keep content under 500 lines
4. Test with actual agent usage
5. Update this README

For more guidance, see the skill authoring best practices linked above.
