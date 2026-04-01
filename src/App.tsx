/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import confetti from "canvas-confetti";

export default function App() {
  const [yesSize, setYesSize] = useState(1);
  const [noSize, setNoSize] = useState(1);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [isAccepted, setIsAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const startMusic = () => {
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  const noCountLimit = 5;
  const noHidden = noCount >= noCountLimit;
  const loveLabels = ["Dostluq", "Maraq", "Heyranlıq", "Sevgi", "Eşq", "Dəlilik"];
  const currentLabel = isAccepted ? loveLabels[loveLabels.length - 1] : loveLabels[Math.min(noCount, loveLabels.length - 1)];
  const progress = isAccepted ? 100 : Math.min((noCount / noCountLimit) * 100, 100);

  // Sound effects
  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked:", e));
  };

  const sounds = {
    pop: "https://assets.mixkit.co/sfx/preview/mixkit-pop-down-2356.mp3",
    whoosh: "https://assets.mixkit.co/sfx/preview/mixkit-light-swoosh-transition-198.mp3",
    celebration: "https://assets.mixkit.co/sfx/preview/mixkit-shimmering-tinkle-bell-notification-596.mp3",
    fireworks: "https://assets.mixkit.co/sfx/preview/mixkit-fireworks-bang-and-crackle-2986.mp3"
  };

  // Move the "NO" button to a random position
  const moveNoButton = () => {
    if (noHidden || !containerRef.current) return;
    
    playSound(sounds.whoosh);
    
    const container = containerRef.current.getBoundingClientRect();
    const buttonWidth = 120;
    const buttonHeight = 50;
    
    const maxX = container.width - buttonWidth;
    const maxY = container.height - buttonHeight;
    
    // Random position within the container
    const newX = Math.random() * maxX - (container.width / 2 - buttonWidth / 2);
    const newY = Math.random() * maxY - (container.height / 2 - buttonHeight / 2);
    
    setNoPosition({ x: newX, y: newY });
    setNoCount(prev => prev + 1);
    setIsPlaying(true);
    
    // Increase YES size and decrease NO size
    setYesSize(prev => prev + 0.4);
    setNoSize(prev => Math.max(0.1, prev - 0.15));
  };

  const handleYesClick = () => {
    setIsAccepted(true);
    setIsPlaying(true);
    playSound(sounds.pop);
    playSound(sounds.celebration);
    playSound(sounds.fireworks);
    
    // Trigger confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 20 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 400);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center bg-[#050505] font-sans"
    >
      <AnimatePresence>
        {!isStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] cursor-pointer"
            onClick={() => {
              setIsStarted(true);
              startMusic();
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="mb-8"
            >
              <Heart className="w-32 h-32 text-pink-500 fill-pink-500 drop-shadow-[0_0_30px_rgba(236,72,153,0.6)]" />
            </motion.div>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white text-2xl font-black tracking-[0.2em] uppercase"
            >
              Giriş üçün toxun 💖
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Music - Die with a Smile (YouTube Iframe) */}
      {isStarted && isPlaying && (
        <div className="fixed -top-[1000px] -left-[1000px] opacity-0 pointer-events-none">
          <iframe 
            width="100" 
            height="100" 
            src="https://www.youtube.com/embed/ox4tmEV6-QU?autoplay=1&loop=1&playlist=ox4tmEV6-QU" 
            title="Die with a Smile" 
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen
          />
        </div>
      )}

      {/* Music Toggle Button */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
        <button 
          onClick={toggleMusic}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-lg"
          title={isPlaying ? "Musiqini söndür" : "Musiqini aç"}
        >
          {isPlaying ? (
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <span className="text-2xl">🎵</span>
            </motion.div>
          ) : (
            <span className="text-2xl opacity-50">🔇</span>
          )}
        </button>
        
        {!isPlaying && isStarted && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            onClick={() => setIsPlaying(true)}
            className="text-[12px] text-white font-bold uppercase tracking-widest bg-pink-600 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(219,39,119,0.5)] border border-pink-400"
          >
            Səs gəlmir? Bura bas! 🔄
          </motion.button>
        )}
      </div>

      {/* Flash effect on acceptance */}
      <AnimatePresence>
        {isAccepted && (
          <motion.div
            key="flash"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-white z-[60] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Video Background - Dynamic switch on acceptance */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isAccepted ? (
            <motion.div
              key="sea-placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute top-0 left-0 w-full h-full bg-[#0a0a2a]"
            />
          ) : (
            <motion.div
              key="cat-photo-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
              className="absolute inset-0"
            >
              <img
                src="https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=1920&q=80"
                alt="Cute Cat Celebration"
                referrerPolicy="no-referrer"
                className="absolute top-0 left-0 w-full h-full object-cover brightness-[0.6] contrast-[1.1]"
              />
              {/* Heart Glow Overlay to match the image */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-[600px] h-[600px] bg-pink-500/20 rounded-full blur-[120px]" />
                <Heart className="w-[400px] h-[400px] text-pink-500/30 absolute blur-[40px]" fill="currentColor" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Deep Night Overlays - Darker for more atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
      </div>

      {/* Content Overlay */}
      <div className={`relative z-10 flex flex-col items-center w-full h-full px-4 text-center ${!isAccepted ? 'justify-center' : ''}`}>
        <AnimatePresence mode="wait">
          {!isAccepted ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex flex-col items-center gap-12 w-full"
            >
              {/* Love Meter */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <Heart className="w-full h-full text-white/20 absolute" />
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: `${progress}%` }}
                    className="absolute bottom-0 w-full overflow-hidden flex items-end justify-center"
                  >
                    <Heart className="w-24 h-24 text-pink-500 fill-pink-500" />
                  </motion.div>
                  <motion.span 
                    key={noCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-10 text-white font-bold text-sm drop-shadow-md"
                  >
                    {Math.round(progress)}%
                  </motion.span>
                </div>
                <motion.span
                  key={currentLabel}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-pink-300 font-medium tracking-widest uppercase text-xs bg-pink-900/40 px-4 py-1 rounded-full border border-pink-500/30 backdrop-blur-sm"
                >
                  Səviyyə: {currentLabel}
                </motion.span>
              </div>

              <motion.h1 
                animate={{ 
                  scale: [1, 1.03, 1],
                  textShadow: [
                    "0 0 10px rgba(255,182,193,0.3), 0 0 20px rgba(255,182,193,0.2)",
                    "0 0 20px rgba(255,105,180,0.6), 0 0 40px rgba(255,105,180,0.3)",
                    "0 0 10px rgba(255,182,193,0.3), 0 0 20px rgba(255,182,193,0.2)"
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl md:text-8xl font-bold text-pink-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] tracking-tight font-romantic"
              >
                FƏZİLƏ MENƏN SEVGİLİ OLARSANN? ❤️
              </motion.h1>

              <div className="flex flex-col md:flex-row items-center justify-center gap-8 min-h-[300px] w-full relative">
                {/* YES Button */}
                <motion.button
                  onClick={handleYesClick}
                  animate={{ 
                    scale: [yesSize, yesSize * 1.05, yesSize],
                    rotate: [0, 1, -1, 0],
                    boxShadow: [
                      "0 0 25px rgba(255,105,180,0.5)",
                      "0 0 50px rgba(255,105,180,0.8)",
                      "0 0 25px rgba(255,105,180,0.5)"
                    ]
                  }}
                  transition={{ 
                    scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  whileHover={{ scale: yesSize * 1.1, rotate: 0 }}
                  whileTap={{ scale: yesSize * 0.9 }}
                  className="relative px-14 py-7 text-white rounded-[2rem] text-4xl font-black shadow-2xl transition-all duration-300 z-20 overflow-hidden border-4 border-pink-300/60"
                  style={{ 
                    backgroundImage: 'url("https://images.unsplash.com/photo-1573865667245-092c107295d3?auto=format&fit=crop&w=500&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Pink Glow Overlay */}
                  <div className="absolute inset-0 bg-pink-500/20 mix-blend-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 to-transparent" />
                  <span className="relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] flex items-center gap-2">
                    YES <Heart className="w-8 h-8 fill-pink-400 text-pink-400 inline" />
                  </span>
                </motion.button>

                {/* NO Button - Only show if count < 5 */}
                {!noHidden && (
                  <motion.button
                    onMouseEnter={moveNoButton}
                    onClick={moveNoButton}
                    animate={{ 
                      x: noPosition.x, 
                      y: noPosition.y,
                      scale: noSize,
                      rotate: [0, 5, -5, 0],
                      opacity: 1 - (noCount * 0.15)
                    }}
                    transition={{ 
                      x: { type: "spring", stiffness: 400, damping: 25 },
                      y: { type: "spring", stiffness: 400, damping: 25 },
                      rotate: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="px-8 py-4 bg-red-500 hover:bg-red-400 text-white rounded-full text-2xl font-bold shadow-xl transition-colors duration-300 z-10"
                  >
                    YOX 😭
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center gap-8 w-full px-4 py-20 overflow-y-auto custom-scrollbar z-30"
            >
              {/* Love Meter in Success Screen */}
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <Heart className="w-full h-full text-white/20 absolute" />
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 1 }}
                    className="absolute bottom-0 w-full overflow-hidden flex items-end justify-center"
                  >
                    <Heart className="w-24 h-24 text-pink-500 fill-pink-500" />
                  </motion.div>
                  <span className="relative z-10 text-white font-bold text-sm drop-shadow-md">
                    100%
                  </span>
                </div>
                <span className="text-pink-300 font-medium tracking-widest uppercase text-xs bg-pink-900/40 px-4 py-1 rounded-full border border-pink-500/30 backdrop-blur-sm">
                  Səviyyə: Dəlilik
                </span>
              </div>

              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <Heart className="w-40 h-40 text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]" />
              </motion.div>
              <div className="relative flex flex-col items-center">
                {/* Rotating "GÖZELİY" texts */}
                {[0, 72, 144, 216, 288].map((angle, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    style={{ width: '500px', height: '500px' }}
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-pink-300 font-black text-3xl tracking-[0.5em] drop-shadow-[0_0_15px_rgba(255,182,193,0.8)]"
                      style={{ transform: `rotate(${angle}deg) translateY(-220px)` }}
                    >
                      GÖZELİY
                    </motion.span>
                  </motion.div>
                ))}

                <motion.h2 
                  animate={{ 
                    textShadow: [
                      "0 0 15px rgba(255,182,193,0.4), 0 0 30px rgba(255,182,193,0.2)",
                      "0 0 30px rgba(255,105,180,0.8), 0 0 60px rgba(255,105,180,0.4)",
                      "0 0 15px rgba(255,182,193,0.4), 0 0 30px rgba(255,182,193,0.2)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="text-7xl md:text-9xl font-black text-pink-400 drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] italic font-romantic relative z-10"
                >
                  YESS AXIR 😍❤️
                </motion.h2>
              </div>
              <p className="text-white text-xl md:text-2xl font-medium opacity-90 mt-8 bg-black/60 px-8 py-4 rounded-2xl backdrop-blur-md border border-white/20 max-w-2xl leading-relaxed">
                ESLİNDE SENİ ROBLOXDA OLANAN BERİ SEVİRDİM AMA YENEDE BAŞQASINI SEVİRSENSE PROBLEM DEİL DOSD QALA BİLERİY
              </p>

              {/* Favorite Things Book */}
              <motion.div
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
                style={{ perspective: "1000px" }}
                className="mt-12 w-full max-w-md relative"
              >
                <div className="bg-[#fff9e6] rounded-r-3xl rounded-l-lg shadow-[20px_20px_60px_rgba(0,0,0,0.5)] border-l-[15px] border-pink-500 p-8 relative overflow-hidden min-h-[500px] flex flex-col">
                  {/* Book Texture/Lines */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #d1d1d1 32px)' }} />
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2 }}
                    className="text-pink-600 font-black text-3xl mb-8 border-b-4 border-pink-200 pb-2 flex items-center gap-3 relative z-10"
                  >
                    📖 SEVDİYİN ŞEYLER
                  </motion.h3>
                  
                  <ul className="space-y-6 relative z-10 flex-grow">
                    {[
                      { label: "ŞKALAD", value: "ALPEN GOLD (AĞ)" },
                      { label: "FUTBOLCU", value: "NEYMAR" },
                      { label: "MEŞQ", value: "VOLEYBOLL" },
                      { label: "YEMEY", value: "DOLMA" },
                      { label: "İNSAN", value: "EX SİN 😔" },
                      { label: "SOSYAL MEDYA", value: "TİKTOK" },
                      { label: "OYUN", value: "ROBLOX" },
                      { label: "RENG", value: "AĞ" },
                      { label: "HEYVAN", value: "PİŞİYY 🐱" }
                    ].map((item, idx) => (
                      <motion.li 
                        key={idx}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 2.5 + (idx * 0.2) }}
                        className="flex flex-col border-b-2 border-pink-100/50 pb-2"
                      >
                        <span className="text-pink-500 text-sm font-black uppercase tracking-widest">{item.label}</span>
                        <span className="text-gray-900 font-black text-xl mt-1 drop-shadow-sm">{item.value}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Cute Sticker */}
                  <motion.div 
                    animate={{ rotate: [12, 20, 12] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute bottom-6 right-6 opacity-60"
                  >
                    <Heart className="w-16 h-16 text-pink-500 fill-pink-500 drop-shadow-lg" />
                  </motion.div>

                  {/* Page curl effect */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/5 to-transparent rounded-bl-full" />
                </div>
              </motion.div>

              {/* About You Book */}
              <motion.div
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ delay: 4.5, duration: 1, ease: "easeOut" }}
                style={{ perspective: "1000px" }}
                className="mt-12 w-full max-w-md relative"
              >
                <div className="bg-[#fff9e6] rounded-r-3xl rounded-l-lg shadow-[20px_20px_60px_rgba(0,0,0,0.5)] border-l-[15px] border-pink-500 p-8 relative overflow-hidden min-h-[500px] flex flex-col">
                  {/* Book Texture/Lines */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #d1d1d1 32px)' }} />
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 5.2 }}
                    className="text-pink-600 font-black text-3xl mb-8 border-b-4 border-pink-200 pb-2 flex items-center gap-3 relative z-10"
                  >
                    📖 SENİN HAQQINDA
                  </motion.h3>
                  
                  <ul className="space-y-6 relative z-10 flex-grow text-left">
                    {[
                      { label: "TEN RENGİN", value: "ET RENGİ" },
                      { label: "GÖZÜVÜN RENGİ", value: "KEHVEYİ" },
                      { label: "SACIVIN RENGİ", value: "QARA" },
                      { label: "SACIVIN UCUNLUGU", value: "ORTA" },
                      { label: "BOYUN", value: "1.60 - 1.56" },
                      { label: "EN SEVDİYİN YER", value: "DAĞ" },
                      { label: "KG-IN", value: "40 - 45" }
                    ].map((item, idx) => (
                      <motion.li 
                        key={idx}
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 5.8 + (idx * 0.2) }}
                        className="flex flex-col border-b-2 border-pink-100/50 pb-2"
                      >
                        <span className="text-pink-500 text-sm font-black uppercase tracking-widest">{item.label}</span>
                        <span className="text-gray-900 font-black text-xl mt-1 drop-shadow-sm">{item.value}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Cute Sticker */}
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-6 left-6 opacity-60"
                  >
                    <Heart className="w-16 h-16 text-pink-500 fill-pink-500 drop-shadow-lg" />
                  </motion.div>

                  {/* Page curl effect */}
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-black/5 to-transparent rounded-bl-full" />
                </div>
              </motion.div>

              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 7.5 }}
                className="text-white/50 text-sm font-mono tracking-widest mt-12 mb-16"
              >
                cr @YUSİF
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Hearts Animation */}
      {isAccepted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
                y: (typeof window !== 'undefined' ? window.innerHeight : 1000) + 100,
                opacity: 0 
              }}
              animate={{ 
                y: -200,
                opacity: [0, 1, 0],
                rotate: Math.random() * 720
              }}
              transition={{ 
                duration: 2 + Math.random() * 5, 
                repeat: Infinity,
                delay: Math.random() * 3
              }}
              className="absolute text-red-500 text-4xl"
            >
              ❤️
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
