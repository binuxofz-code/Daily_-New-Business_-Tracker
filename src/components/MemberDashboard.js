
'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon, BarChart2, Save, LogOut, Calendar, User } from 'lucide-react';

export default function MemberDashboard({ user, onLogout, theme, toggleTheme }) {
    // Get current date in SL timezone (YYYY-MM-DD)
    const getSLDate = () => {
        const d = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // SL is UTC+5:30
        const localTime = new Date(d.getTime() + offset);
        return localTime.toISOString().split('T')[0];
    };


    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, history
    const [date, setDate] = useState(getSLDate());
    const [record, setRecord] = useState({ morning_plan: '', actual_business: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [monthlyTarget, setMonthlyTarget] = useState(null);

    useEffect(() => {
        fetchRecord();
        fetchMonthlyTarget();
        if (activeTab === 'history') fetchHistory();
    }, [date, activeTab]);

    const fetchMonthlyTarget = async () => {
        try {
            const month = date.slice(0, 7);
            const res = await fetch(`/api/targets?username=${user.username}&month=${month}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setMonthlyTarget(data[0]);
            } else {
                setMonthlyTarget(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchRecord = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();

            // API now returns an array for flexibility
            const activeRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;

            if (activeRecord) {
                setRecord(activeRecord);
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
        if (!record.morning_plan && activeTab === 'plan') {
            alert('Please enter your plan first.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    date,
                    morning_plan: record.morning_plan || '',
                    actual_business: parseFloat(record.actual_business) || 0,
                    zone: user.zone || '',
                    branch: user.branch || ''
                })
            });
            if (res.ok) {
                // Refresh local state immediately
                await fetchRecord();
                alert('Success: Your record has been saved and is now visible.');
            } else {
                alert('Failed to save. Please try again.');
            }
        } catch (e) {
            alert('Error saving record.');
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
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                {/* Monthly Goals Section */}
                <div className="clean-card" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Monthly Goals ({date.slice(0, 7)})</h3>
                    </div>
                    {monthlyTarget ? (
                        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>New Business Target</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(monthlyTarget.new_business_target || 0)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Renewal Target</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(monthlyTarget.renewal_target || 0)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Renewal Collected</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{formatCurrency(monthlyTarget.renewal_collected || 0)}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Pending Renewal</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>
                                    {formatCurrency(Math.max(0, (monthlyTarget.renewal_target || 0) - (monthlyTarget.renewal_collected || 0)))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            No monthly targets set for this month.
                        </div>
                    )}
                </div>

                {/* Daily Performance KPI */}
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Today's Target (Plan)</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {record.morning_plan ? 'SET' : 'PENDING'}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                            {record.morning_plan ? record.morning_plan : 'Please enter your plan for today'}
                        </p>
                    </div>
                    <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Achievement Today (LKR)</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
                            {formatCurrency(parseFloat(record.actual_business) || 0)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            Status: <span style={{ color: (parseFloat(record.actual_business) > 0) ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{(parseFloat(record.actual_business) > 0) ? 'Achievement Recorded' : 'Awaiting Evening Update'}</span>
                        </div>
                    </div>
                </div>

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
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Date</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <Calendar size={18} color="var(--text-muted)" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-main)', width: '100%', fontSize: '0.85rem' }}
                                        />
                                        <button
                                            onClick={() => setDate(getSLDate())}
                                            style={{ fontSize: '0.7rem', background: 'var(--bg-body)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', color: 'var(--accent-blue)', fontWeight: 600 }}
                                        >
                                            Today
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>Branch Information</label>
                                    <div style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '8px', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {user.branch} Branch / {user.zone} Zone
                                    </div>
                                </div>
                            </div>

                            {activeTab === 'plan' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Daily New Business Plan</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Actual Business Achieved (LKR)</label>
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
                        <div className="table-container">
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
                                            <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{h.date}</td>
                                            <td style={{ color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.morning_plan || '-'}</td>
                                            <td style={{ fontWeight: 700, color: h.actual_business > 0 ? '#059669' : 'var(--text-muted)' }}>
                                                {formatCurrency(h.actual_business || 0)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '12px',
                                                    background: h.actual_business ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-input)',
                                                    color: h.actual_business ? '#059669' : 'var(--text-muted)',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    border: h.actual_business ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border)'
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
