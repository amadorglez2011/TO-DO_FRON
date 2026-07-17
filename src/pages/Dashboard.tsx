import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, setAuth } from "../api";
import {
  cacheTasks,
  getAllTasksLocal,
  putTaskLocal,
  removeTaskLocal,
  queue,
  type OutboxOp,
} from "../offline/db";

import { syncNow } from "../offline/sync"; 

type Status = "Pendiente" | "En Progreso" | "Completada";

type Task = {
  _id: string;                 
  title: string;
  description?: string;
  status: Status;
  clienteId?: string;
  createdAt?: string;
  deleted?: boolean;
  pending?: boolean;           
};

type UserProfile = {
  name: string;
  email: string;
  role?: string;
  createdAt?: string;         
  id?: string;                
};

const isLocalId = (id: string) => !/^[a-f0-9]{24}$/i.test(id);

function normalizeTask(x: any): Task {
  return {
    _id: String(x?._id ?? x?.id),
    title: String(x?.title ?? "(sin título)"),
    description: x?.description ?? "",
    status:
      x?.status === "Completada" ||
      x?.status === "En Progreso" ||
      x?.status === "Pendiente"
        ? x.status
        : "Pendiente",
    clienteId: x?.clienteId,
    createdAt: x?.createdAt,
    deleted: !!x?.deleted,
    pending: !!x?.pending,
  };
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Sincroniza el token actual con la API al montar el componente
    const token = localStorage.getItem("token");
    setAuth(token);

    const on = async () => {
      setOnline(true);
      await syncNow();        
      await loadFromServer(); 
      await loadUserProfile(); 
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    (async () => {
      await loadUserProfile();

      const local = await getAllTasksLocal();
      if (local?.length) setTasks(local.map(normalizeTask));

      await loadFromServer();
      await syncNow();
      await loadFromServer();
    })();

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  async function loadUserProfile() {
    try {
      const cached = localStorage.getItem("user");
      
      if (cached) {
        const parsedUser = JSON.parse(cached);
        setUser({
          id: parsedUser._id || parsedUser.id || "",
          name: parsedUser.name || parsedUser.username || "Usuario General",
          email: parsedUser.email || "Sin correo",
          role: parsedUser.role || "Miembro",
          createdAt: parsedUser.createdAt || ""
        });
      }

      if (navigator.onLine) {
        const { data } = await api.get("/auth/me"); 
        if (data) {
          setUser({
            id: data._id || data.id || "",
            name: data.name || data.username || "Usuario General",
            email: data.email || "Sin correo",
            role: data.role || "Miembro",
            createdAt: data.createdAt || ""
          });
          localStorage.setItem("user", JSON.stringify(data));
        }
      }
    } catch {
      console.log("Perfil obtenido localmente.");
    }
  }

  async function loadFromServer() {
    try {
      const { data } = await api.get("/tasks"); 
      const raw = Array.isArray(data?.items) ? data.items : [];
      const list = raw.map(normalizeTask);
      setTasks(list);
      await cacheTasks(list);
    } catch {
      // mantiene estado local
    } finally {
      setLoading(false);
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const d = description.trim();
    if (!t) return;

    const clienteId = crypto.randomUUID();
    const localTask = normalizeTask({
      _id: clienteId,
      title: t,
      description: d,
      status: "Pendiente" as Status,
      pending: !navigator.onLine, 
    });

    setTasks((prev) => [localTask, ...prev]);
    await putTaskLocal(localTask);
    setTitle("");
    setDescription("");

    const op: OutboxOp = {
      id: "op-" + clienteId,
      op: "create",
      clienteId,
      data: localTask,
      ts: Date.now(),
    } as any;

    if (!navigator.onLine) {
      await queue(op);
      return;
    }

    try {
      const { data } = await api.post("/tasks", { title: t, description: d });
      const created = normalizeTask(data?.task ?? data);
      setTasks((prev) => prev.map((x) => (x._id === clienteId ? created : x)));
      await putTaskLocal(created);
    } catch {
      await queue(op);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task._id);
    setEditingTitle(task.title);
    setEditingDescription(task.description ?? "");
  }

  async function saveEdit(taskId: string) {
    const newTitle = editingTitle.trim();
    const newDesc  = editingDescription.trim();
    if (!newTitle) return;

    const before = tasks.find((t) => t._id === taskId);
    const patched = { ...before, title: newTitle, description: newDesc } as Task;

    setTasks((prev) => prev.map((t) => (t._id === taskId ? patched : t)));
    await putTaskLocal(patched);
    setEditingId(null);

    const op: OutboxOp = {
      id: "upd-" + taskId,
      op: "update",
      clienteId: isLocalId(taskId) ? taskId : "undefined",
      serverId: isLocalId(taskId) ? undefined : taskId,
      data: { title: newTitle, description: newDesc },
      ts: Date.now(),
    };

    if (!navigator.onLine) {
      await queue(op);
      return;
    }

    try {
      await api.put(`/tasks/${taskId}`, { title: newTitle, description: newDesc });
    } catch {
      await queue(op);
    }
  }

  async function handleStatusChange(task: Task, newStatus: Status) {
    const updated = { ...task, status: newStatus };
    setTasks((prev) => prev.map((x) => (x._id === task._id ? updated : x)));
    await putTaskLocal(updated);

    const op: OutboxOp = {
      id: "upd-" + task._id,
      op: "update",
      serverId: isLocalId(task._id) ? undefined : task._id,
      clienteId: isLocalId(task._id) ? task._id : "undefined",
      data: { status: newStatus },
      ts: Date.now(),
    };

    if (!navigator.onLine) {
      await queue(op);
      return;
    }

    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
    } catch {
      await queue(op);
    }
  }

  async function removeTask(taskId: string) {
    const backup = tasks;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    await removeTaskLocal(taskId);

    const op: OutboxOp = {
      id: "del-" + taskId,
      op: "delete",
      serverId: isLocalId(taskId) ? undefined : taskId,
      clienteId: isLocalId(taskId) ? taskId : "undefined",
      ts: Date.now(),
    };

    if (!navigator.onLine) {
      await queue(op);
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
    } catch {
      setTasks(backup);
      for (const t of backup) await putTaskLocal(t);
      await queue(op);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
    setAuth(null); 
    // Usamos replace para evitar que el usuario regrese con las flechas del navegador
    window.location.replace("/");
  }

  async function logoutAllDevices() {
    try {
      await api.post("/auth/logout-all");
    } finally {
      logout();
    }
  }

  // ------- Cierre de sesión automático por inactividad -------
  const INACTIVITY_LIMIT =  20 * 1000; // 15 minutos, ajusta a gusto
  const WARNING_BEFORE = 10 * 1000; // avisar 1 minuto antes de cerrar

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE / 1000);

  function clearAllTimers() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  }

  function startCountdown() {
    setShowInactivityWarning(true);
    setSecondsLeft(WARNING_BEFORE / 1000);
    countdownInterval.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function resetInactivityTimer() {
    clearAllTimers();
    setShowInactivityWarning(false);
    warningTimer.current = setTimeout(startCountdown, INACTIVITY_LIMIT - WARNING_BEFORE);
    inactivityTimer.current = setTimeout(logout, INACTIVITY_LIMIT);
  }

  function stayConnected() {
    resetInactivityTimer();
  }

  const showWarningRef = useRef(false);
  useEffect(() => {
    showWarningRef.current = showInactivityWarning;
  }, [showInactivityWarning]);

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    const handleActivity = () => {
      if (!showWarningRef.current) resetInactivityTimer();
    };
    events.forEach((e) => window.addEventListener(e, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(s) ||
          (t.description || "").toLowerCase().includes(s)
      );
    }
    if (filter === "active") list = list.filter((t) => t.status !== "Completada");
    if (filter === "completed") list = list.filter((t) => t.status === "Completada");
    return list;
  }, [tasks, search, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "Completada").length;
    return { total, done, pending: total - done };
  }, [tasks]);

  const userInitial = useMemo(() => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "?";
  }, [user]);

  const formattedJoinDate = useMemo(() => {
    if (!user?.createdAt) return "No disponible";
    try {
      return new Date(user.createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Reciente";
    }
  }, [user]);

  return (
    <div className="wrap">
      <header className="topbar">
        <h1>To-Do PWA</h1>
        <div className="spacer" />
        <div className="stats">
          <span>Total: {stats.total}</span>
          <span>Hechas: {stats.done}</span>
          <span>Pendientes: {stats.pending}</span>
          <span className="badge" style={{ marginLeft: 8, background: online ? "#1f6feb" : "#b45309" }}>
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <div className="user-menu-container" style={{ position: "relative", marginLeft: 16 }}>
          <button 
            type="button"
            className="user-avatar-btn" 
            onClick={() => setShowProfile(!showProfile)}
            style={{ 
              borderRadius: "50%", 
              width: 42, 
              height: 42, 
              padding: 0, 
              fontSize: "16px", 
              fontWeight: "bold",
              cursor: "pointer",
              background: "#1f6feb",
              color: "#ffffff",
              border: "2px solid #30363d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Ver Perfil Detallado"
          >
            {userInitial}
          </button>

          {showProfile && (
            <div className="profile-dropdown-card" style={{
              position: "absolute",
              right: 0,
              top: "50px",
              background: "#161b22", 
              border: "1px solid #30363d",
              borderRadius: "10px",
              padding: "16px",
              minWidth: "260px",
              zIndex: 100,
              boxShadow: "0px 8px 24px rgba(0,0,0,0.6)",
              textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{
                  borderRadius: "50%", 
                  width: 50, 
                  height: 50, 
                  background: "#238636",
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {userInitial}
                </div>
                <div>
                  <h4 style={{ margin: 0, color: "#f0f6fc", fontSize: "16px" }}>{user?.name}</h4>
                  <span className="badge" style={{ background: "#21262d", border: "1px solid #30363d", fontSize: "11px", padding: "2px 6px", borderRadius: "10px", color: "#58a6ff" }}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#c9d1d9" }}>
                <div>
                  <strong style={{ color: "#8b949e" }}>Correo:</strong>
                  <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "#f0f6fc" }}>
                    {user?.email}
                  </div>
                </div>
                
                <div>
                  <strong style={{ color: "#8b949e" }}>Miembro desde:</strong>
                  <div style={{ color: "#f0f6fc" }}>{formattedJoinDate}</div>
                </div>

                {user?.id && (
                  <div>
                    <strong style={{ color: "#8b949e" }}>User ID:</strong>
                    <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#8b949e" }}>
                      {user.id}
                    </div>
                  </div>
                )}
              </div>

              <hr style={{ borderColor: "#30363d", margin: "14px 0" }} />

              <div style={{ background: "#21262d", borderRadius: "6px", padding: "10px", marginBottom: "14px", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#8b949e" }}>Tareas Completadas:</span>
                  <span style={{ color: "#56d364", fontWeight: "bold" }}>{stats.done}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#8b949e" }}>Tasa de Eficiencia:</span>
                  <span style={{ color: "#f0f6fc", fontWeight: "bold" }}>
                    {stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn danger"
                style={{ width: "100%", padding: "8px", fontWeight: "bold", cursor: "pointer" }}
                onClick={logout}
              >
                Cerrar Sesión
              </button>
              <button
                type="button"
                className="btn danger"
                style={{ width: "100%", padding: "8px", marginTop: "8px", fontWeight: "bold", cursor: "pointer" }}
                onClick={logoutAllDevices}
              >
                Cerrar sesión en todos los dispositivos
              </button>
            </div>
          )}
        </div>
      </header>

      <main>
        <form className="add add-grid" onSubmit={addTask}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea…"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción (opcional)…"
            rows={2}
          />
          <button className="btn">Agregar</button>
        </form>

        <div className="toolbar">
          <input
            className="search"
            placeholder="Buscar por título o descripción…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="filters">
            <button
              className={filter === "all" ? "chip active" : "chip"}
              onClick={() => setFilter("all")}
              type="button"
            >
              Todas
            </button>
            <button
              className={filter === "active" ? "chip active" : "chip"}
              onClick={() => setFilter("active")}
              type="button"
            >
              Activas
            </button>
            <button
              className={filter === "completed" ? "chip active" : "chip"}
              onClick={() => setFilter("completed")}
              type="button"
            >
              Hechas
            </button>
          </div>
        </div>

        {loading ? (
          <p>Cargando…</p>
        ) : filtered.length === 0 ? (
          <p className="empty">Sin tareas</p>
        ) : (
          <ul className="list">
            {filtered.map((t) => (
              <li key={t._id} className={t.status === "Completada" ? "item done" : "item"}>
                <select
                  value={t.status}
                  onChange={(e) => handleStatusChange(t, e.target.value as Status)}
                  className="status-select"
                  title="Estado"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Completada">Completada</option>
                </select>

                <div className="content">
                  {editingId === t._id ? (
                    <>
                      <input
                        className="edit"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        placeholder="Título"
                        autoFocus
                      />
                      <textarea
                        className="edit"
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="Descripción"
                        rows={2}
                      />
                    </>
                  ) : (
                    <>
                      <span className="title" onDoubleClick={() => startEdit(t)}>
                        {t.title}
                      </span>
                      {t.description && <p className="desc">{t.description}</p>}
                      {(t.pending || isLocalId(t._id)) && (
                        <span
                          className="badge"
                          title="Aún no sincronizada"
                          style={{ background: "#b45309", width: "fit-content" }}
                        >
                          Falta sincronizar
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="actions">
                  {editingId === t._id ? (
                    <button className="btn" onClick={() => saveEdit(t._id)}>Guardar</button>
                  ) : (
                    <button className="icon" title="Editar" onClick={() => startEdit(t)}>✏️</button>
                  )}
                  <button className="icon danger" title="Eliminar" onClick={() => removeTask(t._id)}>
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {showInactivityWarning &&
        createPortal(
          <>
            <style>{`
              @keyframes inactivity-fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes inactivity-pop-in {
                from { opacity: 0; transform: scale(0.9) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
              @keyframes inactivity-pulse-border {
                0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
                50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
              }
            `}</style>
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(3px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2147483647,
                animation: "inactivity-fade-in 0.2s ease-out",
              }}
            >
              <div
                style={{
                  background: "#161b22",
                  border: "2px solid #ef4444",
                  borderRadius: "12px",
                  padding: "28px",
                  width: "90%",
                  maxWidth: "380px",
                  textAlign: "center",
                  boxShadow: "0px 12px 32px rgba(0,0,0,0.7)",
                  animation:
                    "inactivity-pop-in 0.25s ease-out, inactivity-pulse-border 2s ease-in-out infinite",
                }}
              >
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>⚠️</div>
                <h3 style={{ margin: "0 0 12px", color: "#f0f6fc", fontSize: "20px" }}>
                  ¿Sigues ahí?
                </h3>
                <p style={{ color: "#c9d1d9", marginBottom: "20px", fontSize: "14px" }}>
                  Tu sesión se cerrará por inactividad en{" "}
                  <strong style={{ color: "#ef4444", fontSize: "18px" }}>{secondsLeft}</strong>{" "}
                  segundos.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn"
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      background: "#238636",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                    }}
                    onClick={stayConnected}
                  >
                    Seguir conectado
                  </button>
                  <button
                    type="button"
                    className="btn danger"
                    style={{
                      flex: 1,
                      padding: "12px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                    }}
                    onClick={logout}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
