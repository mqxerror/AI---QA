# BMAD Method Guide for QA Dashboard

## What is BMAD?

**BMAD (Breakthrough Method of Agile AI-driven Development)** is a development methodology that helps organize and structure your project using AI-assisted workflows. Version 6+ includes:

- **Structured Development Phases** (Analysis → Planning → Design → Implementation)
- **AI Agent Workflows** for different development tasks
- **Scale-Adaptive Intelligence** that adjusts to project complexity
- **Documentation Management** with clear folder structures
- **Multi-Agent Collaboration** for complex features

This project uses **ZNS-METHOD Framework v6.3.2**, which is built on BMAD-METHOD V6+.

---

## 📁 Folder Structure

BMAD organizes your project with these folders:

```
dashboard/
├── .bmad/                          # BMAD configuration and agents
├── _bmad-output/                   # Generated artifacts (git-ignored)
│   ├── planning-artifacts/         # Requirements, designs, PRDs
│   └── implementation-artifacts/   # Sprint tasks, implementation docs
├── docs/                           # Long-term project documentation
├── backend/                        # Backend application
├── frontend/                       # Frontend application
└── .bmad-config.yaml              # BMAD configuration
```

### What Goes Where?

- **`.bmad/`** - BMAD agent definitions and customizations
- **`_bmad-output/planning-artifacts/`** - Requirements, PRDs, architecture docs
- **`_bmad-output/implementation-artifacts/`** - Sprint plans, task breakdowns
- **`docs/`** - Final documentation, API docs, deployment guides

---

## 🚀 Available Commands

### Claude Code Slash Commands (Recommended)

You can now use BMAD directly in Claude Code with slash commands:

```bash
# Activate a specialized agent
/bmad product-owner       # Product planning and requirements
/bmad architect          # System design and architecture
/bmad fullstack-dev      # Full-stack development
/bmad frontend-dev       # React and UI development
/bmad backend-dev        # API and database development
/bmad qa-specialist      # Testing and quality assurance
/bmad devops            # Deployment and infrastructure
/bmad code-auditor      # Code review and analysis

# Utility commands
/bmad status            # Show project status
/bmad plan [feature]    # Plan a new feature
/bmad review [code]     # Review code with best practices
/bmad estimate [task]   # Estimate effort and complexity
```

### Terminal Commands

```bash
# Check BMAD installation status
npx znsmtd status

# Compile agents (YAML → XML)
npx znsmtd compile --all

# Install a custom agent
npx znsmtd agent-install path/to/agent.yaml

# Validate agent schemas
npx znsmtd validate
```

### Project Development Commands

```bash
# Start local development servers
npm run dev                    # Both backend + frontend
npm run dev:backend           # Backend only (port 3004)
npm run dev:frontend          # Frontend only (port 5174)

# Build for production
npm run build                 # Build both
npm run build:backend         # Backend only
npm run build:frontend        # Frontend only
```

---

## 🎯 Development Phases

BMAD organizes work into phases. This project is currently in **Phase 4: Implementation**.

### Phase 0: Documentation
- ✅ Project README created
- ✅ Architecture documented
- ✅ API documentation

### Phase 1: Analysis
- ✅ Requirements gathering
- ✅ User stories defined
- ✅ Technical constraints identified

### Phase 2: Planning
- ✅ Sprint planning
- ✅ Task breakdown
- ✅ Resource allocation

### Phase 3: Solutioning
- ✅ System architecture designed
- ✅ Database schema defined
- ✅ API endpoints planned
- ✅ UI/UX mockups created

### Phase 4: Implementation (Current)
- 🔄 Building features
- 🔄 Writing tests
- 🔄 Deployment & DevOps
- 🔄 Bug fixes and optimization

---

## 🛠️ Available BMAD Agents

ZNS-METHOD provides specialized agents for different tasks:

### Core Agents
- **Product Owner** - Requirements, user stories, backlog management
- **Architect** - System design, data modeling, technical decisions
- **Full Stack Developer** - End-to-end feature implementation

### Specialized Agents
- **Frontend Developer** - React, UI/UX implementation
- **Backend Developer** - Node.js, API development
- **QA Specialist** - Testing strategies, test automation
- **DevOps Engineer** - Deployment, CI/CD, infrastructure
- **Database Designer** - Schema design, migrations

### Audit Agents
- **Frontend Auditor** - Code quality, performance analysis
- **Backend Auditor** - Security, best practices review
- **Cost Estimator** - Effort estimation, resource planning

---

## 📊 Current Project Status

**Project:** QA Testing Dashboard
**Phase:** 4 (Implementation)
**Complexity Level:** 2 (Medium)
**Current Sprint:** Production Deployment & CORS Fixes

### Recent Achievements
- ✅ Fixed modal positioning issues
- ✅ Resolved CORS configuration
- ✅ Deployed to production (portugalgoldenvisas.co)
- ✅ Standardized button sizes
- ✅ Added report availability checking

### Active Goals
- 🔄 Test PDF download functionality
- 🔄 Verify modal data display
- 🔄 Monitor production deployment
- 🔄 Performance optimization

---

## 🎓 How to Use BMAD in This Project

### 1. Planning New Features

When adding a new feature:

1. **Document requirements** in `_bmad-output/planning-artifacts/`
   ```
   _bmad-output/planning-artifacts/
   └── feature-name/
       ├── requirements.md
       ├── user-stories.md
       └── design.md
   ```

2. **Break down implementation** in `_bmad-output/implementation-artifacts/`
   ```
   _bmad-output/implementation-artifacts/
   └── sprint-N/
       ├── tasks.md
       ├── implementation-notes.md
       └── testing-plan.md
   ```

3. **Move final docs** to `docs/` when complete

### 2. Using AI Agents

You can work with specialized agents through Claude Code:
- "Act as the Backend Developer agent and help me implement..."
- "As the QA Specialist, review these test cases..."
- "Product Owner agent: help prioritize these features..."

### 3. Managing Complexity

BMAD adapts to project complexity (Level 0-4):
- **Level 0-1:** Simple scripts, prototypes
- **Level 2:** Medium apps (current level)
- **Level 3:** Enterprise applications
- **Level 4:** Large-scale distributed systems

---

## 📚 Resources

- [BMAD Method Official Docs](https://github.com/bmad-code-org/BMAD-METHOD)
- [ZNS-METHOD Framework](https://github.com/MaldivatiProject/zns_method)
- [Agent Development Guide](node_modules/@znsmtd/framework/docs/tutorials/)

---

## 🤝 Best Practices

1. **Keep artifacts organized** - Use the folder structure consistently
2. **Document decisions** - Add architecture decisions to `docs/`
3. **Use phase markers** - Update phase in `.bmad-config.yaml` as you progress
4. **Agent specialization** - Use the right agent for each task
5. **Iterate** - BMAD is designed for iterative development

---

## ❓ Quick Reference

| Need | Agent | Slash Command |
|------|-------|---------------|
| Plan feature | Product Owner | `/bmad product-owner` |
| Design system | Architect | `/bmad architect` |
| Write code | Full Stack Dev | `/bmad fullstack-dev` |
| Review code | Code Auditor | `/bmad code-auditor` |
| Fix bugs | Developer | `/bmad backend-dev` or `/bmad frontend-dev` |
| Deploy | DevOps | `/bmad devops` |
| Test | QA Specialist | `/bmad qa-specialist` |
| Check status | - | `/bmad status` |
| Plan new feature | - | `/bmad plan [feature-name]` |

---

**Current Configuration:** See `.bmad-config.yaml` for full project settings.
