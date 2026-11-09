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
  ArrowRight,
  MessageSquare
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
  const [wppModalTab, setWppModalTab] = useState<'status' | 'messages'>('status');
  const [storedMessages, setStoredMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [restartingWpp, setRestartingWpp] = useState(false);

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

  const handleOpenWppModal = () => {
    fetchWppStatus();
    fetchStoredMessages();
    setShowWppModal(true);
  };

  const handleRestartWpp = async () => {
    try {
      setRestartingWpp(true);
      await restartWpp();
      setTimeout(async () => {
        await fetchWppStatus();
        await fetchStoredMessages();
        setRestartingWpp(false);
      }, 2000);
    } catch (e) {
      setRestartingWpp(false);
    }
  };

  const isWppReady = wppStatus?.isReady || wppStatus?.status === 'CONNECTED' || wppStatus?.status === 'isLogged' || wppStatus?.status === 'inChat';
  const hasWppQr = Boolean(wppStatus?.hasQr || wppStatus?.qrCode || wppStatus?.status === 'QR_READY');
  const messageList = (storedMessages && storedMessages.length > 0) ? storedMessages : (wppStatus?.messages || []);

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
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdminToast(null);
                    setAdminNav('appointments');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>View in Appointments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAdminToast(null)}
                  className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAdminToast(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 lg:hidden shadow-xs shrink-0 cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome, {currentUser?.name || 'Admin'} <span className="inline-block animate-pulse">👋</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage departments, teams, members, roles, requests, and daily work.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 relative flex-wrap sm:flex-nowrap">
          {/* WhatsApp Connection Status Trigger (Issue 10) */}
          <button
            type="button"
            onClick={handleOpenWppModal}
            aria-haspopup="dialog"
            title="WhatsApp Integration Status (WPPConnect) - Click to view status & QR code"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/90 text-xs font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isWppReady ? 'bg-emerald-500' : hasWppQr ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
              }`}
              aria-hidden="true"
            />
            <span className="hidden md:inline text-slate-500">WhatsApp:</span>
            <span className={isWppReady ? 'text-emerald-700 font-semibold' : hasWppQr ? 'text-amber-700 font-semibold' : 'text-slate-600 font-medium'}>
              {isWppReady ? 'Connected' : hasWppQr ? 'Scan QR' : 'Offline'}
            </span>
            {hasWppQr ? (
              <QrCode className="w-3.5 h-3.5 ml-0.5 text-amber-600" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={() => refreshAll()}
            title="Refresh Data"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-all shadow-sm border border-slate-200/70 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-sm border border-slate-200/70 cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
            <NotificationDropdown isOpen={showNotifs} onClose={() => setShowNotifs(false)} />
          </div>

          {/* User Profile */}
          <div className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 bg-white pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200/70 shadow-sm cursor-pointer hover:bg-slate-50 transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {currentUser?.avatar || 'A'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">{currentUser?.name || 'Admin'}</span>
                <span className="text-[10px] text-slate-400 font-medium block">Admin Role</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
            </div>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-900">{currentUser?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email || 'dynamicsajjan@gmail.com'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    setAdminNav('settings');
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
                >
                  Admin Settings
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
                <p className="text-xs text-slate-500">Automated WhatsApp delivery via WPPConnect</p>
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
                <span className={`w-2 h-2 rounded-full ${isWppReady ? 'bg-emerald-300' : hasWppQr ? 'bg-amber-300' : 'bg-slate-300'}`} />
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
              </button>
            </div>

            {/* TAB 1: CONNECTION & QR CODE */}
            {wppModalTab === 'status' && (
              <div className="overflow-y-auto flex-1 pr-1">
                {/* Current Status Box */}
                <div className={`p-4 rounded-2xl border mb-5 flex items-center justify-between gap-3 ${
                  isWppReady
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : hasWppQr
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {isWppReady ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : hasWppQr ? (
                      <QrCode className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Status: {isWppReady ? 'Connected & Ready' : hasWppQr ? 'Ready to Scan' : wppStatus?.status || 'Offline'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isWppReady
                          ? 'Automated WhatsApp alerts are active for all Meeting, Event, and General Info submissions.'
                          : hasWppQr
                          ? 'Scan the QR code below on your phone to link your WhatsApp account.'
                          : 'Session disconnected. Click restart to generate a fresh QR code.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestartWpp}
                    disabled={restartingWpp}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {restartingWpp ? 'Restarting...' : 'Restart'}
                  </button>
                </div>

                {/* QR Code Presentation */}
                {hasWppQr && wppStatus?.qrCode ? (
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
                      Work requests submitted from the landing page will instantly send delivery receipts to the Sender Number and review notices to the Receiver Number.
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
                ) : (
                  <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
                    <p className="text-xs text-slate-600 mb-3">
                      Click restart to start the WPPConnect session and display the live QR code.
                    </p>
                    <button
                      type="button"
                      onClick={handleRestartWpp}
                      disabled={restartingWpp}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {restartingWpp ? 'Starting Session...' : 'Start WhatsApp Session'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: STORED MESSAGES LOG */}
            {wppModalTab === 'messages' && (
              <div className="overflow-y-auto flex-1 pr-1 space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-700">
                    Showing latest {messageList.length} stored WhatsApp notifications
                  </span>
                  <button
                    type="button"
                    onClick={fetchStoredMessages}
                    disabled={loadingMessages}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingMessages ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

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

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          msg.status === 'sent'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {msg.status || 'pending'}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {msg.text}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Ref: {msg.referenceId || 'N/A'}</span>
                        <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Just now'}</span>
                      </div>
                    </div>
                  ))
                )}
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
