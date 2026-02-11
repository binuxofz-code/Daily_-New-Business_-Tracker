
'use client';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Users, MapPin, Briefcase, Calendar, TrendingUp, Settings } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard({ user, onLogout }) {
    const [tab, setTab] = useState('overview'); // overview, zone, branch, users
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // User Management State
    const [allUsers, setAllUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ zone: '', branch: '' });

    useEffect(() => {
        if (tab === 'users') {
            fetchUsers();
        } else {
            fetchStats();
        }
    }, [tab, filterDate]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            let url = `/api/stats?date=${filterDate}`;
            if (user.role === 'zonal_manager') {
                url += `&zone=${user.zone}`;
            }
            if (tab === 'zone') url += '&type=zone';
            if (tab === 'branch') url += '&type=branch';

            const res = await fetch(url);
            const d = await res.json();
            if (Array.isArray(d)) setData(d);
            else setData([]);
        } catch (e) {
            console.error(e);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            const d = await res.json();
            setAllUsers(Array.isArray(d) ? d : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (u) => {
        setEditingUser(u.id);
        setEditForm({
            zone: u.zone || '',
            branch: u.branch || '',
            managed_locations: u.managed_locations || '[]'
        });
    };

    const saveUser = async (id) => {
        try {
            await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            });
            setEditingUser(null);
            fetchUsers();
        } catch (e) {
            alert('Failed to save');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(val);
    };

    // Chart Logic
    const labels = data.map(i => tab === 'zone' ? i.zone : (tab === 'branch' ? i.branch : i.username));
    const values = data.map(i => i.total_business || i.actual_business || 0);

    const barData = {
        labels,
        datasets: [{
            label: 'New Business (LKR)',
            data: values,
            backgroundColor: 'rgba(99, 102, 241, 0.6)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => formatCurrency(context.raw)
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    const totalBusiness = data.reduce((acc, curr) => acc + (curr.total_business || curr.actual_business || 0), 0);
    const activeAgents = tab === 'overview' ? data.length : data.reduce((acc, curr) => acc + (curr.agents || 0), 0);

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

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button onClick={() => setTab('overview')} className={tab === 'overview' ? 'btn-gradient' : 'btn-ghost'} style={{ justifyContent: 'flex-start', width: '100%' }}>
                        <Users size={18} style={{ marginRight: '0.75rem' }} /> Overview
                    </button>

                    {user.role !== 'zonal_manager' && (
                        <button onClick={() => setTab('zone')} className={tab === 'zone' ? 'btn-gradient' : 'btn-ghost'} style={{ justifyContent: 'flex-start', width: '100%' }}>
                            <MapPin size={18} style={{ marginRight: '0.75rem' }} /> Zone Performance
                        </button>
                    )}

                    <button onClick={() => setTab('branch')} className={tab === 'branch' ? 'btn-gradient' : 'btn-ghost'} style={{ justifyContent: 'flex-start', width: '100%' }}>
                        <Briefcase size={18} style={{ marginRight: '0.75rem' }} /> Branch Performance
                    </button>

                    {/* New Manage Users Tab */}
                    {(user.role === 'admin' || user.role === 'head') && (
                        <button onClick={() => setTab('users')} className={tab === 'users' ? 'btn-gradient' : 'btn-ghost'} style={{ justifyContent: 'flex-start', width: '100%', marginTop: 'auto' }}>
                            <Settings size={18} style={{ marginRight: '0.75rem' }} /> Manage Users
                        </button>
                    )}
                </nav>
            </aside>

            {/* Main Area */}
            <main className="main-content">
                <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                            {tab === 'users' ? 'Manage Users' : 'Dashboard'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user.username}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {tab !== 'users' && (
                            <div className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} color="var(--primary)" />
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', fontFamily: 'inherit' }}
                                />
                            </div>
                        )}
                        <button className="btn-ghost" onClick={onLogout}>Logout</button>
                    </div>
                </header>

                {tab === 'users' ? (
                    <div className="glass-card animate-fade-in" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>All Users</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Zone / Allocations</th>
                                        <th>Detail / Branch</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 500 }}>{u.username}</td>
                                            <td style={{ opacity: 0.7 }}>{u.role}</td>

                                            {/* Zone/Allocations Column */}
                                            <td>
                                                {editingUser === u.id ? (
                                                    u.role === 'zonal_manager' ? (
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            <strong>Allocated Branches:</strong>
                                                            <div style={{ maxHeight: '150px', overflowY: 'auto', margin: '0.5rem 0', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations || '[]') : []).map((loc, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                                        <span>{loc.zone} - {loc.branch}</span>
                                                                        <button type="button" onClick={() => {
                                                                            const current = JSON.parse(editForm.managed_locations || '[]');
                                                                            const newLocs = current.filter((_, i) => i !== idx);
                                                                            setEditForm({ ...editForm, managed_locations: JSON.stringify(newLocs) });
                                                                        }} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                                                    </div>
                                                                ))}
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations || '[]') : []).length === 0 && <span style={{ opacity: 0.5 }}>No allocations</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                <input placeholder="Zone" id={`new-zone-${u.id}`} className="glass-input" style={{ width: '60px', padding: '2px', fontSize: '0.7rem' }} />
                                                                <input placeholder="Branch" id={`new-branch-${u.id}`} className="glass-input" style={{ width: '60px', padding: '2px', fontSize: '0.7rem' }} />
                                                                <button type="button" onClick={() => {
                                                                    const z = document.getElementById(`new-zone-${u.id}`).value;
                                                                    const b = document.getElementById(`new-branch-${u.id}`).value;
                                                                    if (z && b) {
                                                                        const current = JSON.parse(editForm.managed_locations || '[]');
                                                                        current.push({ zone: z, branch: b });
                                                                        setEditForm({ ...editForm, managed_locations: JSON.stringify(current) });
                                                                        document.getElementById(`new-zone-${u.id}`).value = '';
                                                                        document.getElementById(`new-branch-${u.id}`).value = '';
                                                                    }
                                                                }} style={{ fontSize: '0.7rem', background: '#6366f1', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', padding: '0 4px' }}>Add</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            className="glass-input"
                                                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                                            value={editForm.zone}
                                                            onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                                                        />
                                                    )
                                                ) : (
                                                    u.role === 'zonal_manager' ? (
                                                        <div style={{ fontSize: '0.8rem' }}>
                                                            {(u.managed_locations ? JSON.parse(u.managed_locations) : []).length} Branches Allocated
                                                        </div>
                                                    ) : (u.zone || '-')
                                                )}
                                            </td>

                                            {/* Branch Column (Only for non-managers typically) */}
                                            <td>
                                                {editingUser === u.id && u.role !== 'zonal_manager' ? (
                                                    <input
                                                        className="glass-input"
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                                                        value={editForm.branch}
                                                        onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                                                    />
                                                ) : u.role !== 'zonal_manager' ? (u.branch || '-') : '-'}
                                            </td>

                                            <td>
                                                {editingUser === u.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => saveUser(u.id)} style={{ color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                                                        <button onClick={() => setEditingUser(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleEditUser(u)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Global Stats */}
                        <div className="stats-grid">
                            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', color: 'var(--primary)' }}>
                                    <TrendingUp size={32} />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Total Business</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatCurrency(totalBusiness)}</div>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '16px', color: 'var(--secondary)' }}>
                                    <Users size={32} />
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Active Agents</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{activeAgents}</div>
                                </div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem', height: '400px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Performance Trends</h3>
                            {data.length > 0 ? (
                                <Bar data={barData} options={chartOptions} />
                            ) : (
                                <div className="flex-center" style={{ height: '100%', color: 'var(--text-muted)' }}>No data to display</div>
                            )}
                        </div>

                        {/* Detailed Table */}
                        <div className="glass-card animate-fade-in" style={{ padding: '2rem', animationDelay: '0.2s' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Detailed Breakdown</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="premium-table">
                                    <thead>
                                        <tr>
                                            <th>{tab === 'zone' ? 'Zone' : (tab === 'branch' ? 'Branch' : 'Agent')}</th>
                                            {tab === 'overview' && <th>Location</th>}
                                            <th>{tab === 'overview' ? 'Status/Plan' : 'Agents Count'}</th>
                                            <th>Total Business (LKR)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>
                                                    {tab === 'zone' ? item.zone : (tab === 'branch' ? item.branch : item.username)}
                                                </td>

                                                {tab === 'overview' && (
                                                    <td style={{ color: 'var(--text-muted)' }}>
                                                        {item.zone} / {item.branch}
                                                    </td>
                                                )}

                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    {tab === 'overview' ? (
                                                        item.morning_plan || <span style={{ opacity: 0.5 }}>No Plan Set</span>
                                                    ) : (
                                                        item.agents + ' Active'
                                                    )}
                                                </td>

                                                <td style={{ fontWeight: 600, color: (item.total_business || item.actual_business) > 0 ? '#10b981' : 'inherit' }}>
                                                    {formatCurrency(item.total_business || item.actual_business || 0)}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '3rem' }}>No records found</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
