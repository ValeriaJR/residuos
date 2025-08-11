"use client";

import { useEffect, useMemo, useState } from "react";

// ====== Datos simulados ======
const MOCK = [
  {
    id: "PK-001",
    date: "2025-07-14",
    barrio: "El Poblado",
    direccion: "Cra 43A #1-50",
    tipo: "Domiciliario",
    estado: "Pendiente",
    items: [
      { producto: "Plástico", peso: "2.5", cantidad: "4" },
      { producto: "Cartón", peso: "1.0", cantidad: "2" },
    ],
  },
  {
    id: "PK-002",
    date: "2025-07-14",
    barrio: "Laureles",
    direccion: "Circular 2 #73",
    tipo: "Domiciliario",
    estado: "Pendiente",
    items: [{ producto: "Vidrio", peso: "5.0", cantidad: "1" }],
  },
  {
    id: "PK-003",
    date: "2025-07-15",
    barrio: "Belén",
    direccion: "Cll 30 #75",
    tipo: "Comercial",
    estado: "Pendiente",
    items: [{ producto: "Orgánico", peso: "8.0", cantidad: "3" }],
  },
];

export default function RecolectorPage() {
  const [list, setList] = useState(MOCK);

  // Cargar datos del localStorage si existen
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recolecciones_asignadas");
      if (saved) {
        setList(JSON.parse(saved));
      }
    }
  }, []);

  // Filtros
  const [fDate, setFDate] = useState("");
  const [fBarrio, setFBarrio] = useState("");

 const filtered = useMemo(() => {
    return list
      .filter((r) => r.estado === "Pendiente")
      .filter((r) => {
        const byDate = fDate ? r.date === fDate : true;
        const byBarrio = fBarrio
          ? r.barrio.toLowerCase().includes(fBarrio.toLowerCase())
          : true;
        return byDate && byBarrio;
      });
  }, [list, fDate, fBarrio]);
  // Estado del modal
  const [current, setCurrent] = useState(null);
  const [obs, setObs] = useState("");

  const openModal = (row) => {
    setCurrent(row);
    setObs(row.observaciones || "");
  };

  const closeModal = () => {
    setCurrent(null);
    setObs("");
  };

  const onRecolectar = () => {
    if (!current) return;

    const updated = { ...current, estado: "Recolectado", observaciones: obs };
    const next = list.map((r) => (r.id === current.id ? updated : r));
    setList(next);

    // Guardar en histórico
    const done = JSON.parse(localStorage.getItem("recolecciones_realizadas") || "[]");
    localStorage.setItem("recolecciones_realizadas", JSON.stringify([...done, updated]));

    closeModal();
  };

  return (
    <div
      className="auth-bg"
      style={{
        background: 'url("/principal.png") center/cover no-repeat fixed',
        minHeight: "100vh",
      }}
    >
      <div className="container py-4">

        {/* Barra superior */}
        <header className="topbar mb-4">
          <nav
            className="topbar-inner d-flex justify-content-end"
            style={{ padding: "1rem" }}
          >
            <button
              className=" nav-pill"
              onClick={() => (location.href = "/login")}
            >
              Cerrar sesión
            </button>
          </nav>
        </header>

        {/* Filtros */}
        <div
          className="d-flex align-items-center gap-4 mb-3 px-3 py-2 rounded-3"
          style={{ background: "rgba(255,255,255,.92)" }}
        >
          <div className="d-flex align-items-center gap-2">
            <strong>filtrar por fecha:</strong>
            <input
              type="date"
              className="form-control pill"
              style={{ maxWidth: 200 }}
              value={fDate}
              onChange={(e) => setFDate(e.target.value)}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <strong>filtrar por barrio:</strong>
            <input
              className="form-control pill"
              placeholder="Barrio…"
              style={{ maxWidth: 220 }}
              value={fBarrio}
              onChange={(e) => setFBarrio(e.target.value)}
            />
          </div>
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
              <div className="col-2">Tipo</div>
              <div className="col-3">Residuo</div>
              <div className="col-2 text-end">Estado</div>
            </div>
          </div>

          <div className="px-3">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="row align-items-center py-3 border-bottom"
                style={{ borderColor: "#eee" }}
              >
                <div className="col-2">
                  <strong>{r.barrio}</strong>
                </div>
                <div className="col-3">{r.direccion}</div>
                <div className="col-2">{r.tipo}</div>
                <div className="col-3">
                  {r.items.map((it, i) => (
                    <span key={i} className="me-2">
                      {it.producto}
                      {i < r.items.length - 1 ? "," : ""}
                    </span>
                  ))}
                </div>
                <div className="col-2 d-flex justify-content-end">
                  <button
                    className="btn btn-brand"
                    style={{ width: 120 }}
                    onClick={() => openModal(r)}
                  >
                    Verificar
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center text-muted py-4">Sin resultados.</div>
            )}
          </div>
        </div>

        {/* ===== Modal Verificar (Controlado por React) ===== */}
        {current && (
          <div
            className="modal fade show d-block"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.7)",
              zIndex: 1050,
              overflowY: "auto",
            }}
            tabIndex="-1"
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "500px" }}
            >
              <div
                className="modal-content"
                style={{
                  background: "rgba(0,0,0,.88)",
                  color: "#fff",
                  borderRadius: "18px",
                  border: "none",
                }}
              >
                <div className="modal-header border-0">
                  <h5 className="modal-title">
                    Compruebe los residuos — {current.barrio}, {current.direccion}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeModal}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body">
                  {/* Tabla de items */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ background: "rgba(255,255,255,.15)" }}
                  >
                    <div className="row fw-bold mb-2">
                      <div className="col">Producto</div>
                      <div className="col">Peso</div>
                      <div className="col">Cantidad</div>
                    </div>
                    {current.items.map((it, i) => (
                      <div className="row mb-1" key={i}>
                        <div className="col">{it.producto}</div>
                        <div className="col">{it.peso}</div>
                        <div className="col">{it.cantidad}</div>
                      </div>
                    ))}
                  </div>

                  <label className="fw-bold mb-1">Observaciones</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Notas del recolector (opcional)"
                    value={obs}
                    onChange={(e) => setObs(e.target.value)}
                    style={{ background: "#fff", color: "#000", borderRadius: "8px" }}
                  />
                </div>

                <div className="modal-footer border-0 d-flex justify-content-center">
                  <button
                    className="btn btn-brand"
                    style={{ width: 160 }}
                    onClick={onRecolectar}
                  >
                    Recolectar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay adicional para backdrop */}
        {current && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}
      </div>
    </div>
  );
}