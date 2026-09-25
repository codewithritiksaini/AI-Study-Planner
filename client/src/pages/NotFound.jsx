import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button.jsx';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        The academic view or resource you are trying to access does not exist or may have been relocated.
      </p>
      <div className="mt-6">
        <Button icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
