import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function HistoryList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData.user) {
        setError("Please sign in to view your analysis history.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cv_submissions")
        .select("id, file_name, created_at, status, analysis_results(strengths, gaps)")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message || "We could not load your history right now.");
      } else {
        setSubmissions(data || []);
      }

      setLoading(false);
    };

    loadHistory();
  }, []);

  if (loading) {
    return <section className="history-card"><p>Loading your history...</p></section>;
  }

  if (error) {
    return <section className="history-card"><p className="error-text">{error}</p></section>;
  }

  return (
    <section className="history-card">
      <div className="history-header">
        <div>
          <p className="eyebrow">Previous analyses</p>
          <h2>Your history</h2>
        </div>
      </div>

      {submissions.length === 0 ? (
        <p className="history-empty">You have not uploaded any CVs yet.</p>
      ) : (
        <ul className="history-list">
          {submissions.map((submission) => {
            const analysis = submission.analysis_results?.[0];
            const label = submission.status === "completed" ? "Completed" : submission.status;

            return (
              <li key={submission.id} className="history-item">
                <div>
                  <p className="history-title">{submission.file_name}</p>
                  <p className="history-meta">
                    {new Date(submission.created_at).toLocaleDateString()} • {label}
                  </p>
                  {analysis ? (
                    <p className="history-summary">
                      {analysis.strengths?.length || 0} strengths • {analysis.gaps?.length || 0} gaps
                    </p>
                  ) : null}
                </div>
                <Link className="history-link" to={`/analysis/${submission.id}`}>
                  View details
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
