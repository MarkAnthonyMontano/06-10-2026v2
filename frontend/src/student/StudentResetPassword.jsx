import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from "axios";
import {
  Box, Button, Typography, TextField, List, ListItem, ListItemIcon,
  ListItemText, IconButton, InputAdornment, Snackbar, InputLabel,
  FormControlLabel, Switch, Alert, Divider, Paper,
} from "@mui/material";
import {
  Visibility, VisibilityOff, CheckCircle, Cancel, Settings,
} from "@mui/icons-material";
import API_BASE_URL from "../apiConfig";
import { useNavigate } from "react-router-dom";

const passwordRules = [
  { label: "Minimum of 8 characters", test: (pw) => pw.length >= 8 },
  { label: "At least one lowercase letter (e.g. abc)", test: (pw) => /[a-z]/.test(pw) },
  { label: "At least one uppercase letter (e.g. ABC)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least one number (e.g. 123)", test: (pw) => /\d/.test(pw) },
  { label: "At least one special character (! # $ ^ * @)", test: (pw) => /[!#$^*@]/.test(pw) },
];

const StudentResetPassword = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
  }, [settings]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validations, setValidations] = useState([]);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [otpRequired, setOtpRequired] = useState(true);

  // ── Auth guard ──
  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    if (!(storedUser && storedRole && storedID && storedRole === "student")) {
      window.location.href = "/login";
    }
  }, []);

  // ── Password validation ──
  useEffect(() => {
    setValidations(passwordRules.map((rule) => rule.test(newPassword)));
  }, [newPassword]);

  // ── OTP setting ──
  useEffect(() => {
    const fetchOtpSetting = async () => {
      try {
        const person_id = localStorage.getItem("person_id");
        const res = await axios.get(`${API_BASE_URL}/api/get-otp-setting/user/${person_id}`);
        setOtpRequired(res.data.require_otp === 1);
      } catch (err) {
        console.error("Failed to load OTP setting", err);
      }
    };
    fetchOtpSetting();
  }, []);

  const handleOtpToggle = async (event) => {
    const newValue = event.target.checked;
    setOtpRequired(newValue);
    try {
      const person_id = localStorage.getItem("person_id");
      const res = await axios.post(`${API_BASE_URL}/api/update-otp-setting`, {
        type: "user", person_id, require_otp: newValue ? 1 : 0,
      });
      setSnack({ open: true, message: res.data.message, severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Failed to update OTP setting", severity: "error" });
    }
  };

  const isValid = validations.every(Boolean) && newPassword === confirmPassword;
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const person_id = localStorage.getItem("person_id");
      const response = await axios.post(`${API_BASE_URL}/api/student-change-password`, {
        person_id, currentPassword, newPassword,
      });

      setSnack({ open: true, message: response.data.message, severity: "success" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");

      // Clear the force flag and unlock the sidebar, then redirect
      localStorage.removeItem("force_password_change");
      window.dispatchEvent(new Event("password_changed"));

      setTimeout(() => {
        navigate("/student_dashboard");
      }, 1500);

    } catch (err) {
      setSnack({ open: true, message: err.response?.data?.message || "Error updating password.", severity: "error" });
    }
  };

  const toggleShowPassword = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));

  // 🔒 DevTools block
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("keydown", (e) => {
    const isBlockedKey = e.key === "F12" || e.key === "F11" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
      (e.ctrlKey && e.key === "U");
    if (isBlockedKey) { e.preventDefault(); e.stopPropagation(); }
  });

  return (
    <Box sx={{ minHeight: "calc(100vh - 150px)", overflowY: "auto", backgroundColor: "transparent", mt: 1, p: { xs: 1, sm: 2 } }}>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", flexWrap: "wrap", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: titleColor, fontSize: { xs: "22px", sm: "28px", md: "36px" } }}>
          SECURITY SETTINGS
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      {/* ── Form card — full width on mobile, 40% on desktop ── */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Paper elevation={6} sx={{
          p: { xs: 2, sm: 3 },
          width: { xs: "100%", sm: "80%", md: "60%", lg: "40%" },
          maxWidth: "540px",
          borderRadius: 4,
          backgroundColor: "#fff",
          border: `1px solid ${borderColor}`,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
          mb: 6,
        }}>

          {/* Icon + title */}
          <Box textAlign="center" mb={2}>
            <Settings sx={{
              fontSize: { xs: 60, sm: 80 }, color: "#000000",
              backgroundColor: "#f0f0f0", borderRadius: "50%", p: 1,
            }} />
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 1, color: subtitleColor, fontSize: { xs: "18px", sm: "22px" } }}>
              SETTINGS
            </Typography>
            <Typography fontSize={13} color="text.secondary">
              Update your password to keep your account secure.
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* OTP Toggle */}
          <Box mt={2} mb={1} display="flex" flexDirection="column" alignItems="center">
            <InputLabel sx={{ color: "red", mb: 1, textAlign: "center", fontSize: { xs: 11, sm: 13 } }}>
              Turning this off may compromise your account, especially if
              your login is saved on another device.
            </InputLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={otpRequired}
                  onChange={handleOtpToggle}
                  sx={{
                    height: 50, width: 90,
                    "& .MuiSwitch-switchBase": {
                      top: 3, left: 3, padding: 0, color: "black",
                      "&.Mui-checked": { transform: "translateX(40px)", color: "black" },
                    },
                    "& .MuiSwitch-thumb": { width: 44, height: 44 },
                    "& .MuiSwitch-track": { borderRadius: 10 },
                  }}
                />
              }
              label="Require OTP during login"
              sx={{ m: 0 }}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Password form */}
          <form onSubmit={handleUpdate}>
            {[
              { key: "current", label: "Current Password", value: currentPassword, onChange: setCurrentPassword },
              { key: "new", label: "New Password", value: newPassword, onChange: setNewPassword },
              { key: "confirm", label: "Confirm Password", value: confirmPassword, onChange: setConfirmPassword },
            ].map(({ key, label, value, onChange }) => (
              <Box mb={2} key={key}>
                <Typography variant="subtitle2">{label}</Typography>
                <TextField
                  fullWidth size="small" variant="outlined"
                  type={showPassword[key] ? "text" : "password"}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  error={key === "confirm" && Boolean(confirmPassword && confirmPassword !== newPassword)}
                  helperText={key === "confirm" && confirmPassword && confirmPassword !== newPassword ? "Passwords do not match" : ""}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleShowPassword(key)} edge="end">
                          {showPassword[key] ? <Visibility /> : <VisibilityOff />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            ))}

            {/* Password rules */}
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              Your new password must include:
            </Typography>
            <List dense disablePadding>
              {passwordRules.map((rule, i) => (
                <ListItem key={i} sx={{ py: 0.2 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {validations[i]
                      ? <CheckCircle sx={{ color: "green", fontSize: 18 }} />
                      : <Cancel sx={{ color: "red", fontSize: 18 }} />}
                  </ListItemIcon>
                  <ListItemText primary={rule.label} primaryTypographyProps={{ fontSize: 12 }} />
                </ListItem>
              ))}
            </List>

            <Typography variant="body2" color="warning.main" sx={{ mt: 1, mb: 2, fontSize: { xs: 11, sm: 13 } }}>
              Note: You are required to change your password to continue using the system securely.
            </Typography>

            <Button type="submit" fullWidth variant="contained" disabled={!isValid} sx={{
              py: 1.2, borderRadius: 2,
              backgroundColor: mainButtonColor,
              border: `1px solid ${borderColor}`,
              textTransform: "none", fontWeight: "bold",
              "&:hover": { backgroundColor: "#1565c0" },
            }}>
              Update Password
            </Button>
          </form>
        </Paper>
      </Box>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={snack.severity}
          onClose={() => setSnack((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentResetPassword;
