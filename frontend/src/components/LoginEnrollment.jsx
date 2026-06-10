import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Modal } from "@mui/material";
import {
  Container,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import "../styles/Container.css";
import Logo from "../assets/Logo.png";
import { SettingsContext } from "../App";
import LoadingOverlay from "./LoadingOverlay";
import API_BASE_URL from "../apiConfig";

/* ─── Mobile breakpoint hook ─── */
const useIsMobile = (bp = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= bp : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= bp);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [bp]);
  return isMobile;
};

function accessToSet(list = []) {
  return new Set(list.map(Number));
}

function getRegistrarDashboard(accessSet) {
  if (accessSet.has(101)) return "/registrar_dashboard";
  if (accessSet.has(102)) return "/enrollment_officer_dashboard";
  if (accessSet.has(103)) return "/admission_officer_dashboard";
  return "/registrar_dashboard";
}

function getUserDashboard(role, accessList = []) {
  const accessSet = accessToSet(accessList);
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole === "registrar") return getRegistrarDashboard(accessSet);
  if (normalizedRole === "faculty") return "/faculty_dashboard";
  if (normalizedRole === "superadmin") return "/system_dashboard";
  return "/student_dashboard";
}

/* ─── Per-email localStorage lockout helpers ─── */
function lockoutKey(email) {
  return `enrollment_lockout_until::${String(email).trim().toLowerCase()}`;
}
function getLockoutRemaining(email) {
  if (!email) return 0;
  const until = localStorage.getItem(lockoutKey(email));
  if (!until) return 0;
  const remaining = Math.ceil((Number(until) - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}
function saveLockout(email, seconds) {
  if (!email) return;
  localStorage.setItem(lockoutKey(email), String(Date.now() + seconds * 1000));
}
function clearLockout(email) {
  if (!email) return;
  localStorage.removeItem(lockoutKey(email));
}

const LoginEnrollment = ({ setIsAuthenticated }) => {
  const settings = useContext(SettingsContext);
  const isMobile = useIsMobile();

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

  useEffect(() => {
    if (settings) {
      if (settings.title_color) setTitleColor(settings.title_color);
      if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
      if (settings.border_color) setBorderColor(settings.border_color);
      if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    }
  }, [settings]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  const handleOtpChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "Enter") verifyOtp();
  };

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [tempLoginData, setTempLoginData] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [currentYear, setCurrentYear] = useState("");
  const [loginType, setLoginType] = useState("user");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const otpInputRef = useRef(null);

  /* ─── Lockout state ─── */
  const lockTimerRef = useRef(0);
  const [lockout, setLockout] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    setCurrentYear(new Date(now).getFullYear());
  }, []);

  /* ── Restore lockout for THIS email when the email field changes ── */
  useEffect(() => {
    if (!email) return;
    const remaining = getLockoutRemaining(email);
    if (remaining > 0 && !lockout) {
      lockTimerRef.current = remaining;
      setLockoutTimer(remaining);
      setLockout(true);
    }
  }, [email]); // intentionally only on email change

  /* ── Countdown tick ── */
  useEffect(() => {
    if (!lockout) return;
    const interval = setInterval(() => {
      lockTimerRef.current -= 1;
      setLockoutTimer(lockTimerRef.current);
      if (lockTimerRef.current <= 0) {
        clearInterval(interval);
        clearLockout(email);
        setLockout(false);
        lockTimerRef.current = 0;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockout]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Start lockout for a specific email ── */
  const startLockout = (emailVal, seconds) => {
    saveLockout(emailVal, seconds);
    lockTimerRef.current = seconds;
    setLockoutTimer(seconds);
    setLockout(true);
  };

  const backgroundImage = settings?.bg_image
    ? `url(${API_BASE_URL}${settings.bg_image})`
    : "linear-gradient(to right, #f5f5f5, #fafafa)";
  const logoSrc = settings?.logo_url ? `${API_BASE_URL}${settings.logo_url}` : Logo;

  const isFormValid = () => {
    let newErrors = {};
    let isValid = true;
    if (!email) { newErrors.email = true; isValid = false; }
    if (!password) { newErrors.password = true; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!isFormValid()) {
      setSnack({ open: true, message: "Please fill in all fields", severity: "warning" });
      return;
    }

    const stillLocked = getLockoutRemaining(email);
    if (stillLocked > 0) {
      if (!lockout) {
        lockTimerRef.current = stillLocked;
        setLockoutTimer(stillLocked);
        setLockout(true);
      }
      return;
    }

    try {
      setLoading(true);
      const apiUrl = loginType === "applicant"
        ? `${API_BASE_URL}/api/login_applicant`
        : `${API_BASE_URL}/api/login`;

      const res = await axios.post(apiUrl, { email, password, audit_log_db: "db3" });

      if (res.data.locked) {
        const secs = res.data.remainingSeconds ?? 180;
        setSnack({ open: true, message: res.data.message, severity: "error" });
        startLockout(email, secs);
        return;
      }

      if (!res.data.success) {
        setSnack({ open: true, message: res.data.message, severity: "error" });
        return;
      }

      clearLockout(email);
      setTempLoginData(res.data);

      // Set force_password_change from server flag
      if (res.data.force_password_change) {
        localStorage.setItem("force_password_change", "true");
      } else {
        localStorage.removeItem("force_password_change");
      }

      // Check email-keyed pending flag from superadmin reset
      const pendingKey = `pending_force_password_change::${(res.data.email || email).toLowerCase()}`;
      if (localStorage.getItem(pendingKey) === "true") {
        localStorage.setItem("force_password_change", "true");
        localStorage.removeItem(pendingKey);
      }

      // Read the flag AFTER both checks above
      const shouldForceChange = localStorage.getItem("force_password_change") === "true";

      if (loginType === "applicant") {
        localStorage.removeItem("lastVisitedPath");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("email", res.data.email);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("person_id", res.data.person_id);
        localStorage.setItem("applyingAs", res.data.applyingAs);
        localStorage.setItem("prof_id", "");
        localStorage.setItem("employee_id", "");
        localStorage.setItem("curriculum_id", "");
        setIsAuthenticated(true);
        navigate(shouldForceChange ? "/applicant_reset_password" : "/applicant_dashboard");
        return;
      }

      if (res.data.requireOtp === false) {
        localStorage.removeItem("lastVisitedPath");
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("email", res.data.email);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("person_id", res.data.person_id);
        localStorage.setItem("prof_id", res.data.prof_id || "");
        localStorage.setItem("department", res.data.department || "");
        localStorage.setItem("employee_id", res.data.employee_id);
        localStorage.setItem("curriculum_id", res.data.curriculum_id || "");
        setIsAuthenticated(true);
        if (shouldForceChange) {
          const roleVal = res.data.role?.toLowerCase();
          const changePwPath =
            roleVal === "faculty" ? "/faculty_reset_password"
              : roleVal === "registrar" ? "/registrar_reset_password"
                : "/student_reset_password";
          navigate(changePwPath);
        } else {
          const dashboard = getUserDashboard(res.data.role, res.data.accessList);
          navigate(dashboard);
        }
        return;
      }

      if (res.data.requireOtp === true) {
        setShowOtpModal(true);
        startResendTimer();
        setSnack({ open: true, message: "OTP sent to your email", severity: "success" });
        return;
      }

    } catch (error) {
      const data = error.response?.data;
      const message = data?.message || "Login failed";
      const attemptsLeft = data?.remaining;
      const displayMsg = attemptsLeft != null
        ? `${message} (${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} left)`
        : message;
      setSnack({ open: true, message: displayMsg, severity: "error" });
      if (
        data?.remainingSeconds ||
        message.toLowerCase().includes("too many") ||
        message.toLowerCase().includes("locked")
      ) {
        const secs = data?.remainingSeconds ?? 180;
        startLockout(email, secs);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading3(true);
      await axios.post(`${API_BASE_URL}/api/verify-otp`, { email: tempLoginData.email, otp: otp.join("") });

      localStorage.removeItem("lastVisitedPath");
      localStorage.setItem("token", tempLoginData.token);
      localStorage.setItem("email", tempLoginData.email);
      localStorage.setItem("role", tempLoginData.role);
      localStorage.setItem("person_id", tempLoginData.person_id);
      localStorage.setItem("prof_id", tempLoginData.prof_id || "");
      localStorage.setItem("department", tempLoginData.department || "");
      localStorage.setItem("employee_id", tempLoginData.employee_id);
      localStorage.setItem("curriculum_id", tempLoginData.curriculum_id || "");

      if (tempLoginData.force_password_change) {
        localStorage.setItem("force_password_change", "true");
      } else {
        localStorage.removeItem("force_password_change");
      }

      const shouldForceChange = localStorage.getItem("force_password_change") === "true";
      
      setIsAuthenticated(true);
      setTimeout(() => {
        setLoading3(false);
        setShowOtpModal(false);
        if (shouldForceChange) {
          const roleVal = tempLoginData.role?.toLowerCase();
          const changePwPath =
            roleVal === "faculty" ? "/faculty_reset_password"
              : roleVal === "registrar" ? "/registrar_reset_password"
                : "/student_reset_password";
          navigate(changePwPath);
        } else {
          const dashboard = getUserDashboard(tempLoginData.role, tempLoginData.accessList);
          navigate(dashboard);
        }
      }, 2000);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Invalid OTP", severity: "error" });
      setLoading3(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(300);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    try {
      setLoading2(true);
      await axios.post(`${API_BASE_URL}/api/request-otp`, { email: tempLoginData.email });
      setSnack({ open: true, message: "OTP resent to your email", severity: "success" });
      startResendTimer();
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Failed to resend OTP", severity: "error" });
      setLoading2(false);
    }
  };

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (showOtpModal) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [showOtpModal]);

  return (
    <>
      <Box sx={{
        backgroundImage,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "center",
        position: "relative",
        overflowY: isMobile ? "auto" : "hidden",
        py: isMobile ? 2 : 0,
      }}>
        <Container
          style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: isMobile ? 0 : "-100px", padding: isMobile ? "0" : undefined }}
          maxWidth={false}
        >
          <div
            style={{ border: isMobile ? "3px solid black" : "5px solid black", width: isMobile ? "calc(100% - 32px)" : undefined, maxWidth: isMobile ? 480 : undefined }}
            className="Container"
          >
            {/* ── Header ── */}
            <div className="Header" style={{ backgroundColor: settings?.header_color || "#1976d2", padding: isMobile ? "12px 10px" : "1rem 0", borderBottom: "3px solid black" }}>
              <div className="HeaderTitle">
                <div className="CircleCon"><img src={logoSrc} alt="Logo" /></div>
              </div>
              <div className="HeaderBody">
                <strong style={{ color: "white" }}>
                  {(settings?.company_name || "Company Name").split(" ").reduce((acc, word, i) => {
                    if (i % 4 === 0 && i !== 0) acc.push(<br key={`br-${i}`} />);
                    acc.push(word + " ");
                    return acc;
                  }, [])}
                </strong>
                <p>Academic Information System</p>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="Body">

              {/* Login As dropdown */}
              <div className="TextField" style={{ position: "relative" }}>
                <label htmlFor="loginType">Login As</label>
                <select
                  id="loginType" name="loginType" value={loginType}
                  onChange={(e) => {
                    setLoginType(e.target.value);
                    if (e.target.value === "applicant") navigate("/login_applicant");
                    else navigate("/login");
                  }}
                  style={{ width: "100%", padding: "0.8rem 2.5rem 0.8rem 2.5rem", borderRadius: "6px", border: "2px solid black", height: "55px", fontSize: "1rem", backgroundColor: "white", outline: "none", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer" }}
                >
                  <option value="user">Student / Faculty / Registrar</option>
                  <option value="applicant">Applicant</option>
                </select>
                <PersonIcon style={{ position: "absolute", top: "2.75rem", left: "0.7rem", color: "rgba(0,0,0,0.4)" }} />
                <ArrowDropDownIcon sx={{ position: "absolute", right: "10px", top: "70%", transform: "translateY(-50%)", fontSize: "30px", color: "black", pointerEvents: "none" }} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (!lockout) handleLogin(); }}>

                {/* Email */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="text" id="email" name="email"
                    placeholder="Enter your email address" className="border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: "2.5rem", height: isMobile ? "48px" : "55px", border: errors.email ? "2px solid red" : "2px solid black" }}
                    autoFocus={!isMobile}
                  />
                  {errors.email && <span style={{ color: "red", fontSize: "12px" }}>Email is required</span>}
                  <EmailIcon style={{ position: "absolute", top: "2.75rem", left: "0.7rem", color: "rgba(0,0,0,0.4)" }} />
                </div>

                {/* Password */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label htmlFor="password">Password</label>
                  <input
                    type={showPassword ? "text" : "password"} id="password" name="password"
                    placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} className="border"
                    style={{ paddingLeft: "2.5rem", height: isMobile ? "48px" : "55px", border: errors.password ? "2px solid red" : "2px solid black" }}
                  />
                  {errors.password && <span style={{ color: "red", fontSize: "12px" }}>Password is required</span>}
                  <LockIcon style={{ position: "absolute", top: "2.75rem", left: "0.7rem", color: "rgba(0,0,0,0.4)", fontSize: "26px" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ color: "rgba(0,0,0,0.3)", outline: "none", position: "absolute", top: "2.5rem", right: "1rem", background: "none", border: "none", cursor: "pointer", marginBottom: "50px" }}>
                    {showPassword
                      ? <Visibility sx={{ fontSize: "26px", color: "rgba(0,0,0,0.4)" }} />
                      : <VisibilityOff sx={{ fontSize: "26px", color: "rgba(0,0,0,0.4)" }} />}
                  </button>
                </div>

                {/* Submit */}
                <div style={{ cursor: lockout || loading ? "not-allowed" : "pointer" }}>
                  <button
                    type="submit"
                    tabIndex={0}
                    disabled={lockout || loading}
                    onKeyDown={(e) => e.key === "Enter" && !lockout && !loading && handleLogin()}
                    style={{
                      width: "100%",
                      backgroundColor: lockout ? "#999" : loading ? "#ccc" : mainButtonColor,
                      border: "2px solid black",
                      color: "white",
                      height: "50px",
                      borderRadius: "10px",
                      padding: "0.5rem 0",
                      fontSize: "16px",
                      fontWeight: "bold",
                      marginTop: isMobile ? "28px" : "50px",
                      cursor: lockout || loading ? "not-allowed" : "pointer",
                      opacity: lockout || loading ? 0.8 : 1,
                      transition: "opacity 0.2s ease-in-out",
                    }}
                  >
                    {lockout ? `Locked (${lockoutTimer}s)` : loading ? "Processing..." : "Log In"}
                  </button>
                </div>
              </form>

              <div className="LinkContainer">
                <span><Link to="/forgot_password">Forgot your password</Link></span>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="Footer">
              <div className="FooterText">
                &copy; {currentYear} {settings?.company_name || "EARIST"} <br />
                Academic Information System. <br />
                All rights reserved.
              </div>
            </div>
          </div>
        </Container>

        <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>{snack.message}</Alert>
        </Snackbar>

        {/* OTP Modal */}
        <Modal open={showOtpModal} onClose={() => setShowOtpModal(false)}>
          <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "calc(100% - 40px)" : 440,
            maxWidth: 440,
            bgcolor: "#fff", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            p: isMobile ? 3 : 4,
            border: "1px solid #eee",
          }}>
            <button onClick={() => setShowOtpModal(false)} style={{ position: "absolute", top: "12px", right: "12px", backgroundColor: "black", color: "white", border: "none", borderRadius: "50%", width: "34px", height: "34px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}>✕</button>

            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Verify your email</h2>
            <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              We sent a 6-digit verification code to your registered email address.
            </p>

            <Box sx={{ display: "flex", justifyContent: "center", gap: isMobile ? 1 : 1.5, mb: 3 }}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  style={{ width: isMobile ? "42px" : "54px", height: isMobile ? "50px" : "60px", fontSize: "22px", fontWeight: 700, textAlign: "center", borderRadius: "14px", border: "2px solid #ddd", outline: "none" }}
                />
              ))}
            </Box>

            <p style={{ fontSize: "13px", color: "#777", marginBottom: "18px", textAlign: "center" }}>
              This email can only be used once for admission verification.
            </p>

            <button onClick={verifyOtp} disabled={loading3} style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: mainButtonColor, color: "white", fontWeight: 700, fontSize: "15px", cursor: loading3 ? "not-allowed" : "pointer" }}>
              {loading3 ? "Verifying..." : "Verify & Continue"}
            </button>

            <button onClick={resendOtp} disabled={resendTimer > 0} style={{ width: "100%", marginTop: "12px", padding: "12px", borderRadius: "12px", border: "1px solid #ddd", background: "#fff", fontWeight: 600, color: resendTimer > 0 ? "#999" : "#333" }}>
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
            </button>

            <p style={{ marginTop: "14px", fontSize: "12px", color: "#999", textAlign: "center" }}>
              Didn't receive the code? Check your spam folder.
            </p>
          </Box>
        </Modal>

        <LoadingOverlay open={loading} />
        <LoadingOverlay open={loading2} />
        <LoadingOverlay open={loading3} />
      </Box>
    </>
  );
};

export default LoginEnrollment;
