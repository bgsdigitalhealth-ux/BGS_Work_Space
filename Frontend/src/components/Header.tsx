import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  RefreshCw,
  LogOut,
  Menu,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  MessageSquare,
  Mail,
  Phone,
  Send,
  ShieldAlert,
  Check,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { NotificationDropdown } from './NotificationDropdown';

export const Header: React.FC = () => {
  const {
    refreshAll,
    currentUser,
    logout,
    unreadNotificationCount,
    setMobileSidebarOpen,
    adminToast,
    setAdminToast,
    setAdminNav,
    wppStatus,
    fetchWppStatus,
    restartWpp
  } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWppModal, setShowWppModal] = useState(false);
  const [wppModalTab, setWppModalTab] = useState<'status' | 'messages' | 'alerts'>('status');
  const [storedMessages, setStoredMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [flushingQueue, setFlushingQueue] = useState(false);
  const [flushResult, setFlushResult] = useState<string | null>(null);
  const [restartingWpp, setRestartingWpp] = useState(false);

  // Alert Settings State
  const [alertSettings, setAlertSettings] = useState<any>(null);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [testingAlerts, setTestingAlerts] = useState(false);
  const [testChannel, setTestChannel] = useState<'all' | 'email' | 'sms' | 'push'>('all');
  const [testAlertResult, setTestAlertResult] = useState<any>(null);
  const [saveAlertSuccess, setSaveAlertSuccess] = useState(false);

  const fetchStoredMessages = async () => {
    try {
      setLoadingMessages(true);
      const msgs = await api.getWppMessages();
      setStoredMessages(msgs || []);
    } catch (e) {
      console.warn('Failed to load WPP messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      const data = await api.getWppAlertSettings();
      setAlertSettings(data);
    } catch (e) {
      console.warn('Failed to load WPP alert settings:', e);
    }
  };

  const handleOpenWppModal = () => {
    fetchWppStatus();
    fetchStoredMessages();
    fetchAlertSettings();
    setShowWppModal(true);
  };

  const handleRestartWpp = async (clean: boolean = false) => {
    try {
      setRestartingWpp(true);
      await restartWpp(clean);
      const pollDelays = [1500, 3000, 5000, 8000, 12000];
      pollDelays.forEach(delay => {
        setTimeout(async () => {
          await fetchWppStatus();
          await fetchStoredMessages();
        }, delay);
      });
      setTimeout(() => setRestartingWpp(false), 3500);
    } catch (e) {
      setRestartingWpp(false);
    }
  };

  const handleFlushQueue = async () => {
    try {
      setFlushingQueue(true);
      setFlushResult(null);
      const res = await api.flushWppQueue();
      setFlushResult(res.message || 'Queue flush initiated.');
      await fetchWppStatus();
      await fetchStoredMessages();
      setTimeout(() => setFlushResult(null), 4000);
    } catch (e: any) {
      setFlushResult(e.message || 'Failed to flush queue');
    } finally {
      setFlushingQueue(false);
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!alertSettings) return;
    try {
      setSavingAlerts(true);
      setSaveAlertSuccess(false);
      const res = await api.updateWppAlertSettings(alertSettings);
      if (res?.settings) {
        setAlertSettings(res.settings);
      }
      setSaveAlertSuccess(true);
      setTimeout(() => setSaveAlertSuccess(false), 3000);
    } catch (e: any) {
      alert('Failed to save alert settings: ' + e.message);
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleSendTestAlert = async () => {
    try {
      setTestingAlerts(true);
      setTestAlertResult(null);
      const res = await api.sendWppAlertTest(testChannel);
      setTestAlertResult(res);
      await fetchAlertSettings();
    } catch (e: any) {
      setTestAlertResult({ success: false, error: e.message });
    } finally {
      setTestingAlerts(false);
    }
  };

  const handleTogglePush = async (checked: boolean) => {
    if (!alertSettings) return;
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          alert('Browser push notification permission was not granted. In-app dashboard notifications will still be active.');
        }
      }
    }
    setAlertSettings({
      ...alertSettings,
      channels: {
        ...alertSettings.channels,
        push: {
          ...alertSettings.channels?.push,
          enabled: checked
        }
      }
    });
  };

  const isWppReady = wppStatus?.isReady || wppStatus?.status === 'CONNECTED' || wppStatus?.status === 'isLogged' || wppStatus?.status === 'inChat' || wppStatus?.status === 'chatsAvailable';
  const isWppReconnecting = wppStatus?.status === 'RECONNECTING' || Boolean(wppStatus?.isReconnecting);
  const hasWppQr = Boolean(wppStatus?.hasQr || wppStatus?.qrCode || wppStatus?.status === 'QR_READY');
  const isWppActionRequired = wppStatus?.status === 'ACTION_REQUIRED' || (!isWppReady && hasWppQr);

  const messageList = (storedMessages && storedMessages.length > 0) ? storedMessages : (wppStatus?.messages || []);
  const pendingCount = messageList.filter((m: any) => m.status === 'pending').length;

  return (
    <>
      {/* Real-time Floating Admin Notification Toast Banner */}
      {adminToast && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-indigo-200 shadow-2xl shadow-indigo-900/20 flex items-start gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 animate-pulse" />
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                  Live Alert
                </span>
                <span className="text-[11px] text-slate-400">Just now</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                {adminToast.title}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {adminToast.message}
              </p>
            </div>
            <button
              onClick={() => setAdminToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition absolute top-3 right-3 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Trigger & Quick Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Workspace Hub</span>
          </div>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WhatsApp Notification Service Status Pill & Modal Launcher */}
          <button
            type="button"
            onClick={handleOpenWppModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
              isWppReady
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                : isWppReconnecting
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80'
                : isWppActionRequired
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Manage automated WhatsApp delivery, background reconnection, and disconnection alerts"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">WhatsApp:</span>
            <span className="font-bold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isWppReady
                  ? 'bg-emerald-500 animate-pulse'
                  : isWppReconnecting
                  ? 'bg-blue-500 animate-ping'
                  : isWppActionRequired
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`} />
              {isWppReady ? 'Connected' : isWppReconnecting ? 'Reconnecting' : isWppActionRequired ? 'Action Required' : 'Disconnected'}
            </span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Quick Refresh All Data */}
          <button
            type="button"
            onClick={refreshAll}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <NotificationDropdown isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.avatar || currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{currentUser?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{currentUser?.role || 'Member'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setAdminNav('profile');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                >
                  My Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-red-600 font-semibold hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- MODAL: WHATSAPP CONNECT & QR CODE VIEWER --- */}
      {showWppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            <button
              onClick={() => setShowWppModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">WhatsApp Notification Service</h3>
                <p className="text-xs text-slate-500">Automated WhatsApp delivery, auto-reconnection & alert monitors</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
              <button
                type="button"
                onClick={() => setWppModalTab('status')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  wppModalTab === 'status'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Connection & QR</span>
                <span className={`w-2 h-2 rounded-full ${isWppReady ? 'bg-emerald-300' : isWppReconnecting ? 'bg-blue-300 animate-ping' : isWppActionRequired ? 'bg-amber-300' : 'bg-slate-300'}`} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setWppModalTab('messages');
                  fetchStoredMessages();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  wppModalTab === 'messages'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Stored Messages Log</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                  {messageList.length}
                </span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                    {pendingCount} queued
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setWppModalTab('alerts');
                  fetchAlertSettings();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  wppModalTab === 'alerts'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Disconnection Alerts</span>
                <span className={`w-2 h-2 rounded-full ${alertSettings?.enabled ? 'bg-emerald-300' : 'bg-slate-300'}`} />
              </button>
            </div>

            {/* TAB 1: CONNECTION & QR CODE */}
            {wppModalTab === 'status' && (
              <div className="overflow-y-auto flex-1 pr-1">
                {/* Current Status Box */}
                <div className={`p-4 rounded-2xl border mb-5 flex items-center justify-between gap-3 ${
                  isWppReady
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : isWppReconnecting
                    ? 'bg-blue-50/70 border-blue-200'
                    : isWppActionRequired
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isWppReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : isWppReconnecting ? (
                      <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
                    ) : isWppActionRequired ? (
                      <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Status:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isWppReady
                            ? 'bg-emerald-100 text-emerald-700'
                            : isWppReconnecting
                            ? 'bg-blue-100 text-blue-700'
                            : isWppActionRequired
                            ? 'bg-amber-100 text-amber-800'
                            : wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isWppReady
                            ? 'Connected & Ready'
                            : isWppReconnecting
                            ? `Reconnecting (Attempt ${wppStatus?.reconnectAttempts || 1})`
                            : isWppActionRequired
                            ? 'Action Required'
                            : wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING'
                            ? 'Starting Browser...'
                            : 'Disconnected'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isWppReady
                          ? 'Automated WhatsApp alerts are active for all Meeting, Event, and Work assignments.'
                          : isWppReconnecting
                          ? 'Automatic background reconnection is in progress with bounded exponential backoff.'
                          : isWppActionRequired
                          ? 'Scan the live QR code below on your phone to link your WhatsApp session.'
                          : wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING'
                          ? 'Initializing headless browser engine and preparing WhatsApp Web QR code...'
                          : 'Session disconnected. Click restart to start the session, or wait for background reconnection.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRestartWpp(false)}
                    disabled={restartingWpp}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${restartingWpp ? 'animate-spin' : ''}`} />
                    <span>{restartingWpp ? 'Restarting...' : 'Restart'}</span>
                  </button>
                </div>

                {/* Diagnostic Notice if Backend reports an error */}
                {wppStatus?.lastError && !isWppReady && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 mb-4 text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-[11px] uppercase tracking-wider text-amber-800">
                          Backend Initialization Notice
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRestartWpp(true)}
                          disabled={restartingWpp}
                          className="text-[10px] text-indigo-700 hover:text-indigo-950 font-bold underline cursor-pointer"
                        >
                          Clean Reset & Retry
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-900/90 font-mono mt-1 break-words bg-white/70 p-2 rounded-lg border border-amber-200/50">
                        {wppStatus.lastError}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1.5">
                        Note: Cloud container instances without Google Chrome or display libraries require Puppeteer bundled Chromium with sandbox bypass flags.
                      </p>
                    </div>
                  </div>
                )}

                {/* QR Code Presentation */}
                {isWppActionRequired && hasWppQr && wppStatus?.qrCode ? (
                  <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
                    <p className="text-xs font-bold text-slate-800 mb-3">Scan this QR Code with WhatsApp</p>
                    <div className="inline-block p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                      <img
                        src={wppStatus.qrCode.startsWith('data:') ? wppStatus.qrCode : `data:image/png;base64,${wppStatus.qrCode}`}
                        alt="WhatsApp QR Code"
                        className="w-56 h-56 object-contain rounded-xl"
                      />
                    </div>
                    <div className="mt-4 text-left text-xs text-slate-600 space-y-1.5 max-w-xs mx-auto">
                      <p className="font-semibold text-slate-800">How to link:</p>
                      <p>1. Open WhatsApp on your phone</p>
                      <p>2. Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> &gt; <strong>Linked Devices</strong></p>
                      <p>3. Tap <strong>Link a Device</strong> and point your camera here</p>
                    </div>
                  </div>
                ) : isWppReady ? (
                  <div className="text-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-200 mb-5">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-900">WhatsApp is Linked & Active!</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      Work requests, meetings, and events submitted from the landing page and dashboard will automatically send receipts to the Sender Number and review notices to the Receiver Number.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Delivered</span>
                        <span className="text-lg font-bold text-slate-900">{wppStatus?.sentMessages ?? 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-emerald-100 shadow-xs">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">In Queue</span>
                        <span className="text-lg font-bold text-slate-900">{wppStatus?.pendingMessages ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ) : isWppReconnecting ? (
                  <div className="text-center p-6 bg-blue-50/50 rounded-2xl border border-blue-200 mb-5">
                    <RefreshCw className="w-10 h-10 text-blue-600 mx-auto mb-2 animate-spin" />
                    <h4 className="font-bold text-sm text-slate-900">Background Reconnection Active</h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                      The server is automatically attempting to restore the WhatsApp session using saved authentication credentials with bounded exponential backoff.
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                      <span>Attempt #{wppStatus?.reconnectAttempts || 1}</span>
                      <span>•</span>
                      <span>{pendingCount} messages held in durable queue</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
                    <p className="text-xs text-slate-600 mb-3">
                      {wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING'
                        ? 'Starting headless browser process and waiting for WhatsApp Web QR code...'
                        : 'Click start to launch the WPPConnect session and generate a fresh live QR code.'}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestartWpp(false)}
                        disabled={restartingWpp || wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING'}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
                      >
                        {restartingWpp || wppStatus?.status === 'RESTARTING' || wppStatus?.status === 'CONNECTING' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Starting Session...</span>
                          </>
                        ) : (
                          <span>Start WhatsApp Session</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRestartWpp(true)}
                        disabled={restartingWpp}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium transition cursor-pointer"
                        title="Clear lock files and attempt fresh start"
                      >
                        Clean Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STORED MESSAGES LOG */}
            {wppModalTab === 'messages' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Showing latest {messageList.length} stored WhatsApp notifications
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                        ⚠️ {pendingCount} queued
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFlushQueue}
                      disabled={flushingQueue || pendingCount === 0}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold cursor-pointer disabled:opacity-50 transition border border-emerald-200 shadow-2xs"
                      title="Send all pending messages immediately"
                    >
                      <Send className={`w-3 h-3 ${flushingQueue ? 'animate-pulse' : ''}`} />
                      <span>{flushingQueue ? 'Sending...' : 'Flush Queue'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={fetchStoredMessages}
                      disabled={loadingMessages}
                      className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-800 font-semibold cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingMessages ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {flushResult && (
                  <div className="p-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{flushResult}</span>
                  </div>
                )}

                {messageList.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No WhatsApp messages stored yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                      Submit a Meeting, Event, or General Info work request with valid phone numbers to see delivery logs here.
                    </p>
                  </div>
                ) : (
                  messageList.map((msg: any, idx: number) => (
                    <div
                      key={msg.id || idx}
                      className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-emerald-200 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">
                            {msg.formType || 'Work Request'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            msg.recipientType === 'sender'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {msg.recipientType || 'recipient'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-800">
                            {msg.name || 'User'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({msg.to})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {msg.retries > 0 && msg.status === 'pending' && (
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Retry #{msg.retries}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            msg.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {msg.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {msg.text}
                      </div>

                      {msg.lastError && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 text-[10px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Last Error: {msg.lastError}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Ref: {msg.referenceId || 'N/A'}</span>
                        <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Just now'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: DISCONNECTION ALERT SETTINGS */}
            {wppModalTab === 'alerts' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                {/* Header banner */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900">Disconnection Alerts & Incident Monitoring</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Monitors session connectivity server-side so administrators are immediately notified when the WhatsApp session disconnects. Deduplicated by incident to prevent alert spam.
                    </p>
                  </div>
                </div>

                {/* Master Alerts Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enable Disconnection Alerts</p>
                    <p className="text-[11px] text-slate-500">Dispatch notifications when WhatsApp unexpectedly goes offline</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(alertSettings?.enabled)}
                      onChange={e => setAlertSettings({ ...alertSettings, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Channel 1: Email Alert */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">Email Notifications</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {alertSettings?.providers?.email?.configured ? (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-700">
                              ✓ Ready ({alertSettings?.providers?.email?.provider})
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                              ⚠️ Setup required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(alertSettings?.channels?.email?.enabled)}
                        onChange={e => setAlertSettings({
                          ...alertSettings,
                          channels: {
                            ...alertSettings?.channels,
                            email: { ...alertSettings?.channels?.email, enabled: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="admin@hospital.org"
                      value={alertSettings?.channels?.email?.recipient || ''}
                      onChange={e => setAlertSettings({
                        ...alertSettings,
                        channels: {
                          ...alertSettings?.channels,
                          email: { ...alertSettings?.channels?.email, recipient: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    {!alertSettings?.providers?.email?.configured && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        Missing environment variables: {alertSettings?.providers?.email?.missing?.join(', ')}. Configure in Backend/.env.
                      </p>
                    )}
                  </div>
                </div>

                {/* Channel 2: SMS Alert */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">SMS Notifications</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {alertSettings?.providers?.sms?.configured ? (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-700">
                              ✓ Ready (Twilio)
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800">
                              ⚠️ Setup required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(alertSettings?.channels?.sms?.enabled)}
                        onChange={e => setAlertSettings({
                          ...alertSettings,
                          channels: {
                            ...alertSettings?.channels,
                            sms: { ...alertSettings?.channels?.sms, enabled: e.target.checked }
                          }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Recipient Mobile Number (with country code)
                    </label>
                    <input
                      type="tel"
                      placeholder="+919876543210"
                      value={alertSettings?.channels?.sms?.recipient || ''}
                      onChange={e => setAlertSettings({
                        ...alertSettings,
                        channels: {
                          ...alertSettings?.channels,
                          sms: { ...alertSettings?.channels?.sms, recipient: e.target.value }
                        }
                      })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {!alertSettings?.providers?.sms?.configured && (
                      <p className="text-[10px] text-amber-700 mt-1">
                        Missing environment variables: {alertSettings?.providers?.sms?.missing?.join(', ')}. Configure in Backend/.env.
                      </p>
                    )}
                  </div>
                </div>

                {/* Channel 3: In-App & Browser Push */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800">In-App & Browser Push</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-700">
                            ✓ Ready (Socket.IO & Web Notification)
                          </span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(alertSettings?.channels?.push?.enabled)}
                        onChange={e => handleTogglePush(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Delivers real-time floating banners and bell notifications on admin dashboards. Requests browser permission when enabled.
                  </p>
                </div>

                {/* Action Controls: Save & Test Alert */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAlertSettings}
                      disabled={savingAlerts}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingAlerts ? 'Saving...' : saveAlertSuccess ? '✓ Settings Saved!' : 'Save Settings'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={testChannel}
                        onChange={(e: any) => setTestChannel(e.target.value)}
                        className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="all">Test All Channels</option>
                        <option value="email">Test Email</option>
                        <option value="sms">Test SMS</option>
                        <option value="push">Test Push</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleSendTestAlert}
                        disabled={testingAlerts}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3 text-indigo-600" />
                        <span>{testingAlerts ? 'Testing...' : 'Send Test'}</span>
                      </button>
                    </div>
                  </div>

                  {testAlertResult && (
                    <div className={`p-3 rounded-xl text-xs border ${
                      testAlertResult.success
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50/80 border-rose-200 text-rose-800'
                    }`}>
                      <p className="font-bold mb-1">
                        {testAlertResult.success ? '✓ Test Alert Executed' : '⚠️ Test Alert Warning'}
                      </p>
                      {testAlertResult.results ? (
                        <div className="space-y-1 text-[11px]">
                          {Object.entries(testAlertResult.results).map(([ch, res]: [string, any]) => (
                            <div key={ch} className="flex items-center justify-between">
                              <span className="font-semibold uppercase">{ch}:</span>
                              <span>{res.success ? '✓ Delivered' : res.error || 'Failed'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px]">{testAlertResult.error || 'Test alert finished.'}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Disconnection Alert Incidents Log */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Recent Disconnection Incidents & Delivery Log</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Last incident: {alertSettings?.lastAlertIncidentId || 'None'}
                    </span>
                  </h5>

                  {(!alertSettings?.alertHistory || alertSettings.alertHistory.length === 0) ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No disconnection alert events logged yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {alertSettings.alertHistory.slice(0, 5).map((log: any) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white text-[11px] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              log.channel === 'email'
                                ? 'bg-blue-100 text-blue-700'
                                : log.channel === 'sms'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {log.channel}
                            </span>
                            <span className="font-medium text-slate-800 truncate max-w-[180px]">
                              {log.recipient}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              log.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-700'
                                : log.status === 'skipped'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}>
                              {log.status}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-3">
              <button
                type="button"
                onClick={() => setShowWppModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
