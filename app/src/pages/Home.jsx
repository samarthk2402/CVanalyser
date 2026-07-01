import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";
import CVUploadCard from "../components/CVUploadCard.jsx";
import AnalysisResults from "../components/AnalysisResults.jsx";
import StatusPill from "../components/StatusPill.jsx";
import HistoryList from "../components/HistoryList.jsx";

export default function Home() {
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState("idle");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email || "";
      setUserName(email ? email.split("@")[0] : "student");
    };

    loadUser();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Degree apprenticeship readiness</p>
          <h1>Welcome back, {userName}</h1>
          <p className="hero-copy">
            Upload your CV to uncover the strengths that stand out and the gaps to strengthen before your next application.
          </p>
        </div>
        <div className="hero-actions">
          <StatusPill status={status} />
          {status === "processing" ? <span className="spinner" aria-label="Loading" /> : null}
        </div>
      </section>

      <CVUploadCard
        onAnalysisComplete={(result) => {
          setAnalysis(result);
          setStatus("completed");
        }}
        onStatusChange={setStatus}
      />

      {analysis ? <AnalysisResults strengths={analysis.strengths} gaps={analysis.gaps} /> : null}
      <HistoryList />
    </main>
  );
}