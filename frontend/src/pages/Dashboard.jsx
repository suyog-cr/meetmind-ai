import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Brain, CalendarDays, ListChecks, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import MeetingCard from '../components/MeetingCard';
import { SkeletonStat, SkeletonCard } from '../components/LoadingSkeleton';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const { toasts, removeToast, error } = useToast();

  useEffect(() => {
    fetchStats();
    fetchRecentMeetings();
  }, []);

  async function fetchStats() {
    try {
      const res = await api.get('/meetings/stats');
      setStats(res.data.data);
    } catch (err) {
      error('Failed to load dashboard statistics.');
    } finally {
      setLoadingStats(false);
    }
  }

  async function fetchRecentMeetings() {
    try {
      const res = await api.get('/meetings?sort=newest');
      setRecentMeetings(res.data.data.slice(0, 4));
    } catch (err) {
      error('Failed to load recent meetings.');
    } finally {
      setLoadingMeetings(false);
    }
  }

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's your meeting overview.</p>
        </div>
        <Link to="/new-meeting" className="btn-primary w-fit">
          <PlusCircle size={18} />
          New Meeting
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {loadingStats ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard
              label="Total Meetings"
              value={stats?.totalMeetings}
              icon={CalendarDays}
              color="violet"
              to="/history"
            />
            <StatCard
              label="Total Action Items"
              value={stats?.totalActionItems}
              icon={ListChecks}
              color="blue"
              to="/action-items?filter=all"
            />
            <StatCard
              label="Pending Tasks"
              value={stats?.pendingTasks}
              icon={AlertCircle}
              color="amber"
              to="/action-items?filter=pending"
            />
            <StatCard
              label="High Priority Tasks"
              value={stats?.highPriorityTasks}
              icon={Brain}
              color="red"
              to="/action-items?filter=high"
            />
          </>
        )}
      </div>

      {/* Recent Meetings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recent Meetings</h2>
          <Link
            to="/history"
            className="text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors"
          >
            View all →
          </Link>
        </div>

        {loadingMeetings ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recentMeetings.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Brain className="text-violet-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No meetings yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">
              Create your first meeting and let AI turn your notes into structured action items.
            </p>
            <Link to="/new-meeting" className="btn-primary mx-auto">
              <PlusCircle size={18} />
              Create First Meeting
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMeetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
