import { useState } from "react";
import { supabase } from "../supabase.js";

const BUCKET_NAME = "cv-uploads";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function CVUploadCard({ onAnalysisComplete, onStatusChange }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Upload a PDF CV to get apprenticeship-fit feedback.");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    onStatusChange?.("processing");
    setMessage("Uploading your CV and preparing the analysis...");

    let submissionId = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You need to be signed in before uploading a CV.");
      }

      const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const storagePath = `${user.id}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/pdf",
      });

      if (uploadError) {
        throw new Error(uploadError.message || "The CV could not be stored securely.");
      }

      const { data: submissionData, error: submissionError } = await supabase
        .from("cv_submissions")
        .insert({
          user_id: user.id,
          storage_path: storagePath,
          file_name: file.name,
          status: "processing",
        })
        .select("id")
        .single();

      if (submissionError || !submissionData) {
        throw new Error(submissionError?.message || "We could not create a submission record.");
      }

      submissionId = submissionData.id;
      setMessage("Your CV is being analysed by the apprenticeship assistant...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_URL}/analyze-cv`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.detail || "The analysis service failed to return a result.");
      }

      const { error: resultError } = await supabase.from("analysis_results").insert({
        submission_id: submissionId,
        user_id: user.id,
        strengths: payload.strengths || [],
        gaps: payload.gaps || [],
      });

      if (resultError) {
        throw new Error(resultError.message || "The analysis could not be saved.");
      }

      await supabase.from("cv_submissions").update({ status: "completed" }).eq("id", submissionId);

      onAnalysisComplete?.({ strengths: payload.strengths || [], gaps: payload.gaps || [] });
      onStatusChange?.("completed");
      setMessage("Analysis complete. Your results are ready to review.");
    } catch (err) {
      if (submissionId) {
        await supabase.from("cv_submissions").update({ status: "failed" }).eq("id", submissionId);
      }

      const detail = err instanceof Error ? err.message : "Unexpected error while processing your CV.";
      setError(detail);
      onStatusChange?.("error");
      setMessage("We could not complete the analysis just yet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="upload-card" onSubmit={handleSubmit}>
      <div className="upload-header">
        <div>
          <p className="eyebrow">Upload your CV</p>
          <h2>Start a new analysis</h2>
        </div>
      </div>

      <label className="upload-dropzone" htmlFor="cv-upload">
        <input
          id="cv-upload"
          type="file"
          accept=".pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <span className="upload-icon">📄</span>
        <span>{file ? file.name : "Choose a PDF CV from your device"}</span>
      </label>

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Processing..." : "Analyse my CV"}
      </button>

      <p className="upload-status">{message}</p>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}
