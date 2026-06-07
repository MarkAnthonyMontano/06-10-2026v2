import React, { useState, useRef, useEffect, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Container.css";
import Logo from "../assets/Logo.png";
import {
  Container,
  Box,
  Snackbar,
  Alert,
  TextField,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem
} from "@mui/material";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Badge as BadgeIcon,
  Cake as CakeIcon,
} from "@mui/icons-material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import CloseIcon from "@mui/icons-material/Close";
import CampaignIcon from "@mui/icons-material/Campaign";
import { SettingsContext } from "../App";
import API_BASE_URL from "../apiConfig";
import AnnouncementSlider from "../components/AnnouncementSlider";
import RedirectLoading from "../components/RedirectLoading";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Autocomplete from "@mui/material/Autocomplete";
import { motion, AnimatePresence } from "framer-motion";

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.96)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Top Bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "rgba(0,0,0,0.7)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CampaignIcon sx={{ color: "#fff", fontSize: 20 }} />
          <span style={{ color: "#fff", fontWeight: 600, fontSize: "14px", maxWidth: "60vw", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {current.title}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Zoom In */}
          <button
            onClick={() => setScale((s) => Math.min(s + 0.5, 3))}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
              width: 36, height: 36, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ZoomInIcon sx={{ fontSize: 20 }} />
          </button>
          {/* Zoom Out */}
          <button
            onClick={() => setScale((s) => Math.max(s - 0.5, 1))}
            style={{
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
              width: 36, height: 36, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ZoomOutIcon sx={{ fontSize: 20 }} />
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              background: "rgba(220,38,38,0.85)", border: "none", borderRadius: "50%",
              width: 36, height: 36, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      {/* ── Image Area ── */}
      <div style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {/* Prev */}
        {slides.length > 1 && (
          <button
            onClick={goPrev}
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%",
              width: 40, height: 40, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        {/* Next */}
        {slides.length > 1 && (
          <button
            onClick={goNext}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "rgba(255,255,255,0.18)", border: "none", borderRadius: "50%",
              width: 40, height: 40, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
          </button>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            drag={scale <= 1 ? "x" : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.03}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              touchAction: scale > 1 ? "pinch-zoom" : "pan-y",
            }}
          >
            <img
              src={`${API_BASE_URL}/uploads/Announcement/${current.file_path}`}
              alt={current.title}
              draggable={false}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
                transition: "transform 0.2s ease",
                userSelect: "none",
                borderRadius: scale > 1 ? 0 : "8px",
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom Bar: dots + counter ── */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: 12,
      }}>
        {slides.length > 1 && slides.map((_, i) => (
          <div
            key={i}
            onClick={() => { setIndex(i); setScale(1); }}
            style={{
              width: i === index ? 20 : 7, height: 7,
              borderRadius: 4,
              background: i === index ? "#fff" : "rgba(255,255,255,0.35)",
              transition: "all 0.3s",
              cursor: "pointer",
            }}
          />
        ))}
        {slides.length > 1 && (
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginLeft: 4 }}>
            {index + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* Zoom hint */}
      {scale > 1 && (
        <div style={{
          position: "absolute",
          bottom: 70,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontSize: "11px",
          padding: "4px 10px",
          borderRadius: "20px",
          pointerEvents: "none",
        }}>
          {Math.round(scale * 100)}% — tap − to zoom out
        </div>
      )}
    </div>
  );
};

/* ─── Compact mobile announcement banner ─── */
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

  const handleOpenViewer = () => {
    setViewerStartIndex(index);
    setOpenViewer(true);
  };

  return (
    <>
      {/* ── Fullscreen Viewer ── */}
      {openViewer && (
        <AnnouncementViewerModal
          slides={slides}
          startIndex={viewerStartIndex}
          onClose={() => setOpenViewer(false)}
        />
      )}

      {/* ── Banner Toggle Button (when hidden) ── */}
      {!bannerVisible && (
        <button
          onClick={() => setBannerVisible(true)}
          style={{
            width: "100%",
            marginBottom: "14px",
            padding: "10px",
            background: "rgba(0,0,0,0.08)",
            border: "1.5px dashed rgba(0,0,0,0.25)",
            borderRadius: "10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: "rgba(0,0,0,0.55)",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <CampaignIcon sx={{ fontSize: 16 }} />
          Show Announcements
        </button>
      )}

      {/* ── Banner ── */}
      {bannerVisible && (
        <div style={{
          width: "100%",
          borderRadius: "14px",
          overflow: "hidden",
          position: "relative",
          background: "#000",
          aspectRatio: "16 / 9",
          marginBottom: "16px",
          boxShadow: "0 4px 18px rgba(0,0,0,0.25)",
        }}>
          {/* Close/Hide Banner */}
          <button
            onClick={() => setBannerVisible(false)}
            style={{
              position: "absolute", top: 8, right: 8,
              zIndex: 20, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%",
              width: 28, height: 28, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </button>

          {/* Zoom / Fullscreen Button */}
          <button
            onClick={handleOpenViewer}
            style={{
              position: "absolute", top: 8, left: 8,
              zIndex: 20, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "20px",
              padding: "4px 10px", color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
              fontSize: "11px", fontWeight: 600,
            }}
          >
            <ZoomInIcon sx={{ fontSize: 14 }} />
            View
          </button>

          {/* Prev */}
          <button
            onClick={goPrev}
            style={{
              position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
              width: 34, height: 34, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              zIndex: 10, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
              width: 34, height: 34, color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.03}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{ width: "100%", height: "100%", position: "relative", touchAction: "pan-y" }}
            >
              <img
                src={`${API_BASE_URL}/uploads/Announcement/${current.file_path}`}
                alt={current.title}
                onClick={handleOpenViewer}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  userSelect: "none",
                  display: "block",
                  cursor: "zoom-in",
                  pointerEvents: "auto",
                }}
                draggable={false}
              />
              <div style={{
                position: "absolute", bottom: 0, width: "100%",
                padding: "0.7rem 0.9rem",
                background: "linear-gradient(transparent, rgba(0,0,0,0.72))",
                color: "#fff",
                pointerEvents: "none",
              }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.82rem" }}>{current.title}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          {slides.length > 1 && (
            <div style={{
              position: "absolute", bottom: 6, right: 10,
              display: "flex", gap: 5, zIndex: 10,
            }}>
              {slides.map((_, i) => (
                <div key={i} onClick={() => setIndex(i)} style={{
                  width: i === index ? 16 : 6, height: 6,
                  borderRadius: 3, background: i === index ? "#fff" : "rgba(255,255,255,0.45)",
                  transition: "all 0.3s", cursor: "pointer",
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════
   REGISTER PAGE
════════════════════════════════════════ */
const Register = () => {
  const settings = useContext(SettingsContext);
  const isMobile = useIsMobile();

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");
  const [stepperColor, setStepperColor] = useState("#000000");

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [openReminder, setOpenReminder] = useState(true);

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);
    if (settings.logo_url) setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);
    if (settings.branches) {
      setBranches(
        typeof settings.branches === "string"
          ? JSON.parse(settings.branches)
          : settings.branches
      );
    }
  }, [settings]);

  const getBranchLabel = (branchId) => {
    const branch = branches.find((item) => String(item.id) === String(branchId));
    return branch?.branch || "—";
  };

  const [usersData, setUserData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(180);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const navigate = useNavigate();

  const handleChanges = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const [agreeChecked, setAgreeChecked] = useState(false);
  const [reminderChecked, setReminderChecked] = useState(false);
  const [currentYear, setCurrentYear] = useState("");

  useEffect(() => {
    const now = new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" });
    setCurrentYear(new Date(now).getFullYear());
  }, []);

  const handleClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnack((prev) => ({ ...prev, open: false }));
  };

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [academicProgram, setAcademicProgram] = useState("");
  const [applyingAs, setApplyingAs] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState("");
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");

  // Mobile slides
  const [mobileSlides, setMobileSlides] = useState([]);
  useEffect(() => {
    if (!isMobile) return;
    axios.get(`${API_BASE_URL}/api/announcements`)
      .then((res) => { if (Array.isArray(res.data.data)) setMobileSlides(res.data.data); })
      .catch(() => { });
  }, [isMobile]);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/branches`)
      .then((res) => setBranches(res.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/applied_program`)
      .then((res) => setCurriculumOptions(res.data))
      .catch((err) => console.error("Error fetching curriculum options:", err));
  }, []);

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "Enter" && !loadingOtp) verifyOtp();
  };

  const [errors, setErrors] = useState({});

  const handleRegister = async () => {
    if (isSubmitting) return;
    if (!reminderChecked) {
      setSnack({ open: true, message: "You must agree to the Terms and Conditions before registering.", severity: "warning" });
      return;
    }
    if (!isFormValid()) {
      setSnack({ open: true, message: "Please fill up all required fields!", severity: "warning" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!branchId || !registrationOpen) {
      setSnack({ open: true, message: "Registration is closed for this campus.", severity: "error" });
      return;
    }
    if (!emailRegex.test(usersData.email)) {
      setSnack({ open: true, message: "Please enter a valid email address!", severity: "error" });
      return;
    }
    if (usersData.password !== confirmPassword) {
      setSnack({ open: true, message: "Passwords do not match!", severity: "error" });
      return;
    }
    const normalizedEmail = usersData.email.trim().toLowerCase();
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/api/check-registration-duplicate`, {
        email: normalizedEmail,
        firstName,
        lastName,
        birthday,
      });
      await axios.post(`${API_BASE_URL}/api/request-otp`, { email: normalizedEmail, audit_log_db: "db" });
      setTempEmail(normalizedEmail);
      setOtp(["", "", "", "", "", ""]);
      setShowOtpModal(true);
      startResendTimer();
      setSnack({ open: true, message: "OTP sent to your email", severity: "success" });
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (error) {
      setSnack({ open: true, message: error.response?.data?.message || "Failed to send OTP", severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const [programAvailability, setProgramAvailability] = useState([]);
  const [activeSchoolYearId, setActiveSchoolYearId] = useState(null);
  const [activeYearId, setActiveYearId] = useState(null);
  const [activeSemesterId, setActiveSemesterId] = useState(null);

  useEffect(() => {
    const fetchActiveYearAndAvailability = async () => {
      const yearRes = await axios.get(`${API_BASE_URL}/api/active_school_year`);
      const activeYear = yearRes.data[0];
      if (activeYear) {
        setActiveSchoolYearId(activeYear.school_year_id);
        setActiveYearId(activeYear.year_id);
        setActiveSemesterId(activeYear.semester_id);
        const availRes = await axios.get(`${API_BASE_URL}/api/programs/availability`, {
          params: { year_id: activeYear.year_id, semester_id: activeYear.semester_id },
        });
        setProgramAvailability(availRes.data);
      }
    };
    fetchActiveYearAndAvailability();
  }, []);

  const availabilityMap = React.useMemo(() => {
    const map = {};
    programAvailability.forEach((p) => {
      map[p.curriculum_id] = { remaining: Number(p.remaining), isFull: Number(p.remaining) <= 0 };
    });
    return map;
  }, [programAvailability]);

  useEffect(() => {
    if (!selectedCurriculum) return;
    const availability = availabilityMap[selectedCurriculum];
    if (availability?.isFull) {
      setSelectedCurriculum("");
      setSnack({ open: true, message: "Selected course is now FULL. Please choose another.", severity: "warning" });
    }
  }, [availabilityMap]);

  const isFormValid = () => {
    let newErrors = {};
    let isValid = true;
    if (!branchId) { newErrors.campus = true; isValid = false; }
    if (!lastName) { newErrors.lastName = true; isValid = false; }
    if (!firstName) { newErrors.firstName = true; isValid = false; }
    if (!birthday) { newErrors.birthday = true; isValid = false; }
    if (!academicProgram) { newErrors.academicProgram = true; isValid = false; }
    if (!applyingAs) { newErrors.applyingAs = true; isValid = false; }
    if (!selectedCurriculum) { newErrors.selectedCurriculum = true; isValid = false; }
    if (!usersData.email) { newErrors.email = true; isValid = false; }
    if (!usersData.password) { newErrors.password = true; isValid = false; }
    if (!confirmPassword) { newErrors.confirmPassword = true; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const getIconTop = (hasError) => hasError ? "55%" : "70%";

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const resendOtp = async () => {
    try {
      setLoadingOtp(true);
      await axios.post(`${API_BASE_URL}/api/request-otp`, { email: tempEmail, audit_log_db: "db" });
      startResendTimer();
      setSnack({ open: true, message: "OTP resent!", severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Failed to resend OTP", severity: "error" });
    }
    setLoadingOtp(false);
  };

  const [redirectLoading, setRedirectLoading] = useState(false);

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (!/^\d{6}$/.test(otpValue)) {
      setSnack({ open: true, message: "Enter complete 6-digit OTP", severity: "error" });
      return;
    }
    setLoadingOtp(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/register`, {
        ...usersData, email: tempEmail || usersData.email.trim().toLowerCase(), campus: branchId, lastName, firstName, middleName, birthday,
        academicProgram, applyingAs, program: selectedCurriculum,
        active_school_year_id: activeSchoolYearId, otp: otpValue, audit_log_db: "db",
      });
      if (!response.data.success) {
        setSnack({ open: true, message: response.data.message, severity: "error" });
        return;
      }
      setShowOtpModal(false);
      setRedirectLoading(true);
      setTimeout(() => navigate("/login_applicant"), 3000);
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Something went wrong.", severity: "error" });
    } finally {
      setLoadingOtp(false);
    }
  };

  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [openClosedDialog, setOpenClosedDialog] = useState(false);
  const [openBranchDialog, setOpenBranchDialog] = useState(false);

  const handleBranchSelect = (e) => {
    const selectedId = e.target.value;
    setBranchId(selectedId);
    setAcademicProgram("");
    setApplyingAs("");
    setSelectedCurriculum("");
  };

  useEffect(() => {
    if (!branchId) return;
    const fetchRegistrationStatus = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/registration-status/${branchId}`);
        const isOpen = res.data.registration_open === 1;
        setRegistrationOpen(isOpen);
        if (!isOpen) setOpenBranchDialog(true);
      } catch (err) { console.error(err); }
    };
    fetchRegistrationStatus();
  }, [branchId]);

  const branchSelected = !!branchId;
  const fieldDisabled = !branchSelected || !registrationOpen;
  const selectedBranch = branches.find((b) => b.id.toString() === branchId);

  const filteredCurriculum = React.useMemo(() => {
    const filtered = curriculumOptions.filter((item) => {
      if (branchId && Number(item.components) !== Number(branchId)) return false;
      if (academicProgram && Number(item.academic_program) !== Number(academicProgram)) return false;
      return true;
    });
    const uniqueMap = new Map();
    filtered.forEach((item) => { if (!uniqueMap.has(item.curriculum_id)) uniqueMap.set(item.curriculum_id, item); });
    return Array.from(uniqueMap.values());
  }, [curriculumOptions, branchId, academicProgram]);

  const handleKeyDownRegister = (e) => {
    if (e.key === "Enter" && !isSubmitting) {
      if (!branchId) { setSnack({ open: true, message: "Please select a branch!", severity: "warning" }); return; }
      if (!registrationOpen) { setSnack({ open: true, message: "Registration is closed for this campus.", severity: "error" }); return; }
      handleRegister();
    }
  };

  const backgroundImage = settings?.bg_image
    ? `url(${API_BASE_URL}${settings.bg_image})`
    : "url(/default-bg.jpg)";

  if (redirectLoading) return <RedirectLoading message="Account created! Redirecting to login..." />;

  /* ─ shared input style ─ */
  const inputH = isMobile ? "44px" : "45px";

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
        overflowY: isMobile ? "auto" : "hidden",
        py: isMobile ? 2 : 0,
      }}>
        <Container
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: isMobile ? "column" : "row",
            padding: isMobile ? "0" : undefined,
          }}
          maxWidth={false}
        >
          {/* Desktop side slider */}
          {!isMobile && <AnnouncementSlider campusId={branchId} targetRole="applicant" />}

          <div
            style={{
              border: isMobile ? "3px solid black" : "5px solid black",
              marginLeft: isMobile ? 0 : -100,
              marginTop: isMobile ? 0 : "-50px",
              width: isMobile ? "calc(100% - 32px)" : undefined,
              maxWidth: isMobile ? 520 : undefined,
            }}
            className="Container"
          >
            {/* ── Header ── */}
            <div
              className="Header"
              style={{
                backgroundColor: settings?.header_color || "#1976d2",
                padding: isMobile ? "12px 10px" : "1rem 0",
                borderBottom: "3px solid black",
              }}
            >
              <div className="HeaderTitle">
                <div className="CircleCon">
                  <img src={settings?.logo_url ? `${API_BASE_URL}${settings.logo_url}` : Logo} alt="Logo" />
                </div>
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

              {/* Mobile banner inside card */}
              {isMobile && mobileSlides.length > 0 && (
                <MobileAnnouncementBanner slides={mobileSlides} />
              )}

              {/* Campus */}
              <div className="TextField">
                <label style={{ color: "black" }}>Campus<span style={{ color: "red" }}> *</span></label>
                <select
                  value={branchId}
                  onChange={handleBranchSelect}
                  className="border"
                  required
                  style={{
                    height: inputH,
                    border: errors.campus ? "2px solid red" : "2px solid black",
                    width: "100%",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    paddingRight: "2.2rem",
                  }}
                >
                  <option value="">Select Campus</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.branch}</option>)}
                </select>
                <ArrowDropDownIcon sx={{ position: "absolute", right: "10px", top: "70%", transform: "translateY(-50%)", fontSize: "30px", color: "black", pointerEvents: "none" }} />
              </div>

              {/* Section divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "1.2rem 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
                <span style={{ margin: "0 0.8rem", fontWeight: "600", color: "#555", fontSize: isMobile ? "13px" : "14px", whiteSpace: "nowrap" }}>Personal Information</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
              </div>

              {/* Name fields */}
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "0" : "1rem",
              }}>
                {/* Last Name */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label style={{ color: "black" }}>Last Name<span style={{ color: "red" }}> *</span></label>
                  <input type="text" placeholder="Enter your last name" required disabled={fieldDisabled}
                    value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())}
                    onKeyDown={handleKeyDownRegister} className="border"
                    style={{ paddingLeft: "2.5rem", height: inputH, border: errors.lastName ? "2px solid red" : "2px solid black", width: "100%" }}
                  />
                  <BadgeIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", fontSize: "20px" }} />
                  {errors.lastName && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                </div>

                {/* First Name */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label style={{ color: "black" }}>First Name<span style={{ color: "red" }}> *</span></label>
                  <input type="text" required placeholder="Enter your first name" value={firstName} disabled={fieldDisabled}
                    onChange={(e) => setFirstName(e.target.value.toUpperCase())} onKeyDown={handleKeyDownRegister} className="border"
                    style={{ paddingLeft: "2.5rem", height: inputH, border: errors.firstName ? "2px solid red" : "2px solid black", width: "100%" }}
                  />
                  <PersonIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", fontSize: "20px" }} />
                  {errors.firstName && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                </div>

                {/* Middle Name */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label style={{ color: "black" }}>Middle Name (Optional)</label>
                  <input type="text" placeholder="Enter your middle name" value={middleName} disabled={fieldDisabled}
                    onChange={(e) => setMiddleName(e.target.value.toUpperCase())} onKeyDown={handleKeyDownRegister} className="border"
                    style={{ paddingLeft: "2.5rem", height: inputH, border: "2px solid black", width: "100%" }}
                  />
                  <PersonIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", fontSize: "20px" }} />
                </div>

                {/* Birthday */}
                <div className="TextField" style={{ position: "relative" }}>
                  <label style={{ color: "black" }}>Birth Date<span style={{ color: "red" }}> *</span></label>
                  <input type="date" required value={birthday} disabled={fieldDisabled}
                    onChange={(e) => setBirthday(e.target.value)} onKeyDown={handleKeyDownRegister} className="border"
                    style={{ paddingLeft: "2.5rem", height: inputH, border: errors.birthday ? "2px solid red" : "2px solid black", width: "100%" }}
                  />
                  <CakeIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", fontSize: "20px" }} />
                  {errors.birthday && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                </div>
              </div>

              {/* Section divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "1.2rem 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
                <span style={{ margin: "0 0.8rem", fontWeight: "600", color: "#555", fontSize: isMobile ? "13px" : "14px", whiteSpace: "nowrap" }}>Academic Information</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
              </div>

              {/* Academic Program + Applying As */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                {/* Academic Program */}
                <div className="TextField" style={{ position: "relative", flex: 1 }}>
                  <label style={{ color: "black" }}>Academic Program<span style={{ color: "red" }}> *</span></label>
                  <select required value={academicProgram} disabled={fieldDisabled}
                    onChange={(e) => { setAcademicProgram(e.target.value); setApplyingAs(""); setSelectedCurriculum(""); }}
                    className="border"
                    style={{ paddingLeft: "1rem", height: inputH, border: errors.academicProgram ? "2px solid red" : "2px solid black", width: "100%", appearance: "none", paddingRight: "2.2rem" }}
                  >
                    <option value="">Select Program</option>
                    {selectedBranch?.academicPrograms?.filter((prog) => prog.open === 1).map((prog) => (
                      <option key={prog.id} value={prog.id}>{prog.name}</option>
                    ))}
                  </select>
                  {errors.academicProgram && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                  <ArrowDropDownIcon sx={{ position: "absolute", right: "10px", top: getIconTop(errors.academicProgram), transform: "translateY(-50%)", fontSize: "30px", pointerEvents: "none" }} />
                </div>

                {/* Applying As */}
                <div className="TextField" style={{ position: "relative", flex: 1 }}>
                  <label style={{ color: "black" }}>Applying As<span style={{ color: "red" }}> *</span></label>
                  <select required value={applyingAs} disabled={fieldDisabled}
                    onChange={(e) => {
                      if (!academicProgram) { setSnack({ open: true, message: "Please select Academic Program first.", severity: "warning" }); return; }
                      setApplyingAs(e.target.value); setSelectedCurriculum("");
                    }}
                    className="border"
                    style={{ paddingLeft: "1rem", height: inputH, border: errors.applyingAs ? "2px solid red" : "2px solid black", width: "100%", appearance: "none", paddingRight: "2.2rem" }}
                  >
                    <option value="">Select Applying</option>
                    {(() => {
                      const selectedProgram = selectedBranch?.academicPrograms?.find((prog) => prog.id.toString() === academicProgram);
                      if (!selectedProgram) return null;
                      const name = selectedProgram.name.toLowerCase();
                      if (name.includes("undergraduate")) return (
                        <>
                          <option value="1">Senior High School Graduate</option>
                          <option value="2">Senior High School Graduating Student</option>
                          <option value="3">ALS Passer</option>
                          <option value="4">Transferee</option>
                          <option value="5">Cross Enrollee</option>
                          <option value="6">Foreign Applicant</option>
                        </>
                      );
                      if (name.includes("graduate") || name.includes("master") || name.includes("baccalaureate")) return (
                        <>
                          <option value="7">Baccalaureate Graduate</option>
                          <option value="8">Master Degree Graduate</option>
                        </>
                      );
                      return null;
                    })()}
                  </select>
                  {errors.applyingAs && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                  <ArrowDropDownIcon sx={{ position: "absolute", right: "10px", top: getIconTop(errors.applyingAs), transform: "translateY(-50%)", fontSize: "30px", pointerEvents: "none" }} />
                </div>
              </div>

              {/* Course Applied */}
              <div className="TextField" style={{ position: "relative" }}>
                <label style={{ color: "black" }}>Course Applied<span style={{ color: "red" }}> *</span></label>
                <Autocomplete
                  disabled={fieldDisabled || !academicProgram}
                  options={filteredCurriculum}
                  getOptionLabel={(option) =>
                    `(${option.program_code}): ${option.program_description}${option.major ? ` (${option.major})` : ""} (${getBranchLabel(option.components)})`
                  }
                  value={filteredCurriculum.find((c) => String(c.curriculum_id) === String(selectedCurriculum)) || null}
                  onChange={(event, selected) => {
                    if (!selected) { setSelectedCurriculum(""); return; }
                    const availability = availabilityMap[selected.curriculum_id];
                    if (availability?.isFull) { setSnack({ open: true, message: "This course is already FULL.", severity: "error" }); return; }
                    setSelectedCurriculum(selected.curriculum_id);
                  }}
                  isOptionEqualToValue={(option, value) => option.curriculum_id === value.curriculum_id}
                  getOptionDisabled={(option) => availabilityMap[option.curriculum_id]?.isFull}
                  renderOption={(props, option) => {
                    const availability = availabilityMap[option.curriculum_id];
                    const remaining = availability?.remaining ?? 0;
                    const isFull = availability?.isFull;
                    return (
                      <li {...props} style={{ color: isFull ? "red" : "green", fontSize: isMobile ? "13px" : "14px" }}>
                        {`(${option.program_code}): ${option.program_description}${option.major ? ` (${option.major})` : ""} (${getBranchLabel(option.components)})`}
                        {isFull ? " — FULL (0 slots left)" : ` — (${remaining} slots left)`}
                      </li>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} required placeholder="Select Curriculum / Course"
                      error={!!errors.selectedCurriculum}
                      helperText={errors.selectedCurriculum ? "This field is required" : ""}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          height: inputH,
                          "& fieldset": { border: errors.selectedCurriculum ? "2px solid red" : "2px solid black" },
                          "&:hover fieldset": { border: errors.selectedCurriculum ? "2px solid red" : "2px solid black" },
                          "&.Mui-focused fieldset": { border: errors.selectedCurriculum ? "2px solid red" : "2px solid black" },
                        },
                      }}
                    />
                  )}
                />
              </div>

              {/* Section divider */}
              <div style={{ display: "flex", alignItems: "center", margin: "1.2rem 0" }}>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
                <span style={{ margin: "0 0.8rem", fontWeight: "600", color: "#555", fontSize: isMobile ? "13px" : "14px", whiteSpace: "nowrap" }}>Account Information</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#ccc" }} />
              </div>

              {/* Email */}
              <div className="TextField" style={{ position: "relative" }}>
                <label style={{ color: "black" }}>Email Address<span style={{ color: "red" }}> *</span></label>
                <input required type="email" disabled={fieldDisabled} className="border"
                  id="email" name="email" placeholder="Enter your email address"
                  value={usersData.email} onChange={handleChanges} onKeyDown={handleKeyDownRegister}
                  style={{ paddingLeft: "2.5rem", height: inputH, border: errors.email ? "2px solid red" : "2px solid black" }}
                />
                <EmailIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", color: "rgba(0,0,0,0.4)", fontSize: "20px" }} />
                {errors.email && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                <span style={{ fontSize: "13px", color: "red", marginTop: "4px", display: "block" }}>
                  Note: Each email can only be used once. Use a valid and unused Gmail account.
                </span>
              </div>

              {/* Password + Confirm */}
              <div style={{ display: "flex", gap: "1rem", flexDirection: isMobile ? "column" : "row" }}>
                <div className="TextField" style={{ position: "relative", flex: 1 }}>
                  <label style={{ color: "black" }}>Password<span style={{ color: "red" }}> *</span></label>
                  <input type={showPassword ? "text" : "password"} className="border" id="password" disabled={fieldDisabled}
                    name="password" placeholder="Enter your password" value={usersData.password}
                    onChange={handleChanges} onKeyDown={handleKeyDownRegister} required
                    style={{ paddingLeft: "2.5rem", height: inputH, border: errors.password ? "2px solid red" : "2px solid black", width: "100%" }}
                  />
                  <LockIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", color: "rgba(0,0,0,0.4)", fontSize: "22px" }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: "absolute", top: "2.5rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}>
                    {showPassword ? <Visibility /> : <VisibilityOff />}
                  </button>
                  {errors.password && <span style={{ color: "red", fontSize: "12px" }}>This field is required</span>}
                </div>

                <div className="TextField" style={{ position: "relative", flex: 1 }}>
                  <label style={{ color: "black" }}>Confirm Password<span style={{ color: "red" }}> *</span></label>
                  <input type={showConfirmPassword ? "text" : "password"} className="border" id="confirmPassword"
                    name="confirmPassword" placeholder="Re-enter your password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDownRegister}
                    required disabled={!usersData.password}
                    style={{
                      paddingLeft: "2.5rem", height: inputH,
                      border: errors.confirmPassword ? "2px solid red" : "2px solid black",
                      width: "100%",
                      backgroundColor: !usersData.password ? "#f0f0f0" : "white",
                      cursor: !usersData.password ? "not-allowed" : "text",
                    }}
                  />
                  <LockIcon style={{ position: "absolute", top: "2.5rem", left: "0.7rem", color: "rgba(0,0,0,0.4)", fontSize: "22px" }} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", top: "2.5rem", right: "1rem", background: "none", border: "none", cursor: "pointer" }}>
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </button>
                  {errors.confirmPassword && <span style={{ color: "red", fontSize: "12px" }}>Passwords do not match</span>}
                </div>
              </div>

              {/* Terms checkbox */}
              <Box sx={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                <FormControlLabel
                  control={<Checkbox checked={reminderChecked} onChange={(e) => setReminderChecked(e.target.checked)} />}
                  label={
                    <Typography sx={{ fontSize: isMobile ? "12px" : "14px" }}>
                      I have read and agree to the admission requirements and policies of {settings?.company_name || ""} before proceeding.
                    </Typography>
                  }
                />
              </Box>

              {/* Submit button */}
              <div
                tabIndex={0}
                onClick={() => {
                  if (!branchSelected) { setSnack({ open: true, message: "Please select a branch first!", severity: "warning" }); return; }
                  if (!registrationOpen) { setSnack({ open: true, message: "Registration is currently closed for this campus.", severity: "error" }); return; }
                  if (!reminderChecked) { setSnack({ open: true, message: "Please agree to the Terms and Conditions before registering.", severity: "warning" }); return; }
                  if (!isSubmitting) handleRegister();
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (!branchSelected) { setSnack({ open: true, message: "Please select a branch first!", severity: "warning" }); return; }
                  if (!registrationOpen) { setSnack({ open: true, message: "Registration is currently closed for this campus.", severity: "error" }); return; }
                  if (!reminderChecked) { setSnack({ open: true, message: "Please agree to the Terms and Conditions before registering.", severity: "warning" }); return; }
                  if (!isSubmitting) handleRegister();
                }}
                style={{
                  opacity: registrationOpen && branchSelected ? 1 : 0.5,
                  cursor: "pointer",
                  marginTop: isMobile ? "24px" : "40px",
                  backgroundColor: mainButtonColor,
                  height: "50px",
                  border: "2px solid black",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                }}
              >
                {!registrationOpen ? "REGISTRATION CLOSED" : isSubmitting ? "REGISTERING..." : "SUBMIT APPLICATION"}
              </div>

              <div className="LinkContainer RegistrationLink" style={{ margin: "0.1rem 0rem", fontSize: isMobile ? "13px" : undefined }}>
                <p>Already Have an Account?</p>
                <span><Link to={"/login_applicant"}>Sign In here</Link></span>
              </div>
            </div>

            <div className="Footer">
              <div className="FooterText">
                &copy; {currentYear} {settings?.company_name || ""} <br />
                Student Information System. <br />
                All rights reserved.
              </div>
            </div>
          </div>
        </Container>

        {/* OTP Modal */}
        <Modal open={showOtpModal} onClose={() => setShowOtpModal(false)}>
          <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: isMobile ? "calc(100% - 40px)" : 440,
            maxWidth: 440,
            bgcolor: "#fff", borderRadius: "20px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)", p: isMobile ? 3 : 4, border: "1px solid #eee",
          }}>
            <button onClick={() => setShowOtpModal(false)} style={{
              position: "absolute", top: "12px", right: "12px",
              backgroundColor: "black", color: "white", border: "none", borderRadius: "50%",
              width: "34px", height: "34px", cursor: "pointer", fontSize: "16px", fontWeight: "bold",
            }}>✕</button>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Verify your email</h2>
            <p style={{ color: "#666", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
              We sent a 6-digit verification code to your registered email address.
            </p>
            <Box sx={{ display: "flex", justifyContent: "center", gap: isMobile ? 1 : 1.5, mb: 3 }}>
              {otp.map((digit, index) => (
                <input key={index} ref={(el) => (otpRefs.current[index] = el)}
                  type="text" inputMode="numeric" maxLength={1} value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  style={{
                    width: isMobile ? "42px" : "54px", height: isMobile ? "50px" : "60px",
                    fontSize: "22px", fontWeight: 700, textAlign: "center",
                    borderRadius: "14px", border: "2px solid #ddd", outline: "none",
                  }}
                />
              ))}
            </Box>
            <p style={{ fontSize: "13px", color: "#777", marginBottom: "18px", textAlign: "center" }}>
              This email can only be used once for admission verification.
            </p>
            <button onClick={verifyOtp} disabled={loadingOtp} style={{
              width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              backgroundColor: mainButtonColor, color: "white", fontWeight: 700, fontSize: "15px",
              cursor: loadingOtp ? "not-allowed" : "pointer",
            }}>
              {loadingOtp ? "Verifying..." : "Verify & Continue"}
            </button>
            <button onClick={resendOtp} disabled={resendTimer > 0} style={{
              width: "100%", marginTop: "12px", padding: "12px", borderRadius: "12px",
              border: "1px solid #ddd", background: "#fff", fontWeight: 600,
              color: resendTimer > 0 ? "#999" : "#333",
            }}>
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
            </button>
            <p style={{ marginTop: "14px", fontSize: "12px", color: "#999", textAlign: "center" }}>
              Didn't receive the code? Check your spam folder.
            </p>
          </Box>
        </Modal>

        <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
          <Alert severity={snack.severity} onClose={handleClose} sx={{ width: "100%" }}>{snack.message}</Alert>
        </Snackbar>

        {/* ── Dialog: Important Reminder ── */}
        <Dialog open={openReminder} onClose={() => setOpenReminder(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", mx: isMobile ? 2 : "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" } }}>
          <DialogTitle sx={{ bgcolor: mainButtonColor, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", px: 3, py: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WarningAmberIcon sx={{ color: "white", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography fontWeight="bold" fontSize={isMobile ? 14 : 16} color="white" lineHeight={1.2}>Important Reminder for Applicants</Typography>
                <Typography fontSize={12} color="rgba(255,255,255,0.8)" lineHeight={1.2}>Please read before proceeding</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            <Box sx={{ border: "1px solid #f5a623", borderRadius: "8px", p: 1.5, mb: 2, mt: 2, display: "flex", gap: 1, alignItems: "flex-start", backgroundColor: "#fffbf2" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <Typography fontSize={12.5} color="#5d4037" lineHeight={1.5}>
                Please ensure all information is accurate and complete. Submitting{" "}
                <strong>multiple accounts or duplicate applications is strictly prohibited</strong>{" "}
                and may result in automatic disqualification.
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "13.5px", color: "#333", lineHeight: 1.6, mb: 2 }}>
              Each applicant must register and submit only one application. Await the official announcement for screening results.
            </Typography>
            <Box component="label" htmlFor="agreeCheck" sx={{ display: "flex", alignItems: "center", gap: 1.5, border: "1.5px solid #cc3333", borderRadius: "4px", px: 1.5, py: 1.25, mt: 2, mb: 0.5, cursor: "pointer", transition: "background 0.15s" }}>
              <Checkbox id="agreeCheck" checked={agreeChecked} onChange={(e) => setAgreeChecked(e.target.checked)}
                sx={{ p: 0, color: "#cc3333", "&.Mui-checked": { color: "#cc3333" } }} size="small" />
              <Typography sx={{ fontSize: "13px", color: "#333", userSelect: "none" }}>I understand and agree to submit only one application.</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", px: 3, pb: 2.5, pt: 1, mt: 1 }}>
            <Button variant="contained" disabled={!agreeChecked} onClick={() => setOpenReminder(false)}
              fullWidth={isMobile}
              sx={{ backgroundColor: agreeChecked ? mainButtonColor : "#b0b8c8", color: "#fff", fontWeight: 600, fontSize: "14px", px: 4, py: 1.25, textTransform: "none", boxShadow: "none", "&:hover": { backgroundColor: agreeChecked ? mainButtonColor : "#b0b8c8", boxShadow: "none" }, "&.Mui-disabled": { backgroundColor: "#b0b8c8", color: "#fff", opacity: 0.7 } }}>
              I Agree — Continue to Registration
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: Registration Closed ── */}
        <Dialog open={openClosedDialog} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", mx: isMobile ? 2 : "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" } }}>
          <DialogTitle sx={{ bgcolor: "#7a0000", color: "white", display: "flex", alignItems: "center", fontWeight: "bold", px: 3, py: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography fontSize={20}>🚫</Typography>
              </Box>
              <Box>
                <Typography fontWeight="bold" fontSize={isMobile ? 14 : 16} color="white" lineHeight={1.2}>Registration Closed</Typography>
                <Typography fontSize={12} color="rgba(255,255,255,0.8)" lineHeight={1.2}>Applications are not being accepted</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
            <Box textAlign="center" py={1}>
              <Box sx={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#fff0f0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "3px solid #f44336" }}>
                <Typography fontSize={34}>🚫</Typography>
              </Box>
              <Typography fontWeight="bold" fontSize={17} color="#c62828" mb={1}>Registration is Currently Closed</Typography>
              <Typography fontSize={13.5} color="#555" lineHeight={1.6}>Please wait for the official announcement before attempting to register.</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", px: 3, pb: 2.5, pt: 1.5 }}>
            <Button variant="contained" onClick={() => navigate("/login_applicant")} fullWidth={isMobile}
              sx={{ backgroundColor: "#7a0000", color: "#fff", fontWeight: 600, fontSize: "14px", px: 4, py: 1.25, borderRadius: "10px", textTransform: "none", boxShadow: "none" }}>
              Go to Login
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Dialog: Branch Admissions Closed ── */}
        <Dialog open={openBranchDialog} onClose={() => setOpenBranchDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", mx: isMobile ? 2 : "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" } }}>
          <DialogTitle sx={{ bgcolor: mainButtonColor, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", px: 3, py: 2 }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CampaignIcon sx={{ color: "white", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography fontWeight="bold" fontSize={isMobile ? 14 : 16} color="white" lineHeight={1.2}>Admissions Currently Closed</Typography>
                <Typography fontSize={12} color="rgba(255,255,255,0.8)" lineHeight={1.2}>This campus is not accepting applications</Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
            <Box sx={{ border: "1px solid #f5a623", borderRadius: "8px", p: 1.5, mb: 2, mt: 2, display: "flex", gap: 1, alignItems: "flex-start", backgroundColor: "#fffbf2" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <Typography fontSize={12.5} color="#5d4037" lineHeight={1.5}>
                Registration is only available during the officially designated hours. Submissions outside this period <strong>cannot be processed</strong>.
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "13.5px", color: "#333", lineHeight: 1.6, mb: 1.5 }}>
              Kindly return during the authorized registration hours to complete your application.
            </Typography>
            {selectedBranch?.start_date && selectedBranch?.end_date && (
              <Box sx={{ textAlign: "center", mt: 2, p: 2, background: "#fff9ec", borderRadius: "8px", border: "1.5px solid #e2e8f0" }}>
                <Typography sx={{ fontSize: "11px", color: "red", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, mb: 0.5 }}>Registration Hours</Typography>
                <Typography sx={{ fontSize: isMobile ? "20px" : "26px", fontWeight: 700, color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" }}>
                  {new Date(selectedBranch.start_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })}
                  {" – "}
                  {new Date(selectedBranch.end_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })}
                </Typography>
              </Box>
            )}
            <Typography sx={{ fontSize: "13px", color: "#888", lineHeight: 1.6, textAlign: "center", fontStyle: "italic", mt: 2, mb: 0.5 }}>
              We sincerely appreciate your patience and understanding.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.5, gap: 1.5, display: "flex", flexDirection: isMobile ? "column" : "row" }}>
            <Button variant="outlined" color="error" onClick={() => setOpenBranchDialog(false)} fullWidth sx={{ height: 48, textTransform: "none", fontWeight: 600, fontSize: "14px" }}>Close</Button>
            <Button variant="contained" onClick={() => navigate("/login_applicant")} fullWidth sx={{ height: 48, backgroundColor: mainButtonColor, color: "#fff", fontWeight: 600, fontSize: "14px", textTransform: "none", boxShadow: "none" }}>Go to Login</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default Register;
