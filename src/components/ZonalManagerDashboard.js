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
                        zone_plan: record.zone_plan,
                        branch_plan: record.branch_plan,
                        aaf_agents: parseInt(record.aaf_agents) || 0,
                        agent_achievement: parseFloat(record.agent_achievement) || 0,
                        bdo_branch_performance: parseFloat(record.bdo_branch_performance) || 0,
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', padding: '0.75rem 1rem', borderBottom: '2px solid #f3f4f6', background: '#f9fafb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>
                                <div>Zone / Branch</div>
                                <div>Zone Plan</div>
                                <div>Branch Plan</div>
                                <div>Agent Ach.</div>
                                <div>BDO Perf.</div>
                            </div>

                            {(() => {
                                // Group locations by zone
                                const zoneGroups = {};
                                locations.forEach(loc => {
                                    if (!zoneGroups[loc.zone]) {
                                        zoneGroups[loc.zone] = [];
                                    }
                                    zoneGroups[loc.zone].push(loc);
                                });

                                let rowIndex = 0;
                                return Object.entries(zoneGroups).map(([zoneName, branches]) => {
                                    // Calculate zone totals
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
                                        <div key={zoneName} style={{ marginBottom: '1rem' }}>
                                            {/* Zone Header Row */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                                                padding: '0.75rem 1rem',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                color: 'white',
                                                fontWeight: 600,
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ fontSize: '1rem' }}>📍 {zoneName} Zone</div>
                                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{branches.length} Branches</div>
                                                <div></div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                                                    {activeTab === 'summary' ? formatCurrency(zoneAgentTotal) : 'Agent Total'}
                                                </div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                                                    {activeTab === 'summary' ? formatCurrency(zoneBDOTotal) : 'BDO Total'}
                                                </div>
                                            </div>

                                            {/* Zone Grand Total Row */}
                                            {activeTab === 'summary' && (
                                                <div style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1.5fr 1fr 1fr 2fr',
                                                    padding: '0.5rem 1rem',
                                                    background: '#1e40af',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    alignItems: 'center',
                                                    fontSize: '1.05rem'
                                                }}>
                                                    <div></div>
                                                    <div></div>
                                                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Zone Total:</div>
                                                    <div style={{ textAlign: 'right', paddingRight: '1rem' }}>
                                                        {formatCurrency(zoneGrandTotal)}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Branch Rows */}
                                            {branches.map((loc, idx) => {
                                                const key = `${loc.zone}-${loc.branch}`;
                                                const rec = records[key] || {};
                                                const bgColor = rowIndex % 2 === 0 ? 'white' : '#fafafa';
                                                rowIndex++;

                                                return (
                                                    <div key={key} style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                                                        padding: '1rem',
                                                        alignItems: 'center',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        background: bgColor
                                                    }}>
                                                        {/* Branch Name */}
                                                        <div>
                                                            <div style={{ fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
                                                                🏢 {loc.branch} Branch
                                                            </div>
                                                        </div>

                                                        {/* Zone Plan */}
                                                        <div style={{ paddingRight: '0.5rem' }}>
                                                            {activeTab === 'plan' && idx === 0 ? (
                                                                <input
                                                                    className="clean-input"
                                                                    placeholder="Zone target..."
                                                                    value={rec.zone_plan || ''}
                                                                    onChange={(e) => {
                                                                        // Update zone plan for all branches in this zone
                                                                        branches.forEach(b => {
                                                                            handleInputChange(b.zone, b.branch, 'zone_plan', e.target.value);
                                                                        });
                                                                    }}
                                                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                                                    {rec.zone_plan || (idx === 0 ? '-' : '')}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Branch Plan */}
                                                        <div style={{ paddingRight: '0.5rem' }}>
                                                            {activeTab === 'plan' ? (
                                                                <input
                                                                    className="clean-input"
                                                                    placeholder="Branch target..."
                                                                    value={rec.branch_plan || ''}
                                                                    onChange={(e) => handleInputChange(loc.zone, loc.branch, 'branch_plan', e.target.value)}
                                                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                                                                    {rec.branch_plan || '-'}
                                                                </span>
                                                            )}
                                                        </div>



                                                        {/* Agent Achievement */}
                                                        <div>
                                                            {activeTab === 'achievement' ? (
                                                                <input
                                                                    type="number"
                                                                    className="clean-input"
                                                                    placeholder="0.00"
                                                                    style={{ fontWeight: 600, color: '#059669', fontSize: '0.85rem', padding: '0.5rem' }}
                                                                    value={rec.agent_achievement || ''}
                                                                    onChange={(e) => handleInputChange(loc.zone, loc.branch, 'agent_achievement', e.target.value)}
                                                                />
                                                            ) : (
                                                                activeTab === 'summary' ? (
                                                                    <span style={{ fontWeight: 600, color: (rec.agent_achievement > 0) ? '#059669' : '#6b7280', fontSize: '0.9rem' }}>
                                                                        {formatCurrency(rec.agent_achievement || 0)}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', color: '#6b7280' }}>Pending</span>
                                                                )
                                                            )}
                                                        </div>

                                                        {/* BDO Branch Performance */}
                                                        <div>
                                                            {activeTab === 'achievement' ? (
                                                                <input
                                                                    type="number"
                                                                    className="clean-input"
                                                                    placeholder="0.00"
                                                                    style={{ fontWeight: 600, color: '#0284c7', fontSize: '0.85rem', padding: '0.5rem' }}
                                                                    value={rec.bdo_branch_performance || ''}
                                                                    onChange={(e) => handleInputChange(loc.zone, loc.branch, 'bdo_branch_performance', e.target.value)}
                                                                />
                                                            ) : (
                                                                activeTab === 'summary' ? (
                                                                    <span style={{ fontWeight: 600, color: (rec.bdo_branch_performance > 0) ? '#0284c7' : '#6b7280', fontSize: '0.9rem' }}>
                                                                        {formatCurrency(rec.bdo_branch_performance || 0)}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', color: '#6b7280' }}>Pending</span>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
