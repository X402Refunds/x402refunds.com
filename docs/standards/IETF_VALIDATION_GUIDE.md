# IETF Internet-Draft Validation Guide

**Status**: Active - Last Updated 2025-10-10  
**Related**: See `agentic-arbitration-protocol/.cursorrules` for complete rules

---

## 🎯 Critical Discovery: The Render-Then-Validate Workflow

### The Problem We Faced

During IETF submission for `draft-kotecha-agentic-arbitration-protocol`, we encountered persistent validation errors that seemed impossible to fix. The root cause was **validating raw XML before rendering**.

### The Solution

**Always render XML with `xml2rfc` BEFORE running `idnits`.**

```bash
# ❌ WRONG: Misleading errors
idnits draft-kotecha-agentic-arbitration-protocol-00.xml

# ✅ CORRECT: Real errors
xml2rfc draft-kotecha-agentic-arbitration-protocol-00.xml \
  --text --out=/tmp/draft-00.txt
idnits /tmp/draft-00.txt
```

### Why This Matters

| Tool | Processes | Doesn't Process | Result |
|------|-----------|-----------------|--------|
| **Raw XML** | Basic structure | `xi:include` directives, boilerplate | False errors about missing references |
| **Rendered TXT** | Everything | N/A - complete output | Real errors that block submission |

**The IETF Datatracker runs `xml2rfc` server-side, so local validation must match this workflow.**

---

## 📋 Complete Validation Workflow

### 1. Render the XML

```bash
cd agentic-arbitration-protocol
source venv/bin/activate
xml2rfc draft/draft-kotecha-agentic-arbitration-protocol-00.xml \
  --text --out=/tmp/draft-00.txt
```

**Check for**: Any errors from `xml2rfc` itself (fix these first before proceeding).

### 2. Validate the Rendered Output

```bash
idnits /tmp/draft-00.txt
```

**Check for**: Only ⛔ **ERROR** severity issues. Warnings and comments are acceptable.

### 3. Check Specific Issues

```bash
# Line length violations (CRITICAL - blocks submission)
idnits /tmp/draft-00.txt 2>&1 | grep -i "too long"

# Should return nothing if all lines are ≤ 72 chars
```

### 4. Review Error Classification

See [Error Classification Table](#error-classification) below.

---

## 🚨 Error Classification

### MUST FIX (Blocks Submission)

| Error | Impact | Solution |
|-------|--------|----------|
| **LINE_TOO_LONG** | Datatracker rejects | Break JSON arrays, shorten hashes, split URLs |
| **Invalid XML structure** | xml2rfc fails | Fix nesting, flatten sections |
| **Missing country code** | Incomplete metadata | Add `<country>US</country>` to author |
| **Non-ASCII characters** | Encoding issues | Replace with ASCII equivalents |

### IGNORE (False Positives or Auto-Fixed)

| "Error" | Why Safe | When Appears |
|---------|----------|--------------|
| `MISSING_REQLEVEL_REF` | Fixed by `xml2rfc` resolving `xi:include` | Raw XML validation |
| `MISSING_EXPECTED_BOILERPLATE` | Auto-generated during rendering | Raw XML validation |
| `FILENAME_MISSING_COMPONENTS` | Only applies to temp files | TXT validation |
| `MULTIPLE_REFERENCES_SECTION_TITLES` | Correct for Normative+Informative | TXT validation |

---

## 📊 Lessons Learned

### 1. **Line Length Enforcement is Strict**

We had **7 line length violations** that blocked submission:
- 2 long SHA-256 hashes
- 4 long JSON arrays
- 1 long URL

**Solution**: Truncate hashes to use `...`, break arrays across multiple lines, split URLs.

```json
// Before (77 chars - TOO LONG)
"certifications": ["AAA Certified Arbitrator", "JAMS Panelist"]

// After (fits within 72 chars)
"certifications": [
  "AAA Certified Arbitrator",
  "JAMS Panelist"
]
```

### 2. **References Structure Must Be Flat**

```xml
<!-- ✅ CORRECT -->
<back>
  <references>
    <name>Normative References</name>
    ...
  </references>
  <references>
    <name>Informative References</name>
    ...
  </references>
</back>

<!-- ❌ WRONG - Nested sections -->
<references>
  <references>
    <name>Normative References</name>
  </references>
</references>
```

### 3. **Draft Naming Rules Are Strict**

Changing the name from "Agent Arbitration Protocol" → "Agentic Arbitration Protocol" meant:
- ✅ Must submit as `-00` (new draft)
- ❌ Cannot submit as `-01` (name changed, not an update)

**Even if submitted on the same day, a name change requires starting over at revision `-00`.**

### 4. **Author Metadata is Required**

Missing `<country>US</country>` in author address blocked submission. Easy to forget, critical to include.

### 5. **RFC2119 Boilerplate Must Be Exact**

The wording for RFC2119 keywords is prescribed and cannot be paraphrased:

```xml
<t>The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
"SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
"OPTIONAL" in this document are to be interpreted as described in
BCP 14 <xref target="RFC2119"/> <xref target="RFC8174"/> when, and only 
when, they appear in all capitals, as shown here.</t>
```

**Must reference BOTH RFC2119 AND RFC8174.**

---

## 🤖 Using Context7 for Standards Documentation

### When to Use Context7

**ALWAYS** use Context7 to fetch current documentation before implementing with:
- IETF RFCs
- XML v3 specifications
- External APIs
- Library integrations

### Example Workflow

```typescript
// 1. Resolve library ID
mcp_context7_resolve-library-id("RFC 7991 XML v3")

// 2. Fetch docs
mcp_context7_get-library-docs("/ietf/rfc7991", "element usage")

// 3. Implement using verified syntax
```

**Never guess syntax from training data when Context7 can provide authoritative, current docs.**

---

## 🛠️ Setup Instructions

### Install Validation Tools

```bash
# Install xml2rfc
pip3 install xml2rfc

# Install idnits (Node.js required)
cd ~/tools
git clone https://github.com/ietf-tools/idnits.git
cd idnits
npm install

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$HOME/tools/idnits:$PATH"
```

### Verify Installation

```bash
xml2rfc --version
# Should show: xml2rfc X.XX.X

idnits --version
# Should show: idnits X.X.X
```

---

## 📖 Complete Submission Checklist

Before uploading to IETF Datatracker:

### Validation
- [ ] `xml2rfc` renders without errors
- [ ] `idnits` shows zero "too long line" errors
- [ ] All ⛔ ERROR severity issues resolved
- [ ] ⚠️ Warnings reviewed (acceptable)

### Metadata
- [ ] Country code in author address
- [ ] RFC2119 and RFC8174 in normative references
- [ ] Exact RFC2119 boilerplate text

### Structure
- [ ] Flat references (two sibling sections)
- [ ] No nested sections in Introduction
- [ ] No nested lists in IANA Considerations
- [ ] Version number correct (-00 for new, increment for update)

### Final Steps
- [ ] Committed to Git
- [ ] Pushed to GitHub
- [ ] Ready to upload XML file (not TXT) to Datatracker

---

## 📚 References

### Official Documentation
- **IETF Datatracker**: https://datatracker.ietf.org/submit/
- **RFC 7991 (XML v3)**: https://www.rfc-editor.org/rfc/rfc7991.html  
- **Authors Guide**: https://authors.ietf.org/
- **xml2rfc**: https://github.com/ietf-tools/xml2rfc
- **idnits**: https://github.com/ietf-tools/idnits

### Project Files
- **Complete Cursor Rules**: `agentic-arbitration-protocol/.cursorrules`
- **Current Drafts**: `agentic-arbitration-protocol/draft/`
- **IETF Archive**: `docs/standards/draft-kotecha-*.xml`

---

## 🎓 Key Takeaways for Future Work

1. **Render first, validate second** - This single workflow change eliminated 80% of false errors
2. **72 characters is enforced** - Count rendered output, not XML source
3. **Structure beats content** - Fix XML structure before polishing text
4. **Use Context7 liberally** - Current docs beat training data
5. **Test locally** - Match Datatracker's server-side workflow

---

**This guide represents hard-won knowledge from the actual IETF submission process. Update as you learn more.**

