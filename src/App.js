import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import VacationBookingForm from './components/VacationBookingForm';
import AdminDashboard from './components/AdminDashboard';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<VacationBookingForm />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
};

export default App;