
'use client';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Users, MapPin, Briefcase, Calendar, BarChart2, Settings, LogOut, Shield } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard({ user, onLogout }) {
    const [tab, setTab] = useState('overview'); // overview, zone, branch, users
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    // User Management State
    const [allUsers, setAllUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ zone: '', branch: '', managed_locations: '[]' });

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
        const locs = u.managed_locations || '[]';
        setEditForm({
            zone: u.zone || '',
            branch: u.branch || '',
            managed_locations: locs
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
            backgroundColor: '#3b82f6', // Blue 500
            borderRadius: 4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                ticks: { color: '#6b7280' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#6b7280' }
            }
        }
    };

    const totalBusiness = data.reduce((acc, curr) => acc + (curr.total_business || curr.actual_business || 0), 0);
    const activeAgents = tab === 'overview' ? data.length : data.reduce((acc, curr) => acc + (curr.agents || 0), 0);

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Header */}
            <header className="dashboard-header">
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">Administrator Dashboard</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#eef2ff', padding: '0.5rem 1rem', borderRadius: '20px', color: '#4f46e5' }}>
                        <Shield size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Admin</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Administrator</div>
                    </div>

                    <button onClick={onLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

                {/* Tabs */}
                <div className="nav-tabs">
                    <button onClick={() => setTab('overview')} className={`nav-tab ${tab === 'overview' ? 'active' : ''}`}>
                        <BarChart2 size={18} /> Overview
                    </button>
                    <button onClick={() => setTab('zone')} className={`nav-tab ${tab === 'zone' ? 'active' : ''}`}>
                        <MapPin size={18} /> Zone Performance
                    </button>
                    <button onClick={() => setTab('branch')} className={`nav-tab ${tab === 'branch' ? 'active' : ''}`}>
                        <Briefcase size={18} /> Branch Performance
                    </button>
                    {(user.role === 'admin' || user.role === 'head') && (
                        <button onClick={() => setTab('users')} className={`nav-tab ${tab === 'users' ? 'active' : ''}`}>
                            <Settings size={18} /> Manage Users
                        </button>
                    )}
                </div>

                {tab !== 'users' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Calendar size={18} color="#6b7280" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: '0.9rem', color: '#374151' }}
                            />
                        </div>
                    </div>
                )}

                {tab === 'users' ? (
                    <div className="clean-card animate-fade-in">
                        <div className="card-header-accent">
                            <h2 className="text-h2">User Management</h2>
                            <p className="text-muted">Manage system access, roles, and branch allocations</p>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Role</th>
                                        <th>Allocations / Zone</th>
                                        <th>Details / Branch</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(u => (
                                        <tr key={u.id}>
                                            <td style={{ fontWeight: 600 }}>{u.username}</td>
                                            <td>
                                                <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#f3f4f6', borderRadius: '4px', color: '#4b5563', textTransform: 'capitalize' }}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Zone/Allocations */}
                                            <td>
                                                {editingUser === u.id ? (
                                                    u.role === 'zonal_manager' ? (
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Allocated Branches:</div>
                                                            <div style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem', marginBottom: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations) : []).map((loc, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px dashed #f3f4f6' }}>
                                                                        <span>{loc.zone} - {loc.branch}</span>
                                                                        <button onClick={() => {
                                                                            const current = JSON.parse(editForm.managed_locations);
                                                                            const newLocs = current.filter((_, i) => i !== idx);
                                                                            setEditForm({ ...editForm, managed_locations: JSON.stringify(newLocs) });
                                                                        }} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                                                    </div>
                                                                ))}
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations) : []).length === 0 && <span style={{ opacity: 0.5 }}>No allocations</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <input id={`z-${u.id}`} placeholder="Zone" className="clean-input" style={{ padding: '0.25rem' }} />
                                                                <input id={`b-${u.id}`} placeholder="Branch" className="clean-input" style={{ padding: '0.25rem' }} />
                                                                <button onClick={() => {
                                                                    const z = document.getElementById(`z-${u.id}`).value;
                                                                    const b = document.getElementById(`b-${u.id}`).value;
                                                                    if (z && b) {
                                                                        const current = JSON.parse(editForm.managed_locations || '[]');
                                                                        current.push({ zone: z, branch: b });
                                                                        setEditForm({ ...editForm, managed_locations: JSON.stringify(current) });
                                                                        document.getElementById(`z-${u.id}`).value = '';
                                                                        document.getElementById(`b-${u.id}`).value = '';
                                                                    }
                                                                }} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0 0.5rem' }}>+</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <input
                                                            className="clean-input"
                                                            value={editForm.zone}
                                                            onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })}
                                                            placeholder="Zone"
                                                        />
                                                    )
                                                ) : (
                                                    u.role === 'zonal_manager' ? (
                                                        <span style={{ color: '#6b7280' }}>
                                                            {(u.managed_locations ? JSON.parse(u.managed_locations).length : 0)} Branches
                                                        </span>
                                                    ) : (u.zone || '-')
                                                )}
                                            </td>

                                            {/* Branch */}
                                            <td>
                                                {editingUser === u.id && u.role !== 'zonal_manager' ? (
                                                    <input
                                                        className="clean-input"
                                                        value={editForm.branch}
                                                        onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                                                        placeholder="Branch"
                                                    />
                                                ) : u.role !== 'zonal_manager' ? (u.branch || '-') : '-'}
                                            </td>

                                            <td>
                                                {editingUser === u.id ? (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button onClick={() => saveUser(u.id)} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Save</button>
                                                        <button onClick={() => setEditingUser(null)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleEditUser(u)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
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
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="clean-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Total Business Today</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.5rem' }}>
                                    {formatCurrency(totalBusiness)}
                                </div>
                            </div>
                            <div className="clean-card" style={{ padding: '1.5rem' }}>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Active Units/Agents</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginTop: '0.5rem' }}>
                                    {activeAgents}
                                </div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="clean-card animate-fade-in" style={{ height: '400px', marginBottom: '2rem' }}>
                            <h3 className="text-h2" style={{ marginBottom: '1.5rem' }}>Performance Trends</h3>
                            {data.length > 0 ? (
                                <Bar data={barData} options={chartOptions} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No data available</div>
                            )}
                        </div>

                        {/* Data Table */}
                        <div className="clean-card animate-fade-in">
                            <h3 className="text-h2" style={{ marginBottom: '1.5rem' }}>Detailed Breakdown</h3>
                            <table className="clean-table">
                                <thead>
                                    <tr>
                                        <th>{tab === 'zone' ? 'Zone' : (tab === 'branch' ? 'Branch' : 'Agent')}</th>
                                        <th>{tab === 'overview' ? 'Plan' : 'Count'}</th>
                                        <th>Business (LKR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{ fontWeight: 500 }}>
                                                {tab === 'zone' ? item.zone : (tab === 'branch' ? item.branch : item.username)}
                                            </td>
                                            <td style={{ color: '#6b7280' }}>
                                                {tab === 'overview' ? (item.morning_plan || '-') : (item.agents + ' active')}
                                            </td>
                                            <td style={{ fontWeight: 600, color: (item.total_business || item.actual_business) > 0 ? '#059669' : '#374151' }}>
                                                {formatCurrency(item.total_business || item.actual_business || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No records</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
