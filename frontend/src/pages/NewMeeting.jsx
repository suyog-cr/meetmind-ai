import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, X, Loader2, Brain, CheckCircle2,
  AlertCircle, Calendar, Type, Paperclip
} from 'lucide-react';
import api from '../api/axios';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import { formatFileSize } from '../utils/formatters';

const ALLOWED_TYPES = [
  'text/plain',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const ALLOWED_EXT = ['.txt', '.pdf', '.docx'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const STEPS = [
  'Reading meeting...',
  'Generating AI summary...',
  'Extracting key points...',
  'Finding action items...',
  'Saving meeting...',
];

export default function NewMeeting() {
  const navigate = useNavigate();
  const { toasts, removeToast, error: toastError, success } = useToast();
  const fileInputRef = useRef(null);

  const [inputMode, setInputMode] = useState('text'); // 'text' | 'file'
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  function handleFileSelect(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    validateAndSetFile(selected);
  }

  function validateAndSetFile(selected) {
    setFileError('');
    const ext = '.' + selected.name.split('.').pop().toLowerCase();

    if (!ALLOWED_EXT.includes(ext) && !ALLOWED_TYPES.includes(selected.type)) {
      setFileError('Unsupported file type. Please upload a TXT, PDF, or DOCX file.');
      return;
    }
    if (selected.size > MAX_SIZE) {
      setFileError('File is too large. Maximum allowed size is 10MB.');
      return;
    }
    if (selected.size === 0) {
      setFileError('The selected file is empty.');
      return;
    }
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }

  function removeFile() {
    setFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      toastError('Please enter a meeting title.');
      return;
    }
    if (!meetingDate) {
      toastError('Please select a meeting date.');
      return;
    }
    if (inputMode === 'text' && !notes.trim()) {
      toastError('Please enter your meeting notes.');
      return;
    }
    if (inputMode === 'file' && !file) {
      toastError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setLoadingStep(0);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1800);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('meetingDate', meetingDate);

      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('notes', notes.trim());
      }

      const res = await api.post('/meetings/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      clearInterval(stepInterval);
      success('Meeting analyzed and saved successfully!');

      setTimeout(() => {
        navigate(`/meetings/${res.data.data._id}`);
      }, 800);
    } catch (err) {
      clearInterval(stepInterval);
      toastError(err.message || 'Failed to analyze meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Meeting</h1>
        <p className="text-slate-500 mt-1">Paste your notes or upload a file. AI will handle the rest.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Date */}
        <div className="card p-6 space-y-5">
          <div>
            <label className="label" htmlFor="title">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Planning Meeting"
                className="input-field pl-10"
                required
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="meetingDate">
              Meeting Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Input Mode Toggle */}
        <div className="card p-6">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-5 w-fit">
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={15} />
              Manual Text
            </button>
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                inputMode === 'file'
                  ? 'bg-white text-violet-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={15} />
              Upload File
            </button>
          </div>

          {/* Text Input */}
          {inputMode === 'text' && (
            <div>
              <label className="label" htmlFor="notes">
                Meeting Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste your meeting notes here...&#10;&#10;Example:&#10;Discussed the product roadmap for Q4. John will complete the API integration by October 20th. Sarah needs to update the design mockups urgently. Team agreed to schedule a follow-up next Friday."
                className="input-field min-h-[220px] resize-y leading-relaxed"
                rows={10}
              />
              <p className="text-xs text-slate-400 mt-1.5">{notes.length} characters</p>
            </div>
          )}

          {/* File Upload */}
          {inputMode === 'file' && (
            <div>
              <label className="label">
                Upload File <span className="text-red-500">*</span>
              </label>

              {!file ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    fileError
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50/30'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Paperclip className="text-slate-400" size={22} />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    Supported: TXT, PDF, DOCX &bull; Max 10MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-3 bg-slate-50">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="text-violet-600" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    aria-label="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {fileError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600 mt-2">
                  <AlertCircle size={14} />
                  {fileError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3 text-base"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Analyzing your meeting...
            </>
          ) : (
            <>
              <Brain size={18} />
              Generate AI Analysis
            </>
          )}
        </button>

        {/* Loading Progress */}
        {loading && (
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <Brain className="text-violet-600 animate-pulse" size={18} />
              </div>
              <p className="font-semibold text-slate-800">AI is processing your meeting...</p>
            </div>
            <div className="space-y-2.5">
              {STEPS.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  {idx < loadingStep ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : idx === loadingStep ? (
                    <Loader2 size={16} className="text-violet-500 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      idx <= loadingStep ? 'text-slate-700 font-medium' : 'text-slate-400'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
