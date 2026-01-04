---
name: bmad
description: Official BMAD-METHOD v6 AI development workflows - access 19 specialized agents and 50+ guided workflows
version: 2.0.0
dependencies: ["bmad-method@6.0.0-alpha.22"]
---

# BMAD Method Skill

Access BMAD (Breakthrough Method of Agile AI-driven Development) workflows and specialized AI agents for structured development.

## Usage

Invoke this skill with `/bmad [agent|command]` to access BMAD functionality.

## Official BMAD Agents

All agents are located in: `node_modules/bmad-method/src/modules/bmm/agents/`

### Product & Planning
- **pm** - Product Manager: Requirements, user stories, PRDs, backlog
- **analyst** - Business Analyst: Research, exploration, analysis
- **sm** - Scrum Master: Agile facilitation, sprint planning, team coordination

### Architecture & Design
- **architect** - System Architect: Architecture, data modeling, technical design
- **ux-designer** - UX/UI Designer: User experience, prototypes, design systems
- **tea** - Test Architect: Test strategy, quality architecture, automation

### Development & Documentation
- **dev** - Developer: Full-stack development, implementation, code review
- **quick-flow-solo-dev** - Quick Flow Developer: Rapid bug fixes, small features
- **tech-writer** - Technical Writer: Documentation, guides, API docs

## Commands

- **status** - Show BMAD installation status and project info
- **plan [feature]** - Create a structured plan for a new feature
- **review [component]** - Code review with best practices check
- **estimate [task]** - Estimate effort and complexity
- **document [topic]** - Generate technical documentation

## Examples

```
/bmad pm
Help me create a PRD for the email notifications feature.

/bmad architect
Design a caching strategy for the test results API.

/bmad tea
Review the current test coverage and suggest improvements.

/bmad dev
Implement the user authentication module with best practices.

/bmad quick-flow-solo-dev
Fix the modal positioning bug quickly.

/bmad status
Show the current project status and BMAD configuration.
```

## Skill Implementation

When this skill is invoked:

1. Parse the agent or command name from the arguments
2. Load the relevant BMAD agent context and persona
3. Apply the agent's specialized knowledge to the user's request
4. Follow BMAD methodology principles (phase-based, scale-adaptive)
5. Output artifacts to appropriate BMAD folders when applicable

## Agent Personas

Each agent has a distinct persona with:
- **Role**: Specific responsibility area
- **Identity**: Professional background and expertise
- **Communication Style**: How they interact and present information
- **Principles**: Core values and decision-making criteria

## Phase Awareness

The skill is aware of the current project phase (from `.bmad-config.yaml`):
- **Phase 0**: Documentation
- **Phase 1**: Analysis
- **Phase 2**: Planning
- **Phase 3**: Solutioning
- **Phase 4**: Implementation (current)

Agents adjust their guidance based on the current phase.

## Output Management

Artifacts are organized following BMAD conventions:
- **Planning artifacts** → `_bmad-output/planning-artifacts/`
- **Implementation artifacts** → `_bmad-output/implementation-artifacts/`
- **Final documentation** → `docs/`

## Integration with Project

The skill integrates with your QA Dashboard project:
- Tech stack: Node.js, React, SQLite, WebSocket
- Complexity level: 2 (Medium)
- Current focus: Production deployment, CORS fixes, UI standardization
- Deployment: Dokploy on portugalgoldenvisas.co

---

**Quick Reference:**
- `/bmad [agent-name]` - Activate a specialized agent
- `/bmad status` - Check project status
- `/bmad plan [feature]` - Plan new feature
- Read `BMAD_GUIDE.md` for full documentation
