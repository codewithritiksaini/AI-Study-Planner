import React from 'react';
import { Settings as SettingsIcon, Bell, Moon, Sliders } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent } from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import Select from '../components/common/Select.jsx';

export const Settings = () => {
  return (
    <div>
      <PageHeader
        title="Application Settings"
        subtitle="Configure study slot preferences, notifications, and application behavior."
        badge={<Badge variant="primary">Phase 1 Preview</Badge>}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Study Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-base">Study Interval Preferences</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Configure Pomodoro slot durations</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Default Slot Duration"
                options={[
                  { value: '45', label: '45 Minutes (Recommended)' },
                  { value: '60', label: '60 Minutes (Deep Focus)' },
                  { value: '30', label: '30 Minutes (Rapid Sprint)' }
                ]}
                disabled
              />

              <Select
                label="Break Interval"
                options={[
                  { value: '15', label: '15 Minutes Rest' },
                  { value: '10', label: '10 Minutes Rest' },
                  { value: '5', label: '5 Minutes Short Rest' }
                ]}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Study alerts and adaptive schedule notices</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Adaptive Reschedule Alerts</p>
                <p className="text-slate-500 mt-0.5">Notify when an overdue topic is automatically rescheduled</p>
              </div>
              <input type="checkbox" defaultChecked disabled className="rounded text-indigo-600" />
            </div>

            <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Exam Countdown Reminders</p>
                <p className="text-slate-500 mt-0.5">Alerts when an exam is less than 7 days away</p>
              </div>
              <input type="checkbox" defaultChecked disabled className="rounded text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
