import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera, CameraOff, Mic, MicOff, PhoneOff, Copy, Check,
  Users, ShieldAlert, MonitorUp, Video as VideoIcon, Hand, MoreVertical
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
  candidateQueue: RTCIceCandidateInit[];
}

interface RemotePeerData {
  user: any;
  stream?: MediaStream;
  isConnected: boolean;
  isMicOn?: boolean;
  isVideoOn?: boolean;
  isHandRaised?: boolean;
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
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  const hadRemotePeersRef = useRef(false);
  const autoCloseIntervalRef = useRef<any>(null);

  // Notifications popup inside meeting
  const [popupNotices, setPopupNotices] = useState<PopupNotice[]>([]);

  // Streams & WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<{ [socketId: string]: RemotePeerData }>({});
  const [presenterInfo, setPresenterInfo] = useState<{ name: string; isSelf: boolean } | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localScreenVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [socketId: string]: PeerConnectionItem }>({});
  const iceServersRef = useRef<RTCIceServer[]>([
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302'
      ]
    }
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

          // Attach newly obtained local tracks to any already-created peer connections
          Object.entries(peersRef.current).forEach(([targetSocketId, peerItem]) => {
            if (peerItem.pc && peerItem.pc.signalingState !== 'closed') {
              stream.getTracks().forEach(track => {
                const senders = peerItem.pc.getSenders();
                const existing = senders.find(s => s.track && s.track.kind === track.kind);
                if (existing) {
                  existing.replaceTrack(track).catch(() => {});
                } else {
                  try {
                    peerItem.pc.addTrack(track, stream);
                  } catch (e) {}
                }
              });

              if (peerItem.pc.signalingState === 'stable') {
                peerItem.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                  .then(offer => peerItem.pc.setLocalDescription(offer))
                  .then(() => {
                    socket?.emit('webrtc_signal', {
                      meetingId,
                      targetSocketId,
                      signal: { sdp: peerItem.pc.localDescription },
                      senderUser: {
                        id: currentUser?.id,
                        email: currentUser?.email,
                        name: currentUser?.name,
                        role: currentUser?.role
                      }
                    });
                  })
                  .catch(err => console.warn('[WebRTC] Track add offer error:', err));
              }
            }
          });

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
                  // 1. Immediately show all existing participants in the UI!
                  setRemotePeers(prev => {
                    const updated = { ...prev };
                    res.existingPeers.forEach((p: any) => {
                      if (p.socketId && p.socketId !== socket.id) {
                        updated[p.socketId] = {
                          user: p.user,
                          stream: updated[p.socketId]?.stream,
                          isConnected: true,
                          isMicOn: true,
                          isVideoOn: true,
                          isHandRaised: false
                        };
                      }
                    });
                    return updated;
                  });

                  // 2. Setup peer connections. As the joiner, we wait for incoming offers (isInitiator = false)
                  res.existingPeers.forEach((p: any) => {
                    if (p.socketId && p.socketId !== socket.id) {
                      createPeerConnection(p.socketId, p.user, false);
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
                // 1. Immediately show all existing participants in the UI!
                setRemotePeers(prev => {
                  const updated = { ...prev };
                  res.existingPeers.forEach((p: any) => {
                    if (p.socketId && p.socketId !== socket.id) {
                      updated[p.socketId] = {
                        user: p.user,
                        stream: updated[p.socketId]?.stream,
                        isConnected: true
                      };
                    }
                  });
                  return updated;
                });

                // 2. Setup peer connections (isInitiator = false)
                res.existingPeers.forEach((p: any) => {
                  if (p.socketId && p.socketId !== socket.id) {
                    createPeerConnection(p.socketId, p.user, false);
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
    // If peer connection already exists and active, reuse it
    if (peersRef.current[targetSocketId]?.pc && peersRef.current[targetSocketId].pc.signalingState !== 'closed') {
      return peersRef.current[targetSocketId].pc;
    }

    const pc = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });

    const candidateQueue: RTCIceCandidateInit[] = [];

    // Add local tracks (camera or screen) to peer connection
    const currentActiveStream = screenStreamRef.current || localStreamRef.current;
    if (currentActiveStream) {
      currentActiveStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, currentActiveStream);
        } catch (e) {}
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
      let existingStream = peersRef.current[targetSocketId]?.stream;
      if (!existingStream) {
        existingStream = new MediaStream();
        peersRef.current[targetSocketId].stream = existingStream;
      }
      if (!existingStream.getTracks().some(t => t.id === event.track.id)) {
        existingStream.addTrack(event.track);
      }

      // Create a fresh MediaStream wrapper containing all tracks so React re-renders RemoteVideoElement
      const freshStream = new MediaStream(existingStream.getTracks());

      setRemotePeers(prev => ({
        ...prev,
        [targetSocketId]: {
          user: targetUser || prev[targetSocketId]?.user,
          stream: freshStream,
          isConnected: true,
          isMicOn: prev[targetSocketId]?.isMicOn ?? true,
          isVideoOn: prev[targetSocketId]?.isVideoOn ?? true,
          isHandRaised: prev[targetSocketId]?.isHandRaised ?? false
        }
      }));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'closed') {
        removePeer(targetSocketId);
      }
    };

    peersRef.current[targetSocketId] = {
      socketId: targetSocketId,
      user: targetUser,
      pc,
      candidateQueue
    };

    // If initiator, create and send offer to peer
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
    if (!socket) return;

    // Handle incoming WebRTC signals
    const handleSignal = async ({ senderSocketId, signal, senderUser }: any) => {
      if (!senderSocketId || senderSocketId === socket.id) return;

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

      // Check for hand raise signal
      if (signal?.type === 'hand_raise') {
        const raisedName = senderUser?.name || 'A participant';
        if (signal.isHandRaised) {
          addNotice(`${raisedName} raised hand ✋`, 'info');
        }
        setRemotePeers(prev => ({
          ...prev,
          [senderSocketId]: {
            ...prev[senderSocketId],
            user: senderUser || prev[senderSocketId]?.user,
            isHandRaised: Boolean(signal.isHandRaised)
          }
        }));
        return;
      }

      // Check for media state change (mic/camera toggle)
      if (signal?.type === 'media_state_change') {
        setRemotePeers(prev => ({
          ...prev,
          [senderSocketId]: {
            ...prev[senderSocketId],
            user: senderUser || prev[senderSocketId]?.user,
            isMicOn: signal.isMicOn !== undefined ? signal.isMicOn : prev[senderSocketId]?.isMicOn,
            isVideoOn: signal.isVideoOn !== undefined ? signal.isVideoOn : prev[senderSocketId]?.isVideoOn
          }
        }));
        return;
      }

      let peerItem = peersRef.current[senderSocketId];

      if (!peerItem || !peerItem.pc || peerItem.pc.signalingState === 'closed') {
        createPeerConnection(senderSocketId, senderUser, false);
        peerItem = peersRef.current[senderSocketId];
      }

      const pc = peerItem?.pc;
      if (!pc) return;

      try {
        if (signal.sdp) {
          const sdp = new RTCSessionDescription(signal.sdp);

          if (sdp.type === 'offer') {
            // Glare collision resolution
            if (pc.signalingState !== 'stable') {
              const isPolite = (socket.id || '').localeCompare(senderSocketId) < 0;
              if (!isPolite) {
                console.warn('[WebRTC] Glare offer ignored by impolite peer');
                return;
              }
              console.log('[WebRTC] Glare offer rolling back local offer');
              await pc.setLocalDescription({ type: 'rollback' });
            }

            await pc.setRemoteDescription(sdp);

            // Flush queued ICE candidates
            if (peerItem.candidateQueue && peerItem.candidateQueue.length > 0) {
              for (const cand of peerItem.candidateQueue) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              peerItem.candidateQueue = [];
            }

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
          } else if (sdp.type === 'answer') {
            await pc.setRemoteDescription(sdp);

            // Flush queued ICE candidates
            if (peerItem.candidateQueue && peerItem.candidateQueue.length > 0) {
              for (const cand of peerItem.candidateQueue) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (e) {}
              }
              peerItem.candidateQueue = [];
            }
          }
        } else if (signal.candidate) {
          if (!pc.remoteDescription) {
            if (!peerItem.candidateQueue) peerItem.candidateQueue = [];
            peerItem.candidateQueue.push(signal.candidate);
          } else {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } catch (e) {
              console.warn('[WebRTC] Error adding ICE candidate:', e);
            }
          }
        }
      } catch (err: any) {
        console.error('[WebRTC] Signal handling error:', err.message);
      }
    };

    // When a new user joins the meeting
    const handleUserJoined = ({ socketId, user }: any) => {
      if (!socketId || socketId === socket.id) return;

      addNotice(`${user.name || 'A team member'} joined the meeting`, 'join');

      // 1. Immediately show the new joiner in the UI!
      setRemotePeers(prev => ({
        ...prev,
        [socketId]: {
          user,
          stream: prev[socketId]?.stream,
          isConnected: true,
          isMicOn: true,
          isVideoOn: true,
          isHandRaised: false
        }
      }));

      // 2. Existing participant creates connection and sends offer (isInitiator = true)
      createPeerConnection(socketId, user, true);
    };

    // When a user leaves
    const handleUserLeft = ({ socketId, user }: any) => {
      const peer = peersRef.current[socketId];
      const name = user?.name || peer?.user?.name || 'A participant';
      removePeer(socketId);
      addNotice(`${name} left the meeting`, 'leave');
    };

    // When the meeting has ended automatically or by host
    const handleMeetingEnded = ({ meetingId: endedId }: any) => {
      const normEnded = String(endedId || '').trim().toUpperCase();
      const normCurrent = String(meetingId || '').trim().toUpperCase();
      if (normEnded === normCurrent) {
        addNotice('The meeting has ended', 'info');
        setTimeout(() => {
          handleLeaveCall();
        }, 1200);
      }
    };

    // Auto re-join room if socket reconnects
    const handleSocketConnect = () => {
      if (authStatus === 'authorized' && currentUser) {
        socket.emit('join_meeting', {
          meetingId,
          user: {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            role: currentUser.role
          }
        });
      }
    };

    socket.on('connect', handleSocketConnect);
    socket.on('webrtc_signal', handleSignal);
    socket.on('user_joined_meeting', handleUserJoined);
    socket.on('user_left_meeting', handleUserLeft);
    socket.on('meeting_ended', handleMeetingEnded);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('webrtc_signal', handleSignal);
      socket.off('user_joined_meeting', handleUserJoined);
      socket.off('user_left_meeting', handleUserLeft);
      socket.off('meeting_ended', handleMeetingEnded);
    };
  }, [socket, meetingId, currentUser, createPeerConnection, removePeer, addNotice]);

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

  // 6. Monitor Remote Participants & Dynamically Auto-Close Session When Everyone Leaves
  useEffect(() => {
    const peerIds = Object.keys(remotePeers);
    if (peerIds.length > 0) {
      hadRemotePeersRef.current = true;
      if (autoCloseIntervalRef.current) {
        clearInterval(autoCloseIntervalRef.current);
        autoCloseIntervalRef.current = null;
      }
      setAutoCloseCountdown(null);
    } else if (hadRemotePeersRef.current && peerIds.length === 0 && callState === 'connected') {
      // Everyone else has left the meeting!
      if (!autoCloseIntervalRef.current && autoCloseCountdown === null) {
        addNotice('All participants left the meeting. Closing session in 10s...', 'info');
        setAutoCloseCountdown(10);
        autoCloseIntervalRef.current = setInterval(() => {
          setAutoCloseCountdown(prev => {
            if (prev === null || prev <= 1) {
              if (autoCloseIntervalRef.current) {
                clearInterval(autoCloseIntervalRef.current);
                autoCloseIntervalRef.current = null;
              }
              handleEndCallForAll();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

    return () => {
      if (autoCloseIntervalRef.current) {
        clearInterval(autoCloseIntervalRef.current);
      }
    };
  }, [remotePeers, callState]);

  // 7. Action Handlers
  const handleLeaveCall = () => {
    if (autoCloseIntervalRef.current) {
      clearInterval(autoCloseIntervalRef.current);
      autoCloseIntervalRef.current = null;
    }

    if (socket) {
      socket.emit('leave_meeting', { meetingId });
    }

    // If no remote participants remain, also immediately end the meeting session on backend & DB
    if (Object.keys(remotePeers).length === 0) {
      if (socket) {
        socket.emit('end_meeting', { meetingId });
      }
      api.endMeeting(meetingId).catch(() => {});
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
    if (autoCloseIntervalRef.current) {
      clearInterval(autoCloseIntervalRef.current);
      autoCloseIntervalRef.current = null;
    }
    if (socket) {
      socket.emit('end_meeting', { meetingId });
    }
    api.endMeeting(meetingId).catch(() => {});
    handleLeaveCall();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach(t => { t.enabled = nextState; });
        setIsMicOn(nextState);
        if (socket) {
          socket.emit('webrtc_signal', {
            meetingId,
            targetSocketId: 'broadcast',
            signal: { type: 'media_state_change', isMicOn: nextState, isVideoOn }
          });
        }
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
        if (socket) {
          socket.emit('webrtc_signal', {
            meetingId,
            targetSocketId: 'broadcast',
            signal: { type: 'media_state_change', isMicOn, isVideoOn: nextState }
          });
        }
      }
    }
  };

  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) {
      addNotice('You raised your hand ✋', 'info');
    } else {
      addNotice('You lowered your hand', 'info');
    }
    if (socket) {
      socket.emit('webrtc_signal', {
        meetingId,
        targetSocketId: 'broadcast',
        signal: { type: 'hand_raise', isHandRaised: nextState }
      });
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

      {/* Dynamic Auto-Close Notification Banner when all other participants leave */}
      {autoCloseCountdown !== null && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-[#111b21]/95 backdrop-blur-xl px-5 py-3 rounded-2xl border border-red-500/50 text-white shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-3 max-w-lg w-[92%] sm:w-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">All participants have left the meeting</p>
              <p className="text-[11px] text-red-300">
                Session closing in <span className="font-mono font-bold text-white">{autoCloseCountdown}s</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (autoCloseIntervalRef.current) {
                  clearInterval(autoCloseIntervalRef.current);
                  autoCloseIntervalRef.current = null;
                }
                setAutoCloseCountdown(null);
                addNotice('Session auto-close canceled', 'info');
              }}
              className="px-3 py-1.5 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-xs font-semibold text-gray-200 transition cursor-pointer"
            >
              Stay
            </button>
            <button
              type="button"
              onClick={handleEndCallForAll}
              className="px-3 py-1.5 rounded-xl bg-[#ea0038] hover:bg-[#d00032] text-xs font-bold text-white transition shadow cursor-pointer"
            >
              Close Now
            </button>
          </div>
        </div>
      )}

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
                {(meeting?.type === 'group' || meeting?.isGroup || (meeting?.title && meeting.title.toLowerCase().includes('team'))) ? '👥 Group Call' : '👤 Direct Call'}
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
                  <RemoteVideoElement key={sId} user={remotePeers[sId].user} stream={remotePeers[sId].stream} isPresentation />
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
                    <RemoteVideoElement user={peer.user} stream={peer.stream} />
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
             CASE B: UNIFIED RESPONSIVE VIDEO GRID (Google Meet & WhatsApp style)
             ======================================================== */
          (() => {
            const allParticipants = [
              {
                id: 'local',
                isLocal: true,
                user: currentUser,
                stream: localStream || undefined,
                isConnected: true,
                isVideoOn,
                isMicOn,
                isHandRaised
              },
              ...remoteSocketIds.map(sId => ({
                id: sId,
                isLocal: false,
                user: remotePeers[sId].user,
                stream: remotePeers[sId].stream,
                isConnected: remotePeers[sId].isConnected,
                isMicOn: remotePeers[sId].isMicOn ?? true,
                isVideoOn: remotePeers[sId].isVideoOn ?? true,
                isHandRaised: remotePeers[sId].isHandRaised ?? false
              }))
            ];

            const totalCount = allParticipants.length;

            return (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
                {totalCount === 1 ? (
                  /* Solo participant card */
                  <div className="w-full max-w-3xl h-[65vh] relative rounded-3xl overflow-hidden bg-[#181c21] border border-white/10 shadow-2xl flex items-center justify-center group">
                    {isVideoOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center z-10">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25D366] text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-2xl ring-4 ring-[#25D366]/30 mb-3 select-none">
                          {getInitials(currentUser?.name, currentUser?.email)}
                        </div>
                        <h3 className="font-bold text-base text-white">{currentUser?.name || 'You'}</h3>
                        <p className="text-xs text-gray-400 mt-1">Waiting for other members to join...</p>
                      </div>
                    )}

                    {/* Waiting pill top-left */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2 text-xs text-emerald-300 z-20">
                      <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                      <span>Waiting for team members to join...</span>
                    </div>

                    {/* Top-right mic status */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 ${
                        isMicOn ? 'bg-black/60 text-[#25D366]' : 'bg-[#ea0038]/90 text-white'
                      }`}>
                        {isMicOn ? <Mic className="w-4 h-4 text-[#25D366]" /> : <MicOff className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    {/* Bottom-left user name badge + hand raise */}
                    <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
                      {isHandRaised && (
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
                          <Hand className="w-4 h-4 fill-black" />
                        </div>
                      )}
                      <div className="px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
                        <span>You ({currentUser?.name || 'User'})</span>
                        {isHost && <span className="text-[10px] text-[#25D366] font-mono">Host</span>}
                      </div>
                    </div>

                    {/* Bottom-right 3-dots */}
                    <div className="absolute bottom-4 right-4 z-20">
                      <button
                        type="button"
                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center border border-white/10 shadow-lg transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Multi-participant Grid (Google Meet 2x3 or WhatsApp 3x3) */
                  <div className={`w-full h-full max-w-7xl grid gap-3 sm:gap-4 items-center justify-center ${
                    totalCount === 2
                      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                      : totalCount <= 4
                        ? 'grid-cols-1 sm:grid-cols-2 max-w-5xl'
                        : totalCount <= 6
                          ? 'grid-cols-2 sm:grid-cols-3 max-w-6xl'
                          : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 max-w-7xl'
                  }`}>
                    {allParticipants.map(participant => (
                      <div
                        key={participant.id}
                        className="w-full h-full min-h-[170px] sm:min-h-[200px] md:min-h-[220px] aspect-[4/3] sm:aspect-video relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#181c21] border border-white/10 shadow-2xl flex items-center justify-center group"
                      >
                        {participant.isLocal ? (
                          participant.isVideoOn ? (
                            <video
                              ref={localVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover transform -scale-x-100"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-4 text-center z-10">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr from-[#128c7e] to-[#25D366] text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-2xl ring-4 ring-[#25D366]/30 select-none">
                                {getInitials(currentUser?.name, currentUser?.email)}
                              </div>
                            </div>
                          )
                        ) : (
                          <RemoteVideoElement
                            user={participant.user}
                            stream={participant.stream}
                          />
                        )}

                        {/* Top-Right Corner: Mic Status Badge */}
                        <div className="absolute top-3 right-3 z-20">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10 ${
                              participant.isMicOn ? 'bg-black/60 text-[#25D366]' : 'bg-[#ea0038]/90 text-white'
                            }`}
                            title={participant.isMicOn ? 'Microphone on' : 'Microphone muted'}
                          >
                            {participant.isMicOn ? (
                              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#25D366]" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Bottom-Left Corner: Name Badge + Hand Raise Indicator */}
                        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 max-w-[80%]">
                          {participant.isHandRaised && (
                            <div
                              className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce shrink-0"
                              title={`${participant.isLocal ? 'You' : participant.user?.name || 'Participant'} raised hand`}
                            >
                              <Hand className="w-3.5 h-3.5 fill-black" />
                            </div>
                          )}
                          <div className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white truncate shadow-lg flex items-center gap-1.5">
                            <span className="truncate">
                              {participant.isLocal
                                ? `You${isHost ? ' (Host)' : ''}`
                                : (participant.user?.name || participant.user?.email || 'Participant')}
                            </span>
                            {!participant.isLocal && (
                              <span className="w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Bottom-Right Corner: 3-dots Menu Button */}
                        <div className="absolute bottom-3 right-3 z-20">
                          <button
                            type="button"
                            className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer border border-white/10 shadow-lg"
                            title="More options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()
        )}

      </main>

      {/* Floating Bottom Control Dock (Google Meet / WhatsApp style) */}
      <footer className="p-4 px-6 flex items-center justify-center bg-[#111b21] border-t border-[#202c33] shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-4 bg-[#202c33] px-5 sm:px-6 py-2.5 rounded-full border border-[#2a3942] shadow-2xl">

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

          {/* Hand Raise Toggle Button */}
          <button
            type="button"
            onClick={toggleHandRaise}
            className={`p-3.5 rounded-full transition cursor-pointer shadow-md ${
              isHandRaised
                ? 'bg-amber-500 hover:bg-amber-400 text-black ring-2 ring-amber-300 shadow-amber-500/40 shadow-lg'
                : 'bg-[#111b21] hover:bg-[#2a3942] text-white'
            }`}
            title={isHandRaised ? "Lower Hand" : "Raise Hand"}
          >
            <Hand className={`w-5 h-5 ${isHandRaised ? 'fill-black' : ''}`} />
          </button>

          {/* More Options / 3-dots */}
          <button
            type="button"
            className="hidden sm:flex p-3.5 rounded-full bg-[#111b21] hover:bg-[#2a3942] text-white transition cursor-pointer shadow-md"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
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
            <span className="hidden sm:inline">Leave Call</span>
          </button>

          {/* Host End for All Option */}
          {isHost && (
            <button
              type="button"
              onClick={handleEndCallForAll}
              className="hidden md:flex px-4 py-3 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs items-center gap-1.5 transition cursor-pointer"
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

// Sub-component to attach remote stream to video & audio element with live card fallback
const RemoteVideoElement: React.FC<{
  user?: any;
  stream?: MediaStream;
  isPresentation?: boolean;
}> = ({ user, stream, isPresentation = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasLiveVideo, setHasLiveVideo] = useState(false);

  useEffect(() => {
    if (!stream) {
      setHasLiveVideo(false);
      return;
    }

    const checkVideoState = () => {
      const vTracks = stream.getVideoTracks();
      const hasActiveVideoTrack = vTracks.some(t => t.enabled && t.readyState === 'live');
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        setHasLiveVideo(true);
      } else {
        setHasLiveVideo(hasActiveVideoTrack);
      }
    };

    checkVideoState();

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }

    const onTrackChange = () => {
      checkVideoState();
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    };

    stream.addEventListener('addtrack', onTrackChange);
    stream.addEventListener('removetrack', onTrackChange);

    const vTracks = stream.getVideoTracks();
    vTracks.forEach(t => {
      t.onmute = checkVideoState;
      t.onunmute = () => setHasLiveVideo(true);
      t.onended = checkVideoState;
    });

    return () => {
      stream.removeEventListener('addtrack', onTrackChange);
      stream.removeEventListener('removetrack', onTrackChange);
      vTracks.forEach(t => {
        t.onmute = null;
        t.onunmute = null;
        t.onended = null;
      });
    };
  }, [stream]);

  const initials = (() => {
    const name = user?.name || user?.email || 'TM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  })();

  const avatarColor = (() => {
    const colors = [
      'from-emerald-600 to-teal-800',
      'from-blue-600 to-indigo-800',
      'from-purple-600 to-violet-800',
      'from-amber-600 to-orange-800',
      'from-rose-600 to-pink-800',
      'from-cyan-600 to-blue-800'
    ];
    const str = (user?.name || user?.email || 'TM');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash + str.charCodeAt(i)) % colors.length;
    }
    return colors[hash];
  })();

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-[#181c21]">
      {/* Remote audio playback */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Remote video playback: muted so browser autoplay never blocks video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={() => setHasLiveVideo(true)}
        onPlaying={() => setHasLiveVideo(true)}
        onCanPlay={() => setHasLiveVideo(true)}
        className={`w-full h-full ${
          isPresentation ? 'object-contain transform-none bg-black' : 'object-cover'
        } transition-opacity duration-300 ${hasLiveVideo ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
      />

      {/* Google Meet / WhatsApp Centered Avatar Circle when video is off */}
      {!hasLiveVideo && (
        <div className="flex flex-col items-center justify-center p-4 text-center z-10 animate-in fade-in duration-200">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-tr ${avatarColor} text-white font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-2xl ring-4 ring-white/10 select-none`}>
            {initials}
          </div>
        </div>
      )}
    </div>
  );
};
