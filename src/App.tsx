import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Payment } from './pages/Payment';
import { ThankYou } from './pages/ThankYou';
import { Terms } from './pages/Terms';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="payment" element={<Payment />} />
          <Route path="thank-you" element={<ThankYou />} />
          <Route path="terms" element={<Terms />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;