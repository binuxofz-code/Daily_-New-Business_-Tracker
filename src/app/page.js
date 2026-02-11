
'use client';
import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import AdminDashboard from '@/components/AdminDashboard';
import SignupForm from '@/components/SignupForm';
import MemberDashboard from '@/components/MemberDashboard';
import ZonalManagerDashboard from '@/components/ZonalManagerDashboard';

export default function Home() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, signup

  useEffect(() => {
    // Check local storage for persistent login
    // In a real app, we would verify the token with the server here
    const saved = localStorage.getItem('tracker_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('tracker_user');
      }
    }

    // Check if URL has a query for signup (e.g. invite links later)
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tracker_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tracker_user');
    setView('login');
  };

  // Main Render Logic
  if (user) {
    if (user.role === 'admin' || user.role === 'head') {
      return <AdminDashboard user={user} onLogout={handleLogout} />;
    }
    if (user.role === 'zonal_manager') {
      return <ZonalManagerDashboard user={user} onLogout={handleLogout} />;
    }
    return <MemberDashboard user={user} onLogout={handleLogout} />;
  }

  if (view === 'signup') {
    return (
      <SignupForm
        onSignup={() => {
          setView('login');
          // Optionally auto-login or show success message
          alert('Account created! Please login.');
        }}
        onSwitch={() => setView('login')}
      />
    );
  }

  return <LoginForm onLogin={handleLogin} onSwitch={() => setView('signup')} />;
}
