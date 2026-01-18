# Realtime Voice Interview System

## Overview

The Chorus platform now supports fully conversational voice interviews powered by OpenAI's Realtime API. This creates a natural, flowing conversation between an AI interviewer and participants.

## Architecture

### Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │ Socket  │   NestJS     │ WebSocket│  Python     │  HTTP   │   OpenAI     │
│   (React)   │◄───────►│   Gateway    │◄────────►│   Agents    │◄───────►│  Realtime    │
└─────────────┘         └──────────────┘         └─────────────┘         │     API      │
                                                         │                └──────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Question   │
                                                  │   Agent     │
                                                  └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │  Quality    │
                                                  │   Agent     │
                                                  └─────────────┘
```

### Components

#### 1. **Python Agents Service** (`apps/agents`)

**New Router: `realtime_interview.py`**
- WebSocket endpoint: `/api/agents/realtime-interview/{session_id}`
- Manages OpenAI Realtime API connection
- Orchestrates interview flow:
  - Fetches questions from question agent
  - Instructs voice model to speak questions
  - Receives participant audio and transcripts
  - Calls quality agent to score responses
  - Manages conversation state and turn-taking

**Key Features:**
- Server-controlled conversation flow
- Automatic question generation based on participant responses
- Real-time quality scoring
- Conversation history tracking
- Session state management

#### 2. **NestJS API** (`apps/api`)

**Updated Gateway: `interviews.gateway.ts`**
- New WebSocket handlers:
  - `start-realtime-interview`: Initialize realtime session
  - `realtime-audio`: Forward audio chunks to agents
  - `end-realtime-interview`: Terminate session
- Proxies messages between frontend and Python agents service
- Manages WebSocket connections and cleanup

**Updated Service: `interviews.service.ts`**
- New method: `startRealtimeInterview(sessionId)`
- Initializes session in database
- Returns session metadata

**Updated Controller: `interviews.controller.ts`**
- New endpoint: `POST /interviews/start-realtime`
- Triggers realtime interview initialization

#### 3. **Frontend** (`apps/web`)

**New Hooks:**

**`useRealtimeInterview.ts`**
- Manages Socket.IO connection to NestJS gateway
- Handles realtime message routing
- Provides callbacks for interview events:
  - `onQuestion`: New question received
  - `onTranscript`: Participant response transcribed
  - `onAudioDelta`: Audio chunk from interviewer
  - `onAudioDone`: Interviewer finished speaking
  - `onInterviewComplete`: Interview ended
  - `onError`: Error occurred

**`useAudioRecorder.ts`**
- Captures microphone input
- Converts audio to PCM16 format (required by OpenAI)
- Streams audio chunks via WebSocket
- Automatic start/stop based on conversation state

**New Component: `RealtimeInterview.tsx`**
- Complete UI for realtime interviews
- Real-time transcript display
- Visual indicators for connection, listening, recording
- Start/stop controls

## How It Works

### Interview Flow

1. **Initialization**
   - Frontend calls `POST /interviews/start-realtime` with sessionId
   - Frontend connects to Socket.IO gateway
   - Gateway establishes WebSocket to Python agents service
   - Agents service connects to OpenAI Realtime API

2. **First Question**
   - Agents service fetches participant data from Supabase
   - Agents service fetches research question from database
   - Agents service uses root question as first question
   - OpenAI Realtime API speaks the question naturally
   - Audio chunks stream back to frontend

3. **Participant Response**
   - Frontend starts recording when question audio finishes
   - Audio chunks stream: Frontend → Gateway → Agents → OpenAI
   - OpenAI transcribes audio in real-time using server-side VAD
   - Transcript sent back when participant stops speaking

4. **Response Processing**
   - Agents service saves Q&A turn to database
   - Quality agent scores the response
   - Agents service calls question agent with updated history
   - Question agent generates next question using GPT-4

5. **Next Question**
   - OpenAI speaks the new question
   - Cycle repeats

6. **Completion**
   - Interview ends when:
     - Maximum questions reached (from study config)
     - User manually ends interview
     - Error occurs
   - Session marked as completed in database
   - Summary generated

## Question Generation Integration

The realtime system **fully integrates** with your existing question agent (`routers/question.py`):

- First question uses the `root_question` from the `research_questions` table
- Follow-up questions generated by calling question agent with:
  - Full conversation history
  - Participant demographics and metadata
  - Study context and research goals
  - Good/bad question examples

This means **you control what the interviewer says** through the question agent's prompts and logic.

## Voice Model Configuration

The system uses OpenAI's Realtime API with these settings:

```python
{
  "modalities": ["text", "audio"],
  "voice": "alloy",  # Can be: alloy, echo, fable, onyx, nova, shimmer
  "input_audio_format": "pcm16",
  "output_audio_format": "pcm16",
  "turn_detection": {
    "type": "server_vad",  # Voice Activity Detection
    "threshold": 0.5,
    "prefix_padding_ms": 300,
    "silence_duration_ms": 500
  },
  "temperature": 0.8
}
```

### Changing Voice

To use a different voice, edit `apps/agents/routers/realtime_interview.py`:

```python
"voice": "nova"  # Options: alloy, echo, fable, onyx, nova, shimmer
```

## Setup Instructions

### 1. Install Dependencies

**Python Agents:**
```bash
cd apps/agents
pip install -r requirements.txt
```

**Frontend:**
```bash
cd apps/web
npm install socket.io-client
```

### 2. Environment Variables

Ensure these are set in `.env.local`:

```bash
# OpenAI API Key (required for Realtime API)
OPENAI_API_KEY=sk-...

# API URLs
AGENTS_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Start Services

**Terminal 1 - Python Agents:**
```bash
cd apps/agents
python main.py
```

**Terminal 2 - NestJS API:**
```bash
cd apps/api
npm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd apps/web
npm run dev
```

## Usage Example

### In Your Interview Page

```tsx
import { RealtimeInterview } from '@/components/RealtimeInterview';

export default function InterviewPage({ params }: { params: { sessionId: string } }) {
  return <RealtimeInterview sessionId={params.sessionId} />;
}
```

### Custom Implementation

```tsx
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

function MyCustomInterview({ sessionId }: { sessionId: string }) {
  const { startInterview, currentQuestion, sendAudio } = useRealtimeInterview({
    sessionId,
    onQuestion: (q) => console.log('New question:', q),
    onTranscript: (t) => console.log('User said:', t),
  });

  const { startRecording } = useAudioRecorder({
    onAudioData: sendAudio,
  });

  return (
    <div>
      <button onClick={startInterview}>Start</button>
      <p>{currentQuestion}</p>
    </div>
  );
}
```

## Database Schema

The system uses existing tables:

- `sessions` - Interview sessions
- `qa_turns` - Question/answer pairs
- `qa_quality_labels` - Quality scores
- `research_questions` - Research questions and context
- `participants` - Participant demographics

## Testing

### Manual Testing

1. Create a session in the database:
```sql
INSERT INTO sessions (study_id, participant_id, status)
VALUES ('your-study-id', 'your-participant-id', 'pending');
```

2. Navigate to the interview page with the session ID

3. Click "Start Interview"

4. Speak your responses naturally

5. Check the transcript display

### Debugging

**Check WebSocket Connections:**
- Frontend console: Look for "Socket.IO connected"
- NestJS logs: Look for "Client connected"
- Python logs: Look for "OpenAI connection established"

**Common Issues:**
- **No audio**: Check microphone permissions
- **Transcript not appearing**: Check OpenAI API key
- **Questions not generating**: Check question agent logs
- **Connection errors**: Ensure all services are running

## Cost Considerations

OpenAI Realtime API pricing (as of 2024):
- Audio input: $0.06 per minute
- Audio output: $0.24 per minute
- Text input: $2.50 per 1M tokens
- Text output: $10.00 per 1M tokens

For a 10-minute interview:
- Approximate cost: $3-5 per interview
- Includes: voice synthesis, transcription, and question generation

## Future Enhancements

Potential improvements:
1. **Interruption Handling**: Allow participants to interrupt the interviewer
2. **Multi-language Support**: Add language detection and translation
3. **Emotion Detection**: Analyze participant tone and adjust questions
4. **Live Dashboard**: Real-time monitoring for researchers
5. **Recording Playback**: Save and replay full audio interviews
6. **Custom Voices**: Train custom voice models for brand alignment

## Troubleshooting

### "OpenAI connection failed"
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API status
- Ensure you have Realtime API access

### "WebSocket connection refused"
- Ensure Python agents service is running on port 8000
- Ensure NestJS API is running on port 3001
- Check CORS settings in both services

### "No microphone access"
- Grant microphone permissions in browser
- Use HTTPS in production (required for getUserMedia)
- Check browser compatibility (Chrome/Edge recommended)

### "Questions not relevant"
- Review question agent prompts in `routers/question.py`
- Check participant demographics in database
- Verify research question context is populated

## Support

For issues or questions:
1. Check application logs (Python, NestJS, Browser console)
2. Review this guide
3. Check OpenAI Realtime API documentation
4. Create an issue in the repository
