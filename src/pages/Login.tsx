import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuth } from "../api.ts"; // 👈 Se eliminó la línea de 'import logo...'

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
        <div className="auth-wrap">
            <div className="card">
                <div className="brand">
                   {/* CORREGIDO: Cambiar src={logo} por src="/icon/logo1.png" */}
<img src="/icon/logo1.png" alt="To-Do PWA" className="logo-img" />
                    <h2>To-Do App</h2>
                    <p className="muted">Organiza tus tareas de manera eficiente</p>
                </div>
                <form className="form" onSubmit={onSubmit}>
                    <label> correo electronico </label>
                    <input
                        type="email"
                        placeholder="Ingresa tu correo electronico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label> contraseña </label>
                    <div className="pass">
                        <input
                            type={show ? "text" : "password"}
                            placeholder="*********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="button" 
                            className="ghost"
                            onClick={() => setShow($ => !$)}
                            aria-label= "Ocultar/ mostrar contraseña">
                            {show ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>
                    {error && <div className="alert">{error}</div>}
                    <button className="btn primary" disabled={loading}>
                        {loading ? "iniciando sesion..." : "Iniciar Sesion"}
                    </button>
                </form>
                <div className="footer-links">
                    <span>¿No tienes una cuenta?</span>
                    <Link to="/register" className="link">Registrate aqui</Link>
                </div>
            </div>
        </div>
    );
}