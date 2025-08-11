"use client";

import { useEffect, useMemo, useState } from "react";

/* ===== Datos simulados ===== */
const SOLICITUDES_MOCK = [
  {
    id: "SOL-1001",
    barrio: "El Poblado",
    direccion: "Cra 43A #1-50",
    fecha: "2025-07-14",
    tipo: "Domiciliario",
    residuos: ["Plástico", "Cartón"],
    estado: "Pendiente",
    asignadoA: null,
  },
  {
    id: "SOL-1002",
    barrio: "Laureles",
    direccion: "Circular 2 #73",
    fecha: "2025-07-15",
    tipo: "Comercial",
    residuos: ["Vidrio"],
    estado: "Pendiente",
    asignadoA: null,
  },
];

const RECOLECTORES_MOCK = [
  { id: "R-01", nombre: "Ana López", zona: "El Poblado" },
  { id: "R-02", nombre: "Carlos Pérez", zona: "Laureles" },
  { id: "R-03", nombre: "Julián Ríos", zona: "Belén" },
];

export default function AdminAsignarPage() {
  const [bs, setBs] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("bootstrap").then((mod) => setBs(mod));
  }, []);

  const [solicitudes, setSolicitudes] = useState(SOLICITUDES_MOCK);
  useEffect(() => {
    const saved = localStorage.getItem("admin_solicitudes");
    if (saved) setSolicitudes(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem("admin_solicitudes", JSON.stringify(solicitudes));
  }, [solicitudes]);

  const [fResiduo, setFResiduo] = useState("");
  const filtered = useMemo(() => {
    const q = fResiduo.trim().toLowerCase();
    if (!q) return solicitudes;
    return solicitudes.filter((s) =>
      s.residuos.some((r) => r.toLowerCase().includes(q))
    );
  }, [solicitudes, fResiduo]);

  const [selectedSol, setSelectedSol] = useState(null);
  const [collectorId, setCollectorId] = useState("");
  const openAssign = (sol) => {
    setSelectedSol(sol);
    setCollectorId(sol.asignadoA?.id || "");
    const el = document.getElementById("assignModal");
    if (el && bs?.Modal) {
      const m = bs.Modal.getInstance(el) || new bs.Modal(el);
      m.show();
      el._modal = m;
    }
  };
  const confirmAssign = () => {
    if (!selectedSol || !collectorId) return;
    const col = RECOLECTORES_MOCK.find((c) => c.id === collectorId);
    const next = solicitudes.map((s) =>
      s.id === selectedSol.id
        ? { ...s, asignadoA: col, estado: "Asignado" }
        : s
    );
    setSolicitudes(next);

    const asigs = JSON.parse(localStorage.getItem("asignaciones") || "[]");
    asigs.push({
      solicitudId: selectedSol.id,
      recolector: col,
      fecha: new Date().toISOString(),
    });
    localStorage.setItem("asignaciones", JSON.stringify(asigs));

    document.getElementById("assignModal")?._modal?.hide();
  };

  return (
    <>
      <div
        className="auth-bg"
        style={{
          background: 'url("/principal.png") center/cover no-repeat fixed',
          minHeight: "100vh",
        }}
      >
         <div className="container mt-4 pt-4">
          {/* Barra de navegación fija en la parte superior */}
        <header className="position-sticky top-0 w-100 my-5" style={{ zIndex: 1000 }}>
          <nav className="topbar-inner d-flex align-items-center justify-content-end gap-2 px-3 py-2">
            <a href="/admin/informes" className="nav-pill">
              Informes
            </a>
            <a href="/admin" className="nav-pill active">
              Asignar
            </a>
            <button
              className="nav-pill ms-auto"
              onClick={() => (location.href = "/login")}
            >
              Cerrar sesión
            </button>
          </nav>
        </header>

       
          {/* Filtro */}
          <div
            className="d-flex align-items-center gap-3 mb-3 px-3 py-2 rounded-3"
            style={{ background: "rgba(255,255,255,.92)" }}
          >
            <strong>Filtrar por tipo de residuo:</strong>
            <input
              className="form-control pill"
              style={{ maxWidth: 260 }}
              placeholder="Ej. plástico, vidrio…"
              value={fResiduo}
              onChange={(e) => setFResiduo(e.target.value)}
            />
          </div>

          {/* Tabla */}
          <div
            className="p-0 rounded-3 overflow-hidden"
            style={{ background: "rgba(255,255,255,.92)" }}
          >
            <div
              className="px-3 py-2 fw-bold"
              style={{ background: "rgba(0,0,0,.75)", color: "#fff" }}
            >
              <div className="row">
                <div className="col-2">Barrio</div>
                <div className="col-3">Dirección</div>
                <div className="col-2">Fecha</div>
                <div className="col-2">Tipo</div>
                <div className="col-2">Residuo</div>
                <div className="col-1 text-end">Acción</div>
              </div>
            </div>

            <div className="px-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="row align-items-center py-3 border-bottom"
                  style={{ borderColor: "#eee" }}
                >
                  <div className="col-2">
                    <strong>{s.barrio}</strong>
                  </div>
                  <div className="col-3">{s.direccion}</div>
                  <div className="col-2">{s.fecha}</div>
                  <div className="col-2">{s.tipo}</div>
                  <div className="col-2">
                    {s.residuos.map((r, i) => (
                      <span key={i} className="me-1">
                        {r}
                        {i < s.residuos.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                  <div className="col-1 d-flex justify-content-end">
                    {s.asignadoA ? (
                      <span className="text-success fw-bold">Asignado</span>
                    ) : (
                      <button
                        className="btn btn-brand"
                        style={{ width: 110 }}
                        onClick={() => openAssign(s)}
                      >
                        Asignar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-muted py-4">Sin resultados.</div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Asignar */}
        <div className="modal fade" id="assignModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div
              className="modal-content"
              style={{
                background: "rgba(0, 0, 0, 0.75)",
                color: "#fff",
                borderRadius: 18,
              }}
            >
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  Asignar recolector{" "}
                  {selectedSol ? `— ${selectedSol.barrio}, ${selectedSol.direccion}` : ""}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setSelectedSol(null)}
                />
              </div>
              <div className="modal-body">
                <div className="list-group">
                  {RECOLECTORES_MOCK.map((r) => (
                    <label
                      key={r.id}
                      className="list-group-item d-flex align-items-center justify-content-between"
                      style={{
                        background: "transparent",
                        color: "#fff",
                        borderColor: "rgba(238, 229, 229, 0.5)",
                        cursor: "pointer",
                      }}
                    >
                      <div>
                        <strong>{r.nombre}</strong>
                        <div className="small text-muted">Zona: {r.zona}</div>
                      </div>
                      <input
                        type="radio"
                        name="recolector"
                        value={r.id}
                        checked={collectorId === r.id}
                        onChange={(e) => setCollectorId(e.target.value)}
                        className="ms-2"
                      />
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-0 d-flex justify-content-center">
                <button
                  className="btn btn-brand"
                  style={{ width: 160 }}
                  disabled={!collectorId}
                  onClick={confirmAssign}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}