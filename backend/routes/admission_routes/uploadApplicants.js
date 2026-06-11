const express = require("express");
const { db3 } = require("../database/database");
const {
  assignStudentNumberFromUploadedApplicant,
} = require("../../services/studentNumberAssignmentService");

const router = express.Router();

const getRequestedUploadedApplicantIds = (body) => {
  const rawIds = Array.isArray(body?.uploaded_applicant_ids)
    ? body.uploaded_applicant_ids
    : [body?.uploaded_applicant_id ?? body?.id].filter((value) => value !== undefined);

  return [
    ...new Set(
      rawIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
};

router.post("/uploaded-applicants/assign-student-number", async (req, res) => {
  try {
    const uploadedApplicantIds = getRequestedUploadedApplicantIds(req.body);
    if (!uploadedApplicantIds.length) {
      return res.status(400).json({
        success: false,
        error: "Please select at least one uploaded applicant.",
      });
    }

    const [uploadedApplicants] = await db3.query(
      `SELECT
         id,
         applicant_number,
         last_name,
         first_name,
         middle_name,
         program,
         email_address,
         contact_num,
         address,
         date_applied,
         uploaded_at
       FROM uploaded_applicants_table
       WHERE id IN (?)`,
      [uploadedApplicantIds],
    );
    const uploadedApplicantOrder = new Map(
      uploadedApplicantIds.map((id, index) => [id, index]),
    );
    uploadedApplicants.sort(
      (left, right) =>
        uploadedApplicantOrder.get(Number(left.id)) -
        uploadedApplicantOrder.get(Number(right.id)),
    );

    const foundUploadedIds = new Set(uploadedApplicants.map((row) => Number(row.id)));
    const assigned = [];
    const skipped = uploadedApplicantIds
      .filter((id) => !foundUploadedIds.has(id))
      .map((id) => ({
        uploaded_applicant_id: id,
        reason: "Uploaded applicant was not found.",
      }));

    for (const uploadedApplicant of uploadedApplicants) {
      try {
        const result = await assignStudentNumberFromUploadedApplicant({
          uploadedApplicant,
          auditActorId:
            req.body?.audit_actor_id ||
            req.headers["x-actor-id"] ||
            req.headers["x-person-id"] ||
            "unknown",
          auditActorRole:
            req.body?.audit_actor_role ||
            req.headers["x-actor-role"] ||
            "registrar",
        });

        assigned.push({
          uploaded_applicant_id: uploadedApplicant.id,
          applicant_number: uploadedApplicant.applicant_number,
          ...result,
        });
      } catch (error) {
        skipped.push({
          uploaded_applicant_id: uploadedApplicant.id,
          applicant_number: uploadedApplicant.applicant_number,
          reason: error.message || "Failed to assign student number.",
        });
      }
    }

    const success = assigned.length > 0 && skipped.length === 0;
    const partial = assigned.length > 0 && skipped.length > 0;

    res.status(assigned.length > 0 ? 200 : 400).json({
      success,
      partial,
      assigned,
      skipped,
      assignedCount: assigned.length,
      skippedCount: skipped.length,
      message: partial
        ? `Assigned ${assigned.length} applicant(s), skipped ${skipped.length}.`
        : success
          ? `Assigned ${assigned.length} applicant(s).`
          : "No uploaded applicants were assigned.",
    });
  } catch (error) {
    console.error("Uploaded applicant student-number assignment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to assign student number to uploaded applicant.",
    });
  }
});

module.exports = router;
