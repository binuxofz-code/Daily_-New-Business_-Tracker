
'use client';
import { useState, useEffect } from 'react';
import { LayoutDashboard, LogOut, TrendingUp, History, User } from 'lucide-react';

export default function MemberDashboard({ user, onLogout }) {
    const [record, setRecord] = useState({ morning_plan: '', actual_business: '' });
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const date = new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchData();
    }, [user.id]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();
            if (data.id) {
                setRecord({
                    morning_plan: data.morning_plan || '',
                    actual_business: data.actual_business || ''
                });
            }

            const hRes = await fetch(`/api/records?userId=${user.id}`);
            const hData = await hRes.json();
            if (Array.isArray(hData)) {
                setHistory(hData);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (field) => {
        setLoading(true);
        try {
            const payload = {
                user_id: user.id,
                date,
                morning_plan: record.morning_plan,
                actual_business: parseFloat(record.actual_business) || 0
            };

            await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            setMsg('Saved successfully!');
            setTimeout(() => setMsg(''), 3000);
            fetchData();
        } catch (e) {
            console.error(e);
            setMsg('Error saving');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(val);
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
                        Tracker
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn-ghost" style={{ justifyContent: 'flex-start', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <LayoutDashboard size={18} style={{ marginRight: '0.75rem' }} /> Dashboard
                    </button>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role}</div>
                    </div>
                    <button onClick={onLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: '#fca5a5' }}>
                        <LogOut size={18} style={{ marginRight: '0.75rem' }} /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header style={{ marginBottom: '3rem' }}>
                    <h1 className="animate-fade-in" style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                        Good Morning, <span className="text-gradient">{user.username}</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here's your daily business tracker for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </header>

                <div className="stats-grid">
                    {/* Morning Plan Card */}
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', animationDelay: '0.1s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                                <TrendingUp size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Morning Plan</h2>
                        </div>

                        <textarea
                            className="glass-input"
                            rows="4"
                            value={record.morning_plan}
                            onChange={(e) => setRecord({ ...record, morning_plan: e.target.value })}
                            placeholder="What are your targets for today?"
                            style={{ resize: 'none', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.3)' }}
                        ></textarea>

                        <button
                            className="btn-gradient"
                            style={{ width: '100%' }}
                            onClick={() => handleSave('morning_plan')}
                            disabled={loading}
                        >
                            Save Plan
                        </button>
                    </div>

                    {/* End of Day Update */}
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem', animationDelay: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#10b981' }}>
                                <History size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>End of Day Result</h2>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Total New Business Value (LKR)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>Rs.</span>
                                <input
                                    type="number"
                                    className="glass-input"
                                    style={{ paddingLeft: '3rem', fontSize: '1.5rem', fontWeight: 'bold' }}
                                    value={record.actual_business}
                                    onChange={(e) => setRecord({ ...record, actual_business: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                Current: {formatCurrency(record.actual_business || 0)}
                            </p>
                        </div>

                        <button
                            className="btn-gradient"
                            style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                            onClick={() => handleSave('actual_business')}
                            disabled={loading}
                        >
                            Update Business
                        </button>

                        {msg && <div style={{ marginTop: '1rem', color: '#10b981', textAlign: 'center', fontSize: '0.875rem' }}>{msg}</div>}
                    </div>
                </div>

                {/* History Section */}
                <div className="glass-card animate-fade-in" style={{ padding: '2rem', animationDelay: '0.3s' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Recent Activity</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Plan</th>
                                    <th>Business Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((r, i) => (
                                    <tr key={i}>
                                        <td>{new Date(r.date).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: '300px', color: 'var(--text-muted)' }}>{r.morning_plan || '-'}</td>
                                        <td style={{ fontWeight: 600, color: r.actual_business > 0 ? '#10b981' : 'inherit' }}>
                                            {formatCurrency(r.actual_business)}
                                        </td>
                                        <td>
                                            {r.actual_business > 0 ? (
                                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>Completed</span>
                                            ) : (
                                                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pending</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No history available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
