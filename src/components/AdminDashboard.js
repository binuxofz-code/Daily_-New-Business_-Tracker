
'use client';
import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { MapPin, Briefcase, Calendar, BarChart2, Settings, LogOut, Shield, Sun, Moon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard({ user, onLogout, theme, toggleTheme }) {
    // Get current date in SL timezone (YYYY-MM-DD)
    const getSLDate = () => {
        const d = new Date();
        const offset = 5.5 * 60 * 60 * 1000; // SL is UTC+5:30
        const localTime = new Date(d.getTime() + offset);
        return localTime.toISOString().split('T')[0];
    };

    const [tab, setTab] = useState('overview'); // overview, zone, branch, users
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDate, setFilterDate] = useState(getSLDate());

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
            role: u.role || 'member',
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

    const deleteUser = async (id) => {
        if (!confirm('Warning: This will permanently delete this user account. Are you sure?')) return;
        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchUsers();
            } else {
                alert('Failed to delete user');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting user');
        }
    };

    const handleDeleteRecord = async (id) => {
        if (!confirm('Are you sure you want to delete this record?')) return;
        try {
            const res = await fetch(`/api/records?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchStats();
            } else {
                alert('Failed to delete record');
            }
        } catch (e) {
            console.error(e);
            alert('Error deleting record');
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
                grid: { color: 'var(--border)' },
                ticks: { color: 'var(--text-muted)' }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'var(--text-muted)' }
            }
        }
    };

    const totalBusiness = data.reduce((acc, curr) => acc + (curr.total_business || curr.actual_business || 0), 0);
    const activeAgents = tab === 'overview' ? data.length : data.reduce((acc, curr) => acc + (curr.agents || 0), 0);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
            {/* Header */}
            <header className="dashboard-header" style={{ background: 'var(--bg-card)' }}>
                <div>
                    <h1 className="text-h1">Daily Business Tracker</h1>
                    <p className="text-muted">Administrator Dashboard</p>
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>System Admin</span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrator</div>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                            <Calendar size={18} color="var(--text-muted)" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text-main)', background: 'transparent' }}
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
                                            <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.username}</td>
                                            <td>
                                                {editingUser === u.id ? (
                                                    <select
                                                        className="clean-input"
                                                        style={{ padding: '0.25rem', fontSize: '0.8rem' }}
                                                        value={editForm.role}
                                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="zonal_manager">Zon. Manager</option>
                                                        <option value="head">Head</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '0.25rem 0.6rem',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        borderRadius: '12px',
                                                        color: 'var(--accent-blue)',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 700,
                                                        letterSpacing: '0.02em',
                                                        border: '1px solid rgba(59, 130, 246, 0.2)'
                                                    }}>
                                                        {u.role.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Zone/Allocations */}
                                            <td>
                                                {editingUser === u.id ? (
                                                    u.role === 'zonal_manager' ? (
                                                        <div style={{ fontSize: '0.85rem' }}>
                                                            <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>Allocated Branches:</div>
                                                            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.75rem', maxHeight: '150px', overflowY: 'auto', background: 'var(--bg-input)' }}>
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations) : []).map((loc, idx) => (
                                                                    <div key={idx} style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        padding: '0.4rem 0.75rem',
                                                                        marginBottom: '0.4rem',
                                                                        background: 'var(--bg-card)',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid var(--border)'
                                                                    }}>
                                                                        <div>
                                                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' }}>{loc.zone}</span>
                                                                            <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>•</span>
                                                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>{loc.branch}</span>
                                                                        </div>
                                                                        <button onClick={() => {
                                                                            const current = JSON.parse(editForm.managed_locations);
                                                                            const newLocs = current.filter((_, i) => i !== idx);
                                                                            setEditForm({ ...editForm, managed_locations: JSON.stringify(newLocs) });
                                                                        }} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.25rem' }}>×</button>
                                                                    </div>
                                                                ))}
                                                                {(editForm.managed_locations ? JSON.parse(editForm.managed_locations) : []).length === 0 && <div style={{ opacity: 0.5, fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>No branches allocated yet</div>}
                                                            </div>

                                                            {/* Add New Zone/Branch */}
                                                            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', border: '1px dashed var(--accent-blue)', opacity: 0.9 }}>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Zone</label>
                                                                        <input
                                                                            id={`z-${u.id}`}
                                                                            placeholder="e.g., Western"
                                                                            className="clean-input"
                                                                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Branch</label>
                                                                        <input
                                                                            id={`b-${u.id}`}
                                                                            placeholder="e.g., Colombo"
                                                                            className="clean-input"
                                                                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => {
                                                                    const z = document.getElementById(`z-${u.id}`).value;
                                                                    const b = document.getElementById(`b-${u.id}`).value;
                                                                    if (z && b) {
                                                                        const current = JSON.parse(editForm.managed_locations || '[]');
                                                                        current.push({ zone: z, branch: b });
                                                                        setEditForm({ ...editForm, managed_locations: JSON.stringify(current) });
                                                                        document.getElementById(`b-${u.id}`).value = '';
                                                                        document.getElementById(`z-${u.id}`).value = '';
                                                                    } else {
                                                                        alert('Please enter both Zone and Branch names');
                                                                    }
                                                                }} className="btn-primary" style={{ padding: '0.5rem', fontSize: '0.85rem', height: 'auto' }}>+ Add Branch</button>
                                                            </div>
                                                            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem', marginBottom: 0 }}>
                                                                💡 Tip: Keep the same zone name to add multiple branches to one zone
                                                            </p>
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
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                            {(u.managed_locations ? JSON.parse(u.managed_locations) : []).map((loc, i) => (
                                                                <span key={i} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-main)' }}>
                                                                    {loc.zone}
                                                                </span>
                                                            ))}
                                                            {(u.managed_locations ? JSON.parse(u.managed_locations) : []).length === 0 && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>None</span>}
                                                        </div>
                                                    ) : (u.zone || '-')
                                                )}
                                            </td>

                                            {/* Branch */}
                                            < td >
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
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <button onClick={() => handleEditUser(u)} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                                                        <button onClick={() => deleteUser(u.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }} title="Delete User">Delete</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div >
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Business Today</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                                    {formatCurrency(totalBusiness)}
                                </div>
                            </div>
                            <div className="clean-card" style={{ padding: '1.5rem', borderLeft: '4px solid #10b981' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Reported Units</div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.5rem' }}>
                                    {data.length}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 className="text-h2">Detailed Performance Breakdown</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Showing {data.length} records for {filterDate}
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="clean-table">
                                    <thead>
                                        <tr>
                                            <th>{tab === 'zone' ? 'Zone' : (tab === 'branch' ? 'Branch' : 'Agent')}</th>
                                            <th>Target (Plan)</th>
                                            <th>Agent Achievement</th>
                                            <th>Branch Achievement</th>
                                            <th style={{ textAlign: 'right' }}>Total Combined</th>
                                            {tab === 'overview' && <th>Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                                    {tab === 'zone' ? `📍 ${item.zone}` : (tab === 'branch' ? `🏢 ${item.branch}` : (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>👤 {item.username}</span>
                                                            {item.role === 'zonal_manager' && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>🏢 {item.branch} (ZM)</span>}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)' }}>
                                                    {formatCurrency(item.plan || item.morning_plan || 0)}
                                                </td>
                                                <td style={{ color: '#059669', fontWeight: 600 }}>
                                                    {formatCurrency(item.agent_achievement || 0)}
                                                </td>
                                                <td style={{ color: '#0284c7', fontWeight: 600 }}>
                                                    {formatCurrency(item.bdo_branch_performance || 0)}
                                                </td>
                                                <td style={{ fontWeight: 800, textAlign: 'right', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                                                    {formatCurrency(item.total_business || item.actual_business || 0)}
                                                </td>
                                                {tab === 'overview' && (
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteRecord(item.id)}
                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                                                            title="Delete Record"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {data.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>No records found for this date.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )
                }
            </main >
        </div >
    );
}
