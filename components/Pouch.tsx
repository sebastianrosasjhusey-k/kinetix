type Props = { name: string; variant: string; style: string; colorA: string; colorB: string; size?: string; label?: boolean };

/** Dibujo del empaque con los colores de cada sabor. */
export function Pouch({ name, variant, style, colorA, colorB, size, label = true }: Props) {
  const a = `#${colorA}`, b = `#${colorB}`;
  const aria = label ? { role: "img", "aria-label": `${name} ${variant}` } : { "aria-hidden": true };
  if (style === "cream") {
    return (
      <svg viewBox="0 0 160 220" {...aria}>
        <rect width="160" height="220" rx="10" fill="#FDF3DC" />
        <circle cx="150" cy="10" r="72" fill={a} />
        <circle cx="130" cy="220" r="62" fill={b} />
        <circle cx="118" cy="150" r="34" fill={b} />
        <text x="14" y="38" fontSize="12" letterSpacing="3" fill="#141414" fontFamily="Fira Sans,Arial">KINETIX</text>
        <text x="12" y="92" fontSize="34" fontWeight="900" fontStyle="italic" fill="#141414" fontFamily="Arial Black,Arial">{name}</text>
        <text x="14" y="120" fontSize="13" fontWeight="600" fill={a} fontFamily="Fira Sans,Arial">{variant}</text>
        <text x="14" y="196" fontSize="24" fontWeight="800" fill="#141414" fontFamily="Arial">34</text>
      </svg>
    );
  }
  const dark = style === "dark";
  const fg = dark ? "#FFFFFF" : "#141414";
  return (
    <svg viewBox="0 0 160 220" {...aria}>
      <rect width="160" height="220" rx="10" fill={dark ? "#231F20" : "#FFFFFF"} stroke="#DDD8CC" />
      <polygon points="108,60 170,60 170,76 122,76" fill={a} />
      <polygon points="62,230 150,100 175,100 175,230" fill={a} opacity=".85" />
      <text x="14" y="38" fontSize="12" letterSpacing="3" fill={fg} fontFamily="Fira Sans,Arial">KINETIX</text>
      <text x="12" y="92" fontSize={name.length > 4 ? 26 : 40} fontWeight="900" fontStyle="italic" fill={fg} fontFamily="Arial Black,Arial">{name}</text>
      <text x="14" y="112" fontSize="11" fontWeight="600" fill={a} fontFamily="Fira Sans,Arial">{variant}</text>
      <text x="14" y="196" fontSize="13" fontWeight="700" fill={fg} fontFamily="Arial">{size?.split(" ·")[0] ?? "100 g"}</text>
    </svg>
  );
}
