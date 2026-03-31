import { useNavigate } from 'react-router';
import { Loader2, Download, Trash2, RefreshCw, AlertCircle, Gamepad2, Check } from 'lucide-react';
import { useGameData } from '../../lib/GameDataContext';
import { toast } from 'sonner';

export default function GameSelector() {
  const navigate = useNavigate();
  const {
    manifest, manifestLoading, manifestError,
    activeGameId, dataLoading, dataError,
    refreshManifest, selectGame, clearGame, clearCache, isCached,
  } = useGameData();

  const handleSelect = async (gameId: string) => {
    await selectGame(gameId);
    toast.success('Game data loaded');
    navigate('/army');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 pt-6 pb-24">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Gamepad2 className="w-12 h-12 text-[var(--accent-gold)] mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-wider mb-2">
            Select Game
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Choose a game system to load its datasheets, rules, and factions.
          </p>
        </div>

        {/* Loading manifest */}
        {manifestLoading && (
          <div className="flex flex-col items-center py-16">
            <Loader2 className="w-8 h-8 text-[var(--accent-gold)] animate-spin mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">Loading available games...</p>
          </div>
        )}

        {/* Manifest error */}
        {manifestError && !manifestLoading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm font-medium text-red-400">Failed to load game list</p>
            </div>
            <p className="text-xs text-red-300/70 mb-3">{manifestError}</p>
            <button
              onClick={refreshManifest}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-red-500/40 text-red-400 text-xs hover:bg-red-500/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Data loading overlay */}
        {dataLoading && (
          <div className="rounded-lg border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/5 p-6 mb-6 text-center">
            <Loader2 className="w-8 h-8 text-[var(--accent-gold)] animate-spin mx-auto mb-3" />
            <p className="text-sm text-[var(--text-primary)] font-medium">Downloading game data...</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">This may take a moment on first load</p>
          </div>
        )}

        {/* Data error */}
        {dataError && !dataLoading && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 mb-6">
            <p className="text-sm text-red-400">{dataError}</p>
          </div>
        )}

        {/* Game list */}
        {manifest && !manifestLoading && (
          <div className="space-y-3">
            {manifest.games.map(game => {
              const isActive = activeGameId === game.id;
              const cached = isCached(game.id);
              return (
                <div
                  key={game.id}
                  className={`rounded-lg border overflow-hidden transition-all ${
                    isActive
                      ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/5'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                  }`}
                >
                  <button
                    onClick={() => handleSelect(game.id)}
                    disabled={dataLoading}
                    className="w-full p-4 text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{game.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-[var(--text-primary)]">{game.name}</h3>
                          {isActive && <Check className="w-4 h-4 text-[var(--accent-gold)]" />}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{game.edition} · v{game.version}</p>
                        {game.description && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{game.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] font-semibold">Active</span>
                        ) : cached ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Cached</span>
                        ) : (
                          <Download className="w-4 h-4 text-[var(--text-secondary)]" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Actions for cached/active games */}
                  {(isActive || cached) && (
                    <div className="flex items-center gap-2 px-4 pb-3">
                      {cached && !isActive && (
                        <button
                          onClick={() => { clearCache(game.id); toast.success('Cache cleared'); }}
                          className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Clear cache
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => { clearGame(); toast.success('Game unloaded'); }}
                          className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Unload
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {manifest.games.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-[var(--text-secondary)]">No games available yet.</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Check back soon or configure a custom manifest URL in Settings.</p>
              </div>
            )}
          </div>
        )}

        {/* Refresh button */}
        {manifest && !manifestLoading && (
          <button
            onClick={refreshManifest}
            className="w-full mt-6 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-2 hover:border-[var(--accent-gold)]/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Game List
          </button>
        )}

        {/* Using bundled data notice */}
        {!activeGameId && (
          <div className="mt-6 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4 text-center">
            <p className="text-xs text-[var(--text-secondary)]">
              No game selected — using bundled data.
            </p>
            <button
              onClick={() => navigate('/army')}
              className="mt-2 text-xs text-[var(--accent-gold)] hover:underline"
            >
              Continue with bundled data →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
