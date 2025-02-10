import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Payment } from './pages/Payment';
import { ThankYou } from './pages/ThankYou';
import { Terms } from './pages/Terms';
import { Layout } from './components/Layout';
import { useStore } from './store/useStore';

// Wrapper component to handle auto-login logic
function AutoLoginHandler({ children }: { children: React.ReactNode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useStore();
  
  useEffect(() => {
    const urlPubkey = searchParams.get('npub') || searchParams.get('pubkey');
    const isIframe = searchParams.get('iframe') === '1';

    // Auto-login if pubkey/npub is in URL and user isn't already logged in
    if (urlPubkey && !user) {
      setUser({ pubkey: urlPubkey, isWhitelisted: false });
      navigate(isIframe ? '/dashboard?iframe=1' : '/dashboard');
    }
  }, [searchParams, user, setUser, navigate]);

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AutoLoginHandler>
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
      </AutoLoginHandler>
    </Router>
  );
}

export default App;