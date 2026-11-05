import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Flashlight, 
  FlashlightOff, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  QrCode, 
  Upload, 
  Zap, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { calculateStudentClassUsage } from '../utils/planUsage';

export interface StudentAttendanceRecord {
  id: string;
  date: string;
  present: boolean;
  className: string;
  instructor: string;
  note?: string;
}

export interface StudentQRData {
  id: string;
  name: string;
  email: string;
  document: string;
  classes: string[];
  turmas: string[];
  status: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
  planType: 'Studio' | 'WellHub' | 'GuruPass' | 'TotalPass';
  contractedPlan: string;
  avatar?: string;
  attendance: StudentAttendanceRecord[];
  customClassLimit?: number;
  partnerMemberId?: string;
}

interface StudentQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentQRData[];
  onCheckIn: (studentId: string, className: string, metadata?: any) => Promise<void> | void;
  availableClasses?: string[];
  currentUser?: { name: string; role: string } | null;
  defaultClassName?: string;
}

// Play pleasant web audio chime on successful scan
function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.12);

    // Second tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.28);
  } catch (e) {
    console.debug('Web audio not supported or permitted', e);
  }
}

export function StudentQRScannerModal({
  isOpen,
  onClose,
  students,
  onCheckIn,
  availableClasses = ['Danças Urbanas', 'Hip Hop', 'Ballet', 'Jazz', 'Contemporâneo', 'Dança a 2', 'Treino Funcional', 'Zumba', 'Yoga', 'Pilates'],
  currentUser,
  defaultClassName = 'Danças Urbanas'
}: StudentQRScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [selectedClass, setSelectedClass] = useState<string>(defaultClassName);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | undefined>(undefined);
  
  // Scan Result State
  const [scannedStudent, setScannedStudent] = useState<StudentQRData | null>(null);
  const [scannedRawCode, setScannedRawCode] = useState<string | null>(null);
  const [isCheckInSubmitting, setIsCheckInSubmitting] = useState(false);
  const [isCheckInSuccess, setIsCheckInSuccess] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [autoConfirmCountdown, setAutoConfirmCountdown] = useState<number | null>(null);

  // Manual search fallback state
  const [manualSearch, setManualSearch] = useState('');
  
  // Video and Canvas Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isScanningPausedRef = useRef(false);

  // Update selected class if default changes
  useEffect(() => {
    if (defaultClassName) {
      setSelectedClass(defaultClassName);
    }
  }, [defaultClassName]);

  // Enumerate cameras
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices);
      if (videoDevices.length > 0 && !currentCameraId) {
        // Prefer rear camera on mobile
        const backCam = videoDevices.find(
          (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira') || d.label.toLowerCase().includes('environment')
        );
        setCurrentCameraId(backCam ? backCam.deviceId : videoDevices[0].deviceId);
      }
    }).catch(console.error);
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  // Match raw string to a student
  const findStudentByCode = useCallback((raw: string): StudentQRData | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    // 1. Try parsing JSON format: { type: "student_checkin", studentId: "..." } or { studentId: "..." }
    try {
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        if (parsed.studentId) {
          const found = students.find((s) => s.id === parsed.studentId);
          if (found) return found;
        }
        if (parsed.id) {
          const found = students.find((s) => s.id === parsed.id);
          if (found) return found;
        }
        if (parsed.document || parsed.cpf) {
          const docNum = (parsed.document || parsed.cpf).replace(/\D/g, '');
          const found = students.find((s) => s.document?.replace(/\D/g, '') === docNum);
          if (found) return found;
        }
        if (parsed.email) {
          const found = students.find((s) => s.email?.toLowerCase() === parsed.email.toLowerCase());
          if (found) return found;
        }
      }
    } catch {
      // Not valid JSON, proceed to text patterns
    }

    // 2. Check for Prefix patterns (e.g., STYLO:STUDENT:id or STUDENT:id)
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const lastPart = parts[parts.length - 1].trim();
      const foundById = students.find((s) => s.id === lastPart);
      if (foundById) return foundById;

      const cleanDoc = lastPart.replace(/\D/g, '');
      if (cleanDoc.length >= 8) {
        const foundByDoc = students.find((s) => s.document?.replace(/\D/g, '') === cleanDoc);
        if (foundByDoc) return foundByDoc;
      }
    }

    // 3. Direct match by Student ID
    const byId = students.find((s) => s.id === trimmed);
    if (byId) return byId;

    // 3.1 Match by Partner Member ID (Wellhub, Gurupass, TotalPass)
    const byPartnerId = students.find(
      (s) => s.partnerMemberId && s.partnerMemberId.toLowerCase() === trimmed.toLowerCase()
    );
    if (byPartnerId) return byPartnerId;

    // 4. Match by Document / CPF (ignoring non-digits)
    const cleanNumbers = trimmed.replace(/\D/g, '');
    if (cleanNumbers.length >= 8) {
      const byDoc = students.find((s) => s.document?.replace(/\D/g, '') === cleanNumbers);
      if (byDoc) return byDoc;
    }

    // 5. Match by Email
    if (trimmed.includes('@')) {
      const byEmail = students.find((s) => s.email?.toLowerCase() === trimmed.toLowerCase());
      if (byEmail) return byEmail;
    }

    // 6. Match by exact Name
    const byName = students.find((s) => s.name?.toLowerCase() === trimmed.toLowerCase());
    if (byName) return byName;

    return null;
  }, [students]);

  // Handle successful QR detection
  const handleDetectedCode = useCallback((codeText: string) => {
    if (isScanningPausedRef.current) return;
    isScanningPausedRef.current = true;

    // Haptic & Audio
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch {
        // ignore
      }
    }
    playSuccessBeep();

    setScannedRawCode(codeText);
    const matched = findStudentByCode(codeText);
    setScannedStudent(matched);

    // If auto-confirm is enabled and student is found
    if (matched && autoConfirm) {
      setAutoConfirmCountdown(2);
    }
  }, [findStudentByCode, autoConfirm]);

  // Continuous Scan Loop
  const scanLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA && !isScanningPausedRef.current) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDetectedCode(code.data);
          return;
        }
      }
    }

    if (!isScanningPausedRef.current) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }
  }, [isCameraActive, handleDetectedCode]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: currentCameraId
          ? { deviceId: { exact: currentCameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        isScanningPausedRef.current = false;

        // Check torch capability
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
          setHasTorch(Boolean(capabilities.torch));
        }

        // Start scanning frames
        animationFrameRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission')) {
        setCameraError('Permissão da câmera negada. Permita o acesso à câmera nas configurações do seu navegador para escanear.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setCameraError('Nenhuma câmera encontrada neste dispositivo. Você pode usar a busca manual ou upload de imagem.');
      } else {
        setCameraError('Não foi possível iniciar a câmera. Verifique as permissões do dispositivo.');
      }
      setIsCameraActive(false);
    }
  }, [currentCameraId, stopCamera, scanLoop]);

  // Handle open/close effects
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  // Auto-confirm countdown timer
  useEffect(() => {
    if (autoConfirmCountdown === null || !scannedStudent) return;
    if (autoConfirmCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoConfirmCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoConfirmCountdown === 0) {
      executeCheckIn(scannedStudent);
    }
  }, [autoConfirmCountdown, scannedStudent]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newStatus = !isTorchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: newStatus }],
      });
      setIsTorchOn(newStatus);
    } catch (e) {
      console.warn('Torch toggle failed', e);
      toast.error('Lanterna não suportada neste dispositivo');
    }
  };

  // Switch camera between front/back
  const handleSwitchCamera = () => {
    if (cameras.length < 2) {
      toast.info('Apenas uma câmera detectada neste dispositivo.');
      return;
    }
    const nextCam = cameras.find((c) => c.deviceId !== currentCameraId);
    if (nextCam) {
      setCurrentCameraId(nextCam.deviceId);
    }
  };

  // Image file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleDetectedCode(code.data);
          toast.success('QR Code decodificado com sucesso da imagem!');
        } else {
          toast.error('Nenhum QR Code válido foi identificado na imagem.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Check if student already checked in today for this class
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const alreadyCheckedInToday = Boolean(
    scannedStudent?.attendance?.some(
      (a) => a.date === todayStr && a.className === selectedClass && a.present
    )
  );

  // Execute Check-in
  const executeCheckIn = async (student: StudentQRData) => {
    if (!student) return;
    setIsCheckInSubmitting(true);
    setAutoConfirmCountdown(null);

    try {
      await onCheckIn(student.id, selectedClass, {
        partnerToken: student.partnerMemberId,
        allowExceeded: true
      });
      setIsCheckInSuccess(true);
      toast.success(`Check-in de ${student.name} confirmado na aula de ${selectedClass}!`);
      
      // If continuing scan
      setTimeout(() => {
        setIsCheckInSuccess(false);
        setScannedStudent(null);
        setScannedRawCode(null);
        isScanningPausedRef.current = false;
        if (activeTab === 'camera' && isCameraActive) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
        }
      }, 1500);
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Falha ao registrar check-in. Tente novamente.');
    } finally {
      setIsCheckInSubmitting(false);
    }
  };

  // Reset scanner to scan another student
  const handleScanNext = () => {
    setScannedStudent(null);
    setScannedRawCode(null);
    setIsCheckInSuccess(false);
    setAutoConfirmCountdown(null);
    isScanningPausedRef.current = false;
    if (activeTab === 'camera' && isCameraActive) {
      animationFrameRef.current = requestAnimationFrame(scanLoop);
    }
  };

  // Filtered students for manual search
  const manualFilteredStudents = students.filter((s) => {
    if (!manualSearch.trim()) return false;
    const term = manualSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.document.includes(term) ||
      s.email.toLowerCase().includes(term)
    );
  }).slice(0, 6);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          stopCamera();
          onClose();
        }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-surface-container border border-outline rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-outline/50 flex items-center justify-between bg-surface-container-high/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
              <QrCode size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-headline font-black uppercase tracking-tight text-on-surface">
                  Scanner de Check-in
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Validação instantânea de presença e planos (Studio, WellHub, TotalPass)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest border border-outline flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all active:scale-95"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline/40 flex flex-wrap items-center justify-between gap-3">
          {/* Class / Turma Selector */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant shrink-0">
              Aula / Turma:
            </span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex-1 bg-surface-container border border-outline rounded-xl px-3 py-1.5 text-xs font-bold text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-xl border border-outline">
            <button
              onClick={() => {
                setActiveTab('camera');
                setScannedStudent(null);
                setScannedRawCode(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Camera size={14} />
              <span>Câmera</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('manual');
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Search size={14} />
              <span>Busca Manual</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Upload size={14} />
              <span>Arquivo</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {/* Live Scanner Viewport */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10] max-h-[340px] w-full bg-black rounded-3xl overflow-hidden border-2 border-outline/70 shadow-2xl flex items-center justify-center">
                {/* Hidden canvas for decoding */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Video Feed */}
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />

                {/* Camera Viewfinder & Laser Grid */}
                {isCameraActive && !scannedStudent && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                    {/* Targeting Box */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 border-2 border-primary/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,107,0,0.15)]">
                      {/* Laser Bar */}
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#FF6B00] animate-scan" />
                      
                      {/* Corners */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    </div>

                    <div className="absolute bottom-4 inset-x-0 text-center">
                      <span className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white/90 text-[11px] font-bold tracking-wide border border-white/10 shadow-lg inline-flex items-center gap-1.5">
                        <Sparkles size={12} className="text-primary animate-spin" />
                        Aponte para o QR Code da Carteirinha ou App Parceiro
                      </span>
                    </div>
                  </div>
                )}

                {/* Error Fallback */}
                {cameraError && (
                  <div className="absolute inset-0 bg-surface-container/95 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20">
                      <AlertCircle size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface mb-1">Câmera Indisponível</p>
                      <p className="text-xs text-on-surface-variant max-w-md">{cameraError}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw size={14} />
                        Tentar Novamente
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="px-4 py-2 bg-surface-container-high border border-outline text-on-surface rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all"
                      >
                        Digitar / Buscar
                      </button>
                    </div>
                  </div>
                )}

                {/* Camera Top Controls Overlay */}
                {isCameraActive && (
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                    {hasTorch && (
                      <button
                        onClick={toggleTorch}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          isTorchOn
                            ? 'bg-amber-400 text-black shadow-[0_0_15px_#F59E0B]'
                            : 'bg-black/60 text-white/90 hover:bg-black/80'
                        }`}
                        title="Alternar Lanterna"
                      >
                        {isTorchOn ? <Flashlight size={16} /> : <FlashlightOff size={16} />}
                      </button>
                    )}
                    {cameras.length > 1 && (
                      <button
                        onClick={handleSwitchCamera}
                        className="w-9 h-9 rounded-xl bg-black/60 text-white/90 hover:bg-black/80 flex items-center justify-center transition-all"
                        title="Trocar Câmera"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Auto Confirm Toggle */}
              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl border border-outline/50 text-xs">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-primary" />
                  <span className="font-bold text-on-surface">Auto-Confirmar Check-in</span>
                  <span className="text-[10px] text-on-surface-variant">(Registra presença após 2s)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoConfirm}
                    onChange={(e) => setAutoConfirm(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>
          )}

          {/* MANUAL SEARCH TAB */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Digite o nome, CPF ou e-mail do aluno..."
                  className="w-full bg-surface-container-low border border-outline rounded-2xl pl-11 pr-4 py-3.5 text-sm text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/50"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                {manualFilteredStudents.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setScannedStudent(s);
                      setScannedRawCode(s.id);
                    }}
                    className="p-3.5 bg-surface-container-low hover:bg-surface-container-high border border-outline hover:border-primary/50 rounded-2xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
                        {s.avatar ? (
                          <img src={s.avatar} alt={s.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          s.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {s.name}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          CPF: {s.document || 'Não informado'} • Plano: <span className="font-bold">{s.planType}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {s.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      <ChevronRight size={16} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}

                {manualSearch.trim() && manualFilteredStudents.length === 0 && (
                  <div className="py-8 text-center text-on-surface-variant">
                    <p className="text-sm font-bold">Nenhum aluno encontrado para "{manualSearch}"</p>
                    <p className="text-xs mt-1">Verifique o CPF ou nome digitado.</p>
                  </div>
                )}

                {!manualSearch.trim() && (
                  <div className="py-8 text-center text-on-surface-variant">
                    <UserCheck size={32} className="mx-auto mb-2 opacity-30 text-primary" />
                    <p className="text-xs font-bold uppercase tracking-wider">Digite para buscar qualquer aluno cadastrado</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UPLOAD FILE TAB */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-outline hover:border-primary rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-surface-container-low hover:bg-surface-container-high/60 group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload size={28} />
                </div>
                <p className="text-sm font-bold text-on-surface mb-1">
                  Selecione uma imagem de QR Code ou comprovante
                </p>
                <p className="text-xs text-on-surface-variant max-w-sm">
                  Formatos suportados: PNG, JPG, WEBP. A imagem será decodificada instantaneamente.
                </p>
              </label>
            </div>
          )}

          {/* SCANNED STUDENT RECOGNITION CARD */}
          <AnimatePresence>
            {scannedStudent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-surface-container-high border-2 border-primary rounded-3xl p-5 sm:p-6 shadow-xl space-y-5"
              >
                {/* Header & Student Details */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#FF9E00] text-white font-black text-xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden border border-white/20">
                      {scannedStudent.avatar ? (
                        <img src={scannedStudent.avatar} alt={scannedStudent.name} className="w-full h-full object-cover" />
                      ) : (
                        scannedStudent.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg sm:text-xl font-headline font-black text-on-surface leading-tight">
                          {scannedStudent.name}
                        </h4>
                        <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        CPF: <span className="font-semibold text-on-surface">{scannedStudent.document || 'Não informado'}</span> • E-mail: {scannedStudent.email}
                      </p>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                          {scannedStudent.planType} - {scannedStudent.contractedPlan || 'Padrão'}
                        </span>
                        {scannedStudent.partnerMemberId && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-container text-on-surface-variant border border-outline">
                            ID: {scannedStudent.partnerMemberId}
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          scannedStudent.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {scannedStudent.status === 'active' ? 'Matrícula Ativa' : 'Inativo'}
                        </span>
                        {scannedStudent.paymentStatus === 'overdue' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Pagamento Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleScanNext}
                    className="p-2 text-on-surface-variant hover:text-on-surface rounded-xl hover:bg-surface-container"
                    title="Descartar / Escanear Outro"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Class Usage Counter */}
                {(() => {
                  const usage = calculateStudentClassUsage(scannedStudent);
                  return (
                    <div className="p-3.5 bg-surface-container-low border border-outline rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-on-surface flex items-center gap-1.5">
                          <Zap size={14} className="text-primary" />
                          <span>Contador de Aulas ({scannedStudent.contractedPlan || scannedStudent.planType})</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${
                          usage.isExceeded 
                            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                            : usage.isNearLimit 
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {usage.monthlyClasses} / {usage.monthlyLimit} no mês ({usage.percentageUsed}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            usage.isExceeded ? 'bg-red-500' : usage.isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, usage.percentageUsed)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant">
                        <span>Aulas na semana: <strong className="text-on-surface">{usage.weeklyClasses}/{usage.weeklyLimit}</strong></span>
                        <span>{usage.classesRemaining > 0 ? `${usage.classesRemaining} restantes no mês` : 'Limite do plano atingido'}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Warning if already checked in */}
                {alreadyCheckedInToday && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 text-amber-500 text-xs">
                    <Clock size={18} className="shrink-0" />
                    <div>
                      <p className="font-bold">Atenção: Aluno já possui check-in nesta aula hoje ({todayStr})</p>
                      <p className="text-[11px] text-amber-500/80">Você pode confirmar novamente se for uma reposição ou aula extra.</p>
                    </div>
                  </div>
                )}

                {/* Check-in Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                  <button
                    onClick={() => executeCheckIn(scannedStudent)}
                    disabled={isCheckInSubmitting || isCheckInSuccess}
                    className="flex-1 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,107,0,0.25)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCheckInSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Registrando Presença...</span>
                      </>
                    ) : isCheckInSuccess ? (
                      <>
                        <CheckCircle2 size={18} className="text-white" />
                        <span>Presença Confirmada!</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={18} />
                        <span>
                          Confirmar Check-in em {selectedClass}
                          {autoConfirmCountdown !== null && ` (${autoConfirmCountdown}s)`}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleScanNext}
                    className="px-5 py-3.5 bg-surface-container border border-outline hover:border-primary text-on-surface rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-surface-container-highest transition-all"
                  >
                    Próximo Aluno
                  </button>
                </div>
              </motion.div>
            )}

            {/* If Raw Code was scanned but NO student matched */}
            {!scannedStudent && scannedRawCode && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl space-y-3 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-amber-500">QR Code não cadastrado</h4>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Código lido: <code className="bg-black/30 px-2 py-0.5 rounded text-on-surface font-mono">{scannedRawCode.slice(0, 40)}</code>
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Nenhum aluno com este identificador ou CPF foi localizado no sistema.
                  </p>
                </div>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleScanNext}
                    className="px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all"
                  >
                    Tentar Outro Código
                  </button>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="px-4 py-2 bg-surface-container border border-outline text-on-surface rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    Buscar Aluno por Nome
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 border-t border-outline/50 bg-surface-container-low/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>
              Operador: <strong>{currentUser?.name || 'Administração'}</strong> ({currentUser?.role || 'Staff'})
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant/80">
            Compatível com carteirinhas do Stylo Urbano, WellHub e TotalPass
          </p>
        </div>
      </motion.div>
    </div>
  );
}
