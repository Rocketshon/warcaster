import { useState } from "react";
import { useNavigate } from "react-router";
import { Skull, Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import { useCrusade } from "../../lib/CrusadeContext";
import { generateId } from "../../lib/storage";
import { toast } from "sonner";

export default function SignUp() {
  const navigate = useNavigate();
  const { setUser } = useCrusade();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Validation
  const isEmailValid = email.includes("@") && email.includes(".");
  const isPasswordValid = password.length >= 8;
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isFormValid = isEmailValid && isPasswordValid && doPasswordsMatch;

  const handleCreateAccount = () => {
    setErrorMessage("");

    // Validate
    if (!isEmailValid) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!isPasswordValid) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    if (!doPasswordsMatch) {
      setErrorMessage("Passwords don't match. Please try again.");
      return;
    }

    // Check if email already in use
    const storedUser = localStorage.getItem("crusade_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.email?.toLowerCase() === email.toLowerCase().trim()) {
          setErrorMessage("Email already in use. Please sign in or use a different email.");
          return;
        }
      } catch {
        // invalid stored data, continue
      }
    }

    // Create user object and store in localStorage
    const displayName = email.split("@")[0];
    const newUser = {
      id: generateId(),
      email: email.trim().toLowerCase(),
      display_name: displayName,
    };

    setUser(newUser);

    // Navigate to home after successful signup
    navigate("/home");
  };

  const handleGoogleSignUp = () => {
    toast.info("Coming soon");
  };

  const handleAppleSignUp = () => {
    toast.info("Coming soon");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col p-6 relative overflow-hidden">
      {/* Dark ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col justify-center min-h-screen py-12">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Skull className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
            <h1 className="text-4xl font-bold text-stone-100 tracking-wider drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              Crusade Command
            </h1>
          </div>
          <p className="text-stone-500 text-sm tracking-wide">
            Begin your Crusade
          </p>
        </div>

        {/* Error Message Area */}
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

        {/* Sign Up Form */}
        <div className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="commander@imperium.com"
                className="w-full bg-gradient-to-br from-stone-900 to-stone-950 border border-emerald-500/20 rounded-lg pl-11 pr-4 py-3 text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Minimum 8 characters"
                className="w-full bg-gradient-to-br from-stone-900 to-stone-950 border border-emerald-500/20 rounded-lg pl-11 pr-12 py-3 text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500/50" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Re-enter password"
                className="w-full bg-gradient-to-br from-stone-900 to-stone-950 border border-emerald-500/20 rounded-lg pl-11 pr-12 py-3 text-stone-100 placeholder:text-stone-600 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-emerald-500 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Create Account Button */}
          <button
            onClick={handleCreateAccount}
            disabled={!isFormValid}
            className={`w-full py-4 rounded-lg font-bold transition-all mt-2 ${
              isFormValid
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-black hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-stone-800 text-stone-600 cursor-not-allowed"
            }`}
          >
            Create Account
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-3 text-stone-600 font-semibold tracking-wider">
                Or
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-3 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 text-stone-300 font-semibold hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            onClick={handleAppleSignUp}
            className="w-full py-3 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-stone-900 to-stone-950 text-stone-300 font-semibold hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>

          {/* Sign In Link */}
          <div className="text-center pt-6">
            <p className="text-stone-500 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/sign-in")}
                className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
