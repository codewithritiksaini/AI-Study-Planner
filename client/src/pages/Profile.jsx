import React from 'react';
import { User, Save, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';

export const Profile = () => {
  return (
    <div>
      <PageHeader
        title="Student Profile & Capacity"
        subtitle="Manage your academic branch, semester, daily study hours, and exam targets."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
        action={
          <Button icon={Save} size="sm" disabled>
            Save Changes
          </Button>
        }
      />

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Academic Details</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Your college curriculum context</p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" defaultValue="Ritik Saini" disabled />
              <Input label="Email Address" defaultValue="ritik.student@example.com" disabled />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Engineering Branch"
                options={[
                  { value: 'cse', label: 'Computer Science & Engineering' },
                  { value: 'it', label: 'Information Technology' },
                  { value: 'ece', label: 'Electronics & Communication' }
                ]}
                disabled
              />

              <Select
                label="Current Semester"
                options={[
                  { value: '6', label: 'Semester 6' },
                  { value: '5', label: 'Semester 5' },
                  { value: '7', label: 'Semester 7' }
                ]}
                disabled
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Target CGPA" defaultValue="8.50" type="number" step="0.1" disabled />
              <Input label="Daily Available Hours" defaultValue="3.5" type="number" step="0.5" disabled />
              <Input label="Timezone" defaultValue="Asia/Kolkata (UTC+5:30)" disabled />
            </div>
          </CardContent>

          <CardFooter>
            <p className="text-[11px] text-slate-400">
              * Profile synchronization with Supabase Auth will be activated in Phase 2.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
