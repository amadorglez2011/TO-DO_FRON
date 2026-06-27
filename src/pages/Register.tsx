import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api";
import logo from '../assets/logo.png';

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
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
    <div className="auth-wrap">
      <div className="card">
        <div className="brand">
          <img src={logo} alt="To-Do PWA" className="logo-img" />
          <h2>Crear cuenta</h2>
          <p className="muted">Únete y comienza a organizar tus tareas</p>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@dominio.com" required />
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          {error && <div className="alert">{error}</div>}
          <button className="btn primary" disabled={loading}>{loading ? "Creando..." : "Crear cuenta"}</button>
        </form>

        <div className="footer-links">
          <span className="muted">¿Ya tienes cuenta?</span>
          <Link to="/" className="link">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}