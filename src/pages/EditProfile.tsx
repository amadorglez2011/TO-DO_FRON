import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

type UserData = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  createdAt?: string;
};

// Redimensiona y comprime la imagen en el navegador antes de enviarla,
// para no mandar fotos enormes al backend/MongoDB.
function resizeImageToDataUrl(file: File, maxSize = 240, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // recorte tipo "cover" cuadrado centrado
        const side = Math.min(width, height);
        const sx = (width - side) / 2;
        const sy = (height - side) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No se pudo procesar la imagen"));
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditProfile() {
  const nav = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarChanged, setAvatarChanged] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/profile");
        const u: UserData = data?.user ?? {};
        setName(u.name || "");
        setEmail(u.email || "");
        setAvatarPreview(u.avatar || "");
      } catch {
        setError("No se pudo cargar tu perfil.");
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecciona un archivo de imagen válido.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen es demasiado pesada (máx. 8MB).");
      return;
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarChanged(true);
      setError("");
    } catch {
      setError("No se pudo procesar la imagen.");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password && password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password && password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = { name, email };
      if (password) payload.password = password;
      if (avatarChanged) payload.avatar = avatarPreview;

      const { data } = await api.put("/auth/profile", payload);
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      setSuccess("Perfil actualizado correctamente.");
      setPassword("");
      setConfirmPassword("");
      setAvatarChanged(false);

      setTimeout(() => nav("/dashboard"), 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className="cm-editwrap">
      <style>{`
        .cm-editwrap {
          min-height: 100vh;
          background: #241f1f;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }
        .cm-editcard {
          width: 100%;
          max-width: 420px;
          background: #2a2323;
          border: 1px solid #3a2424;
          border-radius: 6px;
          padding: 2.25rem 2rem;
          position: relative;
        }
        .cm-editcard::before {
          content: "";
          position: absolute;
          top: 0;
          left: 8%;
          right: 8%;
          height: 3px;
          background: #9c2b2b;
          clip-path: polygon(0% 0%, 4% 100%, 9% 0%, 14% 100%, 19% 0%, 24% 100%, 29% 0%, 34% 100%, 39% 0%, 44% 100%, 49% 0%, 54% 100%, 59% 0%, 64% 100%, 69% 0%, 74% 100%, 79% 0%, 84% 100%, 89% 0%, 94% 100%, 100% 0%);
        }
        .cm-edit-title {
          font-family: Georgia, "Times New Roman", serif;
          color: #f2ece4;
          font-size: 22px;
          margin: 0 0 4px;
          text-align: center;
        }
        .cm-edit-sub {
          color: #8a8078;
          font-size: 13px;
          text-align: center;
          margin: 0 0 24px;
        }
        .cm-avatar-picker {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
        }
        .cm-avatar-circle {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          background: #9c2b2b;
          color: #fff;
          font-size: 30px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 2px solid #3a2424;
          cursor: pointer;
        }
        .cm-avatar-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cm-avatar-btn {
          background: transparent;
          border: 1px solid #5c5450;
          color: #d8d2c8;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 20px;
          cursor: pointer;
        }
        .cm-avatar-btn:hover {
          border-color: #9c2b2b;
          color: #f2ece4;
        }
        .cm-edit-label {
          display: block;
          font-size: 11px;
          color: #b34c4c;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 16px 0 6px;
        }
        .cm-edit-input {
          width: 100%;
          background: #1c1717;
          border: 1px solid #3f2a2a;
          border-radius: 3px;
          padding: 11px 13px;
          color: #f2ece4;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
        }
        .cm-edit-input:focus {
          border-color: #9c2b2b;
        }
        .cm-hint {
          color: #6b6862;
          font-size: 11px;
          margin: 4px 0 0;
        }
        .cm-alert-error {
          background: #2a1414;
          border: 1px solid #5a2020;
          color: #e07a7a;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 3px;
          margin-top: 16px;
        }
        .cm-alert-success {
          background: #142a1c;
          border: 1px solid #205a35;
          color: #7ae0a0;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 3px;
          margin-top: 16px;
        }
        .cm-edit-actions {
          display: flex;
          gap: 10px;
          margin-top: 24px;
        }
        .cm-edit-btn-primary {
          flex: 1;
          background: #9c2b2b;
          color: #f5f0e8;
          border: none;
          border-radius: 3px;
          padding: 12px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cm-edit-btn-primary:hover:not(:disabled) {
          background: #b83232;
        }
        .cm-edit-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cm-edit-btn-secondary {
          flex: 1;
          background: transparent;
          border: 1px solid #5c5450;
          color: #d8d2c8;
          border-radius: 3px;
          padding: 12px;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
          cursor: pointer;
        }
        .cm-edit-btn-secondary:hover {
          border-color: #9c2b2b;
          color: #f2ece4;
        }
      `}</style>

      <div className="cm-editcard">
        <h2 className="cm-edit-title">Editar perfil</h2>
        <p className="cm-edit-sub">Actualiza tu información personal</p>

        {loadingProfile ? (
          <p style={{ color: "#8a8078", textAlign: "center" }}>Cargando…</p>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="cm-avatar-picker">
              <div
                className="cm-avatar-circle"
                onClick={() => fileInputRef.current?.click()}
                title="Cambiar foto de perfil"
              >
                {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : initial}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button
                type="button"
                className="cm-avatar-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar foto
              </button>
            </div>

            <label className="cm-edit-label">Nombre</label>
            <input
              className="cm-edit-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
            />

            <label className="cm-edit-label">Correo electrónico</label>
            <input
              className="cm-edit-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@dominio.com"
              required
            />

            <label className="cm-edit-label">Nueva contraseña</label>
            <input
              className="cm-edit-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dejar en blanco para no cambiarla"
            />
            <p className="cm-hint">Mínimo 6 caracteres. Déjalo vacío si no quieres cambiarla.</p>

            {password && (
              <>
                <label className="cm-edit-label">Confirmar nueva contraseña</label>
                <input
                  className="cm-edit-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                />
              </>
            )}

            {error && <div className="cm-alert-error">{error}</div>}
            {success && <div className="cm-alert-success">{success}</div>}

            <div className="cm-edit-actions">
              <button
                type="button"
                className="cm-edit-btn-secondary"
                onClick={() => nav("/dashboard")}
              >
                Cancelar
              </button>
              <button className="cm-edit-btn-primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}