import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Container, Box, Snackbar, Alert, Typography, Button } from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CloseIcon from "@mui/icons-material/Close";
import CampaignIcon from "@mui/icons-material/Campaign";
import "../styles/Container.css";
import Logo from "../assets/Logo.png";
import { SettingsContext } from "../App";
import API_BASE_URL from "../apiConfig";
import AnnouncementSlider from "../components/AnnouncementSlider";
import { Link as RouterLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Helper: detect mobile ─── */
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

/* ─── Per-email localStorage lockout helpers ─── */
function lockoutKey(email) {
  return `login_lockout_until::${String(email).trim().toLowerCase()}`;
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

/* ─── Fullscreen Announcement Viewer Modal ─── */
const AnnouncementViewerModal = ({ slides, startIndex, onClose }) => {
  const [index, setIndex] = useState(startIndex || 0);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const current = slides[index];
  const goNext = () => { setIndex((prev) => (prev + 1) % slides.length); setScale(1); };
  const goPrev = () => { setIndex((prev) => (prev - 1 + slides.length) % slides.length); setScale(1); };
  const handleDragEnd = (_, info) => {
    if (scale > 1) return;
    if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) { setIsDragging(false); return; }
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
    setIsDragging(false);
  };
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  if (!current?.file_path) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.96)", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(0,0,0,0.7)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CampaignIcon sx={{ color: "#fff", fontSize: 20 }} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px", maxWidth: "60vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current.title}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setScale((s) => Math.min(s + 0.5, 3))} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomInIcon sx={{ fontSize: 20 }} /></button>
          <button onClick={() => setScale((s) => Math.max(s - 0.5, 1))} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ZoomOutIcon sx={{ fontSize: 20 }} /></button>
          <button onClick={onClose} style={{ background: "rgba(220,38,38,0.85)", border: "none", borderRadius: "50%", width: 36, height: 36, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><CloseIcon sx={{ fontSize: 20 }} /></button>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {slides.length > 1 && (<button onClick={goPrev} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowBackIosNewIcon sx={{ fontSize: 18 }} /></button>)}
        {slides.length > 1 && (<button onClick={goNext} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowForwardIosIcon sx={{ fontSize: 18 }} /></button>)}
        <AnimatePresence mode="wait">
          <motion.div key={current.id} drag={scale <= 1 ? "x" : false} dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.03} onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", touchAction: scale > 1 ? "pinch-zoom" : "pan-y" }}>
            <img src={`${API_BASE_URL}/uploads/Announcement/${current.file_path}`} alt={current.title} draggable={false} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transform: `scale(${scale})`, transformOrigin: "center center", transition: "transform 0.2s ease", userSelect: "none", borderRadius: scale > 1 ? 0 : "8px" }} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 12 }}>
        {slides.length > 1 && slides.map((_, i) => (<div key={i} onClick={() => { setIndex(i); setScale(1); }} style={{ width: i === index ? 20 : 7, height: 7, borderRadius: 4, background: i === index ? "#fff" : "rgba(255,255,255,0.35)", transition: "all 0.3s", cursor: "pointer" }} />))}
        {slides.length > 1 && (<span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: 4 }}>{index + 1} / {slides.length}</span>)}
      </div>
      {scale > 1 && (<div style={{ position: "absolute", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "11px", padding: "4px 10px", borderRadius: "20px", pointerEvents: "none" }}>{Math.round(scale * 100)}% — tap − to zoom out</div>)}
    </div>
  );
};

/* ─── Inline mobile announcement banner ─── */
const MobileAnnouncementBanner = ({ slides }) => {
  const [openViewer, setOpenViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [index, setIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setTimeout(() => setIndex((prev) => (prev + 1) % slides.length), 4500);
    return () => clearTimeout(t);
  }, [index, slides.length]);
  if (!slides.length) return null;
  const current = slides[index];
  if (!current?.file_path) return null;
  const goNext = () => setIndex((prev) => (prev + 1) % slides.length);
  const goPrev = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  const handleDragEnd = (_, info) => {
    if (Math.abs(info.offset.x) < Math.abs(info.offset.y)) { setIsDragging(false); return; }
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
    setIsDragging(false);
  };
  const handleOpenViewer = () => { setViewerStartIndex(index); setOpenViewer(true); };
  return (
    <>
      {openViewer && (<AnnouncementViewerModal slides={slides} startIndex={viewerStartIndex} onClose={() => setOpenViewer(false)} />)}
      {!bannerVisible && (
        <button onClick={() => setBannerVisible(true)} style={{ width: "100%", marginBottom: "14px", padding: "10px", background: "rgba(0,0,0,0.08)", border: "1.5px dashed rgba(0,0,0,0.25)", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "rgba(0,0,0,0.55)", fontSize: "13px", fontWeight: 500 }}>
          <CampaignIcon sx={{ fontSize: 16 }} />Show Announcements
        </button>
      )}
      {bannerVisible && (
        <div style={{ width: "100%", borderRadius: "14px", overflow: "hidden", position: "relative", background: "#000", aspectRatio: "16 / 9", marginBottom: "16px", boxShadow: "0 4px 18px rgba(0,0,0,0.25)" }}>
          <button onClick={() => setBannerVisible(false)} style={{ position: "absolute", top: 8, right: 8, zIndex: 20, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><CloseIcon sx={{ fontSize: 14 }} /></button>
          <button onClick={handleOpenViewer} style={{ position: "absolute", top: 8, left: 8, zIndex: 20, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "20px", padding: "4px 10px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: "11px", fontWeight: 600 }}><ZoomInIcon sx={{ fontSize: 14 }} />View</button>
          <button onClick={goPrev} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowBackIosNewIcon sx={{ fontSize: 16 }} /></button>
          <button onClick={goNext} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowForwardIosIcon sx={{ fontSize: 16 }} /></button>
          <AnimatePresence mode="wait">
            <motion.div key={current.id} drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.03} onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd} initial={{ x: 120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -120, opacity: 0 }} transition={{ duration: 0.35 }} style={{ width: "100%", height: "100%", position: "relative", touchAction: "pan-y" }}>
              <img src={`${API_BASE_URL}/uploads/Announcement/${current.file_path}`} alt={current.title} onClick={handleOpenViewer} style={{ width: "100%", height: "100%", objectFit: "cover", userSelect: "none", display: "block", cursor: "zoom-in" }} draggable={false} />
              <div style={{ position: "absolute", bottom: 0, width: "100%", padding: "0.7rem 0.9rem", background: "linear-gradient(transparent, rgba(0,0,0,0.72))", color: "#fff" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem" }}>{current.title}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          {slides.length > 1 && (<div style={{ position: "absolute", bottom: 6, right: 10, display: "flex", gap: 5, zIndex: 10 }}>{slides.map((_, i) => (<div key={i} onClick={() => setIndex(i)} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? "#fff" : "rgba(255,255,255,0.45)", transition: "all 0.3s", cursor: "pointer" }} />))}</div>)}
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════════════════════════ */
const Login = ({ setIsAuthenticated }) => {
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
  const [currentYear, setCurrentYear] = useState("");
  const [loginType, setLoginType] = useState("applicant");
  const [mobileSlides, setMobileSlides] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tempLoginData, setTempLoginData] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const navigate = useNavigate();

  /* ─── Lockout state ─── */
  const lockTimerRef = useRef(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    setCurrentYear(new Date(now).getFullYear());
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    axios
      .get(`${API_BASE_URL}/api/announcements`)
      .then((res) => { if (Array.isArray(res.data.data)) setMobileSlides(res.data.data); })
      .catch(() => { });
  }, [isMobile]);

  /* ── Restore lockout for THIS email when the email field changes ── */
  useEffect(() => {
    if (!email) return;
    const remaining = getLockoutRemaining(email);
    if (remaining > 0 && !isLocked) {
      lockTimerRef.current = remaining;
      setLockTimer(remaining);
      setIsLocked(true);
    }
  }, [email]); // intentionally only on email change

  /* ── Countdown tick ── */
  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => {
      lockTimerRef.current -= 1;
      setLockTimer(lockTimerRef.current);
      if (lockTimerRef.current <= 0) {
        clearInterval(interval);
        clearLockout(email);
        setIsLocked(false);
        lockTimerRef.current = 0;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked]); // eslint-disable-line react-hooks/exhaustive-deps

  const startLockout = (emailVal, seconds) => {
    saveLockout(emailVal, seconds);
    lockTimerRef.current = seconds;
    setLockTimer(seconds);
    setIsLocked(true);
  };

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
      if (!isLocked) {
        lockTimerRef.current = stillLocked;
        setLockTimer(stillLocked);
        setIsLocked(true);
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

      // ── Success ──
      clearLockout(email);
      setTempLoginData(res.data);

      // ✅ force_password_change — inside success block where res.data is defined
      if (res.data.force_password_change) {
        localStorage.setItem("force_password_change", "true");
      } else {
        localStorage.removeItem("force_password_change");
      }

      // ✅ check email-keyed pending flag from superadmin reset
      const pendingKey = `pending_force_password_change::${(res.data.email || email).toLowerCase()}`;
      if (localStorage.getItem(pendingKey) === "true") {
        localStorage.setItem("force_password_change", "true");
        localStorage.removeItem(pendingKey);
      }

      // After setting force_password_change and checking pendingKey...
      // Add this helper at the top of the success block:
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
        // ✅ redirect to change password if forced
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
          // ✅ route based on role
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
        setSnack({ open: true, message: "OTP sent to your email", severity: "success" });
        return;
      }

    } catch (error) {
      const data = error.response?.data;
      const message = data?.message || "Login failed";

      const attemptsLeft = data?.remaining;
      const displayMsg =
        attemptsLeft != null
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

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  // getUserDashboard helper (needed for requireOtp === false path)
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

  const backgroundImage = settings?.bg_image
    ? `url(${API_BASE_URL}${settings.bg_image})`
    : "linear-gradient(to right, #f5f5f5, #fafafa)";
  const logoSrc = settings?.logo_url ? `${API_BASE_URL}${settings.logo_url}` : Logo;

  return (
    <Box sx={{ backgroundImage, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", width: "100%", minHeight: "100vh", display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "center", overflowY: isMobile ? "auto" : "hidden", py: isMobile ? 2 : 0 }}>
      <Container style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: isMobile ? "column" : "row", padding: isMobile ? "0 0" : undefined }} maxWidth={false}>
        {!isMobile && <AnnouncementSlider />}

        <div style={{ border: isMobile ? "3px solid black" : "5px solid black", marginLeft: isMobile ? 0 : -100, marginTop: isMobile ? 0 : "-130px", width: isMobile ? "calc(100% - 32px)" : undefined, maxWidth: isMobile ? 480 : undefined }} className="Container">

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
              <p>Student Information System</p>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="Body">
            {isMobile && mobileSlides.length > 0 && (<MobileAnnouncementBanner slides={mobileSlides} />)}

            {/* Login As */}
            <div className="TextField" style={{ position: "relative" }}>
              <label htmlFor="loginType">Login As</label>
              <select id="loginType" name="loginType" value={loginType}
                onChange={(e) => {
                  setLoginType(e.target.value);
                  if (e.target.value === "applicant") navigate("/login_applicant");
                  else navigate("/login");
                }}
                style={{ width: "100%", padding: "0.8rem 2.5rem 0.8rem 2.5rem", borderRadius: "10px", border: "2px solid black", fontSize: "1rem", height: "55px", backgroundColor: "white", outline: "none", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", cursor: "pointer" }}>
                <option value="user">Student / Faculty / Registrar</option>
                <option value="applicant">Applicant</option>
              </select>
              <PersonIcon style={{ position: "absolute", top: "2.75rem", left: "0.7rem", color: "rgba(0,0,0,0.4)" }} />
              <ArrowDropDownIcon style={{ position: "absolute", top: "2.75rem", right: "0.7rem", fontSize: "30px", color: "black", pointerEvents: "none" }} />
            </div>

            {/* Email */}
            <div className="TextField" style={{ position: "relative" }}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email" id="email" name="email"
                placeholder="Enter your email address" className="border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLocked && !loading && handleLogin()}
                style={{ paddingLeft: "2.5rem", height: "55px", border: errors.email ? "2px solid red" : "2px solid black", borderRadius: "10px" }}
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
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLocked && !loading && handleLogin()}
                className="border"
                style={{ paddingLeft: "2.5rem", height: "55px", border: errors.password ? "2px solid red" : "2px solid black", borderRadius: "10px" }}
              />
              {errors.password && <span style={{ color: "red", fontSize: "12px" }}>Password is required</span>}
              <LockIcon style={{ position: "absolute", top: "2.75rem", left: "0.7rem", color: "rgba(0,0,0,0.4)", fontSize: "26px" }} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "rgba(0,0,0,0.3)", outline: "none", position: "absolute", top: "2.5rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}>
                {showPassword ? <Visibility sx={{ fontSize: "26px", color: "rgba(0,0,0,0.4)" }} /> : <VisibilityOff sx={{ fontSize: "26px", color: "rgba(0,0,0,0.4)" }} />}
              </button>
            </div>

            {/* Login Button */}
            <div
              tabIndex={0}
              style={{ height: "50px", borderRadius: "10px", border: "2px solid black", backgroundColor: isLocked ? "#999" : loading ? "#ccc" : mainButtonColor, opacity: isLocked || loading ? 0.7 : 1, pointerEvents: isLocked || loading ? "none" : "auto", display: "flex", alignItems: "center", justifyContent: "center", cursor: isLocked || loading ? "not-allowed" : "pointer" }}
              className="Button"
              onClick={!isLocked && !loading ? handleLogin : undefined}
              onKeyDown={(e) => e.key === "Enter" && !isLocked && !loading && handleLogin()}
            >
              <span>{isLocked ? `Locked (${lockTimer}s)` : loading ? "Processing..." : "Log In"}</span>
            </div>

            {/* Forgot Password */}
            <div className="LinkContainer">
              <span><Link to="/applicant_forgot_password">Forgot your password</Link></span>
            </div>

            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Typography variant="body1" color="textSecondary" align="center" sx={{ fontSize: isMobile ? "0.82rem" : undefined }}>
                Welcome! If you are a new applicant or have not yet finalized your registration, you may create an account now.
                Registering an account enables you to submit your application and access all required information.
              </Typography>
              <Button component={RouterLink} to="/register" variant="contained" sx={{ textTransform: "none", fontWeight: "bold", px: 3, py: 1.2, borderRadius: "10px", border: "2px solid black", color: "#fff", boxShadow: "none", width: isMobile ? "100%" : undefined }}>
                REGISTER NOW
              </Button>
            </Box>
          </div>

          {/* ── Footer ── */}
          <div className="Footer">
            <div className="FooterText">
              &copy; {currentYear} {settings?.company_name || "EARIST"} <br />
              Student Information System. <br />
              All rights reserved.
            </div>
          </div>
        </div>
      </Container>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
