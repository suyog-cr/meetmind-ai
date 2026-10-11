import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Brain, ListChecks, CheckCircle2,
  Target, Clock, Edit2, Save, X, Loader2, Trash2,
  AlertCircle, ChevronDown, History
} from 'lucide-react';
import api from '../api/axios';
import ToastContainer from '../components/ToastContainer';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { SkeletonDetails } from '../components/LoadingSkeleton';
import {
  formatDate, formatDateForInput, getPriorityClass,
  getStatusClass, formatStatus
} from '../utils/formatters';

export default function MeetingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: toastError } = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savingItemId, setSavingItemId] = useState(null);

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  async function fetchMeeting() {
    setLoading(true);
    try {
      const res = await api.get(`/meetings/${id}`);
      setMeeting(res.data.data);
    } catch (err) {
      toastError(err.message || 'Failed to load meeting.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/meetings/${id}`);
      success('Meeting deleted successfully.');
      setTimeout(() => navigate('/history'), 800);
    } catch (err) {
      toastError(err.message || 'Failed to delete meeting.');
      setShowDeleteDialog(false);
    } finally {
      setDeleteLoading(false);
    }
  }

  function startEdit(item) {
    setEditingItemId(item._id);
    setEditValues({
      priority: item.priority,
      status: item.status,
      deadline: item.deadline ? formatDateForInput(item.deadline) : '',
    });
  }

  function cancelEdit() {
    setEditingItemId(null);
    setEditValues({});
  }

  async function saveEdit(itemId) {
    setSavingItemId(itemId);
    try {
      const payload = {
        priority: editValues.priority,
        status: editValues.status,
        deadline: editValues.deadline || null,
      };

      await api.patch(`/meetings/${id}/action-items/${itemId}`, payload);

      // Update local state
      setMeeting((prev) => ({
        ...prev,
        actionItems: prev.actionItems.map((item) =>
          item._id === itemId
            ? {
                ...item,
                priority: payload.priority,
                status: payload.status,
                deadline: payload.deadline ? new Date(payload.deadline).toISOString() : null,
              }
            : item
        ),
      }));

      setEditingItemId(null);
      setEditValues({});
      success('Action item updated.');
    } catch (err) {
      toastError(err.message || 'Failed to update action item.');
    } finally {
      setSavingItemId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/history" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit">
            <ArrowLeft size={16} /> Back to History
          </Link>
        </div>
        <SkeletonDetails />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card p-12 text-center">
          <AlertCircle className="text-slate-400 mx-auto mb-3" size={40} />
          <h2 className="text-lg font-semibold text-slate-700 mb-2">Meeting Not Found</h2>
          <p className="text-slate-500 mb-4">This meeting may have been deleted.</p>
          <Link to="/history" className="btn-primary">
            <History size={16} /> View History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        loading={deleteLoading}
      />

      {/* Back */}
      <div className="mb-6">
        <Link to="/history" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors w-fit">
          <ArrowLeft size={16} /> Back to History
        </Link>
      </div>

      {/* Meeting Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 mb-2">{meeting.title}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={14} />
              <span>{formatDate(meeting.meetingDate)}</span>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="btn-danger shrink-0"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <Brain className="text-violet-600" size={16} />
          </div>
          <h2 className="text-base font-semibold text-slate-900">AI Summary</h2>
        </div>
        <p className="text-slate-700 leading-relaxed text-sm">{meeting.summary}</p>
      </div>

      {/* Key Points */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Target className="text-blue-600" size={16} />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Key Points</h2>
          <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {meeting.keyPoints?.length || 0}
          </span>
        </div>

        {(!meeting.keyPoints || meeting.keyPoints.length === 0) ? (
          <p className="text-sm text-slate-400 italic">No key points were identified in this meeting.</p>
        ) : (
          <ul className="space-y-2.5">
            {meeting.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 shrink-0" />
                <span className="text-sm text-slate-700 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Items */}
      <div className="card p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <ListChecks className="text-emerald-600" size={16} />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Action Items</h2>
          <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {meeting.actionItems?.length || 0}
          </span>
        </div>

        {(!meeting.actionItems || meeting.actionItems.length === 0) ? (
          <p className="text-sm text-slate-400 italic">No action items were identified in this meeting.</p>
        ) : (
          <div className="space-y-3">
            {meeting.actionItems.map((item) => (
              <div
                key={item._id}
                className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                {editingItemId === item._id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-800">{item.task}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Priority */}
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
                      {/* Status */}
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
                      {/* Deadline */}
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
                        onClick={() => saveEdit(item._id)}
                        disabled={savingItemId === item._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      >
                        {savingItemId === item._id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={savingItemId === item._id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                      >
                        <X size={12} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-slate-800 font-medium leading-relaxed flex-1">{item.task}</p>
                      <button
                        onClick={() => startEdit(item)}
                        className="shrink-0 p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        aria-label="Edit action item"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={getPriorityClass(item.priority)}>
                        {item.priority}
                      </span>
                      <span className={getStatusClass(item.status)}>
                        {formatStatus(item.status)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={11} />
                        {item.deadline ? formatDate(item.deadline) : 'No deadline specified'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
