import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

const SPLASH_VIDEOS = ['/videos/splash_1.mp4', '/videos/splash_2.mp4'];

export default function Splash() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoIndex] = useState(() => Math.floor(Math.random() * SPLASH_VIDEOS.length));
  const [fadeOut, setFadeOut] = useState(false);

  const handleComplete = () => {
    setFadeOut(true);
    setTimeout(() => navigate('/home', { replace: true }), 600);
  };

  useEffect(() => {
    // Safety timeout — skip after 8 seconds
    const timer = setTimeout(handleComplete, 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`fixed inset-0 bg-black flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src={SPLASH_VIDEOS[videoIndex]}
        autoPlay
        muted
        playsInline
        onEnded={handleComplete}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Skip button */}
      <button
        onClick={handleComplete}
        className="absolute bottom-8 right-8 z-10 text-stone-500 hover:text-stone-300 text-sm transition-colors"
      >
        Skip →
      </button>
    </div>
  );
}
