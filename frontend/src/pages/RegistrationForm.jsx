import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Shield, Upload, CheckCircle2, AlertTriangle, Users, Award, Camera, User, Check, RefreshCw, Trophy, Trash2, Eye, ExternalLink, Clock } from 'lucide-react';

export default function RegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Timer Configuration and Countdown State
  const [timerConfig, setTimerConfig] = useState({ isEnabled: false, targetDate: null, title: 'Registration Closes In' });
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  // Invited Teams State
  const [invitedTeams, setInvitedTeams] = useState([]);

  useEffect(() => {
    const fetchTimerConfig = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_BASE_URL}/settings/timer`);
        if (response.data && response.data.value) {
          setTimerConfig(response.data.value);
        }
      } catch (error) {
        console.error('Error fetching timer configuration:', error);
      }
    };
    const fetchInvitedTeams = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const response = await axios.get(`${API_BASE_URL}/settings/invited_teams`);
        if (response.data && response.data.value) {
          setInvitedTeams(response.data.value);
        }
      } catch (error) {
        console.error('Error fetching invited teams:', error);
      }
    };
    fetchTimerConfig();
    fetchInvitedTeams();
  }, []);

  useEffect(() => {
    if (!timerConfig.isEnabled || !timerConfig.targetDate) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(timerConfig.targetDate) - +new Date();
      let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      let expired = false;

      if (difference > 0) {
        newTimeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      } else {
        expired = true;
      }

      setTimeLeft(newTimeLeft);
      setIsExpired(expired);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [timerConfig]);

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

  const [showUploadErrors, setShowUploadErrors] = useState(false);

  // React Hook Form
  const getSavedValues = () => {
    try {
      const saved = localStorage.getItem('shield_showdown_reg_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e);
    }
    return {
      teamName: '',
      teamLeaderName: '',
      email: '',
      players: [
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' },
        { playerName: '', playerUID: '', role: '' }
      ],
      termsAccepted: false
    };
  };

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    defaultValues: getSavedValues()
  });

  // Dynamically watch 5th player inputs to determine required count
  const watchP5Name = watch('players.4.playerName');
  const watchP5Uid = watch('players.4.playerUID');
  const watchP5Role = watch('players.4.role');

  const isP5Active = !!((watchP5Name && watchP5Name.trim() !== '') ||
                      (watchP5Uid && watchP5Uid.trim() !== ''));

  const requiredCount = isP5Active ? 5 : 4;
  const proofRequiredCount = 2;
  const watchTerms = watch('termsAccepted');

  const formValues = watch();

  // Persist form data on reload
  useEffect(() => {
    if (formValues) {
      localStorage.setItem('shield_showdown_reg_data', JSON.stringify(formValues));
    }
  }, [formValues]);

  // Clean 5th player upload slot files if player 5 details are cleared
  useEffect(() => {
    if (!isP5Active) {
      setYtFiles(prev => {
        const next = [...prev];
        next[4] = null;
        return next;
      });
      setYtPreviews(prev => {
        const next = [...prev];
        next[4] = null;
        return next;
      });
      setIgFiles(prev => {
        const next = [...prev];
        next[4] = null;
        return next;
      });
      setIgPreviews(prev => {
        const next = [...prev];
        next[4] = null;
        return next;
      });
    }
  }, [isP5Active]);

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

  const formFieldOrder = [
    'teamName',
    'teamLeaderName',
    'email',
    ...[0, 1, 2, 3, 4].flatMap(idx => [
      `players.${idx}.playerName`,
      `players.${idx}.playerUID`,
      `players.${idx}.role`
    ]),
    'termsAccepted'
  ];

  const getNestedError = (errors, path) => {
    const parts = path.split('.');
    let current = errors;
    for (const part of parts) {
      if (!current) return undefined;
      current = current[part];
    }
    return current;
  };

  const scrollToFirstError = (errors) => {
    for (const path of formFieldOrder) {
      if (getNestedError(errors, path)) {
        const element = document.querySelector(`[name="${path}"]`);
        if (element) {
          if (path === 'termsAccepted') {
            const termsContainer = document.getElementById('terms-container');
            if (termsContainer) {
              termsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
          }
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try {
            element.focus({ preventScroll: true });
          } catch (e) {
            console.error(e);
          }
          return;
        }
      }
    }
  };

  const onSubmit = async (data) => {
    setErrorMsg('');

    const activeYtFiles = ytFiles.slice(0, proofRequiredCount);
    const activeIgFiles = igFiles.slice(0, proofRequiredCount);

    const firstMissingYtIdx = activeYtFiles.findIndex(f => !f);
    const firstMissingIgIdx = activeIgFiles.findIndex(f => !f);

    if (firstMissingYtIdx !== -1 || firstMissingIgIdx !== -1) {
      setErrorMsg(`Please upload screenshot proofs for Player 1 and Player 2.`);
      setShowUploadErrors(true);

      let elementToScroll = null;
      if (firstMissingYtIdx !== -1) {
        elementToScroll = document.getElementById(`yt-file-container-${firstMissingYtIdx}`);
      } else if (firstMissingIgIdx !== -1) {
        elementToScroll = document.getElementById(`ig-file-container-${firstMissingIgIdx}`);
      }

      if (elementToScroll) {
        elementToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {
      // Clean players array: only include first 4 always, add 5th only if fully filled
      let cleanPlayers = data.players.slice(0, 4);
      const p5 = data.players[4];
      if (p5 && p5.playerName?.trim() && p5.playerUID?.trim() && p5.role) {
        cleanPlayers.push(p5);
      }

      const formData = new FormData();
      formData.append('teamName', data.teamName);
      formData.append('teamLeaderName', data.teamLeaderName);
      formData.append('email', data.email);
      formData.append('players', JSON.stringify(cleanPlayers));

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
        localStorage.removeItem('shield_showdown_reg_data');
        reset({
          teamName: '',
          teamLeaderName: '',
          email: '',
          players: [
            { playerName: '', playerUID: '', role: '' },
            { playerName: '', playerUID: '', role: '' },
            { playerName: '', playerUID: '', role: '' },
            { playerName: '', playerUID: '', role: '' },
            { playerName: '', playerUID: '', role: '' }
          ],
          termsAccepted: false
        });
        setYtFiles([null, null, null, null, null]);
        setYtPreviews([null, null, null, null, null]);
        setIgFiles([null, null, null, null, null]);
        setIgPreviews([null, null, null, null, null]);
        setShowUploadErrors(false);
      }
    } catch (err) {
      console.error('Registration error:', err);
      const backendMsg = err.response?.data?.message;
      const networkErr = err.code === 'ERR_NETWORK' || err.message === 'Network Error';
      if (networkErr) {
        setErrorMsg('Network error: Cannot reach the server. Please check your internet connection and try again.');
      } else {
        setErrorMsg(backendMsg || `Server error (${err.response?.status || 'unknown'}). Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onInvalidSubmit = (errors) => {
    console.error("Form Validation Errors:", errors);
    setErrorMsg("Form submission failed. Please fill out all required fields (highlighted in red) and accept the terms.");
    scrollToFirstError(errors);
  };

  const isFormDisabled = timerConfig.isClosed || (timerConfig.isEnabled && isExpired);

  // Submit button active state rule
  const activeYtFiles = ytFiles.slice(0, proofRequiredCount);
  const activeIgFiles = igFiles.slice(0, proofRequiredCount);
  const isSubmitDisabled = loading || isFormDisabled;
  const allProofsUploaded = activeYtFiles.every(Boolean) && activeIgFiles.every(Boolean);



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
        <p className="text-gray-400 font-sans text-base md:text-lg mb-2">
          Registration Submitted Successfully. Glory Awaits Your Team!
        </p>


        <div className="bg-[#121214] border-2 border-gold/40 rounded-xl p-8 max-w-md mx-auto mb-10 shadow-gold-glow">
          <div className="text-xs uppercase tracking-widest text-gray-500 font-gaming mb-1">Your Registration ID</div>
          <div className="font-gaming font-black text-4xl text-gold-bright tracking-widest mb-4 glow-text">
            {successData.registrationId}
          </div>
          <div className="h-px bg-gold/20 w-3/4 mx-auto my-3" />
          <div className="text-sm text-gray-300 font-sans mb-4">
            Team: <span className="font-bold text-white font-gaming">{successData.teamName}</span>
          </div>
          <div className="p-3 bg-[#1e1a0f] border border-gold/25 text-gold-bright rounded-lg text-[11px] font-sans leading-relaxed text-center">
            <span className="font-gaming font-black tracking-wider block mb-1 text-gold-bright">⚠️ ACTION REQUIRED</span>
            Please screenshot this registration card and submit it in our Discord server for verification.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="https://discord.gg/MK7eQZayxd"
            className="px-8 py-3 bg-[#5865F2] hover:bg-[#4752C4] font-gaming text-white font-bold tracking-wider rounded transition-all duration-300 shadow-[0_0_15px_rgba(88,101,242,0.4)] transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.89-.65,1.76-1.34,2.58-2a75.58,75.58,0,0,0,72.9,0c.82.71,1.69,1.4,2.58,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.87,48.12,122.56,25.29,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.72,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96,53,91,65.69,84.69,65.69Z"/>
            </svg>
            Join Discord
          </a>

          <button
            onClick={() => {
              setSuccessData(null);
            }}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 font-gaming text-white font-bold tracking-wider rounded transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Register Another Team
          </button>
        </div>
      </div>
    );
  }

  // Duplicate logos dynamically to guarantee enough items exist for seamless scrolling marquee
  const getMarqueeItems = () => {
    if (invitedTeams.length === 0) return [];
    let items = [...invitedTeams];
    while (items.length < 15) {
      items = [...items, ...invitedTeams];
    }
    return [...items, ...items];
  };
  const marqueeItems = getMarqueeItems();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
      {/* Main Form Card */}
      <div className="w-full bg-[#060608]/75 backdrop-blur-md border-2 border-gold/40 rounded-xl overflow-hidden shadow-2xl">
        
        {/* HEADER SECTION (Banner Image Match) */}
        <div className="relative border-b border-gold/25 overflow-hidden">
          <img 
            src="/banner.png" 
            alt="The Shield Showdown Banner" 
            className="w-full h-auto block object-cover" 
          />
        </div>

        {/* TIMER BAR (If enabled) */}
        {timerConfig.isEnabled && (
          <div className="border-b border-gold/20 bg-black/40 p-5 font-sans relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-gaming font-bold text-xs text-gold-bright uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-bright" /> {timerConfig.title || 'Registration Closes In'}
              </h3>

              {isExpired || timerConfig.isClosed ? (
                <div className="px-4 py-1.5 bg-red-950/20 border border-red-500/30 rounded text-red-500 font-gaming font-black text-xs tracking-wider uppercase">
                  CLOSED
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid grid-cols-4 gap-2 text-center min-w-[220px]">
                    <div className="bg-[#121214] border border-gold/15 rounded p-2 min-w-[50px]">
                      <span className="block font-gaming font-black text-lg text-gold-bright leading-none">{timeLeft.days}</span>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500">Days</span>
                    </div>
                    <div className="bg-[#121214] border border-gold/15 rounded p-2 min-w-[50px]">
                      <span className="block font-gaming font-black text-lg text-gold-bright leading-none">{timeLeft.hours}</span>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500">Hours</span>
                    </div>
                    <div className="bg-[#121214] border border-gold/15 rounded p-2 min-w-[50px]">
                      <span className="block font-gaming font-black text-lg text-gold-bright leading-none">{timeLeft.minutes}</span>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500">Min</span>
                    </div>
                    <div className="bg-[#121214] border border-gold/15 rounded p-2 min-w-[50px]">
                      <span className="block font-gaming font-black text-lg text-gold-bright leading-none">{timeLeft.seconds}</span>
                      <span className="text-[7px] uppercase tracking-wider text-gray-500">Sec</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 font-sans font-mono whitespace-nowrap">
                    Deadline: {new Date(timerConfig.targetDate).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* INVITED TEAMS MARQUEE (If any exist) */}
        {invitedTeams.length > 0 && (
          <div className="border-b border-gold/20 bg-black/45 p-6 font-sans relative overflow-hidden">
            <h3 className="font-gaming font-black text-xs text-gold-bright uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-gold-bright animate-pulse" /> CHAMPIONS & INVITED TEAMS
            </h3>
            
            <div className="marquee-container">
              <div className="marquee-content">
                {marqueeItems.map((team, idx) => (
                  <div 
                    key={`${team.id}-${idx}`} 
                    className="flex-shrink-0 flex items-center justify-center bg-slate-950/60 border border-gold/20 rounded-xl p-3 w-28 h-20 shadow-[0_0_10px_rgba(212,175,55,0.05)] hover:border-gold-bright hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:scale-105 transition-all duration-300"
                  >
                    <img 
                      src={team.logoUrl} 
                      alt="Invited Team Logo" 
                      className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.15)]" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FORM FIELDS */}
        {isFormDisabled ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-8">
              {/* Glowing auras */}
              <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full scale-125 animate-pulse" />
              <div className="absolute inset-0 bg-gold/10 blur-2xl rounded-full scale-90" />
              
              {/* Inner golden shield/lock frame */}
              <div className="relative bg-[#0d0d0f]/90 border-2 border-gold/45 rounded-full p-8 shadow-2xl flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                <Shield className="w-20 h-20 text-gold-bright animate-pulse" strokeWidth={1} />
                <div className="absolute -bottom-1 -right-1 bg-red-650 border border-gold/50 rounded-full p-2.5 shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h2 className="font-gaming font-black text-3xl md:text-5xl text-white tracking-widest uppercase italic mb-3">
              REGISTRATION <span className="text-gold-bright">CLOSED</span>
            </h2>
            
            <div className="h-0.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent w-48 mx-auto mb-6" />
            
            {/* Message */}
            <p className="max-w-xl text-gray-400 font-sans text-sm md:text-base leading-relaxed mb-8">
              The battle lines are drawn and the arenas are set. Sign-ups for <span className="text-white font-semibold font-gaming tracking-wide">The Shield Showdown</span> have officially ended. We want to thank all of the competitive teams who stepped up to register!
            </p>

            {/* Info Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full mb-10 font-sans text-left">
              <div className="bg-[#121214]/60 border border-gold/15 rounded-xl p-5 hover:border-gold/30 transition-all duration-300">
                <h4 className="font-gaming font-bold text-xs text-gold-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold" /> Registered Teams
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  All submitted registrations are currently undergoing database verification. Verified team brackets will be published soon.
                </p>
              </div>
              <div className="bg-[#121214]/60 border border-gold/15 rounded-xl p-5 hover:border-gold/30 transition-all duration-300">
                <h4 className="font-gaming font-bold text-xs text-gold-bright uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold" /> Discord Verification
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  If you submitted your registration, please check your email and make sure your team leader has submitted verification in our Discord channel.
                </p>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md">
              <a
                href="https://discord.gg/MK7eQZayxd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 bg-gold-gradient hover:brightness-110 font-gaming text-black font-black text-xs uppercase tracking-widest rounded shadow-gold-glow hover:shadow-gold-glow-btn transition-all duration-300 text-center cursor-pointer font-bold"
              >
                Join Discord Server
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="p-6 md:p-10 space-y-10">
          
          {/* Expired Warning Banner */}
          {isFormDisabled && (
            <div className="bg-red-950/45 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center gap-3 font-sans text-sm shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" />
              <div className="flex-grow text-left">
                <span className="font-gaming font-black tracking-wider block text-white text-base mb-1">REGISTRATION HAS ENDED</span>
                <span>The tournament registration window has officially closed. Submissions are no longer accepted.</span>
              </div>
            </div>
          )}

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
                  disabled={isFormDisabled}
                  {...register('teamName', { required: 'Team Name is required' })}
                  placeholder={isFormDisabled ? 'Registration Closed' : 'Your answer'}
                  className={`w-full form-input ${errors.teamName ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
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
                  disabled={isFormDisabled}
                  {...register('teamLeaderName', { required: 'Team Leader Name is required' })}
                  placeholder={isFormDisabled ? 'Registration Closed' : 'Your answer'}
                  className={`w-full form-input ${errors.teamLeaderName ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
                />
                {errors.teamLeaderName && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.teamLeaderName.message}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  disabled={isFormDisabled}
                  {...register('email', { 
                    required: 'Email Address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder={isFormDisabled ? 'Registration Closed' : 'Your answer'}
                  className={`w-full form-input ${errors.email ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errors.email.message}
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
                        disabled={isFormDisabled}
                        {...register(`players.${index}.playerName`, { required: (index < 4 || isP5Active) ? 'Name In-Game is required' : false })}
                        placeholder={isFormDisabled ? 'Closed' : 'Your answer'}
                        className={`w-full form-input-sm ${errors.players?.[index]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
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
                        disabled={isFormDisabled}
                        {...register(`players.${index}.playerUID`, { 
                          required: (index < 4 || isP5Active) ? 'Player ID is required' : false,
                          pattern: {
                            value: (index < 4 || isP5Active) ? /^[0-9]+$/ : /^(|[0-9]+)$/,
                            message: 'Numbers only'
                          }
                        })}
                        placeholder={isFormDisabled ? 'Closed' : 'Your answer'}
                        className={`w-full form-input-sm ${errors.players?.[index]?.playerUID ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
                      />
                      {errors.players?.[index]?.playerUID && (
                        <p className="text-red-500 text-[10px] mt-1 font-sans">
                          {errors.players[index].playerUID.message || 'Required'}
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-[10px] uppercase font-gaming text-slate-300 mb-1 font-bold">
                        Player Role
                      </label>
                      <select
                        disabled={isFormDisabled}
                        {...register(`players.${index}.role`, { required: (index < 4 || isP5Active) ? 'Role is required' : false })}
                        className={`w-full form-input-sm cursor-pointer ${errors.players?.[index]?.role ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
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
              Your team must follow our YouTube and Instagram. Upload screenshots verifying follow/subscription for Player 1 and Player 2.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
              
              {/* YOUTUBE PROOF */}
              <div className="bg-[#0b0b0d] border border-gold/10 rounded-xl p-5 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-5 pb-3 border-b border-slate-850">
                    <div className="flex items-start gap-3">
                      {/* YouTube Icon */}
                      <div className="w-9 h-9 bg-[#FF0000] rounded flex items-center justify-center shrink-0 shadow">
                        <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555a3.002 3.002 0 0 0-2.11 2.108C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0-9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
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
                    {[...Array(proofRequiredCount)].map((_, idx) => {
                      const file = ytFiles[idx];
                      const preview = ytPreviews[idx];
                      const playerName = watch(`players.${idx}.playerName`) || "";
                      const playerRole = watch(`players.${idx}.role`) || "";
                      const isReady = watch(`players.${idx}.playerName`)?.trim() &&
                                      watch(`players.${idx}.playerUID`)?.trim() &&
                                      watch(`players.${idx}.role`);

                      return (
                        <div 
                          key={idx} 
                          id={`yt-file-container-${idx}`}
                          className={`bg-slate-900/40 border rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn transition-colors ${
                            showUploadErrors && !file
                              ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse'
                              : 'border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <User className="w-4 h-4 text-gold-bright shrink-0" />
                            <div className="flex-grow flex items-center gap-1.5">
                              <input
                                type="text"
                                disabled={isFormDisabled}
                                value={playerName}
                                onChange={(e) => setValue(`players.${idx}.playerName`, e.target.value, { shouldValidate: true })}
                                placeholder={isFormDisabled ? 'Closed' : `Player ${idx + 1} Name`}
                                className={`form-input-sm !py-1 !px-2 ${errors.players?.[idx]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
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
                                  disabled={isFormDisabled}
                                  onClick={() => removeSlotFile(idx, 'youtube')}
                                  className={`p-1 bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition-colors ${isFormDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded border transition-all ${
                                    isReady && !isFormDisabled
                                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-650 text-white cursor-pointer'
                                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-40 cursor-not-allowed pointer-events-none'
                                  }`}
                                >
                                  <Upload className="w-3 h-3" /> Upload
                                </label>
                                <input
                                  id={`yt-file-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlotFileChange(e, idx, 'youtube')}
                                  className="hidden"
                                  disabled={!isReady || isFormDisabled}
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
              <div className="bg-[#0b0b0d] border border-gold/10 rounded-xl p-5 flex flex-col justify-between shadow-lg">
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
                      href="https://www.instagram.com/jhuse164_?igsh=amE4NDVpcmRkanFl"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs font-bold text-white transition-all shadow shrink-0 cursor-pointer"
                    >
                      Follow Instagram <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Individual Upload Fields Grid */}
                  <div className="space-y-3">
                    {[...Array(proofRequiredCount)].map((_, idx) => {
                      const file = igFiles[idx];
                      const preview = igPreviews[idx];
                      const playerName = watch(`players.${idx}.playerName`) || "";
                      const playerRole = watch(`players.${idx}.role`) || "";
                      const isReady = watch(`players.${idx}.playerName`)?.trim() &&
                                      watch(`players.${idx}.playerUID`)?.trim() &&
                                      watch(`players.${idx}.role`);

                      return (
                        <div 
                          key={idx} 
                          id={`ig-file-container-${idx}`}
                          className={`bg-slate-900/40 border rounded-lg p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn transition-colors ${
                            showUploadErrors && !file
                              ? 'border-red-500/50 bg-red-950/10 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse'
                              : 'border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-grow min-w-0">
                            <User className="w-4 h-4 text-gold-bright shrink-0" />
                            <div className="flex-grow flex items-center gap-1.5">
                              <input
                                type="text"
                                disabled={isFormDisabled}
                                value={playerName}
                                onChange={(e) => setValue(`players.${idx}.playerName`, e.target.value, { shouldValidate: true })}
                                placeholder={isFormDisabled ? 'Closed' : `Player ${idx + 1} Name`}
                                className={`form-input-sm !py-1 !px-2 ${errors.players?.[idx]?.playerName ? '!border-red-500 focus:!ring-red-500/20' : ''} ${isFormDisabled ? 'opacity-50 cursor-not-allowed bg-slate-900/20 border-slate-800' : ''}`}
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
                                  disabled={isFormDisabled}
                                  onClick={() => removeSlotFile(idx, 'instagram')}
                                  className={`p-1 bg-red-600 hover:bg-red-500 text-white rounded cursor-pointer transition-colors ${isFormDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded border transition-all ${
                                    isReady && !isFormDisabled
                                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-650 text-white cursor-pointer'
                                      : 'bg-slate-900 border-slate-800 text-slate-500 opacity-40 cursor-not-allowed pointer-events-none'
                                  }`}
                                >
                                  <Upload className="w-3 h-3" /> Upload
                                </label>
                                <input
                                  id={`ig-file-${idx}`}
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleSlotFileChange(e, idx, 'instagram')}
                                  className="hidden"
                                  disabled={!isReady || isFormDisabled}
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

            <div id="terms-container" className="flex items-start gap-3 cursor-pointer select-none font-sans">
              <div className="relative flex items-center mt-1">
                <input
                  type="checkbox"
                  {...register('termsAccepted', { required: 'You must accept the terms and conditions' })}
                  className="sr-only peer"
                  id="terms-check"
                  disabled={isFormDisabled}
                />
                <label
                  htmlFor="terms-check"
                  className={`w-5 h-5 bg-[#0b0c10] border-2 rounded flex items-center justify-center transition-all ${
                    isFormDisabled ? 'border-slate-800 cursor-not-allowed opacity-55' : 'cursor-pointer'
                  } ${
                    watchTerms && !isFormDisabled ? 'border-[#FFD700] bg-black shadow-[0_0_10px_rgba(255,215,0,0.6)]' : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {watchTerms && !isFormDisabled && <Check className="w-3.5 h-3.5 text-[#FFD700] font-black stroke-[4]" />}
                </label>
              </div>
              <label htmlFor="terms-check" className={`text-xs md:text-sm transition-colors leading-relaxed ${
                isFormDisabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-gray-300 cursor-pointer'
              }`}>
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
            {!allProofsUploaded && !loading && !isFormDisabled && (
              <p className="text-gray-500 text-[10px] md:text-xs font-gaming uppercase tracking-wide text-center mb-4 leading-relaxed max-w-md animate-pulse">
                <span className="text-gold-bright font-black">Upload Proof Status:</span> YouTube ({activeYtFiles.filter(Boolean).length}/{proofRequiredCount}) &bull; Instagram ({activeIgFiles.filter(Boolean).length}/{proofRequiredCount})<br />
                <span className="text-red-400 text-[9px] lowercase">(please upload follow screenshots for Player 1 and Player 2 before submitting)</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full max-w-sm font-gaming font-black text-white uppercase text-sm md:text-base tracking-widest py-3 px-8 rounded transition-all duration-300 flex items-center justify-center gap-2 group ${
                isSubmitDisabled
                  ? 'bg-gray-750 text-gray-500 border border-gray-800 opacity-45 cursor-not-allowed'
                  : 'bg-gold-gradient hover:brightness-110 cursor-pointer transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  Submitting...
                </>
              ) : isFormDisabled ? (
                'REGISTRATION CLOSED'
              ) : (
                'SUBMIT'
              )}
            </button>
          </div>
          </form>
        )}
      </div>

      {/* Bottom widgets row */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* INSTRUCTIONS CARD */}
        <div className="bg-[#060608]/75 backdrop-blur-md border border-gold/20 rounded-xl p-6 shadow-2xl relative overflow-hidden font-sans">
          <h3 className="font-gaming font-bold text-xs text-white uppercase tracking-wider mb-4 border-b border-gold/10 pb-2">
            REGISTRATION GUIDE
          </h3>
          <ul className="text-xs text-gray-400 space-y-3 list-none pl-0">
            <li className="flex gap-2">
              <span className="text-gold-bright font-gaming font-black">01.</span>
              <span>Input your Team Name, Leader Name, Leader UID and Discord.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold-bright font-gaming font-black">02.</span>
              <span>Provide information for at least 4 squad members (Player 5 is optional).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold-bright font-gaming font-black">03.</span>
              <span>Upload social screenshots verifying subscription/follows for each player.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-gold-bright font-gaming font-black">04.</span>
              <span>Check "Agree" to the terms, click Submit and wait for redirect.</span>
            </li>
          </ul>
        </div>

        {/* JOIN DISCORD CARD */}
        <div className="bg-[#060608]/75 backdrop-blur-md border border-gold/20 rounded-xl p-6 shadow-2xl text-center flex flex-col justify-between relative overflow-hidden font-sans">
          <div>
            <h4 className="font-gaming font-black text-xs text-gold-bright uppercase tracking-wider mb-2">
              GLORY AWAITS
            </h4>
            <p className="text-[11px] text-gray-400 mb-4 font-sans leading-relaxed">
              Need support or have tournament questions? Connect with our administration team directly.
            </p>
          </div>
          <a
            href="https://discord.gg/MK7eQZayxd"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#D4AF37] hover:bg-[#FFD700] font-gaming text-white font-bold text-xs tracking-wider rounded transition-all cursor-pointer shadow-md"
          >
            Join Discord Community
          </a>
        </div>
      </div>
    </div>
  );
}
