import React from 'react';
import { Plus, BookOpen, Calendar, CheckCircle, ArrowRight } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';

export const Subjects = () => {
  const sampleSubjects = [
    {
      id: 'sub-1',
      name: 'Database Management Systems',
      description: 'Relational algebra, SQL, Normalization, Concurrency & Transactions',
      exam_date: '2026-11-20',
      days_left: 12,
      completion: 65,
      color: 'bg-blue-600',
      topics_count: 8
    },
    {
      id: 'sub-2',
      name: 'Operating Systems',
      description: 'Process management, CPU scheduling, Virtual Memory, Deadlocks',
      exam_date: '2026-11-28',
      days_left: 20,
      completion: 50,
      color: 'bg-indigo-600',
      topics_count: 10
    },
    {
      id: 'sub-3',
      name: 'Computer Networks',
      description: 'OSI & TCP/IP stack, Routing protocols, Congestion control, Socket programming',
      exam_date: '2026-12-05',
      days_left: 27,
      completion: 30,
      color: 'bg-emerald-600',
      topics_count: 12
    }
  ];

  return (
    <div>
      <PageHeader
        title="Subjects & Syllabus"
        subtitle="Manage academic courses, track syllabus milestones, and monitor exam deadlines."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
        action={
          <Button icon={Plus} size="sm">
            Add Subject
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleSubjects.map((sub) => (
          <Card key={sub.id} hover className="flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-3 h-3 rounded-full ${sub.color}`} />
                <Badge variant={sub.days_left <= 14 ? 'warning' : 'neutral'} size="sm">
                  Exam in {sub.days_left}d
                </Badge>
              </div>
              <CardTitle className="text-base font-semibold">{sub.name}</CardTitle>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sub.description}</p>
            </CardHeader>

            <CardContent className="py-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600">Syllabus Completion</span>
                  <span className="text-slate-900 font-bold">{sub.completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${sub.completion}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{sub.topics_count} Syllabus Topics</p>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{sub.exam_date}</span>
              </span>
              <Button variant="ghost" size="sm" className="text-xs">
                <span>View Syllabus</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Subjects;
