# BMAD-METHOD Setup Status

## ✅ Installed Packages

You now have **both** BMAD implementations installed:

### 1. Official BMAD-METHOD (Recommended)
- **Package:** `bmad-method@6.0.0-alpha.22`
- **Location:** `node_modules/bmad-method/`
- **Status:** ✅ Installed (installer has ESM issue, but agents/workflows work)
- **Official Repo:** https://github.com/bmad-code-org/BMAD-METHOD

### 2. ZNS-METHOD Framework
- **Package:** `@znsmtd/framework@6.3.2`
- **Location:** `node_modules/@znsmtd/framework/`
- **Status:** ✅ Installed
- **Based on:** BMAD-METHOD V6+

---

## 🤖 Available Official BMAD Agents

Location: `node_modules/bmad-method/src/modules/bmm/agents/`

| Agent | File | Role |
|-------|------|------|
| **PM** | `pm.agent.yaml` | Product Manager - Requirements, user stories |
| **Analyst** | `analyst.agent.yaml` | Business Analyst - Research, analysis |
| **Architect** | `architect.agent.yaml` | System Architect - Architecture, design |
| **Developer** | `dev.agent.yaml` | Full-stack Developer - Implementation |
| **UX Designer** | `ux-designer.agent.yaml` | UX/UI Designer - Design, prototypes |
| **Test Architect** | `tea.agent.yaml` | Testing Architect - Test strategy |
| **Scrum Master** | `sm.agent.yaml` | Scrum Master - Agile facilitation |
| **Tech Writer** | `tech-writer.agent.yaml` | Technical Writer - Documentation |
| **Quick Flow Dev** | `quick-flow-solo-dev.agent.yaml` | Solo developer for quick tasks |

---

## 📋 Available Official BMAD Workflows

Location: `node_modules/bmad-method/src/modules/bmm/workflows/`

### Phase 1: Analysis
- `1-analysis/` - Brainstorming, research, exploration

### Phase 2: Planning
- `2-plan-workflows/` - PRDs, tech specs, requirements

### Phase 3: Solutioning
- `3-solutioning/` - Architecture, UX design, technical approach

### Phase 4: Implementation
- `4-implementation/` - Story-driven development, validation

### Special Workflows
- `bmad-quick-flow/` - Streamlined workflow for quick tasks
- `document-project/` - Project documentation generation
- `generate-project-context/` - Context generation for AI
- `excalidraw-diagrams/` - Diagram creation
- `workflow-status/` - Check workflow status

---

## 🚀 How to Use Official BMAD Agents

### Method 1: Using Slash Commands (Recommended)

You can use the `/bmad` slash command in Claude Code:

```
/bmad pm
Help me create a PRD for adding email notifications feature.

/bmad architect
Design a caching strategy for test results.

/bmad dev
Implement the user authentication module.
```

### Method 2: Manual Agent Loading

The agents are YAML files. You can:

1. **Copy agents to your project:**
   ```bash
   cp node_modules/bmad-method/src/modules/bmm/agents/*.yaml .bmad/agents/
   ```

2. **Load and use directly in Claude Code:**
   - Read the agent file
   - Follow its instructions and workflows

### Method 3: Reference Agent Files

Ask Claude to load and act as a specific agent:

```
Read node_modules/bmad-method/src/modules/bmm/agents/pm.agent.yaml
and act as the PM agent to help me plan this feature...
```

---

## 📁 Official BMAD Folder Structure

When using official BMAD, it expects:

```
project/
├── bmad-method/             # BMAD installation files (created by installer)
│   ├── agents/              # Your local agent customizations
│   ├── workflows/           # Your local workflow customizations
│   └── .config.yaml         # BMAD configuration
├── docs/                    # Final documentation
│   ├── planning/            # Planning artifacts
│   ├── architecture/        # Architecture docs
│   └── implementation/      # Implementation docs
└── .bmad-config.yaml       # Your project config (custom)
```

---

## 🔧 Known Issues

### Installer ESM Error

The interactive installer (`npx bmad-method@alpha install`) has an ESM compatibility issue with Node.js 20+:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module inquirer not supported
```

**Workaround:** Use agents and workflows directly without running the installer.

### Command Conflict

Both packages provide a `bmad` command:
- `bmad-method` → Official BMAD
- `@znsmtd/framework` → ZNS-METHOD

The official one takes precedence since it was installed later.

---

## 💡 Recommendations

### For This Project (QA Dashboard)

Since you're in **Phase 4: Implementation**, focus on these agents:

1. **Developer** (`dev.agent.yaml`) - For feature implementation
2. **Test Architect** (`tea.agent.yaml`) - For test strategy
3. **Architect** (`architect.agent.yaml`) - For system improvements
4. **Quick Flow Dev** (`quick-flow-solo-dev.agent.yaml`) - For bug fixes

### Best Approach

Use the **official BMAD agents** via Claude Code:
- Agents have deep domain expertise
- Workflows are battle-tested
- Full BMAD methodology support

Keep **ZNS-METHOD** for:
- CLI utilities (`npx znsmtd status`)
- Alternative agents if needed

---

## 📚 Resources

- **Official BMAD Docs:** `node_modules/bmad-method/docs/`
- **Quick Start:** `node_modules/bmad-method/docs/modules/bmm-bmad-method/quick-start.md`
- **Agents Guide:** `node_modules/bmad-method/docs/modules/bmm-bmad-method/agents-guide.md`
- **GitHub:** https://github.com/bmad-code-org/BMAD-METHOD
- **Discord:** https://discord.gg/gk8jAdXWmj

---

## ✅ Next Steps

1. Try the `/bmad` slash commands in Claude Code
2. Read agent documentation: `node_modules/bmad-method/docs/modules/bmm-bmad-method/agents-guide.md`
3. Explore workflows for your current phase
4. Customize agents as needed

**Status:** ✅ Both BMAD implementations installed and ready to use!
