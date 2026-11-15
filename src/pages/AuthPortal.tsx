import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Lock,
  ShieldAlert,
  Smartphone,
  Truck,
  User as UserIcon,
} from 'lucide-react';
import { usePunarchakra } from '../context/PunarchakraContext';
import { UserRole } from '../types/punarchakra';
import { PortalFooter, PortalSwitcherDropdown } from '../components/ui/PortalSwitcherDropdown';
import { AppLogo, Button, Card, Input, LanguageToggleButton, Select } from '../components/ui/Primitives';

const ROLE_META: {
  role: UserRole;
  title: string;
  subtitle: string;
  demoEmail: string;
  Icon: React.ElementType;
}[] = [
  {
    role: 'b2c',
    title: 'B2C Customer',
    subtitle: 'Sell household scrap & track payouts',
    demoEmail: 'ananya.sharma@example.in',
    Icon: UserIcon,
  },
  {
    role: 'b2b',
    title: 'B2B Business',
    subtitle: 'Corporate bulk pickups & GST billing',
    demoEmail: 'facilities@kaveritech.in',
    Icon: Building2,
  },
  {
    role: 'executive',
    title: 'Pickup Executive',
    subtitle: 'Field dispatch, weighing & collection',
    demoEmail: 'rajesh.exec@punarchakra.in',
    Icon: Truck,
  },
  {
    role: 'admin',
    title: 'Administrator',
    subtitle: 'Master pricing, dispatch & audits',
    demoEmail: 'admin@punarchakra.in',
    Icon: ShieldAlert,
  },
];

export const AuthPortal: React.FC = () => {
  const {
    state,
    authInitialMode,
    authInitialRole,
    navigateTo,
    loginWithEmail,
    loginWithOtp,
    loginWithGoogle,
    quickDemoLogin,
    registerAccount,
    resetPasswordByEmail,
    notify,
    language,
    toggleLanguage,
  } = usePunarchakra();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authInitialMode);
  const [role, setRole] = useState<UserRole>(authInitialRole);
  const [loginMethod, setLoginMethod] = useState<'email' | 'otp'>('email');

  // Email login state
  const [email, setEmail] = useState(() => {
    const match = ROLE_META.find((r) => r.role === authInitialRole);
    return match?.demoEmail || '';
  });
  const [password, setPassword] = useState('Punarchakra@123');
  const [remember, setRemember] = useState(true);

  // Mobile OTP state
  const [mobile, setMobile] = useState('+91 98450 11223');
  const [otpSentCode, setOtpSentCode] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');

  // Reset password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Registration state
  const [regForm, setRegForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    address: '',
    city: 'Bengaluru',
    pinCode: '560092',
    companyName: '',
    gstin: '',
    contactPerson: '',
    employeeId: '',
    assignedZoneId: state.serviceZones[0]?.id || 'zone-blr-north-hebbal',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setErrorMsg(null);
    const meta = ROLE_META.find((r) => r.role === nextRole);
    if (meta) setEmail(meta.demoEmail);
    if (nextRole === 'b2b' && regForm.pinCode === '560092') {
      setRegForm((f) => ({ ...f, pinCode: '560058' }));
    } else if (nextRole === 'b2c' && regForm.pinCode === '560058') {
      setRegForm((f) => ({ ...f, pinCode: '560092' }));
    }
    if (nextRole === 'admin' && mode === 'register') {
      setMode('login');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    if (loginMethod === 'email') {
      const res = await loginWithEmail(email, password, role, remember);
      if (!res.ok) setErrorMsg(res.error || 'Authentication failed.');
    } else {
      if (!otpSentCode) {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        setOtpSentCode(code);
        notify('info', `Verification OTP sent to ${mobile}`, `Enter code: ${code}`);
        setLoading(false);
        return;
      }
      if (otpInput.trim() !== otpSentCode) {
        setErrorMsg(`Invalid OTP. Please enter ${otpSentCode}.`);
        setLoading(false);
        return;
      }
      const res = await loginWithOtp(mobile, role, remember);
      if (!res.ok) setErrorMsg(res.error || 'OTP verification failed.');
    }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (role === 'admin') {
      setErrorMsg('Administrator accounts can only be provisioned by an authorised Administrator.');
      return;
    }
    setLoading(true);
    const res = await registerAccount({
      role,
      ...regForm,
    });
    if (!res.ok) setErrorMsg(res.error || 'Registration failed.');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    const res = await loginWithGoogle(role);
    if (!res.ok) setErrorMsg(res.error || 'Google Sign-In failed.');
    setLoading(false);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await resetPasswordByEmail(resetEmail, resetNewPassword);
    if (!res.ok) {
      setErrorMsg(res.error || 'Unable to reset password.');
      return;
    }
    notify('success', 'Password Updated', 'You can now sign in with your new password.');
    setEmail(resetEmail);
    setPassword(resetNewPassword);
    setMode('login');
  };

  return (
    <div className="min-h-screen bg-[#F7F9F6] flex flex-col">
      <header className="bg-white border-b border-[#202820]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <AppLogo onClick={() => navigateTo('public')} />
          <div className="flex items-center gap-2">
            <PortalSwitcherDropdown compact />
            <LanguageToggleButton language={language} onToggle={toggleLanguage} />
            <Button variant="ghost" size="sm" onClick={() => navigateTo('public')}>
              <ArrowLeft className="w-4 h-4" />
              Back to Website
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Role Selection & Instant Demo Sign-In */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-semibold text-[#28A66A]">Unified Access Control</p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#174B37] mt-1">
              Select Your Punarchakra Portal
            </h1>
            <p className="text-sm text-[#202820]/65 mt-1.5">
              Sign in or register according to your role. Protected routes enforce strict role-based permissions.
            </p>
          </div>

          <div className="space-y-2.5">
            {ROLE_META.map((item) => {
              const Icon = item.Icon;
              const selected = role === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleSwitch(item.role)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#174B37] text-white border-[#174B37] shadow-sm'
                      : 'bg-white text-[#202820] border-[#202820]/12 hover:border-[#28A66A]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        selected ? 'bg-[#A5D66D] text-[#174B37]' : 'bg-[#F7F9F6] text-[#174B37]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-sm">{item.title}</p>
                      <p className={`text-xs truncate ${selected ? 'text-white/75' : 'text-[#202820]/60'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      quickDemoLogin(item.role);
                    }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
                      selected
                        ? 'bg-white/15 text-[#A5D66D] hover:bg-white/25'
                        : 'bg-[#F7F9F6] text-[#174B37] hover:bg-[#174B37]/10'
                    }`}
                  >
                    Instant Demo
                  </span>
                </button>
              );
            })}
          </div>

          <Card padding="sm" className="bg-white/80">
            <p className="text-xs font-semibold text-[#174B37]">Demo Credentials</p>
            <p className="text-xs text-[#202820]/65 mt-1">
              Password for all seeded role accounts: <span className="font-mono font-semibold">Punarchakra@123</span>. Passwords are stored using SHA-256 salted digests and every sign-in writes to Login Activity logs.
            </p>
          </Card>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-7">
          <Card padding="lg">
            {/* Mode switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-xl border border-[#202820]/10 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'login' ? 'bg-white text-[#174B37] shadow-xs' : 'text-[#202820]/65'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'register' ? 'bg-white text-[#174B37] shadow-xs' : 'text-[#202820]/65'
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('forgot');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                  mode === 'forgot' ? 'bg-white text-[#174B37] shadow-xs' : 'text-[#202820]/65'
                }`}
              >
                Reset Password
              </button>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#DC2626]/8 border border-[#DC2626]/25 text-xs font-medium text-[#DC2626]">
                {errorMsg}
              </div>
            )}

            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#202820]/10 pb-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-[#174B37]">
                      {ROLE_META.find((r) => r.role === role)?.title} Sign In
                    </h2>
                    <p className="text-xs text-[#202820]/60">Protected role-based portal authentication</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#F7F9F6] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('email')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                        loginMethod === 'email' ? 'bg-white text-[#174B37] shadow-xs' : 'text-[#202820]/60'
                      }`}
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('otp')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                        loginMethod === 'otp' ? 'bg-white text-[#174B37] shadow-xs' : 'text-[#202820]/60'
                      }`}
                    >
                      Mobile OTP
                    </button>
                  </div>
                </div>

                {loginMethod === 'email' ? (
                  <>
                    <Input
                      label="Email Address"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      label="Password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      label="Registered Mobile Number"
                      placeholder="+91 98450 11223"
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                    />
                    {otpSentCode && (
                      <Input
                        label="Enter 6-Digit Verification OTP"
                        placeholder="6-digit code"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        hint={`Demo verification code: ${otpSentCode}`}
                      />
                    )}
                  </>
                )}

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[#202820]/75">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="rounded border-[#202820]/30 text-[#174B37] focus:ring-[#28A66A]"
                    />
                    <span>Remember session on this device</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[#174B37] font-semibold hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loginMethod === 'email' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Sign In to {role.toUpperCase()} Portal
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      {otpSentCode ? 'Verify OTP & Sign In' : 'Send Verification OTP'}
                    </>
                  )}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#202820]/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-[#202820]/50">or continue with Firebase Auth</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                    />
                  </svg>
                  <span>Sign in with Google ({role.toUpperCase()})</span>
                </Button>
                {role === 'admin' && (
                  <p className="text-xs text-[#202820]/60 text-center">
                    Admin Google Sign-In verifies against provisioned administrator privileges; other verified Google accounts safely default to B2C access.
                  </p>
                )}
              </form>
            )}

            {mode === 'register' && (
              <>
                {role === 'admin' ? (
                  <div className="p-6 rounded-2xl bg-[#F7F9F6] border border-[#202820]/10 space-y-3">
                    <div className="flex items-center gap-2 text-[#174B37] font-display font-bold">
                      <ShieldAlert className="w-5 h-5 text-[#D97706]" />
                      <span>Restricted Administrator Provisioning</span>
                    </div>
                    <p className="text-sm text-[#202820]/75 leading-relaxed">
                      Administrator accounts cannot be self-registered publicly. An existing authorised Administrator must provision new Admin Staff inside the Admin Master Portal.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button size="sm" onClick={() => setMode('login')}>
                        Sign In as Admin
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => quickDemoLogin('admin')}>
                        Open Admin Master Demo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="border-b border-[#202820]/10 pb-3">
                      <h2 className="font-display text-xl font-bold text-[#174B37]">
                        Register {ROLE_META.find((r) => r.role === role)?.title}
                      </h2>
                      <p className="text-xs text-[#202820]/60">
                        All submitted records persist centrally and connect directly across portals.
                      </p>
                    </div>

                    {role === 'b2b' && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Company / Organization Name"
                          required
                          placeholder="Indus Logistics Pvt. Ltd."
                          value={regForm.companyName}
                          onChange={(e) => setRegForm((f) => ({ ...f, companyName: e.target.value }))}
                        />
                        <Input
                          label="15-Digit GSTIN"
                          required
                          maxLength={15}
                          placeholder="29AABCI1234F1Z5"
                          value={regForm.gstin}
                          onChange={(e) => setRegForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                        />
                      </div>
                    )}

                    {role === 'executive' && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input
                          label="Employee ID"
                          required
                          placeholder="PNC-EX-205"
                          value={regForm.employeeId}
                          onChange={(e) => setRegForm((f) => ({ ...f, employeeId: e.target.value }))}
                        />
                        <Select
                          label="Assigned Service Zone"
                          value={regForm.assignedZoneId}
                          onChange={(e) => setRegForm((f) => ({ ...f, assignedZoneId: e.target.value }))}
                        >
                          {state.serviceZones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.city} — {z.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label={role === 'b2b' ? 'Contact Person Name' : 'Full Name'}
                        required
                        placeholder="Karthik Rao"
                        value={role === 'b2b' ? regForm.contactPerson : regForm.name}
                        onChange={(e) =>
                          setRegForm((f) =>
                            role === 'b2b'
                              ? { ...f, contactPerson: e.target.value, name: e.target.value }
                              : { ...f, name: e.target.value }
                          )
                        }
                      />
                      <Input
                        label="Mobile Number"
                        required
                        placeholder="+91 98450 22334"
                        value={regForm.mobile}
                        onChange={(e) => setRegForm((f) => ({ ...f, mobile: e.target.value }))}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        placeholder="name@domain.in"
                        value={regForm.email}
                        onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                      />
                      <Input
                        label="Password (min 6 chars)"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regForm.password}
                        onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                      />
                    </div>

                    {role !== 'executive' && (
                      <>
                        <Input
                          label={role === 'b2b' ? 'Registered Business Address (Bengaluru Industrial Area)' : 'Doorstep Pickup Address (North Bengaluru)'}
                          required
                          placeholder={role === 'b2b' ? 'Plot / Unit, Peenya, Whitefield EPIP, Bommasandra' : 'Street, building, Hebbal / Sahakara Nagar / Yelahanka'}
                          value={regForm.address}
                          onChange={(e) => setRegForm((f) => ({ ...f, address: e.target.value }))}
                        />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            label={role === 'b2b' ? 'City (Bengaluru Industrial Areas)' : 'City (North Bengaluru)'}
                            value="Bengaluru"
                            readOnly
                          />
                          <Input
                            label={role === 'b2b' ? 'Industrial PIN Code' : 'North Bengaluru PIN Code'}
                            required
                            maxLength={6}
                            value={regForm.pinCode}
                            onChange={(e) => setRegForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '') }))}
                          />
                        </div>
                      </>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      Create {role.toUpperCase()} Account & Enter Portal
                    </Button>
                  </form>
                )}
              </>
            )}

            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="border-b border-[#202820]/10 pb-3">
                  <h2 className="font-display text-xl font-bold text-[#174B37]">Secure Password Recovery</h2>
                  <p className="text-xs text-[#202820]/60">
                    Verify your registered email and set a new hashed password.
                  </p>
                </div>
                <Input
                  label="Registered Email Address"
                  type="email"
                  required
                  placeholder="ananya.sharma@example.in"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <Input
                  label="New Password"
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                />
                <Button type="submit" className="w-full" size="lg">
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </Button>
              </form>
            )}
          </Card>
        </div>
      </main>
      <PortalFooter portalLabel="Unified Role Authentication" />
    </div>
  );
};
