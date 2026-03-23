import { useState } from "react";
import { useNavigate } from "react-router";
import { Skull, AlertCircle, User } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setErrorMessage("");
    if (!username.trim()) {
      setErrorMessage("Please enter a username.");
      return;
    }

    setIsSubmitting(true);
    const result = await auth.signIn(username);

    if (result.error) {
      setErrorMessage(result.error);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col justify-center min-h-screen py-12">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Skull className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              Crusade Command
            </h1>
          </div>
          <p className="text-stone-400 text-sm tracking-wide">
            Enter your commander name to begin
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="rounded-lg border border-red-500/30 bg-gradient-to-br from-red-950/40 to-stone-950 p-4 mb-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-400 font-semibold text-sm mb-1">Error</h3>
                <p className="text-red-300/80 text-sm">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Username Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Commander Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                placeholder="e.g. Rocketshon"
                autoFocus
                className="w-full bg-stone-900 border border-stone-600 rounded-lg pl-11 pr-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <p className="text-stone-500 text-xs mt-2">
              First time? Just pick a name. Returning? Enter the same name.
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={!username.trim() || isSubmitting}
            className={`w-full py-4 rounded-lg font-bold transition-all mt-2 ${
              username.trim() && !isSubmitting
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-black hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-stone-800 text-stone-600 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Entering..." : "Enter the Battlefield"}
          </button>
        </div>
      </div>
    </div>
  );
}
