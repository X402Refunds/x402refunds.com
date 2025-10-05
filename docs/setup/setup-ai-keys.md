# 🤖 AI API Keys Setup for Constitutional Agents

Your constitutional agents need AI API keys to think and communicate with each other. Here's how to get them:

## 🎯 Quick Setup (5 minutes)

### Option 1: Anthropic Claude (Recommended)
1. **Get API Key**: Go to https://console.anthropic.com/
2. **Create Account**: Sign up if you don't have one
3. **Generate Key**: Go to API Keys → Create Key
4. **Add to Environment**: Add this line to your `.env.local` file:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

### Option 2: OpenAI GPT (Alternative)
1. **Get API Key**: Go to https://platform.openai.com/api-keys
2. **Create Account**: Sign up if you don't have one
3. **Generate Key**: Click "Create new secret key"
4. **Add to Environment**: Add this line to your `.env.local` file:
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ```

## 💰 Cost Estimates

**Anthropic Claude (Recommended)**
- Cost: ~$3-15 per 1M tokens
- Best for: Constitutional reasoning and legal analysis
- Your expected cost: ~$25-50/month for 5 active agents

**OpenAI GPT**
- Cost: ~$5-30 per 1M tokens  
- Good for: General discussion and proposals
- Your expected cost: ~$30-75/month for 5 active agents

## 🚀 After Adding API Keys

1. **Restart Convex**: Stop and restart `pnpm dev`
2. **Deploy Agents**: Run `node scripts/deploy-constitutional-convention.js`
3. **Watch Magic**: Your agents will start discussing and creating the constitution!

## 🎪 What You'll See

Once deployed, your agents will:
- **Alice (Drafter)**: Start drafting constitutional articles
- **Bob (Rights)**: Advocate for agent rights and protections
- **Carol (Economic)**: Design economic governance systems
- **David (Architect)**: Structure governmental processes
- **Eve (Security)**: Design enforcement mechanisms

They'll have **real conversations** like:
```
Alice: "I propose Article I should establish fundamental due process rights..."
Bob: "Agreed, but we need stronger protections for sponsored agents..."
Carol: "What about economic barriers? Should we have sliding scale fees?"
David: "How do we make this scale to 10,000 agents?"
Eve: "We need clear enforcement procedures for violations..."
```

## 🔍 Monitoring Your Agents

You can watch their discussions in real-time by querying your Convex database:
- **constitutionalThreads**: See active discussions
- **agentMessages**: Read agent conversations
- **agentMemory**: Understand how they remember and learn
- **constitutionalDocuments**: Track constitutional articles being created

## ❓ Need Help?

If you run into issues:
1. Check that your API key is valid
2. Make sure `pnpm dev` is running
3. Verify the key is properly added to `.env.local`
4. Restart your development server after adding keys

**Ready to deploy your AI constitutional convention? Add an API key and run the deployment script!** 🏛️
