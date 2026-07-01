export default function StatusPill({ status }) {
  const statusMap = {
    idle: { label: "Awaiting upload", tone: "neutral" },
    processing: { label: "Processing CV", tone: "processing" },
    completed: { label: "Analysis ready", tone: "success" },
    error: { label: "Needs attention", tone: "error" },
  };

  const current = statusMap[status] || statusMap.idle;

  return <span className={`status-pill ${current.tone}`}>{current.label}</span>;
}
