import { useState, useMemo } from "react";

const fmt = (n) => n < 0 ? `-$${Math.abs(Math.round(n)).toLocaleString()}` : `$${Math.round(n).toLocaleString()}`;
const fmtMi = (n) => `$${n.toFixed(2)}/mi`;

const VOLVO_MPG = 24;
const HOME_ELEC = 0.35, TESLA_EFF = 4.1, PHEV_EFF = 3.4;
const L2_LABEL = "$0.35/kWh apartment L2 charger";
const SALES_TAX = 0.0875;
const TUCSON_IDS = ["tucsonhv", "tucson"];

const VEHICLES = [
  { id:"volvo",     label:"Keep Volvo V90",          color:"#6d28d9", msrp:0,      mpg:VOLVO_MPG, dep:11, ins:1200, maint:1400, note:"80k mi · confirmed $1,200/yr ins" },
  { id:"crv",       label:"CR-V Sport Touring HV",   color:"#dc2626", msrp:43700,  mpg:35,        dep:14, ins:1500, maint:750,  note:"EPA 37 mpg AWD · Edmunds real-world: 33.3 mpg hwy" },
  { id:"rav4h",     label:"RAV4 Hybrid XSE ⭐",      color:"#0369a1", msrp:42750,  mpg:41,        dep:13, ins:1450, maint:750,  note:"EPA 41 mpg AWD · recommended trim" },
  { id:"crosstrek", label:"Crosstrek Hybrid Prem",   color:"#166534", msrp:40000,  mpg:36,        dep:14, ins:1400, maint:800,  note:"Non-plug-in · 36 mpg" },
  { id:"tucsonhv",  label:"Tucson Hybrid Limited",   color:"#0e7490", msrp:43425,  mpg:33,        dep:14, ins:1550, maint:780,  note:"EPA 36 mpg AWD · real-world hwy ~32–33 mpg · AWD std" },
  { id:"tucson",    label:"Tucson Limited PHEV",      color:"#7c3aed", msrp:50150,  mpg:35,        dep:15, ins:1600, maint:800,  note:`⚠️ $50k+ · 32mi EV (${L2_LABEL}) · 35 mpg hybrid`, evRange:32 },
  { id:"niro",      label:"Sportage Hybrid SX Prestige", color:"#c2410c", msrp:42035,  mpg:35,        dep:13, ins:1400, maint:720,  note:"35 mpg AWD · 232hp · $42,035 incl dest · real-world ~34.8 mpg" },
  { id:"tesla",     label:"Tesla Model 3 Prem RWD",  color:"#0f766e", msrp:44130,  mpg:0,         dep:18, ins:2200, maint:550,  note:`363 mi range · 4.1 mi/kWh · ${L2_LABEL}`, evRange:999 },
];

function calcHYSBenefit(totalOutlay, loanYears, hysRate) {
  if (totalOutlay <= 0 || loanYears <= 0) return 0;
  const monthlyRate = hysRate / 100 / 12;
  const nPayments = loanYears * 12;
  const pmt = totalOutlay / nPayments;
  let bal = totalOutlay;
  for (let m = 1; m <= nPayments; m++) {
    bal *= (1 + monthlyRate);
    bal -= pmt;
  }
  return Math.max(0, bal);
}

function Slider({ label, value, min, max, step, display, onChange, note, warn }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 11.5, color: "#374151" }}>{label}</span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1d4ed8" }}>{display(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#1d4ed8" }} />
      {note && <div style={{ fontSize: 10, color: warn ? "#b91c1c" : "#9ca3af", marginTop: 1 }}>{note}</div>}
    </div>
  );
}

function SH({ t, color }) {
  return <div style={{ fontWeight: 700, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1, color: color || "#6b7280", marginBottom: 7, marginTop: 12, borderBottom: "1px solid #e5e7eb", paddingBottom: 3 }}>{t}</div>;
}

function Bar({ label, sub, value, max, color }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color }}>{label}</span>
          {sub && <span style={{ fontSize: 10, color: "#6b7280", marginLeft: 6 }}>{sub}</span>}
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color }}>{fmt(value)}</span>
      </div>
      <div style={{ background: "#f3f4f6", borderRadius: 3, height: 8, overflow: "hidden" }}>
        <div style={{ background: color, width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", borderRadius: 3 }} />
      </div>
    </div>
  );
}

export default function App() {
  // Driving
  const [years, setYears] = useState(3);
  const [commuteDays, setCommuteDays] = useState(3);
  const [commuteMiles, setCommuteMiles] = useState(100);
  const [cityMilesPerWeek, setCityMilesPerWeek] = useState(50);

  // Gas
  const [gasPrice, setGasPrice] = useState(4.74);
  const [gasInflation, setGasInflation] = useState(12);

  // Financial
  const [tradeIn, setTradeIn] = useState(16500);
  const [investReturn, setInvestReturn] = useState(5);
  const [tucsonFinance, setTucsonFinance] = useState(false);

  // Per-vehicle overrides
  const [overrides, setOverrides] = useState({});
  const getV = (id, key) => overrides[id]?.[key] ?? VEHICLES.find(v => v.id === id)[key];
  const setV = (id, key, val) => setOverrides(o => ({ ...o, [id]: { ...o[id], [key]: val } }));

  // Financing module
  const [showFinancing, setShowFinancing] = useState(false);
  const [loanYears, setLoanYears] = useState(4);
  const [hysRate, setHysRate] = useState(4.5);
  const [selectedVehicle, setSelectedVehicle] = useState("tucsonhv");

  const wpy = 52;

  const results = useMemo(() => {
    const avgGas = gasPrice * (1 + (gasInflation / 100) * (years - 1) / 2);
    const commuteMiPerWk = commuteDays * commuteMiles;
    const totalMiPerWk = commuteMiPerWk + cityMilesPerWeek;
    const totalMi = totalMiPerWk * wpy * years;

    return VEHICLES.map(veh => {
      const msrp  = getV(veh.id, "msrp");
      const mpg   = getV(veh.id, "mpg");
      const dep   = getV(veh.id, "dep");
      const ins   = getV(veh.id, "ins");
      const maint = getV(veh.id, "maint");
      const evRange = veh.evRange || 0;
      const isTucson = TUCSON_IDS.includes(veh.id);
      const isFinanced = isTucson && tucsonFinance;

      // FUEL
      let fuel;
      if (veh.id === "volvo") {
        fuel = (totalMi / VOLVO_MPG) * avgGas;
      } else if (veh.id === "tesla") {
        fuel = (totalMi / TESLA_EFF) * HOME_ELEC;
      } else if (evRange > 0) {
        // PHEV: per-day modeling
        const cityDpW = 7 - commuteDays;
        const cityMpD = cityDpW > 0 ? cityMilesPerWeek / cityDpW : 0;
        const comElec = Math.min(evRange, commuteMiles);
        const comGas  = Math.max(0, commuteMiles - evRange);
        const citElec = Math.min(evRange, cityMpD);
        const citGas  = Math.max(0, cityMpD - evRange);
        const elecMiYr = (comElec * commuteDays + citElec * cityDpW) * wpy;
        const gasMiYr  = (comGas  * commuteDays + citGas  * cityDpW) * wpy;
        fuel = (elecMiYr * years) / PHEV_EFF * HOME_ELEC + (gasMiYr * years / mpg) * avgGas;
      } else {
        fuel = (totalMi / mpg) * avgGas;
      }

      // PURCHASE
      const salesTax    = msrp > 0 ? msrp * SALES_TAX : 0;
      const netOutlay   = msrp > 0 ? Math.max(0, msrp - tradeIn) : 0;
      const totalPurch  = netOutlay + salesTax;

      // OPPORTUNITY COST — zeroed for financed Tucsons
      const r   = investReturn / 100;
      const opp = isFinanced ? 0 : totalPurch * (Math.pow(1 + r, years) - 1);

      // DEPRECIATION
      const baseVal = msrp > 0 ? msrp : tradeIn;
      const endVal  = baseVal * Math.pow(1 - dep / 100, years);
      const depCost = baseVal - endVal;

      // MAINTENANCE & INSURANCE
      const totalIns   = ins   * years;
      const totalMaint = maint * years;

      // NET TRUE COST
      const netCost = veh.id === "volvo"
        ? fuel + totalIns + totalMaint + depCost
        : totalPurch + fuel + totalIns + totalMaint - endVal + opp;

      return {
        id: veh.id, label: veh.label, color: veh.color, note: veh.note,
        msrp, netOutlay, salesTax, totalPurch, fuel, opp, depCost,
        ins: totalIns, maint: totalMaint, endVal, isFinanced,
        total: netCost,
      };
    });
  }, [years, commuteDays, commuteMiles, cityMilesPerWeek,
      gasPrice, gasInflation, tradeIn, investReturn, tucsonFinance, overrides]);

  const totalMiPerWk = commuteDays * commuteMiles + cityMilesPerWeek;
  const totalMi = totalMiPerWk * wpy * years;
  const avgGas = gasPrice * (1 + (gasInflation / 100) * (years - 1) / 2);

  const sorted = [...results].sort((a, b) => a.total - b.total);
  const minTotal = sorted[0].total;
  const maxTotal = sorted[sorted.length - 1].total;

  // Financing calcs
  const finVeh      = VEHICLES.find(v => v.id === selectedVehicle);
  const finMSRP     = getV(selectedVehicle, "msrp");
  const finNetOut   = Math.max(0, finMSRP - tradeIn);
  const finTax      = finMSRP * SALES_TAX;
  const finTotal    = finNetOut + finTax;
  const monthlyPmt  = loanYears > 0 ? finTotal / (loanYears * 12) : 0;
  const hysEarned   = calcHYSBenefit(finTotal, loanYears, hysRate);

  const rowKeys = [
    { label: `Net purchase (after ${fmt(tradeIn)} trade-in)`, key: "netOutlay" },
    { label: "Sales tax (8.75%)", key: "salesTax" },
    { label: `Fuel/charging (avg gas $${avgGas.toFixed(2)}/gal)`, key: "fuel" },
    { label: "Insurance", key: "ins" },
    { label: "Maintenance", key: "maint" },
    { label: "Asset depreciation", key: "depCost" },
    { label: `Residual recovered (yr ${years})`, key: "endVal", negative: true },
    { label: `Opp. cost of capital (${investReturn}%/yr)${tucsonFinance ? " · Tucson = $0 (financed)" : ""}`, key: "opp", highlight: true },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 14, fontSize: 12 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>🚗 Car Cost-Benefit — 8 Scenarios</h2>
      <p style={{ fontSize: 10.5, color: "#6b7280", marginBottom: 10 }}>
        Net true cost · 8.75% CA sales tax · No federal EV/PHEV credit in 2026 · ⭐ = recommended
      </p>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11 }}>
        <strong style={{ color: "#1e40af" }}>Pattern: </strong>
        <span style={{ color: "#1e3a8a" }}>{commuteDays}×/wk highway ({commuteMiles} mi) + {cityMilesPerWeek} mi/wk city = <strong>{totalMiPerWk} mi/wk · {(totalMiPerWk * 52).toLocaleString()} mi/yr</strong></span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 14 }}>

        {/* LEFT */}
        <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, border: "1px solid #e5e7eb" }}>

          <SH t="Driving Pattern" />
          <Slider label="Commute days/wk" value={commuteDays} min={1} max={5} step={1}
            display={v => `${v}d`} onChange={setCommuteDays} note={`${commuteDays}×${commuteMiles}mi highway`} />
          <Slider label="Miles per commute day" value={commuteMiles} min={50} max={150} step={5}
            display={v => `${v} mi`} onChange={setCommuteMiles} />
          <Slider label="City miles/wk (other days)" value={cityMilesPerWeek} min={0} max={150} step={5}
            display={v => `${v} mi`} onChange={setCityMilesPerWeek} />
          <Slider label="Analysis period" value={years} min={1} max={5} step={1}
            display={v => `${v} yr`} onChange={setYears} />

          <SH t="Trade-In & Purchase" />
          <Slider label="Trade-in value" value={tradeIn} min={0} max={25000} step={500}
            display={v => fmt(v)} onChange={setTradeIn}
            note="Current offer: $15,000. 8.75% sales tax applied to full MSRP for all new cars." />

          <SH t="CA Gas Price" />
          <Slider label="Current gas price" value={gasPrice} min={3.50} max={8.00} step={0.05}
            display={v => `$${v.toFixed(2)}`} onChange={setGasPrice}
            note="CA avg $4.74 · refinery closures may push $6+" />
          <Slider label="Annual increase" value={gasInflation} min={0} max={50} step={1}
            display={v => `${v}%/yr`} onChange={setGasInflation}
            note="Default 12% reflects refinery closures" />

          <SH t="Tucson Financing" />
          <div style={{ background: tucsonFinance ? "#f0fdf4" : "#fefce8", border: `1px solid ${tucsonFinance ? "#bbf7d0" : "#fef08a"}`, borderRadius: 8, padding: 10, marginBottom: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={tucsonFinance} onChange={e => setTucsonFinance(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "#0369a1" }} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: tucsonFinance ? "#166534" : "#713f12" }}>
                {tucsonFinance ? "✓ Financing at 0% APR" : "Finance Tucson at 0% APR?"}
              </span>
            </label>
            <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 5, lineHeight: 1.6 }}>
              {tucsonFinance
                ? "Opp. cost = $0 for both Tucsons — capital stays invested. See financing module below for HYS earnings."
                : "When checked, opp. cost = $0 for Tucson models. Capital stays in HYS earning interest instead of leaving your portfolio."}
            </div>
          </div>

          <SH t="Opportunity Cost of Capital" />
          <Slider label="Expected investment return" value={investReturn} min={1} max={15} step={0.5}
            display={v => `${v}%/yr`} onChange={setInvestReturn}
            note="Foregone growth on net purchase outlay. Volvo = $0 outlay." />

          <SH t="Per-Vehicle Overrides" />
          <div style={{ fontSize: 10.5, color: "#6b7280", marginBottom: 8 }}>Fine-tune any vehicle's price, MPG, depreciation, insurance, or maintenance.</div>
          {VEHICLES.map(veh => (
            <details key={veh.id} style={{ marginBottom: 5 }}>
              <summary style={{ fontSize: 11, fontWeight: 600, color: veh.color, cursor: "pointer" }}>{veh.label}</summary>
              <div style={{ paddingLeft: 8, paddingTop: 4 }}>
                {veh.id !== "volvo" && (
                  <Slider label="Price (incl. dest.)" value={getV(veh.id, "msrp")} min={30000} max={65000} step={250}
                    display={v => fmt(v)} onChange={v => setV(veh.id, "msrp", v)} />
                )}
                {veh.id !== "tesla" && veh.id !== "volvo" && (
                  <Slider label="MPG" value={getV(veh.id, "mpg")} min={20} max={60} step={1}
                    display={v => `${v} mpg`} onChange={v => setV(veh.id, "mpg", v)} />
                )}
                <Slider label="Depreciation %/yr" value={getV(veh.id, "dep")} min={5} max={30} step={1}
                  display={v => `${v}%`} onChange={v => setV(veh.id, "dep", v)} />
                <Slider label="Insurance $/yr" value={getV(veh.id, "ins")} min={600} max={3500} step={50}
                  display={v => fmt(v)} onChange={v => setV(veh.id, "ins", v)} />
                <Slider label="Maintenance $/yr" value={getV(veh.id, "maint")} min={300} max={4500} step={50}
                  display={v => fmt(v)} onChange={v => setV(veh.id, "maint", v)}
                  warn={veh.id === "volvo" && getV("volvo", "maint") < 1000}
                  note={veh.id === "volvo" ? "Try $2,500+ to stress-test repair risk" : ""} />
              </div>
            </details>
          ))}
        </div>

        {/* RIGHT */}
        <div>
          {/* Ranked cards — top 4 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
            {sorted.slice(0, 4).map((r, rank) => (
              <div key={r.id} style={{ background: rank === 0 ? r.color : "white", borderRadius: 10, padding: 10, border: `2px solid ${r.color}` }}>
                {rank === 0 && <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.8)" }}>Best Value</div>}
                <div style={{ fontSize: 11, fontWeight: 700, color: rank === 0 ? "white" : r.color, lineHeight: 1.3, marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: rank === 0 ? "white" : r.color }}>{fmt(r.total)}</div>
                <div style={{ fontSize: 9.5, color: rank === 0 ? "rgba(255,255,255,0.75)" : "#6b7280", marginTop: 2 }}>{fmtMi(r.total / totalMi)}/mi</div>
                {r.isFinanced && <div style={{ fontSize: 9, background: "#bbf7d0", color: "#166534", borderRadius: 3, padding: "1px 4px", marginTop: 3, display:"inline-block" }}>0% financed</div>}
                <div style={{ fontSize: 9, color: rank === 0 ? "rgba(255,255,255,0.65)" : "#9ca3af", marginTop: 3, lineHeight: 1.4 }}>{r.note}</div>
                {rank > 0 && <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 4 }}>#{rank + 1} · +{fmt(r.total - minTotal)}</div>}
              </div>
            ))}
          </div>
          {/* Bottom 4 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
            {sorted.slice(4).map((r, i) => (
              <div key={r.id} style={{ background: "white", borderRadius: 10, padding: 10, border: `2px solid ${r.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: r.color, lineHeight: 1.3, marginBottom: 3 }}>{r.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{fmt(r.total)}</div>
                <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 2 }}>{fmtMi(r.total / totalMi)}/mi</div>
                {r.isFinanced && <div style={{ fontSize: 9, background: "#bbf7d0", color: "#166534", borderRadius: 3, padding: "1px 4px", marginTop: 3, display:"inline-block" }}>0% financed</div>}
                <div style={{ fontSize: 9, color: "#9ca3af", marginTop: 3, lineHeight: 1.4 }}>{r.note}</div>
                <div style={{ fontSize: 9.5, color: "#6b7280", marginTop: 4 }}>#{i + 5} · +{fmt(r.total - minTotal)}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: "white", borderRadius: 10, padding: 12, border: "1px solid #e5e7eb", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 10.5, color: "#6b7280", textTransform: "uppercase", marginBottom: 10 }}>Total Net Cost</div>
            {sorted.map(r => (
              <Bar key={r.id} label={r.label} sub={r.isFinanced ? "0% financed" : undefined}
                value={r.total} max={maxTotal} color={r.color} />
            ))}
          </div>

          {/* Breakdown table */}
          <div style={{ background: "white", borderRadius: 10, border: "1px solid #e5e7eb", overflow: "auto", marginBottom: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th style={{ padding: "6px 8px", fontSize: 10, textAlign: "left", color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>Component</th>
                  {VEHICLES.map(v => (
                    <th key={v.id} style={{ padding: "6px 5px", fontSize: 9.5, textAlign: "right", color: v.color, borderBottom: "1px solid #e5e7eb", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {v.label.replace("Sport Touring", "ST").replace("Hybrid", "HV").replace("Premium", "Prem").replace("Limited", "Ltd").replace("Model 3 Prem RWD", "M3 RWD")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowKeys.map((row, ri) => (
                  <tr key={ri} style={{ background: row.highlight ? "#fefce8" : ri % 2 === 0 ? "white" : "#fafafa" }}>
                    <td style={{ padding: "4px 8px", fontSize: 10, color: row.highlight ? "#854d0e" : "#374151", fontStyle: row.highlight ? "italic" : "normal", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>{row.label}</td>
                    {results.map(r => {
                      const val = row.negative ? -r[row.key] : r[row.key];
                      return (
                        <td key={r.id} style={{ padding: "4px 5px", fontSize: 10, textAlign: "right", borderBottom: "1px solid #f3f4f6", color: row.highlight && val > 0 ? "#b45309" : row.highlight && val === 0 && r.isFinanced ? "#166534" : "#374151" }}>
                          {fmt(val)}{row.highlight && val === 0 && r.isFinanced ? " ✓" : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr style={{ background: "#f0f9ff" }}>
                  <td style={{ padding: "6px 8px", fontSize: 11, fontWeight: 800, borderTop: "2px solid #e5e7eb" }}>NET TOTAL</td>
                  {results.map(r => (
                    <td key={r.id} style={{ padding: "6px 5px", fontSize: 11, fontWeight: 800, textAlign: "right", borderTop: "2px solid #e5e7eb", color: r.color, background: r.total === minTotal ? "#d1fae5" : undefined }}>
                      {fmt(r.total)}{r.total === minTotal ? " ✓" : ""}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financing Module */}
          <div style={{ background: "white", borderRadius: 10, border: `2px solid ${tucsonFinance ? "#166534" : "#0369a1"}`, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ background: tucsonFinance ? "#166534" : "#0369a1", padding: "10px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onClick={() => setShowFinancing(f => !f)}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "white" }}>
                  💰 0% APR Financing Module — Tucson Only
                  {tucsonFinance && <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", borderRadius: 4, padding: "2px 6px", marginLeft: 8 }}>ACTIVE</span>}
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.8)" }}>
                  {tucsonFinance ? "Opp. cost zeroed in main model · HYS earnings calculated below" : "Enable the toggle above to zero out opp. cost in the main model"}
                </div>
              </div>
              <div style={{ color: "white", fontSize: 16 }}>{showFinancing ? "▲" : "▼"}</div>
            </div>

            {showFinancing && (
              <div style={{ padding: 14 }}>
                <div style={{ background: "#eff6ff", borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 11, color: "#1e3a8a", lineHeight: 1.7 }}>
                  <strong>How this works:</strong> Instead of paying cash, you finance at 0% APR and place the full purchase outlay (net price + 8.75% tax) in a HYS account. Each month the balance earns interest, then you make your car payment from the account. The remaining balance after the final payment is pure interest earned — your reward for using the dealer's free money.
                  <br/><strong>Equivalent discount:</strong> The upfront cash discount that would give the same benefit. If a dealer offers more than this for cash payment, take the cash deal instead.
                  {tucsonFinance && <><br/><strong style={{ color: "#166534" }}>⚠️ Note:</strong> With financing active, the HYS rate ({hysRate}%) is lower than your investment return ({investReturn}%). You're earning {hysRate}% instead of {investReturn}% on that capital during the loan period — a difference of {(investReturn - hysRate).toFixed(1)}%/yr. This gap is already reflected by setting opp. cost to $0 in the main model (no opp. cost charge) rather than applying the full investment return.</>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Tucson Model</div>
                    {VEHICLES.filter(v => TUCSON_IDS.includes(v.id)).map(v => (
                      <label key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, cursor: "pointer" }}>
                        <input type="radio" name="finVeh" value={v.id} checked={selectedVehicle === v.id} onChange={() => setSelectedVehicle(v.id)} />
                        <span style={{ fontSize: 11, color: v.color, fontWeight: selectedVehicle === v.id ? 700 : 400 }}>{v.label}</span>
                      </label>
                    ))}
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 8, lineHeight: 1.7 }}>
                      MSRP: {fmt(finMSRP)}<br />
                      Trade-in: −{fmt(tradeIn)}<br />
                      Tax (8.75%): +{fmt(Math.round(finTax))}<br />
                      <strong>Total into HYS: {fmt(Math.round(finTotal))}</strong>
                    </div>
                  </div>
                  <div>
                    <Slider label="Loan term" value={loanYears} min={3} max={5} step={1}
                      display={v => `${v} years`} onChange={setLoanYears}
                      note={`${loanYears * 12} payments of ${fmt(Math.round(monthlyPmt))}/mo`} />
                    <Slider label="HYS annual rate" value={hysRate} min={2} max={8} step={0.1}
                      display={v => `${v.toFixed(1)}%`} onChange={setHysRate}
                      note="Current top HYS rates: ~4.5–5.0% (check Bankrate)" />
                  </div>
                  <div style={{ background: "#f0fdf4", borderRadius: 8, padding: 12, border: "1px solid #bbf7d0" }}>
                    <div style={{ fontSize: 10.5, color: "#166534", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Results</div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>Total outlay into HYS (incl. tax)</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0369a1" }}>{fmt(Math.round(finTotal))}</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>Monthly payment (0% APR)</div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{fmt(Math.round(monthlyPmt))}/mo</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#6b7280" }}>HYS balance after all {loanYears * 12} payments</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{fmt(Math.round(hysEarned))}</div>
                    </div>
                    <div style={{ borderTop: "1px solid #bbf7d0", paddingTop: 8 }}>
                      <div style={{ fontSize: 10.5, color: "#166534", fontWeight: 600 }}>💡 Equivalent upfront discount</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d" }}>{fmt(Math.round(hysEarned))}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2, lineHeight: 1.5 }}>
                        A cash discount of {fmt(Math.round(hysEarned))} = the interest earned keeping {fmt(Math.round(finTotal))} in HYS over the full {loanYears}-yr loan at {hysRate}%. If a dealer offers more than this for cash, take the cash deal.
                      </div>
                    </div>
                  </div>
                </div>

                {/* HYS chart */}
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: 10, border: "1px solid #e5e7eb" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#374151", marginBottom: 8 }}>HYS Balance Over Loan Term ({loanYears} yr · {loanYears * 12} payments)</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 60 }}>
                    {(() => {
                      const nMonths = loanYears * 12;
                      const mRate = hysRate / 100 / 12;
                      const pmt = finTotal / nMonths;
                      let bal = finTotal;
                      const balances = [bal];
                      for (let m = 1; m <= nMonths; m++) {
                        bal *= (1 + mRate);
                        bal -= pmt;
                        balances.push(Math.max(0, bal));
                      }
                      const maxBal = balances[0];
                      return balances.map((b, i) => (
                        <div key={i} title={`Mo ${i}: ${fmt(Math.round(b))}`} style={{
                          flex: 1, background: "#0369a1", borderRadius: "1px 1px 0 0",
                          height: `${Math.max(2, (b / maxBal) * 100)}%`,
                          opacity: 0.35 + (1 - i / balances.length) * 0.65,
                        }} />
                      ));
                    })()}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#9ca3af", marginTop: 3 }}>
                    <span>Mo 0: {fmt(Math.round(finTotal))} into HYS</span>
                    <span style={{ color: "#0369a1", fontWeight: 600 }}>After last payment: {fmt(Math.round(hysEarned))} earned</span>
                  </div>
                </div>

                <div style={{ marginTop: 10, fontSize: 10.5, color: "#6b7280", lineHeight: 1.7 }}>
                  <strong>Caveats:</strong> Assumes 0% APR is genuinely available — dealers sometimes offer cash-back vs. 0% APR, always compare. HYS rates change; the equivalent discount shrinks if rates fall. Sales tax is included in the outlay since it also leaves your account at purchase.
                </div>
              </div>
            )}
          </div>

          {/* Footer notes */}
          <div style={{ background: "#fff7ed", borderRadius: 8, padding: 10, border: "1px solid #fed7aa", fontSize: 10, color: "#7c2d12" }}>
            <strong>Notes:</strong> Volvo 24 mpg · Tesla: {L2_LABEL}, 4.1 mi/kWh · Tucson PHEV: 32mi EV range, {L2_LABEL} · Tucson HV Limited: EPA 36 mpg AWD, real-world hwy ~32–33 mpg · Sportage Hybrid SX Prestige: EPA 35 mpg AWD, real-world ~34.8 mpg · 8.75% CA sales tax on all new cars · Opp. cost = total purchase × ((1+r)^n − 1); zeroed for Tucsons when financing toggled · Dep: declining-balance from MSRP · Trade-in applied before tax.
          </div>
        </div>
      </div>
    </div>
  );
}