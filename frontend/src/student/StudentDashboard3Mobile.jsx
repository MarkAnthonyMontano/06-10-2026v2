import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingsContext } from "../App";
import API_BASE_URL from "../apiConfig";
import {
  Button,
  Box,
  TextField,
  Container,
  Typography,
  Card,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  FormControlLabel,
  Checkbox,
  IconButton,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import SchoolIcon from "@mui/icons-material/School";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import InfoIcon from "@mui/icons-material/Info";
import ErrorIcon from "@mui/icons-material/Error";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { motion } from "framer-motion";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Snackbar, Alert } from "@mui/material";

// ─── Style tokens (same system as Dashboard1/2 Mobile) ───────────────────────
const S = {
  screen: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    fontFamily: "'Segoe UI', sans-serif",
    paddingBottom: 80,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backgroundColor: "#6D2323",
    color: "#fff",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
  },
  headerTitle: { fontSize: 16, fontWeight: 700, flex: 1, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, opacity: 0.8 },
  stepperWrap: {
    backgroundColor: "#fff",
    padding: "12px 8px",
    borderBottom: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    overflowX: "auto",
    gap: 0,
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 56,
    cursor: "pointer",
  },
  stepCircle: (active) => ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: active ? "#6D2323" : "#E8C999",
    color: active ? "#fff" : "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    border: active ? "2px solid #6D2323" : "2px solid #ccc",
    transition: "all 0.2s",
  }),
  stepLabel: (active) => ({
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
    color: active ? "#6D2323" : "#666",
    fontWeight: active ? 700 : 400,
    lineHeight: 1.2,
    maxWidth: 52,
  }),
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#6D2323",
    alignSelf: "center",
    minWidth: 8,
    marginBottom: 18,
  },
  notice: {
    backgroundColor: "#fffaf5",
    border: "1px solid #6D2323",
    borderRadius: 8,
    margin: "12px 12px 0",
    padding: "10px 12px",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  noticeIcon: {
    backgroundColor: "#800000",
    borderRadius: 6,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 18,
  },
  noticeText: { fontSize: 12, color: "#3e3e3e", lineHeight: 1.5 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: "12px 12px 0",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  cardHeader: {

    color: "#fff",
    padding: "10px 14px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  cardBody: { padding: "14px 14px" },
  fieldWrap: { marginBottom: 14 },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#444",
    marginBottom: 5,
  },
  required: { color: "#d32f2f" },
  input: (hasError) => ({
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: `1px solid ${hasError ? "#d32f2f" : "#ccc"}`,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    boxSizing: "border-box",
    outline: "none",
    color: "#222",
  }),
  select: (hasError) => ({
    width: "100%",
    height: 42,
    padding: "0 12px",
    border: `1px solid ${hasError ? "#d32f2f" : "#ccc"}`,
    borderRadius: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    boxSizing: "border-box",
    outline: "none",
    color: "#222",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23666' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
  }),
  helperError: { color: "#d32f2f", fontSize: 11, marginTop: 3 },
  row: { display: "flex", gap: 10 },
  flex1: { flex: 1 },
  divider: {
    border: "none",
    borderTop: "1px solid #e0e0e0",
    margin: "14px 0 10px",
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#6D2323",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bottomBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTop: "1px solid #e0e0e0",
    padding: "10px 14px",
    display: "flex",
    gap: 10,
    zIndex: 200,
  },
  btnPrimary: {
    flex: 1,
    height: 46,
    backgroundColor: "#6D2323",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  btnSecondary: {
    flex: 1,
    height: 46,
    backgroundColor: "#fff",
    color: "#6D2323",
    border: "2px solid #6D2323",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  toast: (severity) => ({
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 9999,
    backgroundColor:
      severity === "success" ? "#2e7d32" : severity === "error" ? "#c62828" : "#e65100",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 24,
    fontSize: 13,
    boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
    maxWidth: "90vw",
    textAlign: "center",
  }),
};

const steps = [
  { label: "Personal Information", icon: <PersonIcon /> },
  { label: "Family Background", icon: <FamilyRestroomIcon /> },
  { label: "Educational Attainment", icon: <SchoolIcon /> },
  { label: "Health Medical Records", icon: <HealthAndSafetyIcon /> },
  { label: "Other Information", icon: <InfoIcon /> },
];
const STEP_PATHS = [
  "/student_dashboard1", "/student_dashboard2", "/student_dashboard3",
  "/student_dashboard4", "/student_dashboard5",
];


const handleNext = () => {
  handleUpdate(person);
  if (isFormValid()) {
    showSnackbar("Your record has been saved successfully!", "success");
    setTimeout(() => navigate("/student_dashboard2"), 1000);
  } else {
    showSnackbar("Please fill all required fields before proceeding.", "error");
  }
};


// ─── Reusable field components ────────────────────────────────────────────────
const Field = ({ label, required, error, helperText, children }) => (
  <div style={S.fieldWrap}>
    {label && (
      <label style={S.label}>
        {label}{required && <span style={S.required}> *</span>}
      </label>
    )}
    {children}
    {error && helperText && <div style={S.helperError}>{helperText}</div>}
  </div>
);

const MInput = ({ error, style, ...props }) => (
  <input style={{ ...S.input(error), ...style }} {...props} />
);

const MSelect = ({ error, style, children, ...props }) => (
  <select style={{ ...S.select(error), ...style }} {...props}>
    {children}
  </select>
);

// ─── School record block (reused for JHS and SHS) ────────────────────────────
const SchoolBlock = ({ suffix = "", labels = {}, person, errors, handleChange }) => {
  const f = (n) => `${n}${suffix}`;
  return (
    <>
      <Field label={labels.level || "Educational Attainment"} required error={errors[f("schoolLevel")]} helperText="Required">
        <MSelect name={f("schoolLevel")} value={person[f("schoolLevel")] || ""} onChange={handleChange} error={errors[f("schoolLevel")]}>
          <option value="">Select Level</option>
          {suffix === ""
            ? [<option key="hs" value="High School/Junior High School">High School / Junior High School</option>, <option key="als" value="ALS">ALS</option>]
            : [
              <option key="shs" value="Senior High School">Senior High School</option>,
              <option key="ug" value="Undergraduate">Undergraduate</option>,
              <option key="g" value="Graduate">Graduate</option>,
              <option key="als" value="ALS">ALS</option>,
              <option key="voc" value="Vocational/Trade Course">Vocational / Trade Course</option>,
            ]
          }
        </MSelect>
      </Field>

      <Field label="School Last Attended" required error={errors[f("schoolLastAttended")]} helperText="Required">
        <MInput name={f("schoolLastAttended")} value={person[f("schoolLastAttended")] || ""} onChange={handleChange} error={errors[f("schoolLastAttended")]} placeholder="Enter your School Name" />
      </Field>

      <Field label="School Full Address" required error={errors[f("schoolAddress")]} helperText="Required">
        <MInput name={f("schoolAddress")} value={person[f("schoolAddress")] || ""} onChange={handleChange} error={errors[f("schoolAddress")]} placeholder="Enter your School Address" />
      </Field>

      <Field label="Course / Program">
        <MInput name={f("courseProgram")} value={person[f("courseProgram")] || ""} onChange={handleChange} placeholder="Enter your Course Program" />
      </Field>

      <div style={S.row}>
        <div style={S.flex1}>
          <Field label="Recognition / Awards" required error={errors[f("honor")]} helperText="Required">
            <MInput name={f("honor")} value={person[f("honor")] || ""} onChange={handleChange} error={errors[f("honor")]} placeholder="Enter your Recognition / Awards" />
          </Field>
        </div>
        <div style={{ width: 90 }}>
          <Field label="Gen. Average" required error={errors[f("generalAverage")]} helperText="Required">
            <MInput name={f("generalAverage")} value={person[f("generalAverage")] || ""} onChange={handleChange} error={errors[f("generalAverage")]} placeholder="Enter your General Average" />
          </Field>
        </div>
        <div style={{ width: 80 }}>
          <Field label="Year Grad." required error={errors[f("yearGraduated")]} helperText="Required">
            <MInput type="number" name={f("yearGraduated")} value={person[f("yearGraduated")] || ""} onChange={handleChange} error={errors[f("yearGraduated")]} placeholder="Enter your Year Graduated" />
          </Field>
        </div>
      </div>
    </>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const StudentDashboard3Mobile = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [subtitleColor, setSubtitleColor] = useState("#555555");
  const [borderColor, setBorderColor] = useState("#000000");
  const [mainButtonColor, setMainButtonColor] = useState("#1976d2");
  const [subButtonColor, setSubButtonColor] = useState("#ffffff");   // ✅ NEW
  const [stepperColor, setStepperColor] = useState("#000000");       // ✅ NEW

  const [fetchedLogo, setFetchedLogo] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [campusAddress, setCampusAddress] = useState("");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!settings) return;

    // 🎨 Colors
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.subtitle_color) setSubtitleColor(settings.subtitle_color);
    if (settings.border_color) setBorderColor(settings.border_color);
    if (settings.main_button_color) setMainButtonColor(settings.main_button_color);
    if (settings.sub_button_color) setSubButtonColor(settings.sub_button_color);
    if (settings.stepper_color) setStepperColor(settings.stepper_color);

    // 🏫 Logo
    if (settings.logo_url) {
      setFetchedLogo(`${API_BASE_URL}${settings.logo_url}`);
    } else {
      setFetchedLogo(EaristLogo);
    }

    // 🏷️ School Info
    if (settings.company_name) setCompanyName(settings.company_name);
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.campus_address) setCampusAddress(settings.campus_address);

    // ✅ Branches (JSON stored in DB)
    if (settings.branches) {
      setBranches(
        typeof settings.branches === "string"
          ? JSON.parse(settings.branches)
          : settings.branches
      );
    }

  }, [settings]);

  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "warning" });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((p) => ({ ...p, open: false }));
  };
  const [errors, setErrors] = useState({});

  const [person, setPerson] = useState({
    applyingAs: "",
    schoolLevel: "", schoolLastAttended: "", schoolAddress: "",
    courseProgram: "", honor: "", generalAverage: "", yearGraduated: "",
    schoolLevel1: "", schoolLastAttended1: "", schoolAddress1: "",
    courseProgram1: "", honor1: "", generalAverage1: "", yearGraduated1: "",
    strand: "",
  });

  const docLinks = [
    { label: "ECAT Application Form", to: "/student_ecat_application_form" },
    { label: "Admission Form Process", to: "/student_form_process" },
    { label: "Personal Data Form", to: "/student_personal_data_form" },
    { label: `Application For ${shortTerm?.toUpperCase() || ""} Admission`, to: "/student_office_of_the_registrar" },
    { label: "Admission Services", to: "/student_admission_services" },
  ];

  const [activeStep, setActiveStep] = useState(2);

  // handleStepClick:
  const handleStepClick = (index) => {
    if (isFormValid()) {
      showSnackbar("Your record has been saved successfully!", "success");
      setTimeout(() => { setActiveStep(index); navigate(STEP_PATHS[index]); }, 1000);
    } else {
      showSnackbar("Please fill all required fields before proceeding.", "error");
    }
  };

  const showSnackbar = (message, severity = "warning") => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar((p) => ({ ...p, open: false })), 3000);
  };

  // Settings
  useEffect(() => {
    if (!settings) return;
    if (settings.short_term) setShortTerm(settings.short_term);
    if (settings.company_name) setCompanyName(settings.company_name);
  }, [settings]);

  // Auth + load person
  useEffect(() => {
    const loggedInPersonId = localStorage.getItem("person_id");
    if (!loggedInPersonId) { window.location.href = "/login"; return; }
    const queryParams = new URLSearchParams(location.search);
    const queryPersonId = queryParams.get("person_id");
    setUserID(queryPersonId || loggedInPersonId);
  }, [location.search]);

  useEffect(() => {
    if (!userID) return;
    axios.get(`${API_BASE_URL}/api/student_data_as_applicant/${userID}`)
      .then((res) => { if (res.data) setPerson(res.data); })
      .catch(console.error);
  }, [userID]);

  const handleUpdate = async (updated) => {
    try {
      const { person_id, created_at, current_step, ...clean } = updated;
      await axios.put(`${API_BASE_URL}/api/enrollment/person/${userID}`, clean);
    } catch (err) { console.error("Auto-save failed:", err); }
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const updated = { ...person, [name]: type === "checkbox" ? (checked ? 1 : 0) : value };
    setPerson(updated);
    handleUpdate(updated);
  };

  // applyingAs 1–4 requires SHS section
  const requiresSeniorHigh = [1, 2, 3, 4].includes(Number(person.applyingAs));

  const isFormValid = () => {
    const required = ["schoolLevel", "schoolLastAttended", "schoolAddress", "honor", "generalAverage", "yearGraduated"];
    if (requiresSeniorHigh) {
      required.push("schoolLevel1", "schoolLastAttended1", "schoolAddress1", "honor1", "generalAverage1", "yearGraduated1", "strand");
    }
    const newErrors = {};
    required.forEach((f) => { if (!person[f]?.toString().trim()) newErrors[f] = true; });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.screen}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={1000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", mb: 1, padding: 1, }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: titleColor,

            fontSize: { xs: "22px", sm: "28px", md: "36px" },
          }}
        >
          EDUCATIONAL ATTAINMENT
        </Typography>
      </Box>
      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      {/* Stepper */}



      {/* Notice */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          mx: "12px",
          mt: "12px",
          p: "10px 12px",
          borderRadius: "8px",
          backgroundColor: "#fffaf5",
          border: "1px solid #6D2323",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#800000",
            borderRadius: "6px",
            width: 36,
            height: 36,
            flexShrink: 0,
          }}
        >
          <ErrorIcon sx={{ color: "white", fontSize: 22 }} />
        </Box>

        {/* Text */}
        <Typography sx={{ fontSize: 12, color: "#3e3e3e", lineHeight: 1.6 }}>
          <strong style={{ color: "maroon" }}>Notice:</strong>{" "}
          <span style={{ fontSize: "1.1em", margin: "0 6px" }}>➔</span>
          Please indicate "NA" or "N/A" in fields where the requested information is not applicable or no response can be provided.
          <br />
          <span style={{ marginLeft: 16, fontSize: "1.1em", marginRight: 6 }}>➔</span>
          To enter the letter "Ñ", press and hold the ALT key while typing "165". For "ñ", press and hold the ALT key while typing "164".
        </Typography>
      </Box>

      <Box sx={{ px: "12px", pt: "12px" }}>
        <Typography sx={{
          fontSize: "30px",
          fontWeight: "bold",
          textAlign: "center",
          color: "black",
          marginTop: "25px",
          mb: 2
        }}>
          PRINTABLE DOCUMENTS
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
          {docLinks.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              style={{ width: "calc(50% - 4px)" }}
            >
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.75,
                  px: 1.5,
                  py: 1.25,
                  height: 52,
                  width: "100%",
                  borderRadius: "12px",
                  border: `1px solid ${borderColor || "#6D2323"}`,
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  transition: "all 0.25s ease-in-out",
                  "&:hover": {
                    backgroundColor: settings?.header_color || "#6D2323",
                    "& .chip-icon": { color: "#fff" },
                    "& .chip-text": { color: "#fff" },
                  },
                }}
                onClick={() => navigate(d.to)}
              >
                <PictureAsPdfIcon
                  className="chip-icon"
                  sx={{ fontSize: 18, color: mainButtonColor || "#6D2323", flexShrink: 0 }}
                />
                <Typography
                  className="chip-text"
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: mainButtonColor || "#6D2323",
                    fontFamily: "Poppins, sans-serif",
                    whiteSpace: "normal",
                    lineHeight: 1.3,
                    textAlign: "center",
                  }}
                >
                  {d.label}
                </Typography>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Applicant Form Intro */}
      <div style={{ padding: "16px 14px 0", textAlign: "center" }}>
        <Container>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              textAlign: "center",
              color: subtitleColor,
              marginTop: "25px",
            }}
          >
            STUDENT FORM
          </h1>

          <div style={{ textAlign: "center" }}>
            Please update your personal information to keep your student records
            accurate and up to date for the upcoming academic year at{" "}
            {shortTerm ? (
              <>
                <strong>{shortTerm.toUpperCase()}</strong> <br />
                {companyName || ""}
              </>
            ) : (
              companyName || ""
            )}
            .
          </div>
        </Container>
      </div>

      <Box sx={{ display: "flex", justifyContent: "center", width: "100%", px: 2, py: 1.5, borderBottom: "1px solid #e0e0e0" }}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <Box
              sx={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
              onClick={() => handleStepClick(index)}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  border: `2px solid ${borderColor}`,
                  backgroundColor: activeStep === index ? (settings?.header_color || "#6D2323") : "#E8C999",
                  color: activeStep === index ? "#fff" : "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  transition: "all 0.2s",
                }}
              >
                {step.icon}
              </Box>
              <Typography
                sx={{
                  mt: 0.75,
                  color: activeStep === index ? "#6D2323" : "#555",
                  fontWeight: activeStep === index ? 700 : 400,
                  fontSize: { xs: 10, sm: 12 },
                  textAlign: "center",
                  maxWidth: 72,
                  lineHeight: 1.3,
                }}
              >
                {step.label}
              </Typography>
            </Box>

            {index < steps.length - 1 && (
              <Box
                sx={{
                  height: "2px",
                  backgroundColor: mainButtonColor,
                  flex: 1,
                  alignSelf: "center",
                  mx: 1,
                  mb: 3,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* ── Junior High School ────────────────────────────────────────── */}
      <div style={{ ...S.card, border: `1px solid ${borderColor}`, }}>
        <div style={{
          ...S.cardHeader,
          backgroundColor: settings?.header_color || "#1976d2",
        }}> Junior High School Background</div>
        <div style={S.cardBody}>

          <SchoolBlock
            suffix=""
            labels={{ level: "Educational Attainment (JHS)" }}
            person={person}
            errors={errors}
            handleChange={handleChange}
          />
        </div>
      </div>

      {/* ── Senior High School ────────────────────────────────────────── */}
      <div style={{ ...S.card, border: `1px solid ${borderColor}`, }}>
        <div style={{
          ...S.cardHeader,
          backgroundColor: settings?.header_color || "#1976d2",
        }}> Senior High School Background</div>
        <div style={S.cardBody}>
          {!requiresSeniorHigh && (
            <div style={{ backgroundColor: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#2E7D32", marginBottom: 12 }}>
              Senior High fields are optional based on your selected "Applying As" category. Fill in if applicable.
            </div>
          )}
          <SchoolBlock
            suffix="1"
            labels={{ level: "Educational Attainment (SHS)" }}
            person={person}
            errors={errors}
            handleChange={handleChange}
          />

        
        </div>


      </div>


      <div style={{ ...S.card, border: `1px solid ${borderColor}`, }}>
        <div
          style={{
            ...S.cardHeader,
            backgroundColor: settings?.header_color || "#1976d2",
          }}
        >
          Senior High School Strand
        </div>

        <div style={S.cardBody}>
          <div style={S.sectionLabel}> Strand (For Senior High School)</div>
          <Field
            label="SHS Strand"
            required={requiresSeniorHigh}
            error={errors.strand}
            helperText="This field is required."
          >
            <MSelect
              name="strand"
              value={person.strand || ""}
              onChange={handleChange}
              error={errors.strand}
            >
              <option value="">Select Strand</option>
              <option value="Accountancy, Business and Management (ABM)">
                Accountancy, Business and Management (ABM)
              </option>
              <option value="Humanities and Social Sciences (HUMSS)">
                Humanities and Social Sciences (HUMSS)
              </option>
              <option value="Science, Technology, Engineering, and Mathematics (STEM)">
                Science, Technology, Engineering, and Mathematics (STEM)
              </option>
              <option value="General Academic (GAS)">
                General Academic (GAS)
              </option>
              <option value="Home Economics (HE)">Home Economics (HE)</option>
              <option value="Information and Communications Technology (ICT)">
                Information and Communications Technology (ICT)
              </option>
              <option value="Agri-Fishery Arts (AFA)">
                Agri-Fishery Arts (AFA)
              </option>
              <option value="Industrial Arts (IA)">Industrial Arts (IA)</option>
              <option value="Sports Track">Sports Track</option>
              <option value="Design and Arts Track">Design and Arts Track</option>
            </MSelect>
          </Field>
        </div>

        <Box
          display="flex"
          justifyContent="space-between"
          mx="12px"
          mb={3}
          mt={2}
        >
          <Button
            variant="contained"
            onClick={() => {
              handleUpdate(person);
              showSnackbar("Your record has been saved successfully!", "success");
              setTimeout(() => navigate(`/dashboard/${keys.step2}`), 1000);
            }}
            startIcon={
              <ArrowBackIcon sx={{ color: "#000", transition: "color 0.3s" }} />
            }
            sx={{
              backgroundColor: subButtonColor,
              border: `1px solid ${borderColor}`,
              color: "#000",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#000",
                color: "#fff",
                "& .MuiSvgIcon-root": { color: "#fff" },
              },
            }}
          >
            Previous Step
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              handleUpdate(person);
              if (isFormValid()) {
                showSnackbar("Your record has been saved successfully!", "success");
                setTimeout(() => navigate(`/dashboard/${keys.step4}`), 1000);
              } else {
                showSnackbar(
                  "Please complete all required fields before proceeding.",
                  "error"
                );
              }
            }}
            endIcon={
              <ArrowForwardIcon sx={{ color: "#fff", transition: "color 0.3s" }} />
            }
            sx={{
              backgroundColor: mainButtonColor,
              border: `1px solid ${borderColor}`,
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#000",
                color: "#fff",
                "& .MuiSvgIcon-root": { color: "#fff" },
              },
            }}
          >
            Next Step
          </Button>
        </Box>
      </div>
      {/* Bottom Nav */}

    </div>
  );
};

export default StudentDashboard3Mobile;
