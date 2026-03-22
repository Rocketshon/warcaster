import { useState, useEffect } from 'react';
import {
  Swords,
  ScrollText,
  BookOpen,
  Users,
  Target,
  Smartphone,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const TUTORIAL_KEY = 'crusade_command_tutorial_completed';

interface TutorialSlide {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const SLIDES: TutorialSlide[] = [
  {
    icon: <Sparkles className="w-10 h-10 text-amber-400" />,
    title: 'Welcome, Commander',
    description:
      'Crusade Command is your mobile companion for Warhammer 40K Crusade campaigns. Track your forces, log battles, and browse rules — all in one place.',
  },
  {
    icon: <Smartphone className="w-10 h-10 text-emerald-400" />,
    title: 'Navigation',
    description:
      'Use the bottom navigation bar to switch between sections. On mobile, swipe left or right to go back. You can also use the back arrow at the top of each page.',
  },
  {
    icon: <Swords className="w-10 h-10 text-red-400" />,
    title: 'Campaigns',
    description:
      'Create a new Crusade campaign or join an existing one with a code. Manage your roster, track Requisition Points, and view campaign standings.',
  },
  {
    icon: <ScrollText className="w-10 h-10 text-sky-400" />,
    title: 'Rules',
    description:
      'Browse core Crusade rules, battle sequences, and faction-specific rules. Search by keyword to quickly find what you need mid-game.',
  },
  {
    icon: <BookOpen className="w-10 h-10 text-purple-400" />,
    title: 'Codex & Datasheets',
    description:
      'Look up any unit across all factions. View full datasheets with stats, weapons, abilities, and points costs — no books required.',
  },
  {
    icon: <Users className="w-10 h-10 text-amber-400" />,
    title: 'Roster',
    description:
      'Build your Order of Battle by adding units from your faction. Track experience, battle honours, battle scars, and unit ranks as your crusade progresses.',
  },
  {
    icon: <Target className="w-10 h-10 text-emerald-400" />,
    title: 'Battle Tracker',
    description:
      'Log battles with score tracking, then run through the post-battle sequence — award XP, apply battle honours, and spend Requisition Points.',
  },
];

export default function TutorialOverlay() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY);
    if (!completed) {
      setVisible(true);
      // Trigger fade-in on next frame
      requestAnimationFrame(() => setFadeIn(true));
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setFadeOut(true);
    setTimeout(() => setVisible(false), 400);
  };

  const next = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center p-4 transition-opacity duration-300 ${
        fadeIn && !fadeOut ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-stone-950 border border-stone-700/60 rounded-sm shadow-2xl">
        {/* Skip button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-stone-500 hover:text-stone-300 transition-colors"
          aria-label="Skip tutorial"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="px-6 pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">{slide.icon}</div>

          {/* Title */}
          <h2 className="text-lg font-bold text-stone-100 mb-2 tracking-wide">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-sm text-stone-400 leading-relaxed">{slide.description}</p>
        </div>

        {/* Footer: dots + buttons */}
        <div className="px-6 pb-5">
          {/* Dot indicators */}
          <div className="flex justify-center gap-1.5 mb-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  i === step
                    ? 'bg-emerald-400 w-4'
                    : 'bg-stone-700 hover:bg-stone-500'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={back}
              disabled={isFirst}
              className={`flex items-center gap-1 px-3 py-2 text-sm rounded-sm transition-colors ${
                isFirst
                  ? 'text-stone-700 cursor-not-allowed'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={next}
              className="flex items-center gap-1 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm transition-colors"
            >
              {isLast ? 'Get Started' : 'Next'}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
