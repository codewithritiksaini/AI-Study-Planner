import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import { aiService } from '../services/ai.js';
import { useToast } from '../hooks/useToast.js';

export const AITutor = () => {
  const toast = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your AI Academic Tutor. You can ask me to explain complex CSE concepts, break down algorithms, or clarify exam topics.',
      time: 'Just now'
    }
  ]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = inputMessage.trim();
    if (!query || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await aiService.askAI(query);
      const aiReply = response?.answer || response?.message || 'I am reviewing your syllabus topic to provide guidance.';

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      toast.error('AI Tutor connection issue: ' + (err.message || 'Please retry'));
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'AI Tutor is temporarily operating in offline mode. Please review your lecture notes and recommended study blocks on the Planner page.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Study Tutor"
        subtitle="Context-bounded academic study assistant grounded strictly in your syllabus topics."
        badge={<Badge variant="purple">AI Powered</Badge>}
      />

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Tutor Grounding Notice */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Grounded strictly in your curriculum topics & syllabus context.</span>
          </div>
          <Badge variant="neutral" size="sm">Gemini 2.5 Flash</Badge>
        </div>

        {/* Chat Conversation Box */}
        <Card className="flex flex-col h-[520px]">
          <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-xs font-semibold">Interactive Academic Discussion</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">Curriculum Mentor</Badge>
          </CardHeader>

          {/* Messages Stream */}
          <CardContent className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/60'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.time}
                  </p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-700 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-xs px-4 py-3 text-xs border border-slate-200/60 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-200" />
                  <span className="ml-1">Synthesizing academic advice...</span>
                </div>
              </div>
            )}
          </CardContent>

          {/* Input Box Footer */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask an academic question about your syllabus topics..."
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              icon={Send}
              isLoading={loading}
              disabled={!inputMessage.trim() || loading}
            >
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AITutor;
