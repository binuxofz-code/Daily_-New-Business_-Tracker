
'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon, BarChart2, Save, LogOut, Calendar, User } from 'lucide-react';

export default function MemberDashboard({ user, onLogout, theme, toggleTheme }) {
    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, history
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [record, setRecord] = useState({ morning_plan: '', actual_business: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        fetchRecord();
        if (activeTab === 'history') fetchHistory();
    }, [date, activeTab]);

    const fetchRecord = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();
            if (data.id) {
                setRecord(data);
            } else {
                setRecord({ morning_plan: '', actual_business: '' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/records?userId=${user.id}`);
            const data = await res.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    date,
                    morning_plan: record.morning_plan,
                    actual_business: parseFloat(record.actual_business) || 0
                })
            });
            if (res.ok) {
                alert('Saved successfully!');
                fetchRecord(); // Refresh to ensure sync
            } else {
                alert('Failed to save.');
            }
        } catch (e) {
            alert('Error saving.');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Header */}
            <header className="dashboard-header" style={{ background: 'var(--bg-card)' }}>
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">Member Performance Portal</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={toggleTheme}
                        className="btn-secondary"
                        style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', color: 'var(--accent-blue)' }}>
                        <User size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Team Member</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {user.branch ? user.branch : 'No Branch'} • {user.zone ? user.zone : 'No Zone'}
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem' }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

                {/* Tabs */}
                <div className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'plan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plan')}
                    >
                        <Sun size={18} /> Morning - Plan
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'achievement' ? 'active' : ''}`}
                        onClick={() => setActiveTab('achievement')}
                    >
                        <Moon size={18} /> Evening - Achievement
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <BarChart2 size={18} /> History
                    </button>
                </div>

                {/* Content */}
                <div className="clean-card animate-fade-in">
                    <div className="card-header-accent">
                        <h2 className="text-h2">
                            {activeTab === 'plan' && 'Morning Session - Plan Entry'}
                            {activeTab === 'achievement' && 'Evening Session - Achievement'}
                            {activeTab === 'history' && 'Performance History'}
                        </h2>
                        <p className="text-muted">
                            {activeTab === 'plan' && 'What is your target for today?'}
                            {activeTab === 'achievement' && 'Update your actual business figures'}
                            {activeTab === 'history' && 'Your past performance records'}
                        </p>
                    </div>

                    {activeTab !== 'history' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Date</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                        <Calendar size={18} color="#6b7280" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#111827', width: '100%' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>Branch Information</label>
                                    <div style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#6b7280', fontSize: '0.9rem' }}>
                                        {user.branch} Branch / {user.zone} Zone
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'plan' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Daily New Business Plan</label>
                                    <textarea
                                        className="clean-input"
                                        rows={4}
                                        placeholder="Describe your plan for today (e.g., maintain relationships, visit client X...)"
                                        value={record.morning_plan || ''}
                                        onChange={(e) => setRecord({ ...record, morning_plan: e.target.value })}
                                    />
                                </div>
                            )}

                            {activeTab === 'achievement' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>Actual Business Achieved (LKR)</label>
                                    <input
                                        type="number"
                                        className="clean-input"
                                        style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}
                                        placeholder="0.00"
                                        value={record.actual_business || ''}
                                        onChange={(e) => setRecord({ ...record, actual_business: e.target.value })}
                                    />
                                    <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                                        Enter the total value of new business generated today.
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button onClick={handleSave} className="btn-primary" style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Record'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Morning Plan</th>
                                        <th>Achievement</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h, i) => (
                                        <tr key={i}>
                                            <td style={{ fontWeight: 500 }}>{h.date}</td>
                                            <td style={{ color: '#6b7280', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.morning_plan || '-'}</td>
                                            <td style={{ fontWeight: 600, color: h.actual_business > 0 ? '#059669' : '#374151' }}>
                                                {formatCurrency(h.actual_business || 0)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '99px',
                                                    background: h.actual_business ? '#ecfdf5' : '#f3f4f6',
                                                    color: h.actual_business ? '#047857' : '#6b7280',
                                                    fontWeight: 600
                                                }}>
                                                    {h.actual_business ? 'Completed' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>No records found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
