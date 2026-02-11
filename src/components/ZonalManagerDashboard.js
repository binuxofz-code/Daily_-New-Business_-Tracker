
'use client';
import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Save, Calendar, TrendingUp } from 'lucide-react';

export default function ZonalManagerDashboard({ user, onLogout }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [locations, setLocations] = useState([]);
    const [records, setRecords] = useState({}); // { "ZoneA-Branch1": { morning_plan, actual_business } }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Parse locations assigned by admin
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
            // We fetch all records for this user for the date
            // The API returns a list. We need to map them to our locations.
            const res = await fetch(`/api/records?userId=${user.id}&date=${date}`);
            const data = await res.json();

            const recordsMap = {};
            if (Array.isArray(data)) {
                data.forEach(r => {
                    const key = `${r.zone}-${r.branch}`;
                    recordsMap[key] = r;
                });
            } else if (data.id) {
                // Single record fallback - rarely happens with new logic but good safety
                const key = `${data.zone}-${data.branch}`;
                recordsMap[key] = data;
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
                branch // Ensure we have these for saving
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save each location's record
            // Parallel requests might be okay for small number of branches (4-5)
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
            alert('All records saved successfully!');
            fetchRecords(); // Refresh
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
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #ec4899, #8b5cf6)', borderRadius: '8px' }}></div>
                        Tracker<span style={{ fontWeight: 400, opacity: 0.5 }}>Pro</span>
                    </div>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Your Role</h4>
                    <div style={{ fontWeight: 600 }}>Zonal Manager</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{locations.length} Branches Assigned</div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Branch Entry</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Enter daily performance for your zones</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} color="var(--primary)" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                            />
                        </div>
                        <button className="btn-ghost" onClick={onLogout}>Logout</button>
                    </div>
                </header>

                <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Assigned Branches</h3>
                        <button onClick={handleSave} disabled={saving} className="btn-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
                        </button>
                    </div>

                    {locations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No branches assigned. Please contact Administrator.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Header Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                <div>Zone / Branch</div>
                                <div>Morning Plan</div>
                                <div>Actual Business (LKR)</div>
                            </div>

                            {locations.map((loc, idx) => {
                                const key = `${loc.zone}-${loc.branch}`;
                                const rec = records[key] || {};

                                return (
                                    <div key={idx} className="glass-card" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>{loc.zone}</div>
                                            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{loc.branch}</div>
                                        </div>

                                        <div>
                                            <input
                                                className="glass-input"
                                                placeholder="Enter plan..."
                                                value={rec.morning_plan || ''}
                                                onChange={(e) => handleInputChange(loc.zone, loc.branch, 'morning_plan', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <input
                                                type="number"
                                                className="glass-input"
                                                placeholder="0.00"
                                                style={{ fontWeight: 600, color: '#10b981' }}
                                                value={rec.actual_business || ''}
                                                onChange={(e) => handleInputChange(loc.zone, loc.branch, 'actual_business', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
