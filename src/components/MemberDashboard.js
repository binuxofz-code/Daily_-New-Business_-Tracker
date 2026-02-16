
'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon, BarChart2, Save, LogOut, Calendar, User, UserPlus, CheckSquare, Trash2, Phone } from 'lucide-react';

export default function MemberDashboard({ user, onLogout, theme, toggleTheme }) {
    // Get current date in SL timezone (YYYY-MM-DD)
    const getSLDate = () => {
        const d = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // SL is UTC+5:30
        const localTime = new Date(d.getTime() + offset);
        return localTime.toISOString().split('T')[0];
    };


    const [viewMode, setViewMode] = useState('business'); // 'business', 'recruitment'
    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, history
    const [date, setDate] = useState(getSLDate());
    const [record, setRecord] = useState({ morning_plan: '', actual_business: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);

    // Recruitment State
    const [recruits, setRecruits] = useState([]);
    const [newRecruit, setNewRecruit] = useState({ recruit_name: '', nic: '', contact_no: '' });
    const [addingRecruit, setAddingRecruit] = useState(false);

    const [error, setError] = useState(null);

    useEffect(() => {
        if (viewMode === 'recruitment') {
            fetchRecruits();
        } else {
            fetchRecord();
            if (activeTab === 'history') fetchHistory();
        }
    }, [date, activeTab, viewMode]);

    const fetchRecord = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const activeRecord = Array.isArray(data) && data.length > 0 ? data[0] : null;

            if (activeRecord) {
                setRecord(activeRecord);
            } else {
                setRecord({ morning_plan: '', actual_business: '' });
            }
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/records?userId=${user.id}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setHistory(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            // setError(e.message); // Optional: don't block main UI for history error
        }
    };

    const fetchRecruits = async () => {
        try {
            const res = await fetch(`/api/recruitments?userId=${user.id}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setRecruits(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setError(e.message);
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
                await fetchRecord();
                alert('Success: Your record has been saved.');
            } else {
                alert('Failed to save.');
            }
        } catch (e) {
            alert('Error saving record.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddRecruit = async (e) => {
        e.preventDefault();
        if (!newRecruit.recruit_name) return alert('Name is required');

        setAddingRecruit(true);
        try {
            const res = await fetch('/api/recruitments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    ...newRecruit
                })
            });

            if (res.ok) {
                setNewRecruit({ recruit_name: '', nic: '', contact_no: '' });
                fetchRecruits();
                alert('Recruit added successfully!');
            } else {
                alert('Failed to add recruit');
            }
        } catch (e) {
            console.error(e);
            alert('Error adding recruit');
        } finally {
            setAddingRecruit(false);
        }
    };

    const toggleRecruitStatus = async (id, field, currentValue) => {
        // Calculate new value: if currently checked (someting there), set to null. If null/false, set to current date.
        const newValue = currentValue ? null : getSLDate();

        // Optimistic update
        const updatedRecruits = recruits.map(r =>
            r.id === id ? { ...r, [field]: newValue } : r
        );
        setRecruits(updatedRecruits);

        try {
            await fetch('/api/recruitments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: newValue })
            });
        } catch (e) {
            console.error(e);
            fetchRecruits(); // Revert on error
        }
    };

    const handleDeleteRecruit = async (id) => {
        if (!confirm('Are you sure you want to delete this recruit?')) return;
        try {
            await fetch(`/api/recruitments?id=${id}`, { method: 'DELETE' });
            fetchRecruits();
        } catch (e) {
            alert('Error deleting');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Header */}
            {/* Header */}
            <header className="dashboard-header" style={{ background: 'var(--bg-card)' }}>
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">{viewMode === 'business' ? 'New Business Management System' : 'Recruitment Tracker System'}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={toggleTheme}
                        className="btn-secondary"
                        style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>

                    {/* View Mode Toggle */}
                    <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.25rem', marginRight: '1rem' }}>
                        <button
                            onClick={() => setViewMode('business')}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: viewMode === 'business' ? 'var(--accent-blue)' : 'transparent',
                                color: viewMode === 'business' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <BarChart2 size={16} /> Business
                        </button>
                        <button
                            onClick={() => setViewMode('recruitment')}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: '16px',
                                border: 'none',
                                background: viewMode === 'recruitment' ? '#10b981' : 'transparent',
                                color: viewMode === 'recruitment' ? '#fff' : 'var(--text-muted)',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <UserPlus size={16} /> Recruitment
                        </button>
                    </div>

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

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}


                {/* KPI Grid (Only show on Business View) */}
                {viewMode === 'business' && activeTab !== 'history' && (
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
                )}

                {/* Tabs - Only for Business View */}
                {viewMode === 'business' && (
                    <div className="nav-tabs">
                        <button
                            className={`nav-tab ${activeTab === 'plan' ? 'active' : ''}`}
                            onClick={() => setActiveTab('plan')}
                        >
                            <Sun size={18} /> Plan
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'achievement' ? 'active' : ''}`}
                            onClick={() => setActiveTab('achievement')}
                        >
                            <Moon size={18} /> Achievement
                        </button>
                        <button
                            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <BarChart2 size={18} /> History
                        </button>
                    </div>
                )}


                {/* Content */}
                <div className="clean-card animate-fade-in">
                    <div className="card-header-accent">
                        <h2 className="text-h2">
                            {viewMode === 'recruitment' && 'Recruitment Tracker'}
                            {viewMode === 'business' && activeTab === 'plan' && 'Morning Session - Plan Entry'}
                            {viewMode === 'business' && activeTab === 'achievement' && 'Evening Session - Achievement'}
                            {viewMode === 'business' && activeTab === 'history' && 'Performance History'}
                        </h2>
                        <p className="text-muted">
                            {viewMode === 'recruitment' && 'Manage your new recruits and their onboarding status'}
                            {viewMode === 'business' && activeTab === 'plan' && 'What is your target for today?'}
                            {viewMode === 'business' && activeTab === 'achievement' && 'Update your actual business figures'}
                            {viewMode === 'business' && activeTab === 'history' && 'Your past performance records'}
                        </p>
                    </div>

                    {viewMode === 'recruitment' ? (
                        <div style={{ padding: '0 1rem' }}>
                            {/* Add Recruit Form */}
                            <div style={{ background: 'var(--bg-input)', padding: '1.5rem', borderRadius: '12px', border: '1px dashed var(--border)', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>Add New Recruit</h3>
                                <form onSubmit={handleAddRecruit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Full Name</label>
                                        <input
                                            className="clean-input"
                                            placeholder="e.g. Sunil Perera"
                                            value={newRecruit.recruit_name}
                                            onChange={(e) => setNewRecruit({ ...newRecruit, recruit_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', color: 'var(--text-muted)' }}>Contact No</label>
                                        <input
                                            className="clean-input"
                                            placeholder="07X XXX XXXX"
                                            value={newRecruit.contact_no}
                                            onChange={(e) => setNewRecruit({ ...newRecruit, contact_no: e.target.value })}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={addingRecruit}
                                        style={{ height: '42px' }}
                                    >
                                        {addingRecruit ? 'Adding...' : '+ Add Recruit'}
                                    </button>
                                </form>
                            </div>

                            {/* Recruits List */}
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {recruits.map(recruit => (
                                    <div key={recruit.id} className="clean-card" style={{ padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{recruit.recruit_name}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                                    <Phone size={14} /> {recruit.contact_no || 'No Contact'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteRecruit(recruit.id)}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                                                title="Delete Recruit"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        {/* Status Checklist */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                            {[
                                                { key: 'date_file_submitted', label: 'File Submitted', color: '#3b82f6' },
                                                { key: 'date_exam_passed', label: 'Exam Passed', color: '#8b5cf6' },
                                                { key: 'date_documents_complete', label: 'Docs Complete', color: '#f59e0b' },
                                                { key: 'date_appointed', label: 'Appointed', color: '#10b981' },
                                                { key: 'date_code_issued', label: 'Code Issued', color: '#059669' }
                                            ].map(stage => (
                                                <label key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <div
                                                        onClick={() => toggleRecruitStatus(recruit.id, stage.key, recruit[stage.key])}
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            borderRadius: '4px',
                                                            border: recruit[stage.key] ? '2px solid #10b981' : '2px solid var(--text-muted)',
                                                            background: recruit[stage.key] ? '#10b981' : 'transparent',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {recruit[stage.key] && <CheckSquare size={14} color="white" />}
                                                    </div>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: recruit[stage.key] ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                                        {stage.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {recruits.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                        No recruits added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'history' ? (
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
                    ) : (
                        // Plan Or Achievement View
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
                    )}
                </div>
            </main>
        </div>
    );
}
