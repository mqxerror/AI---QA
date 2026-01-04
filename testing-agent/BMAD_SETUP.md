# BMAD-METHOD Setup - QA Testing Agent

## ✅ Installation Complete!

BMAD-METHOD v6 (official) is now installed and configured for the QA Testing Agent project.

## 📦 What's Installed

**Official BMAD-METHOD:**
- Package: `bmad-method@6.0.0-alpha.22`
- Framework: `@znsmtd/framework@6.3.2`
- Location: `node_modules/bmad-method/`
- Agents: 9 specialized agents
- Workflows: 50+ guided workflows

## 🤖 Available Slash Commands (15 total)

### BMAD Method Agents (9 agents)
- `/pm` - Product Manager
- `/analyst` - Business Analyst
- `/sm` - Scrum Master
- `/architect` - System Architect
- `/ux-designer` - UX/UI Designer
- `/tea` - Test Architect
- `/dev` - Full-Stack Developer
- `/quick-flow` - Quick bug fixes
- `/tech-writer` - Technical Writer

### Developer Expert Skills (6 skills)
- `/frontend-expert` - React, TypeScript, CSS, UX
- `/backend-expert` - Node.js, Express, APIs, databases
- `/testing-expert` - Testing, TDD, test automation
- `/devops-expert` - Docker, CI/CD, deployment
- `/api-expert` - RESTful APIs, API design
- `/bmad` - Main BMAD skill (access all agents)

## 📁 Project Structure

```
testing-agent/
├── .claude/
│   └── skills/              # All 15 slash command skills
├── .bmad/                   # BMAD agent customizations
├── _bmad-output/            # Generated artifacts (git-ignored)
│   ├── planning-artifacts/
│   └── implementation-artifacts/
├── PRDs/                    # Product requirements (existing)
├── test-api/                # Test API service
├── playwright/              # E2E tests
├── k6/                      # Load tests
├── .bmad-config.yaml        # BMAD configuration
├── package.json             # BMAD dependencies
└── docker-compose.yml       # Infrastructure
```

## 🚀 Quick Start

### Use Any Agent
```bash
/tea
Review our test coverage for the Playwright tests and suggest improvements.

/architect
Design the architecture for integrating this testing agent with the dashboard.

/quick-flow
Fix the MinIO connection issue in docker-compose.yml.

/testing-expert
Create a comprehensive test plan for the 8 test types we support.

/devops-expert
Optimize the Docker setup for faster test execution.
```

## 🎯 Project Context

**Testing Agent Details:**
- **Purpose**: Automated testing with 8 test types
- **Tech Stack**: Docker, Playwright, k6, Lighthouse
- **Integration**: MinIO (9002), Test API (3003)
- **Test Types**: Performance, Load, Visual, Security, SEO, Accessibility, Smoke, Pixel Perfect
- **Phase**: Implementation (Phase 4)
- **Complexity**: Level 2 (Medium)

## 📊 Test Architecture

Your testing agent supports:
1. **Performance Testing** - Lighthouse audits
2. **Load Testing** - k6 stress tests
3. **Visual Regression** - Pixelmatch comparisons
4. **Security Scanning** - Vulnerability detection
5. **SEO Auditing** - Technical SEO analysis
6. **Accessibility Testing** - WCAG compliance
7. **Smoke Testing** - Critical path validation
8. **Pixel Perfect Testing** - Visual precision

## 💡 Example Workflows

### Planning a New Test Type
```
/pm
Create a PRD for adding API contract testing to our test suite.

/architect
Design how we'll integrate API contract tests with existing infrastructure.

/dev
Implement the API contract testing module.

/tea
Create test specifications for API contract validation.
```

### Improving Performance
```
/testing-expert
Analyze why our Playwright tests are taking 10+ minutes.
Suggest optimizations for parallel execution.

/devops-expert
Optimize Docker images to reduce test startup time.
```

### Integration Work
```
/architect
Design the integration between this testing agent and the QA dashboard.

/api-expert
Define the API contract between testing-agent and dashboard services.

/backend-expert
Implement WebSocket communication for real-time test results.
```

## 📚 Documentation

- **SLASH_COMMANDS.md** - Complete slash command reference
- **.bmad-config.yaml** - Project configuration
- **PRDs/** - Existing requirements documents
- **README.md** - Project overview (existing)

## 🔗 Related Projects

This testing agent integrates with:
- **QA Dashboard**: `/Users/mqxerrormac16/Documents/QA  - Smart System/dashboard`
  - Backend: port 3004
  - Frontend: port 5174
  - Domain: portugalgoldenvisas.co

## ✅ Next Steps

1. **Explore agents**: Try different slash commands
2. **Review configuration**: Check `.bmad-config.yaml`
3. **Plan improvements**: Use `/pm` or `/tea` to plan test enhancements
4. **Document architecture**: Use `/tech-writer` for documentation
5. **Optimize infrastructure**: Use `/devops-expert` for Docker improvements

---

**All 15 slash commands are active and ready to use in this directory!**

Type `/` followed by any command name to activate that specialized agent.
