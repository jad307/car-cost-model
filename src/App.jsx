import { useState, useMemo } from "react";

const fmt = (n) => n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString()}` : `$${Math.round(n).toLocaleString()}`;
const fmtMi = (n) => `$${n.toFixed(2)}/mi`;
const COLORS = { volvo: "#7c3aed", crv: "#dc2626", rav4h: "#0369a1", hybrid: "#15803d" };
const VOLVO_MPG = 24;
const HYBRID_MPG = 36;
const volvoTradeIn = 15000;

function Slider({ label, value, min, max, step, display, onChange, note, warn }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>{display(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#1d4ed8" }} />
      {note && <div style={{ fontSize: 10.5, color: warn ? "#b91c1c" : "#9ca3af", marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function SH({ t }) {
  return <div style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 8, marginTop: 12 }}>{t}</div>;
}

function Bar({ label, sub, value, max, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <span style={{ fontSize: 12.5, fontWeight: 600, color }}>{label}</span>
          {sub && <span style={{ fontSize: 10.5, color: "#6b7280", marginLeft: 6 }}>{sub}</span>}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{fmt(value)}</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 4, height: 9, overflow: "hidden" }}>
        <div style={{ background: color, width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function App() {
  // Driving
  const [years, setYears] = useState(2);
  const [commuteDays, setCommuteDays] = useState(3);
  const [commuteMiles, setCommuteMiles] = useState(100);
  const [cityMilesPerWeek, setCityMilesPerWeek] = useState(50);

  // Gas
  const [gasPrice, setGasPrice] = useState(4.74);
  const [gasInflation, setGasInflation] = useState(12);

  // TVM
  const [investReturn, setInvestReturn] = useState(8);

  // CR-V Sport Touring Hybrid
  const [crvPrice, setCrvPrice] = useState(43700);
  const [crvMPG, setCrvMPG] = useState(35);
  const [crvDepRate, setCrvDepRate] = useState(14);
  const [crvInsurance, setCrvInsurance] = useState(1500);
  const [crvMaint, setCrvMaint] = useState(750);

  // RAV4 Hybrid XSE
  const [rav4hPrice, setRav4hPrice] = useState(42750);
  const [rav4hMPG, setRav4hMPG] = useState(41);
  const [rav4hDepRate, setRav4hDepRate] = useState(13);
  const [rav4hInsurance, setRav4hInsurance] = useState(1450);
  const [rav4hMaint, setRav4hMaint] = useState(750);

  // Crosstrek Hybrid Premium
  const [hybridPrice, setHybridPrice] = useState(40000);
  const [hybridDepRate, setHybridDepRate] = useState(14);
  const [hybridInsurance, setHybridInsurance] = useState(1400);
  const [hybridMaint, setHybridMaint] = useState(800);

  // Volvo
  const [volvoDepRate, setVolvoDepRate] = useState(11);
  const [volvoInsurance, setVolvoInsurance] = useState(1200);
  const [volvoMaint, setVolvoMaint] = useState(1400);

  const c = useMemo(() => {
    const wpy = 52;
    const avgGas = gasPrice * (1 + (gasInflation / 100) * (years - 1) / 2);
    const commuteMiPerWk = commuteDays * commuteMiles;
    const totalMiPerWk = commuteMiPerWk + cityMilesPerWeek;
    const totalMi = totalMiPerWk * wpy * years;

    // --- FUEL ---
    const volvoFuel = (totalMi / VOLVO_MPG) * avgGas;
    const crvFuel   = (totalMi / crvMPG)   * avgGas;
    const rav4hFuel = (totalMi / rav4hMPG) * avgGas;
    const hybridFuel = (totalMi / HYBRID_MPG) * avgGas;

    // --- NET PURCHASE ---
    const crvNet    = crvPrice    - volvoTradeIn;
    const rav4hNet  = rav4hPrice  - volvoTradeIn;
    const hybridNet = hybridPrice - volvoTradeIn;

    // --- OPPORTUNITY COST ---
    const r = investReturn / 100;
    const growth = Math.pow(1 + r, years) - 1;
    const crvOpp    = crvNet    * growth;
    const rav4hOpp  = rav4hNet  * growth;
    const hybridOpp = hybridNet * growth;

    // --- DEPRECIATION ---
    const volvoEnd  = volvoTradeIn * Math.pow(1 - volvoDepRate  / 100, years);
    const crvEnd    = crvPrice     * Math.pow(1 - crvDepRate    / 100, years);
    const rav4hEnd  = rav4hPrice   * Math.pow(1 - rav4hDepRate  / 100, years);
    const hybridEnd = hybridPrice  * Math.pow(1 - hybridDepRate / 100, years);
    const volvoDep  = volvoTradeIn - volvoEnd;

    // --- INSURANCE ---
    const vI = volvoInsurance  * years;
    const cI = crvInsurance    * years;
    const rI = rav4hInsurance  * years;
    const hI = hybridInsurance * years;

    // --- MAINTENANCE ---
    const vM = volvoMaint  * years;
    const cM = crvMaint    * years;
    const rM = rav4hMaint  * years;
    const hM = hybridMaint * years;

    // --- NET TRUE COST ---
    const vCost = volvoFuel + vM + vI + volvoDep;
    const cCost = crvNet    + crvFuel    + cM + cI - crvEnd    + crvOpp;
    const rCost = rav4hNet  + rav4hFuel  + rM + rI - rav4hEnd  + rav4hOpp;
    const hCost = hybridNet + hybridFuel + hM + hI - hybridEnd + hybridOpp;

    return {
      totalMi, totalMiPerWk, avgGas,
      fuel:    { v: volvoFuel, c: crvFuel,   r: rav4hFuel,  h: hybridFuel },
      ins:     { v: vI,        c: cI,        r: rI,         h: hI },
      maint:   { v: vM,        c: cM,        r: rM,         h: hM },
      dep:     { v: volvoDep,  c: crvPrice - crvEnd,   r: rav4hPrice - rav4hEnd,   h: hybridPrice - hybridEnd },
      residual:{ v: volvoEnd,  c: crvEnd,    r: rav4hEnd,   h: hybridEnd },
      netPurch:{ v: 0,         c: crvNet,    r: rav4hNet,   h: hybridNet },
      opp:     { v: 0,         c: crvOpp,    r: rav4hOpp,   h: hybridOpp },
      total:   { v: vCost,     c: cCost,     r: rCost,      h: hCost },
      fuelSavings: { c: volvoFuel - crvFuel, r: volvoFuel - rav4hFuel, h: volvoFuel - hybridFuel },
    };
  }, [years, gasPrice, gasInflation, investReturn,
      crvPrice, crvMPG, crvDepRate, crvInsurance, crvMaint,
      rav4hPrice, rav4hMPG, rav4hDepRate, rav4hInsurance, rav4hMaint,
      hybridPrice, hybridDepRate, hybridInsurance, hybridMaint,
      volvoDepRate, volvoInsurance, volvoMaint,
      commuteDays, commuteMiles, cityMilesPerWeek]);

  const totals = [c.total.v, c.total.c, c.total.r, c.total.h];
  const minTotal = Math.min(...totals);
  const labels = ["Keep Volvo V90", "CR-V Sport Touring Hybrid", "RAV4 Hybrid XSE ⭐", "Crosstrek Hybrid"];
  const winnerIdx = totals.indexOf(minTotal);
  const allColors = [COLORS.volvo, COLORS.crv, COLORS.rav4h, COLORS.hybrid];
  const winnerColor = allColors[winnerIdx];
  const maxBar = Math.max(...totals);

  const rows = [
    { label: "Net purchase (after $15k trade-in)",          v: c.netPurch.v, p: c.netPurch.c, r: c.netPurch.r, h: c.netPurch.h },
    { label: `Fuel (avg gas $${c.avgGas.toFixed(2)}/gal)`, v: c.fuel.v,     p: c.fuel.c,     r: c.fuel.r,     h: c.fuel.h },
    { label: "Insurance",                                   v: c.ins.v,      p: c.ins.c,      r: c.ins.r,      h: c.ins.h },
    { label: "Maintenance",                                 v: c.maint.v,    p: c.maint.c,    r: c.maint.r,    h: c.maint.h },
    { label: "Asset depreciation",                         v: c.dep.v,      p: c.dep.c,      r: c.dep.r,      h: c.dep.h },
    { label: `Residual recovered (yr ${years})`,           v: -c.residual.v, p: -c.residual.c, r: -c.residual.r, h: -c.residual.h },
    { label: `Opportunity cost of capital (${investReturn}%/yr)`, v: c.opp.v, p: c.opp.c, r: c.opp.r, h: c.opp.h, highlight: true },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 940, margin: "0 auto", padding: 16, fontSize: 13 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>🚗 Car Cost-Benefit Model — 4 Scenarios</h2>
      <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
        Net true cost = cash out minus residual value recovered. $15k trade-in · Cash purchase · No federal EV/PHEV credit in 2026 · ⭐ = recommended trim
      </p>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 11, marginBottom: 14, fontSize: 11.5 }}>
        <strong style={{ color: "#1e40af" }}>Driving pattern: </strong>
        <span style={{ color: "#1e3a8a" }}>
          {commuteDays}×/wk highway ({commuteMiles} mi/day) + {cityMilesPerWeek} mi/wk city
          = <strong>{c.totalMiPerWk} mi/wk ({(c.totalMiPerWk * 52).toLocaleString()} mi/yr)</strong>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16 }}>

        {/* LEFT — inputs */}
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", fontSize: 12 }}>

          <SH t="Driving Pattern" />
          <Slider label="Highway commute days/week" value={commuteDays} min={1} max={5} step={1}
            display={v => `${v} days`} onChange={setCommuteDays}
            note={`${commuteDays}×${commuteMiles}mi = ${commuteDays * commuteMiles} mi/wk highway`} />
          <Slider label="Miles per commute day" value={commuteMiles} min={50} max={150} step={5}
            display={v => `${v} mi`} onChange={setCommuteMiles} />
          <Slider label="City miles / week (other days)" value={cityMilesPerWeek} min={0} max={150} step={5}
            display={v => `${v} mi/wk`} onChange={setCityMilesPerWeek} />
          <Slider label="Analysis period" value={years} min={1} max={5} step={1}
            display={v => `${v} year${v > 1 ? "s" : ""}`} onChange={setYears} />

          <SH t="CA Gas Price" />
          <Slider label="Current gas price" value={gasPrice} min={3.50} max={8.00} step={0.05}
            display={v => `$${v.toFixed(2)}/gal`} onChange={setGasPrice}
            note="CA avg $4.74. UC Davis projects +$1.21 by Aug 2026 from refinery closures." />
          <Slider label="Annual gas price increase" value={gasInflation} min={0} max={50} step={1}
            display={v => `${v}%/yr`} onChange={setGasInflation}
            note="12% default reflects coming CA refinery closures." />

          <SH t="Time Value of Money" />
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 9, marginBottom: 10, fontSize: 11, color: "#14532d" }}>
            Opportunity cost = investment growth foregone by spending cash on a car. Applies to net purchase outlay only. Volvo = $0 outlay = $0 opportunity cost.
          </div>
          <Slider label="Expected annual investment return" value={investReturn} min={1} max={15} step={0.5}
            display={v => `${v}%/yr`} onChange={setInvestReturn}
            note={`At ${investReturn}%, ~${fmt((42750 - 15000) * (Math.pow(1 + investReturn / 100, years) - 1))} foregone on ~$28k outlay over ${years} yr`} />

          <SH t="Vehicle Prices (Cash, −$15k Trade-In)" />
          <Slider label="CR-V Sport Touring Hybrid (AWD)" value={crvPrice} min={40000} max={50000} step={250}
            display={v => fmt(v)} onChange={setCrvPrice}
            note="MSRP $42,250 + $1,450 dest = $43,700. AWD standard on Sport Touring." />
          <Slider label="⭐ RAV4 Hybrid XSE (AWD)" value={rav4hPrice} min={38000} max={48000} step={250}
            display={v => fmt(v)} onChange={setRav4hPrice}
            note="XSE $42,750 incl. dest. Recommended trim by automotive press." />
          <Slider label="Crosstrek Hybrid (Premium trim)" value={hybridPrice} min={36000} max={44000} step={250}
            display={v => fmt(v)} onChange={setHybridPrice}
            note="~$40k · Non-plug-in · 36 mpg · No charging needed" />

          <SH t="Fuel Economy (Real-World)" />
          <Slider label="CR-V Sport Touring hybrid MPG" value={crvMPG} min={28} max={42} step={1}
            display={v => `${v} mpg`} onChange={setCrvMPG}
            note="EPA 37 mpg combined AWD. Edmunds highway test: 33.3 mpg. Default 35 = conservative." />
          <Slider label="RAV4 Hybrid XSE AWD MPG" value={rav4hMPG} min={34} max={47} step={1}
            display={v => `${v} mpg`} onChange={setRav4hMPG}
            note="EPA 41 mpg AWD combined. Real-world highway ~38–43." />

          <SH t="Depreciation (%/yr)" />
          <Slider label="Volvo V90" value={volvoDepRate} min={5} max={25} step={1}
            display={v => `${v}%`} onChange={setVolvoDepRate} note="80k mi luxury wagon: ~10–14%/yr" />
          <Slider label="CR-V Sport Touring Hybrid" value={crvDepRate} min={8} max={25} step={1}
            display={v => `${v}%`} onChange={setCrvDepRate} note="Honda CR-V holds value well: ~12–16%/yr" />
          <Slider label="RAV4 Hybrid XSE" value={rav4hDepRate} min={8} max={22} step={1}
            display={v => `${v}%`} onChange={setRav4hDepRate} note="RAV4 Hybrid holds value very well: ~11–15%/yr" />
          <Slider label="Crosstrek Hybrid" value={hybridDepRate} min={8} max={22} step={1}
            display={v => `${v}%`} onChange={setHybridDepRate} note="~12–16%/yr" />

          <SH t="Annual Insurance" />
          <div style={{ background: "#fefce8", border: "1px solid #fef08a", borderRadius: 8, padding: 9, marginBottom: 10, fontSize: 11, color: "#713f12" }}>
            Your Volvo quote: $600/6mo = $1,200/yr. New car rates are estimates — plug in actual quotes when you have them.
          </div>
          <Slider label="Volvo V90 (confirmed)" value={volvoInsurance} min={600} max={3000} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setVolvoInsurance} note="Your confirmed rate: $600/6mo = $1,200/yr" />
          <Slider label="CR-V Sport Touring Hybrid" value={crvInsurance} min={600} max={3000} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setCrvInsurance} note="Hondas insure competitively. Est. ~15–25% more than Volvo." />
          <Slider label="RAV4 Hybrid XSE ⭐" value={rav4hInsurance} min={600} max={3000} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setRav4hInsurance} note="RAV4 Hybrid insures cheaply. Est. ~10–20% more than Volvo." />
          <Slider label="Crosstrek Hybrid Premium" value={hybridInsurance} min={600} max={3000} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setHybridInsurance} note="Subarus among cheapest to insure. Est. ~10–15% more than Volvo." />

          <SH t="Annual Maintenance" />
          <Slider label="Volvo V90 (80k mi)" value={volvoMaint} min={600} max={4500} step={100}
            display={v => `${fmt(v)}/yr`} onChange={setVolvoMaint}
            note="Try $2,500–3,500 to stress-test surprise repair risk." warn={volvoMaint < 1000} />
          <Slider label="CR-V Sport Touring Hybrid" value={crvMaint} min={300} max={1500} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setCrvMaint} note="Honda hybrid reliability: ~$500–900/yr" />
          <Slider label="RAV4 Hybrid XSE" value={rav4hMaint} min={300} max={1500} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setRav4hMaint} note="Toyota hybrid reliability: ~$500–850/yr" />
          <Slider label="Crosstrek Hybrid" value={hybridMaint} min={400} max={1800} step={50}
            display={v => `${fmt(v)}/yr`} onChange={setHybridMaint} note="~$600–1,000/yr" />
        </div>

        {/* RIGHT — results */}
        <div>
          {/* Winner banner */}
          <div style={{ background: winnerColor, borderRadius: 12, padding: 14, marginBottom: 12, color: "white" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8 }}>Lowest net cost over {years} year{years > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{labels[winnerIdx]}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85 }}>{fmt(minTotal)} total · {fmtMi(minTotal / c.totalMi)}</div>
          </div>

          {/* Bar chart */}
          <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Total Net Cost Comparison</div>
            <Bar label="Keep Volvo V90" value={c.total.v} max={maxBar} color={COLORS.volvo} />
            <Bar label="CR-V Sport Touring Hybrid" sub="37 mpg EPA · AWD standard" value={c.total.c} max={maxBar} color={COLORS.crv} />
            <Bar label="RAV4 Hybrid XSE ⭐" sub="41 mpg EPA · recommended" value={c.total.r} max={maxBar} color={COLORS.rav4h} />
            <Bar label="Crosstrek Hybrid Premium" sub="36 mpg · non-plug-in" value={c.total.h} max={maxBar} color={COLORS.hybrid} />
          </div>

          {/* Breakdown table */}
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "7px 8px", fontSize: 11, textAlign: "left", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Component</th>
                  {["Volvo", "CR-V HV", "RAV4 HV", "Crosstrek"].map((h, i) => (
                    <th key={h} style={{ padding: "7px 8px", fontSize: 11, textAlign: "right", color: allColors[i], borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} style={{ background: r.highlight ? "#fefce8" : ri % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: r.highlight ? "#854d0e" : "#374151", fontStyle: r.highlight ? "italic" : "normal", borderBottom: "1px solid #f3f4f6" }}>{r.label}</td>
                    {[r.v, r.p, r.r, r.h].map((v, i) => (
                      <td key={i} style={{ padding: "5px 8px", fontSize: 11, textAlign: "right", borderBottom: "1px solid #f3f4f6", color: r.highlight && v > 0 ? "#b45309" : "#374151" }}>{fmt(v)}</td>
                    ))}
                  </tr>
                ))}
                <tr style={{ background: "#f0f9ff" }}>
                  <td style={{ padding: "7px 8px", fontSize: 12, fontWeight: 800, borderTop: "2px solid #e5e7eb" }}>NET TOTAL</td>
                  {[c.total.v, c.total.c, c.total.r, c.total.h].map((v, i) => (
                    <td key={i} style={{ padding: "7px 8px", fontSize: 12, fontWeight: 800, textAlign: "right", borderTop: "2px solid #e5e7eb", color: allColors[i], background: v === minTotal ? "#d1fae5" : undefined }}>
                      {fmt(v)}{v === minTotal ? " ✓" : ""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cost per mile */}
          <div style={{ background: "#fefce8", borderRadius: 12, padding: 12, border: "1px solid #fef08a", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#854d0e", textTransform: "uppercase", marginBottom: 7 }}>True Cost Per Mile ({c.totalMi.toLocaleString()} mi total)</div>
            {[
              { label: "Keep Volvo V90",              v: c.total.v, color: COLORS.volvo },
              { label: "CR-V Sport Touring Hybrid",   v: c.total.c, color: COLORS.crv },
              { label: "RAV4 Hybrid XSE ⭐",          v: c.total.r, color: COLORS.rav4h },
              { label: "Crosstrek Hybrid Premium",    v: c.total.h, color: COLORS.hybrid },
            ].map(x => (
              <div key={x.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: x.color, fontWeight: 600, fontSize: 12 }}>{x.label}</span>
                <span style={{ color: x.color, fontWeight: 700, fontSize: 12 }}>{fmtMi(x.v / c.totalMi)}</span>
              </div>
            ))}
          </div>

          {/* Fuel savings */}
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 12, border: "1px solid #bbf7d0", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#166534", textTransform: "uppercase", marginBottom: 7 }}>Fuel Savings vs. Keeping Volvo</div>
            {[
              { label: "CR-V Sport Touring Hybrid",   v: c.fuelSavings.c },
              { label: "RAV4 Hybrid XSE",             v: c.fuelSavings.r },
              { label: "Crosstrek Hybrid Premium",    v: c.fuelSavings.h },
            ].map(x => (
              <div key={x.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12 }}>{x.label}</span>
                <span style={{ fontWeight: 700, color: x.v > 0 ? "#16a34a" : "#dc2626", fontSize: 12 }}>{fmt(x.v)}</span>
              </div>
            ))}
            <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 5 }}>Avg gas ${c.avgGas.toFixed(2)}/gal over period · All three are non-plug-in hybrids</div>
          </div>

          {/* RAV4 recommendation box */}
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 12, border: "1px solid #bfdbfe", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#1e40af", textTransform: "uppercase", marginBottom: 6 }}>⭐ Why RAV4 Hybrid XSE is Recommended</div>
            <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11.5, color: "#1e3a8a", lineHeight: 1.8 }}>
              <li>Best value trim per automotive press — 12.9" screen, AWD, heated+ventilated seats, moonroof.</li>
              <li>41 mpg EPA AWD — meaningfully better than the CR-V's 37 mpg, especially on your highway-heavy commute.</li>
              <li>RAV4 holds resale value exceptionally well vs. class.</li>
              <li>~$950 cheaper than the CR-V Sport Touring at default prices.</li>
            </ul>
          </div>

          {/* CR-V note */}
          <div style={{ background: "#fff1f2", borderRadius: 12, padding: 12, border: "1px solid #fecdd3", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#9f1239", textTransform: "uppercase", marginBottom: 6 }}>CR-V Sport Touring — What You're Paying For</div>
            <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11.5, color: "#881337", lineHeight: 1.8 }}>
              <li>Nicer interior quality and more cargo space than the RAV4 at this trim level.</li>
              <li>37 mpg EPA combined AWD, but Edmunds' highway-biased real-world test returned only 33.3 mpg — relevant for your commute.</li>
              <li>Sport Touring is the top trim; Edmunds suggests the Sport-L has most of the same features for ~$4k less if budget matters.</li>
            </ul>
          </div>

          {/* Key risks */}
          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 12, border: "1px solid #e9d5ff" }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#5b21b6", textTransform: "uppercase", marginBottom: 6 }}>Key Risk Factors</div>
            <ul style={{ margin: 0, paddingLeft: 15, fontSize: 11.5, color: "#4c1d95", lineHeight: 1.8 }}>
              <li><strong>Opportunity cost at 8–10%</strong> adds $4–6k per new car over 2 years and compounds harder at 4–5 years — the strongest argument for keeping the Volvo short-term.</li>
              <li><strong>CA gas spike:</strong> UC Davis projects +$1.21/gal by Aug 2026 from refinery closures. Drag gas inflation to 20–25% to see the impact.</li>
              <li><strong>Volvo at 80k miles:</strong> Slide maintenance to $2,500–3,500 to model one surprise repair. That single event often flips the 2-year comparison.</li>
              <li><strong>CR-V highway MPG:</strong> Try dragging the CR-V MPG slider to 33 (Edmunds tested) to see the worst-case fuel cost vs. the RAV4.</li>
              <li><strong>Insurance estimates</strong> are placeholders — get actual quotes for all three vehicles before deciding.</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff7ed", borderRadius: 12, padding: 12, border: "1px solid #fed7aa", marginTop: 14, fontSize: 11, color: "#7c2d12" }}>
        <strong>Model notes:</strong> Volvo 24 mpg · Crosstrek Hybrid 36 mpg · RAV4 Hybrid XSE 41 mpg EPA AWD · CR-V Sport Touring 37 mpg EPA AWD (Edmunds real-world: 33.3 mpg highway) · All three new cars are non-plug-in hybrids · Depreciation: declining-balance · $15k trade-in applied at purchase · Cash deal · Opportunity cost = net outlay × ((1+r)^n − 1).
      </div>
    </div>
  );
}