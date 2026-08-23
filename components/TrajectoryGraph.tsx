import { toleranceEllipse, type ReferencePopulation } from "@/lib/biva-engine";

interface TrajectoryPoint {
  x: number;
  y: number;
  date: string;
}

export default function TrajectoryGraph({ population, points }: { population: ReferencePopulation; points: TrajectoryPoint[] }) {
  const ellipses = [50, 75, 95].map((p) => toleranceEllipse(population, p as 50 | 75 | 95));
  const e95 = ellipses[2];

  const W = 600;
  const H = 460;
  const padding = 56;

  const theta95 = (e95.rotationDeg * Math.PI) / 180;
  const extentX = Math.sqrt(e95.semiAxisMajor ** 2 * Math.cos(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.sin(theta95) ** 2);
  const extentY = Math.sqrt(e95.semiAxisMajor ** 2 * Math.sin(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.cos(theta95) ** 2);
  const margin = 1.3;

  let rMin = population.meanX - extentX * margin;
  let rMax = population.meanX + extentX * margin;
  let yMin = population.meanY - extentY * margin;
  let yMax = population.meanY + extentY * margin;
  points.forEach((p) => {
    if (p.x < rMin) rMin = p.x - extentX * 0.15;
    if (p.x > rMax) rMax = p.x + extentX * 0.15;
    if (p.y < yMin) yMin = p.y - extentY * 0.15;
    if (p.y > yMax) yMax = p.y + extentY * 0.15;
  });

  const sx = (x: number) => padding + ((x - rMin) / (rMax - rMin)) * (W - 2 * padding);
  const sy = (y: number) => H - padding - ((y - yMin) / (yMax - yMin)) * (H - 2 * padding);

  function ellipsePath(e: typeof e95): string {
    const th = (e.rotationDeg * Math.PI) / 180;
    const cosT = Math.cos(th);
    const sinT = Math.sin(th);
    const n = 72;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 * Math.PI;
      const localX = e.semiAxisMajor * Math.cos(t);
      const localY = e.semiAxisMinor * Math.sin(t);
      const dataX = e.centerX + localX * cosT - localY * sinT;
      const dataY = e.centerY + localX * sinT + localY * cosT;
      d += (i === 0 ? "M" : "L") + sx(dataX).toFixed(2) + "," + sy(dataY).toFixed(2) + " ";
    }
    return d + "Z";
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Traiettoria del vettore nel tempo</div>
      <div style={{ fontSize: 12, color: "#8a8578", marginBottom: 12 }}>Ellisse: {population.label}</div>

      <svg width={W} height={H} style={{ background: "#fafaf8", border: "1px solid #eeece5", borderRadius: 3 }}>
        <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#c9c5b8" />
        <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#c9c5b8" />
        <text x={W / 2} y={H - 18} fontSize="11" fill="#8a8578" textAnchor="middle">R/H (Ω/m)</text>
        <text x={18} y={H / 2} fontSize="11" fill="#8a8578" textAnchor="middle" transform={`rotate(-90 18 ${H / 2})`}>Xc/H (Ω/m)</text>

        {ellipses.map((e, i) => (
          <path key={e.percentile} d={ellipsePath(e)} fill="none" stroke={["#3d7a5c", "#b8873a", "#b23a3a"][i]} strokeWidth={i === 2 ? 1.8 : 1.2} strokeDasharray={i < 2 ? "4 3" : "none"} />
        ))}
        <circle cx={sx(population.meanX)} cy={sy(population.meanY)} r={2.5} fill="#6b6558" />

        {points.length > 1 && (
          <polyline
            points={points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
            fill="none"
            stroke="#4a7ab5"
            strokeWidth={1.4}
            strokeDasharray="2 3"
          />
        )}

        {points.map((p, i) => {
          const isLast = i === points.length - 1;
          return (
            <g key={i}>
              <circle
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={isLast ? 7 : 5}
                fill={isLast ? "#c15a2e" : "#4a7ab5"}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text x={sx(p.x)} y={sy(p.y) - 11} fontSize="9" fill="#5a564c" textAnchor="middle">{i + 1}</text>
            </g>
          );
        })}
      </svg>

      <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#8a8578" }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#4a7ab5", marginRight: 4 }} />Misurazioni precedenti</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#c15a2e", marginRight: 4 }} />Più recente</span>
      </div>
      <div style={{ fontSize: 11, color: "#a39d8a", marginTop: 6 }}>
        {points.map((p, i) => `${i + 1}: ${new Date(p.date).toLocaleDateString("it-IT")}`).join(" · ")}
      </div>
    </div>
  );
}
