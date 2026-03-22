import { useState } from "react";
import { useNavigate } from "react-router";
import { Skull, Eye, EyeOff, AlertCircle, Mail, Lock } from "lucide-react";
import { useCrusade } from "../../lib/CrusadeContext";
import { findCredential, hashPassword } from "../../lib/storage";
import { toast } from "sonner";

export default function SignIn() {
  const navigate = useNavigate();
  const { setUser } = useCrusade();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Validation
  const isFormValid = email.trim() && password.trim();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    setErrorMessage("");

    // Validate
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Please enter your password.");
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const credential = findCredential(normalizedEmail);

    if (!credential) {
      setErrorMessage("Account not found. Please check your email or sign up.");
      return;
    }

    setIsSubmitting(true);

    // Verify password
    const inputHash = await hashPassword(password);
    if (inputHash !== credential.passwordHash) {
      setIsSubmitting(false);
      setErrorMessage("Incorrect password. Please try again.");
      return;
    }

    // Sign in successful
    setUser({
      id: credential.userId,
      email: normalizedEmail,
      display_name: normalizedEmail.split("@")[0],
    });
    setIsSubmitting(false);
    navigate("/home");
  };

  const handleGoogleSignIn = () => {
    toast.info("Coming soon");
  };

  const handleAppleSignIn = () => {
    toast.info("Coming soon");
  };

  const handleForgotPassword = () => {
    toast.info("Coming soon");
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
            Return to the battlefield
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

        {/* Sign In Form */}
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
                className="w-full bg-stone-900 border border-stone-600 rounded-lg pl-11 pr-4 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                placeholder="Enter your password"
                className="w-full bg-stone-900 border border-stone-600 rounded-lg pl-11 pr-12 py-3 text-stone-100 placeholder:text-stone-500 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-emerald-500 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* Forgot Password Link */}
            <div className="mt-2 text-right">
              <button
                onClick={handleForgotPassword}
                className="text-xs text-stone-400 hover:text-emerald-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-lg font-bold transition-all mt-2 ${
              isFormValid && !isSubmitting
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-black hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-stone-800 text-stone-600 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-3 text-stone-500 font-semibold tracking-wider">
                Or
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3 rounded-lg border border-stone-600 bg-stone-900 text-stone-300 font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
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
            onClick={handleAppleSignIn}
            className="w-full py-3 rounded-lg border border-stone-600 bg-stone-900 text-stone-300 font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Continue with Apple
          </button>

          {/* Sign Up Link */}
          <div className="text-center pt-6">
            <p className="text-stone-400 text-sm">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/sign-up")}
                className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
