import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ListChecks, Brain, AlertCircle, CheckCircle2,
  ArrowLeft, Calendar, ExternalLink, ChevronDown,
  Loader2, Save, X, Edit2, Clock
} from 'lucide-react';
import api from '../api/axios';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';
import {
  formatDate, formatDateForInput, getPriorityClass,
  getStatusClass, formatStatus
} from '../utils/formatters';

const FILTER_CONFIG = {
  all: {
    label: 'All Action Items',
    icon: ListChecks,
    color: 'violet',
    description: 'Every action item across all meetings',
    filter: () => true,
  },
  high: {
    label: 'High Priority',
    icon: Brain,
    color: 'red',
    description: 'Action items marked as HIGH priority',
    filter: (item) => item.priority === 'HIGH',
  },
  pending: {
    label: 'Pending Tasks',
    icon: AlertCircle,
    color: 'amber',
    description: 'Tasks that are still pending',
    filter: (item) => item.status === 'PENDING',
  },
  completed: {
    label: 'Completed Tasks',
    icon: CheckCircle2,
    color: 'emerald',
    description: 'Tasks that have been completed',
    filter: (item) => item.status === 'COMPLETED',
  },
};

const colorMap = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-violet-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600', border: 'border-red-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-amber-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-emerald-200' },
};

export default function ActionItemsView() {
  const [searchParams] = useSearchParams();
  const filterKey = searchParams.get('filter') || 'all';
  const config = FILTER_CONFIG[filterKey] || FILTER_CONFIG.all;
  const colors = colorMap[config.color];

  const { toasts, removeToast, success, error: toastError } = useToast();

  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // "meetingId-itemId"
  const [editValues, setEditValues] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchAllActionItems();
  }, []);

  async function fetchAllActionItems() {
    setLoading(true);
    try {
      const res = await api.get('/meetings');
      const meetings = res.data.data;

      // Flatten all action items with their meeting info
      const items = [];
      meetings.forEach((meeting) => {
        (meeting.actionItems || []).forEach((item) => {
          items.push({
            ...item,
            meetingId: meeting._id,
            meetingTitle: meeting.title,
            meetingDate: meeting.meetingDate,
          });
        });
      });

      setAllItems(items);
    } catch (err) {
      toastError(err.message || 'Failed to load action items.');
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = allItems.filter(config.filter);

  function startEdit(item) {
    setEditingId(`${item.meetingId}-${item._id}`);
    setEditValues({
      priority: item.priority,
      status: item.status,
      deadline: item.deadline ? formatDateForInput(item.deadline) : '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(item) {
    const key = `${item.meetingId}-${item._id}`;
    setSavingId(key);
    try {
      const payload = {
        priority: editValues.priority,
        status: editValues.status,
        deadline: editValues.deadline || null,
      };

      await api.patch(`/meetings/${item.meetingId}/action-items/${item._id}`, payload);

      setAllItems((prev) =>
        prev.map((a) =>
          a._id === item._id && a.meetingId === item.meetingId
            ? {
                ...a,
                priority: payload.priority,
                status: payload.status,
                deadline: payload.deadline ? new Date(payload.deadline).toISOString() : null,
              }
            : a
        )
      );

      setEditingId(null);
      success('Action item updated.');
    } catch (err) {
      toastError(err.message || 'Failed to update.');
    } finally {
      setSavingId(null);
    }
  }

  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Back */}
      <div className="mb-6">
        <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className={`card p-6 mb-6 border-l-4 ${colors.border}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className={colors.icon} size={24} />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${colors.text}`}>{config.label}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{config.description}</p>
          </div>
          <div className={`ml-auto text-3xl font-bold ${colors.text}`}>
            {loading ? '...' : filteredItems.length}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100">
          {Object.entries(FILTER_CONFIG).map(([key, cfg]) => {
            const TabIcon = cfg.icon;
            const isActive = key === filterKey;
            const tabColors = colorMap[cfg.color];
            const count = allItems.filter(cfg.filter).length;
            return (
              <Link
                key={key}
                to={`/action-items?filter=${key}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? `${tabColors.bg} ${tabColors.text} ${tabColors.border}`
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <TabIcon size={12} />
                {cfg.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${isActive ? 'bg-white/50' : 'bg-slate-100'}`}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="flex gap-2">
                <div className="h-5 bg-slate-100 rounded-full w-16" />
                <div className="h-5 bg-slate-100 rounded-full w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <Icon className="text-slate-300 mx-auto mb-3" size={40} />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No items found</h3>
          <p className="text-slate-500 mb-6">No action items match this filter.</p>
          <Link to="/new-meeting" className="btn-primary mx-auto">Create a Meeting</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const editKey = `${item.meetingId}-${item._id}`;
            const isEditing = editingId === editKey;
            const isSaving = savingId === editKey;

            return (
              <div key={editKey} className="card p-5 hover:shadow-md transition-shadow">
                {/* Meeting reference */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <Link
                    to={`/meetings/${item.meetingId}`}
                    className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors"
                  >
                    <ExternalLink size={11} />
                    {item.meetingTitle}
                  </Link>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={11} />
                    {formatDate(item.meetingDate)}
                  </span>
                </div>

                {isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-800">{item.task}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Priority</label>
                        <div className="relative">
                          <select
                            value={editValues.priority}
                            onChange={(e) => setEditValues({ ...editValues, priority: e.target.value })}
                            className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                        <div className="relative">
                          <select
                            value={editValues.status}
                            onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
                            className="w-full pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline</label>
                        <input
                          type="date"
                          value={editValues.deadline}
                          onChange={(e) => setEditValues({ ...editValues, deadline: e.target.value })}
                          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(item)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-800 leading-relaxed flex-1">{item.task}</p>
                      <button
                        onClick={() => startEdit(item)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        aria-label="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={getPriorityClass(item.priority)}>{item.priority}</span>
                      <span className={getStatusClass(item.status)}>{formatStatus(item.status)}</span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock size={11} />
                        {item.deadline ? formatDate(item.deadline) : 'No deadline'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
