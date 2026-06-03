/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Bed, Share2, Check, ImagePlus, Trash2, X, Settings, Plus, LogIn, LogOut, Video, Play, Pause } from "lucide-react";
import confetti from "canvas-confetti";
import { auth, db, storage, signInWithGoogle, logout } from "./firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface Memory {
  id: string;
  url: string;
  type: 'image' | 'video';
  category: 'original' | 'dynamic';
  createdAt: any;
  authorUid: string;
}

export default function App() {
  const [yesSize, setYesSize] = useState(1);
  const [noSize, setNoSize] = useState(1);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [isAccepted, setIsAccepted] = useState(true);
  const [showShareToast, setShowShareToast] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentUploadCategory, setCurrentUploadCategory] = useState<'original' | 'dynamic' | null>(null);
  const [musicUrl, setMusicUrl] = useState("abps1Fk5-gc"); // Default YouTube ID
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const hardcodedMemories = [
    "https://i.ibb.co/CpxKFPyv/Screenshot-20250912-015231.jpg",
    "https://i.ibb.co/fzsxbLtN/Screenshot-20260401-023105.jpg",
    "https://i.ibb.co/wFktGxWT/Screenshot-20251214-154010.jpg",
    "https://i.ibb.co/bpSXQyD/Screenshot-20251128-173303-edit-1020005096574489.jpg",
    "https://i.ibb.co/s9YN1j5h/Screenshot-20250912-012700.jpg",
    "https://i.ibb.co/rGTnrhVx/Screenshot-20260401-203401.jpg",
    "https://i.ibb.co/v6wGNg3Y/Screenshot-20260403-203411.jpg",
    "https://i.ibb.co/4gMF7f5k/MG-20250319-003416.jpg",
    "https://i.ibb.co/qMWkzjYW/snaptik-7570338395457654049-0.jpg"
  ];

  const isAdmin = user?.email === "fvhfhbbhghcxnxn@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const memoryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Memory[];
      setMemories(memoryList);
    }, (error) => {
      console.error("Firestore Error:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "backgroundMusic"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.url) {
          // Extract YouTube ID if it's a full URL
          const url = data.url;
          let videoId = url;
          if (url.includes('v=')) {
            videoId = url.split('v=')[1].split('&')[0];
          } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
          } else if (url.includes('embed/')) {
            videoId = url.split('embed/')[1].split('?')[0];
          } else if (url.includes('/shorts/')) {
            videoId = url.split('/shorts/')[1].split('?')[0];
          }
          setMusicUrl(videoId);
        }
      }
    }, (error) => {
      console.error("Settings Error:", error);
    });
    return () => unsubscribe();
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const handleAddVideoUrl = async () => {
    if (!user || !newVideoUrl) return;
    
    const category = isAdmin ? 'original' : 'dynamic';
    
    try {
      await addDoc(collection(db, "memories"), {
        url: newVideoUrl,
        type: 'video',
        category,
        createdAt: serverTimestamp(),
        authorUid: user.uid
      });
      setNewVideoUrl("");
      alert("Video uğurla əlavə edildi!");
    } catch (err) {
      console.error("Error adding video URL:", err);
      alert("Video əlavə edilərkən xəta baş verdi.");
    }
  };

  const handleUpdateMusic = async (url: string) => {
    if (!isAdmin) return;
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "backgroundMusic"), {
        url: url,
        updatedAt: serverTimestamp()
      });
      alert("Mahnı uğurla yeniləndi!");
    } catch (err) {
      console.error("Error updating music:", err);
      alert("Mahnı yenilənərkən xəta baş verdi.");
    }
  };

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

  const handleShare = async () => {
    const shareData = {
      title: "Fəzilə üçün özəl hədiyyə ❤️",
      text: "Bu özəl hədiyyəyə baxın! ❤️",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Navigator share not available");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      
      // Fallback to clipboard for any other error or if share is not available
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      } catch (clipErr) {
        console.error("Clipboard fallback failed:", clipErr);
      }
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, category: 'original' | 'dynamic') => {
    if (!user) {
      console.error("No user logged in");
      return;
    }
    if (category === 'original' && !isAdmin) {
      console.error("Only admin can add to original category");
      return;
    }
    
    const files = e.target.files;
    if (!files) return;

    for (const fileObj of Array.from(files)) {
      const file = fileObj as File;
      const isVideo = file.type.startsWith('video/') || 
                      file.name.toLowerCase().endsWith('.mp4') || 
                      file.name.toLowerCase().endsWith('.mov') || 
                      file.name.toLowerCase().endsWith('.webm');
      const type = isVideo ? 'video' : 'image';
      
      // Limit file size to 50MB
      if (file.size > 50 * 1024 * 1024) {
        alert(`Fayl çox böyükdür (${(file.size / 1024 / 1024).toFixed(1)}MB). Maksimum 50MB icazə verilir.`);
        continue;
      }

      console.log(`Starting upload for ${file.name} (${type}, ${(file.size / 1024 / 1024).toFixed(1)}MB) to ${category}`);
      
      const storageRef = ref(storage, `memories/${Date.now()}_${file.name}`);
      setCurrentUploadCategory(category);
      setUploadProgress(10); // Start progress

      try {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            console.log(`Upload progress: ${progress}%`);
          }, 
          (error) => {
            console.error("Upload failed:", error);
            alert(`Yükləmə xətası: ${error.message}`);
            setUploadProgress(null);
            setCurrentUploadCategory(null);
          }, 
          async () => {
            console.log("Upload successful, getting download URL...");
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL obtained:", downloadURL);
            try {
              await addDoc(collection(db, "memories"), {
                url: downloadURL,
                type,
                category,
                createdAt: serverTimestamp(),
                authorUid: user.uid
              });
              console.log("Memory added to Firestore successfully");
            } catch (err) {
              console.error("Error adding memory to Firestore:", err);
              alert("Məlumat bazasına əlavə edilərkən xəta baş verdi.");
            }
            setUploadProgress(null);
            setCurrentUploadCategory(null);
          }
        );
      } catch (error: any) {
        console.error("Upload initialization failed:", error);
        alert(`Yükləmə başlana bilmədi: ${error.message}`);
        setUploadProgress(null);
        setCurrentUploadCategory(null);
      }
    }
  };

  const removeMemory = async (id: string, authorUid: string) => {
    if (!isAdmin && user?.uid !== authorUid) return;
    try {
      await deleteDoc(doc(db, "memories", id));
    } catch (err) {
      console.error("Error deleting memory:", err);
    }
  };

  const handleVideoPlay = (url: string) => {
    setActiveVideo(url);
    setIsPlaying(false); // Pause background music
  };

  const closeVideo = () => {
    setActiveVideo(null);
    setIsPlaying(true); // Resume background music
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

      {/* Background Music - Dynamic YouTube Iframe */}
      {isStarted && isPlaying && (
        <div className="fixed -top-[1000px] -left-[1000px] opacity-0 pointer-events-none">
          <iframe 
            width="100" 
            height="100" 
            src={`https://www.youtube.com/embed/${musicUrl}?autoplay=1&loop=1&playlist=${musicUrl}`} 
            title="Background Music" 
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

        {/* Login/Logout Button */}
        <button 
          onClick={user ? logout : signInWithGoogle}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-lg text-white"
          title={user ? "Çıxış" : "Giriş"}
        >
          {user ? <LogOut className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
        </button>

        {/* Settings Button - Only for Admin */}
        {isAdmin && (
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all border border-white/20 shadow-lg text-white"
            title="Fərdiləşdir"
          >
            <Settings className="w-6 h-6" />
          </button>
        )}
        
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

      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          key="success-background-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img
            src="https://i.ibb.co/vxY36Dg2/Screenshot-20260401-215327-edit-103135878002608.jpg"
            alt="Celebration Background"
            referrerPolicy="no-referrer"
            className="absolute top-0 left-0 w-full h-full object-cover brightness-[0.6] contrast-[1.1]"
          />
          {/* Heart Glow Overlay */}
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
        {/* Deep Night Overlays - Darker for more atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90" />
        <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-4 text-center">
        <AnimatePresence mode="wait">
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              ref={successRef}
              id="success-screen"
              className="absolute inset-0 flex flex-col items-center gap-8 w-full px-4 py-20 overflow-y-auto custom-scrollbar z-30 scroll-smooth"
            >
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-white font-black text-[14px] tracking-[0.4em] uppercase"
                >
                  ILY NƏDİ?
                </motion.p>
                <motion.div
                animate={{ 
                  scale: [1, 1.3, 1]
                }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="relative flex items-center justify-center"
              >
                <Heart className="w-40 h-40 text-red-500 fill-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]" />
              </motion.div>

              {/* Share Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                onClick={handleShare}
                className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all group"
              >
                <Share2 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Paylaş ❤️
              </motion.button>

              {/* Share Toast */}
              <AnimatePresence>
                {showShareToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-pink-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-pink-400"
                  >
                    <Check className="w-5 h-5" />
                    Link kopyalandı! ❤️
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="relative flex flex-col items-center">
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
                  HƏDİYYƏ 🎁
                </motion.h2>
              </div>

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
                      { label: "SOSYAL MEDYA", value: "TİKTOK" },
                      { label: "OYUN", value: "ROBLOX" },
                      { label: "RENG", value: "AĞ" },
                      { label: "HEYVAN", value: "PİŞİYY 🐱" },
                      { label: "BİKER", value: "MOTOR - VELOSPEED" }
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

              {/* HEYATIMIN KİTABİ - Original Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-16 w-full max-w-5xl mx-auto px-4"
              >
                <div className="relative bg-[#fff9e6] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-l-[20px] border-pink-600 p-8 md:p-12 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(#000 0 1px, transparent 1px 30px)' }} />
                  
                  <motion.h3 
                    className="text-4xl md:text-6xl font-black text-pink-600 mb-12 text-center font-romantic drop-shadow-sm"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    📖 XATİRƏLƏR KİTABI
                  </motion.h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {user && isAdmin && (
                      <motion.label
                        whileHover={{ scale: 1.05 }}
                        className="p-3 pb-10 bg-white/5 border-2 border-dashed border-pink-500/30 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[400px] group hover:bg-pink-500/5 transition-all cursor-pointer relative"
                      >
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, 'original')}
                        />
                        {uploadProgress !== null && currentUploadCategory === 'original' ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
                            <span className="text-pink-500 font-bold">{Math.round(uploadProgress)}%</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus className="text-pink-500 w-8 h-8" />
                            </div>
                            <span className="text-pink-300 font-black tracking-widest uppercase">Əlavə Et +</span>
                          </>
                        )}
                      </motion.label>
                    )}

                    {hardcodedMemories.map((url, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                        initial={{ opacity: 0, rotate: i % 2 === 0 ? -3 : 3 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 + (i * 0.2) }}
                        className={`p-3 pb-10 shadow-xl transform transition-all duration-300 ${
                          [3, 4, 5, 6, 7].includes(i)
                            ? "bg-gradient-to-br from-pink-100 to-white border-4 border-pink-400 shadow-[0_0_25px_rgba(244,114,182,0.6)] ring-4 ring-pink-200/50" 
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        <div className={`aspect-[3/4] overflow-hidden bg-gray-100 relative ${[3, 4, 5, 6, 7].includes(i) ? "rounded-lg" : ""}`}>
                          <img src={url} alt={`Xatirə ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          {[3, 4, 5, 6, 7].includes(i) && (
                            <div className="absolute inset-0 border-[6px] border-pink-300/30 pointer-events-none z-10 rounded-lg" />
                          )}
                        </div>
                        <div className={`mt-4 text-center font-romantic font-bold text-lg ${[3, 4, 5, 6, 7].includes(i) ? "text-pink-600 scale-110" : "text-pink-500"}`}>
                          {[3, 4, 5, 6, 7].includes(i) ? "✨ ÖZƏL XATİRƏ ✨" : `❤️ Xatirə #${i + 1}`}
                        </div>
                      </motion.div>
                    ))}

                    {memories.filter(m => m.category === 'original').map((memory, i) => (
                      <motion.div
                        key={memory.id}
                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                        initial={{ opacity: 0, rotate: i % 2 === 0 ? -3 : 3 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className={`p-3 pb-10 shadow-xl transform transition-all duration-300 relative group ${
                          memory.type === 'video'
                            ? "bg-gradient-to-br from-blue-100 to-white border-4 border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.6)] ring-4 ring-blue-200/50"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        {isAdmin && (
                          <button 
                            onClick={() => removeMemory(memory.id, memory.authorUid)}
                            className="absolute top-4 right-4 z-30 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className={`aspect-[3/4] overflow-hidden bg-gray-100 relative ${memory.type === 'video' ? "rounded-lg" : ""}`}>
                          {memory.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black cursor-pointer group" onClick={() => handleVideoPlay(memory.url)}>
                              <Video className="w-12 h-12 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                              </div>
                            </div>
                          ) : (
                            <img src={memory.url} alt={`Xatirə ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className={`mt-4 text-center font-romantic font-bold text-lg ${memory.type === 'video' ? 'text-blue-600' : "text-pink-500"}`}>
                          {memory.type === 'video' ? "🎬 VİDEO XATİRƏ" : `❤️ Xatirə #${i + 1}`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* SƏNİN KİTABIN - Dynamic Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="mt-16 w-full max-w-5xl mx-auto px-4"
              >
                <div className="relative bg-[#fff9e6] rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-l-[20px] border-blue-600 p-8 md:p-12 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(#000 0 1px, transparent 1px 30px)' }} />
                  
                  <motion.h3 
                    className="text-4xl md:text-6xl font-black text-blue-600 mb-12 text-center font-romantic drop-shadow-sm"
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    📖 SƏNİN KİTABIN +
                  </motion.h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {user ? (
                      <motion.label
                        whileHover={{ scale: 1.05 }}
                        className="p-3 pb-10 bg-white/5 border-2 border-dashed border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[400px] group hover:bg-blue-500/5 transition-all cursor-pointer relative"
                      >
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*,video/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, 'dynamic')}
                        />
                        {uploadProgress !== null && currentUploadCategory === 'dynamic' ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            <span className="text-blue-500 font-bold">{Math.round(uploadProgress)}%</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Plus className="text-blue-500 w-8 h-8" />
                            </div>
                            <span className="text-blue-300 font-black tracking-widest uppercase">Əlavə Et +</span>
                          </>
                        )}
                      </motion.label>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={signInWithGoogle}
                        className="p-3 pb-10 bg-white/5 border-2 border-dashed border-blue-500/30 rounded-2xl flex flex-col items-center justify-center gap-4 min-h-[400px] group hover:bg-blue-500/5 transition-all"
                      >
                        <LogIn className="text-blue-500 w-12 h-12 mb-2" />
                        <span className="text-blue-300 font-black tracking-widest uppercase text-center px-4">Xatirə əlavə etmək üçün daxil ol</span>
                      </motion.button>
                    )}

                    {memories.filter(m => m.category === 'dynamic').map((memory, i) => (
                      <motion.div
                        key={memory.id}
                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                        initial={{ opacity: 0, rotate: i % 2 === 0 ? -3 : 3 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className={`p-3 pb-10 shadow-xl transform transition-all duration-300 relative group ${
                          memory.type === 'video'
                            ? "bg-gradient-to-br from-blue-100 to-white border-4 border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.6)] ring-4 ring-blue-200/50"
                            : "bg-white border border-gray-200"
                        }`}
                      >
                        {(isAdmin || user?.uid === memory.authorUid) && (
                          <button 
                            onClick={() => removeMemory(memory.id, memory.authorUid)}
                            className="absolute top-4 right-4 z-30 p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <div className={`aspect-[3/4] overflow-hidden bg-gray-100 relative ${memory.type === 'video' ? "rounded-lg" : ""}`}>
                          {memory.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black cursor-pointer group" onClick={() => handleVideoPlay(memory.url)}>
                              <Video className="w-12 h-12 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                              </div>
                            </div>
                          ) : (
                            <img src={memory.url} alt={`Xatirə ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <div className={`mt-4 text-center font-romantic font-bold text-lg ${memory.type === 'video' ? 'text-blue-600' : "text-blue-500"}`}>
                          {memory.type === 'video' ? "🎬 VİDEO XATİRƏ" : `💙 Xatirə #${i + 1}`}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Cute Bed Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 7.0 }}
                className="mt-16 flex flex-col items-center gap-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-pink-200/30 p-6 rounded-full backdrop-blur-sm border border-pink-300/20"
                  >
                    <Bed className="w-16 h-16 text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]" />
                  </motion.div>
                  {/* Sleeping Zs */}
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.5, x: 20, y: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0.5, 1.2, 0.8],
                        x: [20, 40, 50],
                        y: [0, -30, -50]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: i * 1,
                        ease: "easeOut"
                      }}
                      className="absolute top-0 right-0 text-pink-300 font-bold text-xl"
                    >
                      Z
                    </motion.span>
                  ))}
                </div>
                <p className="text-pink-200/60 text-sm font-medium italic">Şirin yuxular... 😴✨</p>
              </motion.div>

              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 7.5 }}
                className="text-white/50 text-sm font-mono tracking-widest mt-8 mb-8"
              >
                cr @TTMARKAF
              </motion.span>

              {/* TikTok Feedback Button */}
              <motion.a
                href="https://www.tiktok.com/@tt44markaf"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 8 }}
                className="flex items-center gap-3 bg-black/80 hover:bg-black text-white px-8 py-4 rounded-2xl border border-white/20 shadow-2xl transition-all mb-20 group"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  className="w-6 h-6 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.98-.23-2.81.31-.75.42-1.24 1.25-1.33 2.1-.1.7.06 1.42.46 2.01.73 1.04 2.09 1.48 3.27 1.07 1.14-.38 1.9-1.61 1.92-2.81V.02z"/>
                </svg>
                <span className="font-bold tracking-wide">GERİ BİLDİRİŞ</span>
              </motion.a>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Personalization Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] w-full max-w-2xl max-h-[80vh] rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h2 className="text-white text-2xl font-black flex items-center gap-3">
                  <ImagePlus className="text-pink-500" /> Fərdiləşdir
                </h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                {/* URL Inputs Section */}
                <div className="space-y-6 mb-8">
                  {/* Video URL Input */}
                  <div className="space-y-2">
                    <label className="text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">
                      YOUTUBEDEN MAHNIN LİNKİ GOTUR YAPŞDIR
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                      />
                      <button 
                        onClick={handleAddVideoUrl}
                        className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Əlavə Et
                      </button>
                    </div>
                  </div>

                  {/* Music URL Input (Admin Only) */}
                  {isAdmin && (
                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div className="space-y-2">
                        <label className="text-pink-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1">
                          YOUTUBEDEN MAHNIN LİNKİ GOTUR YAPŞDIR
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            defaultValue={`https://www.youtube.com/watch?v=${musicUrl}`}
                            onBlur={(e) => handleUpdateMusic(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500/50 transition-colors"
                          />
                          <button 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold transition-all"
                            onClick={(e) => {
                              const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                              handleUpdateMusic(input.value);
                            }}
                          >
                            Yenilə
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Add New Button */}
                  <label className="aspect-[3/4] border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-pink-500/50 hover:bg-pink-500/5 transition-all group relative">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, isAdmin ? 'original' : 'dynamic')}
                    />
                    {uploadProgress !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
                        <span className="text-pink-500 font-bold text-xs">{Math.round(uploadProgress)}%</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                          <Plus className="text-white group-hover:text-pink-500 transition-colors" />
                        </div>
                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest group-hover:text-pink-500/70 transition-colors text-center px-2">Şəkil və ya Video Əlavə Et</span>
                      </>
                    )}
                  </label>

                  {memories.filter(m => isAdmin ? m.category === 'original' : m.category === 'dynamic').map((memory, i) => (
                    <div key={memory.id} className="relative aspect-[3/4] group rounded-2xl overflow-hidden border border-white/10">
                      {memory.type === 'video' ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Video className="text-blue-500 w-12 h-12 opacity-50" />
                        </div>
                      ) : (
                        <img 
                          src={memory.url} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeMemory(memory.id, memory.authorUid)}
                          className="p-3 bg-red-500 rounded-full text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-600/20"
                >
                  Tamamla
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Player Overlay */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4"
          >
            <button 
              onClick={closeVideo}
              className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md z-[210]"
            >
              <X className="w-8 h-8" />
            </button>
            
            <div className="w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {activeVideo.includes('youtube.com') || activeVideo.includes('youtu.be') ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${activeVideo.split('v=')[1]?.split('&')[0] || activeVideo.split('/').pop()}?autoplay=1`}
                  title="Video Memory" 
                  frameBorder="0" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                />
              ) : (
                <video 
                  src={activeVideo} 
                  controls 
                  autoPlay 
                  playsInline
                  className="w-full h-full"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
