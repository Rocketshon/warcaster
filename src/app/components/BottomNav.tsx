import { useLocation, useNavigate } from 'react-router';
import { Swords, BookOpen, ScrollText, Crosshair, Settings } from 'lucide-react';
import { useCrusade } from '../../lib/CrusadeContext';
import { getPlayerAttentionCount } from '../../lib/attention';

const NAV_ITEMS = [
  { path: '/home', label: 'Campaign', icon: Swords },
  { path: '/battle-lobby', label: 'Battle', icon: Crosshair },
  { path: '/codex', label: 'Codex', icon: BookOpen },
  { path: '/rules', label: 'Rules', icon: ScrollText },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

const CAMPAIGN_PATHS = ['/home', '/campaign', '/create', '/join', '/player', '/log-battle', '/post-battle', '/battle', '/requisition', '/roster', '/add-unit', '/unit', '/cheat-sheet', '/hall-of-fame', '/campaign-map', '/requisition-store'];
const CODEX_PATHS = ['/codex', '/datasheet', '/space-marines'];
const RULES_PATHS = ['/rules', '/rule'];
const BATTLE_PATHS = ['/battle-lobby', '/battle-live', '/quick-battle', '/quick-dice'];
const SETTINGS_PATHS = ['/settings'];

function getActiveTab(pathname: string): string {
  for (const [tab, paths] of [
    ['/home', CAMPAIGN_PATHS],
    ['/codex', CODEX_PATHS],
    ['/rules', RULES_PATHS],
    ['/battle-lobby', BATTLE_PATHS],
    ['/settings', SETTINGS_PATHS],
  ] as const) {
    if (paths.some(p => pathname.startsWith(p))) return tab;
  }
  return '/home';
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { units, currentPlayer } = useCrusade();

  const playerUnits = currentPlayer
    ? units.filter(u => u.player_id === currentPlayer.id)
    : [];
  const attentionCount = getPlayerAttentionCount(playerUnits);

  // Hide nav on auth pages
  const authPaths = ['/sign-in', '/sign-up'];
  if (authPaths.includes(location.pathname)) {
    return null;
  }

  // Determine which tab is active based on current path
  const activeTab = getActiveTab(location.pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-stone-950 border-t border-stone-800">
      {/* Safe area padding for iOS */}
      <div className="flex items-center justify-around px-2 pt-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-stone-500 active:text-stone-300'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-500 rounded-full" />
              )}
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
                {item.path === '/home' && attentionCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </div>
              <span className={`text-[10px] tracking-wide ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}