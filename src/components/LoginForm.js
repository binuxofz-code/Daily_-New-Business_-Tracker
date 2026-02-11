
'use client';
import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function LoginForm({ onLogin, onSwitch, theme, toggleTheme }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            onLogin(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-body)', position: 'relative' }}>
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="btn-secondary"
                style={{ position: 'absolute', top: '2rem', right: '2rem', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="clean-card auth-card animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px', background: 'var(--bg-card)' }}>
                <h2 className="text-h1" style={{ marginBottom: '1rem', textAlign: 'left', color: 'var(--text-main)' }}>
                    Business Tracker Login
                </h2>
                <p className="text-muted" style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                    Sign in to access your daily business tracker
                </p>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>
                            Username or Company Email
                        </label>
                        <input
                            type="text"
                            className="clean-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="your.email@company.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>
                            Password
                        </label>
                        <input
                            type="password"
                            className="clean-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', height: '48px', fontSize: '1rem' }} disabled={loading}>
                        {loading ? 'Verifying...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don&apos;t have an account?{' '}
                    <button
                        onClick={onSwitch}
                        className="text-link"
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
}
