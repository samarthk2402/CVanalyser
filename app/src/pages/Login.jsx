import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    console.log("Login submitted", { email, password });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error during login:", error.message);
      alert("Login failed: " + error.message);
    } else {
      console.log("Login successful");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Career support portal</p>
        <h1>Welcome back</h1>
        <p className="auth-copy">Sign in to review your CV analysis and track your next apprenticeship steps.</p>
        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="auth-footnote">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
