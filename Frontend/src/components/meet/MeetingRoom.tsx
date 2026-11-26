import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera, CameraOff, Mic, MicOff, PhoneOff, Copy, Check,
  Users, ShieldAlert, MonitorUp, Video as VideoIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getSocket } from '../../services/socket';
import { api } from '../../services/api';

interface Props {
  meetingId: string;
  initialMeeting?: any;
  onLeave?: () => void;
}

interface PeerConnectionItem {
  socketId: string;
  user: any;
  pc: RTCPeerConnection;
  stream?: MediaStream;
}

interface PopupNotice {
  id: string;
  text: string;
  type: 'join' | 'leave' | 'info';
}

export const MeetingRoom: React.FC<Props> = ({ meetingId, initialMeeting, onLeave }) => {
  const { currentUser } = useApp();
  const socket = getSocket();

  // Authentication & Verification State
  const [authStatus, setAuthStatus] = useState<'verifying' | 'unauthorized' | 'authorized' | 'not_logged_in'>('verifying');
  const [deniedReason, setDeniedReason] = useState<string>('');
  const [meeting, setMeeting] = useState<any>(initialMeeting || null);

  // In-meeting Call States: auto-connect straight into call
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Notifications popup inside meeting
  const [popupNotices, setPopupNotices] = useState<PopupNotice[]>([]);

  // Streams & WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<{ [socketId: string]: { user: any; stream: MediaStream } }>({});
  const [presenterInfo, setPresenterInfo] = useState<{ name: string; isSelf: boolean } | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [socketId: string]: PeerConnectionItem }>({});
  const iceServersRef = useRef<RTCIceServer[]>([
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }
  ]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const addNotice = useCallback((text: string, type: 'join' | 'leave' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setPopupNotices(prev => [...prev.slice(-3), { id, text, type }]);
    setTimeout(() => {
      setPopupNotices(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  // 1. Initialize & Verify Meeting Membership
  const verifyAccess = useCallback(async () => {
    if (!currentUser) {
      setAuthStatus('not_logged_in');
      return;
    }

    if (initialMeeting) {
      setMeeting(initialMeeting);
      setAuthStatus('authorized');
    }

    try {
      const res = await api.verifyMeetingAccess(
        meetingId,
        currentUser.id,
        currentUser.email,
        currentUser.role
      );

      if (res.allowed) {
        if (res.meeting) setMeeting(res.meeting);
        setAuthStatus('authorized');

        // Fetch coturn & STUN ICE servers for WebRTC
        try {
          const creds = await api.getTurnCredentials(currentUser.id);
          if (creds && creds.iceServers) {
            iceServersRef.current = creds.iceServers;
          }
        } catch (e) {
          console.warn('[MeetingRoom] Using public STUN fallback');
        }
      } else if (!initialMeeting) {
        setAuthStatus('unauthorized');
        setDeniedReason(res.reason || 'You are not authorized to join this private meeting.');
      }
    } catch (err: any) {
      if (!initialMeeting) {
        setAuthStatus('unauthorized');
        setDeniedReason(err.message || 'Verification failed. Please check network.');
      } else {
        setAuthStatus('authorized');
      }
    }
  }, [meetingId, currentUser, initialMeeting]);

  useEffect(() => {
    verifyAccess();
  }, [verifyAccess]);

  // 2. Camera & Microphone Setup & Auto-Join Call
  useEffect(() => {
    let active = true;

    if (authStatus === 'authorized') {
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

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          // Automatically connect to the call
          if (socket && currentUser) {
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
                addNotice('You joined the meeting', 'join');

                // Connect to existing peers (strictly excluding self)
                if (Array.isArray(res.existingPeers)) {
                  res.existingPeers.forEach((p: any) => {
                    const myEmail = (currentUser.email || '').toLowerCase().trim();
                    const myId = String(currentUser.id || '').trim();
                    const pEmail = (p.user?.email || '').toLowerCase().trim();
                    const pId = String(p.user?.id || '').trim();

                    if (p.socketId && p.socketId !== socket.id && pId !== myId && pEmail !== myEmail) {
                      createPeerConnection(p.socketId, p.user, true);
                    }
                  });
                }
              } else {
                setCallState('connected');
              }
            });
          }
        })
        .catch((err) => {
          console.warn('[Media] Camera/Mic access denied or unavailable:', err.message);
          // If no webcam available, connect audio-only or view-only
          setIsVideoOn(false);
          setCallState('connected');
          if (socket && currentUser) {
            socket.emit('join_meeting', {
              meetingId,
              user: {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role
              }
            }, (res: any) => {
              if (res && res.success && Array.isArray(res.existingPeers)) {
                res.existingPeers.forEach((p: any) => {
                  if (p.socketId && p.socketId !== socket.id) {
                    createPeerConnection(p.socketId, p.user, true);
                  }
                });
              }
            });
          }
        });
    }

    return () => {
      active = false;
    };
  }, [authStatus]);

  // Sync video element when localStream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Sync screen video element when screenStream changes
  useEffect(() => {
    if (localScreenVideoRef.current && screenStream) {
      localScreenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream, isScreenSharing]);

  // 3. WebRTC Peer Connection Helper
  const createPeerConnection = useCallback((targetSocketId: string, targetUser: any, isInitiator: boolean) => {
    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    // Add local tracks (camera or screen) to peer connection
    const currentActiveStream = screenStreamRef.current || localStreamRef.current;
    if (currentActiveStream) {
      currentActiveStream.getTracks().forEach(track => {
        pc.addTrack(track, currentActiveStream);
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

        // Deduplicate: ensure only 1 tile per unique user ID/email
        const tEmail = (targetUser?.email || '').toLowerCase().trim();
        const tId = String(targetUser?.id || '').trim();

        setRemotePeers(prev => {
          const updated = { ...prev };
          // Remove any stale key for this same user
          Object.keys(updated).forEach(sId => {
            const u = updated[sId].user;
            if ((tId && String(u?.id) === tId) || (tEmail && (u?.email || '').toLowerCase() === tEmail)) {
              delete updated[sId];
            }
          });
          updated[targetSocketId] = {
            user: targetUser,
            stream: remoteStream
          };
          return updated;
        });
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

    return pc;
  }, [meetingId, socket, currentUser]);

  const removePeer = useCallback((socketId: string) => {
    if (peersRef.current[socketId]) {
      try {
        peersRef.current[socketId].pc.close();
      } catch (e) { }
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
      // Check for screen share broadcast signals
      if (signal?.type === 'screen_share_start') {
        setPresenterInfo({ name: signal.presenterName || senderUser?.name || 'Participant', isSelf: false });
        addNotice(`${signal.presenterName || 'Participant'} started screen sharing`, 'info');
        return;
      }
      if (signal?.type === 'screen_share_stop') {
        setPresenterInfo(null);
        addNotice('Screen sharing stopped', 'info');
        return;
      }

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
      const myEmail = (currentUser?.email || '').toLowerCase().trim();
      const myId = String(currentUser?.id || '').trim();
      const peerEmail = (user?.email || '').toLowerCase().trim();
      const peerId = String(user?.id || '').trim();

      // STRICT DEDUPLICATION: Never add self as a remote peer!
      if ((myId && peerId === myId) || (myEmail && peerEmail === myEmail)) {
        return;
      }

      addNotice(`${user.name || 'A team member'} joined the meeting`, 'join');
      createPeerConnection(socketId, user, true);
    };

    // When a user leaves
    const handleUserLeft = ({ socketId, user }: any) => {
      const peer = remotePeers[socketId] || peersRef.current[socketId];
      const name = user?.name || peer?.user?.name || 'A participant';
      removePeer(socketId);
      addNotice(`${name} left the meeting`, 'leave');
    };

    // When the meeting has ended automatically or by host
    const handleMeetingEnded = ({ meetingId: endedId }: any) => {
      if (endedId === meetingId) {
        addNotice('The meeting has ended', 'info');
        setTimeout(() => {
          handleLeaveCall();
        }, 1200);
      }
    };

    socket.on('webrtc_signal', handleSignal);
    socket.on('user_joined_meeting', handleUserJoined);
    socket.on('user_left_meeting', handleUserLeft);
    socket.on('meeting_ended', handleMeetingEnded);

    return () => {
      socket.off('webrtc_signal', handleSignal);
      socket.off('user_joined_meeting', handleUserJoined);
      socket.off('user_left_meeting', handleUserLeft);
      socket.off('meeting_ended', handleMeetingEnded);
    };
  }, [socket, callState, meetingId, currentUser, createPeerConnection, removePeer, addNotice, remotePeers]);

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
  const handleLeaveCall = () => {
    if (socket) {
      socket.emit('leave_meeting', { meetingId });
    }

    // Close all peer connections
    Object.keys(peersRef.current).forEach(id => {
      try {
        peersRef.current[id].pc.close();
      } catch (e) { }
    });
    peersRef.current = {};
    setRemotePeers({});

    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
    }

    setCallState('ended');
    if (onLeave) {
      onLeave();
    } else {
      window.location.href = '/';
    }
  };

  const handleEndCallForAll = () => {
    if (socket) {
      socket.emit('end_meeting', { meetingId });
    }
    handleLeaveCall();
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

  // Screen Share: Real Unmirrored Display Media with Spotlight Stage
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        const screenTrack = screen.getVideoTracks()[0];
        screenStreamRef.current = screen;
        setScreenStream(screen);
        setIsScreenSharing(true);
        setPresenterInfo({ name: currentUser?.name || 'You', isSelf: true });
        addNotice('You started presenting your screen', 'info');

        // Replace track on all active peer connections so peers see the screen
        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        });

        // Broadcast screen sharing event
        if (socket) {
          socket.emit('webrtc_signal', {
            meetingId,
            targetSocketId: 'broadcast',
            signal: { type: 'screen_share_start', presenterName: currentUser?.name || 'Presenter' }
          });
        }

        // Handle user stopping screen share via native browser banner
        screenTrack.onended = () => {
          stopScreenShare();
        };
      } catch (err: any) {
        console.warn('Screen share canceled or failed:', err.message);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setPresenterInfo(null);
    addNotice('Screen sharing ended', 'info');

    // Restore camera video track on all peer connections
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      Object.values(peersRef.current).forEach(({ pc }) => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    if (socket) {
      socket.emit('webrtc_signal', {
        meetingId,
        targetSocketId: 'broadcast',
        signal: { type: 'screen_share_stop' }
      });
    }
  };

  const copyMeetingLink = () => {
    const code = meetingId;
    navigator.clipboard.writeText(code);
    setCopiedLink(true);
    addNotice(`Meeting ID ${code} copied to clipboard!`, 'info');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.trim().substring(0, 2).toUpperCase();
    }
    if (email && email.trim()) return email.trim().substring(0, 2).toUpperCase();
    return 'ME';
  };

  const isHost = meeting?.hostEmail && currentUser?.email && meeting.hostEmail.toLowerCase() === currentUser.email.toLowerCase();

  // Deduplicate remote peers
  const remoteSocketIds = Object.keys(remotePeers);
  const peerCount = remoteSocketIds.length;

  // Active Presenter Stream (either local screen share or remote presentation)
  const isPresentingActive = isScreenSharing || Boolean(presenterInfo && !presenterInfo.isSelf);

  // -------------------------------------------------------------
  // Render: 1. Loading / Verification in progress
  // -------------------------------------------------------------
  if (authStatus === 'verifying') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c1317] flex flex-col items-center justify-center text-white p-4 select-none">
        <div className="w-14 h-14 rounded-full border-4 border-[#25D366]/20 border-t-[#25D366] animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white tracking-tight">Connecting to WhatsApp Video Call...</h2>
        <p className="text-xs text-gray-400 mt-1">Securing end-to-end encrypted connection</p>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 2. Unauthorized
  // -------------------------------------------------------------
  if (authStatus === 'unauthorized') {
    return (
      <div className="fixed inset-0 z-50 bg-[#0c1317] flex flex-col items-center justify-center text-white p-6 select-none">
        <div className="max-w-md w-full bg-[#111b21] border border-[#202c33] rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted</h2>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">{deniedReason || 'You are not an authorized member of this meeting.'}</p>
          <button
            onClick={() => onLeave ? onLeave() : (window.location.href = '/')}
            className="mt-6 w-full py-3 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-white font-semibold text-xs transition cursor-pointer"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Render: 3. Main WhatsApp Web Video Meeting Interface
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-[#0c1317] text-white flex flex-col overflow-hidden select-none font-sans animate-in fade-in duration-200">

      {/* Floating Animated WhatsApp-style Toast / Popup Notifications */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4">
        {popupNotices.map(notice => (
          <div
            key={notice.id}
            className={`px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-3 duration-300 pointer-events-auto ${
              notice.type === 'join'
                ? 'bg-[#111b21]/95 text-[#25D366] border-[#25D366]/40 shadow-emerald-950/60'
                : notice.type === 'leave'
                  ? 'bg-[#111b21]/95 text-amber-300 border-amber-500/40 shadow-amber-950/60'
                  : 'bg-[#111b21]/95 text-gray-200 border-[#202c33]'
            }`}
          >
            {notice.type === 'join' && <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />}
            {notice.type === 'leave' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
            {notice.type === 'info' && <span className="w-2 h-2 rounded-full bg-blue-400" />}
            <span>{notice.text}</span>
          </div>
        ))}
      </div>

      {/* WhatsApp Web Call Top Header */}
      <header className="px-5 py-3.5 flex items-center justify-between bg-[#111b21] border-b border-[#202c33] shrink-0 z-20">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 shrink-0">
            <VideoIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight truncate">
                {meeting?.title || 'Online Video Meeting'}
              </h1>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#25D366] text-[10px] font-bold border border-[#00a884]/30 shrink-0">
                {meeting?.type === 'group' ? '👥 Group Call' : '👤 Direct Call'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono text-[#25D366] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                {formatTime(callDuration)}
              </span>
              <span>•</span>
              <span className="hidden sm:inline text-gray-400">🔒 End-to-end encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Header Options: Meeting ID, Participant Counter, Minimize */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Meeting ID pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202c33] border border-[#2a3942] text-xs">
            <span className="text-gray-400 text-[11px]">ID:</span>
            <span className="font-mono text-[#25D366] font-bold text-xs">{meetingId}</span>
            <button
              type="button"
              onClick={copyMeetingLink}
              className="p-1 hover:text-white text-gray-400 transition cursor-pointer"
              title="Copy Meeting Code"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202c33] text-xs text-gray-200">
            <Users className="w-3.5 h-3.5 text-[#25D366]" />
            <span className="font-bold">{peerCount + 1}</span>
            <span className="hidden sm:inline text-gray-400">Online</span>
          </div>

          {/* Leave/Minimize button */}
          <button
            type="button"
            onClick={handleLeaveCall}
            className="p-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-gray-300 hover:text-white transition cursor-pointer"
            title="Leave / Close"
          >
            <PhoneOff className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </header>

      {/* Main Video & Presentation Stage */}
      <main className="flex-1 relative p-3 sm:p-5 flex flex-col items-center justify-center overflow-hidden">

        {/* ========================================================
            CASE A: SCREEN SHARING ACTIVE (Spotlight Stage)
            ======================================================== */}
        {isPresentingActive ? (
          <div className="w-full h-full flex flex-col gap-3 max-w-7xl">
            {/* Screen Share Spotlight Presentation */}
            <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden bg-black border border-[#202c33] flex items-center justify-center shadow-2xl">
              {isScreenSharing ? (
                <video
                  ref={localScreenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain transform-none bg-black"
                />
              ) : (
                /* Remote presentation stream */
                remoteSocketIds.map(sId => (
                  <RemoteVideoElement key={sId} stream={remotePeers[sId].stream} isPresentation />
                ))
              )}

              {/* Presenter Indicator Badge */}
              <div className="absolute top-4 left-4 bg-[#111b21]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/40 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-lg">
                <MonitorUp className="w-4 h-4 text-[#25D366]" />
                <span>{isScreenSharing ? 'You are presenting your screen' : `${presenterInfo?.name || 'A participant'} is presenting`}</span>
              </div>
            </div>

            {/* Thumbnail Row for Camera Feeds */}
            <div className="h-28 sm:h-36 shrink-0 flex items-center gap-3 overflow-x-auto pb-1 touch-scroll">
              {/* You (Local Camera) */}
              <div className="h-full aspect-video rounded-xl overflow-hidden bg-[#111b21] border border-emerald-500/40 relative shrink-0 shadow-lg">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#111b21]">
                    <div className="w-10 h-10 rounded-full bg-emerald-950 text-[#25D366] font-bold text-sm flex items-center justify-center">
                      {getInitials(currentUser?.name, currentUser?.email)}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                  You
                </div>
              </div>

              {/* Remote Participants */}
              {remoteSocketIds.map(sId => {
                const peer = remotePeers[sId];
                return (
                  <div key={sId} className="h-full aspect-video rounded-xl overflow-hidden bg-[#111b21] border border-[#202c33] relative shrink-0 shadow-lg">
                    <RemoteVideoElement stream={peer.stream} />
                    <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white truncate max-w-[120px]">
                      {peer.user?.name || 'Participant'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ========================================================
             CASE B: CAMERA GRID (1, 2, or Multi-Participant WhatsApp Grid)
             ======================================================== */
          peerCount === 0 ? (
            /* User is alone: WhatsApp-style single waiting stage */
            <div className="w-full h-full max-w-4xl relative rounded-3xl overflow-hidden bg-[#111b21] border border-[#202c33] flex flex-col items-center justify-center shadow-2xl">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 z-10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25D366] text-white font-bold text-3xl flex items-center justify-center shadow-2xl ring-4 ring-[#25D366]/30">
                    {getInitials(currentUser?.name, currentUser?.email)}
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-base text-white">{currentUser?.name || 'You'}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Camera is turned off</p>
                  </div>
                </div>
              )}

              {/* Waiting Pill Overlay */}
              <div className="absolute top-5 left-5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-xs text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                <span>Waiting for other team members to join...</span>
              </div>

              {/* Bottom Tag */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between z-10">
                <div className="px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2">
                  <span>You ({currentUser?.name || 'User'})</span>
                  <span className="text-[10px] text-[#25D366] font-mono">Host</span>
                </div>
                <div className={`p-2 rounded-xl backdrop-blur-md ${isMicOn ? 'bg-black/60 text-[#25D366]' : 'bg-red-500/80 text-white'}`}>
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </div>
              </div>
            </div>
          ) : peerCount === 1 ? (
            /* 1-on-1 Call: Side-by-Side or PiP Layout (NO DUPLICATES) */
            <div className="w-full h-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center">
              {/* Tile 1: You */}
              <div className="w-full h-full min-h-[260px] relative rounded-3xl overflow-hidden bg-[#111b21] border border-emerald-500/40 shadow-xl flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25D366] text-white font-bold text-2xl flex items-center justify-center shadow-xl ring-4 ring-[#25D366]/30">
                      {getInitials(currentUser?.name, currentUser?.email)}
                    </div>
                    <span className="text-xs text-gray-400">Camera off</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs z-10">
                  <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md font-semibold text-white">
                    You ({currentUser?.name || 'User'})
                  </div>
                  <div className={`p-1.5 rounded-lg ${isMicOn ? 'bg-black/60 text-[#25D366]' : 'bg-red-500/80 text-white'}`}>
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Tile 2: The Remote Connected Member */}
              {remoteSocketIds.map(sId => {
                const peer = remotePeers[sId];
                return (
                  <div key={sId} className="w-full h-full min-h-[260px] relative rounded-3xl overflow-hidden bg-[#111b21] border border-[#202c33] shadow-xl flex items-center justify-center">
                    <RemoteVideoElement stream={peer.stream} />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs z-10">
                      <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md font-semibold text-white flex items-center gap-2">
                        <span>{peer.user?.name || peer.user?.email || 'Connected Member'}</span>
                        <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/60 text-[#25D366]">
                        <Mic className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Multi-Participant Grid (3+ members) */
            <div className={`w-full h-full max-w-6xl grid gap-4 overflow-y-auto p-2 ${
              peerCount <= 3 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {/* Tile 1: You */}
              <div className="aspect-video relative rounded-2xl overflow-hidden bg-[#111b21] border border-emerald-500/40 shadow-xl flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25D366] text-white font-bold text-xl flex items-center justify-center shadow-lg">
                      {getInitials(currentUser?.name, currentUser?.email)}
                    </div>
                    <span className="text-[11px] text-gray-400">You (Camera off)</span>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2">
                  <span>You ({currentUser?.name})</span>
                </div>
              </div>

              {/* Tiles: Unique Remote Peers */}
              {remoteSocketIds.map(sId => {
                const peer = remotePeers[sId];
                return (
                  <div key={sId} className="aspect-video relative rounded-2xl overflow-hidden bg-[#111b21] border border-[#202c33] shadow-xl flex items-center justify-center">
                    <RemoteVideoElement stream={peer.stream} />
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2">
                      <span>{peer.user?.name || peer.user?.email || 'Participant'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </main>

      {/* WhatsApp Web Floating Bottom Control Dock */}
      <footer className="p-4 px-6 flex items-center justify-center bg-[#111b21] border-t border-[#202c33] shrink-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4 bg-[#202c33] px-6 py-2.5 rounded-full border border-[#2a3942] shadow-2xl">

          {/* Toggle Microphone */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3.5 rounded-full transition cursor-pointer shadow-md ${
              isMicOn
                ? 'bg-[#111b21] hover:bg-[#2a3942] text-white'
                : 'bg-[#ea0038] hover:bg-[#d00032] text-white ring-2 ring-red-400/50'
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="w-5 h-5 text-[#25D366]" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Toggle Video Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`p-3.5 rounded-full transition cursor-pointer shadow-md ${
              isVideoOn
                ? 'bg-[#111b21] hover:bg-[#2a3942] text-white'
                : 'bg-[#ea0038] hover:bg-[#d00032] text-white ring-2 ring-red-400/50'
            }`}
            title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
          >
            {isVideoOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>

          {/* Real Screen Share Presentation */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-full transition cursor-pointer shadow-md ${
              isScreenSharing
                ? 'bg-[#00a884] text-white ring-2 ring-emerald-400/50'
                : 'bg-[#111b21] hover:bg-[#2a3942] text-white'
            }`}
            title={isScreenSharing ? "Stop Sharing Screen" : "Share Your Screen"}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#2a3942] my-auto mx-1" />

          {/* Leave Call Button */}
          <button
            type="button"
            onClick={handleLeaveCall}
            className="px-5 py-3 rounded-full bg-[#ea0038] hover:bg-[#d00032] text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-950/60 cursor-pointer ring-2 ring-red-500/30"
            title="Leave Call"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave Call</span>
          </button>

          {/* Host End for All Option */}
          {isHost && (
            <button
              type="button"
              onClick={handleEndCallForAll}
              className="hidden sm:flex px-4 py-3 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs items-center gap-1.5 transition cursor-pointer"
              title="End Meeting for Everyone"
            >
              <span>End All</span>
            </button>
          )}

        </div>
      </footer>

    </div>
  );
};

// Sub-component to attach remote stream to video element
const RemoteVideoElement: React.FC<{ stream: MediaStream; isPresentation?: boolean }> = ({ stream, isPresentation = false }) => {
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
      className={`w-full h-full ${isPresentation ? 'object-contain transform-none bg-black' : 'object-cover'}`}
    />
  );
};
