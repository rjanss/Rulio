import * as React from "react";
import * as Tone from "tone";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { BrainCircuit, Play, PowerOff } from "lucide-react";

interface RulioEngineProps {
  sessionDuration: number;
  stemBusy?: string;
  stemEntrain?: string;
  stemSettle?: string;
}

export default function RulioEngine({
  sessionDuration = 15,
  stemBusy,
  stemEntrain,
  stemSettle,
}: RulioEngineProps) {
  const [mindSpeed, setMindSpeed] = React.useState(100);
  const [status, setStatus] = React.useState<"READY" | "ACTIVE" | "COMPLETE">("READY");
  const [timeLeft, setTimeLeft] = React.useState(sessionDuration * 60);

  // Audio nodes refs
  const players = React.useRef<Tone.Players | null>(null);
  const filter = React.useRef<Tone.Filter | null>(null);
  const analyser = React.useRef<Tone.Analyser | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const mindSpeedRef = React.useRef(mindSpeed);
  React.useEffect(() => {
    mindSpeedRef.current = mindSpeed;
  }, [mindSpeed]);

  const binaural = React.useRef<{ left: Tone.Oscillator | null; right: Tone.Oscillator | null }>({
    left: null,
    right: null,
  });
  
  // Advanced Generative Environmental Audio
  const generative = React.useRef<{
    nodes: any[];
    channels: {
      busy: Tone.Channel | null;
      entrain: Tone.Channel | null;
      settle: Tone.Channel | null;
    };
  }>({ nodes: [], channels: { busy: null, entrain: null, settle: null } });

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startSession = async () => {
    await Tone.start();
    setStatus("ACTIVE");
    
    // Privacy-first local tracking logic, logged to console for prototype
    console.log("Analytics Event: session-start");

    filter.current = new Tone.Filter(15000, "lowpass").toDestination();
    analyser.current = new Tone.Analyser("waveform", 512);
    filter.current.connect(analyser.current);

    const UsePlayers = stemBusy && stemEntrain && stemSettle;

    if (UsePlayers) {
      players.current = new Tone.Players({
        busy: stemBusy,
        entrain: stemEntrain,
        settle: stemSettle,
      }).connect(filter.current);

      try {
        await Tone.loaded();
        players.current.items().forEach((p: any) => {
          p.loop = true;
          p.fadeIn = 3;
        });
        players.current.player("busy").start();
        players.current.player("entrain").start();
        players.current.player("settle").start();
      } catch (err) {
        console.error("Failed to load audio stems", err);
      }
    } else {
      // Fallback: Advanced Generative Synth Environment
      const reverb = new Tone.Reverb({ decay: 5, preDelay: 0.1 }).connect(filter.current);
      reverb.ready.then(() => {
        reverb.wet.value = 0.5;
      }).catch(e => console.error("Reverb error:", e));
      
      const delay = new Tone.PingPongDelay("8n", 0.6).connect(filter.current);
      generative.current.nodes.push(reverb, delay);

      // Channels for mixing
      generative.current.channels.busy = new Tone.Channel(-6).connect(filter.current);
      generative.current.channels.busy.connect(reverb);
      generative.current.channels.busy.connect(delay);
      
      generative.current.channels.entrain = new Tone.Channel(-6).connect(filter.current);
      generative.current.channels.entrain.connect(reverb);
      
      generative.current.channels.settle = new Tone.Channel(0).connect(filter.current); // No reverb for deep rumble

      // 1. Busy - Glitchy, polyrhythmic pitter-patter & organic textures
      const busySynth = new Tone.PolySynth(Tone.AMSynth, {
        envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
        oscillator: { type: "square" },
        modulation: { type: "sine" },
        harmonicity: 1.5,
      }).connect(generative.current.channels.busy);
      
      // Subdued metallic glitch 
      const metalSynth = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5,
      });
      metalSynth.frequency.value = 200;
      metalSynth.volume.value = -15;

      const fastAutoPanner = new Tone.AutoPanner({ frequency: "8n", depth: 1 }).start();
      const busyFilter = new Tone.AutoFilter({ frequency: "4n", baseFrequency: 800, octaves: 4, type: "sine" }).start();
      
      metalSynth.chain(busyFilter, fastAutoPanner, generative.current.channels.busy);
      
      const busyNotes = ["C4", "G4", "D5", "A4", "E5", "C5", "F5", "D#4", "G#5"];
      const busyPattern = new Tone.Pattern((time, note) => {
        if (Math.random() > 0.3) {
            busySynth.triggerAttackRelease(note, "32n", time, Math.random() * 0.4 + 0.1);
        }
        if (Math.random() > 0.8) {
            metalSynth.triggerAttackRelease("64n", time, Math.random() * 0.2);
        }
      }, busyNotes, "randomWalk");
      busyPattern.interval = "16n";
      busyPattern.start(0);

      generative.current.nodes.push(busySynth, metalSynth, fastAutoPanner, busyFilter, busyPattern);

      // 2. Entrain - Deep cinematic expanding chords, richer harmonics
      const entrainSynth = new Tone.PolySynth(Tone.FMSynth, {
        envelope: { attack: 4, decay: 2, sustain: 0.9, release: 6 },
        oscillator: { type: "sine" },
        modulation: { type: "sawtooth" },
        modulationIndex: 3,
        harmonicity: 0.5,
      });
      
      const entrainPhaser = new Tone.Phaser({
        frequency: 0.2,
        octaves: 3,
        baseFrequency: 400
      });

      const entrainChorus = new Tone.Chorus(4, 2.5, 0.6).start();
      const entrainVol = new Tone.Volume(0);
      entrainSynth.chain(entrainPhaser, entrainChorus, entrainVol, generative.current.channels.entrain);

      // Swell movement
      const entrainLfo = new Tone.LFO("0.05hz", -8, 0).start();
      entrainLfo.connect(entrainVol.volume);

      // Deep minor 9th, 11th chords for cinematic feel
      const entrainChords = [
        ["C3", "G3", "Eb4", "Bb4", "D5"], 
        ["Ab2", "Eb3", "C4", "G4", "Bb4"], 
        ["F2", "C3", "Ab3", "Eb4", "G4"], 
        ["D2", "A2", "F3", "C4", "E4"]
      ];
      let chordIndex = 0;
      const entrainLoop = new Tone.Loop((time) => {
        entrainSynth.triggerAttackRelease(entrainChords[chordIndex], "2m", time, 0.4);
        chordIndex = (chordIndex + 1) % entrainChords.length;
      }, "2m");
      entrainLoop.start(0);

      generative.current.nodes.push(entrainSynth, entrainPhaser, entrainChorus, entrainVol, entrainLfo, entrainLoop);

      // 3. Settle - Rhythmic breathing swells of deep brown noise & infra-sub bass
      const settleNoise = new Tone.Noise("brown");
      const settleFilter = new Tone.AutoFilter({
        frequency: "0.06hz", // ≈ 16 seconds per breath cycle
        baseFrequency: 30,
        octaves: 3.5,
        type: "sine",
      }).start();
      
      const subBass = new Tone.Oscillator(35, "sine").start();
      const subVol = new Tone.Volume(-10);
      const subLfo = new Tone.LFO("0.06hz", -25, -10).start(); // Breathe in sync with noise
      subLfo.connect(subVol.volume);
      subBass.chain(subVol, generative.current.channels.settle);

      settleNoise.chain(settleFilter, generative.current.channels.settle);
      settleNoise.start(0);

      generative.current.nodes.push(settleNoise, settleFilter, subBass, subVol, subLfo);

      Tone.Transport.bpm.value = 110;
      Tone.Transport.start();
    }

    // Binaural Beats
    binaural.current.left = new Tone.Oscillator(200, "sine").connect(
      new Tone.Panner(-1).connect(filter.current)
    );
    binaural.current.right = new Tone.Oscillator(204, "sine").connect(
      new Tone.Panner(1).connect(filter.current)
    );

    binaural.current.left.start();
    binaural.current.right.start();

    const totalSeconds = sessionDuration * 60;
    
    intervalRef.current = setInterval(() => {
      setMindSpeed((prev) => {
        const next = prev - 100 / totalSeconds;
        return Math.max(0, next);
      });
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
  };

  const completeSession = React.useCallback(() => {
    setStatus("COMPLETE");
    console.log("Analytics Event: session-complete"); // The Magic Metric
    Tone.Destination.volume.rampTo(-Infinity, 10);
  }, []);

  React.useEffect(() => {
    if (status === "ACTIVE" && timeLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      completeSession();
    }
  }, [timeLeft, status, completeSession]);

  React.useEffect(() => {
    if (status !== "ACTIVE") return;
    
    // Smoothly volume fade stems logically based on mindSpeed
    const volBusy = mindSpeed > 60 ? 0 : -60;
    const volEntrain = mindSpeed <= 80 && mindSpeed >= 20 ? 0 : -60;
    const volSettle = mindSpeed < 40 ? 0 : -60;
    
    const UsePlayers = stemBusy && stemEntrain && stemSettle;
    
    if (UsePlayers && players.current) {
      if (players.current.has("busy")) players.current.player("busy").volume.rampTo(volBusy, 2);
      if (players.current.has("entrain")) players.current.player("entrain").volume.rampTo(volEntrain, 2);
      if (players.current.has("settle")) players.current.player("settle").volume.rampTo(volSettle, 2);
    } else {
      if (generative.current.channels.busy) generative.current.channels.busy.volume.rampTo(volBusy - 6, 2);
      if (generative.current.channels.entrain) generative.current.channels.entrain.volume.rampTo(volEntrain - 6, 2);
      if (generative.current.channels.settle) generative.current.channels.settle.volume.rampTo(volSettle, 2);
    }

    // Filter gradually sweeps down
    const cutoff = (mindSpeed / 100) * 14000 + 100;
    if (filter.current) {
      filter.current.frequency.rampTo(cutoff, 2);
    }

    // Binaural Beats get louder as we settle
    const bVol = (100 - mindSpeed) / 4 - 35;
    if (binaural.current.left) binaural.current.left.volume.rampTo(bVol, 2);
    if (binaural.current.right) binaural.current.right.volume.rampTo(bVol, 2);
  }, [mindSpeed, status, stemBusy, stemEntrain, stemSettle]);

  React.useEffect(() => {
    let animationId: number;
    let phase = 0;

    const draw = () => {
      if (!canvasRef.current || !analyser.current || status !== "ACTIVE") return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect && (canvas.width !== rect.width || canvas.height !== rect.height)) {
          canvas.width = rect.width;
          canvas.height = rect.height;
      }

      const width = canvas.width;
      const height = canvas.height;
      const ms = mindSpeedRef.current;

      const values = analyser.current.getValue() as Float32Array;

      const fadeAlpha = ms > 60 ? 0.2 : (ms > 20 ? 0.05 : 0.02);
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      
      const r = ms > 60 ? 255 : (ms > 30 ? 100 : 30);
      const g = ms > 60 ? 78 : (ms > 30 ? 200 : 50);
      const b = ms > 60 ? 0 : 255;
      const alpha = Math.max(0.1, ms / 100);
      
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.lineWidth = ms > 60 ? 2 : (ms > 20 ? 4 : 1);

      const sliceWidth = width / values.length;
      let x = 0;

      for (let i = 0; i < values.length; i++) {
          const v = values[i] as number; 
          
          let y = height / 2;
          
          if (ms > 60) {
              const glitchOffset = Math.random() > 0.98 ? (Math.random() - 0.5) * 80 : 0;
              y += v * (height / 2) + glitchOffset;
          } else if (ms > 20) {
              y += v * (height / 3) + Math.sin(phase + i * 0.05) * 30;
          } else {
              y += v * (height / 6) + Math.sin(phase * 0.5) * 10;
          }

          if (i === 0) {
              ctx.moveTo(x, y);
          } else {
              if (ms > 60 && Math.random() > 0.9) {
                 ctx.lineTo(x + (Math.random() - 0.5) * 20, y);
              } else {
                 ctx.lineTo(x, y);
              }
          }

          x += sliceWidth;
      }
      ctx.stroke();
      
      phase += (ms / 100) * 0.1 + 0.01;
      animationId = requestAnimationFrame(draw);
    };

    if (status === "ACTIVE") {
      draw();
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      players.current?.dispose();
      
      // Cleanup AI generative nodes
      generative.current.nodes.forEach(node => {
         try { node?.dispose?.(); } catch (e) {}
      });
      generative.current.channels.busy?.dispose();
      generative.current.channels.entrain?.dispose();
      generative.current.channels.settle?.dispose();

      Tone.Transport.stop();

      binaural.current.left?.dispose();
      binaural.current.right?.dispose();
      filter.current?.dispose();
      analyser.current?.dispose();
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto min-h-[400px]">
      <AnimatePresence mode="wait">
        {status === "READY" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-8 bg-zinc-900/50 p-8 sm:p-12 rounded-2xl border border-zinc-800 border-dashed w-full"
          >
            <div className="w-24 h-24 rounded-full border border-zinc-800 flex items-center justify-center relative bg-black">
               <BrainCircuit className="w-8 h-8 text-white opacity-80" />
            </div>

            <button
              onClick={startSession}
              className="w-full bg-white text-black py-4 rounded-full text-sm font-bold uppercase tracking-[0.2em] hover:bg-zinc-200 transition-colors"
            >
              Start 15-Min Reset
            </button>
            <p className="font-light text-zinc-400 text-sm max-w-sm text-center">
              A neurological slope for racing minds. Use headphones for the full effect.
            </p>
          </motion.div>
        )}

        {status === "ACTIVE" && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full bg-zinc-900 p-8 sm:p-12 rounded-xl border border-zinc-800 relative z-0 overflow-hidden"
          >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40 pointer-events-none z-[-1] mix-blend-screen" />

            <div className="w-full h-2 bg-zinc-800 mb-8 overflow-hidden rounded-full relative z-10">
              <motion.div
                className="h-full bg-white absolute top-0 left-0"
                initial={{ width: "100%" }}
                animate={{ width: `${mindSpeed}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>

            <div className="flex flex-col items-center gap-2 z-10 relative">
              <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                Neurological Descent
              </span>
              <p className="text-xl font-light text-zinc-400">Mind Speed: <span className="font-bold text-white">{Math.round(mindSpeed)}%</span></p>
            </div>

            <h2 className="text-[80px] sm:text-[140px] font-black leading-none tracking-tighter mt-12 mb-4 font-sans text-white z-10 relative">
              {formatTime(timeLeft)}
            </h2>
          </motion.div>
        )}

        {status === "COMPLETE" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 text-center bg-zinc-900 p-8 sm:p-12 rounded-xl border border-zinc-800 w-full"
          >
            <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 flex flex-col items-center justify-center text-zinc-500 mb-2">
               <PowerOff className="w-6 h-6" />
            </div>
            <div>
               <h3 className="text-2xl sm:text-4xl font-black tracking-tighter mb-4 text-white">SHUTDOWN SUCCESSFUL</h3>
               <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500">
                 Session complete. You may close your eyes.
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
