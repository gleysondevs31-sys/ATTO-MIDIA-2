import React, { useState, useEffect, useRef } from "react";
import { X, SlidersHorizontal } from "lucide-react";

interface AudioEqualizerProps {
  audioRef?: React.RefObject<HTMLAudioElement>;
  videoRef?: React.RefObject<HTMLVideoElement>;
  activeType: "audio" | "video";
  disabled?: boolean;
}

const BANDS = [62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const BAND_LABELS = ["62", "125", "250", "500", "1K", "2K", "4K", "8K", "16K"];

export function AudioEqualizer({ audioRef, videoRef, activeType, disabled }: AudioEqualizerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [gains, setGains] = useState<number[]>(BANDS.map(() => 0));
  const [preamp, setPreamp] = useState<number>(0);
  
  // Audio context and nodes
  const ctxRef = useRef<AudioContext | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const preampRef = useRef<GainNode | null>(null);
  const isInitialized = useRef(false);

  const initAudio = () => {
    if (isInitialized.current || disabled) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      ctxRef.current = ctx;

      // Create Preamp
      const preampNode = ctx.createGain();
      preampNode.gain.value = Math.pow(10, preamp / 20); // Convert dB to linear gain
      preampRef.current = preampNode;

      // Create filters
      const filters = BANDS.map(freq => {
        const filter = ctx.createBiquadFilter();
        filter.type = "peaking";
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
      
      // Connect filters in series
      preampNode.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(ctx.destination);
      
      filtersRef.current = filters;
      isInitialized.current = true;
    } catch (e) {
      console.error("Error initializing audio context for equalizer", e);
    }
  };

  // Ensure elements are connected to the AudioContext when it is initialized and not disabled.
  // Using custom properties on the HTMLMediaElement itself guarantees that we never double-connect
  // the same DOM node to a MediaElementAudioSourceNode (which would throw a native exception).
  useEffect(() => {
    if (disabled || !isInitialized.current || !ctxRef.current || !preampRef.current) return;

    const connectElement = (el: HTMLAudioElement | HTMLVideoElement | null) => {
      if (!el) return;
      if ((el as any).__connectedToEQ) {
        return;
      }

      try {
        console.log("[AudioEqualizer] Robustly connecting media element to equalizer:", el.tagName);
        const source = ctxRef.current!.createMediaElementSource(el);
        source.connect(preampRef.current!);
        (el as any).__connectedToEQ = true;

        if (ctxRef.current && ctxRef.current.state === "suspended") {
          ctxRef.current.resume();
        }
      } catch (e) {
        console.error("[AudioEqualizer] Error connecting element to Web Audio graph:", e);
      }
    };

    if (audioRef?.current) connectElement(audioRef.current);
    if (videoRef?.current) connectElement(videoRef.current);

  }, [disabled, audioRef?.current, videoRef?.current, activeType, isOpen]);

  // Handle open
  const toggleOpen = () => {
    if (!isOpen) {
      initAudio();
      // Resume context if suspended
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
    }
    setIsOpen(!isOpen);
  };

  const handleGainChange = (index: number, val: number) => {
    const newGains = [...gains];
    newGains[index] = val;
    setGains(newGains);
    
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = val;
    }
  };

  const handlePreampChange = (val: number) => {
    setPreamp(val);
    if (preampRef.current) {
      preampRef.current.gain.value = Math.pow(10, val / 20); // Convert dB to linear
    }
  };

  const resetEQ = () => {
    const newGains = BANDS.map(() => 0);
    setGains(newGains);
    filtersRef.current.forEach(filter => {
      filter.gain.value = 0;
    });
    setPreamp(0);
    if (preampRef.current) {
      preampRef.current.gain.value = 1;
    }
  };

  return (
    <>
      <button
        onClick={disabled ? undefined : toggleOpen}
        disabled={disabled}
        className={`p-2 rounded-md transition-colors ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${isOpen ? 'bg-primary text-white' : 'text-gray-400 hover:text-white bg-[#111111] hover:bg-[#1a1a1a] border border-white/5'}`}
        title={disabled ? "Equalizador indisponível para esta mídia" : "Equalizador"}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute bottom-full right-0 mb-4 w-[360px] bg-[#111111] border border-white/10 rounded-xl p-4 shadow-2xl z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Equalizador
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={resetEQ} className="text-[10px] text-gray-400 hover:text-white font-mono uppercase">
                Reset
              </button>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-end h-32 gap-1 mb-2">
            
            {/* Preamp / Gain */}
            <div className="flex flex-col items-center gap-2 flex-1 border-r border-white/5 pr-1 mr-1">
              <span className="text-[9px] text-emerald-500 font-mono">
                {preamp > 0 ? '+' : ''}{preamp}dB
              </span>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={preamp}
                onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
                className="w-1.5 h-20 appearance-none bg-white/10 rounded-full cursor-pointer accent-emerald-500"
                style={{ 
                  writingMode: 'bt-lr', /* IE */
                  WebkitAppearance: 'slider-vertical', /* WebKit */
                  appearance: 'slider-vertical' /* modern */
                } as any}
                orient="vertical"
              />
              <span className="text-[9px] text-gray-400 font-mono">
                Ganho
              </span>
            </div>

            {BANDS.map((freq, i) => (
              <div key={freq} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-[9px] text-gray-500 font-mono">
                  {gains[i] > 0 ? '+' : ''}{gains[i]}
                </span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gains[i]}
                  onChange={(e) => handleGainChange(i, parseFloat(e.target.value))}
                  className="w-1.5 h-20 appearance-none bg-white/10 rounded-full cursor-pointer accent-primary"
                  style={{ 
                    writingMode: 'bt-lr', /* IE */
                    WebkitAppearance: 'slider-vertical', /* WebKit */
                    appearance: 'slider-vertical' /* modern */
                  } as any}
                  orient="vertical"
                />
                <span className="text-[9px] text-gray-400 font-mono">
                  {BAND_LABELS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
