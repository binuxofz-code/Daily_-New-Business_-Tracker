
'use client';
import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import AdminDashboard from '@/components/AdminDashboard';
import SignupForm from '@/components/SignupForm';
import MemberDashboard from '@/components/MemberDashboard';
import ZonalManagerDashboard from '@/components/ZonalManagerDashboard';

export default function Home() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tracker_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          localStorage.removeItem('tracker_user');
        }
      }
    }
    return null;
  });

  const [view, setView] = useState('login'); // login, signup
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tracker_theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tracker_theme', newTheme);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('tracker_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout API failed:', e);
    }
    setUser(null);
    localStorage.removeItem('tracker_user');
    setView('login');
  };

  // Main Render Logic
  if (user) {
    if (user.role === 'admin' || user.role === 'head' || user.role === 'viewer_admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
    }
    if (user.role === 'zonal_manager') {
      return <ZonalManagerDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
    }
    return <MemberDashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
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
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  return <LoginForm onLogin={handleLogin} onSwitch={() => setView('signup')} theme={theme} toggleTheme={toggleTheme} />;
}
