export default function AnalysisResults({ strengths = [], gaps = [] }) {
  return (
    <div className="results-grid">
      <section className="result-card">
        <div className="result-title-row">
          <span className="result-icon">✨</span>
          <h3>Strengths</h3>
        </div>
        <ul>
          {strengths.length > 0 ? (
            strengths.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li>No strengths were identified in this analysis yet.</li>
          )}
        </ul>
      </section>

      <section className="result-card">
        <div className="result-title-row">
          <span className="result-icon">🛠️</span>
          <h3>Gaps to strengthen</h3>
        </div>
        <ul>
          {gaps.length > 0 ? (
            gaps.map((item) => <li key={item}>{item}</li>)
          ) : (
            <li>No improvement areas were highlighted.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
