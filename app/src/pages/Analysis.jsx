import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function Analysis() {
  const { cv_id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalysis = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setError("Please sign in to view this analysis.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cv_submissions")
        .select("id, file_name, created_at, storage_path, status, analysis_results(strengths, gaps)")
        .eq("id", cv_id)
        .eq("user_id", userData.user.id)
        .single();

      if (error || !data) {
        setError("We could not find that analysis.");
        setLoading(false);
        return;
      }

      setSubmission(data);

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("cv-uploads")
        .createSignedUrl(data.storage_path, 3600);

      if (signedUrlError) {
        setError(signedUrlError.message || "The CV download link could not be created.");
      } else {
        setDownloadUrl(signedUrlData.signedUrl);
      }

      setLoading(false);
    };

    loadAnalysis();
  }, [cv_id]);

  if (loading) {
    return <main className="app-shell"><section className="hero-card"><p>Loading analysis details...</p></section></main>;
  }

  if (error) {
    return <main className="app-shell"><section className="hero-card"><p className="error-text">{error}</p></section></main>;
  }

  const analysis = submission.analysis_results;
  console.log("Loaded analysis:",  submission.analysis_results );

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Saved analysis</p>
          <h1>{submission.file_name}</h1>
          <p className="hero-copy">
            Reviewed on {new Date(submission.created_at).toLocaleDateString()} • {submission.status}
          </p>
        </div>
        {downloadUrl ? (
          <a className="primary-button" href={downloadUrl} target="_blank" rel="noreferrer">
            Download CV
          </a>
        ) : null}
      </section>

      <div className="results-grid">
        <section className="result-card">
          <div className="result-title-row">
            <span className="result-icon">✨</span>
            <h3>Strengths</h3>
          </div>
          <ul>
            {(analysis?.strengths || []).length > 0 ? (
              analysis.strengths.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No strengths were stored for this analysis.</li>
            )}
          </ul>
        </section>

        <section className="result-card">
          <div className="result-title-row">
            <span className="result-icon">🛠️</span>
            <h3>Gaps</h3>
          </div>
          <ul>
            {(analysis?.gaps || []).length > 0 ? (
              analysis.gaps.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No gaps were stored for this analysis.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="back-link-row">
        <Link to="/" className="history-link">← Back to dashboard</Link>
      </div>
    </main>
  );
}
