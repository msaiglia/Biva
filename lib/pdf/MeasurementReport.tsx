import React from "react";
import { Document, Page, View, Text, Svg, Path, Circle, Line, StyleSheet, Font } from "@react-pdf/renderer";
import {
  toleranceEllipse,
  classifyVector,
  type ReferencePopulation,
  type Vector2D,
  type BodyComposition,
} from "@/lib/biva-engine";

const PATTERN_LABELS: Record<string, string> = {
  normale: "Normale",
  disidratazione: "Disidratazione",
  "iperidratazione-edema": "Iperidratazione / edema",
  "massa-cellulare-aumentata": "Massa cellulare aumentata",
  "massa-cellulare-ridotta": "Massa cellulare ridotta",
  "disidratazione-massa-aumentata": "Disidratazione + massa aumentata",
  "iperidratazione-massa-ridotta": "Iperidratazione + massa ridotta",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#2a2a28" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1pt solid #e5e2d8", paddingBottom: 12 },
  brandLabel: { fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: "#8a8578", marginBottom: 3 },
  title: { fontSize: 18, fontWeight: 700 },
  metaRight: { fontSize: 9, color: "#8a8578", textAlign: "right" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 8, letterSpacing: 0.5, textTransform: "uppercase", color: "#8a8578", marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottom: "0.5pt solid #eeece5" },
  rowLabel: { color: "#5a564c" },
  rowValue: { fontWeight: 700 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap" },
  infoItem: { width: "33%", marginBottom: 8 },
  infoLabel: { fontSize: 8, color: "#8a8578" },
  infoValue: { fontSize: 11, fontWeight: 700, marginTop: 2 },
  badge: { fontSize: 10, fontWeight: 700, color: "#fff", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, alignSelf: "flex-start" },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7, color: "#a39d8a", textAlign: "center", borderTop: "0.5pt solid #eeece5", paddingTop: 6 },
  citation: { fontSize: 7, color: "#a39d8a", marginTop: 10, lineHeight: 1.5 },
});

function ellipseSvgPath(e: ReturnType<typeof toleranceEllipse>, sx: (x: number) => number, sy: (y: number) => number): string {
  const th = (e.rotationDeg * Math.PI) / 180;
  const cosT = Math.cos(th);
  const sinT = Math.sin(th);
  const n = 60;
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

function RxcGraph({ pop, vector, unit }: { pop: ReferencePopulation; vector: Vector2D; unit: string }) {
  const ellipses = [50, 75, 95].map((p) => toleranceEllipse(pop, p as 50 | 75 | 95));
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

  const W = 260;
  const H = 240;
  const pad = 24;
  const sx = (x: number) => pad + ((x - rMin) / (rMax - rMin)) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - yMin) / (yMax - yMin)) * (H - 2 * pad);

  const colors = ["#3d7a5c", "#b8873a", "#b23a3a"];
  const classification = classifyVector(vector, pop);
  const statusColor = classification.distanceFromCenter95 > 1 ? "#b23a3a" : classification.pattern === "normale" ? "#3d7a5c" : "#b8873a";

  return (
    <Svg width={W} height={H}>
      <Line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#c9c5b8" strokeWidth={0.5} />
      <Line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#c9c5b8" strokeWidth={0.5} />
      {ellipses.map((e, i) => (
        <Path key={e.percentile} d={ellipseSvgPath(e, sx, sy)} stroke={colors[i]} strokeWidth={i === 2 ? 1.4 : 1} fill="none" />
      ))}
      <Circle cx={sx(pop.meanX)} cy={sy(pop.meanY)} r={2} fill="#6b6558" />
      <Line x1={sx(pop.meanX)} y1={sy(pop.meanY)} x2={sx(vector.x)} y2={sy(vector.y)} stroke={statusColor} strokeWidth={1} />
      <Circle cx={sx(vector.x)} cy={sy(vector.y)} r={4} fill={statusColor} stroke="#fff" strokeWidth={1.5} />
    </Svg>
  );
}

export interface MeasurementReportProps {
  patient: { firstName: string; lastName: string; sex: string; birthDate: string; clinicalNote?: string | null };
  measurement: {
    measuredAt: string;
    heightCm: number;
    weightKg: number | null;
    resistanceOhm: number;
    reactanceOhm: number;
    phaseAngleComputed: number;
    rH: number;
    xcH: number;
    bivaPattern: string | null;
  };
  population: ReferencePopulation;
  bodyComposition: BodyComposition | null;
}

export default function MeasurementReport({ patient, measurement, population, bodyComposition }: MeasurementReportProps) {
  const age = Math.floor((new Date(measurement.measuredAt).getTime() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  const vector: Vector2D = { x: measurement.rH, y: measurement.xcH };
  const classification = classifyVector(vector, population);
  const statusColor = classification.distanceFromCenter95 > 1 ? "#b23a3a" : classification.pattern === "normale" ? "#3d7a5c" : "#b8873a";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandLabel}>BIVA Platform — Dott. Mauro Saiglia</Text>
            <Text style={styles.title}>Referto BIVA</Text>
          </View>
          <View style={styles.metaRight}>
            <Text>Data esame: {new Date(measurement.measuredAt).toLocaleDateString("it-IT")}</Text>
            <Text>{new Date(measurement.measuredAt).toLocaleTimeString("it-IT")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paziente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{patient.lastName} {patient.firstName}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Sesso</Text>
              <Text style={styles.infoValue}>{patient.sex === "M" ? "Maschile" : "Femminile"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Età</Text>
              <Text style={styles.infoValue}>{age} anni</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Altezza</Text>
              <Text style={styles.infoValue}>{measurement.heightCm} cm</Text>
            </View>
            {measurement.weightKg && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{measurement.weightKg} kg</Text>
              </View>
            )}
            {patient.clinicalNote && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nota clinica</Text>
                <Text style={styles.infoValue}>{patient.clinicalNote}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 24 }}>
          <View style={{ width: 280 }}>
            <Text style={styles.sectionTitle}>Grafico RXc — BIVA classica</Text>
            <Text style={{ fontSize: 8, color: "#8a8578", marginBottom: 6 }}>{population.label}</Text>
            <RxcGraph pop={population} vector={vector} unit="Ω/m" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Valori misurati</Text>
            <View style={styles.row}><Text style={styles.rowLabel}>Resistenza (R)</Text><Text style={styles.rowValue}>{measurement.resistanceOhm.toFixed(1)} Ω</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Reattanza (Xc)</Text><Text style={styles.rowValue}>{measurement.reactanceOhm.toFixed(1)} Ω</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>R/H</Text><Text style={styles.rowValue}>{measurement.rH.toFixed(1)} Ω/m</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Xc/H</Text><Text style={styles.rowValue}>{measurement.xcH.toFixed(1)} Ω/m</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Angolo di fase</Text><Text style={styles.rowValue}>{measurement.phaseAngleComputed.toFixed(2)}°</Text></View>

            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Classificazione</Text>
              <Text style={[styles.badge, { backgroundColor: statusColor }]}>
                {classification.pattern ? PATTERN_LABELS[classification.pattern] ?? classification.pattern : "—"}
              </Text>
              <Text style={{ fontSize: 8, color: "#8a8578", marginTop: 6 }}>
                {classification.withinEllipse50 ? "Entro il 50% della popolazione di riferimento" :
                 classification.withinEllipse75 ? "Tra il 50% e il 75%" :
                 classification.withinEllipse95 ? "Tra il 75% e il 95%" : "Fuori dal 95%"}
              </Text>
            </View>
          </View>
        </View>

        {bodyComposition && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Stime quantitative</Text>
            <View style={styles.row}><Text style={styles.rowLabel}>Acqua Totale (TBW)</Text><Text style={styles.rowValue}>{bodyComposition.tbwL.toFixed(1)} l</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Acqua Extracellulare (ECW)</Text><Text style={styles.rowValue}>{bodyComposition.ecwL.toFixed(1)} l ({bodyComposition.ecwToTbwPercent.toFixed(0)}% del TBW)</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Acqua Intracellulare (ICW)</Text><Text style={styles.rowValue}>{bodyComposition.icwL.toFixed(1)} l ({bodyComposition.icwToTbwPercent.toFixed(0)}% del TBW)</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Massa Magra (FFM)</Text><Text style={styles.rowValue}>{bodyComposition.ffmKg.toFixed(1)} kg</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Massa Grassa (FM)</Text><Text style={styles.rowValue}>{bodyComposition.fmKg.toFixed(1)} kg</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Massa Cellulare (BCM)</Text><Text style={styles.rowValue}>{bodyComposition.bcmKg.toFixed(1)} kg</Text></View>
          </View>
        )}

        <Text style={styles.citation}>
          Vettore BIVA calcolato senza equazioni predittive (Piccoli A, et al. Kidney Int. 1994;46:534-539), posizionato rispetto a: {population.sourceCitation}
          {bodyComposition && " Stime quantitative da equazioni di regressione pubblicate (Sun et al. 2003; ESPEN/Kyle et al. 2004; Dittmar & Reber 2001) — vedi documentazione per dettagli e limiti."}
        </Text>

        <Text style={styles.footer} fixed>
          BIVA Platform — sviluppata dal Dott. Mauro Saiglia — Documento generato automaticamente, non sostituisce il giudizio clinico
        </Text>
      </Page>
    </Document>
  );
}
