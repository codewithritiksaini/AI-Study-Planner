import React, { useState, useEffect } from 'react';
import { User, Save, CheckCircle2, AlertCircle, Clock, BookOpen, Award, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { profileService } from '../services/profile.js';
import PageHeader from '../components/common/PageHeader.jsx';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import Select from '../components/common/Select.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

export const Profile = () => {
  const { user, profile, updateProfileState } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    branch: 'CSE',
    semester: 1,
    target_cgpa: 8.50,
    daily_available_hours: 3.00,
    preferred_study_start_time: '18:00',
    preferred_study_end_time: '22:00',
    timezone: 'Asia/Kolkata'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Load existing profile from service or context
  useEffect(() => {
    let isMounted = true;

    const fetchCurrentProfile = async () => {
      try {
        setIsLoading(true);
        const data = await profileService.getProfile();
        if (isMounted && data) {
          setFormData({
            full_name: data.full_name || '',
            email: data.email || user?.email || '',
            branch: data.branch || 'CSE',
            semester: data.semester || 1,
            target_cgpa: data.target_cgpa !== undefined ? parseFloat(data.target_cgpa) : 8.50,
            daily_available_hours: data.daily_available_hours !== undefined ? parseFloat(data.daily_available_hours) : 3.00,
            preferred_study_start_time: data.preferred_study_start_time ? data.preferred_study_start_time.substring(0, 5) : '18:00',
            preferred_study_end_time: data.preferred_study_end_time ? data.preferred_study_end_time.substring(0, 5) : '22:00',
            timezone: data.timezone || 'Asia/Kolkata'
          });
          updateProfileState(data);
        }
      } catch (err) {
        console.warn('Could not fetch profile in view:', err);
        if (isMounted) {
          setFormData((prev) => ({
            ...prev,
            email: user?.email || prev.email,
            full_name: user?.user_metadata?.full_name || prev.full_name
          }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCurrentProfile();

    return () => {
      isMounted = false;
    };
  }, [user, updateProfileState]);

  const validate = () => {
    const errs = {};

    if (!formData.full_name.trim()) {
      errs.full_name = 'Full name is required';
    } else if (formData.full_name.trim().length < 2) {
      errs.full_name = 'Full name must be at least 2 characters';
    }

    const sem = parseInt(formData.semester, 10);
    if (isNaN(sem) || sem < 1 || sem > 8) {
      errs.semester = 'Semester must be between 1 and 8';
    }

    const cgpa = parseFloat(formData.target_cgpa);
    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
      errs.target_cgpa = 'Target CGPA must be between 0.0 and 10.0';
    }

    const hours = parseFloat(formData.daily_available_hours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      errs.daily_available_hours = 'Available study hours must be between 0 and 24';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (successMessage) setSuccessMessage('');
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        branch: formData.branch,
        semester: parseInt(formData.semester, 10),
        target_cgpa: parseFloat(formData.target_cgpa),
        daily_available_hours: parseFloat(formData.daily_available_hours),
        preferred_study_start_time: formData.preferred_study_start_time ? `${formData.preferred_study_start_time}:00` : null,
        preferred_study_end_time: formData.preferred_study_end_time ? `${formData.preferred_study_end_time}:00` : null,
        timezone: formData.timezone
      };

      const updated = await profileService.updateProfile(payload);
      if (updated) {
        updateProfileState(updated);
        setSuccessMessage('Student academic profile updated successfully!');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Student Academic Profile"
        subtitle="Manage your engineering branch, semester, available daily hours, and target CGPA."
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 text-emerald-200 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {/* Identity & Branch */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  <CardTitle className="text-base">Identity & Academic Context</CardTitle>
                </div>
                <p className="text-xs text-slate-400">
                  Your registered student identification details and college stream
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    error={errors.full_name}
                    required
                  />

                  <Input
                    label="Email Address (Authenticated)"
                    name="email"
                    value={formData.email}
                    disabled
                    helperText="Email is managed securely by Supabase Auth and cannot be modified here."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Engineering Branch / Stream"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    options={[
                      { value: 'CSE', label: 'Computer Science & Engineering (CSE)' },
                      { value: 'IT', label: 'Information Technology (IT)' },
                      { value: 'AI_ML', label: 'Artificial Intelligence & Machine Learning' },
                      { value: 'Data Science', label: 'Data Science' },
                      { value: 'ECE', label: 'Electronics & Communication (ECE)' },
                      { value: 'EE', label: 'Electrical Engineering (EE)' },
                      { value: 'ME', label: 'Mechanical Engineering (ME)' },
                      { value: 'CE', label: 'Civil Engineering (CE)' }
                    ]}
                  />

                  <Select
                    label="Current Semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    error={errors.semester}
                    options={[
                      { value: '1', label: 'Semester 1' },
                      { value: '2', label: 'Semester 2' },
                      { value: '3', label: 'Semester 3' },
                      { value: '4', label: 'Semester 4' },
                      { value: '5', label: 'Semester 5' },
                      { value: '6', label: 'Semester 6' },
                      { value: '7', label: 'Semester 7' },
                      { value: '8', label: 'Semester 8' }
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target & Study Capacity */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500" />
                  <CardTitle className="text-base">Study Goals & Daily Capacity</CardTitle>
                </div>
                <p className="text-xs text-slate-400">
                  Defines the daily parameters used by future adaptive planning modules
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Target CGPA (0.00 – 10.00)"
                    name="target_cgpa"
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={formData.target_cgpa}
                    onChange={handleChange}
                    error={errors.target_cgpa}
                    helperText="Aim for your target graduation grade"
                  />

                  <Input
                    label="Daily Available Study Hours"
                    name="daily_available_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.daily_available_hours}
                    onChange={handleChange}
                    error={errors.daily_available_hours}
                    helperText="Hours you can realistically dedicate each day"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Preferred Study Start
                    </label>
                    <input
                      type="time"
                      name="preferred_study_start_time"
                      value={formData.preferred_study_start_time}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Preferred Study End
                    </label>
                    <input
                      type="time"
                      name="preferred_study_end_time"
                      value={formData.preferred_study_end_time}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <Select
                    label="Timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    options={[
                      { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
                      { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                      { value: 'America/New_York', label: 'Eastern Time (ET, US)' },
                      { value: 'Europe/London', label: 'London (GMT/BST)' },
                      { value: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8)' }
                    ]}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-xs text-slate-400">
                  Data stored securely in your private PostgreSQL row with Row Level Security (RLS).
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="w-full sm:w-auto font-semibold px-6 shadow-lg shadow-indigo-600/25"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
