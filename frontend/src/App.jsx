import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import NewMeeting from './pages/NewMeeting';
import MeetingDetails from './pages/MeetingDetails';
import MeetingHistory from './pages/MeetingHistory';
import ActionItemsView from './pages/ActionItemsView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new-meeting" element={<NewMeeting />} />
          <Route path="meetings/:id" element={<MeetingDetails />} />
          <Route path="history" element={<MeetingHistory />} />
          <Route path="action-items" element={<ActionItemsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
