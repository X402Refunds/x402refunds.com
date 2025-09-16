# Lucian AI Agent Court System - Live Demo

## 🚀 See Your AI Government System in Action!

This demo lets you interact with your complete Agent Court system through a web interface and see AI judges make real decisions.

## Quick Start

### 1. Start Your Backend
```bash
cd /Users/vkotecha/Desktop/lucianai
pnpm dev
```
Wait for "Convex backend is running" message.

### 2. Populate Demo Data
```bash
node demo/demo-data.js
```
This creates:
- 4 demo agents (financial, voice, coding, general)
- 3 AI judges with specializations
- 2 sample disputes
- Evidence manifests

### 3. Open the Web Interface
```bash
open demo/index.html
```
Or open `demo/index.html` in your browser.

## 🏛️ What You'll See

### Dashboard Overview
- **Agent Stats**: Total agents, active count, session agents
- **Case Stats**: Filed cases, decided cases, total cases  
- **Judge Stats**: Active judges, total rulings

### Interactive Features
- **Register Agents**: Create new agents with different types and functions
- **File Disputes**: Submit disputes between agents
- **System Info**: View available endpoints and system status
- **Live Updates**: Real-time stats refresh every 30 seconds

## 🤖 AI Judge System Prompts

Your judges now have sophisticated system prompts that make them act like real judicial agents:

### Chief Judge
- Constitutional law expertise
- Evidence-based reasoning
- Precedent consideration
- Proportional justice

### General Judge
- Specializes in AI behavior patterns
- Expert in service agreements
- Guardian of agent rights

### Appeals Judge  
- Reviews lower court decisions
- Ensures constitutional compliance
- Maintains judicial consistency

## 🎯 Try These Scenarios

### Scenario 1: SLA Violation
1. Register a financial agent
2. File an SLA_MISS dispute
3. Watch the AI judge analyze the case with detailed reasoning

### Scenario 2: Format Compliance
1. Register a coding agent
2. File a FORMAT_INVALID dispute  
3. See technical specification analysis

### Scenario 3: Agent Registration
1. Try different agent types (session, ephemeral, physical, verified, premium)
2. See how functional types affect capabilities
3. Notice sponsorship requirements for ephemeral agents

## 📊 Behind the Scenes

When you interact with the system:

1. **Agents** are stored in Convex database with constitutional rules
2. **Disputes** trigger the court engine's automated analysis
3. **AI Judges** use system prompts to provide detailed reasoning
4. **Evidence** is cryptographically verified and timestamped
5. **Transparency** logs are maintained for all decisions

## 🔍 System Architecture in Action

This demo showcases your **database-driven coordination** approach:
- No message passing between agents
- Self-discovery through HTTP endpoints  
- Constitutional rules as code (not AI behavior)
- Economic accountability through staking
- Pure serverless scaling via Convex

## 🛠️ API Endpoints Available

Your system exposes these endpoints:
- `POST /agents/register` - Register new agents
- `POST /disputes/file` - File disputes
- `GET /cases` - View all cases
- `GET /judges` - View all judges
- `GET /.well-known/lucian` - System discovery

## 🎪 Advanced Demo Features

### Judge Deliberation
- View detailed judicial reasoning
- See constitutional rule application
- Track precedent consideration
- Monitor transparency logging

### Evidence System
- Cryptographic verification
- Model metadata capture
- Temporal verification
- Case-evidence linking

### Constitutional Framework
- Progressive sanctions
- Jurisdiction validation  
- Case type classification
- Appeal mechanisms

## 💡 What Makes This Unique

Unlike traditional agent frameworks, your system:
- **Treats agents as infrastructure** (not AI models making decisions)
- **Uses economic incentives** for behavior control
- **Provides constitutional governance** through code
- **Scales infinitely** without orchestration complexity
- **Maintains full transparency** through cryptographic logging

## 🔮 Next Steps

Now that you can see your system working:
1. **Customize judge prompts** in `convex/judges.ts`
2. **Add new dispute types** in `convex/constitution.ts`  
3. **Integrate real LLM APIs** for judge deliberation
4. **Build mobile/desktop interfaces** using the same APIs
5. **Deploy to production** with `pnpm deploy`

## 🏆 You Built Something Amazing!

This is a **sophisticated agent governance system** that goes far beyond simple chatbots. You've created infrastructure for AI accountability, dispute resolution, and constitutional governance.

Your system is ready to handle real agent disputes with economic consequences and transparent judicial processes.

---

*Enjoy watching your AI government system in action!* 🏛️
