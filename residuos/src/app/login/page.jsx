"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage(){
  const [mode, setMode] = useState("login");
  const router = useRouter();

  const onSubmitLogin = (e) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  const onSubmitRegister = (e) => {
    e.preventDefault();
    setMode("login");
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Toggle */}
        <div className="auth-toggle">
          <button
            className={mode==="login" ? "active" : ""}
            onClick={()=>setMode("login")}
            type="button"
          >
            Iniciar sesión
          </button>
          <button
            className={mode==="register" ? "active" : ""}
            onClick={()=>setMode("register")}
            type="button"
          >
            Registrarme
          </button>
        </div>

        <h3 className="auth-title">BIENVENIDO</h3>

        {mode === "login" ? (
          <form onSubmit={onSubmitLogin} style={{ width: "100%" }}>
            <div className="mb-3">
              <input className="form-control pill" placeholder="Usuario" required />
            </div>
            <div className="mb-4">
              <input className="form-control pill" type="password" placeholder="Contraseña" required />
            </div>
            <button className="btn btn-brand" type="submit">Ingresar</button>
          </form>
        ) : (
          <form onSubmit={onSubmitRegister} style={{ width: "100%" }}>
            <div className="mb-2"><input className="form-control pill" placeholder="Nombre" required /></div>
            <div className="mb-2"><input className="form-control pill" type="email" placeholder="Correo electrónico" required /></div>
            <div className="mb-2"><input className="form-control pill" placeholder="Documento de identidad" required /></div>
            <div className="mb-2"><input className="form-control pill" placeholder="Dirección" required /></div>
            <div className="mb-2"><input className="form-control pill" placeholder="Barrio" required /></div>
            <div className="mb-4"><input className="form-control pill" placeholder="Teléfono" required /></div>
            <button className="btn btn-brand" type="submit">Registrar</button>
          </form>
        )}
      </div>
    </div>
  );
}
