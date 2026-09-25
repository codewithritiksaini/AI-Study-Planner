import React from 'react';
import { HelpCircle, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Select from '../components/common/Select.jsx';

export const Quiz = () => {
  return (
    <div>
      <PageHeader
        title="AI Quiz & Topic Mastery"
        subtitle="Test your conceptual understanding with AI-generated multiple-choice questions."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quiz Generator Form */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                <CardTitle className="text-base">Configure Quiz</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Select Subject"
                options={[
                  { value: 'dbms', label: 'Database Management Systems' },
                  { value: 'os', label: 'Operating Systems' },
                  { value: 'cn', label: 'Computer Networks' }
                ]}
              />

              <Select
                label="Select Topic"
                options={[
                  { value: 'bcnf', label: 'BCNF & Normalization' },
                  { value: 'sql', label: 'Complex SQL Queries' },
                  { value: 'tx', label: 'Transactions & ACID' }
                ]}
              />

              <Select
                label="Difficulty Level"
                options={[
                  { value: 'EASY', label: 'Easy (Foundational Recall)' },
                  { value: 'MEDIUM', label: 'Medium (Application & Analysis)' },
                  { value: 'HARD', label: 'Hard (Deep Conceptual & Edge Cases)' }
                ]}
              />

              <Button icon={Sparkles} className="w-full mt-2" disabled>
                Generate 5-Question Quiz
              </Button>

              <p className="text-[11px] text-slate-400 text-center">
                * Gemini 1.5 structured JSON quiz generation will be activated in Phase 7.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quiz Question Preview Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm">Interactive Quiz Interface Preview</CardTitle>
                <p className="text-xs text-slate-500">Sample conceptual question format</p>
              </div>
              <Badge variant="purple" size="sm">Sample Question</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-bold text-indigo-600 mb-1">QUESTION 1 OF 5</p>
                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  Which of the following conditions is necessary and sufficient for a relation R to be in Boyce-Codd Normal Form (BCNF)?
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {[
                  'A. Every determinant is a candidate key',
                  'B. Every non-prime attribute is fully functionally dependent on the primary key',
                  'C. There are no multi-valued dependencies',
                  'D. No non-prime attribute is transitively dependent on the primary key'
                ].map((opt, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                      idx === 0
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <span className="font-bold">Pedagogical Explanation: </span>
                A relation is in BCNF if and only if for every non-trivial functional dependency X &rarr; Y, X is a superkey (candidate key).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
