import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';
import {
    Camera, Printer, CreditCard, Wifi, HardDrive,
    CheckCircle2, XCircle, AlertTriangle, Loader2,
    RefreshCw, LogOut, Image, TrendingUp, Clock,
    Bell, Activity, Eye, EyeOff, RotateCcw
} from 'lucide-react';

// ─────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────
const statusColor = (s) =>
    s === 'OK' ? 'text-emerald-400' :
    s === 'FALLBACK' ? 'text-amber-400' :
    s === 'OFFLINE' || s === 'DISCONNECTED' ? 'text-red-400' :
    'text-white/40';

const statusBg = (s) =>
    s === 'OK' ? 'bg-emerald-500/10 border-emerald-500/20' :
    s === 'FALLBACK' ? 'bg-amber-500/10 border-amber-500/20' :
    s === 'OFFLINE' || s === 'DISCONNECTED' ? 'bg-red-500/10 border-red-500/20' :
    'bg-white/5 border-white/10';

const StatusDot = ({ status }) => (
    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
        status === 'OK' ? 'bg-emerald-400' :
        status === 'FALLBACK' ? 'bg-amber-400' :
        (status === 'OFFLINE' || status === 'DISCONNECTED') ? 'bg-red-400 animate-pulse' :
        'bg-white/20'
    }`} />
);

const OnlinePill = ({ status, secondsAgo }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border ${
        status === 'online' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
        status === 'slow' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
        'bg-red-500/15 border-red-500/30 text-red-400'
    }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
            status === 'online' ? 'bg-emerald-400' :
            status === 'slow' ? 'bg-amber-400 animate-pulse' :
            'bg-red-400 animate-pulse'
        }`} />
        {status === 'online' ? `Online · ${secondsAgo}s ago` :
         status === 'slow' ? `Slow · ${secondsAgo}s ago` :
         `Offline · ${secondsAgo}s ago`}
    </span>
);

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color = 'text-white' }) => (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">{label}</span>
            {Icon && <Icon size={14} className="text-white/20" />}
        </div>
        <div className={`text-3xl font-black tracking-tight ${color}`}>{value}</div>
        {sub && <div className="text-[11px] text-white/30 font-medium">{sub}</div>}
    </div>
);

// ─────────────────────────────────────────────
// HARDWARE ROW
// ─────────────────────────────────────────────
const HardwareRow = ({ icon: Icon, label, status, detail }) => (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusBg(status)}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === 'OK' ? 'bg-emerald-500/15' :
            status === 'FALLBACK' ? 'bg-amber-500/15' :
            'bg-red-500/15'
        }`}>
            <Icon size={15} className={statusColor(status)} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white/85">{label}</div>
            <div className="text-[11px] text-white/35 truncate">{detail || '—'}</div>
        </div>
        <StatusDot status={status} />
    </div>
);

// ─────────────────────────────────────────────
// SESSION STEP BADGE
// ─────────────────────────────────────────────
const SessionStep = ({ step, active }) => {
    const labels = {
        idle: { label: 'Idle', color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
        options: { label: 'Choosing Options', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        capture_1_of_4: { label: 'Capturing 1/4', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        capture_2_of_4: { label: 'Capturing 2/4', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        capture_3_of_4: { label: 'Capturing 3/4', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        capture_4_of_4: { label: 'Capturing 4/4', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        review: { label: 'Reviewing Photos', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        printing: { label: 'Printing Now', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    };
    const info = labels[step] || { label: step, color: 'text-white/40', bg: 'bg-white/5 border-white/10' };
    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${info.bg} ${info.color}`}>
            {step === 'printing' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {step !== 'idle' && active && step !== 'printing' && <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />}
            {info.label}
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────
const Dashboard = () => {
    const [key, setKey] = useState(() => localStorage.getItem('polaris_dash_key') || '');
    const [keyInput, setKeyInput] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [keyError, setKeyError] = useState(false);

    const [data, setData] = useState(null);
    const [prints, setPrints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef(null);

    // ── FETCH DATA ────────────────────────────
    const fetchDashboard = useCallback(async (isManual = false) => {
        if (!key) return;
        if (isManual) setRefreshing(true);
        else setLoading(prev => data === null ? true : prev);

        try {
            const [statusRes, printsRes] = await Promise.allSettled([
                axios.get(`${HOSTED_API_URL}/dashboard/status?key=${key}`, { timeout: 10000 }),
                axios.get(`${HOSTED_API_URL}/dashboard/prints?key=${key}`, { timeout: 10000 }),
            ]);

            if (statusRes.status === 'fulfilled') {
                setData(statusRes.value.data);
                setError(null);
                setLastRefresh(new Date());
                setUnlocked(true);
            } else {
                const status = statusRes.reason?.response?.status;
                if (status === 403) {
                    setKeyError(true);
                    setUnlocked(false);
                    localStorage.removeItem('polaris_dash_key');
                } else {
                    setError('Could not reach dashboard. Check internet.');
                }
            }

            if (printsRes.status === 'fulfilled') {
                setPrints(printsRes.value.data?.prints || []);
            }
        } catch {
            setError('Network error — retrying in 30s');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [key, data]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!key) return;
        fetchDashboard();
        intervalRef.current = setInterval(() => fetchDashboard(), 30000);
        return () => clearInterval(intervalRef.current);
    }, [key]);

    const handleUnlock = (e) => {
        e.preventDefault();
        if (!keyInput.trim()) return;
        setKey(keyInput.trim());
        localStorage.setItem('polaris_dash_key', keyInput.trim());
        setKeyError(false);
    };

    const handleLogout = () => {
        setKey('');
        setKeyInput('');
        setUnlocked(false);
        setData(null);
        localStorage.removeItem('polaris_dash_key');
        clearInterval(intervalRef.current);
    };

    const [restartConfirm, setRestartConfirm] = useState(false);
    const [restarting, setRestarting] = useState(false);
    const [restartMsg, setRestartMsg] = useState(null);

    const handleRestartKiosk = async (kioskId) => {
        setRestarting(true);
        setRestartMsg(null);
        try {
            await axios.post(`${HOSTED_API_URL}/dashboard/command?key=${encodeURIComponent(key)}`, {
                kiosk_id: kioskId,
                command: 'restart_app',
            });
            setRestartMsg('Restart queued — kiosk will kill backend & reboot within ~30s.');
            setRestartConfirm(false);
        } catch {
            setRestartMsg('Failed to queue restart command.');
        } finally {
            setRestarting(false);
        }
    };

    // ── LOCK SCREEN ───────────────────────────
    if (!key || keyError) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center p-6">
                <div className="w-full max-w-sm space-y-6">
                    <div className="text-center space-y-2">
                        <div className="text-[10px] font-bold tracking-[0.4em] text-white/20 uppercase">
                            Polaris Remote Dashboard
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter">
                            POLARIS<br />
                            <span className="text-polaris-primary">MONITOR</span>
                        </h1>
                        <p className="text-sm text-white/30">Enter your dashboard key to continue</p>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-3">
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={keyInput}
                                onChange={e => setKeyInput(e.target.value)}
                                placeholder="Dashboard key"
                                className={`w-full h-14 bg-white/5 border rounded-xl px-4 pr-12 text-white placeholder-white/20 focus:outline-none focus:border-polaris-primary/50 transition-colors font-mono text-sm ${
                                    keyError ? 'border-red-500/50' : 'border-white/10'
                                }`}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {keyError && (
                            <p className="text-xs text-red-400 font-medium">Incorrect key — check your DASHBOARD_SECRET</p>
                        )}
                        <button
                            type="submit"
                            className="w-full h-12 bg-polaris-primary text-white rounded-xl font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                        >
                            Unlock Dashboard
                        </button>
                    </form>

                    <p className="text-center text-[11px] text-white/20">
                        Key is set in Render environment variables as DASHBOARD_SECRET
                    </p>
                </div>
            </div>
        );
    }

    // ── LOADING ───────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Loader2 size={32} className="text-polaris-primary animate-spin mx-auto" />
                    <p className="text-white/40 text-sm">Loading kiosk status...</p>
                </div>
            </div>
        );
    }

    // ── DASHBOARD ─────────────────────────────
    const kioskEntries = data ? Object.values(data.kiosks || {}) : [];
    const summary = data?.summary || {};
    const kiosk = kioskEntries[0]; // Primary kiosk
    const st = kiosk?.status || {};

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white font-sans">
            {/* Subtle grid */}
            <div className="fixed inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative max-w-lg mx-auto px-4 pb-16 pt-6 space-y-5">

                {/* ── HEADER ── */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[9px] font-bold tracking-[0.4em] text-white/20 uppercase">Remote Monitor</div>
                        <h1 className="text-2xl font-black tracking-tighter text-white">POLARIS</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchDashboard(true)}
                            disabled={refreshing}
                            className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                            <RefreshCw size={14} className={`text-white/50 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut size={14} className="text-white/50" />
                        </button>
                    </div>
                </div>

                {/* Last refresh */}
                {lastRefresh && (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/25">
                        <Clock size={11} />
                        Last updated {lastRefresh.toLocaleTimeString('en-IN')} · auto-refreshes every 30s
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400 font-medium">
                        ⚠ {error}
                    </div>
                )}

                {/* ── NO KIOSK YET ── */}
                {kioskEntries.length === 0 && !error && (
                    <div className="bg-white/4 border border-white/8 rounded-2xl p-8 text-center space-y-2">
                        <Activity size={32} className="text-white/20 mx-auto" />
                        <p className="text-white/40 text-sm font-medium">Waiting for kiosk heartbeat...</p>
                        <p className="text-white/20 text-xs">Start the kiosk and it will appear here within 30 seconds</p>
                    </div>
                )}

                {kiosk && (<>

                    {/* ── KIOSK ONLINE STATUS ── */}
                    <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase mb-1">Kiosk</div>
                                <div className="text-base font-black text-white">{kiosk.kiosk_id}</div>
                            </div>
                            <OnlinePill status={kiosk.online_status} secondsAgo={kiosk.seconds_ago} />
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-white/30">
                            <span>v{kiosk.version}</span>
                            <span>·</span>
                            <span>{new Date(kiosk.timestamp * 1000).toLocaleTimeString('en-IN')}</span>
                        </div>

                        {/* Remote App + Backend Restart */}
                        <div className="pt-2 border-t border-white/8 space-y-2">
                            {!restartConfirm ? (
                                <button
                                    onClick={() => setRestartConfirm(true)}
                                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-amber-500/20 transition-colors"
                                >
                                    <RotateCcw size={13} />
                                    Restart Kiosk App & Backend
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleRestartKiosk(kiosk.kiosk_id)}
                                        disabled={restarting}
                                        className="flex-1 py-2.5 px-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider hover:bg-red-500/30 transition-colors"
                                    >
                                        {restarting ? 'Sending...' : 'Confirm Restart'}
                                    </button>
                                    <button
                                        onClick={() => setRestartConfirm(false)}
                                        className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                            {restartMsg && (
                                <p className="text-[11px] text-amber-300/80 text-center">{restartMsg}</p>
                            )}
                        </div>
                    </div>

                    {/* ── HARDWARE STATUS ── */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase px-1">Hardware</div>
                        <HardwareRow icon={Camera} label="Camera" status={st.camera} detail={st.camera_name} />
                        <HardwareRow icon={Printer} label="Printer (Color)" status={st.printer_color} detail={st.printer_color_name} />
                        <HardwareRow icon={Printer} label="Printer (B&W)" status={st.printer_bw} detail={st.printer_bw_name} />
                        <HardwareRow icon={Wifi} label="Internet" status={st.internet === 'CONNECTED' ? 'OK' : 'OFFLINE'} detail={st.internet} />
                        <HardwareRow icon={HardDrive} label="Disk Space" status={st.disk_free_gb > 5 ? 'OK' : st.disk_free_gb > 1 ? 'FALLBACK' : 'OFFLINE'} detail={`${st.disk_free_gb} GB free`} />
                    </div>

                    {/* ── LIVE SESSION ── */}
                    <div className="bg-white/4 border border-white/8 rounded-2xl p-4 space-y-3">
                        <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase">Live Session</div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60 font-medium">Status</span>
                            <SessionStep step={st.session_step || 'idle'} active={st.session_active} />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60 font-medium">Session Active</span>
                            <span className={`text-sm font-bold ${st.session_active ? 'text-emerald-400' : 'text-white/30'}`}>
                                {st.session_active ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>

                    {/* ── TODAY'S STATS ── */}
                    <div className="space-y-2">
                        <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase px-1">Today's Stats</div>
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard
                                label="Prints"
                                value={st.prints_today ?? '—'}
                                icon={Image}
                                color="text-blue-400"
                            />
                            <StatCard
                                label="Payments"
                                value={summary.successful_payments_today ?? '—'}
                                icon={CreditCard}
                                color="text-emerald-400"
                            />
                            <StatCard
                                label="Revenue"
                                value={summary.revenue_today_inr != null ? `₹${summary.revenue_today_inr}` : '—'}
                                icon={TrendingUp}
                                color="text-amber-400"
                            />
                        </div>
                    </div>

                    {/* ── PRINT GALLERY ── */}
                    {prints.length > 0 && (
                        <div className="space-y-3">
                            <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase px-1">Recent Prints</div>
                            <div className="grid grid-cols-2 gap-3">
                                {prints.slice(0, 6).map((p, i) => (
                                    <div key={i} className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                                        <img
                                            src={`data:image/jpeg;base64,${p.thumbnail}`}
                                            alt={`Print ${i + 1}`}
                                            className="w-full object-contain bg-black/30"
                                            style={{ aspectRatio: '1/2.5' }}
                                        />
                                        <div className="p-2">
                                            <div className="text-[10px] text-white/30 font-medium">
                                                {new Date(p.timestamp * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ngrok camera preview */}
                    {st.ngrok_url && (
                        <div className="space-y-2">
                            <div className="text-[10px] font-bold tracking-widest text-white/25 uppercase px-1">Live Camera</div>
                            <div className="rounded-2xl overflow-hidden border border-white/8 bg-black">
                                <img
                                    src={`${st.ngrok_url}/camera/stream`}
                                    alt="Live camera"
                                    className="w-full"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                                <div className="px-4 py-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] text-white/40 font-bold tracking-widest uppercase">Live via ngrok</span>
                                </div>
                            </div>
                        </div>
                    )}

                </>)}

                {/* ── FOOTER ── */}
                <div className="text-center pt-4">
                    <p className="text-[10px] text-white/15 tracking-widest uppercase">
                        Polaris.co · Remote Monitor
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

