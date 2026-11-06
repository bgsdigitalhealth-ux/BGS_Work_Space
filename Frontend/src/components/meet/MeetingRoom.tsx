import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, PhoneOff, Share2, Copy, Check, 
  Users, ShieldAlert, AlertCircle, RefreshCw, MonitorUp, 
  Lock, Video as VideoIcon, ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';
import { VideoMeeting } from '../../types';

interface Props {
  meetingId: string;
  onLeave?: () => void;
}

interface PeerConnectionItem {
  socketId: string;
  user: any;
  pc: RTCPeerConnection;
  stream?: MediaStream;
}

export const MeetingRoom: React.FC<Props> = ({ meetingId, onLeave }) => {
  const { currentUser, login } = useApp();
  const socket = getSocket();

  // Authentication & Verification State
  const [authStatus, setAuthStatus] = useState<'verifying' | 'unauthorized' | 'authorized' | 'not_logged_in'>('verifying');
  const [deniedReason, setDeniedReason] = useState<string>('');
  const [meeting, setMeeting] = useState<VideoMeeting | null>(null);

  // In-meeting State
  const [callState, setCallState] = useState<'lobby' | 'connecting' | 'connected' | 'ended'>('lobby');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Streams & WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<{ [socketId: string]: { user: any; stream: MediaStream } }>({});

  // Inline Login fallback for guests / unauthenticated users
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const lobbyVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [socketId: string]: PeerConnectionItem }>({});
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // 1. Initialize & Verify Meeting Membership
  const verifyAccess = useCallback(async () => {
    if (!currentUser) {
      setAuthStatus('not_logged_in');
      return;
    }

    setAuthStatus('verifying');
    try {
      const res = await api.verifyMeetingAccess(
        meetingId, 
        currentUser.id, 
        currentUser.email, 
        currentUser.role
      );

      if (res.allowed && res.meeting) {
        setMeeting(res.meeting);
        setAuthStatus('authorized');

        // Fetch coturn & STUN ICE servers for WebRTC
        try {
          const creds = await api.getTurnCredentials(currentUser.id);
          if (creds && creds.iceServers) {
            iceServersRef.current = creds.iceServers;
          }
        } catch (e) {
          console.warn('[MeetingRoom] Could not load TURN credentials, fallback to public STUN');
        }
      } else {
        setAuthStatus('unauthorized');
        setDeniedReason(res.reason || 'You are not an authorized participant in this private meeting.');
      }
    } catch (err: any) {
      setAuthStatus('unauthorized');
      setDeniedReason(err.message || 'Verification failed. Please check your network.');
    }
  }, [meetingId, currentUser]);

  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  // 2. Camera & Microphone Setup for Lobby
  useEffect(() => {
    let active = true;

    if (authStatus === 'authorized' && callState === 'lobby') {
      navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn('[Media] Camera/Mic access denied or unavailable:', err.message);
      });
    }

    return () => {
      active = false;
    };
  }, [authStatus, callState]);

  // Sync video element when localStream changes
  useEffect(() => {
    if (callState === 'connected' && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [callState, localStream]);

  // 3. WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((targetSocketId: string, targetUser: any, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    const pendingIceCandidates: RTCIceCandidateInit[] = [];
    let hasRemoteDescription = false;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_signal', {
          meetingId,
          targetSocketId,
          signal: { candidate: event.candidate.toJSON() },
          senderUser: {
            id: currentUser?.id,
            email: currentUser?.email,
            name: currentUser?.name,
            role: currentUser?.role
          }
        });
      }
    };

    // Remote stream track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        peersRef.current[targetSocketId] = {
          ...peersRef.current[targetSocketId],
          stream: remoteStream
        };
        setRemotePeers(prev => ({
          ...prev,
          [targetSocketId]: {
            user: targetUser,
            stream: remoteStream
          }
        }));
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(targetSocketId);
      }
    };

    peersRef.current[targetSocketId] = {
      socketId: targetSocketId,
      user: targetUser,
      pc
    };

    // If initiator, create and send offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          if (socket) {
            socket.emit('webrtc_signal', {
              meetingId,
              targetSocketId,
              signal: { sdp: pc.localDescription },
              senderUser: {
                id: currentUser?.id,
                email: currentUser?.email,
                name: currentUser?.name,
                role: currentUser?.role
              }
            });
          }
        })
        .catch(err => console.error('[WebRTC] Create offer error:', err));
    }

    return { pc, pendingIceCandidates, getHasRemoteDesc: () => hasRemoteDescription, setHasRemoteDesc: (v: boolean) => { hasRemoteDescription = v; } };
  }, [meetingId, socket, currentUser]);

  const removePeer = useCallback((socketId: string) => {
    if (peersRef.current[socketId]) {
      try {
        peersRef.current[socketId].pc.close();
      } catch (e) {}
      delete peersRef.current[socketId];
    }
    setRemotePeers(prev => {
      const copy = { ...prev };
      delete copy[socketId];
      return copy;
    });
  }, []);

  // 4. Socket.IO Signaling Listener
  useEffect(() => {
    if (!socket || callState !== 'connected') return;

    // Handle incoming WebRTC signals
    const handleSignal = async ({ senderSocketId, signal, senderUser }: any) => {
      let peerItem = peersRef.current[senderSocketId];

      if (!peerItem) {
        createPeerConnection(senderSocketId, senderUser, false);
        peerItem = peersRef.current[senderSocketId];
      }

      const pc = peerItem?.pc;
      if (!pc) return;

      try {
        if (signal.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          if (signal.sdp.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc_signal', {
              meetingId,
              targetSocketId: senderSocketId,
              signal: { sdp: pc.localDescription },
              senderUser: {
                id: currentUser?.id,
                email: currentUser?.email,
                name: currentUser?.name,
                role: currentUser?.role
              }
            });
          }
        } else if (signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('[WebRTC] Error adding ICE candidate:', e);
          }
        }
      } catch (err: any) {
        console.error('[WebRTC] Signal handling error:', err.message);
      }
    };

    // When a new user joins the meeting
    const handleUserJoined = ({ socketId, user }: any) => {
      // Connect to the new peer by creating an offer
      createPeerConnection(socketId, user, true);
    };

    // When a user leaves
    const handleUserLeft = ({ socketId }: any) => {
      removePeer(socketId);
    };

    socket.on('webrtc_signal', handleSignal);
    socket.on('user_joined_meeting', handleUserJoined);
    socket.on('user_left_meeting', handleUserLeft);

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('user_joined_meeting', handleUserJoined);
      socket.off('user_left_meeting', handleUserLeft);
    };
  }, [socket, callState, meetingId, currentUser, createPeerConnection, removePeer]);

  // 5. Timer for Call Duration
  useEffect(() => {
    let timer: any = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  // 6. Action Handlers
  const handleJoinCall = async () => {
    if (!socket || !currentUser) return;
    setCallState('connecting');

    socket.emit('join_meeting', {
      meetingId,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role
      }
    }, (res: any) => {
      if (res && res.success) {
        setCallState('connected');

        // Connect to any peers already present in the room
        if (Array.isArray(res.existingPeers)) {
          res.existingPeers.forEach((p: any) => {
            if (p.socketId && p.socketId !== socket.id) {
              createPeerConnection(p.socketId, p.user, true);
            }
          });
        }
      } else {
        alert(res?.error || 'Unable to join meeting.');
        setCallState('lobby');
      }
    });
  };

  const handleLeaveCall = () => {
    if (socket) {
      socket.emit('leave_meeting', { meetingId });
    }

    // Close all peer connections
    Object.keys(peersRef.current).forEach(id => {
      try {
        peersRef.current[id].pc.close();
      } catch (e) {}
    });
    peersRef.current = {};
    setRemotePeers({});

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setCallState('ended');
    if (onLeave) {
      onLeave();
    } else {
      window.location.href = '/';
    }
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach(t => { t.enabled = nextState; });
        setIsMicOn(nextState);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach(t => { t.enabled = nextState; });
        setIsVideoOn(nextState);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace track on all peer connections
        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          stopScreenShare();
        };

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } catch (err: any) {
        console.warn('Screen share canceled or failed:', err.message);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const copyMeetingLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Render: 1. Loading / Verification in progress
  // -------------------------------------------------------------
  if (authStatus === 'verifying') {
    return (
      <div className="min-h-screen bg-[#0e1612] flex flex-col items-center justify-center text-white p-4">
        <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-emerald-100">Verifying Meeting Authorization...</h2>
        <p className="text-sm text-gray-400 mt-2">Connecting to the private secure meeting room</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 2. Not Logged In Screen (Direct Sign-In)
  // -------------------------------------------------------------
  if (authStatus === 'not_logged_in') {
    return (
      <div className="min-h-screen bg-[#0d1410] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#16211b] border border-[#2b3d32] rounded-3xl p-8 shadow-2xl text-white">
          <div className="w-12 h-12 rounded-2xl bg-emerald-900/40 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-700/40">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-emerald-100">Private Meeting</h2>
          <p className="text-xs text-gray-400 mt-1 mb-6">
            This meeting is private. Please sign in with your registered account to verify your participant status.
          </p>

          {loginError && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              setLoginError('');
              try {
                const res = await login(loginEmail, loginPassword);
                if (!res.success) {
                  setLoginError(res.error || 'Invalid credentials.');
                }
              } catch (err: any) {
                setLoginError(err.message || 'Invalid credentials.');
              } finally {
                setIsLoggingIn(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Registered Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0f1712] border border-[#2d4234] text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0f1712] border border-[#2d4234] text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Signing In & Verifying...' : 'Sign In to Join Meeting'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#233328] text-center">
            <a href="/" className="text-xs text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 3. Access Denied (Unauthorized Participant)
  // -------------------------------------------------------------
  if (authStatus === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#0e1612] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#18231d] border border-red-900/40 rounded-3xl p-8 shadow-2xl text-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-red-200">Access Denied</h2>
          <p className="text-xs text-gray-300 mt-2 mb-6 leading-relaxed">
            {deniedReason || 'This video meeting is strictly restricted to authorized participants. You do not have permission to join.'}
          </p>

          <div className="p-4 rounded-2xl bg-[#111a14] border border-[#25352a] text-left text-xs mb-6 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Meeting ID:</span>
              <span className="font-mono text-emerald-400">{meetingId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Signed in as:</span>
              <span className="text-gray-200 truncate max-w-[200px]">{currentUser?.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="flex-1 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => verifyAccess()}
              className="px-4 py-2.5 rounded-xl border border-emerald-600/40 hover:bg-emerald-950/30 text-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 4. Pre-Join Lobby (Camera Preview + Join Button)
  // -------------------------------------------------------------
  if (callState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0c1510] via-[#101b15] to-[#0a110d] text-white flex flex-col">
        {/* Top Navbar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-[#213327]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <VideoIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold font-serif tracking-tight text-white">WorkHub Video Meeting</h1>
              <p className="text-[11px] text-gray-400 font-mono">ID: {meetingId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyMeetingLink}
              className="px-3 py-1.5 rounded-lg bg-[#18261e] hover:bg-[#203328] border border-[#2b4032] text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied Link' : 'Copy Join Link'}
            </button>
          </div>
        </header>

        {/* Center Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Camera Preview Window */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full aspect-video rounded-3xl bg-[#131d16] border border-[#26382c] overflow-hidden relative shadow-2xl flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={lobbyVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center p-6">
                    <div className="w-24 h-24 rounded-full bg-emerald-950/80 border-2 border-emerald-600/40 text-emerald-300 font-serif font-bold text-3xl flex items-center justify-center mb-3 shadow-inner">
                      {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-300">{currentUser?.name}</span>
                    <span className="text-xs text-gray-500">Camera is turned off</span>
                  </div>
                )}

                {/* Overlaid Device Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      isMicOn ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      isVideoOn ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                    }`}
                    title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {isVideoOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Check your camera and microphone before entering the meeting.
              </p>
            </div>

            {/* Right: Meeting Information & Join Action */}
            <div className="lg:col-span-5 bg-[#141f17] border border-[#283b2f] rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-700/40 text-emerald-400 text-xs font-medium mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {meeting?.type === 'one-to-many' ? 'Group Meeting' : 'Private 1-on-1 Call'}
              </div>

              <h2 className="text-2xl font-bold font-serif text-white tracking-tight mb-2">
                {meeting?.title || 'Scheduled Video Meeting'}
              </h2>
              {meeting?.purpose && (
                <p className="text-xs text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                  {meeting.purpose}
                </p>
              )}

              <div className="space-y-3 py-4 border-y border-[#26382c] text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Host (Sender):</span>
                  <span className="font-semibold text-gray-200">{meeting?.senderName || 'Dean Office'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Invitee:</span>
                  <span className="font-semibold text-gray-200">{meeting?.receiverName || 'Participant'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Scheduled Date:</span>
                  <span className="text-gray-200">{meeting?.date} at {meeting?.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-emerald-400 font-semibold">{meeting?.status || 'Scheduled'}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleJoinCall}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-xl shadow-emerald-950/60 cursor-pointer flex items-center justify-center gap-2"
                >
                  <VideoIcon className="w-4 h-4" /> Join Call Now
                </button>

                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="w-full py-2.5 rounded-xl border border-[#2b4032] hover:bg-[#1a2920] text-gray-300 text-xs font-medium transition-all cursor-pointer"
                >
                  Cancel & Return
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 5. Connecting State
  // -------------------------------------------------------------
  if (callState === 'connecting') {
    return (
      <div className="min-h-screen bg-[#0d1510] flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold font-serif text-white">Connecting to Call...</h2>
        <p className="text-xs text-gray-400 mt-1">Establishing peer-to-peer WebRTC media channel</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 6. Active In-Call Video Room
  // -------------------------------------------------------------
  const remoteSocketIds = Object.keys(remotePeers);
  const peerCount = remoteSocketIds.length;

  return (
    <div className="min-h-screen bg-[#080d0a] text-white flex flex-col overflow-hidden select-none">
      
      {/* Top Header Bar */}
      <header className="px-6 py-3.5 flex items-center justify-between bg-[#0e1612]/90 backdrop-blur-md border-b border-[#1c2b21] z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <VideoIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">{meeting?.title || 'Meeting'}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/40 text-[10px] text-emerald-400 font-mono">
                {formatTime(callDuration)}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">ID: {meetingId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131d16] border border-[#213327] text-xs text-gray-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{peerCount + 1} Participant{peerCount > 0 ? 's' : ''}</span>
          </div>

          <button
            onClick={copyMeetingLink}
            className="px-3 py-1.5 rounded-xl bg-[#131d16] hover:bg-[#1a2820] border border-[#213327] text-xs text-gray-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share Link'}</span>
          </button>
        </div>
      </header>

      {/* Main Video Area */}
      <main className="flex-1 relative p-4 flex items-center justify-center overflow-hidden">
        
        {peerCount === 0 ? (
          /* Waiting for other participant to join */
          <div className="w-full h-full max-w-5xl relative rounded-3xl overflow-hidden bg-[#101913] border border-[#203125] flex flex-col items-center justify-center">
            {/* Full Screen Local Video while alone */}
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-emerald-950/80 border-2 border-emerald-600/40 text-emerald-300 font-serif font-bold text-4xl flex items-center justify-center mb-4 shadow-xl">
                {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Waiting Overlay Badge */}
            <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-medium text-amber-200">
                Waiting for {meeting?.receiverName || 'participant'} to join...
              </span>
            </div>

            <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs text-gray-300 flex items-center gap-1.5">
              <span>You ({currentUser?.name})</span>
              {!isMicOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
            </div>
          </div>
        ) : peerCount === 1 ? (
          /* 1-on-1 Call Layout: Large Remote Video + PiP Local Video */
          <div className="w-full h-full max-w-6xl relative rounded-3xl overflow-hidden bg-[#101913] border border-[#203125] flex items-center justify-center">
            {/* Remote Participant Video */}
            {remoteSocketIds.map((sId) => {
              const peer = remotePeers[sId];
              return (
                <div key={sId} className="w-full h-full relative">
                  <RemoteVideoElement stream={peer.stream} />
                  <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-white font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{peer.user?.name || peer.user?.email || 'Remote Participant'}</span>
                  </div>
                </div>
              );
            })}

            {/* Picture-in-Picture Local Video (Bottom Right) */}
            <div className="absolute bottom-6 right-6 w-48 sm:w-64 aspect-video rounded-2xl overflow-hidden bg-[#152219] border-2 border-white/20 shadow-2xl z-10">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#152219]">
                  <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 font-bold flex items-center justify-center text-sm mb-1">
                    {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[10px] text-gray-400">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-gray-200 flex items-center gap-1">
                <span>You</span>
                {!isMicOn && <MicOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </div>
        ) : (
          /* Group Call Layout (One-to-Many Grid) */
          <div className="w-full h-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto p-2">
            {/* Local Video Card */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-[#131d16] border border-[#25382b] relative shadow-lg">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-300 font-bold text-xl flex items-center justify-center mb-2">
                    {(currentUser?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs text-gray-400">You (Camera Off)</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-gray-200 flex items-center gap-1.5">
                <span>You</span>
                {!isMicOn && <MicOff className="w-3.5 h-3.5 text-red-400" />}
              </div>
            </div>

            {/* Remote Peers Cards */}
            {remoteSocketIds.map((sId) => {
              const peer = remotePeers[sId];
              return (
                <div key={sId} className="aspect-video rounded-2xl overflow-hidden bg-[#131d16] border border-[#25382b] relative shadow-lg">
                  <RemoteVideoElement stream={peer.stream} />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs text-white font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{peer.user?.name || peer.user?.email || 'Participant'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Bottom Floating Call Controls */}
      <footer className="py-4 px-6 flex items-center justify-center bg-[#0d1611]/90 backdrop-blur-md border-t border-[#1d2d22] z-20">
        <div className="flex items-center gap-3 sm:gap-4 bg-[#141f17] px-6 py-2.5 rounded-2xl border border-[#293d30] shadow-2xl">
          
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-xl transition-all cursor-pointer ${
              isMicOn ? 'bg-[#1e2e23] hover:bg-[#283e2f] text-gray-200' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
            title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-xl transition-all cursor-pointer ${
              isVideoOn ? 'bg-[#1e2e23] hover:bg-[#283e2f] text-gray-200' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
            title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-xl transition-all cursor-pointer hidden sm:flex ${
              isScreenSharing ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-[#1e2e23] hover:bg-[#283e2f] text-gray-200'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="w-px h-7 bg-[#2b3f32] my-auto" />

          {/* Leave Call Button */}
          <button
            onClick={handleLeaveCall}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-950/50 cursor-pointer"
            title="Leave Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Call</span>
          </button>

        </div>
      </footer>

    </div>
  );
};

// Sub-component to attach remote stream to video element
const RemoteVideoElement: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full object-cover"
    />
  );
};
