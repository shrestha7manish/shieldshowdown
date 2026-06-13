import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { LayoutDashboard, Users, Calendar, Search, Download, Trash2, Eye, ShieldAlert, AlertTriangle, Trophy, Clock, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'admin123') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  // Dashboard Stats & Lists
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, registrationsToday: 0, totalTeams: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  // Timer Settings State
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerTargetDate, setTimerTargetDate] = useState('');
  const [timerTitle, setTimerTitle] = useState('Registration Closes In');
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerMessage, setTimerMessage] = useState({ text: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchRegistrations();
      fetchTimerSettings();
    }
  }, [isLoggedIn]);

  // Fetch stats and lists when search key changes
  useEffect(() => {
    if (isLoggedIn) {
      const delayDebounceFn = setTimeout(() => {
        fetchRegistrations();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, isLoggedIn]);


  const fetchTimerSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/timer`);
      if (response.data && response.data.value) {
        const { isEnabled, targetDate, title } = response.data.value;
        setTimerEnabled(isEnabled);
        setTimerTitle(title || 'Registration Closes In');
        if (targetDate) {
          const dateObj = new Date(targetDate);
          if (!isNaN(dateObj.getTime())) {
            const tzoffset = dateObj.getTimezoneOffset() * 60000;
            const localISOTime = new Date(dateObj.getTime() - tzoffset).toISOString().slice(0, 16);
            setTimerTargetDate(localISOTime);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching timer settings:', error);
    }
  };

  const handleSaveTimerSettings = async (e) => {
    e.preventDefault();
    setTimerSaving(true);
    setTimerMessage({ text: '', type: '' });
    try {
      const targetDateISO = new Date(timerTargetDate).toISOString();
      const payload = {
        value: {
          isEnabled: timerEnabled,
          targetDate: targetDateISO,
          title: timerTitle
        }
      };
      await axios.post(`${API_BASE_URL}/settings/timer`, payload);
      setTimerMessage({ text: 'Timer settings updated successfully!', type: 'success' });
      setTimeout(() => {
        setTimerMessage({ text: '', type: '' });
      }, 5000);
    } catch (error) {
      console.error('Error saving timer settings:', error);
      setTimerMessage({ text: error.response?.data?.message || 'Failed to save timer settings.', type: 'error' });
    } finally {
      setTimerSaving(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations`, {
        params: { search }
      });
      setRegistrations(response.data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setErrorMsg('Failed to load registration data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE_URL}/registrations/${deleteId}`);
      setRegistrations(registrations.filter(r => r._id !== deleteId));
      fetchStats(); // Update counters
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting registration:', error);
      setErrorMsg('Failed to delete registration record.');
    }
  };

  // Excel Export
  const exportToExcel = () => {
    if (registrations.length === 0) return;

    const exportData = registrations.map((reg) => {
      const row = {
        'Registration ID': reg.registrationId,
        'Team Name': reg.teamName,
        'Team Leader': reg.teamLeaderName,
        'Leader UID': reg.teamLeaderUID,
        'Discord Username': reg.discordUsername,
        'Submission Date': new Date(reg.submittedAt).toLocaleString(),
      };

      // Map player columns
      reg.players.forEach((p, idx) => {
        row[`Player ${idx + 1} Name`] = p.playerName;
        row[`Player ${idx + 1} UID`] = p.playerUID;
        row[`Player ${idx + 1} Role`] = p.role;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Autofilter and auto-column width
    const max_len = exportData.reduce((acc, row) => {
      Object.keys(row).forEach((key, idx) => {
        const val = row[key] ? row[key].toString() : '';
        acc[idx] = Math.max(acc[idx] || 0, val.length, key.length);
      });
      return acc;
    }, []);
    worksheet['!cols'] = max_len.map(w => ({ w: w + 2 }));

    XLSX.writeFile(workbook, `TSS_Tournament_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // PDF Export
  const exportToPDF = () => {
    if (registrations.length === 0) return;

    const doc = new jsPDF();
    
    // Add title banner design
    doc.setFillColor(15, 15, 18);
    doc.rect(0, 0, 220, 40, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(212, 175, 55); // Gold
    doc.setFontSize(22);
    doc.text('THE SHIELD SHOWDOWN', 14, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('OFFICIAL TOURNAMENT REGISTRATION LIST', 14, 28);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 35);

    // Summary box
    doc.setFillColor(245, 245, 248);
    doc.rect(14, 45, 182, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Total Registrations: ${stats.totalRegistrations}`, 20, 56);
    doc.text(`Registered Today: ${stats.registrationsToday}`, 85, 56);
    doc.text(`Unique Teams: ${stats.totalTeams}`, 150, 56);

    const headers = [['Reg ID', 'Team Name', 'Team Leader', 'Discord Username', 'Submission Date']];
    const data = registrations.map((reg) => [
      reg.registrationId,
      reg.teamName,
      reg.teamLeaderName,
      reg.discordUsername,
      new Date(reg.submittedAt).toLocaleDateString()
    ]);

    doc.autoTable({
      head: headers,
      body: data,
      startY: 70,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [0, 0, 0], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      margin: { top: 70 }
    });

    doc.save(`TSS_Tournament_Registrations_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Login View Wrapper
  if (!isLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-[#060608]/95 border-2 border-gold/40 rounded-xl p-8 shadow-2xl relative overflow-hidden font-sans">
          <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
          
          <div className="text-center mb-6">
            <Trophy className="w-12 h-12 text-gold-bright mx-auto filter drop-shadow-[0_0_12px_rgba(255,215,0,0.5)] mb-3" />
            <h2 className="font-gaming font-black text-xl text-white tracking-widest uppercase">
              ADMIN PANEL ACCESS
            </h2>
            <p className="text-[10px] text-gray-500 font-gaming uppercase tracking-widest mt-1">
              The Shield Showdown
            </p>
          </div>

          {loginError && (
            <div className="bg-red-900/20 border border-red-500 text-red-200 p-3 rounded mb-5 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Enter admin username"
                className="w-full bg-[#141416] border border-gold/20 rounded p-3 text-white text-sm focus:outline-none focus:border-gold-bright transition-all placeholder-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-white uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-[#141416] border border-gold/20 rounded p-3 text-white text-sm focus:outline-none focus:border-gold-bright transition-all placeholder-slate-500 font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gold-gradient hover:brightness-110 font-gaming font-black text-white uppercase tracking-widest py-3.5 rounded shadow-gold-glow hover:shadow-gold-glow-btn transition-all duration-300 flex items-center justify-center cursor-pointer"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-gaming font-black text-2xl md:text-3xl text-white tracking-wider uppercase flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-gold-bright" /> Admin <span className="text-gold-bright">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm font-sans mt-1">
            Manage tournament sign-ups, query database statistics, and run document exports.
          </p>
        </div>

        {/* Exports & Logout Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportToExcel}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 font-bold rounded transition-all cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-gold-gradient hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 font-bold rounded transition-all cursor-pointer shadow-lg shadow-gold-glow"
          >
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded font-bold transition-all cursor-pointer shadow-lg"
          >
            Registration Form
          </Link>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* TOTAL REGISTRATIONS */}
        <div className="bg-dark-card border border-gold/10 rounded-xl p-6 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
          <div className="bg-gold/10 p-3 rounded-lg border border-gold/20">
            <Users className="w-6 h-6 text-gold-bright" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-gaming text-gray-500 tracking-wider">Total Registrations</span>
            <span className="font-gaming font-black text-2xl text-white mt-0.5 block">{stats.totalRegistrations}</span>
          </div>
        </div>

        {/* REGISTRATIONS TODAY */}
        <div className="bg-dark-card border border-gold/10 rounded-xl p-6 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
          <div className="bg-gold/10 p-3 rounded-lg border border-gold/20">
            <Calendar className="w-6 h-6 text-gold-bright" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-gaming text-gray-500 tracking-wider">Registrations Today</span>
            <span className="font-gaming font-black text-2xl text-white mt-0.5 block">{stats.registrationsToday}</span>
          </div>
        </div>

        {/* TOTAL UNIQUE TEAMS */}
        <div className="bg-dark-card border border-gold/10 rounded-xl p-6 relative overflow-hidden flex items-center gap-4 shadow-lg">
          <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
          <div className="bg-gold/10 p-3 rounded-lg border border-gold/20">
            <Trophy className="w-6 h-6 text-gold-bright" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-gaming text-gray-500 tracking-wider">Unique Teams</span>
            <span className="font-gaming font-black text-2xl text-white mt-0.5 block">{stats.totalTeams}</span>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-8">
        
        {/* Left 3/4 columns: Search + Table */}
        <div className="lg:col-span-3 space-y-6">
          {/* FILTER SEARCH BAR */}
          <div className="bg-dark-card border border-gold/15 rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center shadow-lg">
            <div className="relative w-full">
              <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search registrations by ID, Team Name, or Team Leader..."
                className="w-full bg-[#0d0d0f] border border-gold/10 hover:border-gold/25 focus:border-gold-bright focus:outline-none rounded-lg py-3 pl-11 pr-4 text-white text-sm transition-all"
              />
            </div>
          </div>

          {/* REGISTRATIONS LIST TABLE */}
          <div className="bg-dark-card border border-gold/15 rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block w-8 h-8 border-4 border-gold/30 border-t-gold-bright rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-gaming text-sm">Querying Database...</p>
              </div>
            ) : errorMsg ? (
              <div className="py-16 text-center text-red-400">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="font-medium">{errorMsg}</p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="py-20 text-center text-gray-500 font-sans">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p className="text-sm">No tournament registrations found matching filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/55 border-b border-gold/15 text-xs font-gaming text-gold-bright uppercase tracking-wider">
                      <th className="py-4 px-6 font-bold">Registration ID</th>
                      <th className="py-4 px-6 font-bold">Team Name</th>
                      <th className="py-4 px-6 font-bold">Team Leader</th>
                      <th className="py-4 px-6 font-bold">Discord Username</th>
                      <th className="py-4 px-6 font-bold">Submission Date</th>
                      <th className="py-4 px-6 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/5 text-sm">
                    {registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-[#1A1A1E]/30 transition-colors">
                        <td className="py-4 px-6 font-gaming font-bold text-white tracking-widest">{reg.registrationId}</td>
                        <td className="py-4 px-6 font-semibold text-white">{reg.teamName}</td>
                        <td className="py-4 px-6 text-gray-300">{reg.teamLeaderName}</td>
                        <td className="py-4 px-6 text-gray-400 font-mono">{reg.discordUsername}</td>
                        <td className="py-4 px-6 text-gray-400">{new Date(reg.submittedAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-3">
                            <Link
                              to={`/admin/registration/${reg._id}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-650 rounded text-xs transition-all cursor-pointer font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(reg._id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650 hover:bg-red-600 text-white rounded text-xs transition-all cursor-pointer font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1/4 column: Timer settings */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0b0d] border border-gold/15 rounded-xl p-5 shadow-xl relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <h3 className="font-gaming font-bold text-sm text-gold-bright uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> Timer Setup
            </h3>
            
            {timerMessage.text && (
              <div className={`p-3 rounded mb-4 text-xs flex items-center gap-2 border ${
                timerMessage.type === 'success' 
                  ? 'bg-emerald-950/45 border-emerald-500/35 text-emerald-255' 
                  : 'bg-red-950/45 border-red-500/35 text-red-255'
              }`}>
                {timerMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="text-[11px] font-sans">{timerMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveTimerSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Timer Status
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="timer-status"
                    checked={timerEnabled}
                    onChange={(e) => setTimerEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor="timer-status"
                    className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors relative ${
                      timerEnabled ? 'bg-[#D4AF37]' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform duration-200 transform ${
                      timerEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </label>
                  <span className="text-xs text-gray-300 font-medium">
                    {timerEnabled ? 'Enabled (Active)' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Timer Label
                </label>
                <input
                  type="text"
                  required
                  value={timerTitle}
                  onChange={(e) => setTimerTitle(e.target.value)}
                  placeholder="e.g., Registration Closes In"
                  className="w-full bg-[#121214] border border-slate-700 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none rounded-lg p-2.5 text-white text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Target Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={timerTargetDate}
                  onChange={(e) => setTimerTargetDate(e.target.value)}
                  className="w-full bg-[#121214] border border-slate-700 hover:border-[#D4AF37]/50 focus:border-[#D4AF37] focus:outline-none rounded-lg p-2.5 text-white text-xs transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={timerSaving}
                className="w-full bg-gold-gradient hover:brightness-110 disabled:opacity-50 text-black font-gaming font-black text-xs uppercase tracking-widest py-3 rounded shadow-gold-glow hover:shadow-gold-glow-btn transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                {timerSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-black" />
                    Save Settings
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-card border border-red-500/30 rounded-xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
            <h3 className="font-gaming font-bold text-base md:text-lg text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Confirm Deletion
            </h3>
            <p className="text-gray-300 text-sm font-sans mb-6">
              Are you sure you want to delete this registration? This will permanently erase the database record and delete screenshot upload files off the server. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 bg-slate-850 hover:bg-slate-750 border border-slate-650 text-white rounded text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold cursor-pointer transition-all"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
