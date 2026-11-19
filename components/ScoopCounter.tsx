"use client";
import { useState } from "react";

export function ScoopCounter() {
  const [n, setN] = useState(2);
  return (
    <div className="mini">
      <div>
        <h3 className="disp">Prueba otra cantidad</h3>
        <p>Elige cuántos scoops quieres y mira cuánto aportan.</p>
        <div className="qty" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setN(Math.max(1, n - 1))} aria-label="Menos scoops" style={{ width: 44, height: 44 }}>−</button>
          <span aria-live="polite" style={{ minWidth: 80 }}>{n} {n === 1 ? "scoop" : "scoops"}</span>
          <button type="button" onClick={() => setN(Math.min(6, n + 1))} aria-label="Más scoops" style={{ width: 44, height: 44 }}>+</button>
        </div>
      </div>
      <div className="out">
        <div><b>{25 * n} g</b><i>carbohidratos</i></div>
        <div><b>{200 * n} mg</b><i>sodio</i></div>
      </div>
    </div>
  );
}
