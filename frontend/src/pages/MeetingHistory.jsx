import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, History, PlusCircle,
  X, ArrowUpDown, AlertCircle, Brain, ListChecks, CalendarDays
} from 'lucide-react';
import api from '../api/axios';
import MeetingCard from '../components/MeetingCard';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/ToastContainer';
import { SkeletonCard } from '../components/LoadingSkeleton';
import { useToast } from '../hooks/useToast';

const FILTERS = [
  { key: 'all', label: 'All Meetings', icon: CalendarDays, color: 'violet' },
  { key: 'high', label: 'High Priority', icon: Brain, color: 'red' },
  { key: 'pending', label: 'Pending Tasks', icon: AlertCircle, color: 'amber' },
  { key: 'actions', label: 'Has Actions', icon: ListChecks, color: 'blue' },
];

export default function MeetingHistory() {
  const { toasts, removeToast, success, error: toastError } = useToast();
  const location = useLocation();

  const [meetings, setMeetings] = useState([]);
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Read filter from URL state (when clicking stat cards)
  useEffect(() => {
    if (location.state?.filter) {
      setActiveFilter(location.state.filter);
    }
  }, [location.state]);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      params.set('sort', sort);

      const res = await api.get(`/meetings?${params.toString()}`);
      const data = res.data.data;
      setAllMeetings(data);
    } catch (err) {
      toastError(err.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  }, [search, sort]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchMeetings(), 350);
    return () => clearTimeout(debounce);
  }, [fetchMeetings]);

  // Apply active filter on top of fetched data
  useEffect(() => {
    let filtered = [...allMeetings];
    if (activeFilter === 'high') {
      filtered = filtered.filter(m =>
        m.actionItems?.some(a => a.priority === 'HIGH')
      );
    } else if (activeFilter === 'pending') {
      filtered = filtered.filter(m =>
        m.actionItems?.some(a => a.status === 'PENDING')
      );
    } else if (activeFilter === 'actions') {
      filtered = filtered.filter(m => m.actionItems?.length > 0);
    }
    setMeetings(filtered);
  }, [allMeetings, activeFilter]);

  function confirmDelete(id, title) {
    setDeleteTarget({ id, title });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/meetings/${deleteTarget.id}`);
      setAllMeetings(prev => prev.filter(m => m._id !== deleteTarget.id));
      success('Meeting deleted successfully.');
      setDeleteTarget(null);
    } catch (err) {
      toastError(err.message || 'Failed to delete meeting.');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meeting History</h1>
          <p className="text-slate-500 mt-1">
            {loading ? 'Loading...' : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        <Link to="/new-meeting" className="btn-primary w-fit">
          <PlusCircle size={18} />
          New Meeting
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map(({ key, label, icon: Icon, color }) => {
          const colorMap = {
            violet: 'bg-violet-600 text-white border-violet-600',
            red: 'bg-red-600 text-white border-red-600',
            amber: 'bg-amber-500 text-white border-amber-500',
            blue: 'bg-blue-600 text-white border-blue-600',
          };
          const activeStyle = colorMap[color];
          const isActive = activeFilter === key;

          // Count badge
          let count = allMeetings.length;
          if (key === 'high') count = allMeetings.filter(m => m.actionItems?.some(a => a.priority === 'HIGH')).length;
          if (key === 'pending') count = allMeetings.filter(m => m.actionItems?.some(a => a.status === 'PENDING')).length;
          if (key === 'actions') count = allMeetings.filter(m => m.actionItems?.length > 0).length;

          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                isActive
                  ? activeStyle
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                isActive ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, summary, or notes..."
            className="input-field pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="input-field pl-9 pr-8 w-full sm:w-auto appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Meetings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="card p-12 text-center">
          {search ? (
            <>
              <Search className="text-slate-300 mx-auto mb-3" size={40} />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No results found</h3>
              <p className="text-slate-500 mb-4">
                No meetings match "<span className="font-medium text-slate-700">{search}</span>".
              </p>
              <button onClick={() => setSearch('')} className="btn-secondary mx-auto">
                <X size={16} /> Clear Search
              </button>
            </>
          ) : (
            <>
              <History className="text-slate-300 mx-auto mb-3" size={40} />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                {activeFilter !== 'all' ? `No meetings with this filter` : 'No meetings found'}
              </h3>
              <p className="text-slate-500 mb-6">
                {activeFilter !== 'all'
                  ? 'Try selecting a different filter.'
                  : 'Create your first meeting to get started.'}
              </p>
              {activeFilter !== 'all' ? (
                <button onClick={() => setActiveFilter('all')} className="btn-secondary mx-auto">
                  Show all meetings
                </button>
              ) : (
                <Link to="/new-meeting" className="btn-primary mx-auto">
                  <PlusCircle size={18} /> New Meeting
                </Link>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting._id}
              meeting={meeting}
              showDelete
              onDelete={confirmDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
