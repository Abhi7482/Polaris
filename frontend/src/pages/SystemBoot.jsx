import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HOSTED_API_URL } from '../config';
import {
    Camera, Printer, CreditCard, Cpu, CheckCircle2,
    XCircle, Loader2, AlertTriangle, ChevronRight, Wifi
} from 'lucide-react';

// ─────────────────────────────────────────────
// CHECK DEFINITIONS — order matters, runs top to bottom
// ─────────────────────────────────────────────
const CHECKS = [
    {
        id: 'local_backend',
        label: 'Local Backend',
        sublabel: 'FastAPI service on port 8000',
        icon: Cpu,
        group: 'system',
    },
    {
        id: 'camera',
        label: 'Camera',
        sublabel: 'USB capture device — CEVCECM / Sony',
        icon: Camera,
        group: 'hardware',
    },
    {
        id: 'printer_color',
        label: 'Printer (Color)',
        sublabel: 'EPSON L3210 Series — color queue',
        icon: Printer,
        group: 'hardware',
    },
    {
        id: 'printer_bw',
        label: 'Printer (B&W)',
        sublabel: 'EPSON L3210 BW — grayscale queue',
        icon: Printer,
        group: 'hardware',
    },
    {
        id: 'internet',
        label: 'Internet Connection',
        sublabel: 'Required for payment processing',
        icon: Wifi,
        group: 'network',
    },
    {
        id: 'payment_gateway',
        label: 'Payment Gateway',
        sublabel: 'PhonePe / Polaris cloud backend',
        icon: CreditCard,
        group: 'network',
    },
    {
        id: 'print_pipeline',
        label: 'Print Pipeline',
        sublabel: 'End-to-end: capture → process → print',
        icon: Printer,
        group: 'system',
    },
];

const STATUS = { PENDING: 'pending', RUNNING: 'running', OK: 'ok', WARN: 'warn', FAIL: 'fail' };

// ─────────────────────────────────────────────
// STATUS ICON COMPONENT
// ─────────────────────────────────────────────
const StatusIcon = ({ status }) => {
    if (status === STATUS.RUNNING)
        return <Loader2 size={20} className="text-blue-500 animate-spin" />;
    if (status === STATUS.OK)
        return <CheckCircle2 size={20} className="text-emerald-500" />;
    if (status === STATUS.WARN)
        return <AlertTriangle size={20} className="text-amber-400" />;
    if (status === STATUS.FAIL)
        return <XCircle size={20} className="text-red-500" />;
    return <div className="w-5 h-5 rounded-full border-2 border-polaris-muted/20" />;
};

// ─────────────────────────────────────────────
// CAMERA PREVIEW PANEL
// ─────────────────────────────────────────────
const CameraPreviewPanel = ({ visible, cameraStatus }) => {
    if (!visible) return null;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
            style={{ aspectRatio: '16/9' }}
        >
            <img
                src="http://localhost:8000/camera/stream"
                alt="Live Camera Preview"
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror for natural feel
            />

            {/* Viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                {[
                    'top-3 left-3 border-t-2 border-l-2 rounded-tl-lg',
                    'top-3 right-3 border-t-2 border-r-2 rounded-tr-lg',
                    'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg',
                    'bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg',
                ].map((cls, i) => (
                    <div key={i} className={`absolute w-6 h-6 border-white/70 ${cls}`} />
                ))}

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="relative w-16 h-16">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-white" />
                        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
                    </div>
                </div>

                {/* Live badge */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-[10px] font-bold tracking-widest uppercase">Live Preview</span>
                </div>

                {/* Status label */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                        {cameraStatus?.name || 'Camera'}
                    </span>
                    <span className="text-white/60 text-[10px] font-bold tracking-widest uppercase">
                        Adjust angle now ↑
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────
// MAIN BOOT SCREEN
// ─────────────────────────────────────────────
const SystemBoot = () => {
    const navigate = useNavigate();

    // State for each check's result: { status, detail }
    const [results, setResults] = useState(() =>
        Object.fromEntries(CHECKS.map(c => [c.id, { status: STATUS.PENDING, detail: '' }]))
    );

    const [currentCheckIdx, setCurrentCheckIdx] = useState(-1);   // which check is running
    const [showCamera, setShowCamera] = useState(false);           // show camera preview panel
    const [cameraInfo, setCameraInfo] = useState(null);            // camera name from health
    const [allDone, setAllDone] = useState(false);                 // all checks complete
    const [criticalFail, setCriticalFail] = useState(false);       // hard failure
    const [logs, setLogs] = useState([]);                          // terminal log lines
    const [canProceed, setCanProceed] = useState(false);
    const logsEndRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const addLog = (msg, level = 'info') => {
        const ts = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [...prev, { ts, msg, level }]);
    };

    const setResult = (id, status, detail = '') => {
        setResults(prev => ({ ...prev, [id]: { status, detail } }));
    };

    // ─────────────────────────────────────────────
    // RUN ALL CHECKS SEQUENTIALLY
    // ─────────────────────────────────────────────
    useEffect(() => {
        const runChecks = async () => {
            addLog('Polaris System Boot — starting diagnostics...', 'system');
            await new Promise(r => setTimeout(r, 600));

            // ── 1. LOCAL BACKEND ──────────────────────────────
            setCurrentCheckIdx(0);
            setResult('local_backend', STATUS.RUNNING);
            addLog('[1/7] Pinging local FastAPI backend on :8000...');
            try {
                const res = await axios.get('http://localhost:8000/health', { timeout: 5000 });
                const data = res.data;
                setResult('local_backend', STATUS.OK, `v${data.version || '1.0'} · ${data.uptime_seconds?.toFixed(0) || '?'}s uptime`);
                addLog('✓ Local backend online.', 'ok');

                // ── 2. CAMERA ─────────────────────────────────
                setCurrentCheckIdx(1);
                setResult('camera', STATUS.RUNNING);
                addLog('[2/7] Checking camera hardware...');
                await new Promise(r => setTimeout(r, 300));

                const cam = data.camera;
                setCameraInfo({ name: cam.name, mode: cam.mode });

                if (!cam.connected) {
                    setResult('camera', STATUS.FAIL, 'No camera device found');
                    addLog('✗ Camera not detected — check USB connection.', 'error');
                    setCriticalFail(true);
                } else if (cam.mode === 'stock_photo_fallback') {
                    setResult('camera', STATUS.WARN, `Fallback mode — ${cam.name}`);
                    addLog(`⚠ Camera in stock-photo fallback mode: ${cam.name}`, 'warn');
                    setShowCamera(true); // show even in fallback
                } else {
                    setResult('camera', STATUS.OK, cam.name);
                    addLog(`✓ Camera OK: ${cam.name}`, 'ok');
                    setShowCamera(true);
                    addLog('  ↳ Live preview active — please adjust camera angle now.', 'info');
                    await new Promise(r => setTimeout(r, 4000)); // 4 seconds to adjust
                }

                // ── 3. PRINTER COLOR ──────────────────────────
                setCurrentCheckIdx(2);
                setResult('printer_color', STATUS.RUNNING);
                addLog('[3/7] Checking Color printer queue...');
                await new Promise(r => setTimeout(r, 300));

                const pColor = data.printers?.color;
                if (pColor?.found) {
                    setResult('printer_color', STATUS.OK, pColor.name);
                    addLog(`✓ Color printer: ${pColor.name}`, 'ok');
                } else {
                    setResult('printer_color', STATUS.FAIL, 'EPSON L3210 Series not found');
                    addLog('✗ Color printer not found in Windows queue.', 'error');
                    setCriticalFail(true);
                }

                // ── 4. PRINTER BW ─────────────────────────────
                setCurrentCheckIdx(3);
                setResult('printer_bw', STATUS.RUNNING);
                addLog('[4/7] Checking B&W printer queue...');
                await new Promise(r => setTimeout(r, 300));

                const pBW = data.printers?.bw;
                if (pBW?.found) {
                    setResult('printer_bw', STATUS.OK, pBW.name);
                    addLog(`✓ B&W printer: ${pBW.name}`, 'ok');
                } else {
                    setResult('printer_bw', STATUS.WARN, 'EPSON L3210 BW not found — BW prints will fallback to Color printer');
                    addLog('⚠ B&W printer queue not found. BW prints will use Color printer.', 'warn');
                }

            } catch (err) {
                setResult('local_backend', STATUS.FAIL, 'Cannot reach localhost:8000');
                addLog('✗ Local backend unreachable — is it running?', 'error');
                // mark remaining hardware checks as failed
                setResult('camera', STATUS.FAIL, 'Backend offline');
                setResult('printer_color', STATUS.FAIL, 'Backend offline');
                setResult('printer_bw', STATUS.FAIL, 'Backend offline');
                setCurrentCheckIdx(3);
                setCriticalFail(true);
            }

            // ── 5. INTERNET ───────────────────────────────────
            setCurrentCheckIdx(4);
            setResult('internet', STATUS.RUNNING);
            addLog('[5/7] Checking internet connectivity...');
            try {
                await axios.get('https://polaris-hosted-backend.onrender.com/', { timeout: 8000 });
                setResult('internet', STATUS.OK, 'Connected');
                addLog('✓ Internet connection OK.', 'ok');
            } catch {
                setResult('internet', STATUS.FAIL, 'No internet — payments will not work');
                addLog('✗ Internet unreachable — payment gateway will fail.', 'error');
                setCriticalFail(true);
            }

            // ── 6. PAYMENT GATEWAY ────────────────────────────
            setCurrentCheckIdx(5);
            setResult('payment_gateway', STATUS.RUNNING);
            addLog('[6/7] Pinging payment gateway (Render cloud)...');
            try {
                const pgRes = await axios.get(`${HOSTED_API_URL}/health`, { timeout: 10000 });
                const pgData = pgRes.data;
                if (pgData.phonepe_sdk_initialized) {
                    setResult('payment_gateway', STATUS.OK, `PhonePe SDK active · ${pgData.env || 'PRODUCTION'}`);
                    addLog(`✓ Payment gateway online. PhonePe SDK: ${pgData.env}.`, 'ok');
                } else {
                    setResult('payment_gateway', STATUS.WARN, 'Cloud online but PhonePe SDK not initialized');
                    addLog('⚠ Cloud backend reachable but PhonePe SDK not ready.', 'warn');
                }
            } catch {
                // Try root ping as fallback
                try {
                    await axios.get(HOSTED_API_URL, { timeout: 8000 });
                    setResult('payment_gateway', STATUS.WARN, 'Cloud online — /health not available');
                    addLog('⚠ Cloud backend reachable but health endpoint missing.', 'warn');
                } catch {
                    setResult('payment_gateway', STATUS.FAIL, 'Cloud backend unreachable');
                    addLog('✗ Payment gateway offline.', 'error');
                    setCriticalFail(true);
                }
            }

            // ── 7. PRINT PIPELINE ────────────────────────────
            setCurrentCheckIdx(6);
            setResult('print_pipeline', STATUS.RUNNING);
            addLog('[7/7] Verifying print pipeline (assets + disk space)...');
            try {
                const ppRes = await axios.get('http://localhost:8000/health/print-pipeline', { timeout: 5000 });
                const pp = ppRes.data;
                if (pp.ready) {
                    setResult('print_pipeline', STATUS.OK, `Assets OK · ${pp.disk_free_gb}GB free`);
                    addLog(`✓ Print pipeline OK. Disk: ${pp.disk_free_gb}GB free. Assets: ${pp.asset_count} frames.`, 'ok');
                } else {
                    setResult('print_pipeline', STATUS.WARN, pp.detail || 'Assets may be missing');
                    addLog(`⚠ Print pipeline warning: ${pp.detail}`, 'warn');
                }
            } catch {
                setResult('print_pipeline', STATUS.WARN, 'Could not verify — backend /health/print-pipeline missing');
                addLog('⚠ Could not verify print pipeline.', 'warn');
            }

            // ── DONE ──────────────────────────────────────────
            addLog('─────────────────────────────────────────', 'system');
            addLog('Boot check complete.', 'system');
            setAllDone(true);
            setCurrentCheckIdx(-1);
            setCanProceed(true);
        };

        runChecks();
    }, []);

    // Compute summary
    const failCount = Object.values(results).filter(r => r.status === STATUS.FAIL).length;
    const warnCount = Object.values(results).filter(r => r.status === STATUS.WARN).length;
    const okCount = Object.values(results).filter(r => r.status === STATUS.OK).length;

    const handleProceed = () => navigate('/');

    // ─────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────
    return (
        <div
            className="relative h-screen w-full flex overflow-hidden font-sans bg-[#0A0A0C] select-none"
            onContextMenu={e => e.preventDefault()}
        >
            {/* Subtle grid background */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* ── LEFT COLUMN: Checklist ── */}
            <div className="relative flex flex-col w-[45%] h-full border-r border-white/5 p-10 gap-6 overflow-hidden">

                {/* Header */}
                <div>
                    <div className="text-[10px] font-bold tracking-[0.4em] text-white/30 uppercase mb-2">
                        POLARIS PHOTOBOOTH — SYSTEM BOOT
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                        SYSTEM<br />
                        <span className="text-polaris-primary">CHECK</span>
                    </h1>
                    <p className="mt-3 text-sm text-white/40 font-medium">
                        Running diagnostics before the event goes live.
                    </p>
                </div>

                {/* Check Items */}
                <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
                    {CHECKS.map((check, idx) => {
                        const result = results[check.id];
                        const isRunning = result.status === STATUS.RUNNING;
                        const Icon = check.icon;

                        return (
                            <motion.div
                                key={check.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.08, duration: 0.4 }}
                                className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-300 ${
                                    isRunning
                                        ? 'bg-blue-500/10 border-blue-500/30'
                                        : result.status === STATUS.OK
                                        ? 'bg-emerald-500/5 border-emerald-500/20'
                                        : result.status === STATUS.FAIL
                                        ? 'bg-red-500/8 border-red-500/20'
                                        : result.status === STATUS.WARN
                                        ? 'bg-amber-500/8 border-amber-500/20'
                                        : 'bg-white/3 border-white/8'
                                }`}
                            >
                                {/* Running pulse bar */}
                                {isRunning && (
                                    <motion.div
                                        className="absolute inset-0 rounded-xl bg-blue-500/5"
                                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                                        transition={{ duration: 1.2, repeat: Infinity }}
                                    />
                                )}

                                {/* Icon */}
                                <div className={`relative z-10 w-9 h-9 rounded-lg flex items-center justify-center ${
                                    result.status === STATUS.OK ? 'bg-emerald-500/15'
                                    : result.status === STATUS.FAIL ? 'bg-red-500/15'
                                    : result.status === STATUS.WARN ? 'bg-amber-500/15'
                                    : isRunning ? 'bg-blue-500/15'
                                    : 'bg-white/5'
                                }`}>
                                    <Icon size={16} className={
                                        result.status === STATUS.OK ? 'text-emerald-400'
                                        : result.status === STATUS.FAIL ? 'text-red-400'
                                        : result.status === STATUS.WARN ? 'text-amber-400'
                                        : isRunning ? 'text-blue-400'
                                        : 'text-white/30'
                                    } />
                                </div>

                                {/* Labels */}
                                <div className="relative z-10 flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white/90">{check.label}</div>
                                    <div className="text-[11px] text-white/35 font-medium truncate">
                                        {result.detail || check.sublabel}
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="relative z-10 flex-shrink-0">
                                    <StatusIcon status={result.status} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Summary + Action */}
                <AnimatePresence>
                    {allDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-3"
                        >
                            {/* Summary row */}
                            <div className="flex gap-2">
                                {okCount > 0 && (
                                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 text-center">
                                        <div className="text-2xl font-black text-emerald-400">{okCount}</div>
                                        <div className="text-[9px] font-bold tracking-widest text-emerald-400/60 uppercase">Passed</div>
                                    </div>
                                )}
                                {warnCount > 0 && (
                                    <div className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 text-center">
                                        <div className="text-2xl font-black text-amber-400">{warnCount}</div>
                                        <div className="text-[9px] font-bold tracking-widest text-amber-400/60 uppercase">Warnings</div>
                                    </div>
                                )}
                                {failCount > 0 && (
                                    <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 text-center">
                                        <div className="text-2xl font-black text-red-400">{failCount}</div>
                                        <div className="text-[9px] font-bold tracking-widest text-red-400/60 uppercase">Failed</div>
                                    </div>
                                )}
                            </div>

                            {/* Proceed button */}
                            <button
                                onClick={handleProceed}
                                disabled={!canProceed}
                                className={`group relative w-full h-16 rounded-2xl overflow-hidden flex items-center justify-between px-6 font-bold text-lg transition-all duration-300 ${
                                    criticalFail
                                        ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                                        : 'bg-polaris-primary text-white hover:opacity-90 shadow-xl shadow-polaris-primary/30'
                                }`}
                            >
                                <span>
                                    {criticalFail ? 'Proceed Anyway (Issues Found)' : 'System Ready — Launch Kiosk'}
                                </span>
                                <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── RIGHT COLUMN: Camera Preview + Terminal Log ── */}
            <div className="relative flex flex-col w-[55%] h-full p-10 gap-6">

                {/* Camera Preview (shown after camera check) */}
                <AnimatePresence>
                    {showCamera && (
                        <motion.div
                            key="camera-preview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex-shrink-0"
                        >
                            <div className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-3">
                                📷 Live Camera Feed — Adjust angle before proceeding
                            </div>
                            <CameraPreviewPanel visible={showCamera} cameraStatus={cameraInfo} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Terminal Log */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase mb-3 flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                        </div>
                        BOOT LOG
                    </div>
                    <div className="flex-1 bg-black/60 border border-white/8 rounded-xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed">
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-3 ${
                                    log.level === 'ok' ? 'text-emerald-400'
                                    : log.level === 'error' ? 'text-red-400'
                                    : log.level === 'warn' ? 'text-amber-400'
                                    : log.level === 'system' ? 'text-blue-300'
                                    : 'text-white/50'
                                }`}
                            >
                                <span className="text-white/20 flex-shrink-0">{log.ts}</span>
                                <span>{log.msg}</span>
                            </motion.div>
                        ))}
                        {/* Blinking cursor */}
                        {!allDone && (
                            <motion.span
                                className="inline-block w-2 h-3.5 bg-white/50 ml-1"
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                            />
                        )}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemBoot;

