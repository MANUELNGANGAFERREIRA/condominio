/* ============================================================================
   charts.js
   ----------------------------------------------------------------------------
   Componentes visuais do dashboard. SVG puro, offline e sem dependências.
   Os componentes abaixo foram pensados para a tela "Início": área, linha,
   barras, donut, gauge, sparkline e distribuição empilhada.
   ============================================================================ */

function chartUid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function chartNumber(value) {
  return Number(value || 0).toLocaleString('pt-PT');
}

function buildBarChart(container, items, opts) {
  opts = opts || {};
  container.innerHTML = '';
  items = (items || []).filter(i => Number(i.value) >= 0);
  if (!items.length) return;

  const max = Math.max(1, ...items.map(i => Number(i.value)));
  const wrap = document.createElement('div');
  wrap.className = 'bar-chart professional-bars' + (opts.largeValues ? ' professional-bars-large' : '');

  items.forEach(item => {
    const pct = Math.max(0, Math.min(100, (Number(item.value) / max) * 100));
    const row = document.createElement('div');
    row.className = 'bar-chart-row';
    row.innerHTML = `
      <div class="bar-chart-meta">
        <span class="bar-chart-label">${item.label}</span>
        ${item.note ? `<span class="bar-chart-note">${item.note}</span>` : ''}
      </div>
      <span class="bar-chart-track">
        <span class="bar-chart-fill" style="width:${pct}%;background:${item.color || 'var(--primary)'}"></span>
      </span>
      <span class="bar-chart-value brut-num">${item.display !== undefined ? item.display : chartNumber(item.value)}</span>
    `;
    wrap.appendChild(row);
  });
  container.appendChild(wrap);
}

function buildLineChart(container, points, labels, opts) {
  opts = opts || {};
  container.innerHTML = '';
  points = (points || []).map(Number);
  if (!points.length) return;

  const w = 820, h = opts.height || 280, left = 44, right = 18, top = 24, bottom = 34;
  const plotW = w - left - right, plotH = h - top - bottom;
  const min = Math.min(0, ...points), max = Math.max(1, ...points);
  const range = Math.max(1, max - min);
  const step = plotW / Math.max(1, points.length - 1);
  const coords = points.map((v, i) => [
    left + i * step,
    top + (max - v) / range * plotH
  ]);

  const line = coords.map((c,i) => `${i ? 'L' : 'M'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${coords[coords.length-1][0]},${top+plotH} L${coords[0][0]},${top+plotH} Z`;
  const id = chartUid('area');

  const grid = [0, .25, .5, .75, 1].map(t => {
    const y = top + plotH * t;
    return `<line x1="${left}" x2="${w-right}" y1="${y}" y2="${y}" class="chart-grid-line"/>`;
  }).join('');

  const dots = coords.map((c,i) => `
    <g class="chart-point">
      <circle cx="${c[0]}" cy="${c[1]}" r="4.5" class="chart-point-outer"/>
      <circle cx="${c[0]}" cy="${c[1]}" r="2.2" class="chart-point-inner"/>
      <title>${(labels && labels[i]) || `Período ${i+1}`}: ${chartNumber(points[i])}${opts.suffix || ''}</title>
    </g>
  `).join('');

  const xLabels = (labels || []).map((l,i) =>
    `<text x="${coords[i][0]}" y="${h-8}" class="line-chart-axis-label" text-anchor="middle">${l}</text>`
  ).join('');
  const yLabels = [0, .25, .5, .75, 1].map(t => {
    const value = max - range * t;
    const y = top + plotH * t + 3;
    return `<text x="${left-9}" y="${y}" class="line-chart-y-label" text-anchor="end">${chartNumber(Math.round(value))}${opts.suffix || ''}</text>`;
  }).join('');
  const valueLabels = opts.showValues ? coords.map((c,i) =>
    `<text x="${c[0]}" y="${Math.max(14,c[1]-10)}" class="line-chart-value-label" text-anchor="middle">${chartNumber(points[i])}${opts.suffix || ''}</text>`
  ).join('') : '';

  container.innerHTML = `
    <div class="advanced-line-chart">
      <svg viewBox="0 0 ${w} ${h}" class="line-chart-svg" role="img" aria-label="${opts.aria || 'Gráfico de evolução'}">
        <defs>
          <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--primary)" stop-opacity=".28"/>
            <stop offset="72%" stop-color="var(--primary)" stop-opacity=".07"/>
            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grid}
        ${yLabels}
        <path d="${area}" fill="url(#${id})" class="chart-area"/>
        <path d="${line}" class="chart-line"/>
        ${dots}
        ${valueLabels}
        ${xLabels}
      </svg>
    </div>
  `;
}

function buildSparkline(container, points, opts) {
  opts = opts || {};
  container.innerHTML = '';
  points = (points || []).map(Number);
  if (points.length < 2) return;
  const w=120,h=38,p=3,max=Math.max(1,...points),min=Math.min(...points),range=Math.max(1,max-min);
  const pts=points.map((v,i)=>[
    p+i*(w-p*2)/(points.length-1),
    h-p-(v-min)/range*(h-p*2)
  ]);
  const path=pts.map((c,i)=>(i?'L':'M')+c[0].toFixed(1)+','+c[1].toFixed(1)).join(' ');
  container.innerHTML=`<svg viewBox="0 0 ${w} ${h}" class="sparkline-svg" aria-hidden="true"><path d="${path}" class="sparkline-path"/></svg>`;
}

function buildDonutChart(container, slices, opts) {
  opts = opts || {};
  container.innerHTML = '';
  slices = (slices || []).filter(s => Number(s.value) > 0);
  const total = slices.reduce((s,x)=>s+Number(x.value),0);
  if (!total) return;

  const size=190, r=68, cx=size/2, cy=size/2, stroke=18, circumference=2*Math.PI*r;
  let offset=0;
  const arcs=slices.map(slice=>{
    const len=Number(slice.value)/total*circumference;
    const arc=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${slice.color || 'var(--primary)'}" stroke-width="${stroke}" stroke-linecap="butt" stroke-dasharray="${len} ${circumference-len}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${slice.label}: ${slice.value}</title></circle>`;
    offset+=len;
    return arc;
  }).join('');

  const legend=slices.map(slice=>{
    const pct=Math.round(Number(slice.value)/total*100);
    return `<div class="donut-legend-row">
      <span class="donut-legend-dot" style="background:${slice.color || 'var(--primary)'}"></span>
      <span class="donut-legend-label">${slice.label}</span>
      <strong class="donut-legend-value brut-num">${slice.value}</strong>
      <small>${pct}%</small>
    </div>`;
  }).join('');

  container.innerHTML=`
    <div class="donut-chart professional-donut">
      <div class="donut-visual">
        <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribuição">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
          ${arcs}
          <text x="${cx}" y="${cy-2}" text-anchor="middle" class="donut-total brut-num">${chartNumber(total)}</text>
          <text x="${cx}" y="${cy+18}" text-anchor="middle" class="donut-caption">${opts.centerLabel || 'Total'}</text>
        </svg>
      </div>
      <div class="donut-legend">${legend}</div>
    </div>
  `;
}

function buildGauge(container, value, opts) {
  opts=opts||{};
  const pct=Math.max(0,Math.min(100,Number(value)||0));
  const size=190,cx=95,cy=95,r=72,stroke=13;
  const circumference=2*Math.PI*r;
  const id=chartUid('gauge');
  const label=opts.label || 'Saúde geral';
  container.innerHTML=`
    <div class="gauge-chart">
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${label}: ${Math.round(pct)}%">
        <defs>
          <linearGradient id="${id}" x1="0" x2="1">
            <stop offset="0%" stop-color="var(--primary)"/>
            <stop offset="100%" stop-color="var(--primary-strong, var(--primary))"/>
          </linearGradient>
        </defs>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="${stroke}"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}"
          stroke-linecap="round" stroke-dasharray="${(circumference*pct/100).toFixed(1)} ${circumference}"
          transform="rotate(-90 ${cx} ${cy})"/>
        <text x="${cx}" y="${cy-2}" text-anchor="middle" class="gauge-value">${Math.round(pct)}%</text>
        <text x="${cx}" y="${cy+19}" text-anchor="middle" class="gauge-label">${label}</text>
      </svg>
    </div>
  `;
}

function buildStackedChart(container, groups, opts) {
  opts=opts||{};
  container.innerHTML='';
  const wrap=document.createElement('div');
  wrap.className='stacked-chart';
  (groups||[]).forEach(group=>{
    const total=(group.parts||[]).reduce((s,p)=>s+Number(p.value||0),0);
    const parts=(group.parts||[]).filter(p=>Number(p.value)>0).map(p=>{
      const pct=total?Number(p.value)/total*100:0;
      return `<span class="stacked-part" style="width:${pct}%;background:${p.color||'var(--primary)'}" title="${p.label}: ${p.value}"></span>`;
    }).join('');
    const legend=(group.parts||[]).filter(p=>Number(p.value)>0).map(p=>`
      <span class="stacked-mini-legend"><i style="background:${p.color||'var(--primary)'}"></i>${p.label} <b>${p.value}</b></span>
    `).join('');
    wrap.innerHTML+=`
      <div class="stacked-row">
        <div class="stacked-row-head"><strong>${group.label}</strong><span>${chartNumber(total)} total</span></div>
        <div class="stacked-track">${parts || '<span class="stacked-empty"></span>'}</div>
        <div class="stacked-legends">${legend}</div>
      </div>`;
  });
  container.appendChild(wrap);
}
