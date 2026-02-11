
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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>Role</label>
                        <select
                            className="clean-input"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            style={{ background: 'var(--bg-input)' }}
                        >
                            <option value="member">Team Member</option>
                            <option value="zonal_manager">Zonal Manager</option>
                            <option value="head">Department Head</option>
                            <option value="admin">Admin</option>
                        </select>
                        {formData.role === 'zonal_manager' &&
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Select &quot;Zonal Manager&quot; to manage a specific zone.
                            </p>
                        }
                    </div>

                    {/* Only show Zone/Branch input for Zonal Manager or Admin/Heads if needed. */}
                    {formData.role !== 'member' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>Zone</label>
                                <input
                                    className="clean-input"
                                    placeholder="e.g. West"
                                    value={formData.zone}
                                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', opacity: 0.8 }}>Branch</label>
                                <input
                                    className="clean-input"
                                    placeholder="e.g. NYC"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {formData.role === 'member' && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            Your Zone and Branch will be assigned by the Admin after registration.
                        </p>
                    )}

                    <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }} disabled={loading}>
                        {loading ? 'Creating...' : 'Sign Up'}
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
