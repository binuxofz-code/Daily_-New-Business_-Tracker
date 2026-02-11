'use client';
import { useState, useEffect } from 'react';
import { Save, Calendar, BarChart2, Shield, LogOut, Sun, Moon } from 'lucide-react';

export default function ZonalManagerDashboard({ user, onLogout, theme, toggleTheme }) {
    // Get current date in SL timezone (YYYY-MM-DD)
    const getSLDate = () => {
        const d = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // SL is UTC+5:30
        const localTime = new Date(d.getTime() + offset);
        return localTime.toISOString().split('T')[0];
    };

    const [activeTab, setActiveTab] = useState('plan'); // plan, achievement, summary
    const [date, setDate] = useState(getSLDate());
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
            const results = await Promise.all(locations.map(async (loc) => {
                const key = `${loc.zone}-${loc.branch}`;
                const recordData = records[key] || {};

                const res = await fetch('/api/records', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        date,
                        zone_plan: recordData.branch_plan || recordData.zone_plan || '',
                        branch_plan: recordData.branch_plan || '',
                        agent_achievement: parseFloat(recordData.agent_achievement) || 0,
                        bdo_branch_performance: parseFloat(recordData.bdo_branch_performance) || 0,
                        zone: loc.zone,
                        branch: loc.branch
                    })
                });
                return res.ok;
            }));

            if (results.every(r => r === true)) {
                alert('All records saved successfully!');
            } else {
                alert('Some records failed to save. Please check your connection.');
            }
            fetchRecords();
        } catch (e) {
            console.error(e);
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
                            let totalAgentAch = 0;
                            let totalBranchAch = 0;
                            locations.forEach(loc => {
                                const key = `${loc.zone}-${loc.branch}`;
                                const rec = records[key] || {};
                                totalPlan += parseFloat(rec.branch_plan) || 0;
                                totalAgentAch += parseFloat(rec.agent_achievement) || 0;
                                totalBranchAch += parseFloat(rec.bdo_branch_performance) || 0;
                            });
                            const grandTotal = totalAgentAch + totalBranchAch;

                            return (
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ background: 'var(--bg-input)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', minWidth: '160px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Plan (LKR)</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(totalPlan)}</div>
                                    </div>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', minWidth: '160px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Agent Total</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(totalAgentAch)}</div>
                                    </div>
                                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', minWidth: '160px' }}>
                                        <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Branch Total</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{formatCurrency(totalBranchAch)}</div>
                                    </div>
                                    <div style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', padding: '1rem 1.5rem', borderRadius: '12px', minWidth: '180px', color: 'white' }}>
                                        <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Grand Total</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{formatCurrency(grandTotal)}</div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {locations.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                            No branches assigned. Please contact Administrator.
                        </div>
                    ) : (
                        <div>
                            {/* Table Header */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
                                padding: '1rem 1.25rem',
                                borderBottom: '2px solid var(--border)',
                                background: 'var(--bg-input)',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                <div>Location Detail</div>
                                <div style={{ textAlign: 'right' }}>Target (LKR)</div>
                                <div style={{ textAlign: 'right' }}>Agent Ach. (LKR)</div>
                                <div style={{ textAlign: 'right' }}>Branch Ach. (LKR)</div>
                            </div>

                            {(() => {
                                // Group locations by zone
                                const zoneGroups = {};
                                locations.forEach(loc => {
                                    if (!zoneGroups[loc.zone]) zoneGroups[loc.zone] = [];
                                    zoneGroups[loc.zone].push(loc);
                                });

                                let globalIdx = 0;
                                return Object.entries(zoneGroups).map(([zoneName, branches]) => {
                                    // Calculate zone totals
                                    const zonePlanTotal = branches.reduce((sum, loc) => {
                                        const key = `${loc.zone}-${loc.branch}`;
                                        const rec = records[key] || {};
                                        return sum + (parseFloat(rec.branch_plan) || 0);
                                    }, 0);

                                    const zoneAgentTotal = branches.reduce((sum, loc) => {
                                        const key = `${loc.zone}-${loc.branch}`;
                                        const rec = records[key] || {};
                                        return sum + (parseFloat(rec.agent_achievement) || 0);
                                    }, 0);

                                    const zoneBDOTotal = branches.reduce((sum, loc) => {
                                        const key = `${loc.zone}-${loc.branch}`;
                                        const rec = records[key] || {};
                                        return sum + (parseFloat(rec.bdo_branch_performance) || 0);
                                    }, 0);

                                    const zoneGrandTotal = zoneAgentTotal + zoneBDOTotal;

                                    return (
                                        <div key={zoneName} style={{ marginBottom: '2rem', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-md)' }}>
                                            {/* Zone Header Row */}
                                            <div className="zone-header-grid" style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1.5fr 1fr 2fr',
                                                padding: '1.25rem 1.5rem',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                                color: 'white',
                                                fontWeight: 700,
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.1rem' }}>📍 {zoneName.toLowerCase().includes('zone') ? zoneName : `${zoneName} Zone`}</div>
                                                <div style={{ textAlign: 'right', fontSize: '0.9rem', opacity: 0.9 }}>
                                                    Target: {formatCurrency(zonePlanTotal)}
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '1.1rem' }}>
                                                    Zone Total: {formatCurrency(zoneGrandTotal)}
                                                </div>
                                            </div>

                                            {/* Branch Rows */}
                                            {branches.map(loc => {
                                                const key = `${loc.zone}-${loc.branch}`;
                                                const rec = records[key] || {};
                                                const isEven = globalIdx % 2 === 0;
                                                globalIdx++;

                                                return (
                                                    <div key={key} style={{
                                                        padding: '1rem 1.5rem',
                                                        borderBottom: '1px solid var(--border)',
                                                        background: isEven ? 'transparent' : 'var(--bg-input)',
                                                        opacity: 0.95
                                                    }}>
                                                        {/* Single Branch Layout */}
                                                        <div className="branch-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '1.2rem' }}>🏢</span> {loc.branch}
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                {activeTab === 'plan' ? (
                                                                    <input
                                                                        type="number"
                                                                        className="clean-input"
                                                                        placeholder="0.00"
                                                                        value={rec.branch_plan || ''}
                                                                        onChange={(e) => handleInputChange(loc.zone, loc.branch, 'branch_plan', e.target.value)}
                                                                        style={{ fontSize: '0.9rem', padding: '0.5rem', textAlign: 'right', maxWidth: '120px' }}
                                                                    />
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                                                                        {formatCurrency(rec.branch_plan || 0)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                {activeTab === 'achievement' ? (
                                                                    <input
                                                                        type="number"
                                                                        className="clean-input"
                                                                        placeholder="0.00"
                                                                        style={{ fontWeight: 600, color: '#059669', fontSize: '0.9rem', padding: '0.5rem', textAlign: 'right', maxWidth: '120px' }}
                                                                        value={rec.agent_achievement || ''}
                                                                        onChange={(e) => handleInputChange(loc.zone, loc.branch, 'agent_achievement', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span style={{ fontWeight: 700, color: '#059669' }}>
                                                                        {formatCurrency(rec.agent_achievement || 0)}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div style={{ textAlign: 'right' }}>
                                                                {activeTab === 'achievement' ? (
                                                                    <input
                                                                        type="number"
                                                                        className="clean-input"
                                                                        placeholder="0.00"
                                                                        style={{ fontWeight: 600, color: '#0284c7', fontSize: '0.9rem', padding: '0.5rem', textAlign: 'right', maxWidth: '120px' }}
                                                                        value={rec.bdo_branch_performance || ''}
                                                                        onChange={(e) => handleInputChange(loc.zone, loc.branch, 'bdo_branch_performance', e.target.value)}
                                                                    />
                                                                ) : (
                                                                    <span style={{ fontWeight: 700, color: '#0284c7' }}>
                                                                        {formatCurrency(rec.bdo_branch_performance || 0)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Zone Footer / Progress */}
                                            {activeTab === 'summary' && (
                                                <div style={{ padding: '1rem 1.5rem', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '2rem' }}>
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Agent Ach:</span> <span style={{ fontWeight: 600, color: '#059669' }}>{formatCurrency(zoneAgentTotal)}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <span style={{ color: 'var(--text-muted)' }}>Branch Ach:</span> <span style={{ fontWeight: 600, color: '#0284c7' }}>{formatCurrency(zoneBDOTotal)}</span>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Efficiency:</span>
                                                        <div style={{ background: 'var(--border)', width: '100px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                background: '#3b82f6',
                                                                width: `${Math.min(100, zonePlanTotal > 0 ? (zoneGrandTotal / zonePlanTotal) * 100 : 0)}%`,
                                                                height: '100%'
                                                            }} />
                                                        </div>
                                                        <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.9rem' }}>
                                                            {zonePlanTotal > 0 ? ((zoneGrandTotal / zonePlanTotal) * 100).toFixed(1) : 0}%
                                                        </span>
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
                </div>
            </main>
        </div>
    );
}
