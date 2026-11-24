/*
 * Local SVG chart helpers. No chart library, map, remote asset or network request is used.
 * Colours are restricted to the site's :root palette and opacity variations.
 * EDIT: Add chart types here when a later page needs a visual supported by its source data.
 */
(function (window, document) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const PALETTE = [
    'var(--color-red)',
    'var(--color-red-soft)',
    'var(--color-muted)',
    'var(--color-line)',
    'var(--color-faint)'
  ];

  function svgNode(tag, attributes, text) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attributes || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function makeSvg(container, width, height, label) {
    if (!container) throw new TypeError('A chart container is required.');
    container.classList.add('chart-wrap');
    container.replaceChildren();
    const svg = svgNode('svg', {
      viewBox: '0 0 ' + width + ' ' + height,
      role: 'img',
      'aria-label': label || 'Data chart',
      focusable: 'false'
    });
    container.appendChild(svg);
    return svg;
  }

  function titleFor(node, text) {
    node.appendChild(svgNode('title', {}, text));
    return node;
  }

  function textNode(svg, x, y, text, className, attributes) {
    svg.appendChild(svgNode('text', Object.assign({ x: x, y: y, class: className || 'chart-label' }, attributes || {}), text));
  }

  function finiteValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function formatValue(value, formatter) {
    return typeof formatter === 'function' ? formatter(value) : new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
  }

  function addChartItemInteraction(node, label, value) {
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', label + ': ' + value + '. Open details.');
    titleFor(node, label + ': ' + value);
    node.style.cursor = 'pointer';
    node.addEventListener('focus', () => node.setAttribute('opacity', '0.72'));
    node.addEventListener('blur', () => node.removeAttribute('opacity'));
    const openDetails = () => {
      if (window.ProjectApp && typeof window.ProjectApp.openDrawer === 'function') {
        const pageTitle = document.querySelector('.page-title')?.textContent.trim() || 'Project';
        const source = node.closest('[data-source]')?.getAttribute('data-source') || (pageTitle + ' page');
        const href = node.closest('[data-source-href]')?.getAttribute('data-source-href') || (document.getElementById('document-content') ? '#document-content' : '');
        window.ProjectApp.openDrawer({ title: label, text: value, source: source, href: href });
      }
    };
    node.addEventListener('click', openDetails);
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetails();
      }
    });
  }

  // Donut chart with a compact legend. Values are source amounts, not invented shares.
  function donut(container, items, options) {
    const opts = options || {};
    const data = (items || []).map((item) => ({ label: String(item.label), value: Math.max(0, finiteValue(item.value)) }));
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const width = 620;
    const height = Math.max(220, 42 + data.length * 30);
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Donut chart');
    const cx = 72;
    const cy = height / 2;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    svg.appendChild(svgNode('circle', { cx, cy, r: radius, fill: 'none', stroke: 'var(--color-line)', 'stroke-width': 24 }));

    let offset = 0;
    data.forEach((item, index) => {
      const fraction = total > 0 ? item.value / total : 0;
      const length = circumference * fraction;
      const circle = svgNode('circle', {
        cx, cy, r: radius, fill: 'none', stroke: PALETTE[index % PALETTE.length],
        'stroke-width': 24, 'stroke-dasharray': length + ' ' + Math.max(0, circumference - length),
        'stroke-dashoffset': -offset, transform: 'rotate(-90 ' + cx + ' ' + cy + ')',
        class: 'chart-segment'
      });
      addChartItemInteraction(circle, item.label, formatValue(item.value, opts.format));
      svg.appendChild(circle);
      offset += length;

      const y = 30 + index * 30;
      svg.appendChild(svgNode('circle', { cx: 142, cy: y - 4, r: 4, fill: PALETTE[index % PALETTE.length] }));
      textNode(svg, 156, y, shorten(item.label, 35), 'chart-label');
      textNode(svg, 610, y, formatValue(item.value, opts.format), 'chart-value', { 'text-anchor': 'end' });
    });

    textNode(svg, cx, cy - 2, opts.centreValue || formatValue(total, opts.format), 'chart-value', { 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700 });
    textNode(svg, cx, cy + 16, opts.centreLabel || 'Total', 'chart-label', { 'text-anchor': 'middle' });
    return svg;
  }


  // Bar chart supports horizontal ranked bars or vertical period bars.
  function bars(container, items, options) {
    const opts = options || {};
    const vertical = opts.orientation === 'vertical';
    return vertical ? verticalBars(container, items, opts) : horizontalBars(container, items, opts);
  }

  function horizontalBars(container, items, options) {
    const opts = options || {};
    const data = (items || []).map((item) => ({ label: String(item.label), value: Math.max(0, finiteValue(item.value)) }));
    const sorted = opts.sort === false ? data : data.slice().sort((a, b) => b.value - a.value);
    const width = 520;
    const rowHeight = 31;
    const top = 14;
    const height = Math.max(90, top + sorted.length * rowHeight + 10);
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Horizontal bar chart');
    const labelWidth = Math.min(220, Math.max(130, Number(opts.labelWidth) || 190));
    const barStart = labelWidth + 10;
    const barWidth = width - barStart - 75;
    const max = Math.max(1, ...sorted.map((item) => item.value));

    sorted.forEach((item, index) => {
      const y = top + index * rowHeight;
      const length = barWidth * item.value / max;
      textNode(svg, labelWidth, y + 13, shorten(item.label, 31), 'chart-label', { 'text-anchor': 'end' });
      svg.appendChild(svgNode('rect', { x: barStart, y: y + 2, width: barWidth, height: 13, rx: 6, fill: 'var(--color-red-tint)' }));
      const rect = svgNode('rect', {
        x: barStart, y: y + 2, width: Math.max(item.value ? 2 : 0, length), height: 13, rx: 6,
        fill: index === 0 ? 'var(--color-red)' : 'var(--color-red-soft)', class: 'chart-bar'
      });
      addChartItemInteraction(rect, item.label, formatValue(item.value, opts.format));
      svg.appendChild(rect);
      textNode(svg, width - 6, y + 13, formatValue(item.value, opts.format), 'chart-value', { 'text-anchor': 'end' });
    });
    return svg;
  }

  function verticalBars(container, items, options) {
    const opts = options || {};
    const data = (items || []).map((item) => ({ label: String(item.label), value: Math.max(0, finiteValue(item.value)) }));
    const width = 520;
    const height = 220;
    const left = 32;
    const right = 14;
    const top = 18;
    const bottom = 42;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;
    const slot = plotWidth / Math.max(1, data.length);
    const max = Math.max(1, ...data.map((item) => item.value));
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Vertical bar chart');

    [0, 0.5, 1].forEach((fraction) => {
      const y = top + plotHeight * fraction;
      svg.appendChild(svgNode('line', { x1: left, y1: y, x2: width - right, y2: y, class: 'chart-gridline' }));
    });
    data.forEach((item, index) => {
      const barWidth = Math.min(28, slot * 0.5);
      const barHeight = plotHeight * item.value / max;
      const x = left + slot * index + (slot - barWidth) / 2;
      const y = top + plotHeight - barHeight;
      const rect = svgNode('rect', { x, y, width: barWidth, height: Math.max(item.value ? 2 : 0, barHeight), rx: 5, fill: index === data.length - 1 ? 'var(--color-red)' : 'var(--color-red-soft)', class: 'chart-bar' });
      addChartItemInteraction(rect, item.label, formatValue(item.value, opts.format));
      svg.appendChild(rect);
      textNode(svg, x + barWidth / 2, height - 20, shorten(item.label, 10), 'chart-label', { 'text-anchor': 'middle' });
      textNode(svg, x + barWidth / 2, Math.max(12, y - 5), formatValue(item.value, opts.format), 'chart-value', { 'text-anchor': 'middle' });
    });
    return svg;
  }

  function rankedBars(container, items, options) {
    return horizontalBars(container, items, options || {});
  }

  // Lollipop chart with an optional highlighted value (for example the ROI scenario).
  function lollipop(container, items, options) {
    const opts = options || {};
    const data = (items || []).map((item) => ({ label: String(item.label), value: finiteValue(item.value) }));
    const width = 520;
    const height = 230;
    const left = 38;
    const right = 18;
    const top = 24;
    const bottom = 46;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;
    const min = Math.min(0, ...data.map((item) => item.value));
    const max = Math.max(1, ...data.map((item) => item.value));
    const range = Math.max(1, max - min);
    const zeroY = top + (max / range) * plotHeight;
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Lollipop chart');
    svg.appendChild(svgNode('line', { x1: left, y1: zeroY, x2: width - right, y2: zeroY, class: 'chart-gridline' }));
    svg.appendChild(svgNode('line', { x1: left, y1: top + plotHeight, x2: width - right, y2: top + plotHeight, class: 'chart-guide' }));

    const slot = plotWidth / Math.max(1, data.length);
    data.forEach((item, index) => {
      const x = left + slot * (index + 0.5);
      const y = top + ((max - item.value) / range) * plotHeight;
      const highlighted = index === Number(opts.highlightIndex);
      const stem = svgNode('line', { x1: x, y1: zeroY, x2: x, y2: y, class: highlighted ? 'chart-stem is-highlighted' : 'chart-stem' });
      addChartItemInteraction(stem, item.label, formatValue(item.value, opts.format) + (opts.suffix || ''));
      svg.appendChild(stem);
      const dot = svgNode('circle', { cx: x, cy: y, r: 5, class: highlighted ? 'chart-dot is-highlighted' : 'chart-dot' });
      addChartItemInteraction(dot, item.label, formatValue(item.value, opts.format) + (opts.suffix || ''));
      svg.appendChild(dot);
      textNode(svg, x, height - 19, item.label, 'chart-label', { 'text-anchor': 'middle' });
      textNode(svg, x, Math.max(12, y - 10), formatValue(item.value, opts.format) + (opts.suffix || ''), 'chart-value', { 'text-anchor': 'middle' });
    });
    return svg;
  }

  function line(container, items, options) {
    const opts = options || {};
    const data = (items || []).map((item) => ({ label: String(item.label), value: finiteValue(item.value) }));
    const width = 520;
    const height = 220;
    const left = 34;
    const right = 18;
    const top = 20;
    const bottom = 38;
    const plotHeight = height - top - bottom;
    const plotWidth = width - left - right;
    const min = Math.min(0, ...data.map((item) => item.value));
    const max = Math.max(1, ...data.map((item) => item.value));
    const range = Math.max(1, max - min);
    const points = data.map((item, index) => {
      const x = data.length < 2 ? left + plotWidth / 2 : left + (plotWidth * index / (data.length - 1));
      const y = top + ((max - item.value) / range) * plotHeight;
      return { x, y, item };
    });
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Line chart');
    [0, 0.5, 1].forEach((fraction) => {
      const y = top + plotHeight * fraction;
      svg.appendChild(svgNode('line', { x1: left, y1: y, x2: width - right, y2: y, class: 'chart-gridline' }));
    });
    const path = points.map((point, index) => (index ? 'L' : 'M') + point.x + ' ' + point.y).join(' ');
    svg.appendChild(svgNode('path', { d: path, class: 'chart-line' }));
    points.forEach((point) => {
      const circle = svgNode('circle', { cx: point.x, cy: point.y, r: 4, class: 'chart-point', fill: 'var(--color-red)' });
      addChartItemInteraction(circle, point.item.label, formatValue(point.item.value, opts.format));
      svg.appendChild(circle);
      textNode(svg, point.x, height - 16, shorten(point.item.label, 12), 'chart-label', { 'text-anchor': 'middle' });
    });
    return svg;
  }

  // Progress gauge: actual value and maximum must come from source data or user input.
  function gauge(container, value, maximum, options) {
    const opts = options || {};
    const current = Math.max(0, finiteValue(value));
    const max = Math.max(1, finiteValue(maximum));
    const ratio = Math.max(0, Math.min(1, current / max));
    const width = 360;
    const height = 220;
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Gauge');
    const cx = 180;
    const cy = 108;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    svg.appendChild(svgNode('circle', { cx, cy, r: radius, fill: 'none', stroke: 'var(--color-line)', 'stroke-width': 16 }));
    const ring = svgNode('circle', {
      cx, cy, r: radius, fill: 'none', stroke: 'var(--color-red)', 'stroke-width': 16,
      'stroke-dasharray': (circumference * ratio) + ' ' + circumference,
      'stroke-linecap': 'round', transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    });
    addChartItemInteraction(ring, opts.label || 'Value', formatValue(current, opts.format) + ' / ' + formatValue(max, opts.format));
    svg.appendChild(ring);
    textNode(svg, cx, cy - 2, opts.valueLabel || formatValue(current, opts.format), 'chart-value', { 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700 });
    textNode(svg, cx, cy + 19, opts.label || (Math.round(ratio * 100) + '%'), 'chart-label', { 'text-anchor': 'middle' });
    return svg;
  }

  // Route-style timeline, intentionally abstract: no geographic map or inferred location.
  function route(container, activities, options) {
    const opts = options || {};
    const data = (activities || []).map((activity) => ({ name: String(activity.name), periods: activity.periods || [] }));
    const width = 720;
    const height = 190;
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Numbered project activity route');
    const points = data.map((item, index) => ({
      x: 42 + (data.length < 2 ? 0 : index * (width - 84) / (data.length - 1)),
      y: 92 + Math.sin(index * 1.3) * 34,
      item,
      index
    }));
    const path = points.map((point, index) => {
      if (!index) return 'M ' + point.x + ' ' + point.y;
      const previous = points[index - 1];
      const midpoint = (previous.x + point.x) / 2;
      return 'C ' + midpoint + ' ' + previous.y + ', ' + midpoint + ' ' + point.y + ', ' + point.x + ' ' + point.y;
    }).join(' ');
    svg.appendChild(svgNode('path', { d: path, class: 'route-path' }));
    points.forEach((point) => {
      const circle = svgNode('circle', { cx: point.x, cy: point.y, r: 12, class: 'route-stop' });
      addChartItemInteraction(circle, point.item.name, point.item.periods.join(', '));
      svg.appendChild(circle);
      svg.appendChild(svgNode('text', { x: point.x, y: point.y, class: 'route-stop-number' }, point.index + 1));
      textNode(svg, point.x, Math.min(height - 12, point.y + 32), shorten(point.item.name, 18), 'chart-label', { 'text-anchor': 'middle' });
    });
    return svg;
  }

  // Gantt-lite SVG. Each highlighted period is taken directly from the schedule matrix.
  function gantt(container, periods, activities, options) {
    const opts = options || {};
    const names = (periods || []).map(String);
    const tasks = (activities || []).map((activity) => ({
      name: String(activity.name),
      periods: activity.periods || [],
      conditional: Boolean(activity.conditional)
    }));
    const width = Math.max(560, 250 + names.length * 74);
    const labelWidth = 230;
    const top = 38;
    const rowHeight = 32;
    const height = top + tasks.length * rowHeight + 16;
    const cellWidth = (width - labelWidth - 12) / Math.max(1, names.length);
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Project Gantt schedule');

    names.forEach((period, index) => textNode(svg, labelWidth + index * cellWidth + cellWidth / 2, 20, period, 'chart-label', { 'text-anchor': 'middle' }));
    tasks.forEach((task, rowIndex) => {
      const y = top + rowIndex * rowHeight;
      textNode(svg, labelWidth - 8, y + 18, shorten(task.name, 34), 'chart-label', { 'text-anchor': 'end' });
      names.forEach((period, colIndex) => {
        const x = labelWidth + colIndex * cellWidth;
        const active = task.periods.includes(period);
        svg.appendChild(svgNode('rect', { x, y: y + 3, width: cellWidth - 4, height: 23, rx: 4, fill: 'var(--color-red-tint)', stroke: 'var(--color-line)', 'stroke-width': 0.6 }));
        if (active) {
          const rect = svgNode('rect', {
            x, y: y + 3, width: cellWidth - 4, height: 23, rx: 4,
            fill: task.conditional ? 'var(--color-red-soft)' : 'var(--color-red)', class: 'chart-bar'
          });
          addChartItemInteraction(rect, task.name, period + (task.conditional ? ' (conditional)' : ''));
          svg.appendChild(rect);
        }
      });
      svg.appendChild(svgNode('line', { x1: labelWidth - 4, y1: y + rowHeight, x2: width, y2: y + rowHeight, class: 'chart-gridline' }));
    });
    return svg;
  }

  // Generic matrix for source-backed comparisons. No scores or probabilities are inferred.
  function matrix(container, rowLabels, columnLabels, values, options) {
    const opts = options || {};
    const rows = (rowLabels || []).map(String);
    const columns = (columnLabels || []).map(String);
    const width = Math.max(360, 170 + columns.length * 86);
    const labelWidth = 155;
    const top = 48;
    const rowHeight = 42;
    const cellWidth = (width - labelWidth - 10) / Math.max(1, columns.length);
    const height = top + rows.length * rowHeight + 8;
    const svg = makeSvg(container, width, height, opts.ariaLabel || 'Comparison matrix');

    columns.forEach((label, index) => textNode(svg, labelWidth + index * cellWidth + cellWidth / 2, 26, shorten(label, 14), 'chart-label', { 'text-anchor': 'middle' }));
    rows.forEach((label, rowIndex) => {
      const y = top + rowIndex * rowHeight;
      textNode(svg, labelWidth - 9, y + 25, shorten(label, 22), 'chart-label', { 'text-anchor': 'end' });
      columns.forEach((column, columnIndex) => {
        const item = values?.[rowIndex]?.[columnIndex];
        const x = labelWidth + columnIndex * cellWidth;
        const hasValue = item !== undefined && item !== null && item !== '';
        const value = typeof item === 'object' ? (item.label ?? item.value ?? '') : item;
        const intensity = typeof item === 'object' && Number.isFinite(Number(item.intensity))
          ? Math.max(0.12, Math.min(1, Number(item.intensity))) : (hasValue ? 0.45 : 0.12);
        const rect = svgNode('rect', {
          x, y: y + 3, width: cellWidth - 5, height: 32, rx: 5,
          fill: hasValue ? 'var(--color-red)' : 'var(--color-panel)',
          'fill-opacity': intensity,
          stroke: 'var(--color-line)', 'stroke-width': 0.7
        });
        if (hasValue) addChartItemInteraction(rect, label + ' / ' + column, String(value));
        svg.appendChild(rect);
        if (hasValue) textNode(svg, x + (cellWidth - 5) / 2, y + 23, String(value), 'chart-value', { 'text-anchor': 'middle' });
      });
    });
    return svg;
  }

  function shorten(value, length) {
    const text = String(value);
    return text.length > length ? text.slice(0, Math.max(1, length - 1)) + '…' : text;
  }

  window.ProjectCharts = {
    donut: donut,
    bars: bars,
    verticalBars: verticalBars,
    rankedBars: rankedBars,
    lollipop: lollipop,
    line: line,
    gauge: gauge,
    route: route,
    gantt: gantt,
    matrix: matrix
  };
})(window, document);
