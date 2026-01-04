# Available Slash Commands

All slash commands are now set up and ready to use in Claude Code!

## 🤖 BMAD Method Agents (9 agents)

### Product & Planning
| Command | Agent | Use For |
|---------|-------|---------|
| `/pm` | Product Manager | Requirements, PRDs, user stories, backlog management |
| `/analyst` | Business Analyst | Research, business analysis, requirements gathering |
| `/sm` | Scrum Master | Sprint planning, agile facilitation, process improvement |

### Architecture & Design
| Command | Agent | Use For |
|---------|-------|---------|
| `/architect` | System Architect | System design, architecture decisions, data modeling |
| `/ux-designer` | UX/UI Designer | User experience, prototypes, design systems, accessibility |
| `/tea` | Test Architect | Test strategy, quality architecture, comprehensive testing |

### Development & Documentation
| Command | Agent | Use For |
|---------|-------|---------|
| `/dev` | Full-Stack Developer | Feature implementation, code review, best practices |
| `/quick-flow` | Quick Flow Developer | Rapid bug fixes, small features, hotfixes |
| `/tech-writer` | Technical Writer | Documentation, API docs, user guides |

---

## 👨‍💻 Developer Expert Skills (5 skills)

| Command | Expert | Use For |
|---------|--------|---------|
| `/frontend-expert` | Frontend Expert | React, TypeScript, CSS, accessibility, performance, UX |
| `/backend-expert` | Backend Expert | Node.js, Express, databases, APIs, authentication, WebSocket |
| `/testing-expert` | Testing Expert | Unit tests, integration tests, e2e tests, TDD, test automation |
| `/devops-expert` | DevOps Expert | Docker, CI/CD, deployment, infrastructure, monitoring |
| `/api-expert` | API Design Expert | RESTful APIs, GraphQL, API security, versioning, documentation |

---

## 📊 Quick Reference by Task

### Planning & Requirements
```
/pm          - Create PRD, user stories, requirements
/analyst     - Research, business analysis
/sm          - Sprint planning, agile ceremonies
```

### Design & Architecture
```
/architect   - System architecture, data modeling
/ux-designer - UI/UX design, wireframes, prototypes
```

### Development
```
/dev              - Full-stack feature development
/frontend-expert  - React, UI components
/backend-expert   - APIs, databases, Node.js
/quick-flow       - Quick bug fixes
```

### Quality & Testing
```
/tea             - Test strategy, quality architecture
/testing-expert  - Test automation, coverage analysis
```

### API & Integration
```
/api-expert  - API design, REST, GraphQL
```

### Operations & Deployment
```
/devops-expert  - Docker, CI/CD, deployment, monitoring
```

### Documentation
```
/tech-writer  - Technical docs, API reference, guides
```

---

## 💡 Usage Examples

### Quick Bug Fix
```
/quick-flow
The modal close button is off-screen. Fix the CSS positioning immediately.
```

### Feature Planning
```
/pm
Create a PRD for adding email notifications when tests fail.
Include user stories and acceptance criteria.
```

### Architecture Design
```
/architect
Design a caching layer for test results using Redis.
Include cache invalidation strategy.
```

### API Development
```
/api-expert
Design a RESTful API for managing test configurations.
Include validation, error handling, and documentation.
```

### Frontend Development
```
/frontend-expert
Optimize the TestRunModal component for performance.
Review React rendering and suggest improvements.
```

### Backend Development
```
/backend-expert
Implement WebSocket connection pooling to handle 100+ concurrent clients.
Include error handling and reconnection logic.
```

### Testing Strategy
```
/tea
Review test coverage for the authentication module.
Create a comprehensive test plan including edge cases.
```

### DevOps & Deployment
```
/devops-expert
Set up automated deployments from GitHub to Dokploy.
Include health checks and rollback capability.
```

### UX Design
```
/ux-designer
Redesign the test results view for better usability.
Create wireframes and a component library.
```

### Documentation
```
/tech-writer
Write API documentation for all test run endpoints.
Include request/response examples and error codes.
```

---

## 🎯 Current Project Context

All agents have context about your QA Dashboard:

- **Project**: QA Testing Dashboard
- **Tech Stack**: Node.js, React, SQLite, WebSocket
- **Phase**: Implementation (Phase 4)
- **Deployment**: Dokploy on portugalgoldenvisas.co
- **Servers**: Backend (3004), Frontend (5174)

---

## 🚀 Getting Started

1. **Type the slash command**: `/pm`, `/dev`, `/architect`, etc.
2. **Describe your need**: What you want to accomplish
3. **Get expert help**: The agent responds with specialized guidance

### Example Workflow

```
# Planning
/pm
I need to add user authentication. Create a PRD.

# Architecture
/architect
Design the authentication system architecture.

# Development
/dev
Implement the authentication module with JWT.

# Testing
/testing-expert
Create comprehensive tests for authentication.

# Documentation
/tech-writer
Document the authentication API endpoints.
```

---

**All 14 slash commands are active and ready to use!**

Type any command in your conversation with Claude Code to activate that specialized agent or expert.
