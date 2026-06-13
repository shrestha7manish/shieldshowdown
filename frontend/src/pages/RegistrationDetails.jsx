import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageModal from '../components/ImageModal';
import { ArrowLeft, Users, Shield, Award, Camera, ShieldAlert, Phone, User, Calendar, ZoomIn, Download } from 'lucide-react';

export default function RegistrationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Image viewer states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  const API_BASE_URL = 'http://localhost:5000/api';
  const IMAGE_BASE_URL = 'http://localhost:5000/uploads';

  const getImageUrl = (proof) => {
    if (proof && (proof.startsWith('http://') || proof.startsWith('https://'))) {
      return proof;
    }
    return `${IMAGE_BASE_URL}/${proof}`;
  };

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  const fetchRegistrationDetails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/registrations/${id}`);
      setRegistration(response.data);
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to load registration details.');
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (filename, title) => {
    setModalImageSrc(getImageUrl(filename));
    setModalTitle(title);
    setModalOpen(true);
  };

  const handleDownload = async (filename, title) => {
    try {
      const imageUrl = getImageUrl(filename);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-proof.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(getImageUrl(filename), '_blank');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-4 border-gold/30 border-t-gold-bright rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-gaming text-sm">Loading Registration Data...</p>
      </div>
    );
  }

  if (errorMsg || !registration) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-red-400">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="font-semibold text-lg mb-4">{errorMsg || 'Registration details not found.'}</p>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A1A1E] hover:bg-gold/10 text-white border border-gold/20 rounded font-gaming text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded font-gaming text-xs md:text-sm transition-all cursor-pointer shadow-md font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-gaming text-gold-bright tracking-widest block mb-1">
            Tournament Sign-up File
          </span>
          <span className="font-gaming font-black text-2xl text-white tracking-widest block glow-text">
            {registration.registrationId}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TEAM DETAILS & PLAYERS SHEET (Left 2 Columns) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Team Details Card */}
          <div className="bg-dark-card border border-gold/20 rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
            <h2 className="font-gaming font-bold text-lg text-gold-bright uppercase tracking-wider mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Team Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
              <div className="bg-[#0d0d0f] border border-gold/5 rounded-lg p-4">
                <span className="block text-xs text-gray-500 uppercase font-gaming tracking-wider mb-1">Team Name</span>
                <span className="text-white text-lg font-bold font-gaming">{registration.teamName}</span>
              </div>

              <div className="bg-[#0d0d0f] border border-gold/5 rounded-lg p-4">
                <span className="block text-xs text-gray-500 uppercase font-gaming tracking-wider mb-1">Discord Contact</span>
                <span className="text-gold-bright text-lg font-bold font-sans flex items-center gap-1.5">
                  {registration.discordUsername}
                </span>
              </div>

              <div className="bg-[#0d0d0f] border border-gold/5 rounded-lg p-4">
                <span className="block text-xs text-gray-500 uppercase font-gaming tracking-wider mb-1">Team Leader</span>
                <span className="text-white text-lg font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-gray-400" /> {registration.teamLeaderName}
                </span>
              </div>

              <div className="bg-[#0d0d0f] border border-gold/5 rounded-lg p-4">
                <span className="block text-xs text-gray-500 uppercase font-gaming tracking-wider mb-1">Leader Free Fire UID</span>
                <span className="text-white text-lg font-bold font-mono">{registration.teamLeaderUID}</span>
              </div>

              <div className="bg-[#0d0d0f] border border-gold/5 rounded-lg p-4 sm:col-span-2 flex items-center justify-between text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Registered on: {new Date(registration.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Players Table Card */}
          <div className="bg-dark-card border border-gold/20 rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
            <h2 className="font-gaming font-bold text-lg text-gold-bright uppercase tracking-wider mb-6 flex items-center gap-2">
              <Award className="w-5 h-5" /> Squad Roster
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/55 border-b border-gold/15 text-xs font-gaming text-gold-bright uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Slot</th>
                    <th className="py-3.5 px-4 font-bold">In-Game Name</th>
                    <th className="py-3.5 px-4 font-bold">Player UID</th>
                    <th className="py-3.5 px-4 font-bold">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5 text-sm">
                  {registration.players.map((player, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#1A1A1E]/30 transition-colors ${idx === 0 ? 'bg-gold/5' : ''}`}
                    >
                      <td className="py-3.5 px-4 font-gaming text-gray-400 font-bold">
                        {idx === 0 ? (
                          <span className="bg-gold-gradient text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                            IGL
                          </span>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        {player.playerName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono">{player.playerUID}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-[#1A1A1E] text-gold font-gaming text-xs font-bold tracking-wider rounded border border-gold/15">
                          {player.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SOCIAL MEDIA SCREENSHOT PROOFS (Right 1 Column) */}
        <div className="space-y-8">
          <div className="bg-dark-card border border-gold/20 rounded-xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-gold h-full" />
            <h2 className="font-gaming font-bold text-lg text-gold-bright uppercase tracking-wider mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5" /> Social Follow Proofs
            </h2>

            <div className="space-y-8">
              {/* YouTube Card Gallery */}
              <div className="bg-[#0d0d0f] border border-gold/10 rounded-xl p-4 space-y-4">
                <span className="font-gaming font-bold text-xs text-white uppercase tracking-wider block border-b border-gold/5 pb-2">
                  YouTube Follow Proofs ({registration.youtubeProofs?.length || 0})
                </span>

                <div className="grid grid-cols-1 gap-4">
                  {registration.youtubeProofs?.map((proof, idx) => (
                    <div key={idx} className="bg-[#121214] border border-gold/5 rounded-lg p-2.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-gaming font-bold text-gold-bright">Member #{idx + 1} Proof</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openImageModal(proof, `${registration.teamName} YouTube Proof #${idx + 1}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded transition-colors cursor-pointer"
                            title="Zoom View"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(proof, `${registration.teamName} YouTube #${idx + 1}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded transition-colors cursor-pointer"
                            title="Download Screenshot"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div
                        onClick={() => openImageModal(proof, `${registration.teamName} YouTube Proof #${idx + 1}`)}
                        className="relative group aspect-video rounded overflow-hidden border border-gold/10 bg-black flex items-center justify-center cursor-zoom-in"
                      >
                        <img
                          src={getImageUrl(proof)}
                          alt={`YouTube Proof ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] font-gaming font-bold flex items-center gap-1 bg-black/90 px-3 py-1.5 border border-gold/25 rounded shadow">
                            <ZoomIn className="w-3.5 h-3.5 text-gold-bright" /> Zoom
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instagram Card Gallery */}
              <div className="bg-[#0d0d0f] border border-gold/10 rounded-xl p-4 space-y-4">
                <span className="font-gaming font-bold text-xs text-white uppercase tracking-wider block border-b border-gold/5 pb-2">
                  Instagram Follow Proofs ({registration.instagramProofs?.length || 0})
                </span>

                <div className="grid grid-cols-1 gap-4">
                  {registration.instagramProofs?.map((proof, idx) => (
                    <div key={idx} className="bg-[#121214] border border-gold/5 rounded-lg p-2.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-gaming font-bold text-gold-bright">Member #{idx + 1} Proof</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openImageModal(proof, `${registration.teamName} Instagram Proof #${idx + 1}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded transition-colors cursor-pointer"
                            title="Zoom View"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(proof, `${registration.teamName} Instagram #${idx + 1}`)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded transition-colors cursor-pointer"
                            title="Download Screenshot"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div
                        onClick={() => openImageModal(proof, `${registration.teamName} Instagram Proof #${idx + 1}`)}
                        className="relative group aspect-video rounded overflow-hidden border border-gold/10 bg-black flex items-center justify-center cursor-zoom-in"
                      >
                        <img
                          src={getImageUrl(proof)}
                          alt={`Instagram Proof ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-white text-[10px] font-gaming font-bold flex items-center gap-1 bg-black/90 px-3 py-1.5 border border-gold/25 rounded shadow">
                            <ZoomIn className="w-3.5 h-3.5 text-gold-bright" /> Zoom
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN ZOOM/PAN MODAL */}
      <ImageModal
        isOpen={modalOpen}
        src={modalImageSrc}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
