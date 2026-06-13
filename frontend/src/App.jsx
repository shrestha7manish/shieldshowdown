import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationForm from './pages/RegistrationForm';
import AdminDashboard from './pages/AdminDashboard';
import RegistrationDetails from './pages/RegistrationDetails';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-transparent gaming-grid">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<RegistrationForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/registration/:id" element={<RegistrationDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
