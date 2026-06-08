"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  "¿Quién va primero en el Grupo A?",
  "Contame cómo va Argentina vs Francia",
  "¿Cuándo es la final y dónde se juega?",
  "Dame las estadísticas del partido en vivo",
];

const MIC_ERROR_MESSAGES = {
  "not-allowed": "Necesito permiso para usar el micrófono. Habilitalo en la configuración del sitio y probá de nuevo.",
  "service-not-allowed": "Necesito permiso para usar el micrófono. Habilitalo en la configuración del sitio y probá de nuevo.",
  "no-speech": "No te escuché bien. Acercate al micrófono y probá de nuevo.",
  "audio-capture": "No encuentro un micrófono disponible. Revisá que esté conectado y con permisos.",
  network:
    "No pude conectarme con el servicio de reconocimiento de voz. Si usás Brave u otro navegador con bloqueadores de privacidad fuertes, puede que esté frenando ese servicio: probá bajando los Shields para este sitio (ícono del león en la barra de direcciones) o usá el micrófono desde Chrome o Edge.",
};

export default function AIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hola, soy Lucho, el asistente de WORLD CUP LIVE. Preguntame sobre partidos, resultados, grupos o estadísticas del Mundial 2026 — podés escribir o usar el micrófono.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  // Speech recognition is set up once, but its callbacks need the *latest*
  // sendMessage/messages — route them through a ref so we don't rebuild the
  // recognizer (and don't act on stale state) on every render.
  const sendMessageRef = useRef(() => {});

  // Feature-detect the Web Speech API (Chrome/Edge/Safari support varies)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition && window.speechSynthesis));
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    // `continuous` keeps the mic open across short pauses instead of closing
    // the moment it detects the first instant of silence — without it some
    // browsers cut the session after well under a second.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interim += transcript;
      }
      setInput((finalTranscript + interim).trim());
    };

    recognition.onend = () => {
      setListening(false);
      const finalText = finalTranscript.trim();
      finalTranscript = "";
      if (finalText) sendMessageRef.current(finalText);
    };

    recognition.onerror = (event) => {
      setListening(false);
      // "aborted" fires when we call recognition.stop() ourselves — not a real error.
      if (event.error === "aborted") return;
      const friendly = MIC_ERROR_MESSAGES[event.error] || "No pude usar el micrófono. Probá escribiendo tu pregunta.";
      setMessages((cur) => [...cur, { role: "assistant", content: friendly }]);
    };

    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  function speak(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 1.02;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  }

  function toggleListening() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (listening) {
      recognition.stop();
    } else {
      window.speechSynthesis?.cancel();
      setInput("");
      try {
        recognition.start();
        setListening(true);
      } catch {
        // Already running (e.g. double-click) — ignore, current session continues.
      }
    }
  }

  async function sendMessage(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply
        : data.error || "No pude conectarme con el asistente. Intentá de nuevo en un momento.";

      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
      speak(reply);
    } catch {
      const reply = "Hubo un problema de conexión con el asistente. Revisá tu conexión e intentá de nuevo.";
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
      speak(reply);
    } finally {
      setLoading(false);
    }
  }

  // Keep the ref pointing at the latest sendMessage so the speech-recognition
  // callbacks (registered once) always act on current state.
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  });

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir Lucho, el asistente de IA"
        className="fixed bottom-6 right-6 z-[60] w-16 h-16 rounded-full liquid-glass ai-orb flex items-center justify-center text-2xl hover:scale-110 transition-transform"
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-28 right-6 z-[60] w-[92vw] max-w-sm liquid-glass flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(1,8,40,0.7)]">
          <div className="px-5 py-4 border-b border-cream/10 flex items-center justify-between">
            <div>
              <p className="font-anton text-sm tracking-widest text-neon">LUCHO</p>
              <p className="font-mono text-[10px] text-cream/50 mt-0.5">Asistente de WORLD CUP LIVE · Mundial 2026</p>
            </div>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              title={voiceOn ? "Silenciar voz" : "Activar voz"}
              className={`font-mono text-[10px] tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                voiceOn ? "border-neon/50 text-neon" : "border-cream/20 text-cream/40"
              }`}
            >
              {voiceOn ? "🔊 VOZ" : "🔇 VOZ"}
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 max-h-[50vh] overflow-y-auto px-5 py-4 space-y-3 scroll-hide">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl font-mono text-xs leading-relaxed ${
                    m.role === "user" ? "bg-neon text-bgnavy rounded-br-sm" : "bg-cream/10 text-cream rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-cream/10 px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neon animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-neon animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {messages.length < 3 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="font-mono text-[10px] text-cream/60 border border-cream/15 rounded-full px-3 py-1.5 hover:border-neon/50 hover:text-neon transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="px-4 py-3 border-t border-cream/10 flex items-center gap-2"
          >
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                aria-label="Hablar con el asistente"
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  listening ? "bg-red text-white" : "liquid-glass hover:text-neon"
                }`}
              >
                {listening ? (
                  <span className="flex items-end gap-0.5 h-4">
                    <span className="mic-bar w-0.5 h-full bg-white" style={{ animationDelay: "0ms" }} />
                    <span className="mic-bar w-0.5 h-full bg-white" style={{ animationDelay: "120ms" }} />
                    <span className="mic-bar w-0.5 h-full bg-white" style={{ animationDelay: "240ms" }} />
                  </span>
                ) : (
                  "🎤"
                )}
              </button>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Escuchando…" : "Escribí tu pregunta…"}
              className="flex-1 bg-transparent border border-cream/15 rounded-full px-4 py-2.5 font-mono text-xs text-cream placeholder:text-cream/30 focus:outline-none focus:border-neon/50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 font-anton text-xs tracking-widest px-4 py-2.5 rounded-full bg-neon text-bgnavy disabled:opacity-30 hover:shadow-[0_0_18px_rgba(111,255,0,0.5)] transition-shadow"
            >
              IR
            </button>
          </form>
        </div>
      )}
    </>
  );
}
