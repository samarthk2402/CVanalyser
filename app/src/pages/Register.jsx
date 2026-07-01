import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    console.log("Registration submitted", { email, password });

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error during registration:", error.message);
      alert("Registration failed: " + error.message);
    } else {
      console.log("Registration successful");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Create account</p>
        <h1>Start your analysis</h1>
        <p className="auth-copy">Register to upload your CV and receive tailored apprenticeship feedback.</p>
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
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <p className="auth-footnote">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
