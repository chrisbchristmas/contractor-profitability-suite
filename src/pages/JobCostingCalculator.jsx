import React from "react";
import SeoMeta from "@/components/seo/SeoMeta";
import LeadCapture from "@/components/leads/LeadCapture";

const HTML_CONTENT = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Free Construction Job Costing Calculator</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;background:#0d1b2a;color:#e8edf3}.wrap{max-width:780px;margin:0 auto;padding:40px 20px 80px}.logo{font-size:1rem;font-weight:700;color:#4fa3e0;text-decoration:none;display:block;margin-bottom:48px}h1{font-size:clamp(1.6rem,5vw,2.2rem);font-weight:800;color:#fff;margin-bottom:16px}.intro{color:#a8b8c8;margin-bottom:40px}.card{background:#162033;border:1px solid #243046;border-radius:12px;padding:32px;margin-bottom:40px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.field{display:flex;flex-direction:column;gap:6px}label{font-size:.8rem;font-weight:700;text-transform:uppercase;color:#6b8299}input{background:#0d1b2a;border:1.5px solid #243046;border-radius:8px;color:#e8edf3;font-size:1.1rem;padding:10px 14px;width:100%}input:focus{outline:none;border-color:#4fa3e0}.hint{font-size:.75rem;color:#4a5f72}.results{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}.rbox{background:#0d1b2a;border:1.5px solid #243046;border-radius:10px;padding:16px}.rl{font-size:.75rem;font-weight:700;text-transform:uppercase;color:#6b8299;margin-bottom:6px}.rv{font-size:1.5rem;font-weight:800;color:#fff}.srow{grid-column:1/-1}.badge{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:8px;font-weight:700;background:#1a2535;color:#6b8299;border:1.5px solid #243046}.badge.on{background:#0d2b1a;border-color:#1a7a40;color:#3dd68c}.badge.mid{background:#2b2200;border-color:#7a5500;color:#f5a623}.badge.low{background:#2b0d0d;border-color:#7a1a1a;color:#f55353}.dot{width:10px;height:10px;border-radius:50%;background:currentColor}.cta{background:linear-gradient(135deg,#1a3a5c,#162033);border:1px solid #2a4a6a;border-radius:12px;padding:36px;text-align:center;margin-bottom:56px}.cta h2{color:#fff;font-size:1.4rem;margin-bottom:12px}.cta p{color:#a8b8c8;margin-bottom:24px}.cta a{background:#4fa3e0;color:#fff;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block}.faq h2{color:#fff;font-size:1.3rem;font-weight:800;margin-bottom:24px}.fi{border-bottom:1px solid #1e2e42;padding:20px 0}.fq{color:#c8d8e8;font-weight:700;margin-bottom:8px}.fa{color:#7a92a8;line-height:1.7}</style></head><body><div class="wrap"><a href="https://contractorprofitabilitysuite.com" class="logo">Contractor Profitability Suite</a><h1>Free Construction Job Costing Calculator</h1><p class="intro">Enter your project numbers to instantly see your gross margin, markup, and whether your job is on target.</p><div class="card"><div class="grid"><div class="field"><label>Contract Value ($)</label><input type="number" id="cv" placeholder="0" min="0"/></div><div class="field"><label>Labor Cost ($)</label><input type="number" id="lc" placeholder="0" min="0"/></div><div class="field"><label>Material Cost ($)</label><input type="number" id="mc" placeholder="0" min="0"/></div><div class="field"><label>Overhead %</label><input type="number" id="oh" value="15" min="0" max="100"/><span class="hint">Default: 15%</span></div><div class="field"><label>Profit Target %</label><input type="number" id="pt" value="20" min="0" max="100"/><span class="hint">Default: 20%</span></div></div><div class="results"><div class="rbox"><div class="rl">Total Cost</div><div class="rv" id="otc">-</div></div><div class="rbox"><div class="rl">Gross Profit</div><div class="rv" id="ogp">-</div></div><div class="rbox"><div class="rl">Gross Margin</div><div class="rv" id="ogm">-</div></div><div class="rbox"><div class="rl">Markup</div><div class="rv" id="omu">-</div></div><div class="srow"><div class="badge" id="sb"><span class="dot"></span><span id="st">Enter your numbers above</span></div></div></div></div><div class="cta"><h2>Want real-time job costing on every project?</h2><p>Contractor Pro tracks live margin, prices change orders accurately, and flags leakage before it costs you. Plans from $19/month.</p><a href="https://contractorprofitabilitysuite.com">See Plans and Pricing</a></div><div class="faq"><h2>Job Costing FAQ</h2><div class="fi"><div class="fq">What is job costing in construction?</div><div class="fa">Job costing tracks all costs on a specific project so you know whether each job made money, not just whether the business did overall.</div></div><div class="fi"><div class="fq">What is the difference between margin and markup?</div><div class="fa">Markup is profit as a percentage of cost. Margin is profit as a percentage of revenue. A 25% markup is only a 20% margin.</div></div><div class="fi"><div class="fq">What overhead should I include?</div><div class="fa">Vehicle costs, insurance, tools, office expenses, software, and your own salary. Typically 10-20% of direct costs for small contractors.</div></div><div class="fi"><div class="fq">Why do contractors lose money on busy jobs?</div><div class="fa">Change orders priced too low, labor overruns, overhead missing from bids, and scope creep that never gets billed.</div></div></div></div><script>document.querySelectorAll("input").forEach(i=>i.addEventListener("input",calc));function fmt(n){return"$"+n.toLocaleString("en-US",{maximumFractionDigits:0})}function pct(n){return n.toFixed(1)+"%"}function calc(){var cv=+document.getElementById("cv").value||0,lc=+document.getElementById("lc").value||0,mc=+document.getElementById("mc").value||0,oh=(+document.getElementById("oh").value||0)/100,pt=+document.getElementById("pt").value||0;if(!cv&&!lc&&!mc){["otc","ogp","ogm","omu"].forEach(id=>document.getElementById(id).textContent="-");set("","Enter your numbers above");return}var dc=lc+mc,tc=dc*(1+oh),gp=cv-tc,gm=cv>0?(gp/cv)*100:0,mu=tc>0?(gp/tc)*100:0;document.getElementById("otc").textContent=fmt(tc);document.getElementById("ogp").textContent=fmt(gp);document.getElementById("ogm").textContent=pct(gm);document.getElementById("omu").textContent=pct(mu);var d=gm-pt;if(gp<0)set("low","Below cost - this job loses money");else if(d>=0)set("on","On target - "+pct(gm)+" margin");else if(d>=-5)set("mid","Borderline - "+pct(gm)+" margin");else set("low","Below target - "+pct(gm)+" margin")}function set(c,m){document.getElementById("sb").className="badge"+(c?" "+c:"");document.getElementById("st").textContent=m}</script></body></html>`;

export default function JobCostingCalculator() {
  const frameRef = React.useRef(null);

  const getCalcData = () => {
    try {
      const doc = frameRef.current && frameRef.current.contentDocument;
      if (!doc) return {};
      const num = (id) => parseFloat((doc.getElementById(id) || {}).value) || 0;
      const text = (id) => (doc.getElementById(id) || {}).textContent || "";
      return {
        inputs: {
          contract_value: num("cv"),
          labor_cost: num("lc"),
          material_cost: num("mc"),
          overhead_percent: num("oh"),
          profit_target_percent: num("pt"),
        },
        result: {
          total_cost: text("otc"),
          gross_profit: text("ogp"),
          gross_margin: text("ogm"),
          markup: text("omu"),
        },
      };
    } catch (e) {
      return {};
    }
  };

  return (
    <div>
      <SeoMeta title="Free Construction Job Costing Calculator | Free Tool" />
      <iframe
        ref={frameRef}
        srcDoc={HTML_CONTENT}
        title="Free Construction Job Costing Calculator"
        style={{ border: "none", width: "100%", height: "100vh", display: "block" }}
      />
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <LeadCapture source="job-costing-calculator" getCalcData={getCalcData} />
      </div>
    </div>
  );
}