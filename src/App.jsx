import { useState, useMemo } from "react";

const fmt = (n) => n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString()}` : `$${Math.round(n).toLocaleString()}`;
const fmtMi = (n) => `$${n.toFixed(2)}/mi`;
const COLORS = { volvo: "#7c3aed", phev: "#b45309", rav4h: "#0369a1", hybrid: "#15803d" };

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
        <div style={{ background: color, width: `${Math.min(100,(value/max)*100)}%`, height: "100%", borderRadius: 4, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

export default function App() {
  const [years, setYears] = useState(2);
  const [gasPrice, setGasPrice] = useState(4.74);
  const [gasInflation, setGasInflation] = useState(12);
  const [homeRate, setHomeRate] = useState(0.35);

  // Driving pattern
  const [commuteDays, setCommuteDays] = useState(3);
  const [commuteMiles, setCommuteMiles] = useState(100);
  const [cityMilesPerWeek, setCityMilesPerWeek] = useState(50);

  // PHEV
  const [phevEvRange, setPhevEvRange] = useState(48);
  const [phevPrice, setPhevPrice] = useState(42950);
  const [phevMPGgas, setPhevMPGgas] = useState(38);
  const PHEV_EFF_EV = 3.4;

  // RAV4 Hybrid XSE
  const [rav4hPrice, setRav4hPrice] = useState(42750);
  const [rav4hMPG, setRav4hMPG] = useState(41); // AWD combined EPA

  // Crosstrek Hybrid Premium
  const [hybridPrice, setHybridPrice] = useState(40000);
  const HYBRID_MPG = 36;

  // Volvo
  const VOLVO_MPG = 24;
  const volvoTradeIn = 15000;

  // Depreciation
  const [volvoDepRate, setVolvoDepRate] = useState(11);
  const [phevDepRate, setPhevDepRate] = useState(15);
  const [rav4hDepRate, setRav4hDepRate] = useState(13);
  const [hybridDepRate, setHybridDepRate] = useState(14);

  // Maintenance
  const [volvoMaint, setVolvoMaint] = useState(1400);
  const [phevMaint, setPhevMaint] = useState(700);
  const [rav4hMaint, setRav4hMaint] = useState(750);
  const [hybridMaint, setHybridMaint] = useState(800);

  const c = useMemo(() => {
    const wpy = 52;
    const avgGas = gasPrice * (1 + (gasInflation / 100) * (years - 1) / 2);
    const commuteMiPerWk = commuteDays * commuteMiles;
    const totalMiPerWk = commuteMiPerWk + cityMilesPerWeek;
    const totalMi = totalMiPerWk * wpy * years;

    // Volvo
    const volvoFuel = (totalMi / VOLVO_MPG) * avgGas;

    // Crosstrek Hybrid
    const hybridFuel = (totalMi / HYBRID_MPG) * avgGas;

    // RAV4 Hybrid (no plug — pure gas hybrid)
    const rav4hFuel = (totalMi / rav4hMPG) * avgGas;

    // PHEV per-day modeling
    const cityDaysPerWeek = 7 - commuteDays;
    const cityMiPerDay = cityDaysPerWeek > 0 ? cityMilesPerWeek / cityDaysPerWeek : 0;
    const commuteElecMi = Math.min(phevEvRange, commuteMiles);
    const commuteGasMi = Math.max(0, commuteMiles - phevEvRange);
    const cityElecMi = Math.min(phevEvRange, cityMiPerDay);
    const cityGasMi = Math.max(0, cityMiPerDay - phevEvRange);
    const totalElecMiPerYear = (commuteElecMi * commuteDays + cityElecMi * cityDaysPerWeek) * wpy;
    const totalGasMiPerYear = (commuteGasMi * commuteDays + cityGasMi * cityDaysPerWeek) * wpy;
    const phevElecCost = (totalElecMiPerYear * years) / PHEV_EFF_EV * homeRate;
    const phevGasCost = (totalGasMiPerYear * years / phevMPGgas) * avgGas;
    const phevFuelTotal = phevElecCost + phevGasCost;
    const elecFraction = totalElecMiPerYear / (totalMiPerWk * wpy);

    // Net purchases
    const phevNet = phevPrice - volvoTradeIn;
    const rav4hNet = rav4hPrice - volvoTradeIn;
    const hybridNet = hybridPrice - volvoTradeIn;

    // Depreciation
    const volvoEnd = volvoTradeIn * Math.pow(1 - volvoDepRate / 100, years);
    const volvoDep = volvoTradeIn - volvoEnd;
    const phevEnd = phevPrice * Math.pow(1 - phevDepRate / 100, years);
    const rav4hEnd = rav4hPrice * Math.pow(1 - rav4hDepRate / 100, years);
    const hybridEnd = hybridPrice * Math.pow(1 - hybridDepRate / 100, years);

    // Maintenance
    const vM = volvoMaint * years, pM = phevMaint * years;
    const rM = rav4hMaint * years, hM = hybridMaint * years;

    // Net true cost
    const vCost = volvoFuel + vM + volvoDep;
    const pCost = phevNet + phevFuelTotal + pM - phevEnd;
    const rCost = rav4hNet + rav4hFuel + rM - rav4hEnd;
    const hCost = hybridNet + hybridFuel + hM - hybridEnd;

    return {
      totalMi, totalMiPerWk, avgGas, elecFraction,
      fuel: { v: volvoFuel, p: phevFuelTotal, r: rav4hFuel, h: hybridFuel },
      phevElecCost, phevGasCost, commuteGasMi, commuteElecMi,
      maint: { v: vM, p: pM, r: rM, h: hM },
      dep: { v: volvoDep, p: phevPrice-phevEnd, r: rav4hPrice-rav4hEnd, h: hybridPrice-hybridEnd },
      residual: { v: volvoEnd, p: phevEnd, r: rav4hEnd, h: hybridEnd },
      netPurch: { v: 0, p: phevNet, r: rav4hNet, h: hybridNet },
      total: { v: vCost, p: pCost, r: rCost, h: hCost },
      fuelSavings: { p: volvoFuel-phevFuelTotal, r: volvoFuel-rav4hFuel, h: volvoFuel-hybridFuel },
    };
  }, [years, gasPrice, gasInflation, homeRate, commuteDays, commuteMiles, cityMilesPerWeek,
      phevEvRange, phevPrice, phevMPGgas, rav4hPrice, rav4hMPG, hybridPrice,
      volvoDepRate, phevDepRate, rav4hDepRate, hybridDepRate,
      volvoMaint, phevMaint, rav4hMaint, hybridMaint]);

  const totals = [c.total.v, c.total.p, c.total.r, c.total.h];
  const minTotal = Math.min(...totals);
  const labels = ["Keep Volvo V90", "RAV4 PHEV SE", "RAV4 Hybrid XSE ⭐", "Crosstrek Hybrid"];
  const winnerIdx = totals.indexOf(minTotal);
  const allColors = [COLORS.volvo, COLORS.phev, COLORS.rav4h, COLORS.hybrid];
  const winnerColor = allColors[winnerIdx];
  const maxBar = Math.max(...totals);

  const rows = [
    { label: "Net purchase (after $15k trade-in)", v: c.netPurch.v, p: c.netPurch.p, r: c.netPurch.r, h: c.netPurch.h },
    { label: `Fuel/charging (avg gas $${c.avgGas.toFixed(2)}/gal)`, v: c.fuel.v, p: c.fuel.p, r: c.fuel.r, h: c.fuel.h },
    { label: "Maintenance", v: c.maint.v, p: c.maint.p, r: c.maint.r, h: c.maint.h },
    { label: "Asset depreciation", v: c.dep.v, p: c.dep.p, r: c.dep.r, h: c.dep.h },
    { label: `Residual recovered (yr ${years})`, v: -c.residual.v, p: -c.residual.p, r: -c.residual.r, h: -c.residual.h },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 940, margin: "0 auto", padding: 16, fontSize: 13 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>🚗 Car Cost-Benefit Model — 4 Scenarios</h2>
      <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
        Net true cost = cash out minus residual value recovered. $15k trade-in · Cash purchase · No federal EV/PHEV credit in 2026 · ⭐ = recommended trim
      </p>

      {/* Driving summary */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 11, marginBottom: 14, fontSize: 11.5 }}>
        <strong style={{ color: "#1e40af" }}>Driving pattern: </strong>
        <span style={{ color: "#1e3a8a" }}>
          {commuteDays}×/wk highway ({commuteMiles} mi/day) + {cityMilesPerWeek} mi/wk city
          = <strong>{c.totalMiPerWk} mi/wk ({(c.totalMiPerWk*52).toLocaleString()} mi/yr)</strong>
        </span>
        {"  ·  "}
        <span style={{ color: "#b45309" }}>
          PHEV: EV covers <strong>{Math.round(c.commuteElecMi)} mi</strong> of commute, gas covers <strong>{Math.round(c.commuteGasMi)} mi</strong> overflow (~{Math.round(c.elecFraction*100)}% electric overall)
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 16 }}>

        {/* LEFT — inputs */}
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", fontSize: 12 }}>

          <SH t="Driving Pattern" />
          <Slider label="Highway commute days/week" value={commuteDays} min={1} max={5} step={1}
            display={v=>`${v} days`} onChange={setCommuteDays} note={`${commuteDays}×${commuteMiles}mi = ${commuteDays*commuteMiles} mi/wk highway`} />
          <Slider label="Miles per commute day" value={commuteMiles} min={50} max={150} step={5}
            display={v=>`${v} mi`} onChange={setCommuteMiles} />
          <Slider label="City miles / week (other days)" value={cityMilesPerWeek} min={0} max={150} step={5}
            display={v=>`${v} mi/wk`} onChange={setCityMilesPerWeek} note="PHEV runs these 100% electric" />
          <Slider label="Analysis period" value={years} min={1} max={5} step={1}
            display={v=>`${v} year${v>1?"s":""}`} onChange={setYears} />

          <SH t="CA Gas Price" />
          <Slider label="Current gas price" value={gasPrice} min={3.50} max={8.00} step={0.05}
            display={v=>`$${v.toFixed(2)}/gal`} onChange={setGasPrice}
            note="CA avg $4.74. UC Davis projects +$1.21 by Aug 2026." />
          <Slider label="Annual gas price increase" value={gasInflation} min={0} max={50} step={1}
            display={v=>`${v}%/yr`} onChange={setGasInflation} note="12% default reflects refinery closures." />

          <SH t="Charging (6.6 kW L2 Apartment)" />
          <Slider label="Apartment rate ($/kWh)" value={homeRate} min={0.20} max={0.55} step={0.005}
            display={v=>`$${v.toFixed(3)}`} onChange={setHomeRate} note="Confirmed $0.35/kWh · RAV4 Hybrid needs no charging" />

          <SH t="PHEV Specs" />
          <Slider label="RAV4 PHEV real-world EV range" value={phevEvRange} min={30} max={55} step={1}
            display={v=>`${v} mi`} onChange={setPhevEvRange} note="Edmunds tested 48 mi (2025). 2026 claims 52 mi." />
          <Slider label="RAV4 PHEV gas-mode MPG" value={phevMPGgas} min={28} max={44} step={1}
            display={v=>`${v} mpg`} onChange={setPhevMPGgas} note="Mfr 41 mpg. Real-world ~34–38. Default: 38." />

          <SH t="Vehicle Prices (Cash, -$15k Trade-In)" />
          <Slider label="RAV4 PHEV SE (base, incl. dest.)" value={phevPrice} min={40000} max={52000} step={250}
            display={v=>fmt(v)} onChange={setPhevPrice} note="SE $42,950 · XSE $48,600 · GR Sport $49,950" />
          <Slider label="⭐ RAV4 Hybrid XSE (AWD, incl. dest.)" value={rav4hPrice} min={38000} max={48000} step={250}
            display={v=>fmt(v)} onChange={setRav4hPrice} note="XSE $42,750 · LE $33,350 · Limited ~$44–45k · Recommended: XSE" />
          <Slider label="Crosstrek Hybrid (Premium trim)" value={hybridPrice} min={36000} max={44000} step={250}
            display={v=>fmt(v)} onChange={setHybridPrice} note="~$40k premium · Non-plug-in · 36 mpg · No charging needed" />

          <SH t="RAV4 Hybrid MPG" />
          <Slider label="RAV4 Hybrid XSE AWD combined MPG" value={rav4hMPG} min={34} max={47} step={1}
            display={v=>`${v} mpg`} onChange={setRav4hMPG} note="EPA: 41 mpg AWD. Real-world highway typically 38–43." />

          <SH t="Depreciation (%/yr)" />
          <Slider label="Volvo V90" value={volvoDepRate} min={5} max={25} step={1} display={v=>`${v}%`} onChange={setVolvoDepRate} note="80k mi luxury wagon: ~10–14%/yr" />
          <Slider label="RAV4 PHEV" value={phevDepRate} min={8} max={25} step={1} display={v=>`${v}%`} onChange={setPhevDepRate} note="~13–17%/yr" />
          <Slider label="RAV4 Hybrid XSE" value={rav4hDepRate} min={8} max={22} step={1} display={v=>`${v}%`} onChange={setRav4hDepRate} note="RAV4 Hybrid holds value very well: ~11–15%/yr" />
          <Slider label="Crosstrek Hybrid" value={hybridDepRate} min={8} max={22} step={1} display={v=>`${v}%`} onChange={setHybridDepRate} note="~12–16%/yr" />

          <SH t="Annual Maintenance" />
          <Slider label="Volvo V90 (80k mi)" value={volvoMaint} min={600} max={4500} step={100}
            display={v=>`${fmt(v)}/yr`} onChange={setVolvoMaint}
            note="Try $2,500–3,500 to stress-test surprise repair risk." warn={volvoMaint < 1000} />
          <Slider label="RAV4 PHEV" value={phevMaint} min={300} max={1500} step={50} display={v=>`${fmt(v)}/yr`} onChange={setPhevMaint} note="~$500–900/yr" />
          <Slider label="RAV4 Hybrid XSE" value={rav4hMaint} min={300} max={1500} step={50} display={v=>`${fmt(v)}/yr`} onChange={setRav4hMaint} note="Toyota hybrid: ~$500–850/yr" />
          <Slider label="Crosstrek Hybrid" value={hybridMaint} min={400} max={1800} step={50} display={v=>`${fmt(v)}/yr`} onChange={setHybridMaint} note="~$600–1,000/yr" />
        </div>

        {/* RIGHT — results */}
        <div>
          {/* Winner banner */}
          <div style={{ background: winnerColor, borderRadius: 12, padding: 14, marginBottom: 12, color: "white" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8 }}>Lowest net cost over {years} year{years>1?"s":""}</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>{labels[winnerIdx]}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85 }}>{fmt(minTotal)} total · {fmtMi(minTotal/c.totalMi)}</div>
          </div>

          {/* Bar chart */}
          <div style={{ background: "white", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Total Net Cost Comparison</div>
            <Bar label="Keep Volvo V90" value={c.total.v} max={maxBar} color={COLORS.volvo} />
            <Bar label="RAV4 PHEV SE" sub="plug-in hybrid" value={c.total.p} max={maxBar} color={COLORS.phev} />
            <Bar label="RAV4 Hybrid XSE ⭐" sub="recommended trim · no charging needed" value={c.total.r} max={maxBar} color={COLORS.rav4h} />
            <Bar label="Crosstrek Hybrid Premium" sub="non-plug-in" value={c.total.h} max={maxBar} color={COLORS.hybrid} />
          </div>

          {/* Breakdown table */}
          <div style={{ background: "white", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "7px 8px", fontSize: 11, textAlign: "left", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Component</th>
                  {["Volvo","PHEV","RAV4 HV","Crosstrek"].map((h,i) => (
                    <th key={h} style={{ padding: "7px 8px", fontSize: 11, textAlign: "right", color: allColors[i], borderBottom: "1px solid #e5e7eb", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} style={{ background: ri%2===0?"white":"#fafafa" }}>
                    <td style={{ padding: "5px 8px", fontSize: 11, color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{r.label}</td>
                    {[r.v, r.p, r.r, r.h].map((v, i) => (
                      <td key={i} style={{ padding: "5px 8px", fontSize: 11, textAlign: "right", borderBottom: "1px solid #f3f4f6" }}>{fmt(v)}</td>
                    ))}
                  </tr>
                ))}
                <tr style={{ background: "#f0f9ff" }}>
                  <td style={{ padding: "7px 8px", fontSize: 12, fontWeight: 800, borderTop: "2px solid #e5e7eb" }}>NET TOTAL</td>
                  {[c.total.v, c.total.p, c.total.r, c.total.h].map((v, i) => (
                    <td key={i} style={{ padding: "7px 8px", fontSize: 12, fontWeight: 800, textAlign: "right", borderTop: "2px solid #e5e7eb", color: allColors[i], background: v===minTotal?"#d1fae5":undefined }}>
                      {fmt(v)}{v===minTotal?" ✓":""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* PHEV fuel detail */}
          <div style={{ background: "#fffbeb", borderRadius: 12, padding: 12, border: "1px solid #fde68a", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#92400e", textTransform: "uppercase", marginBottom: 7 }}>RAV4 PHEV Fuel Detail</div>
            <div style={{ fontSize: 11.5, color: "#78350f", marginBottom: 7, lineHeight: 1.6 }}>
              <strong>Commute days ({commuteDays}×/wk):</strong> EV {Math.round(c.commuteElecMi)} mi + gas {Math.round(c.commuteGasMi)} mi (~{(c.commuteGasMi/phevMPGgas).toFixed(1)} gal/day)<br/>
              <strong>City days:</strong> ~{Math.round(cityMilesPerWeek/Math.max(1,7-commuteDays))} mi/day — 100% electric
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span>Electric (~{Math.round(c.elecFraction*100)}% of miles)</span>
              <span style={{ fontWeight:700, color:"#15803d" }}>{fmt(c.phevElecCost)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:6, marginBottom:3 }}>
              <span>Gas (commute overflow)</span>
              <span style={{ fontWeight:700, color:"#92400e" }}>{fmt(c.phevGasCost)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #fde68a", paddingTop:6, fontWeight:600 }}>
              <span>Total fuel</span><span>{fmt(c.fuel.p)}</span>
            </div>
          </div>

          {/* Cost per mile */}
          <div style={{ background: "#fefce8", borderRadius: 12, padding: 12, border: "1px solid #fef08a", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#854d0e", textTransform: "uppercase", marginBottom: 7 }}>True Cost Per Mile ({c.totalMi.toLocaleString()} mi total)</div>
            {[
              { label: "Keep Volvo V90", v: c.total.v, color: COLORS.volvo },
              { label: "RAV4 PHEV SE", v: c.total.p, color: COLORS.phev },
              { label: "RAV4 Hybrid XSE ⭐", v: c.total.r, color: COLORS.rav4h },
              { label: "Crosstrek Hybrid Premium", v: c.total.h, color: COLORS.hybrid },
            ].map(x => (
              <div key={x.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:x.color, fontWeight:600, fontSize:12 }}>{x.label}</span>
                <span style={{ color:x.color, fontWeight:700, fontSize:12 }}>{fmtMi(x.v/c.totalMi)}</span>
              </div>
            ))}
          </div>

          {/* Fuel savings */}
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 12, border: "1px solid #bbf7d0", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#166534", textTransform: "uppercase", marginBottom: 7 }}>Fuel Savings vs. Keeping Volvo</div>
            {[
              { label: "RAV4 PHEV", v: c.fuelSavings.p },
              { label: "RAV4 Hybrid XSE", v: c.fuelSavings.r },
              { label: "Crosstrek Hybrid", v: c.fuelSavings.h },
            ].map(x => (
              <div key={x.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12 }}>{x.label}</span>
                <span style={{ fontWeight:700, color: x.v > 0 ? "#16a34a" : "#dc2626", fontSize:12 }}>{fmt(x.v)}</span>
              </div>
            ))}
            <div style={{ fontSize:10.5, color:"#6b7280", marginTop:5 }}>Gas avg ${c.avgGas.toFixed(2)}/gal · PHEV elec $0.35/kWh · RAV4 Hybrid: no charging cost</div>
          </div>

          {/* Recommendation & risks */}
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 12, border: "1px solid #bfdbfe", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#1e40af", textTransform: "uppercase", marginBottom: 6 }}>⭐ Why RAV4 Hybrid XSE is the Recommended Trim</div>
            <ul style={{ margin:0, paddingLeft:15, fontSize:11.5, color:"#1e3a8a", lineHeight:1.8 }}>
              <li><strong>Best value in the hybrid lineup</strong> per multiple automotive reviewers who drove the full range.</li>
              <li>12.9" touchscreen, AWD standard, heated+ventilated seats, moonroof, hands-free liftgate — everything you'd want.</li>
              <li><strong>No charging needed</strong> — 43 mpg EPA AWD, no infrastructure dependency, zero range anxiety.</li>
              <li>Nearly identical price to the RAV4 PHEV SE, but simpler ownership and same Toyota reliability.</li>
              <li>Limited trim adds panoramic roof + JBL audio but reviewers say the jump isn't worth the extra cost.</li>
            </ul>
          </div>

          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 12, border: "1px solid #e9d5ff" }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: "#5b21b6", textTransform: "uppercase", marginBottom: 6 }}>Key Risk Factors</div>
            <ul style={{ margin:0, paddingLeft:15, fontSize:11.5, color:"#4c1d95", lineHeight:1.8 }}>
              <li><strong>PHEV vs. Hybrid XSE:</strong> Nearly the same price. PHEV's advantage is ~{Math.round(c.elecFraction*100)}% electric miles (cheaper fuel per mile). Hybrid's advantage is zero charging dependency and simpler ownership — relevant since your commute always exceeds EV range anyway.</li>
              <li><strong>Volvo at 80k miles:</strong> Slide maintenance to $2,500–3,500 to see how one surprise repair changes the math.</li>
              <li><strong>CA gas spike:</strong> Both RAV4s benefit significantly. Try gas inflation at 20–25%.</li>
              <li><strong>RAV4 PHEV spring 2026 availability:</strong> New model, expect tight initial inventory and less dealer negotiating room.</li>
              <li><strong>No federal PHEV/EV credit</strong> in 2026. Check CA CVRP at cleanvehiclerebate.org.</li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff7ed", borderRadius: 12, padding: 12, border: "1px solid #fed7aa", marginTop: 14, fontSize: 11, color: "#7c2d12" }}>
        <strong>Model notes:</strong> Volvo 24 mpg · Crosstrek Hybrid 36 mpg (non-plug-in) · RAV4 Hybrid XSE 41 mpg AWD EPA · RAV4 PHEV modeled per-day: EV covers first {phevEvRange} mi from full overnight charge, gas covers overflow · PHEV EV efficiency ~3.4 mi/kWh · Depreciation: declining-balance method · $15k trade-in applied at purchase · Cash deal.
      </div>
    </div>
  );
}