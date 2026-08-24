import { toleranceEllipse, classifyVector, type ReferencePopulation, type Vector2D } from "@/lib/biva-engine";

const PATTERN_LABELS: Record<string, string> = {
  normale: "Normale",
  disidratazione: "Disidratazione",
  "iperidratazione-edema": "Iperidratazione / edema",
  "massa-cellulare-aumentata": "Massa cellulare aumentata",
  "massa-cellulare-ridotta": "Massa cellulare ridotta",
  "disidratazione-massa-aumentata": "Disidratazione + massa aumentata",
  "iperidratazione-massa-ridotta": "Iperidratazione + massa ridotta",
};

export default function RxcVectorGraph({
  title,
  subtitle,
  unit,
  pop,
  vector,
}: {
  title: string;
  subtitle: string;
  unit: string;
  pop: ReferencePopulation;
  vector: Vector2D;
}) {
  const ellipses = [50, 75, 95].map((p) => toleranceEllipse(pop, p as 50 | 75 | 95));
  const classification = classifyVector(vector, pop);

  const W = 460;
  const H = 440;
  const padding = 56;
  const e95 = ellipses[2];

  const theta95 = (e95.rotationDeg * Math.PI) / 180;
  const extentX = Math.sqrt(e95.semiAxisMajor ** 2 * Math.cos(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.sin(theta95) ** 2);
  const extentY = Math.sqrt(e95.semiAxisMajor ** 2 * Math.sin(theta95) ** 2 + e95.semiAxisMinor ** 2 * Math.cos(theta95) ** 2);
  const margin = 1.25;

  let rMin = pop.meanX - extentX * margin;
  let rMax = pop.meanX + extentX * margin;
  let yMin = pop.meanY - extentY * margin;
  let yMax = pop.meanY + extentY * margin;
  if (vector.x < rMin) rMin = vector.x - extentX * 0.15;
  if (vector.x > rMax) rMax = vector.x + extentX * 0.15;
  if (vector.y < yMin) yMin = vector.y - extentY * 0.15;
  if (vector.y > yMax) yMax = vector.y + extentY * 0.15;

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

  const statusColor =
    classification.distanceFromCenter95 > 1 ? "#b23a3a" : classification.pattern === "normale" ? "#3d7a5c" : "#b8873a";

  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d8", borderRadius: 4, padding: 20 }}>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#8a8578" }}>{subtitle}</div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 12 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="responsive-svg" style={{ maxWidth: W, background: "#fafaf8", border: "1px solid #eeece5", borderRadius: 3 }}>
          <line x1={padding} y1={H - padding} x2={W - padding} y2={H - padding} stroke="#c9c5b8" />
          <line x1={padding} y1={padding} x2={padding} y2={H - padding} stroke="#c9c5b8" />
          <text x={W / 2} y={H - 18} fontSize="11" fill="#8a8578" textAnchor="middle">x ({unit})</text>
          <text x={18} y={H / 2} fontSize="11" fill="#8a8578" textAnchor="middle" transform={`rotate(-90 18 ${H / 2})`}>y ({unit})</text>

          {ellipses.map((e, i) => (
            <path
              key={e.percentile}
              d={ellipsePath(e)}
              fill="none"
              stroke={["#3d7a5c", "#b8873a", "#b23a3a"][i]}
              strokeWidth={i === 2 ? 1.8 : 1.3}
              strokeDasharray={i < 2 ? "4 3" : "none"}
            />
          ))}

          <circle cx={sx(pop.meanX)} cy={sy(pop.meanY)} r={2.5} fill="#6b6558" />
          <line x1={sx(pop.meanX)} y1={sy(pop.meanY)} x2={sx(vector.x)} y2={sy(vector.y)} stroke={statusColor} strokeWidth={1.2} opacity={0.6} />
          <circle cx={sx(vector.x)} cy={sy(vector.y)} r={6} fill={statusColor} stroke="#fff" strokeWidth={2} />
        </svg>

        <div style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#8a8578" }}>x</span>
            <span style={{ fontWeight: 600 }}>{vector.x.toFixed(1)} {unit}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "#8a8578" }}>y</span>
            <span style={{ fontWeight: 600 }}>{vector.y.toFixed(1)} {unit}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 3, fontSize: 12, fontWeight: 600, color: "#fff", background: statusColor }}>
              {PATTERN_LABELS[classification.pattern] ?? classification.pattern}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#8a8578" }}>
            {classification.withinEllipse50
              ? "Entro il 50%"
              : classification.withinEllipse75
              ? "Tra 50% e 75%"
              : classification.withinEllipse95
              ? "Tra 75% e 95%"
              : "Fuori dal 95%"}
          </div>
        </div>
      </div>
    </div>
  );
}
