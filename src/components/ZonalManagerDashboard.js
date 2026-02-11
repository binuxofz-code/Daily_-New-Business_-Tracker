'use client';
import { useState, useEffect } from 'react';
import { Save, Calendar, BarChart2, Shield, LogOut, Sun, Moon } from 'lucide-react';

export default function ZonalManagerDashboard({ user, onLogout, theme, toggleTheme }) {
    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, summary
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [locations, setLocations] = useState([]);
    const [records, setRecords] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        try {
            const parsed = user.managed_locations ? JSON.parse(user.managed_locations) : [];
            setLocations(parsed);
        } catch (e) {
            setLocations([]);
        }
    }, [user]);

    useEffect(() => {
        if (locations.length > 0) fetchRecords();
    }, [locations, date]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();

            const recordsMap = {};
            if (Array.isArray(data)) {
                data.forEach(r => {
                    const key = `${r.zone}-${r.branch}`;
                    recordsMap[key] = r;
                });
            }
            setRecords(recordsMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (zone, branch, field, value) => {
        const key = `${zone}-${branch}`;
        setRecords(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value,
                zone,
                branch
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = locations.map(loc => {
                const key = `${loc.zone}-${loc.branch}`;
                const record = records[key] || {};

                return fetch('/api/records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        date,
                        morning_plan: record.morning_plan,
                        actual_business: parseFloat(record.actual_business) || 0,
                        zone: loc.zone,
                        branch: loc.branch
                    })
                });
            });

            await Promise.all(promises);
            alert('Records saved successfully!');
            fetchRecords();
        } catch (e) {
            alert('Error saving records');
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Top Navigation Bar */}
            <header className="dashboard-header" style={{ background: 'var(--bg-card)' }}>
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">Zone-wise New Business Management System</p>
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
                        <Shield size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Zonal Manager Access</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{locations.length} Branches</div>
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

                {/* Tabs */}
                <div className="nav-tabs">
                    <button
                        className={`nav-tab ${activeTab === 'plan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('plan')}
                    >
                        <Sun size={18} /> Morning - Plan Entry
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'achievement' ? 'active' : ''}`}
                        onClick={() => setActiveTab('achievement')}
                    >
                        <Moon size={18} /> Evening - Achievement Entry
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
                        onClick={() => setActiveTab('summary')}
                    >
                        <BarChart2 size={18} /> Summary & Analytics
                    </button>
                </div>

                {/* Content Card */}
                <div className="clean-card animate-fade-in">
                    <div className="card-header-accent">
                        <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>
                            {activeTab === 'plan' && 'Morning Session - Daily Plan Entry'}
                            {activeTab === 'achievement' && 'Evening Session - Business Achievement'}
                            {activeTab === 'summary' && 'Daily Summary Overview'}
                        </h2>
                        <p className="text-muted">
                            {activeTab === 'plan' && 'Enter your daily new business plan for today'}
                            {activeTab === 'achievement' && 'Update the actual new business figures achieved'}
                            {activeTab === 'summary' && 'Review performance across all allocated branches'}
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Date</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                <Calendar size={18} color="#6b7280" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', color: '#111827' }}
                                />
                            </div>
                        </div>
                    </div>

                    {locations.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
                            No branches assigned. Please contact Administrator.
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.75rem 1rem', borderBottom: '2px solid #f3f4f6', background: '#f9fafb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>
                                <div>Zone / Branch Details</div>
                                <div>{activeTab === 'plan' ? 'New Business Plan' : 'Morning Plan'}</div>
                                <div>{activeTab === 'achievement' ? 'Actual Achievement (LKR)' : (activeTab === 'summary' ? 'Achievement' : 'Status')}</div>
                            </div>

                            {locations.map((loc, idx) => {
                                const key = `${loc.zone}-${loc.branch}`;
                                const rec = records[key] || {};

                                return (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr',
                                        padding: '1rem',
                                        alignItems: 'center',
                                        borderBottom: '1px solid #f3f4f6',
                                        background: idx % 2 === 0 ? 'white' : '#fafafa'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>{loc.zone}</div>
                                            <div style={{ fontSize: '1rem', fontWeight: 500 }}>{loc.branch} Branch</div>
                                        </div>

                                        {/* Morning Plan Column */}
                                        <div style={{ paddingRight: '1rem' }}>
                                            {activeTab === 'plan' ? (
                                                <input
                                                    className="clean-input"
                                                    placeholder="Enter plan description..."
                                                    value={rec.morning_plan || ''}
                                                    onChange={(e) => handleInputChange(loc.zone, loc.branch, 'morning_plan', e.target.value)}
                                                />
                                            ) : (
                                                <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                                                    {rec.morning_plan || '-'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actual Achievement Column */}
                                        <div>
                                            {activeTab === 'achievement' ? (
                                                <input
                                                    type="number"
                                                    className="clean-input"
                                                    placeholder="0.00"
                                                    style={{ fontWeight: 600, color: '#059669' }}
                                                    value={rec.actual_business || ''}
                                                    onChange={(e) => handleInputChange(loc.zone, loc.branch, 'actual_business', e.target.value)}
                                                />
                                            ) : (
                                                activeTab === 'summary' ? (
                                                    <span style={{ fontWeight: 600, color: (rec.actual_business > 0) ? '#059669' : '#6b7280' }}>
                                                        {formatCurrency(rec.actual_business || 0)}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', color: '#6b7280' }}>Pending Evening Entry</span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab !== 'summary' && locations.length > 0 && (
                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary"
                                style={{ width: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}
                            >
                                {saving ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                                        Save {activeTab === 'plan' ? 'Plans' : 'Achievements'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {activeTab === 'summary' && locations.length > 0 && (
                        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#0369a1', fontWeight: 600 }}>Total Zone Achievement Today</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0284c7' }}>
                                    {formatCurrency(Object.values(records).reduce((acc, r) => acc + (parseFloat(r.actual_business) || 0), 0))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
