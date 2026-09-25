import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, Info } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';

export const AITutor = () => {
  const [inputMessage, setInputMessage] = useState('');

  return (
    <div>
      <PageHeader
        title="AI Study Tutor"
        subtitle="Context-bounded academic study assistant grounded strictly in your syllabus topics."
        badge={<Badge variant="purple">Phase 1 Preview</Badge>}
      />

      <div className="max-w-3xl mx-auto space-y-4">
        {/* Phase Warning Banner */}
        <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900">
            <p className="font-semibold">Backend AI Integration Pending (Phase 10)</p>
            <p className="text-indigo-700 mt-0.5 leading-relaxed">
              In accordance with Phase 1 rules, the Gemini API is isolated to the backend and will be activated in Phase 10. Below is the interactive chat UI layout foundation.
            </p>
          </div>
        </div>

        {/* Chat Conversation Box */}
        <Card className="flex flex-col h-[480px]">
          <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-xs font-semibold">Tutor Context: Database Management Systems</CardTitle>
            </div>
            <Badge variant="neutral" size="sm">Topic: Normalization & BCNF</Badge>
          </CardHeader>

          {/* Messages Stream */}
          <CardContent className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Student Message Example */}
            <div className="flex items-start gap-3 justify-end">
              <div className="max-w-md bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs leading-relaxed shadow-sm">
                Can you explain why BCNF is considered stricter than 3NF with a simple table example?
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-700 text-xs font-bold">
                RS
              </div>
            </div>

            {/* AI Assistant Message Example */}
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="max-w-lg bg-slate-100/90 text-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 text-xs leading-relaxed space-y-2 border border-slate-200/60">
                <p className="font-semibold text-slate-900">
                  Great question! In 3NF, a functional dependency X &rarr; Y is allowed if Y is a prime attribute (part of any candidate key), even if X is not a candidate key.
                </p>
                <p>
                  <strong>BCNF removes this exception:</strong> In BCNF, for every non-trivial functional dependency X &rarr; Y, X <em>must</em> be a candidate key (superkey).
                </p>
              </div>
            </div>
          </CardContent>

          {/* Input Box Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask an academic question about your current topic..."
              className="flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled
            />
            <Button size="sm" icon={Send} disabled>
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AITutor;
