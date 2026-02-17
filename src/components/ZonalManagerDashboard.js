'use client';
import { useState, useEffect } from 'react';
import { Save, Calendar, BarChart2, Shield, LogOut, Sun, Moon, UserPlus, CheckSquare, Trash2, Phone } from 'lucide-react';

export default function ZonalManagerDashboard({ user, onLogout, theme, toggleTheme }) {
    // Get current date in SL timezone (YYYY-MM-DD)
    const getSLDate = () => {
        const d = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // SL is UTC+5:30
        const localTime = new Date(d.getTime() + offset);
        return localTime.toISOString().split('T')[0];
    };

    const [viewMode, setViewMode] = useState('business'); // 'business', 'recruitment'
    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, summary
    const [date, setDate] = useState(getSLDate());
    const [locations, setLocations] = useState([]);
    const [records, setRecords] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState(null);

    // Recruitment State
    const [recruits, setRecruits] = useState([]);
    const [newRecruit, setNewRecruit] = useState({ recruit_name: '', nic: '', contact_no: '' });
    const [addingRecruit, setAddingRecruit] = useState(false);

    useEffect(() => {
        try {
            const parsed = user.managed_locations ? JSON.parse(user.managed_locations) : [];
            setLocations(parsed);
        } catch (e) {
            setLocations([]);
        }
    }, [user]);

    useEffect(() => {
        if (viewMode === 'recruitment') {
            fetchRecruits();
        } else if (locations.length > 0) {
            fetchRecords();
        }
    }, [locations, date, viewMode]);

    const fetchRecords = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            const recordsMap = {};
            if (Array.isArray(data)) {
                data.forEach(r => {
                    // Prioritize 'Total' branch records for this zone
                    if (r.branch === 'Total') {
                        recordsMap[r.zone] = r;
                    }
                });
            }
            setRecords(recordsMap);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (zone, field, value) => {
        setRecords(prev => ({
            ...prev,
            [zone]: {
                ...prev[zone],
                [field]: value,
                zone,
                branch: 'Total'
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const uniqueZones = [...new Set(locations.map(l => l.zone))];
            const payload = uniqueZones.map(zoneName => {
                const recordData = records[zoneName] || {};

                return {
                    user_id: user.id,
                    date,
                    zone_plan: recordData.zone_plan || '',
                    branch_plan: '', // No longer branch specific
                    agent_achievement: parseFloat(recordData.agent_achievement) || 0,
                    bdo_branch_performance: 0, // Simplified to one achievement field
                    zone: zoneName,
                    branch: 'Total'
                };
            });

            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('All records saved successfully!');
            } else {
                const errorData = await res.json();
                alert(`Failed to save: ${errorData.error || 'Please check your connection.'}`);
            }
            fetchRecords();
        } catch (e) {
            console.error(e);
            alert('Error saving records: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const fetchRecruits = async () => {
        try {
            let url = '/api/recruitments?type=all';
            if (user.role === 'zonal_manager') {
                url += `&zone=${user.zone}`;
            }
            const res = await fetch(url);
            const d = await res.json();
            if (d.error) throw new Error(d.error);
            setRecruits(Array.isArray(d) ? d : []);
        } catch (e) {
            console.error(e);
            setError(e.message);
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

    const updateRecruitStage = async (id, field, value) => {
        const updatedRecruits = recruits.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        );
        setRecruits(updatedRecruits);

        try {
            await fetch('/api/recruitments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, [field]: value || null })
            });
        } catch (e) {
            console.error(e);
            fetchRecruits();
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

    const handleLogout = onLogout;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Top Navigation Bar */}
            <header className="dashboard-header" style={{ background: 'var(--bg-card)' }}>
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">{viewMode === 'business' ? 'Zone-wise New Business Management System' : 'Recruitment Tracker System'}</p>
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
                        <Shield size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Zonal Manager</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.zone}</div>
                    </div>

                    <button onClick={onLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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


                {/* Tabs - Only for Business View */}
                {viewMode === 'business' && (
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
                )}

                {/* Content Card */}
                <div className="clean-card animate-fade-in">
                    <div className="card-header-accent">
                        <h2 className="text-h2" style={{ marginBottom: '0.25rem' }}>
                            {viewMode === 'recruitment' && 'Recruitment Tracker'}
                            {viewMode === 'business' && activeTab === 'plan' && 'Morning Session - Zone Plan Entry'}
                            {viewMode === 'business' && activeTab === 'achievement' && 'Evening Session - Zone Achievement'}
                            {viewMode === 'business' && activeTab === 'summary' && 'Daily Summary Overview'}
                        </h2>
                        <p className="text-muted">
                            {viewMode === 'recruitment' && 'Manage your recruitment pipeline and track onboarding progress'}
                            {viewMode === 'business' && activeTab === 'plan' && 'Enter daily new business plan for your zones'}
                            {viewMode === 'business' && activeTab === 'achievement' && 'Update the total new business figures achieved for your zones'}
                            {viewMode === 'business' && activeTab === 'summary' && 'Review performance across all allocated zones'}
                        </p>
                    </div>

                    {viewMode === 'recruitment' ? (
                        <div style={{ padding: '0 1rem' }}>
                            {/* Recruitment KPI Summary */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Recruits</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{recruits.length}</div>
                                </div>
                                <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Completed</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                                        {recruits.filter(r => r.date_file_submitted && r.date_exam_passed && r.date_documents_complete && r.date_appointed && r.date_code_issued).length}
                                    </div>
                                </div>
                                <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #ef4444' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444' }}>
                                        {recruits.filter(r => !(r.date_file_submitted && r.date_exam_passed && r.date_documents_complete && r.date_appointed && r.date_code_issued)).length}
                                    </div>
                                </div>
                            </div>

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

                                        {/* Status Checklist with Dates */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: '8px' }}>
                                            {[
                                                { key: 'date_file_submitted', label: 'File Submitted', color: '#3b82f6' },
                                                { key: 'date_exam_passed', label: 'Exam Passed', color: '#8b5cf6' },
                                                { key: 'date_documents_complete', label: 'Docs Complete', color: '#f59e0b' },
                                                { key: 'date_appointed', label: 'Appointed', color: '#10b981' },
                                                { key: 'date_code_issued', label: 'Code Issued', color: '#059669' }
                                            ].map(stage => (
                                                <div key={stage.key}>
                                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                                        {stage.label}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={recruit[stage.key] || ''}
                                                        onChange={(e) => updateRecruitStage(recruit.id, stage.key, e.target.value)}
                                                        className="clean-input"
                                                        style={{
                                                            fontSize: '0.8rem',
                                                            padding: '0.4rem',
                                                            border: recruit[stage.key] ? `1px solid ${stage.color}` : '1px solid var(--border)',
                                                            background: recruit[stage.key] ? `${stage.color}15` : 'var(--bg-card)',
                                                            color: recruit[stage.key] ? stage.color : 'var(--text-main)',
                                                            fontWeight: recruit[stage.key] ? 600 : 400
                                                        }}
                                                    />
                                                </div>
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
                    ) : (
                        <>
                            <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Date</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <Calendar size={18} color="var(--text-muted)" />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>

                                {/* Grand Totals KPI */}
                                {(() => {
                                    let totalPlan = 0;
                                    let totalAch = 0;

                                    const uniqueZones = [...new Set(locations.map(l => l.zone))];
                                    uniqueZones.forEach(zoneName => {
                                        const rec = records[zoneName] || {};
                                        totalPlan += parseFloat(rec.zone_plan) || 0;
                                        totalAch += parseFloat(rec.agent_achievement) || 0;
                                    });

                                    return (
                                        <div className="kpi-grid" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ background: 'var(--bg-input)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: '160px' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Plan (LKR)</div>
                                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalPlan)}</div>
                                            </div>
                                            <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', padding: '1rem 1.5rem', borderRadius: '12px', minWidth: '180px', color: 'white' }}>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Achievement</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{formatCurrency(totalAch)}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {locations.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                    No branches/zones assigned. Please contact Administrator.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {(() => {
                                        const uniqueZones = [...new Set(locations.map(l => l.zone))];

                                        return uniqueZones.map(zoneName => {
                                            const rec = records[zoneName] || {};
                                            const branchesInZone = locations.filter(l => l.zone === zoneName).map(l => l.branch);

                                            return (
                                                <div key={zoneName} className="zone-card" style={{
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    border: '1px solid var(--border)',
                                                    background: 'var(--bg-card)',
                                                    boxShadow: 'var(--shadow-md)'
                                                }}>
                                                    <div style={{
                                                        padding: '1.5rem',
                                                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                        color: 'white',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>📍 {zoneName}</h3>
                                                                <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: '0.25rem 0 0 0' }}>
                                                                    {branchesInZone.some(b => b === 'Total') ? 'Full Zone Coverage' : `Includes: ${branchesInZone.join(', ')}`}
                                                                </p>
                                                            </div>
                                                            {activeTab === 'summary' && (
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>Efficiency</div>
                                                                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                                                                        {rec.zone_plan > 0 ? ((rec.agent_achievement / rec.zone_plan) * 100).toFixed(1) : 0}%
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                                Daily Plan (LKR)
                                                            </label>
                                                            {activeTab === 'plan' ? (
                                                                <input
                                                                    type="number"
                                                                    className="clean-input"
                                                                    placeholder="0.00"
                                                                    value={rec.zone_plan || ''}
                                                                    onChange={(e) => handleInputChange(zoneName, 'zone_plan', e.target.value)}
                                                                    style={{ fontSize: '1.25rem', fontWeight: 700 }}
                                                                />
                                                            ) : (
                                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                                                    {formatCurrency(rec.zone_plan || 0)}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                                                                Total Achievement (LKR)
                                                            </label>
                                                            {activeTab === 'achievement' ? (
                                                                <input
                                                                    type="number"
                                                                    className="clean-input"
                                                                    placeholder="0.00"
                                                                    value={rec.agent_achievement || ''}
                                                                    onChange={(e) => handleInputChange(zoneName, 'agent_achievement', e.target.value)}
                                                                    style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}
                                                                />
                                                            ) : (
                                                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>
                                                                    {formatCurrency(rec.agent_achievement || 0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {activeTab === 'summary' && (
                                                        <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
                                                            <div style={{ background: 'var(--border)', width: '100%', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                                                <div style={{
                                                                    background: '#10b981',
                                                                    width: `${Math.min(100, rec.zone_plan > 0 ? (rec.agent_achievement / rec.zone_plan) * 100 : 0)}%`,
                                                                    height: '100%'
                                                                }} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
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
                                        {saving ? 'Saving...' : (
                                            <>
                                                <Save size={18} style={{ marginRight: '0.5rem' }} />
                                                Save {activeTab === 'plan' ? 'Daily Plan' : 'Business Achievement'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
