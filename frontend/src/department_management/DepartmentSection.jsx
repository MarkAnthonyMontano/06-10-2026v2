import React, { useState, useEffect, useContext } from "react";
import { SettingsContext } from "../App";
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Switch,
} from '@mui/material';
import Autocomplete from "@mui/material/Autocomplete";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import Unauthorized from "../components/Unauthorized";
import LoadingOverlay from "../components/LoadingOverlay";
import API_BASE_URL from "../apiConfig";
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";

const DepartmentSection = () => {
  const settings = useContext(SettingsContext);

  const [titleColor, setTitleColor] = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");

  useEffect(() => {
    if (!settings) return;
    if (settings.title_color) setTitleColor(settings.title_color);
    if (settings.border_color) setBorderColor(settings.border_color);
  }, [settings]);

  const [dprtmntSection, setDprtmntSection] = useState({
    curriculum_id: '',
    section_id: '',
  });

  const [curriculumList, setCurriculumList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [departmentSections, setDepartmentSections] = useState([]);

  const [userID, setUserID] = useState("");
  const [user, setUser] = useState("");
  const [userRole, setUserRole] = useState("");
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [employeeID, setEmployeeID] = useState("");

  const [deptSearchQuery, setDeptSearchQuery] = useState("");
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const pageId = 20;

  const getPermissionHeaders = () => ({
    "x-employee-id": employeeID || localStorage.getItem("employee_id") || "",
    "x-page-id": pageId,
    "x-audit-actor-id": employeeID || localStorage.getItem("employee_id") || "",
    "x-audit-actor-role": userRole || localStorage.getItem("role") || "registrar",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("email");
    const storedRole = localStorage.getItem("role");
    const storedID = localStorage.getItem("person_id");
    const storedEmployeeID = localStorage.getItem("employee_id");

    if (storedUser && storedRole && storedID) {
      setUser(storedUser);
      setUserRole(storedRole);
      setUserID(storedID);
      setEmployeeID(storedEmployeeID);
      if (storedRole === "registrar") {
        checkAccess(storedEmployeeID);
      } else {
        window.location.href = "/login";
      }
    } else {
      window.location.href = "/login";
    }
  }, []);

  const checkAccess = async (employeeID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/page_access/${employeeID}/${pageId}`);
      if (response.data && Number(response.data.page_privilege) === 1) {
        setHasAccess(true);
        setCanCreate(Number(response.data?.can_create) === 1);
        setCanEdit(Number(response.data?.can_edit) === 1);
        setCanDelete(Number(response.data?.can_delete) === 1);
      } else {
        setHasAccess(false);
        setCanCreate(false);
        setCanEdit(false);
        setCanDelete(false);
      }
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
      setCanCreate(false);
      setCanEdit(false);
      setCanDelete(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
    fetchSections();
    fetchDepartmentSections();
  }, []);

  const fetchCurriculum = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/get_active_curriculum`);
      setCurriculumList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/section_table`);
      setSectionsList(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartmentSections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/department_section`);
      setDepartmentSections(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatSchoolYear = (yearDesc) => {
    if (!yearDesc) return "";
    const startYear = Number(yearDesc);
    if (isNaN(startYear)) return yearDesc;
    return `${startYear} - ${startYear + 1}`;
  };

  const uniqueCurriculumList = curriculumList
    .filter((curriculum, index, list) => {
      const key = String(curriculum.curriculum_id);
      return index === list.findIndex((item) => String(item.curriculum_id) === key);
    })
    .sort((a, b) => Number(a.year_description) - Number(b.year_description)); // ← add this
    
  // Group department sections by curriculum_id
  const groupedSections = departmentSections.reduce((acc, ds) => {
    const key = ds.curriculum_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ds);
    return acc;
  }, {});

  // Filter grouped sections by search query
  const filteredGrouped = Object.entries(groupedSections).reduce((acc, [currId, sections]) => {
    const curriculum = uniqueCurriculumList.find(c => String(c.curriculum_id) === String(currId));
    if (!curriculum) return acc;

    const programLabel = `${formatSchoolYear(curriculum.year_description)} ${curriculum.program_code} ${curriculum.program_description} ${curriculum.major || ""}`.toLowerCase();

    const matchedSections = sections.filter(ds => {
      const sectionDesc = (ds.section_description || "").toLowerCase();
      const status = ds.dsstat === 1 ? "active" : "inactive";
      return (
        programLabel.includes(deptSearchQuery.toLowerCase()) ||
        sectionDesc.includes(deptSearchQuery.toLowerCase()) ||
        status.includes(deptSearchQuery.toLowerCase())
      );
    });

    if (matchedSections.length > 0) {
      acc[currId] = matchedSections;
    }
    return acc;
  }, {});

  const handleAddDepartmentSection = async () => {
    const { curriculum_id, section_id } = dprtmntSection;
    if (!curriculum_id || !section_id) {
      setSnackbar({ open: true, message: "Please select both curriculum and section.", severity: "error" });
      return false;
    }

    if (editId && !canEdit) {
      setSnackbar({ open: true, message: "You do not have permission to edit items on this page.", severity: "error" });
      return false;
    }

    if (!editId && !canCreate) {
      setSnackbar({ open: true, message: "You do not have permission to create items on this page.", severity: "error" });
      return false;
    }

    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/department_section/${editId}`, dprtmntSection, {
          headers: getPermissionHeaders(),
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/department_section`, dprtmntSection, {
          headers: getPermissionHeaders(),
        });
      }
      setDprtmntSection({ curriculum_id: '', section_id: '' });
      setEditId(null);
      fetchDepartmentSections();
      setSnackbar({
        open: true,
        message: editId ? "Department section updated successfully!" : "Department section added successfully!",
        severity: "success",
      });
      return true;
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to add department section.",
        severity: "error",
      });
      return false;
    }
  };

  const openEditDepartmentSection = (section) => {
    if (!canEdit) return;
    setEditId(section.department_section_id);
    setDprtmntSection({
      curriculum_id: section.curriculum_id || "",
      section_id: section.section_id || "",
    });
    setOpenFormDialog(true);
  };

  const handleDeleteDepartmentSection = async () => {
    if (!deleteTarget) return;
    if (!canDelete) {
      setSnackbar({ open: true, message: "You do not have permission to delete items on this page.", severity: "error" });
      return;
    }
    try {
      // Current (missing headers — will fail CanDelete middleware)
      await axios.delete(`${API_BASE_URL}/api/department_section/${deleteTarget.department_section_id}`, {
        headers: getPermissionHeaders(),  // ✅ this IS there — so that's fine
      });
      setDeleteTarget(null);
      fetchDepartmentSections();
      setSnackbar({ open: true, message: "Department section deleted successfully!", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to delete department section.",
        severity: "error",
      });
    }
  };

  const handleToggleStatus = async (departmentSectionId, value) => {
    if (value === null) return;
    if (!canEdit) {
      setSnackbar({ open: true, message: "You do not have permission to edit items on this page.", severity: "error" });
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/api/department_section/${departmentSectionId}/status`,
        { dsstat: value },
        { headers: getPermissionHeaders() }
      );
      fetchDepartmentSections();
      setSnackbar({
        open: true,
        message: `Department section ${value === 1 ? "activated" : "deactivated"} successfully!`,
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || "Failed to update status.",
        severity: "error",
      });
    }
  };

  if (loading || hasAccess === null) {
    return <LoadingOverlay open={loading} message="Loading..." />;
  }

  if (!hasAccess) {
    return <Unauthorized />;
  }

  return (
    <Box sx={{ height: "calc(100vh - 150px)", overflowY: "auto", paddingRight: 1, backgroundColor: "transparent", mt: 1, padding: 2 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: titleColor, fontSize: '36px' }}>
          DEPARTMENT SECTION PANEL
        </Typography>
        <TextField
          variant="outlined"
          placeholder="Search Year / Program Code / Description / Section"
          size="small"
          value={deptSearchQuery}
          onChange={(e) => setDeptSearchQuery(e.target.value)}
          sx={{
            width: 450,
            backgroundColor: "#fff",
            borderRadius: 1,
            "& .MuiOutlinedInput-root": { borderRadius: "10px" },
          }}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: "gray" }} /> }}
        />
      </Box>

      <hr style={{ border: "1px solid #ccc", width: "100%" }} />
      <br />

      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography fontSize="14px" color="text.secondary">
          Total Programs: {Object.keys(filteredGrouped).length} &nbsp;|&nbsp; Total Sections: {departmentSections.length}
        </Typography>
        {canCreate && (
          <Button
            variant="contained"
            onClick={() => {
              setEditId(null);
              setDprtmntSection({ curriculum_id: '', section_id: '' });
              setOpenFormDialog(true);
            }}
            sx={{
              backgroundColor: "#1976d2",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "8px",
              textTransform: "none",
              px: 3,
              '&:hover': { backgroundColor: "#1565c0" }
            }}
          >
            + Add Department Section
          </Button>
        )}
      </Box>

      {/* Cards Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 2,
        }}
      >
        {Object.entries(filteredGrouped).map(([currId, sections]) => {
          const curriculum = uniqueCurriculumList.find(c => String(c.curriculum_id) === String(currId));
          if (!curriculum) return null;

          return (
            <Box
              key={currId}
              sx={{
                border: `1px solid ${borderColor}`,
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              {/* Card Header */}
              <Box sx={{ backgroundColor: settings?.header_color || "#1976d2", px: 2, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      px: 1,
                      py: 0.3,
                      borderRadius: '20px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {curriculum.program_code}
                  </Box>
                  <Typography fontSize="13px" fontWeight="bold" color="#fff" sx={{ lineHeight: 1.3 }}>
                    {curriculum.program_description}
                  </Typography>
                </Box>
                {curriculum.major && (
                  <Typography fontSize="11px" color="rgba(255,255,255,0.8)" mt={0.3}>
                    {curriculum.major}
                  </Typography>
                )}
                <Typography fontSize="11px" color="rgba(255,255,255,0.7)" mt={0.3}>
                  {formatSchoolYear(curriculum.year_description)} &nbsp;·&nbsp; {sections.length} section{sections.length !== 1 ? 's' : ''}
                </Typography>
              </Box>

              {/* Sections List */}
              <Box>
                {sections.length === 0 ? (
                  <Typography fontSize="12px" color="text.secondary" sx={{ px: 2, py: 1.5, fontStyle: 'italic' }}>
                    No sections assigned
                  </Typography>
                ) : (
                  sections.map((ds, idx) => (
                    <Box
                      key={ds.department_section_id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 0.8,
                        borderTop: idx === 0 ? 'none' : `1px solid ${borderColor}`,
                        gap: 1,

                        // Alternate row colors
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : 'lightgray',
                      }}
                    >
                      {/* Section name */}
                      <Typography fontSize="13px" fontWeight="500" sx={{ flex: 1 }}>
                        {ds.section_description}
                      </Typography>

                      {/* Status toggle */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Switch
                          size="small"
                          checked={Number(ds.dsstat) === 1}
                          onChange={(e) => handleToggleStatus(ds.department_section_id, e.target.checked ? 1 : 0)}
                          disabled={!canEdit}
                        />
                        <Typography
                          fontSize="11px"
                          sx={{
                            minWidth: 44,
                            color: Number(ds.dsstat) === 1 ? 'success.main' : 'text.disabled',
                          }}
                        >
                          {Number(ds.dsstat) === 1 ? 'Active' : 'Inactive'}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {canEdit && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => openEditDepartmentSection(ds)}
                            sx={{
                              backgroundColor: "green",
                              color: "white",
                              minWidth: 0,
                              width: "75px",
                              px: 1,
                              py: 0.4,
                              fontSize: '11px',
                              textTransform: 'none',

                            }}
                          >
                            <EditIcon sx={{ fontSize: 13, mr: 0.4 }} /> Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => setDeleteTarget(ds)}
                            sx={{
                              backgroundColor: "#9E0000",
                              color: "white",
                              minWidth: 0,
                              px: 1,
                              py: 0.4,
                              width: "75px",
                              fontSize: '11px',
                              textTransform: 'none',

                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 13, mr: 0.4 }} /> Delete
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {Object.keys(filteredGrouped).length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Typography fontSize="16px">No department sections found.</Typography>
        </Box>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={openFormDialog}
        onClose={() => { setOpenFormDialog(false); setEditId(null); setDprtmntSection({ curriculum_id: '', section_id: '' }); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", boxShadow: 6 } }}
      >
        <DialogTitle sx={{ background: settings?.header_color || "#1976d2", color: "#fff", fontWeight: 700, fontSize: "1.1rem", py: 2 }}>
          {editId ? "Edit Department Section" : "Add Department Section"}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Typography fontWeight="bold" mb={1} mt={2}>Curriculum</Typography>
          <Autocomplete
            options={uniqueCurriculumList}
            fullWidth
            getOptionLabel={(option) =>
              `${formatSchoolYear(option.year_description)}: (${option.program_code}) ${option.program_description} ${option.major || ""}`
            }
            value={uniqueCurriculumList.find(c => String(c.curriculum_id) === String(dprtmntSection.curriculum_id)) || null}
            onChange={(e, newValue) => {
              setDprtmntSection(prev => ({ ...prev, curriculum_id: newValue ? newValue.curriculum_id : "" }));
            }}
            isOptionEqualToValue={(option, value) => option.curriculum_id === value.curriculum_id}
            renderInput={(params) => <TextField {...params} label="Curriculum" sx={{ mb: 2 }} />}
          />

          <Typography fontWeight="bold" mb={1}>Section</Typography>
          <Autocomplete
            options={sectionsList}
            fullWidth
            getOptionLabel={(option) => option.description || ""}
            value={sectionsList.find(s => s.id === dprtmntSection.section_id) || null}
            onChange={(e, newValue) => {
              setDprtmntSection(prev => ({ ...prev, section_id: newValue ? newValue.id : "" }));
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <TextField {...params} label="Section" />}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button color="error" variant="outlined" sx={{ textTransform: "none", fontWeight: 600 }}
            onClick={() => { setOpenFormDialog(false); setEditId(null); }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ px: 4, fontWeight: 600, textTransform: "none" }}
            onClick={async () => { const saved = await handleAddDepartmentSection(); if (saved) setOpenFormDialog(false); }}>
            <SaveIcon fontSize="small" sx={{ mr: 0.5 }} /> Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 6,
          },
        }}
      >
        <DialogTitle
          sx={{
            background: settings?.header_color || "#1976d2",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1.2rem",
            py: 2,
          }}
        >
          Delete Department Section
        </DialogTitle>

        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this department section?
          </Typography>

          <Typography
            sx={{
              color: "#d32f2f",
              fontSize: "0.95rem",
            }}
          >
            Deleting this department section will permanently remove it from the
            department section list.
            <br />
            Any faculty assignments, schedules, or records associated with this
            department section may be affected.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Button
            color="error"
            variant="outlined"
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteDepartmentSection}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DepartmentSection;
