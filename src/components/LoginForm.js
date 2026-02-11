
'use client';
import { useState } from 'react';

export default function LoginForm({ onLogin, onSwitch }) {
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <div className="glass-card animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center', fontWeight: 'bold' }} className="text-gradient">
                    Welcome Back
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Login to your dashboard</p>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Username</label>
                        <input
                            type="text"
                            className="glass-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="e.g. john_doe"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
                        <input
                            type="password"
                            className="glass-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button type="submit" className="btn-gradient" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <button
                        onClick={onSwitch}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                        Create one
                    </button>
                </div>
            </div>
        </div>
    );
}
