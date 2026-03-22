import { useNavigate } from "react-router";
import { Swords, Users } from "lucide-react";

export function CampaignHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Atmospheric background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black opacity-80" />
      
      {/* Subtle green glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-8">
        {/* App Title */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">
            CRUSADE
          </h1>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <p className="text-zinc-400 text-sm tracking-wide uppercase">
            Campaign Manager
          </p>
        </div>

        {/* Instructional Text */}
        <p className="text-zinc-500 text-center text-sm tracking-wide">
          Start or join a Crusade campaign
        </p>

        {/* Action Cards */}
        <div className="w-full space-y-4 mt-8">
          {/* Create Campaign Card */}
          <button
            onClick={() => navigate("/create-campaign")}
            className="group w-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-900/30 rounded-sm p-6 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-950/50 border border-emerald-900/50 rounded-sm p-3 group-hover:border-emerald-500/50 transition-colors group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Swords className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-emerald-400 tracking-wide group-hover:text-emerald-300 transition-colors">
                  Create Campaign
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Begin a new Crusade
                </p>
              </div>
              <div className="text-emerald-600 group-hover:text-emerald-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Join Campaign Card */}
          <button
            onClick={() => navigate("/join-campaign")}
            className="group w-full bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-900/30 rounded-sm p-6 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-950/50 border border-emerald-900/50 rounded-sm p-3 group-hover:border-emerald-500/50 transition-colors group-hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Users className="w-6 h-6 text-emerald-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-emerald-400 tracking-wide group-hover:text-emerald-300 transition-colors">
                  Join Campaign
                </h3>
                <p className="text-zinc-500 text-sm mt-1">
                  Enter an existing Crusade
                </p>
              </div>
              <div className="text-emerald-600 group-hover:text-emerald-500 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Decorative corner elements */}
        <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-emerald-900/30 rounded-tl" />
        <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-emerald-900/30 rounded-tr" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-emerald-900/30 rounded-bl" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-emerald-900/30 rounded-br" />
      </div>
    </div>
  );
}
