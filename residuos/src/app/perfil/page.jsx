"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import TopNav from "../componentes/TopNav";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { buildDaySlots } from "../lib/slots";

/* ---------- Utilidades ---------- */
function parseISO(d) { // "YYYY-MM-DD" -> Date
  const [y,m,dd] = d.split("-").map(Number);
  return new Date(y, m-1, dd);
}
const fmtHour = (h) => h;

/* ---------- Página ---------- */
export default function PerfilPage(){
  /* Cargar Bootstrap JS sólo en cliente para el modal */
  const [bs, setBs] = useState(null);
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then(mod => setBs(mod));
  }, []);

// ---- Reprogramar ----
const [reprogIdx, setReprogIdx] = useState(null); // índice de la reserva a editar
const [reprogDate, setReprogDate] = useState(new Date());
const [reprogDay, setReprogDay] = useState(() => buildDaySlots(new Date()));
const [reprogSlot, setReprogSlot] = useState(null);

useEffect(() => { setReprogDay(buildDaySlots(reprogDate)); }, [reprogDate]);

const openReprogModal = (idx) => {
  setReprogIdx(idx);
  // inicializa con la fecha original de la reserva
  const r = futuras[idx];
  const parts = r.booking.date.split("-").map(Number);
  const d = new Date(parts[0], parts[1]-1, parts[2]);
  setReprogDate(d);
  setReprogDay(buildDaySlots(d));
  setReprogSlot(null);

  const el = document.getElementById("reprogModal");
  if (bs?.Modal && el) {
    const m = el._instance ?? new bs.Modal(el);
    el._instance = m; m.show();
  }
};

const confirmReprog = () => {
  if (reprogIdx == null || !reprogSlot) return;

  // clona el array general de reservas y reemplaza la seleccionada
  const all = [...reservas];
  // localizar el objeto exacto a partir de 'futuras' (pueden tener orden distinto al de 'reservas')
  const target = futuras[reprogIdx];
  const pos = all.findIndex(
    r => r.booking.date === target.booking.date && r.booking.time === target.booking.time
  );

  if (pos >= 0) {
    all[pos] = {
      ...all[pos],
      booking: {
        ...all[pos].booking,
        date: reprogDay.date,
        time: reprogSlot.time
      }
    };
    setReservas(all);
    localStorage.setItem("reservas", JSON.stringify(all));
  }

  document.getElementById("reprogModal")?._instance?.hide();
};

  /* Perfil editable */
  const [perfil, setPerfil] = useState({ direccion:"", telefono:"", barrio:"" });
  useEffect(() => {
    const saved = localStorage.getItem("perfil_usuario");
    if (saved) setPerfil(JSON.parse(saved));
    else setPerfil({ direccion:"Calle 123 #45-67", telefono:"3001234567", barrio:"El Poblado" });
  }, []);
  const savePerfil = (p) => {
    setPerfil(p);
    localStorage.setItem("perfil_usuario", JSON.stringify(p));
  };

  /* Editar campo en modal */
  const [editField, setEditField] = useState(null); // "direccion" | "telefono" | "barrio"
  const [editValue, setEditValue] = useState("");
  const openEdit = (fieldKey) => {
    setEditField(fieldKey);
    setEditValue(perfil[fieldKey] ?? "");
    const el = document.getElementById("editModal");
    if (bs?.Modal && el) {
      const instance = el._instance ?? new bs.Modal(el);
      el._instance = instance;
      instance.show();
    }
  };
  const confirmEdit = () => {
    const next = { ...perfil, [editField]: editValue };
    savePerfil(next);
    document.getElementById("editModal")?._instance?.hide();
  };

  /* Reservas: mover ultima_reserva -> reservas y dividir en futuras/pasadas */
  const [reservas, setReservas] = useState([]);
  useEffect(() => {
    const raw = localStorage.getItem("reservas");
    const arr = raw ? JSON.parse(raw) : [];

    const u = localStorage.getItem("ultima_reserva");
    if (u) {
      const ultima = JSON.parse(u);
      arr.push(ultima); // agrega lo recién agendado
      localStorage.removeItem("ultima_reserva");
      localStorage.setItem("reservas", JSON.stringify(arr));
    }
    setReservas(arr);
  }, []);

  const hoy = new Date();
  const [futuras, pasadas] = useMemo(() => {
    const fut = [], pas = [];
    for (const r of reservas) {
      const d = parseISO(r.booking.date);
      // si quieres considerar la hora exacta, podrías combinarla aquí
      (d >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) ? fut.push(r) : pas.push(r);
    }
    // ordena por fecha/hora
    fut.sort((a,b)=>a.booking.date.localeCompare(b.booking.date));
    pas.sort((a,b)=>b.booking.date.localeCompare(a.booking.date));
    return [fut, pas];
  }, [reservas]);

  /* Informe: filtrar por mes y agrupar por tipo de residuo (cantidad) */
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth()+1).padStart(2,"0");
    return `${y}-${m}`; // "YYYY-MM"
  });

  const dataChart = useMemo(() => {
    const acc = new Map(); // producto -> cantidad total
    for (const r of reservas) {
      if (!r?.booking) continue;
      const d = r.booking.date;              // "YYYY-MM-DD"
      const ym = d.slice(0,7);               // "YYYY-MM"
      if (ym !== mesSeleccionado) continue;
      for (const it of r.booking.items ?? []) {
        const key = (it.producto || "Otro").trim() || "Otro";
        const qty = Number(it.cantidad || 0);
        acc.set(key, (acc.get(key) || 0) + (isNaN(qty) ? 0 : qty));
      }
    }
    return Array.from(acc.entries()).map(([name, total]) => ({ name, total }));
  }, [reservas, mesSeleccionado]);

  /* Helper de meses disponibles desde reservas */
  const mesesDisponibles = useMemo(() => {
    const set = new Set(reservas.map(r => (r.booking?.date || "").slice(0,7)).filter(Boolean));
    return Array.from(set).sort();
  }, [reservas]);

  return (
    <div
      className="auth-bg"
      style={{ background: 'url("/principal.png") center/cover no-repeat fixed', minHeight:"100vh" }}
    >
      <div className="container">
        <TopNav/>
        {/* Encabezados de secciones */}
        <div className="row g-3">
          {/* Columna izquierda: info editable */}
          <div className="col-12 col-lg-6">
            <div className="mb-2 px-3 py-2 rounded-3" style={{background:"rgba(0,0,0,.55)", color:"#fff"}}>
              <div className="d-flex justify-content-between">
                <strong>Tu información</strong>
                <span className="text-muted"> </span>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{background:"rgba(255,255,255,.92)"}}>
              {[
                {label:"Dirección", key:"direccion"},
                {label:"Teléfono",  key:"telefono"},
                {label:"Barrio",    key:"barrio"},
              ].map((f)=>(
                <div key={f.key}
                     className="d-flex align-items-center justify-content-between border-bottom py-3">
                  <div>
                    <div className="text-muted small">{f.label}</div>
                    <div className="fw-semibold">{perfil[f.key]}</div>
                  </div>
                  <button className="btn btn-brand" style={{width:110}}
                          onClick={()=>openEdit(f.key)}>Editar</button>
                </div>
              ))}
            </div>

            <div className="mt-3 mb-2 px-3 py-2 rounded-3" style={{background:"rgba(0,0,0,.55)", color:"#fff"}}>
              <strong>Tu informe</strong>
            </div>

            <div className="p-3 rounded-3" style={{background:"rgba(255,255,255,.92)"}}>
              <div className="d-flex align-items-center gap-2 mb-3">
                <label className="me-2 fw-semibold">Filtrar por mes:</label>
                <select className="form-select pill" style={{maxWidth:220}}
                        value={mesSeleccionado}
                        onChange={e=>setMesSeleccionado(e.target.value)}>
                  {mesesDisponibles.length === 0 && (
                    <option value={mesSeleccionado}>{mesSeleccionado}</option>
                  )}
                  {mesesDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div style={{width:"100%", height:260}}>
                <ResponsiveContainer>
                  <BarChart data={dataChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#66C261" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Columna derecha: programadas / pasadas */}
          <div className="col-12 col-lg-6">
            <div className="mb-2 px-3 py-2 rounded-3" style={{background:"rgba(0,0,0,.55)", color:"#fff"}}>
              <div className="d-flex justify-content-between">
                <strong>Recolecciones futuras</strong>
              </div>
            </div>

            <div className="p-3 rounded-3" style={{background:"rgba(255,255,255,.92)"}}>
              {futuras.length === 0 && <div className="text-muted">No tienes recolecciones próximas.</div>}
              {futuras.map((r, i)=>(
                <div key={i}
                  className="d-flex align-items-center justify-content-between border-bottom py-3">
                  <strong>{r.booking.date} — {fmtHour(r.booking.time)}</strong>
                  <div className="d-flex gap-2">
                   <button
                        className="btn btn-brand"
                        style={{width:130, background:"#6c757d"}}
                        onClick={()=>openReprogModal(i)}>
                        Reprogramar
                    </button>
                    <button className="btn btn-brand" style={{width:120, background:"#dc3545"}}
                      onClick={()=>{
                        const filtered = reservas.filter((x)=>x!==r);
                        setReservas(filtered);
                        localStorage.setItem("reservas", JSON.stringify(filtered));
                      }}>Cancelar</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 mb-2 px-3 py-2 rounded-3" style={{background:"rgba(0,0,0,.55)", color:"#fff"}}>
              <strong>Recolecciones pasadas</strong>
            </div>

            <div className="p-3 rounded-3" style={{background:"rgba(255,255,255,.92)"}}>
              {pasadas.length === 0 && <div className="text-muted">Aún no hay historial.</div>}
              {pasadas.map((r, i)=>(
                <div key={i} className="border-bottom py-2">
                  <strong>{r.booking.date} — {fmtHour(r.booking.time)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
              {/* Modal Reprogramar */}
<div className="modal fade" id="reprogModal" tabIndex="-1" aria-hidden="true">
  <div className="modal-dialog modal-lg modal-dialog-centered">
    <div className="modal-content"
         style={{ background: "rgba(0,0,0,.9)", color: "#fff", borderRadius: 18 }}>
      <div className="modal-header border-0">
        <h5 className="modal-title">Reprogramar recolección</h5>
        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"/>
      </div>

      <div className="modal-body">
        <div className="row g-3">
          {/* Calendario */}
          <div className="col-12 col-md-6 d-flex justify-content-center">
            <Calendar
              onChange={setReprogDate}
              value={reprogDate}
              locale="es-ES"
              minDetail="month"
              next2Label={null}
              prev2Label={null}
            />
          </div>

          {/* Lista de horarios */}
          <div className="col-12 col-md-6">
            <div className="p-2 rounded-3" style={{background:"rgba(255,255,255,.12)"}}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Horarios para {reprogDay.date}</strong>
              </div>
              <ul className="list-group">
                {reprogDay.slots.map((s, idx)=>(
                  <li key={idx}
                      className="list-group-item d-flex justify-content-between align-items-center"
                      style={{
                        background:"transparent",
                        color:"#fff",
                        border:"none",
                        borderBottom:"1px solid rgba(255,255,255,.15)"
                      }}>
                    <span className="fw-semibold">{s.time}</span>
                    <button
                      className={`btn ${reprogSlot?.time===s.time ? "btn-light":"btn-brand"}`}
                      style={{width:120, padding:".45rem 1rem"}}
                      onClick={()=>setReprogSlot(s)}
                    >
                      {reprogSlot?.time===s.time ? "Seleccionado" : "Elegir"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer border-0">
        <button
          className="btn btn-brand"
          style={{width:160}}
          disabled={!reprogSlot}
          onClick={confirmReprog}
        >
          Guardar cambios
        </button>
      </div>
    </div>
  </div>
</div>

      {/* Modal editar */}
      <div className="modal fade" id="editModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content"
               style={{ background: "rgba(0,0,0,.85)", color: "#fff", borderRadius: 18 }}>
            <div className="modal-header border-0">
              <h5 className="modal-title">Editar {editField}</h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"/>
            </div>
            <div className="modal-body">
              <input className="form-control pill"
                     value={editValue}
                     onChange={(e)=>setEditValue(e.target.value)}
                     placeholder={`Nuevo valor para ${editField}`} />
            </div>
            <div className="modal-footer border-0">
              <button className="btn btn-brand" onClick={confirmEdit} style={{width:140}}>Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
