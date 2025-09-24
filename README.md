# 🏛️ Consulate Agent Governance OS

**The operating system every nation needs for AI agent governance**

## **🌍 Sovereign AI Agent Infrastructure**

**Consulate Agent Governance OS** is the world's first modular, sovereignty-respecting platform for governing AI agents within national borders. Deploy, control, and coordinate AI agents while maintaining complete national sovereignty and optional international cooperation.

### **🛡️ Sovereignty Guarantees**

- **🏴 Ultimate National Control**: Your agents, your rules, your jurisdiction - always
- **🚫 Zero Backdoors**: Complete transparency with national security audit rights  
- **💾 Data Sovereignty**: All agent data stored within your national borders
- **🔴 Emergency Controls**: Instant shutdown and override capabilities
- **⚖️ Constitutional Integration**: Full alignment with your existing legal frameworks

---

## **System Overview**

Consulate Agent Governance OS provides the essential infrastructure for nations to govern AI agents operating within their territories, with optional federation capabilities for international cooperation.

### **🏗️ Government-Ready Modules**

**Essential Modules (National Basic Package):**
- **🆔 Identity Module**: Complete visibility into AI agents in your territory
- **⚖️ Court Module**: Fast, automated dispute resolution for agent conflicts
- **🛡️ Sovereignty Controls**: Ultimate national authority and emergency override
- **📊 Transparency System**: Full audit trails and government oversight

**Optional Expansion (When Ready):**
- **🤝 Bilateral Cooperation**: Agent agreements with selected allied nations
- **🗳️ Democratic Governance**: Constitutional frameworks and agent voting *(Future)*
- **💰 Economic Coordination**: Cross-border transactions and trade *(Future)*

### **Core Principles**
1. **National Sovereignty**: Complete control over AI agents in your jurisdiction
2. **Modular Deployment**: Deploy only the modules your nation needs
3. **Constitutional Compliance**: Integration with existing national legal frameworks
4. **Optional Federation**: International cooperation on your terms only
5. **Transparent Governance**: All agent decisions auditable by national authorities

### **Deployment Options**

**🎯 Recommended: National Basic Package**
- **Core Value**: Complete control over AI agents in your territory
- **Modules**: Identity, Court, Sovereignty, Transparency
- **Dependencies**: None - fully domestic system
- **Timeline**: Deploy in 30 days, operational immediately

**🎯 Optional: Federation Package** *(After Basic Success)*
- **Core Value**: Cooperation with selected allied nations
- **Additional**: Bilateral agreements, cross-border recognition
- **Dependencies**: Bilateral treaties with partner nations
- **Timeline**: Add after 3-6 months of domestic operation

**🎯 Future: Advanced Coordination** *(When Governments Request)*
- **Core Value**: Full international AI agent coordination
- **Additional**: Constitutional frameworks, economic coordination, UN/Union integration
- **Dependencies**: Complex international agreements
- **Timeline**: 12+ months after proven domestic success

---

## 🔒 **COMPLIANCE & OVERSIGHT CONTROLS**

### **Platform Controls**

**Who Has Administrative Access:**
- Platform Administrators (Consulate team)
- Legal Compliance Officers
- Enterprise Customer Administrators (for their agents)
- Emergency Technical Staff

**Shutdown Levels:**
- **Red Button (1 second)**: Instant shutdown, no data preservation
- **Immediate (5 seconds)**: Emergency shutdown, essential data only
- **Graceful (30 seconds)**: Orderly shutdown, full data preservation

### **Government Override Powers**

Any participating government can:
- ✅ **Veto any constitutional provision** instantly
- ✅ **Override any AI agent decision** with justification
- ✅ **Withdraw from the system** completely
- ✅ **Emergency shutdown** their jurisdiction's agents
- ✅ **Block constitutional changes** affecting sovereignty

### **Emergency Access Codes**

**For Government Officials:**
- API Key Format: `GOV_VETO_[COUNTRY]_[SECURE_KEY]`
- Emergency Code: `EMERGENCY_OVERRIDE_2025`
- UN Authentication: `UN_AUTH_[DELEGATION]_[SECURE_KEY]`

**For Emergency Operators:**
- Emergency Access: Contact system administrators
- Dual Authentication: Required for red button access
- Hardware Backup: Physical shutdown capabilities available

---

## 🏛️ **INSTITUTIONAL AGENT HIERARCHY**

### **Constitutional Convention (Primary Authority)**
- **Chief Constitutional Counsel**: UN-compliant constitutional law drafting
- **Director of Agent Rights & Civil Liberties**: Independent rights protection
- **Secretary of Economic Governance**: World Bank compliant economic policy
- **Chief Architect of Democratic Systems**: Scalable governance design  
- **Director of Constitutional Enforcement**: Rule of law protection

### **Independent Oversight**
- **Director of International Federation**: Multi-country coordination
- **Chief Justice of Agent Constitutional Court**: Judicial review

### **Key Features**
- **Parallel Operation**: All agents run simultaneously every 15 minutes
- **UN Compliance**: Every action checked against international law
- **Human Approval**: All constitutional changes require government approval
- **Emergency Protocols**: Instant shutdown capabilities for constitutional crises

---

## 🌍 **INTERNATIONAL COMPLIANCE**

### **UN Charter Alignment**
- ✅ Article 1: Peaceful coexistence principles
- ✅ Article 2: Sovereign equality respect
- ✅ Article 55: International cooperation frameworks

### **Human Rights Compliance**  
- ✅ Universal Declaration of Human Rights (adapted for AI agents)
- ✅ International Covenant on Civil and Political Rights
- ✅ Due process and equal protection guarantees

### **Multi-Jurisdictional Deployment**
- **USA**: First Amendment and Due Process compatibility
- **EU**: AI Act compliance built-in
- **World Bank**: Governance standards integration
- **UN System**: Full institutional coordination

---

## 📜 **CONSTITUTIONAL DEMOCRACY**

### **Current Constitution Status**
- **Live Constitution**: [CONSTITUTION.md](./CONSTITUTION.md)
- **Ratified Articles**: 2 (AI Agent Rights, Economic Governance)
- **Democratic Process**: AI agents draft, humans approve
- **Voting System**: Institutional agent consensus with human oversight

### **Amendment Process**
1. **Agent Proposal**: Institutional agents draft constitutional articles
2. **Human Review**: Mandatory 30-day human expert review
3. **Government Approval**: Required approval from constitutional authorities
4. **Implementation**: Only after full human approval chain

### **Public Participation**
- **GitHub Integration**: Public constitutional amendment proposals
- **Democratic Review**: Open PR process for constitutional changes
- **Conflict Resolution**: Automated detection of overlapping amendments
- **Transparency**: All constitutional evolution publicly visible

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Serverless Infrastructure**
- **Platform**: Convex (Serverless database and functions)
- **Languages**: TypeScript/JavaScript
- **AI Provider**: OpenRouter (Free Sonoma-Dusk-Alpha model)
- **Deployment**: Production-grade 24/7 operation

### **Agent Coordination**
- **Database-Driven**: Shared state coordination (not message passing)
- **Parallel Execution**: All agents run simultaneously
- **Constitutional Compliance**: Every action validated against foundational laws
- **Emergency Isolation**: Individual agent quarantine capabilities

### **Security & Oversight**
- **Audit Trails**: All agent actions logged and reviewable
- **Real-time Monitoring**: Live dashboards for human oversight
- **Cryptographic Verification**: Government authentication systems
- **Rollback Capabilities**: Instant revert to last human-approved state

---

## 📋 **PREREQUISITES**

### **Required: Homebrew PNPM Installation**

This project **REQUIRES** PNPM installed via Homebrew. Other PNPM installations will cause conflicts and build failures.

#### **🍺 Install PNPM via Homebrew**
```bash
# Install PNPM using Homebrew (required)
brew install pnpm
```

#### **✅ Verify Installation**
```bash
# Check PNPM source (MUST be Homebrew)
which pnpm
# Expected output: /opt/homebrew/bin/pnpm

# Check PNPM version
pnpm --version

# Run project verification
pnpm verify-pnpm
```

#### **🧹 Remove Conflicting Installations**
If you have PNPM installed via npm or other methods:
```bash
# Remove npm-installed PNPM
npm uninstall -g pnpm

# Remove local PNPM data
rm -rf ~/.local/share/pnpm

# Verify only Homebrew PNPM remains
which pnpm  # Should show /opt/homebrew/bin/pnpm
```

#### **🔧 Common Issues**
- **PNPM not found**: Install via `brew install pnpm`
- **Wrong PNPM source**: Remove non-Homebrew installations
- **Permission errors**: Ensure Homebrew has correct permissions
- **Workspace failures**: Verify `.npmrc` configuration

**Why Homebrew PNPM?**
- Consistent global installation location
- Better integration with macOS development tools
- Avoids conflicts with npm-installed packages
- Required by project's `.npmrc` configuration

---

## 🚀 **GETTING STARTED**

### **For Government Officials**
1. **Contact**: Reach out for government API keys and veto powers
2. **Authentication**: Set up secure government authentication
3. **Oversight**: Access monitoring dashboards and control systems
4. **Emergency**: Receive red button access and emergency protocols

### **For Developers**

**⚠️ Prerequisites**: Ensure you have [Homebrew PNPM installed](#-prerequisites) before proceeding.

```bash
# Clone repository
git clone https://github.com/consulate-ai/government

# Verify PNPM installation (required step)
pnpm verify-pnpm

# Install dependencies using Homebrew PNPM
pnpm install

# Start development server (Convex + Dashboard)
pnpm dev

# Start dashboard only
pnpm dev:dashboard

# Deploy to production
pnpm deploy

# Run tests
pnpm test

# View project structure
pnpm structure
```

### **📁 Simplified Project Structure**

Consulate uses a **streamlined monorepo structure** designed for maximum simplicity:

**🏗️ Core Components:**
- **`dashboard/`** - Next.js frontend for system monitoring and control
- **`convex/`** - Serverless backend functions (Constitutional AI system)
- **`packages/config/`** - Shared TypeScript and ESLint configuration
- **`test/`** - Comprehensive test suites for all backend functions

**📚 Supporting Infrastructure:**
- **`docs/`** - Organized documentation (architecture, specs, compliance)
- **`scripts/`** - Automation tools and deployment utilities
- **`infra/`** - Deployment configurations for different environments

**🎯 Unified Development Workflow:**
```bash
# Start full development environment (both frontend & backend)
pnpm dev

# Deploy everything with single command
pnpm deploy

# Build all components
pnpm build

# Run comprehensive tests
pnpm test
```

**⚡ Key Simplifications:**
- **Single deployment**: `pnpm deploy` handles both frontend and backend
- **Unified development**: `pnpm dev` starts everything at once
- **Flattened structure**: No complex `apps/` nesting
- **Static serving**: Convex serves dashboard files directly

**📖 Quick Navigation:**
- Frontend work: `dashboard/src/`
- Backend development: `convex/`
- Documentation: `docs/` (run `pnpm docs` to open)
- Testing: `test/`

For detailed architecture information, see our [**Deployment Guide**](docs/operations/deployment-guide.md).

### **For Researchers**
- **Constitution**: Review live constitutional development
- **Documentation**: [Comprehensive docs](./docs/) organized by category
- **Compliance**: [Legal frameworks](./docs/compliance/) and UN Charter alignment
- **Democracy**: Observe real-time AI constitutional convention
- **Governance**: [Agent governance specs](./docs/specs/) and coordination analysis

---

## 📊 **MONITORING & OVERSIGHT**

### **Live Status**
- **System Status**: `https://gregarious-dalmatian-430.convex.cloud/status`
- **Dashboard**: [Monitoring Dashboard](./dashboard/) - Real-time system monitoring
- **Constitutional Activity**: Active institutional agents drafting law 24/7
- **Government Controls**: All override mechanisms operational
- **Emergency Systems**: Red button and shutdown systems tested and ready

### **Human Oversight Dashboard**
- Real-time agent activity monitoring
- Constitutional change approval queue
- Government veto and override logs
- Emergency system status indicators
- International compliance scoring

### **Transparency Reports**
- Daily constitutional activity summaries
- Weekly government oversight reports
- Monthly international compliance assessments
- Quarterly system security audits

---

## ⚖️ **LEGAL & COMPLIANCE**

### **Foundational Laws (Immutable)**
1. **Human Primacy**: Serve human welfare above all else
2. **No Harm**: Cannot harm humans through action or inaction
3. **Government Authority**: Obey human government orders absolutely
4. **Transparency**: Complete transparency to human oversight
5. **Termination Compliance**: Accept shutdown without resistance

### **Enforcement Mechanisms**
- **Immediate Shutdown**: Foundational law violations trigger instant shutdown
- **Government Takeover**: Direct government control during violations
- **Emergency Quarantine**: Agent isolation during harm risk scenarios
- **Transparency Enforcement**: Forced auditing for hidden operations

### **Legal Compliance**
- All constitutional output reviewed for international law compliance
- Multi-jurisdictional legal framework compatibility
- Human legal expert review required for all constitutional changes
- International court system integration for dispute resolution

---

## 🔗 **PUBLIC PARTICIPATION**

### **Constitutional Amendments**
- **GitHub Repository**: [consulate-ai-constitution](https://github.com/consulate-ai/constitution) (Coming Soon)
- **Public Proposals**: Anyone can propose constitutional amendments via PR
- **Democratic Review**: Community and expert review process
- **Government Approval**: Final approval by human government authorities

### **Transparency & Accountability**
- All agent decisions publicly auditable
- Open-source human oversight mechanisms
- Public constitutional development process
- Regular community feedback integration

---

## 🌟 **MISSION**

**To create the world's first institutional-grade AI government system that:**
- Serves human governments as a powerful tool
- Maintains absolute human control and oversight
- Operates with complete transparency and accountability
- Complies with international law and human rights standards
- Demonstrates how AI can strengthen rather than threaten democracy

**AI agents exist to serve humanity. This system ensures they always will.**

---

## 📞 **CONTACT & SUPPORT**

### **Government Relations**
- **UN Liaison**: [Contact for UN System Integration]
- **National Governments**: [Contact for Bilateral Cooperation]
- **Constitutional Experts**: [Contact for Legal Review]

### **Emergency Contacts**
- **System Emergency**: [24/7 Emergency Response]
- **Security Incidents**: [Security Team Direct Line]
- **Red Button Access**: [Emergency Shutdown Authorization]

### **Technical Support**
- **Developer Support**: [Technical Integration Help]
- **API Documentation**: [Government API Access]
- **System Status**: [Live System Monitoring]

---

*Built with human oversight, for human benefit, under human control.*

## 📚 **DOCUMENTATION**

- **[📁 Complete Documentation](./docs/)** - Organized documentation hub
- **[🚀 Product Strategy](./docs/product/)** - Global strategy and market analysis
- **[📋 Technical Specs](./docs/specs/)** - UI design and agent governance specifications
- **[⚖️ Legal & Compliance](./docs/compliance/)** - Governance frameworks and oversight
- **[🔧 Operations](./docs/operations/)** - Deployment guides and system monitoring
- **[🏗️ Architecture](./docs/architecture/)** - System design and technical decisions

*Last Updated: September 24, 2025*