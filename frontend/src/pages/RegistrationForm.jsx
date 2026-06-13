import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Shield, Upload, CheckCircle2, AlertTriangle, Users, Award, Camera, User, Check, RefreshCw, Trophy, Trash2, Eye, ExternalLink } from 'lucide-react';

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    document.body.style.backgroundImage = "linear-gradient(rgba(6, 6, 8, 0.45), rgba(6, 6, 8, 0.45)), url('/bg.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";

    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundPosition = "";
      document.body.style.backgroundRepeat = "";
      document.body.style.backgroundAttachment = "";
    };
  }, []);

  // File uploads & previews state arrays (pre-allocated to size 5 for dynamic player slots)
  const [ytFiles, setYtFiles] = useState([null, null, null, null, null]);
  const [ytPreviews, setYtPreviews] = useState([null, null, null, null, null]);
  const [igFiles, setIgFiles] = useState([null, null, null, null, null]);
  const [igPreviews, setIgPreviews] = useState([null, null, null, null, null]);

  // React Hook Form
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      teamName: '',
      teamLeaderName: '',
      teamLeaderUID: '',
      discordUsername: '',
      players: [
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' }
      ],
      termsAccepted: false
    }
  });

  // Dynamically watch 5th player inputs to determine required count
  const watchP5Name = watch('players.4.playerName');
  const watchP5Uid = watch('players.4.playerUID');
  const watchP5Role = watch('players.4.role');

  const isP5Active = (watchP5Name && watchP5Name.trim() !== '') ||
                      (watchP5Uid && watchP5Uid.trim() !== '') ||
                      (watchP5Role && watchP5Role.trim() !== '');

  const requiredCount = isP5Active ? 5 : 4;
  const watchTerms = watch('termsAccepted');

  const handleSlotFileChange = (e, idx, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Only JPEG, JPG, and PNG images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'youtube') {
        setYtFiles(prev => {
          const next = [...prev];
          next[idx] = file;
          return next;
        });
        setYtPreviews(prev => {
          const next = [...prev];
          next[idx] = reader.result;
          return next;
        });
      } else {
        setIgFiles(prev => {
          const next = [...prev];
          next[idx] = file;
          return next;
        });
        setIgPreviews(prev => {
          const next = [...prev];
          next[idx] = reader.result;
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSlotFile = (idx, type) => {
    if (type === 'youtube') {
      setYtFiles(prev => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
      setYtPreviews(prev => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    } else {
      setIgFiles(prev => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
      setIgPreviews(prev => {
        const next = [...prev];
        next[idx] = null;
        return next;
      });
    }
  };

  const onSubmit = async (data) => {
    setErrorMsg('');

    const activeYtFiles = ytFiles.slice(0, requiredCount);
    const activeIgFiles = igFiles.slice(0, requiredCount);

    if (activeYtFiles.some(f => !f) || activeIgFiles.some(f => !f)) {
      setErrorMsg(`Please upload screenshot proofs for all ${requiredCount} team members.`);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('teamName', data.teamName);
      formData.append('teamLeaderName', data.teamLeaderName);
      formData.append('teamLeaderUID', data.teamLeaderUID);
      formData.append('discordUsername', data.discordUsername);
      formData.append('players', JSON.stringify(data.players));

      // Append arrays of files to the correct fields
      activeYtFiles.forEach(file => {
        formData.append('youtubeProofs', file);
      });
      activeIgFiles.forEach(file => {
        formData.append('instagramProofs', file);
      });

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${API_BASE_URL}/registrations`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccessData({
          registrationId: response.data.registrationId,
          teamName: response.data.data.teamName
        });
        reset();
        setYtFiles([null, null, null, null, null]);
        setYtPreviews([null, null, null, null, null]);
        setIgFiles([null, null, null, null, null]);
        setIgPreviews([null, null, null, null, null]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check form fields.');
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors) => {
    console.error("Form Validation Errors:", errors);
    setErrorMsg("Form submission failed. Please fill out all required fields (highlighted in red) and accept the terms.");
  };

  // Submit button active state rule (based on sliced arrays matching dynamic squad size)
  const activeYtFiles = ytFiles.slice(0, requiredCount);
  const activeIgFiles = igFiles.slice(0, requiredCount);
  const isSubmitDisabled = activeYtFiles.some(f => !f) || activeIgFiles.some(f => !f) || loading;

  if (successData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-gold/30 blur-2xl rounded-full" />
          <CheckCircle2 className="w-24 h-24 text-gold-bright mx-auto relative filter drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
        </div>
        <h1 className="font-gaming font-black text-3xl md:text-5xl text-white tracking-wider mb-2 uppercase italic">
          REGISTRATION <span className="text-gold-bright font-black">SUBMITTED</span>
        </h1>
        <p className="text-gray-400 font-sans text-base md:text-lg mb-8">
          Registration Submitted Successfully. Glory Awaits Your Team!
        </p>

        <div className="bg-[#121214] border-2 border-gold/40 rounded-xl p-8 max-w-md mx-auto mb-10 shadow-gold-glow">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-gaming mb-1">Your Registration ID</div>
          <div className="font-gaming font-black text-4xl text-gold-bright tracking-widest mb-4 glow-text">
            {successData.registrationId}
          </div>
          <div className="h-px bg-gold/20 w-3/4 mx-auto my-3" />
          <div className="text-sm text-gray-300 font-sans">
            Team: <span className="font-bold text-white font-gaming">{successData.teamName}</span>
          </div>
        </div>

        <button
          onClick={() => setSuccessData(null)}
          className="px-8 py-3 bg-gold-gradient hover:brightness-110 font-gaming text-white font-bold tracking-wider rounded transition-all duration-300 shadow-gold-glow-btn transform hover:-translate-y-0.5 cursor-pointer"
        >
          Register Another Team
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex justify-center">
      {/* Outer Container with Gold Border */}
      <div className="w-full bg-[#060608]/75 backdrop-blur-md border-2 border-gold/40 rounded-xl overflow-hidden shadow-2xl">
        
        {/* HEADER SECTION (Banner Image Match) */}
        <div className="relative border-b border-gold/25 overflow-hidden">
          <img 
            src="/banner.png" 
            alt="The Shield Showdown Banner" 
            className="w-full h-auto block object-cover" 
          />
        </div>

        {/* FORM FIELDS */}
        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="p-6 md:p-10 space-y-10">
          
          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-950/45 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3 font-sans text-sm">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: TEAM DETAILS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-2">
              <h2 className="font-gaming font-bold text-base md:text-lg text-gold-bright uppercase tracking-wider">
                TEAM DETAILS
              </h2>
              <div className="text-gold/30 font-mono tracking-widest text-sm font-bold">////</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('teamName', { required: 'Team Name is required' })}
                  placeholder="Your answer"
                  className={`w-full form-input ${errors.teamName ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                />
                {errors.teamName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.teamName.message}
                  </p>
                )}
              </div>

              {/* Team Leader Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Team Leader Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('teamLeaderName', { required: 'Team Leader Name is required' })}
                  placeholder="Your answer"
                  className={`w-full form-input ${errors.teamLeaderName ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                />
                {errors.teamLeaderName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.teamLeaderName.message}
                  </p>
                )}
              </div>

              {/* Leader UID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Team Leader Free Fire ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('teamLeaderUID', { required: 'Free Fire UID is required' })}
                  placeholder="Your answer"
                  className={`w-full form-input ${errors.teamLeaderUID ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                />
                {errors.teamLeaderUID && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.teamLeaderUID.message}
                  </p>
                )}
              </div>

              {/* Discord Username */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Discord Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('discordUsername', { required: 'Discord Username is required' })}
                  placeholder="Your answer"
                  className={`w-full form-input ${errors.discordUsername ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                />
                {errors.discordUsername && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.discordUsername.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: PLAYER DETAILS (5 PLAYERS) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gold/10 pb-2">
              <h2 className="font-gaming font-bold text-base md:text-lg text-gold-bright uppercase tracking-wider">
                PLAYER DETAILS (5 PLAYERS)
              </h2>
              <div className="text-gold/30 font-mono tracking-widest text-sm font-bold">////</div>
            </div>

            {/* Responsive Cards Grid (Unified for Desktop and Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((index) => {
                const isOptional = index === 4;
                return (
                  <div 
                    key={index} 
                    className={`bg-slate-900/40 border rounded-xl p-4 space-y-4 shadow-lg transition-all duration-300 ${
                      isOptional 
                        ? 'border-slate-800 hover:border-gold/30' 
                        : 'border-slate-700 hover:border-gold/50'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <h3 className="font-gaming font-black text-xs text-white tracking-widest">
                        PLAYER {index + 1}
                      </h3>
                      {isOptional ? (
                        <span className="text-[9px] bg-gold/15 text-gold border border-gold/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-gaming">
                          Optional
                        </span>
                      ) : (
                        <span className="text-[9px] bg-red-950/40 text-red-400 border border-red-900/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider font-gaming">
                          Required
                        </span>
                      )}
                    </div>
                    
                    {/* Player Name */}
                    <div>
                      <label className="block text-[10px] uppercase font-gaming text-slate-300 mb-1 font-bold">
                        Name In-Game
                      </label>
                      <input
                        type="text"
                        {...register(`players.${index}.playerName`, { required: index < 4 ? 'Name In-Game is required' : false })}
                        placeholder="Your answer"
                        className={`w-full form-input-sm ${errors.players?.[index]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                      />
                      {errors.players?.[index]?.playerName && (
                        <p className="text-red-500 text-[10px] mt-1 font-sans">Required</p>
                      )}
                    </div>

                    {/* Player ID */}
                    <div>
                      <label className="block text-[10px] uppercase font-gaming text-slate-300 mb-1 font-bold">
                        Player ID (UID)
                      </label>
                      <input
                        type="text"
                        {...register(`players.${index}.playerUID`, { required: index < 4 ? 'Player ID is required' : false })}
                        placeholder="Your answer"
                        className={`w-full form-input-sm ${errors.players?.[index]?.playerUID ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                      />
                      {errors.players?.[index]?.playerUID && (
                        <p className="text-red-500 text-[10px] mt-1 font-sans">Required</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-[10px] uppercase font-gaming text-slate-300 mb-1 font-bold">
                        Player Role
                      </label>
                      <select
                        {...register(`players.${index}.role`, { required: index < 4 ? 'Role is required' : false })}
                        className={`w-full form-input-sm cursor-pointer ${errors.players?.[index]?.role ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                      >
                        <option value="">Select Role</option>
                        <option value="IGL">IGL</option>
                        <option value="Rusher">Rusher</option>
                        <option value="Sniper">Sniper</option>
                        <option value="Support">Support</option>
                      </select>
                      {errors.players?.[index]?.role && (
                        <p className="text-red-500 text-[10px] mt-1 font-sans">Required</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: SOCIAL MEDIA FOLLOW PROOFS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gold/10 pb-2">
              <h2 className="font-gaming font-bold text-base md:text-lg text-gold-bright uppercase tracking-wider">
                SOCIAL MEDIA FOLLOW PROOFS (MANDATORY)
              </h2>
              <div className="text-gold/30 font-mono tracking-widest text-sm font-bold">////</div>
            </div>

            <p className="text-gray-400 text-xs md:text-sm font-sans">
              Your team must follow our YouTube and Instagram. Upload screenshots matching the number of squad members ({requiredCount} players detected).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              
              {/* YOUTUBE PROOF */}
              <div className="bg-[#0b0b0d] border border-gold/10 rounded-xl p-5 flex flex-col justify-between min-h-[360px] shadow-lg">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5 pb-3 border-b border-slate-850">
                    <div className="flex items-start gap-3">
                      {/* YouTube Icon */}
                      <div className="w-9 h-9 bg-[#FF0000] rounded flex items-center justify-center shrink-0 shadow">
                        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555a3.002 3.002 0 0 0-2.11 2.108C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-gaming font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                          YOUTUBE PROOFS <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-gray-500 text-[10px] leading-relaxed mt-1">
                          Channel name & Subscribed must be visible.
                        </p>
                      </div>
                    </div>

                    {/* REDIRECT YT BUTTON */}
                    <a
                      href="https://youtu.be/YzaBVJJIxhE?is=kn_qD24OIbDlbKYq"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000] hover:bg-[#CC0000] rounded text-xs font-bold text-white transition-all shadow shrink-0 cursor-pointer"
                    >
                      Subscribe Channel <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Individual Upload Fields Grid */}
                  <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => {
                      const file = ytFiles[idx];
                      const preview = ytPreviews[idx];
                      const playerName = watch(`players.${idx}.playerName`) || "";
                      const playerRole = watch(`players.${idx}.role`) || "";

                      return (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <User className="w-4 h-4 text-gold-bright shrink-0" />
                            <div className="flex-grow flex items-center gap-1.5">
                              <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setValue(`players.${idx}.playerName`, e.target.value, { shouldValidate: true })}
                                placeholder={`Player ${idx + 1} Name`}
                                className={`form-input-sm !py-1 !px-2 ${errors.players?.[idx]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                              />
                              {playerRole && (
                                <span className="text-[9px] bg-slate-800 text-gold border border-gold/15 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  {playerRole}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {file ? (
                              <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8 rounded border border-slate-750 overflow-hidden bg-black shadow-inner">
                                  <img src={preview} alt="Youtube Proof" className="w-full h-full object-cover" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSlotFile(idx, 'youtube')}
                                  className="p-1 bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition-colors"
                                  title="Remove File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5 font-gaming text-[9px] uppercase tracking-wider">
                                  <Check className="w-3.5 h-3.5 stroke-[3.5]" /> Done
                                </span>
                              </div>
                            ) : (
                              <div>
                                <label
                                  htmlFor={`yt-file-${idx}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-650 text-white rounded text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <Upload className="w-3 h-3" /> Upload
                                </label>
                                <input
                                  id={`yt-file-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlotFileChange(e, idx, 'youtube')}
                                  className="hidden"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* INSTAGRAM PROOF */}
              <div className="bg-[#0b0b0d] border border-gold/10 rounded-xl p-5 flex flex-col justify-between min-h-[360px] shadow-lg">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5 pb-3 border-b border-slate-850">
                    <div className="flex items-start gap-3">
                      {/* Instagram Icon */}
                      <div className="w-9 h-9 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] rounded flex items-center justify-center shrink-0 shadow">
                        <svg className="w-5 h-5 text-white stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-gaming font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                          INSTAGRAM PROOFS <span className="text-red-500">*</span>
                        </h3>
                        <p className="text-gray-500 text-[10px] leading-relaxed mt-1">
                          Username & Followed status must be visible.
                        </p>
                      </div>
                    </div>

                    {/* REDIRECT INSTA BUTTON */}
                    <a
                      href="https://www.instagram.com/jhuseesports?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold text-white transition-all shadow shrink-0 cursor-pointer"
                    >
                      Follow Instagram <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Individual Upload Fields Grid */}
                  <div className="space-y-3">
                    {[...Array(5)].map((_, idx) => {
                      const file = igFiles[idx];
                      const preview = igPreviews[idx];
                      const playerName = watch(`players.${idx}.playerName`) || "";
                      const playerRole = watch(`players.${idx}.role`) || "";

                      return (
                        <div key={idx} className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <User className="w-4 h-4 text-gold-bright shrink-0" />
                            <div className="flex-grow flex items-center gap-1.5">
                              <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setValue(`players.${idx}.playerName`, e.target.value, { shouldValidate: true })}
                                placeholder={`Player ${idx + 1} Name`}
                                className={`form-input-sm !py-1 !px-2 ${errors.players?.[idx]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''}`}
                              />
                              {playerRole && (
                                <span className="text-[9px] bg-slate-800 text-gold border border-gold/15 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  {playerRole}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {file ? (
                              <div className="flex items-center gap-2">
                                <div className="relative w-8 h-8 rounded border border-slate-750 overflow-hidden bg-black shadow-inner">
                                  <img src={preview} alt="Instagram Proof" className="w-full h-full object-cover" />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSlotFile(idx, 'instagram')}
                                  className="p-1 bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition-colors"
                                  title="Remove File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5 font-gaming text-[9px] uppercase tracking-wider">
                                  <Check className="w-3.5 h-3.5 stroke-[3.5]" /> Done
                                </span>
                              </div>
                            ) : (
                              <div>
                                <label
                                  htmlFor={`ig-file-${idx}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-650 text-white rounded text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  <Upload className="w-3 h-3" /> Upload
                                </label>
                                <input
                                  id={`ig-file-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlotFileChange(e, idx, 'instagram')}
                                  className="hidden"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-[#121214] border border-gold/30 rounded p-3 text-center shadow-inner">
              <p className="text-gold-bright text-xs md:text-sm font-gaming font-bold tracking-widest flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gold-bright animate-pulse" />
                WITHOUT PROOFS, YOUR TEAM WILL NOT BE REGISTERED.
              </p>
            </div>
          </div>

          {/* SECTION 4: TERMS & CONDITIONS */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-gold/10 pb-2">
              <h2 className="font-gaming font-bold text-base md:text-lg text-gold-bright uppercase tracking-wider">
                TERMS & CONDITIONS
              </h2>
              <div className="text-gold/30 font-mono tracking-widest text-sm font-bold">////</div>
            </div>

            <div className="flex items-start gap-3 cursor-pointer select-none font-sans">
              <div className="relative flex items-center mt-1">
                <input
                  type="checkbox"
                  {...register('termsAccepted', { required: 'You must accept the terms and conditions' })}
                  className="sr-only peer"
                  id="terms-check"
                />
                <label
                  htmlFor="terms-check"
                  className={`w-5 h-5 bg-[#0b0c10] border-2 rounded flex items-center justify-center transition-all cursor-pointer ${
                    watchTerms ? 'border-[#FFD700] bg-black shadow-[0_0_10px_rgba(255,215,0,0.6)]' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {watchTerms && <Check className="w-3.5 h-3.5 text-[#FFD700] font-black stroke-[4]" />}
                </label>
              </div>
              <label htmlFor="terms-check" className="text-xs md:text-sm text-gray-400 hover:text-gray-300 transition-colors cursor-pointer leading-relaxed">
                I agree to all the rules and regulations of The Shield Showdown. All details provided are correct and my team is ready to participate.
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-red-500 text-xs flex items-center gap-1 font-medium -mt-2 pl-8 font-sans">
                <AlertTriangle className="w-3.5 h-3.5" /> {errors.termsAccepted.message}
              </p>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex flex-col items-center pt-4">
            {/* Submit Requirements State message */}
            {isSubmitDisabled && !loading && (
              <p className="text-gray-500 text-[10px] md:text-xs font-gaming uppercase tracking-wide text-center mb-4 leading-relaxed max-w-md">
                <span className="text-gold-bright font-black">Upload Proof Status:</span> YouTube ({activeYtFiles.filter(Boolean).length}/{requiredCount}) &bull; Instagram ({activeIgFiles.filter(Boolean).length}/{requiredCount})<br />
                <span className="text-gray-600 text-[9px] lowercase">(submit button enables automatically when all screenshots are uploaded)</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full max-w-sm font-gaming font-black text-white uppercase text-sm md:text-base tracking-widest py-3 px-8 rounded shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group ${
                isSubmitDisabled
                  ? 'bg-gray-700 text-gray-400 border border-gray-600 opacity-45 cursor-not-allowed'
                  : 'bg-gold-gradient hover:brightness-110 shadow-gold-glow hover:shadow-gold-glow-btn cursor-pointer transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  Submitting...
                </>
              ) : (
                'SUBMIT'
              )}
            </button>

            {/* Footer text */}
            <p className="text-gray-500 text-[10px] font-sans text-center mt-6 tracking-wide">
              Never give out your password.<br />
              This form was created inside <span className="underline hover:text-gold cursor-pointer">The Shield Showdown</span>. <span className="underline hover:text-gold cursor-pointer">Report Abuse</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
