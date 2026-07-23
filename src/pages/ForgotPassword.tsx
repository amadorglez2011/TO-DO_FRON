import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import logo from "../assets/logo.png";

type Step = "email" | "question" | "reset" | "done";

export default function ForgotPassword() {
    const nav = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/forgot-password", { email });
            setSecurityQuestion(data.securityQuestion);
            setStep("question");
        } catch (err: any) {
            setError(err.response?.data?.message || "No se pudo verificar el correo");
        } finally {
            setLoading(false);
        }
    }

    async function handleAnswerSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await api.post("/auth/verify-security-answer", { email, answer });
            setResetToken(data.resetToken);
            setStep("reset");
        } catch (err: any) {
            setError(err.response?.data?.message || "Respuesta incorrecta");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        if (newPassword.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }
        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token: resetToken, newPassword });
            setStep("done");
        } catch (err: any) {
            setError(err.response?.data?.message || "No se pudo actualizar la contraseña");
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
                .cm-question-box {
                    background: #171212;
                    border: 1px solid #3f2a2a;
                    border-radius: 3px;
                    padding: 12px 13px;
                    color: #d8d2c8;
                    font-size: 14px;
                    margin-top: 4px;
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
                .cm-success-icon {
                    text-align: center;
                    font-size: 42px;
                    margin-bottom: 4px;
                }
            `}</style>
            <div className="cm-card">
                <div className="cm-brand">
                    <img src={logo} alt="Logo" className="logo-img" />
                    {step === "email" && (
                        <>
                            <h2>¿Olvidaste tu contraseña?</h2>
                            <p className="muted">Escribe tu correo para verificar tu identidad</p>
                        </>
                    )}
                    {step === "question" && (
                        <>
                            <h2>Pregunta de seguridad</h2>
                            <p className="muted">Responde para confirmar que eres tú</p>
                        </>
                    )}
                    {step === "reset" && (
                        <>
                            <h2>Nueva contraseña</h2>
                            <p className="muted">Elige una nueva contraseña para tu cuenta</p>
                        </>
                    )}
                    {step === "done" && (
                        <>
                            <div className="cm-success-icon">✅</div>
                            <h2>¡Listo!</h2>
                            <p className="muted">Tu contraseña fue actualizada correctamente</p>
                        </>
                    )}
                </div>

                {step === "email" && (
                    <form className="cm-form" onSubmit={handleEmailSubmit}>
                        <label>correo electronico</label>
                        <input
                            type="email"
                            placeholder="Ingresa tu correo electronico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        {error && <div className="cm-alert">{error}</div>}
                        <button className="cm-btn-primary" disabled={loading}>
                            {loading ? "verificando..." : "Continuar"}
                        </button>
                    </form>
                )}

                {step === "question" && (
                    <form className="cm-form" onSubmit={handleAnswerSubmit}>
                        <label>tu pregunta</label>
                        <div className="cm-question-box">{securityQuestion}</div>
                        <label>tu respuesta</label>
                        <input
                            type="text"
                            placeholder="Escribe tu respuesta"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            required
                        />
                        {error && <div className="cm-alert">{error}</div>}
                        <button className="cm-btn-primary" disabled={loading}>
                            {loading ? "verificando..." : "Verificar"}
                        </button>
                    </form>
                )}

                {step === "reset" && (
                    <form className="cm-form" onSubmit={handleResetSubmit}>
                        <label>nueva contraseña</label>
                        <input
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <label>confirmar contraseña</label>
                        <input
                            type="password"
                            placeholder="Repite tu contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        {error && <div className="cm-alert">{error}</div>}
                        <button className="cm-btn-primary" disabled={loading}>
                            {loading ? "guardando..." : "Actualizar contraseña"}
                        </button>
                    </form>
                )}

                {step === "done" && (
                    <button className="cm-btn-primary" onClick={() => nav("/")}>
                        Ir a iniciar sesión
                    </button>
                )}

                {step !== "done" && (
                    <div className="cm-footer">
                        <Link to="/" className="cm-link">← Volver a iniciar sesión</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
