import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Users, Calendar, Search, Trash2, Eye, ShieldAlert, AlertTriangle, Trophy, Clock, Save, RefreshCw, CheckCircle2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('admin_logged_in') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  function handleLoginSubmit(e) {
    e.preventDefault();
    if (loginUser === 'admin' && loginPass === 'admin123') {
      setIsLoggedIn(true);
      sessionStorage.setItem('admin_logged_in', 'true');
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
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteLogoId, setDeleteLogoId] = useState(null);
  const [logoDeleteLoading, setLogoDeleteLoading] = useState(false);
  const [logoDeleteSuccess, setLogoDeleteSuccess] = useState(false);

  // Timer Settings State
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerTargetDate, setTimerTargetDate] = useState('');
  const [timerTitle, setTimerTitle] = useState('Registration Closes In');
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerMessage, setTimerMessage] = useState({ text: '', type: '' });

  // Invited Teams State
  const [invitedTeams, setInvitedTeams] = useState([]);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoMessage, setLogoMessage] = useState({ text: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (isLoggedIn) {
      fetchStats();
      fetchRegistrations();
      fetchTimerSettings();
      fetchInvitedTeams();
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

  // Reset currentPage to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Adjust page if registrations count shrinks
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(registrations.length / itemsPerPage));
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [registrations.length, currentPage]);

  const totalPages = Math.max(1, Math.ceil(registrations.length / itemsPerPage));

  async function fetchTimerSettings() {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/timer`);
      if (response.data && response.data.value) {
        const { isEnabled, targetDate, title, isClosed } = response.data.value;
        setTimerEnabled(isEnabled);
        setTimerTitle(title || 'Registration Closes In');
        setRegistrationClosed(!!isClosed);
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

  async function fetchInvitedTeams() {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/invited_teams`);
      if (response.data && response.data.value) {
        setInvitedTeams(response.data.value);
      }
    } catch (error) {
      console.error('Error fetching invited teams:', error);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoMessage({ text: '', type: '' });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setLogoMessage({ text: 'Only JPEG, JPG, PNG, and WEBP images are allowed.', type: 'error' });
      setLogoUploading(false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoMessage({ text: 'Image size cannot exceed 5MB.', type: 'error' });
      setLogoUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const uploadRes = await axios.post(`${API_BASE_URL}/settings/upload-logo`, formData);

      if (uploadRes.data && uploadRes.data.url) {
        const newLogoUrl = uploadRes.data.url;
        const updatedTeams = [...invitedTeams, { id: Date.now().toString(), logoUrl: newLogoUrl }];
        setInvitedTeams(updatedTeams);
        setLogoSaving(true);
        const saveRes = await axios.post(`${API_BASE_URL}/settings/invited_teams`, { value: updatedTeams });
        if (saveRes.status === 200) {
          setLogoMessage({ text: 'Logo uploaded and saved successfully!', type: 'success' });
        }
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setLogoMessage({ text: error.response?.data?.message || 'Failed to upload logo.', type: 'error' });
    } finally {
      setLogoUploading(false);
      setLogoSaving(false);
      e.target.value = '';
      setTimeout(() => {
        setLogoMessage({ text: '', type: '' });
      }, 5000);
    }
  }

  function handleLogoDelete(id) {
    setDeleteLogoId(id);
    setLogoDeleteLoading(false);
    setLogoDeleteSuccess(false);
  }

  async function confirmLogoDelete() {
    if (!deleteLogoId) return;
    setLogoDeleteLoading(true);
    setLogoDeleteSuccess(false);
    const updatedTeams = invitedTeams.filter(team => team.id !== deleteLogoId);
    try {
      await axios.post(`${API_BASE_URL}/settings/invited_teams`, { value: updatedTeams });
      setInvitedTeams(updatedTeams);
      setLogoDeleteSuccess(true);
      setTimeout(() => {
        setDeleteLogoId(null);
        setLogoDeleteSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error deleting logo:', error);
      setLogoMessage({ text: 'Failed to delete logo setting from database.', type: 'error' });
      setDeleteLogoId(null);
    } finally {
      setLogoDeleteLoading(false);
    }
  }

  async function handleSaveTimerSettings(e) {
    e.preventDefault();
    setTimerSaving(true);
    setTimerMessage({ text: '', type: '' });
    try {
      const targetDateISO = new Date(timerTargetDate).toISOString();
      const payload = {
        value: {
          isEnabled: timerEnabled,
          targetDate: targetDateISO,
          title: timerTitle,
          isClosed: registrationClosed
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

  async function fetchStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  async function fetchRegistrations() {
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

  const handleExportToExcel = () => {
    if (registrations.length === 0) return;

    // Prepare the data for Excel
    const dataToExport = registrations.map((reg) => {
      const row = {
        'Registration ID': reg.registrationId || '',
        'Team Name': reg.teamName || '',
        'Team Leader': reg.teamLeaderName || '',
        'Email': reg.email || '',
        'Submission Date': reg.submittedAt ? new Date(reg.submittedAt).toLocaleString() : '',
      };

      // Add player details (up to 5 players)
      for (let i = 0; i < 5; i++) {
        const player = reg.players && reg.players[i];
        row[`Player ${i + 1} Name`] = player ? player.playerName : '';
        row[`Player ${i + 1} UID`] = player ? player.playerUID : '';
        row[`Player ${i + 1} Role`] = player ? player.role : '';
      }

      return row;
    });

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Generate buffer and trigger download
    XLSX.writeFile(workbook, `Shield_Showdown_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  function handleDeleteClick(id) {
    setDeleteId(id);
    setDeleteLoading(false);
    setDeleteSuccess(false);
  };

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteSuccess(false);
    try {
      await axios.delete(`${API_BASE_URL}/registrations/${deleteId}`);
      setRegistrations(registrations.filter(r => r._id !== deleteId));
      fetchStats(); // Update counters
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteId(null);
        setDeleteSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Error deleting registration:', error);
      setErrorMsg('Failed to delete registration record.');
    } finally {
      setDeleteLoading(false);
    }
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
            onClick={handleExportToExcel}
            disabled={registrations.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-550/30 rounded font-bold transition-all cursor-pointer shadow-lg disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-white" /> Export to Excel
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-slate-800 hover:bg-slate-700 border border-slate-650 rounded font-bold transition-all cursor-pointer shadow-lg"
          >
            Registration Form
          </Link>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              sessionStorage.removeItem('admin_logged_in');
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-gaming text-white bg-red-600 hover:bg-red-500 rounded font-bold transition-all cursor-pointer shadow-lg"
          >
            Logout
          </button>
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
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-black/55 border-b border-gold/15 text-xs font-gaming text-gold-bright uppercase tracking-wider">
                        <th className="py-4 px-6 font-bold">Registration ID</th>
                        <th className="py-4 px-6 font-bold">Team Name</th>
                        <th className="py-4 px-6 font-bold">Team Leader</th>
                        <th className="py-4 px-6 font-bold">Email</th>
                        <th className="py-4 px-6 font-bold">Submission Date</th>
                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold/5 text-sm">
                      {registrations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((reg) => (
                        <tr key={reg._id} className="hover:bg-[#1A1A1E]/30 transition-colors">
                          <td className="py-4 px-6 font-gaming font-bold text-white tracking-widest">{reg.registrationId}</td>
                          <td className="py-4 px-6 font-semibold text-white">{reg.teamName}</td>
                          <td className="py-4 px-6 text-gray-300">{reg.teamLeaderName}</td>
                          <td className="py-4 px-6 text-gray-300 font-sans">{reg.email}</td>
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
                
                {/* Pagination Controls */}
                {registrations.length > 0 && (
                  <div className="bg-black/40 border-t border-gold/15 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-gray-400">
                    <div>
                      Showing{' '}
                      <span className="font-semibold text-white">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, registrations.length)}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-white">
                        {Math.min(currentPage * itemsPerPage, registrations.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-white">
                        {registrations.length}
                      </span>{' '}
                      registrations
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700 text-white font-bold transition-all cursor-pointer select-none"
                      >
                        Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - currentPage) <= 1
                          ) {
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded font-gaming font-black border transition-all cursor-pointer ${
                                  currentPage === pageNum
                                    ? 'bg-gold-gradient text-black border-gold font-bold'
                                    : 'bg-slate-900/50 hover:bg-slate-800 text-white border-slate-700'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          
                          if (
                            pageNum === 2 ||
                            pageNum === totalPages - 1
                          ) {
                            return <span key={pageNum} className="px-1 text-gray-655 select-none">...</span>;
                          }
                          
                          return null;
                        })}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 border border-slate-700 text-white font-bold transition-all cursor-pointer select-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right 1/4 column: Timer settings */}
        <div className="lg:col-span-1">
          <div className="bg-[#0b0b0d] border border-gold/15 rounded-xl p-5 shadow-xl relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <h3 className="font-gaming font-bold text-sm text-gold-bright uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> Registration Control
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
              {/* Form Status Switch */}
              <div className="border-b border-gold/10 pb-3 mb-3">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Registration Form Status
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="registration-status"
                    checked={!registrationClosed}
                    onChange={(e) => setRegistrationClosed(!e.target.checked)}
                    className="sr-only peer"
                  />
                  <label
                    htmlFor="registration-status"
                    className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors relative ${
                      !registrationClosed ? 'bg-emerald-600' : 'bg-red-600'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-black rounded-full shadow-md transition-transform duration-200 transform ${
                      !registrationClosed ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </label>
                  <span className={`text-xs font-bold transition-colors duration-200 ${
                    !registrationClosed ? 'text-emerald-400' : 'text-red-500'
                  }`}>
                    {!registrationClosed ? 'OPEN (Accepting Entries)' : 'CLOSED (Disabled)'}
                  </span>
                </div>
              </div>

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

          {/* Invited Team Logos Setup Card */}
          <div className="mt-6 bg-[#0b0b0d] border border-gold/15 rounded-xl p-5 shadow-xl relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
            <h3 className="font-gaming font-bold text-sm text-gold-bright uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" /> Invited Team Logos
            </h3>

            {logoMessage.text && (
              <div className={`p-3 rounded mb-4 text-xs flex items-center gap-2 border ${
                logoMessage.type === 'success' 
                  ? 'bg-emerald-950/45 border-emerald-500/35 text-emerald-255' 
                  : 'bg-red-950/45 border-red-500/35 text-red-255'
              }`}>
                {logoMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
                <span className="text-[11px] font-sans">{logoMessage.text}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Upload Logo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    id="invited-logo-file"
                    disabled={logoUploading || logoSaving}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="invited-logo-file"
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-gold/50 rounded-lg p-4 cursor-pointer text-xs text-gray-400 hover:text-white transition-all bg-[#121214]"
                  >
                    {logoUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-gold" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gold" />
                        Choose Logo
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* List of current logos */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Current Logos ({invitedTeams.length})
                </label>
                {invitedTeams.length === 0 ? (
                  <p className="text-[11px] text-gray-500 italic">No team logos uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {invitedTeams.map((team) => (
                      <div key={team.id} className="relative group aspect-square bg-slate-900 border border-slate-800 rounded-lg p-1.5 flex items-center justify-center overflow-hidden">
                        <img src={team.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                        
                        <button
                          type="button"
                          disabled={logoSaving}
                          onClick={() => handleLogoDelete(team.id)}
                          className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer border-none"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-dark-card border rounded-xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            deleteSuccess ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 ${
              deleteSuccess ? 'bg-emerald-500' : 'bg-red-600'
            }`} />
            
            {deleteSuccess ? (
              <div className="text-center py-6 animate-fadeIn">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-bounce" />
                <h3 className="font-gaming font-black text-lg text-white uppercase tracking-wider mb-2">
                  DELETE SUCCESSFUL
                </h3>
                <p className="text-gray-400 text-xs font-sans">
                  The registration record has been permanently deleted from the database.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-gaming font-bold text-base md:text-lg text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Confirm Deletion
                </h3>
                <p className="text-gray-300 text-sm font-sans mb-6">
                  Are you sure you want to delete this registration? This will permanently erase the database record and delete screenshot upload files off the server. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    disabled={deleteLoading}
                    onClick={() => setDeleteId(null)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-750 border border-slate-650 disabled:opacity-50 text-white rounded text-xs font-bold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteLoading}
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Record'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* LOGO DELETE CONFIRMATION MODAL */}
      {deleteLogoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-dark-card border rounded-xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            logoDeleteSuccess ? 'border-emerald-500/30' : 'border-red-500/30'
          }`}>
            <div className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 ${
              logoDeleteSuccess ? 'bg-emerald-500' : 'bg-red-600'
            }`} />
            
            {logoDeleteSuccess ? (
              <div className="text-center py-6 animate-fadeIn">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4 filter drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] animate-bounce" />
                <h3 className="font-gaming font-black text-lg text-white uppercase tracking-wider mb-2">
                  LOGO DELETED
                </h3>
                <p className="text-gray-400 text-xs font-sans">
                  The invited team logo has been successfully deleted from the database.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-gaming font-bold text-base md:text-lg text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" /> Confirm Logo Deletion
                </h3>
                <p className="text-gray-300 text-sm font-sans mb-6">
                  Are you sure you want to delete this invited team logo? This will remove it from the homepage marquee carousel. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    disabled={logoDeleteLoading}
                    onClick={() => setDeleteLogoId(null)}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-750 border border-slate-650 disabled:opacity-50 text-white rounded text-xs font-bold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={logoDeleteLoading}
                    onClick={confirmLogoDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded text-xs font-semibold cursor-pointer transition-all flex items-center gap-2"
                  >
                    {logoDeleteLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Logo'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
