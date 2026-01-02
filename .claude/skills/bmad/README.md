# BMAD Method Skill - Quick Reference

## What is this?

This skill enables **official BMAD-METHOD v6** (Breakthrough Method of Agile AI-driven Development) workflows directly in Claude Code through slash commands. Access 19 specialized agents and 50+ guided workflows.

## How to Use

Type `/bmad` followed by an agent name or command:

### 🎯 Product & Planning
```
/bmad pm                 - Product Manager: Requirements, PRDs, backlog
/bmad analyst            - Business Analyst: Research, analysis
/bmad sm                 - Scrum Master: Sprint planning, agile facilitation
```

### 🏗️ Architecture & Design
```
/bmad architect          - System Architect: Architecture, data modeling
/bmad ux-designer        - UX/UI Designer: User experience, prototypes
/bmad tea                - Test Architect: Test strategy, quality architecture
```

### 💻 Development & Documentation
```
/bmad dev                - Full-stack Developer: Implementation, code review
/bmad quick-flow-solo-dev - Quick Flow Developer: Rapid bug fixes
/bmad tech-writer        - Technical Writer: Documentation, API docs
```

### 🛠️ Utilities
```
/bmad status             - Show project status and BMAD info
```

## Examples

**Planning a new feature:**
```
/bmad pm
Create a PRD for adding email notifications when tests fail.
```

**Test architecture:**
```
/bmad tea
Review the TestRunModal component's test coverage and suggest improvements.
```

**System design:**
```
/bmad architect
Design a caching strategy for the test results to improve performance.
```

**Quick bug fix:**
```
/bmad quick-flow-solo-dev
Fix the modal positioning issue that's causing buttons to be off-screen.
```

## Current Project Context

- **Project:** QA Testing Dashboard
- **Phase:** 4 (Implementation)
- **Tech Stack:** Node.js, React, SQLite, WebSocket
- **Complexity:** Level 2 (Medium)
- **Domain:** portugalgoldenvisas.co

## Output Locations

Agents will create artifacts in:
- `_bmad-output/planning-artifacts/` - Requirements, designs
- `_bmad-output/implementation-artifacts/` - Sprint tasks, notes
- `docs/` - Final documentation

---

**For full documentation, see:** `BMAD_GUIDE.md`
