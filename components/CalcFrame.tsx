"use client";
import { useEffect, useRef } from "react";

/** La calculadora original vive en /public/calculadora.html; el marco crece con su contenido. */
export function CalcFrame() {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    let ro: ResizeObserver | undefined;
    const fit = () => {
      const d = f.contentDocument;
      if (!d?.body) return;
      const h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight);
      if (h > 300) f.style.height = `${h}px`;
    };
    const onLoad = () => {
      fit();
      ro?.disconnect();
      if (f.contentDocument?.body) {
        ro = new ResizeObserver(fit);
        ro.observe(f.contentDocument.body);
      }
    };
    f.addEventListener("load", onLoad);
    if (f.contentDocument?.readyState === "complete") onLoad();
    return () => {
      f.removeEventListener("load", onLoad);
      ro?.disconnect();
    };
  }, []);
  return <iframe ref={ref} className="calc-frame" src="/calculadora.html" title="Calculadora de plan de carrera Kinetix" />;
}
