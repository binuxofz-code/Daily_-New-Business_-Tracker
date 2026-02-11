
'use client';
import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function SignupForm({ onSignup, onSwitch, theme, toggleTheme }) {
    const [formData, setFormData] = useState({
        username: '', password: '', role: 'member', zone: '', branch: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            onSignup();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-body)', position: 'relative' }}>
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="btn-secondary"
                style={{ position: 'absolute', top: '2rem', right: '2rem', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <div className="clean-card animate-fade-in" style={{ padding: '2.5rem', width: '100%', maxWidth: '480px', background: 'var(--bg-card)' }}>
                <h2 className="text-h1" style={{ marginBottom: '0.5rem', textAlign: 'left', color: 'var(--text-main)' }}>
                    Create Account
                </h2>
                <p className="text-muted" style={{ marginBottom: '2rem', textAlign: 'left' }}>
                    Join the team today
                </p>

                {error && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>Username</label>
                        <input
                            className="clean-input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            placeholder="e.g. john_doe"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>Password</label>
                        <input
                            type="password"
                            className="clean-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <div style={{ display: 'none' }}>
                        <input type="hidden" value="member" />
                    </div>

                    <div style={{
                        background: 'rgba(59, 130, 246, 0.05)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(59, 130, 246, 0.1)',
                        textAlign: 'center'
                    }}>
                        <Shield size={24} color="var(--accent-blue)" style={{ marginBottom: '0.75rem', margin: '0 auto' }} />
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '0.25rem' }}>Account Security</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                            For security purposes, your <b>Zone</b> and <b>Branch</b> will be assigned by the Administrator after you register.
                        </p>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Creating Account...' : 'Register as Team Member'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button
                        onClick={onSwitch}
                        className="text-link"
                        style={{ background: 'none', border: 'none' }}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}
