# 🚨 sosAI - AI-powered Real-Time Emergency Call Assistant

`sosAI` enhances emergency call handling by leveraging AI to **transcribe, analyze, and assist dispatchers in real time**. It provides live translations, AI-generated response suggestions, and smart question prompts—helping emergency services respond faster and more accurately.

---

## ✨ Key Features

✅ **Live Call Transcription**  
- Real-time speech-to-text with live updates  
- Automatic translation indicators when multiple languages are detected  

✅ **AI Suggestions Panel**  
- Prioritized advice & warnings for the dispatcher  
- Relevant emergency protocols surfaced instantly  

✅ **Smart Question Suggestions**  
- Dynamic question prompts based on call context  
- Categorized by importance (critical → optional)  

✅ **Call Status Tracking**  
- Displays call duration, detected language, and caller location  
- Tracks call flow for better situational awareness  

✅ **Real-Time System Simulation**  
- Simulates incoming messages & activity for demo purposes  
- Shows how the AI interacts with live emergency data  

✅ **Faster Emergency Service Requests**  
- AI assists in dispatching relevant services more precisely  
- Reduces decision-making time for operators  

---

## 🛠️ Tech Stack

- **[Anthropic Claude API](https://www.anthropic.com/)** → AI reasoning, decision support & protocol generation  
- **[OpenAI Whisper](https://openai.com/research/whisper)** → High-accuracy voice recognition & transcription  
- **[Lovable](https://lovable.dev/)** → Rapid frontend generation (TypeScript)

---

## 🚀 How It Works

1. **Voice Input** → Whisper transcribes incoming emergency calls in real-time.  
2. **AI Analysis** → Claude processes the transcript, detects critical info, suggests next steps.  
3. **Smart UI** → The Lovable-generated frontend displays live transcription, AI suggestions, and key metadata (location, language, duration).  
4. **Faster Dispatch** → Operator receives prioritized info & can request emergency services more accurately.

---

## 💻 Setup & Installation

> **Note:** This project was built during a hackathon and may require API keys for Claude & Whisper.

```bash
# 1. Clone the repository
git clone https://github.com/epanner/shipfast-hack-25
cd shipfast-hack-25

# 2. Install dependencies
npm install

# 3. Add API keys
cp .env.example .env
# Fill in your Anthropic & OpenAI API keys

# 4. Run the development server
npm run dev
