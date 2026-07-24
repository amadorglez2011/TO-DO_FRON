import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api.ts";
import logo from "../assets/logo.png"; // 👈 Importación correcta del archivo real

export default function Login() {
    const nav = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const {data} = await api.post("/auth/login", {email, password});
            localStorage.setItem("token", data.token);
            setAuth(data.token);
            nav("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Error al iniciar sesion");
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
                .cm-pass {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .cm-pass input {
                    padding-right: 78px;
                }
                .cm-ghost {
                    position: absolute;
                    right: 8px;
                    background: transparent;
                    border: none;
                    color: #b34c4c;
                    font-size: 12px;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    padding: 6px 8px;
                }
                .cm-ghost:hover {
                    color: #d94848;
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
                    <img src={logo} alt="Logo" className="logo-img"/>
                    <h2>To-Do Cero miedo</h2>
                    <p className="muted">Organiza tus tareas de manera eficiente</p>
                </div>
                <form className="cm-form" onSubmit={onSubmit}>
                    <label>correo electronico</label>
                    <input
                        type="email"
                        placeholder="Ingresa tu correo electronico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label>contraseña</label>
                    <div className="cm-pass">
                        <input
                            type={show ? "text" : "password"}
                            placeholder="*********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="button"
                            className="cm-ghost"
                            onClick={() => setShow($ => !$)}
                            aria-label="Ocultar/ mostrar contraseña">
                            {show ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>
                    {error && <div className="cm-alert">{error}</div>}
                    <button className="cm-btn-primary" disabled={loading}>
                        {loading ? "iniciando sesion..." : "Iniciar Sesion"}
                    </button>
                </form>
                <div className="cm-footer">
                    <Link to="/forgot-password" className="cm-link" style={{ marginLeft: 0 }}>¿Olvidaste tu contraseña?</Link>
                </div>
                <div className="cm-footer">
                    <span>¿No tienes una cuenta?</span>
                    <Link to="/register" className="cm-link">Registrate aqui</Link>
                </div>
            </div>
        </div>
    );
}