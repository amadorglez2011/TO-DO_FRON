import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from "../assets/logo.png"; // 👈 Importación correcta del archivo real

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const SECURITY_QUESTIONS = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿En qué ciudad naciste?",
    "¿Cuál es el nombre de tu mejor amigo de la infancia?",
    "¿Cuál era el modelo de tu primer coche?",
    "¿Cuál es tu comida favorita?",
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name, email, password, securityQuestion, securityAnswer,
      });
      localStorage.setItem("token", data.token);
      setAuth(data.token);
      nav("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al registrarte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap cm-wrap">
      <style>{`
          .cm-wrap {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #1a1616;
              background-image:
                  repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px);
              padding: 2rem;
          }
          .cm-card {
              width: 100%;
              max-width: 380px;
              background: #201a1a;
              border: 1px solid #3a2424;
              border-radius: 4px;
              padding: 2.5rem 2.25rem;
              position: relative;
              box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          }
          .cm-card::before {
              content: "";
              position: absolute;
              top: 0;
              left: 8%;
              right: 8%;
              height: 3px;
              background: #9c2b2b;
              clip-path: polygon(0% 0%, 4% 100%, 9% 0%, 14% 100%, 19% 0%, 24% 100%, 29% 0%, 34% 100%, 39% 0%, 44% 100%, 49% 0%, 54% 100%, 59% 0%, 64% 100%, 69% 0%, 74% 100%, 79% 0%, 84% 100%, 89% 0%, 94% 100%, 100% 0%);
          }
          .cm-brand {
              text-align: center;
              margin-bottom: 2rem;
          }
          .cm-brand .logo-img {
              max-width: 150px;
              margin: 0 auto 12px;
              display: block;
          }
          .cm-brand h2 {
              font-family: Georgia, "Times New Roman", serif;
              color: #f2ece4;
              font-size: 22px;
              font-weight: 700;
              letter-spacing: 0.5px;
              margin: 4px 0 6px;
          }
          .cm-brand .muted {
              color: #8a8078;
              font-size: 13px;
              margin: 0;
          }
          .cm-form label {
              display: block;
              font-size: 11px;
              color: #b34c4c;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin: 16px 0 6px;
          }
          .cm-form input {
              width: 100%;
              background: #171212;
              border: 1px solid #3f2a2a;
              border-radius: 3px;
              padding: 11px 13px;
              color: #f2ece4;
              font-size: 14px;
              outline: none;
              transition: border-color 0.15s ease;
          }
          .cm-form input:focus {
              border-color: #9c2b2b;
          }
          .cm-form input::placeholder {
              color: #5c5450;
          }
          .cm-alert {
              background: #2a1414;
              border: 1px solid #5a2020;
              color: #e07a7a;
              font-size: 13px;
              padding: 10px 12px;
              border-radius: 3px;
              margin-top: 16px;
          }
          .cm-btn-primary {
              width: 100%;
              margin-top: 22px;
              background: #9c2b2b;
              color: #f5f0e8;
              border: none;
              border-radius: 3px;
              padding: 13px;
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              cursor: pointer;
              transition: background 0.15s ease;
          }
          .cm-btn-primary:hover:not(:disabled) {
              background: #b83232;
          }
          .cm-btn-primary:disabled {
              opacity: 0.6;
              cursor: not-allowed;
          }
          .cm-footer {
              text-align: center;
              margin-top: 22px;
              font-size: 13px;
              color: #8a8078;
          }
          .cm-footer .cm-link {
              color: #d94848;
              font-weight: 700;
              text-decoration: none;
              margin-left: 4px;
          }
          .cm-footer .cm-link:hover {
              text-decoration: underline;
          }
      `}</style>
      <div className="cm-card">
        <div className="cm-brand">
          <img src={logo} alt="To-Do PWA" className="logo-img" />
          <h2>Crea tu cuenta</h2>
          <p className="muted">Únete y comienza a organizar tus tareas</p>
        </div>

        <form className="cm-form" onSubmit={onSubmit}>
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />

          <label>Pregunta de seguridad</label>
          <select
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            required
            style={{
              width: "100%",
              background: "#171212",
              border: "1px solid #3f2a2a",
              borderRadius: "3px",
              padding: "11px 13px",
              color: securityQuestion ? "#f2ece4" : "#5c5450",
              fontSize: "14px",
              outline: "none",
            }}
          >
            <option value="" disabled>Elige una pregunta…</option>
            {SECURITY_QUESTIONS.map((q) => (
              <option key={q} value={q} style={{ color: "#f2ece4", background: "#171212" }}>{q}</option>
            ))}
          </select>

          <label>Respuesta de seguridad</label>
          <input
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Tu respuesta (guárdala bien, BROTHER)"
            required
          />

          {error && <div className="cm-alert">{error}</div>}
          <button className="cm-btn-primary" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
        </form>

        <div className="cm-footer">
          <span className="muted">¿Ya tienes cuenta?</span>
          <Link to="/" className="cm-link">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}