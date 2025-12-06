import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {
  MapPin, Clock, User, LogOut, ChevronRight, ChevronLeft,
  Calendar as CalIcon, PlusCircle, Trash2, Shield, Search,
  Edit2, BarChart3, TrendingUp, CheckCircle, Timer, CalendarDays, ArrowLeft, Users, Save, X, Lock, Mail, Menu, Tag, AlignLeft, Calendar
} from 'lucide-react';

// --- CONFIG ---
const SUPABASE_URL = 'https://tjijmdguldpieefzdvne.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqaWptZGd1bGRwaWVlZnpkdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjk4MTcsImV4cCI6MjA4MDYwNTgxN30.dCYsW_Ah5YtiTreCR4Y-PQSq9TZ6bOF1DRw_VUtRhoI';

// --- HELPER COMPONENTS ---

const LogoGroup = () => (
  <div className="flex items-center gap-3 cursor-pointer group select-none">
    <div className="flex -space-x-3 transition-all duration-500 group-hover:space-x-0">
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border-2 border-slate-50 shadow-md flex items-center justify-center relative z-20">
        <img src="/Logo_MPA.png" alt="MPA" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
        <span className="text-blue-700 font-extrabold text-[10px] tracking-tighter absolute" style={{ zIndex: -1 }}>MPA</span>
      </div>
      <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-700 border-2 border-white shadow-md flex items-center justify-center relative z-10">
        <img src="/Logo_HIMAKOM.png" alt="HIM" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
        <span className="text-white font-extrabold text-[10px] tracking-tighter absolute" style={{ zIndex: -1 }}>HIM</span>
      </div>
    </div>
    <div className="flex flex-col">
      <h1 className="text-sm md:text-lg font-bold text-slate-900 tracking-tight leading-none group-hover:text-blue-700 transition-colors">
        MPA HIMAKOM
      </h1>
      <span className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-widest uppercase hidden md:block">
        Politeknik Negeri Bandung
      </span>
    </div>
    {/* 3. TAMBAHAN BARU: LOGO POLBAN DI KANAN */}
    {/* Garis Pemisah Tipis */}
    <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>

    {/* Logo Polban */}
    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
      <img src="/logo-polban.png" alt="POLBAN" className="w-full h-full object-contain p-1" onError={(e) => e.target.style.display = 'none'} />
    </div>
  </div>
);

const StatusBadge = ({ date, endDate }) => {
  const today = new Date().toISOString().split('T')[0];
  const finalDate = endDate || date;

  if (finalDate < today) return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 block w-fit">SELESAI</span>;
  if (date <= today && finalDate >= today) return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 animate-pulse block w-fit">BERLANGSUNG</span>;
  return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 block w-fit">SEGERA</span>;
};

const getCategoryColor = (cat) => {
  const colors = {
    'Pengawasan': { bg: 'bg-orange-50', text: 'text-orange-800', border: 'bg-orange-500', icon: 'text-orange-500' },
    'Legislasi': { bg: 'bg-blue-50', text: 'text-blue-800', border: 'bg-blue-500', icon: 'text-blue-500' },
    'Aspirasi': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'bg-emerald-500', icon: 'text-emerald-500' },
    'Kominfo': { bg: 'bg-violet-50', text: 'text-violet-800', border: 'bg-violet-500', icon: 'text-violet-500' },
    'Lainnya': { bg: 'bg-slate-50', text: 'text-slate-800', border: 'bg-slate-500', icon: 'text-slate-500' }
  };
  return colors[cat] || colors['Lainnya'];
};

const formatRangeDate = (start, end) => {
  const d1 = new Date(start);
  const d2 = new Date(end);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  if (!end || start === end) return d1.toLocaleDateString('id-ID', options);
  if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) {
    return `${d1.getDate()} - ${d2.getDate()} ${d1.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
  }
  return `${d1.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${d2.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

// --- APLIKASI UTAMA ---

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [view, setView] = useState('login');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [currentNavDate, setCurrentNavDate] = useState(new Date('2025-12-01'));

  const [adminTab, setAdminTab] = useState('agenda');
  const [usersList, setUsersList] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'staf_muda' });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', date: '', endDate: '', startTime: '', endTime: '', location: '', category: 'Legislasi'
  });

  // --- INITIALIZATION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
        setView('home');
      } else {
        setView('login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
        if (view === 'login') setView('home');
      } else {
        setView('login');
        setUserRole(null);
        setEvents([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) fetchEvents(); }, [session]);

  const fetchUserRole = async (userId) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) setUserRole(data.role);
  };

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (!error) setEvents(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    if (userRole !== 'admin') return;
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error) setUsersList(data);
  };

  useEffect(() => {
    if (adminTab === 'users' && userRole === 'admin') fetchUsers();
  }, [adminTab, userRole]);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: e.target.email.value, password: e.target.password.value
    });
    if (error) alert("Login Gagal: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newUser.password.length < 6) return alert("Password minimal 6 karakter!");
    if (!confirm(`Buat akun ${newUser.email}?`)) return;

    setIsCreatingUser(true);
    try {
      const tempClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: newUser.email, password: newUser.password,
      });

      if (authError) throw authError;

      if (authData.user && newUser.role !== 'staf_muda') {
        await new Promise(r => setTimeout(r, 1000));
        await supabase.from('profiles').update({ role: newUser.role }).eq('id', authData.user.id);
      }

      alert("Akun berhasil dibuat!");
      setNewUser({ email: '', password: '', role: 'staf_muda' });
      setShowAddUser(false);
      fetchUsers();
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  // --- DELETE USER HANDLER (BARU) ---
  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Yakin ingin MENGHAPUS akun ${userEmail}? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      // Memanggil fungsi SQL yang kita buat di Langkah 1
      const { error } = await supabase.rpc('delete_user_by_admin', { user_id: userId });

      if (error) throw error;

      alert("Pengguna berhasil dihapus.");
      fetchUsers(); // Refresh tabel agar data hilang dari layar
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (error) alert("Gagal: " + error.message);
    else fetchUsers();
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', date: '', endDate: '', startTime: '', endTime: '', location: '', category: 'Legislasi' });
    setIsEditing(false); setEditId(null); setIsMultiDay(false);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (!session) return alert("Sesi habis.");
    if (userRole === 'staf_muda') return alert("Akses ditolak.");

    if (formData.startTime >= formData.endTime) return alert("Jam selesai harus lebih akhir!");

    let finalEndDate = formData.date;
    if (isMultiDay && formData.endDate) {
      if (formData.endDate < formData.date) return alert("Tanggal selesai salah!");
      finalEndDate = formData.endDate;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      end_date: finalEndDate,
      time: `${formData.startTime} - ${formData.endTime}`,
      location: formData.location,
      category: formData.category
    };

    const query = isEditing
      ? supabase.from('events').update(payload).eq('id', editId)
      : supabase.from('events').insert([payload]);

    const { error } = await query;

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      alert(isEditing ? "Agenda diperbarui!" : "Agenda ditambahkan!");
      resetForm();
      fetchEvents();
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditClick = (event) => {
    resetForm();
    setIsEditing(true);
    setEditId(event.id);
    const [start, end] = event.time ? event.time.split('-').map(s => s.trim()) : ['', ''];
    const isRange = event.end_date && event.end_date !== event.date;
    setIsMultiDay(isRange);
    setFormData({
      title: event.title, description: event.description || '',
      date: event.date, endDate: event.end_date || event.date,
      startTime: start, endTime: end, location: event.location || '',
      category: event.category || 'Legislasi'
    });
    setAdminTab('agenda');
    setView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEvent = async (id) => {
    if (userRole === 'staf_muda') return alert("Akses ditolak.");
    if (!confirm("Hapus agenda ini?")) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) fetchEvents();
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = filterCategory === 'Semua' || event.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [events, searchQuery, filterCategory]);

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();
  sortedDates.forEach(date => {
    groupedEvents[date].sort((a, b) => a.time.localeCompare(b.time));
  });

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: events.length,
      upcoming: events.filter(e => (e.end_date || e.date) >= today).length,
      finished: events.filter(e => (e.end_date || e.date) < today).length,
      pengawasan: events.filter(e => e.category === 'Pengawasan').length
    };
  }, [events]);

  const nearestEvent = events.find(e => (e.end_date || e.date) >= new Date().toISOString().split('T')[0]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">

      {/* NAVBAR */}
      {session && (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm top-0 left-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div onClick={() => setView('home')} className="z-50">
                <LogoGroup />
              </div>

              {view === 'home' && (
                <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
                  <div className="w-full bg-slate-100 border border-slate-200 rounded-full flex items-center px-4 py-2 transition hover:bg-white hover:shadow-md focus-within:bg-white focus-within:shadow-md">
                    <Search size={18} className="text-slate-400 mr-3" />
                    <input type="text" placeholder="Cari kegiatan..." className="flex-1 bg-transparent outline-none text-sm text-slate-700 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <div className="h-5 w-px bg-slate-300 mx-3"></div>
                    <select className="bg-transparent text-slate-600 text-xs font-bold uppercase tracking-wide outline-none cursor-pointer hover:text-blue-600" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                      {['Semua', 'Legislasi', 'Pengawasan', 'Aspirasi', 'Kominfo', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* TOMBOL PANEL ADMIN / STAF AHLI */}
                {userRole !== 'staf_muda' && (
                  <button onClick={() => setView('admin')} className={`hidden md:block px-5 py-2.5 rounded-full text-sm font-bold transition-all ${view === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {userRole === 'admin' ? 'Panel Admin' : 'Panel Staf Ahli'}
                  </button>
                )}

                <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition shadow-sm"><LogOut size={18} /></button>
                <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition">{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
              </div>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-4">
              {view === 'home' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input type="text" placeholder="Cari kegiatan..." className="w-full bg-transparent outline-none text-sm p-2 border-b border-slate-200 mb-2" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <select className="w-full bg-transparent text-sm font-bold text-slate-600 p-2 outline-none" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    {['Semua', 'Legislasi', 'Pengawasan', 'Aspirasi', 'Kominfo', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {userRole !== 'staf_muda' && (
                <button onClick={() => { setView('admin'); setMenuOpen(false) }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">
                  {userRole === 'admin' ? 'Ke Panel Admin' : 'Ke Panel Staf Ahli'}
                </button>
              )}
            </div>
          )}
        </nav>
      )}

      {/* VIEW: LOGIN */}
      {!session && (
        <div className="min-h-screen flex items-center justify-center px-4 bg-white">
          <div className="max-w-md w-full text-center space-y-8 animate-fade-in-up">
            <div>
              <div className="flex justify-center mb-6">
                <LogoGroup />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Selamat Datang</h2>
              <p className="mt-2 text-sm text-slate-500">Aplikasi Timeline Organisasi MPA HIMAKOM.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-blue-900/10 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-violet-600"></div>
              <form onSubmit={handleLogin} className="space-y-5 text-left mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Email Institusi</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input name="email" type="email" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" placeholder="admin@himakom.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Kata Sandi</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input name="password" type="password" required className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                  <User size={18} /> Masuk Sistem
                </button>
              </form>
            </div>
            <p className="text-xs text-slate-400">Hubungi administrator jika lupa kata sandi.</p>
          </div>
        </div>
      )}

      {/* VIEW: ADMIN PANEL */}
      {view === 'admin' && session && (
        <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <button onClick={() => setView('home')} className="flex items-center text-slate-500 hover:text-blue-700 transition font-bold text-sm mb-2"><ArrowLeft size={16} className="mr-2" /> Kembali ke Timeline</button>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                {userRole === 'admin' ? 'Dashboard Admin' : 'Panel Staf Ahli'}
              </h2>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border ${userRole === 'admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{userRole?.replace('_', ' ')}</span>
          </div>

          {/* TAB SWITCHER: HANYA MUNCUL JIKA ADMIN */}
          {userRole === 'admin' && (
            <div className="flex p-1.5 bg-white border border-slate-200 rounded-2xl mb-8 w-full md:w-fit shadow-sm">
              <button onClick={() => setAdminTab('agenda')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${adminTab === 'agenda' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Agenda</button>
              <button onClick={() => setAdminTab('users')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${adminTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Pengguna</button>
            </div>
          )}

          {/* TAB USERS (HANYA ADMIN) */}
          {adminTab === 'users' && userRole === 'admin' && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users size={20} /> Kelola Anggota</h2>
                <button onClick={() => setShowAddUser(!showAddUser)} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 text-white transition ${showAddUser ? 'bg-red-500' : 'bg-blue-600'}`}>{showAddUser ? <X size={16} /> : <PlusCircle size={16} />} {showAddUser ? 'Batal' : 'Tambah'}</button>
              </div>

              {showAddUser && (
                <div className="bg-blue-50 p-6 border-b border-blue-100">
                  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email</label>
                      <Mail className="absolute left-3 top-8 text-slate-400" size={18} />
                      <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="nama@email.com" />
                    </div>
                    <div className="relative">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Password</label>
                      <Lock className="absolute left-3 top-8 text-slate-400" size={18} />
                      <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Minimal 6 karakter" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg">
                        <option value="staf_muda">Staf Muda</option>
                        <option value="staf_ahli">Staf Ahli</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button type="submit" disabled={isCreatingUser} className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold shadow-md hover:bg-black transition">{isCreatingUser ? 'Menyimpan...' : 'Simpan Akun'}</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-center">Aksi</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium">{u.email}</td>
                        <td className="px-6 py-4"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase">{u.role.replace('_', ' ')}</span></td>
                        <td className="px-6 py-4 text-center">
                          <select className="bg-white border border-slate-200 rounded text-xs p-1" value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} disabled={u.email === session.user.email}>
                            <option value="staf_muda">Staf Muda</option>
                            <option value="staf_ahli">Staf Ahli</option>
                            <option value="admin">Admin</option>
                          </select>
                          {/* --- TOMBOL HAPUS (BARU) --- */}
                          {/* Kondisi: Jangan tampilkan tombol hapus di baris akun sendiri */}
                          {user.email !== session.user.email && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              className="p-1.5 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition"
                              title="Hapus Akun"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB AGENDA (Admin & Staf Ahli) */}
          {(adminTab === 'agenda' || userRole === 'staf_ahli') && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ l: 'Total', v: stats.total, c: 'text-slate-700' }, { l: 'Akan Datang', v: stats.upcoming, c: 'text-blue-600' }, { l: 'Selesai', v: stats.finished, c: 'text-green-600' }, { l: 'Pengawasan', v: stats.pengawasan, c: 'text-orange-600' }].map((s, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-bold text-slate-400 uppercase">{s.l}</div><div className={`text-2xl font-black ${s.c}`}>{s.v}</div></div>
                ))}
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">{isEditing ? <Edit2 className="text-yellow-500" /> : <PlusCircle className="text-blue-600" />} {isEditing ? 'Edit Agenda' : 'Agenda Baru'}</h2>
                  {isEditing && <button onClick={resetForm} className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg">Batal</button>}
                </div>

                <form onSubmit={handleSubmitEvent} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Nama Kegiatan</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium" placeholder="Contoh: Sidang Pleno" />
                    </div>
                  </div>

                  <div className="md:col-span-2 bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <input type="checkbox" id="multiDay" checked={isMultiDay} onChange={(e) => setIsMultiDay(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                      <label htmlFor="multiDay" className="text-sm font-bold text-slate-700 cursor-pointer">Acara lebih dari 1 hari?</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal Mulai</label>
                        <div className="relative"><Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none" /></div>
                      </div>
                      {isMultiDay && (
                        <div className="animate-fade-in">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal Selesai</label>
                          <div className="relative"><Calendar className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none" /></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Jam Mulai</label>
                    <div className="relative"><Clock className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="time" required value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" /></div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Jam Selesai</label>
                    <div className="relative"><Clock className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="time" required value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" /></div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Kategori</label>
                    <div className="relative"><Tag className="absolute left-3 top-2.5 text-slate-400" size={18} /><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none cursor-pointer appearance-none">{['Legislasi', 'Pengawasan', 'Aspirasi', 'Kominfo', 'Lainnya'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Lokasi</label>
                    <div className="relative"><MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" placeholder="Ruang Sidang" /></div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block ml-1">Deskripsi</label>
                    <div className="relative"><AlignLeft className="absolute left-3 top-3 text-slate-400" size={18} /><textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none" placeholder="Detail kegiatan..." /></div>
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <button type="submit" className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-1 ${isEditing ? 'bg-yellow-500' : 'bg-slate-900 hover:bg-black'}`}>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Agenda'}</button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW: HOME */}
      {view === 'home' && (
        <>
          <header className="pt-32 pb-24 px-4 relative overflow-hidden text-center min-h-[500px] flex flex-col justify-center">

            {/* LAYER 1: Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src="/header-bg.jpg"
                alt="Header Background"
                // GANTI 'object-center' MENJADI 'object-top'
                className="w-full h-full object-cover object-top opacity-90"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.style.backgroundColor = '#f1f5f9';
                }}
              />
            </div>

            {/* LAYER 2: Overlay Gradient (Efek Blur & Blend ke Putih Bawah) */}
            <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/40 via-white/60 to-slate-50 backdrop-blur-[2px]"></div>

            {/* LAYER 3: Konten Teks (Paling Atas) */}
            <div className="max-w-4xl mx-auto relative z-20">
              <div className="inline-block py-2 px-5 rounded-full bg-white/90 backdrop-blur-md border border-blue-100 text-blue-700 text-[10px] font-extrabold tracking-widest uppercase mb-6 shadow-sm">
                Official Timeline 2025/2026
              </div>

              <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 tracking-tight leading-tight
               drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                Agenda Kegiatan <br />
                <span className="
  text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-violet-600
  drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]
  drop-shadow-[0_0_14px_rgba(255,255,255,0.9)]
  drop-shadow-[0_0_28px_rgba(255,255,255,0.6)]
">
                  MPA HIMAKOM
                </span>
              </h2>



              {nearestEvent && (
                <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/60 pl-2 pr-6 py-2 rounded-full shadow-2xl shadow-blue-900/10 animate-fade-in-up">
                  <div className="bg-blue-600 p-2.5 rounded-full text-white shadow-lg shadow-blue-600/30">
                    <Timer size={20} />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                      Segera Hadir
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {nearestEvent.title} <span className="text-slate-300 mx-2">|</span> {formatRangeDate(nearestEvent.date, nearestEvent.end_date)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 pb-32">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-6 md:p-8 mb-20 max-w-6xl mx-auto overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 px-2 gap-4">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">{["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][currentNavDate.getMonth()]} <span className="text-blue-600 font-light">{currentNavDate.getFullYear()}</span></h3>
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                  <button onClick={() => setCurrentNavDate(new Date(currentNavDate.getFullYear(), currentNavDate.getMonth() - 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm hover:text-blue-600 transition"><ChevronLeft size={20} /></button>
                  <button onClick={() => setCurrentNavDate(new Date(currentNavDate.getFullYear(), currentNavDate.getMonth() + 1, 1))} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm hover:text-blue-600 transition"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 border-b border-slate-100 pb-4 mb-2">
                {['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map((day, i) => (<div key={day} className={`text-center text-[10px] font-extrabold tracking-widest ${i === 0 ? 'text-red-400' : 'text-slate-400'}`}>{day}</div>))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden shadow-inner">
                {(() => {
                  const year = currentNavDate.getFullYear();
                  const month = currentNavDate.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const firstDay = new Date(year, month, 1).getDay();
                  const days = [];
                  for (let i = 0; i < firstDay; i++) days.push(<div key={`e-${i}`} className="min-h-[110px] bg-slate-50/50"></div>);
                  for (let d = 1; d <= daysInMonth; d++) {
                    const curDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isEventActiveInDate = (event, dateStr) => { const end = event.end_date || event.date; return dateStr >= event.date && dateStr <= end; };
                    const getSortedEventsForDate = (dateStr) => { let active = events.filter(e => isEventActiveInDate(e, dateStr)); active.sort((a, b) => a.id - b.id); return active; };
                    const dayEvents = getSortedEventsForDate(curDate);
                    const visible = dayEvents.slice(0, 3);
                    const hiddenCount = dayEvents.length - 3;
                    days.push(<div key={d} className="min-h-[110px] bg-white relative p-1 flex flex-col gap-1 hover:bg-slate-50 transition cursor-pointer group" onClick={() => dayEvents.length && document.getElementById(`date-${curDate}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><div className={`text-sm font-bold mb-1 ml-1 w-7 h-7 flex items-center justify-center rounded-full ${new Date().toISOString().split('T')[0] === curDate ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-700 group-hover:text-blue-600 transition'}`}>{d}</div>{visible.map(ev => { const c = getCategoryColor(ev.category); const isStart = ev.date === curDate; const isEnd = (ev.end_date || ev.date) === curDate; const isMulti = ev.date !== (ev.end_date || ev.date); let cls = "rounded-lg mx-1 px-2"; if (isMulti) { if (isStart) cls = "rounded-l-lg mx-1 mr-[-4px] pl-2 z-10"; else if (isEnd) cls = "rounded-r-lg ml-[-4px] mr-1 pr-2"; else cls = "rounded-none mx-[-4px]"; } return <div key={ev.id} className={`text-[10px] font-bold truncate h-6 flex items-center ${c.bg} ${c.text} ${cls} transition hover:brightness-95`} title={ev.title}>{!isMulti || isStart ? ev.title : '\u00A0'}</div> })}{hiddenCount > 0 && <div className="text-[10px] text-slate-400 pl-2 mt-auto font-bold">+ {hiddenCount} lainnya</div>}</div>);
                  }
                  return days;
                })()}
              </div>
              <div className="flex flex-wrap gap-6 justify-center mt-8 pt-6 border-t border-slate-50">
                {[{ label: 'Legislasi', color: 'bg-blue-500' }, { label: 'Pengawasan', color: 'bg-orange-500' }, { label: 'Aspirasi', color: 'bg-emerald-500' }, { label: 'Kominfo', color: 'bg-violet-500' }].map((l, i) => (<div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className={`w-2.5 h-2.5 rounded-full ${l.color} shadow-sm`}></span> {l.label}</div>))}
              </div>
            </div>

            <div className="relative">
              {/* TIMELINE RENDER: GRID LAYOUT UNTUK MENGHINDARI TUMPANG TINDIH */}
              <div className="relative grid grid-cols-1 md:grid-cols-9 gap-8">
                {/* GARIS TENGAH (HANYA DESKTOP) */}
                <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent transform -translate-x-1/2 z-0"></div>

                {Object.keys(groupedEvents).sort().map((date, idx) => {
                  const dayEvents = groupedEvents[date].sort((a, b) => a.time.localeCompare(b.time));
                  const isRight = idx % 2 === 0; // Ganjil/Genap untuk ZigZag Desktop

                  return (
                    <React.Fragment key={date}>
                      {/* HEADER TANGGAL (Full Row) */}
                      <div id={`date-${date}`} className="col-span-1 md:col-span-9 flex justify-center z-20 mb-4 mt-8">
                        <div className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold shadow-xl shadow-slate-900/20 border-[4px] border-white whitespace-nowrap tracking-wide">
                          {formatRangeDate(dayEvents[0].date, dayEvents[0].end_date)}
                        </div>
                      </div>

                      {/* ITEM AGENDA (Grid Placement) */}
                      {/* MOBILE: Selalu full width. DESKTOP: Kiri (Col 1-4) atau Kanan (Col 6-9) */}
                      <div className={`col-span-1 md:col-span-4 ${isRight ? 'md:col-start-1 md:text-right' : 'md:col-start-6 md:text-left'} flex flex-col gap-4`}>
                        {dayEvents.map((ev) => {
                          const c = getCategoryColor(ev.category);
                          return (
                            <div key={ev.id} className="group bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 transition-all duration-300 relative overflow-hidden z-10">
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.border}`}></div>

                              <div className={`flex justify-between items-start mb-4 ${isRight ? 'md:flex-row-reverse' : ''}`}>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${c.badge}`}>{ev.category}</span>
                                <div className="flex items-center gap-2">
                                  <StatusBadge date={ev.date} endDate={ev.end_date} />
                                  {session && userRole !== 'staf_muda' && (
                                    <div className="flex gap-1 ml-2">
                                      <button onClick={() => handleEditClick(ev)} className="p-2 text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 rounded-lg transition"><Edit2 size={16} /></button>
                                      {/* BUTTON DELETE HANYA UTK ADMIN */}
                                      {userRole === 'admin' && (
                                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors leading-snug">{ev.title}</h3>
                              <p className="text-slate-500 text-sm mb-6 leading-relaxed line-clamp-3">{ev.description}</p>

                              <div className={`flex flex-col gap-3 text-xs font-bold text-slate-500 border-t border-slate-50 pt-4 ${isRight ? 'md:items-end' : 'md:items-start'}`}>
                                <div className="flex items-center gap-3"><CalendarDays size={16} className="text-blue-500" /> {formatRangeDate(ev.date, ev.end_date)}</div>
                                <div className="flex items-center gap-3"><Clock size={16} className="text-blue-500" /> {ev.time} WIB</div>
                                <div className="flex items-center gap-3"><MapPin size={16} className="text-blue-500" /> {ev.location}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </main>
        </>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-medium">© {new Date().getFullYear()} MPA HIMAKOM POLBAN. Developed by wyandhanu.</p>
        </div>
      </footer>
    </div>
  );
}