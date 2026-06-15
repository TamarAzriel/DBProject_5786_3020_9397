import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Tickets from './pages/Tickets';
import Locations from './pages/Locations';
import Staff from './pages/Staff';
import Vendors from './pages/Vendors';
import Inspections from './pages/Inspections';
import AdvancedActions from './pages/AdvancedActions';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/locations" element={<Locations />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/actions" element={<AdvancedActions />} />
      </Route>
    </Routes>
  );
}
