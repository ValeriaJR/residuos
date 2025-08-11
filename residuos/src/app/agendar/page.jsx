"use client";

import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import TopNav from "../componentes/TopNav";
import { buildDaySlots } from "../lib/slots"

export default function AgendarPage() {
  const [bs, setBs] = useState(null);
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then((mod) => {
      setBs(mod); // mod.Modal queda disponible
    });
  }, []);
  const [date, setDate] = useState(new Date());
  const [day, setDay] = useState(() => buildDaySlots(new Date()));
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Modal refs
  const [modal, setModal] = useState(null);

  useEffect(() => {
    setDay(buildDaySlots(date));
  }, [date]);

  // Abrir modal de “Describe tu(s) residuo(s)”
 const openModal = (slot) => {
    setSelectedSlot(slot);
    const el = document.getElementById("residuosModal");
    if (bs?.Modal && el) {
      // reutiliza si ya existe
      const instance = el._instance ?? new bs.Modal(el);
      el._instance = instance;
      instance.show();
    }
  };
  // Grilla dinámica (filas)
  const [rows, setRows] = useState([{ producto: "", peso: "", cantidad: "" }]);

  const addRow = () => setRows((r) => [...r, { producto: "", peso: "", cantidad: "" }]);
  const removeRow = () => setRows((r) => (r.length > 1 ? r.slice(0, -1) : r));
  const updateCell = (i, key, val) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: val } : row)));

  // Guardar: simula JSON y persiste en localStorage para la “próxima vista”
  const onSave = () => {
    const payload = {
      booking: {
        date: day.date,          // "YYYY-MM-DD"
        time: selectedSlot.time, // "HH:MM"
        items: rows              // [{producto, peso, cantidad}]
      }
    };
    localStorage.setItem("ultima_reserva", JSON.stringify(payload));
    // feedback simple:
    alert("¡Agendado! Se guardó su solicitud.");
   const el = document.getElementById("residuosModal");
    el?._instance?.hide();

    setRows([{ producto: "", peso: "", cantidad: "" }]);
  };
  const humanDate = useMemo(() =>
    new Date(day.date + "T00:00:00").toLocaleDateString("es-CO",
      { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  , [day.date]);

  return (
    <div
      className="auth-bg"
      style={{
        background: 'url("/principal.png") center/cover no-repeat fixed',
        minHeight: "100vh",
      }}
    >
      <div className="container">
        {/* Header simple */}
        <TopNav/>

        <div className="row g-4">
          {/* Calendario */}
          <div className="col-12 col-lg-5 d-flex justify-content-center">
            <Calendar
              onChange={setDate}
              value={date}
              locale="es-ES"
              minDetail="month"
              next2Label={null}
              prev2Label={null}
            />
          </div>

          {/* Lista de horarios */}
          <div className="col-8 col-lg-6">
            <div
              className="p-3"
              style={{
                background: "rgba(255,255,255,.92)",
                borderRadius: 16,
                boxShadow: "0 10px 24px rgba(0,0,0,.18)",
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="m-0">Fechas programadas</h5>
                <small className="text-muted">{humanDate}</small>
              </div>

              {day.slots.length === 0 && (
                <div className="text-muted">No hay horarios disponibles.</div>
              )}

              <ul className="list-group">
                {day.slots.map((s, idx) => (
                  <li
                    key={idx}
                    className="list-group-item d-flex "
                    style={{ border: "none", borderBottom: "1px solid #eee" }}
                  >
                    <strong>{s.time}</strong>
                    <button
                      className="btn btn-brand"
                      style={{ width: 120, padding: ".45rem 1rem", display: "flex" , alignItems: "rigth" }}
                      disabled={!s.available}
                      onClick={() => openModal(s)}
                    >
                      Agendar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <div
        className="modal fade"
        id="residuosModal"
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content"
            style={{ background: "rgba(0,0,0,.85)", color: "#fff", borderRadius: 18 }}
          >
            <div className="modal-header border-0">
              <h5 className="modal-title">
                Describe tu(s) residuo(s) — {day.date} {selectedSlot && `• ${selectedSlot.time}`}
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"/>
            </div>

            <div className="modal-body">
              <div
                className="p-3"
                style={{ background: "rgba(255,255,255,.18)", borderRadius: 12 }}
              >
                <div className="row fw-bold mb-2">
                  <div className="col">Producto</div>
                  <div className="col">Peso</div>
                  <div className="col">Cantidad</div>
                </div>

                {rows.map((row, i) => (
                  <div className="row g-2 mb-2" key={i}>
                    <div className="col">
                      <input
                        className="form-control pill"
                        placeholder="Ej. Plástico"
                        value={row.producto}
                        onChange={(e) => updateCell(i, "producto", e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <input
                        className="form-control pill"
                        placeholder="Kg"
                        value={row.peso}
                        onChange={(e) => updateCell(i, "peso", e.target.value)}
                      />
                    </div>
                    <div className="col">
                      <input
                        className="form-control pill"
                        placeholder="Unidades"
                        value={row.cantidad}
                        onChange={(e) => updateCell(i, "cantidad", e.target.value)}
                      />
                    </div>
                  </div>
                ))}

                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button className="btn btn-brand" style={{ width: 130 }} onClick={addRow}>Añadir</button>
                  <button className="btn btn-brand" style={{ width: 130, background: "#6c757d" }} onClick={removeRow}>Eliminar</button>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0 d-flex justify-content-center">
              <button className="btn btn-brand" style={{ width: 180 }} onClick={onSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
