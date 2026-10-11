import { Link } from 'react-router-dom';
import { Calendar, ListChecks, ArrowRight, Trash2 } from 'lucide-react';
import { formatDate, truncateText } from '../utils/formatters';

export default function MeetingCard({ meeting, onDelete, showDelete = false }) {
  const highPriorityCount = meeting.actionItems?.filter(
    (item) => item.priority === 'HIGH'
  ).length || 0;

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate text-base">
            {meeting.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
            <Calendar size={13} />
            <span>{formatDate(meeting.meetingDate)}</span>
          </div>
        </div>
        {showDelete && onDelete && (
          <button
            onClick={() => onDelete(meeting._id, meeting.title)}
            className="shrink-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete meeting"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {meeting.summary && (
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          {truncateText(meeting.summary, 140)}
        </p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <ListChecks size={13} />
            {meeting.actionItems?.length || 0} action{(meeting.actionItems?.length || 0) !== 1 ? 's' : ''}
          </span>
          {highPriorityCount > 0 && (
            <span className="badge-high">
              {highPriorityCount} high priority
            </span>
          )}
        </div>
        <Link
          to={`/meetings/${meeting._id}`}
          className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors"
        >
          View Details
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
