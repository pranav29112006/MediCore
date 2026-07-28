import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AdminDashboard } from "../components/dashboards/AdminDashboard";
import { DoctorDashboard } from "../components/dashboards/DoctorDashboard";
import { NurseDashboard } from "../components/dashboards/NurseDashboard";
import { ReceptionistDashboard } from "../components/dashboards/ReceptionistDashboard";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Activity,
  Heart,
  Stethoscope,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

type Role = "doctor" | "nurse" | "admin" | "receptionist";
type Mode = "login" | "signup" | "email-sent" | "forgot_password" | "reset_password";
type AuthFlow = "login" | "signup";

// ─── Data ────────────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: "doctor", label: "Doctor", description: "Clinical care & prescriptions" },
  { value: "nurse", label: "Nurse", description: "Patient monitoring & support" },
  { value: "admin", label: "Administrator", description: "System & staff management" },
  { value: "receptionist", label: "Receptionist", description: "Appointments & registration" },
];

const NAME_PLACEHOLDERS: Record<Role, string> = {
  doctor: "Dr. Sarah Mitchell",
  nurse: "Emily Carter",
  admin: "Michael Hayes",
  receptionist: "Jessica Brown",
};

const STATS = [
  { label: "Patients Today", value: "284", icon: Heart, color: "text-rose-400" },
  { label: "Active Wards", value: "12", icon: Activity, color: "text-emerald-400" },
  { label: "Staff Online", value: "47", icon: Stethoscope, color: "text-blue-400" },
  { label: "Critical Alerts", value: "3", icon: Shield, color: "text-amber-400" },
];

// Hero slideshow: doctor + clinical images from Unsplash
const SLIDES = [
  {
    id: 0,
    url: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?w=900&h=1200&fit=crop&auto=format",
    alt: "Female doctor with stethoscope",
    caption: "Empowering clinicians with real-time insight",
  },
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=900&h=1200&fit=crop&auto=format",
    alt: "Doctor reviewing patient data on tablet",
    caption: "Patient data, always at your fingertips",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1516841273335-e39b37888115?w=900&h=1200&fit=crop&auto=format",
    alt: "Medical team in hospital hallway",
    caption: "Built for every member of your care team",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1673865641073-4479f93a7776?w=900&h=1200&fit=crop&auto=format",
    alt: "Doctor presenting in clinical setting",
    caption: "AI-powered summaries for faster decisions",
  },
];

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function useSlideshow(count: number, interval = 5000) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex((next + count) % count);
  };

  useEffect(() => {
    timer.current = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, interval);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [count, interval]);

  const manual = (next: number) => {
    if (timer.current) clearInterval(timer.current);
    go(next);
    timer.current = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, interval);
  };

  return { index, direction, manual };
}

// ─── Small Components ─────────────────────────────────────────────────────────

function InputField({
  label, type, value, onChange, placeholder, icon: Icon, error, autoComplete,
}: {
  label: string; type: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ElementType; error?: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className={`relative flex items-center rounded-lg border transition-all duration-200 bg-input-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary ${error ? "border-destructive" : "border-border"}`}>
        <Icon className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}

function RoleCard({ role, selected, onSelect }: { role: (typeof ROLES)[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect}
      className={`relative flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer ${selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-input-background text-muted-foreground hover:border-primary/40 hover:bg-secondary"}`}>
      {selected && <CheckCircle2 className="absolute top-2 right-2 size-3.5 text-primary" />}
      <span className="text-xs font-semibold">{role.label}</span>
      <span className="text-[10px] leading-tight opacity-70">{role.description}</span>
    </button>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────

function EmailSentScreen({ email, type, onBack }: { email: string; type: AuthFlow; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-6 items-center text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex size-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30"
      >
        <Mail className="size-9 text-primary" />
      </motion.div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold text-foreground">Check your email</h3>
        <p className="text-sm text-muted-foreground">
          We sent a verification link to:
        </p>
        <p className="font-semibold text-primary">{email}</p>
      </div>
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-left w-full">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Next steps:</strong><br />
          1. Open your email inbox (check spam/junk too)<br />
          2. Click the verification link in the email<br />
          3. Your dashboard will open — you can close this tab
        </p>
      </div>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-left w-full">
        <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
          💡 <strong>Don't see it?</strong> Check your spam/junk folder. The email may take a minute to arrive.
        </p>
      </div>
      <button type="button" onClick={onBack}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        <ChevronLeft className="size-4" /> Back to {type === "login" ? "Sign in" : "Sign up"}
      </button>
    </div>
  );
}

function ForgotPasswordForm({ onBack, onEmailSent }: { onBack: () => void; onEmailSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    setError("");

    const { error: apiError } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (apiError) {
      if (apiError.message.toLowerCase().includes("user not found") || apiError.message.toLowerCase().includes("not found")) {
        setError("No email found in our database");
      } else {
        setError("Error: " + apiError.message);
      }
    } else {
      onEmailSent(email);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField label="Email address" type="email" value={email}
        onChange={(v) => { setEmail(v); setError(""); }}
        placeholder="you@example.com" icon={Mail} error={error} autoComplete="email" />
      <button type="submit" disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
        {loading ? <><Spinner /> Sending OTP…</> : <>Send OTP <ChevronRight className="size-4" /></>}
      </button>
      <button type="button" onClick={onBack}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mt-2">
        <ChevronLeft className="size-4" /> Back to Sign in
      </button>
    </form>
  );
}

function ResetPasswordForm({ email, onSuccess, onBack }: { email: string; onSuccess: () => void; onBack: () => void }) {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!otp) e.otp = "OTP is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    const { error: otpError } = await supabase.auth.verifyOtp({ email, token: otp, type: 'recovery' });
    if (otpError) {
      setLoading(false);
      setErrors({ otp: "Invalid or expired OTP: " + otpError.message });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setLoading(false);
      alert("Error updating password: " + updateError.message);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    alert("Password updated successfully! Please sign in with your new password.");
    onSuccess();
  };

  const clear = (key: string) => setErrors((p) => ({ ...p, [key]: "" }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField label="Recovery OTP" type="text" value={otp}
        onChange={(v) => { setOtp(v); clear("otp"); }}
        placeholder="Enter 6-digit code" icon={Lock} error={errors.otp} autoComplete="one-time-code" />
      <InputField label="New Password" type="password" value={password}
        onChange={(v) => { setPassword(v); clear("password"); }}
        placeholder="••••••••" icon={Lock} error={errors.password} autoComplete="new-password" />
      <InputField label="Confirm Password" type="password" value={confirm}
        onChange={(v) => { setConfirm(v); clear("confirm"); }}
        placeholder="••••••••" icon={Lock} error={errors.confirm} autoComplete="new-password" />
      <button type="submit" disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
        {loading ? <><Spinner /> Updating…</> : <>Update Password <ChevronRight className="size-4" /></>}
      </button>
      <button type="button" onClick={onBack}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 mt-2">
        <ChevronLeft className="size-4" /> Back to OTP Request
      </button>
    </form>
  );
}

function LoginForm({ onSwitch, onForgotPassword }: { onSwitch: () => void; onForgotPassword: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    // Using password-based login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        alert('Please verify your email before signing in. Check your inbox (and spam folder) for the verification link.');
      } else if (error.message?.includes('Invalid login credentials')) {
        alert('Invalid login credentials. If you just signed up, please verify your email first by clicking the link we sent you (check spam too).');
      } else {
        alert("Error signing in: " + error.message);
      }
    }
    // On success, the onAuthStateChange listener in App will detect the session
  };

  const clear = (key: string) => setErrors((p) => ({ ...p, [key]: "" }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField label="Email address" type="email" value={email}
        onChange={(v) => { setEmail(v); clear("email"); }}
        placeholder="you@example.com" icon={Mail} error={errors.email} autoComplete="email" />
      <div className="flex flex-col gap-1.5">
        <InputField label="Password" type="password" value={password}
          onChange={(v) => { setPassword(v); }}
          placeholder="••••••••" icon={Lock} error={errors.password} autoComplete="current-password" />
        <div className="flex justify-end">
          <button type="button" onClick={onForgotPassword} className="text-xs text-primary font-semibold hover:underline">Forgot Password?</button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
        {loading ? <><Spinner /> Signing in…</> : <>Sign In <ChevronRight className="size-4" /></>}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">Create one</button>
      </p>
    </form>
  );
}

function SignupForm({ onSwitch, onEmailSent }: { onSwitch: () => void; onEmailSent: (email: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("doctor");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: role,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      console.error("Supabase signUp error:", error);
      alert("Error signing up: " + (error.message || JSON.stringify(error)));
    } else if (data?.user?.identities?.length === 0) {
      alert("An account with this email already exists. Please sign in instead.");
    } else {
      onEmailSent(email);
    }
  };

  const clear = (key: string) => setErrors((p) => ({ ...p, [key]: "" }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <InputField label="Full name" type="text" value={name}
        onChange={(v) => { setName(v); clear("name"); }}
        placeholder={NAME_PLACEHOLDERS[role]} icon={User} error={errors.name} autoComplete="name" />
      <InputField label="Email address" type="email" value={email}
        onChange={(v) => { setEmail(v); clear("email"); }}
        placeholder="you@example.com" icon={Mail} error={errors.email} autoComplete="email" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground/80">Role</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <RoleCard key={r.value} role={r} selected={role === r.value} onSelect={() => setRole(r.value)} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Password" type="password" value={password}
          onChange={(v) => { setPassword(v); clear("password"); }}
          placeholder="••••••••" icon={Lock} error={errors.password} autoComplete="new-password" />
        <InputField label="Confirm password" type="password" value={confirm}
          onChange={(v) => { setConfirm(v); clear("confirm"); }}
          placeholder="••••••••" icon={Lock} error={errors.confirm} autoComplete="new-password" />
      </div>
      <button type="submit" disabled={loading}
        className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-all duration-200 hover:bg-accent/90 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
        {loading ? <><Spinner /> Creating account…</> : <>Create Account <ChevronRight className="size-4" /></>}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitch} className="text-primary font-semibold hover:underline">Sign in</button>
      </p>
    </form>
  );
}

// ─── Hero Panel ───────────────────────────────────────────────────────────────

function HeroPanel() {
  const { index, direction, manual } = useSlideshow(SLIDES.length, 5000);

  return (
    <div className="relative hidden lg:flex flex-col justify-between h-full overflow-hidden bg-sidebar">

      {/* ── Slideshow images ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync" custom={direction}>
          <motion.div
            key={SLIDES[index].id}
            custom={direction}
            initial={{ opacity: 0, scale: 1.06, x: direction * 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.97, x: direction * -40 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            <img
              src={SLIDES[index].url}
              alt={SLIDES[index].alt}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay — dark at top and bottom, lighter in middle */}
            <div className="absolute inset-0 bg-gradient-to-b from-sidebar/90 via-sidebar/30 to-sidebar/95" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Animated mesh accent ── */}
      <motion.div
        className="absolute inset-0 opacity-20 pointer-events-none"
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
        style={{
          backgroundImage: "radial-gradient(ellipse at 20% 50%, #1a6fbd 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #00875a 0%, transparent 50%)",
          backgroundSize: "200% 200%",
        }}
      />

      {/* ── Top: Logo ── */}
      <div className="relative z-10 flex items-center gap-3 px-10 pt-10">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40">
          <Activity className="size-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-sidebar-foreground tracking-tight leading-none">MediCore</p>
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest mt-0.5">Hospital Management</p>
        </div>
      </div>

      {/* ── Middle: Hero copy + stats ── */}
      <div className="relative z-10 flex flex-col gap-8 px-10">
        {/* Caption fades with slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            <h1 className="text-[2.1rem] font-bold leading-[1.18] text-white">
              {SLIDES[index].caption.split(" ").slice(0, 3).join(" ")}{" "}
              <span style={{ color: "#4da3e8" }}>
                {SLIDES[index].caption.split(" ").slice(3).join(" ")}
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-sidebar-foreground/60 max-w-xs">
              A unified platform for patient management, risk prediction, and AI-powered clinical summaries.
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Stat cards — staggered entrance */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ label, value, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.5, ease: "easeOut" }}
              className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-md hover:bg-white/12 transition-colors duration-300"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`size-3.5 ${color}`} />
                <span className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Slide controls ── */}
      <div className="relative z-10 flex items-center justify-between px-10 pb-10">
        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => manual(i)}
              className={`rounded-full transition-all duration-400 ${i === index ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-white/30 hover:bg-white/60"}`}
            />
          ))}
        </div>

        {/* Prev / Next */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => manual(index - 1)}
            className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors duration-200"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => manual(index + 1)}
            className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors duration-200"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        key={index}
        className="absolute bottom-0 left-0 h-[3px] bg-primary"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </div>
  );
}

// ─── Role Selection Screen (for Google OAuth / users without role) ─────────────

function RoleSelectionScreen({ user, onRoleSelected }: { user: SupabaseUser; onRoleSelected: () => void }) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);
  const { dark, toggle } = useTheme();

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'there';

  const handleConfirm = async () => {
    if (!selectedRole) return;
    setSaving(true);

    // Update user metadata with the chosen role
    const { error } = await supabase.auth.updateUser({
      data: {
        role: selectedRole,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    });

    setSaving(false);

    if (error) {
      alert('Error setting role: ' + error.message);
    } else {
      onRoleSelected();
    }
  };

  return (
    <div
      className="relative min-h-screen w-full bg-background flex items-center justify-center p-4 overflow-hidden"
      style={{ fontFamily: "var(--font-family, 'DM Sans', sans-serif)" }}
    >
      {/* Background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />

      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:text-foreground hover:border-primary/40">
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-2xl shadow-2xl shadow-primary/10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
            <Activity className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground tracking-tight leading-none">MediCore</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Hospital Management</p>
          </div>
        </div>

        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Welcome, {displayName.split(' ')[0]}! 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">One last step — select your role to access the right dashboard.</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setSelectedRole(r.value)}
              className={`relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer ${
                selectedRole === r.value
                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                  : "border-border bg-input-background text-muted-foreground hover:border-primary/40 hover:bg-secondary"
              }`}
            >
              {selectedRole === r.value && (
                <CheckCircle2 className="absolute top-3 right-3 size-4 text-primary" />
              )}
              <span className="text-sm font-bold">{r.label}</span>
              <span className="text-[11px] leading-tight opacity-70">{r.description}</span>
            </button>
          ))}
        </div>

        {/* Info note */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-6">
          <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
            💡 <strong>This determines your dashboard access.</strong> Admins manage staff & view analytics. Doctors handle clinical decisions. Nurses record vitals. Receptionists manage admissions.
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={!selectedRole || saving}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <><Spinner /> Setting up your account…</>
          ) : (
            <><ChevronRight className="size-4" /> Continue as {selectedRole ? ROLES.find(r => r.value === selectedRole)?.label : '...'}</>
          )}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Dashboard (shown after successful auth) ─────────────────────────────────

function Dashboard({ user }: { user: SupabaseUser }) {
  const { dark, toggle } = useTheme();
  const metadata = user.user_metadata || {};

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div
      className="relative min-h-screen w-full bg-background overflow-hidden"
      style={{ fontFamily: "var(--font-family, 'DM Sans', sans-serif)" }}
    >
      {/* Background effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Theme toggle */}
      <button onClick={toggle}
        className="fixed top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:text-foreground hover:border-primary/40">
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <Activity className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground tracking-tight leading-none">MediCore</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Hospital Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{metadata.full_name || metadata.name || 'User'}</p>
              <p className="text-xs text-muted-foreground capitalize">{metadata.role || 'Staff'}</p>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-border bg-input-background px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-destructive/40 hover:bg-destructive/10 transition-all duration-200">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, {(metadata.full_name || metadata.name || 'User').split(' ')[0]}! 👋</h1>
          <p className="text-muted-foreground">Here's what's happening at MediCore today.</p>
        </motion.div>

        {metadata.role === 'receptionist' && <ReceptionistDashboard />}
        {metadata.role === 'admin' && <AdminDashboard />}
        {metadata.role === 'doctor' && <DoctorDashboard />}
        {metadata.role === 'nurse' && <NurseDashboard />}
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [authFlow, setAuthFlow] = useState<AuthFlow>("login");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { dark, toggle } = useTheme();

  // Listen for auth state changes (including email verification redirect)
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (sign in, sign out, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setMode("login");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update document title based on auth state
  useEffect(() => {
    if (user) {
      document.title = "MediCore Dashboard";
    } else {
      document.title = "MediCore Signup";
    }
  }, [user]);

  const handleEmailSent = (email: string, flow: AuthFlow) => {
    setEmailForOtp(email);
    setAuthFlow(flow);
    setMode("email-sent");
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center"
        style={{ fontFamily: "var(--font-family, 'DM Sans', sans-serif)" }}>
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated but has no role (e.g. Google OAuth), show role selection
  if (user && !user.user_metadata?.role) {
    return (
      <RoleSelectionScreen
        user={user}
        onRoleSelected={async () => {
          // Refresh the session to get updated user_metadata
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) {
            setUser({ ...data.session.user });
          }
        }}
      />
    );
  }

  // If user is authenticated and has a role, show dashboard
  if (user) {
    return <Dashboard user={user} />;
  }

  // Auth page
  return (
    <div
      className="relative min-h-screen w-full bg-background flex items-center justify-center p-4 overflow-hidden"
      style={{ fontFamily: "var(--font-family, 'DM Sans', sans-serif)" }}
    >
      {/* Awesome Full-Page Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[15%] w-[30vw] h-[30vw] rounded-full bg-blue-500/15 blur-[100px] pointer-events-none" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="fixed top-4 right-4 z-50 flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-all duration-200 hover:text-foreground hover:border-primary/40"
      >
        {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      {/* Page entrance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-border shadow-2xl shadow-primary/10 grid lg:grid-cols-[1fr_1.1fr]"
      >
        {/* Left hero */}
        <HeroPanel />

        {/* Right auth panel */}
        <div className="bg-gradient-to-br from-background/95 via-card/80 to-primary/5 backdrop-blur-2xl flex flex-col justify-center px-8 py-10 sm:px-12 shadow-[inset_0_0_40px_rgba(0,0,0,0.02)]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="size-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold text-foreground tracking-tight">MediCore HMS</span>
          </div>

          {/* Tab switcher */}
          {mode !== "email-sent" && mode !== "forgot_password" && mode !== "reset_password" && (
            <div className="relative mb-8 flex rounded-lg border border-border bg-muted p-1">
              <div
                className="absolute top-1 bottom-1 rounded-md bg-card shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ width: "calc(50% - 2px)", left: mode === "login" ? "4px" : "calc(50% + 2px)" }}
              />
              {(["login", "signup"] as Mode[]).map((m) => m !== "email-sent" && (
                <button key={m} type="button" onClick={() => setMode(m)}
                  className={`relative z-10 flex-1 rounded-md py-2 text-sm font-semibold transition-colors duration-200 ${mode === m ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"}`}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Heading */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + "-header"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold text-foreground leading-tight">
                {mode === "email-sent" ? "Check your inbox & spam" : mode === "forgot_password" ? "Reset your password" : mode === "reset_password" ? "Set new password" : mode === "login" ? "Welcome back" : "Join your team"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "email-sent"
                  ? "We've sent you a verification email"
                  : mode === "forgot_password"
                    ? "Enter your email to receive a recovery code"
                    : mode === "reset_password"
                      ? "Enter the code we sent and your new password"
                      : mode === "login"
                        ? "Sign in to your MediCore account to continue"
                        : "Create your account and start managing care"}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {mode === "email-sent"
                ? <EmailSentScreen email={emailForOtp} type={authFlow} onBack={() => setMode(authFlow)} />
                : mode === "forgot_password"
                  ? <ForgotPasswordForm onBack={() => setMode("login")} onEmailSent={(e) => { setEmailForOtp(e); setMode("reset_password"); }} />
                  : mode === "reset_password"
                    ? <ResetPasswordForm email={emailForOtp} onSuccess={() => setMode("login")} onBack={() => setMode("forgot_password")} />
                    : mode === "login"
                      ? <LoginForm onSwitch={() => setMode("signup")} onForgotPassword={() => setMode("forgot_password")} />
                      : <SignupForm onSwitch={() => setMode("login")} onEmailSent={(e) => handleEmailSent(e, "signup")} />}
            </motion.div>
          </AnimatePresence>

          {/* SSO */}
          {mode !== "email-sent" && mode !== "forgot_password" && mode !== "reset_password" && (
            <>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="mt-4">
                <button type="button" onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-secondary hover:border-primary/30 active:scale-[0.98]">
                  <svg className="size-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
