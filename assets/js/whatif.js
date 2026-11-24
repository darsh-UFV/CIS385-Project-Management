/*
 * Interactive what-if workspace for Fraser Valley Preparedness Research Lab.
 * All document values come from PROJECT_DATA. Any missing relationship is labelled
 * as an editable assumption - not from the document.
 * No network requests, libraries, storage or server are used.
 * EDIT: Adjust only the controls labelled as assumptions when testing a model.
 */
(function (global) {
  'use strict';

  const root = document.getElementById('whatif-root');
  const data = global.PROJECT_DATA;
  if (!root || !data) return;

  const money = (value, digits = 1) => 'CAD $' + Number(value).toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + 'm';
  const number = (value, digits = 1) => Number(value).toLocaleString('en-CA', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)));
  const round = (value, digits = 1) => Number(Number(value).toFixed(digits));
  const escapeHTML = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const baseline = data.cost.documentedTotals.deliveryBaseline;
  const reserve = data.cost.documentedTotals.sponsorControlledReserve;
  const ceiling = data.cost.documentedTotals.fundingCeiling;
  const baselineMonths = 36;
  const baselineClose = new Date(2029, 11, 31);
  const halfYearLabels = data.time.periods;
  const activities = data.time.activities;
  const accounts = data.cost.accounts;
  const upToAccounts = accounts.filter((account) => account.quantityQualifier === 'up to' && Number.isFinite(account.quantity) && Number.isFinite(account.unitCost));
  const upToAccountIds = new Set(upToAccounts.map((account) => account.id));
  const conditionalAccount = accounts.find((account) => account.conditional);
  const labourAccount = accounts.find((account) => account.id === 'direct-labour-backfill');
  const returnData = data.returnAnalysis;

  function dateAtMonthOffset(offset) {
    const date = new Date(2027, 0, 1);
    date.setMonth(date.getMonth() + Math.max(0, Math.round(offset)));
    date.setDate(0);
    return date;
  }

  function addMonthsToDate(date, months) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const targetDay = copy.getDate();
    copy.setDate(1);
    copy.setMonth(copy.getMonth() + Math.round(months));
    const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
    copy.setDate(Math.min(targetDay, lastDay));
    return copy;
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function periodForMonth(monthOffset) {
    const index = Math.max(0, Math.floor(monthOffset / 6));
    if (index < halfYearLabels.length) return halfYearLabels[index];
    const year = 2027 + Math.floor(index / 2);
    return year + (index % 2 === 0 ? ' H1' : ' H2');
  }

  function periodSpan(startMonth, endMonthExclusive) {
    if (endMonthExclusive <= startMonth) endMonthExclusive = startMonth + 1;
    const first = periodForMonth(startMonth);
    const last = periodForMonth(endMonthExclusive - 1);
    return first === last ? first : first + ' – ' + last;
  }

  // Derive variable and fixed portions from the quantity x unit-cost bases in the document.
  function accountBreakdown(account) {
    let variable = 0;
    if (Array.isArray(account.components)) {
      account.components.forEach((component) => {
        if (Number.isFinite(component.quantity) && Number.isFinite(component.unitCost)) {
          variable += component.quantity * component.unitCost;
        } else if (Number.isFinite(component.quantity) && Number.isFinite(component.unitCostPerSiteYear) && Number.isFinite(component.years)) {
          variable += component.quantity * component.years * component.unitCostPerSiteYear;
        }
      });
    } else if (Number.isFinite(account.quantity) && Number.isFinite(account.unitCost)) {
      variable = account.quantity * account.unitCost;
    }
    return { variable, fixed: Math.max(0, account.amount - variable) };
  }

  const accountParts = accounts.map((account) => ({ account, ...accountBreakdown(account) }));
  const calculatedBaseline = accountParts.reduce((sum, part) => sum + part.variable + part.fixed, 0);

  function accountAmountsAtScope(scopePercent) {
    const factor = scopePercent / 100;
    return accountParts.map((part) => ({
      id: part.account.id,
      name: part.account.name,
      amount: part.fixed + part.variable * factor,
      baseline: part.account.amount,
      variable: part.variable,
      fixed: part.fixed,
      conditional: Boolean(part.account.conditional)
    }));
  }

  function naturalDuration(scopePercent, monthsPerPoint) {
    return clamp(baselineMonths + (scopePercent - 100) * monthsPerPoint, 18, 60);
  }

  function modelCost(scopePercent, durationMonths, assumptions) {
    const accountRows = accountAmountsAtScope(scopePercent);
    const scopedDelivery = accountRows.reduce((sum, row) => sum + row.amount, 0);
    const naturalMonths = naturalDuration(scopePercent, assumptions.monthsPerPoint);
    const compressedMonths = Math.max(0, naturalMonths - durationMonths);
    const compressionPremium = baseline * (assumptions.compressionPercent / 100) * compressedMonths;
    return { accountRows, scopedDelivery, naturalMonths, compressedMonths, compressionPremium, total: scopedDelivery + compressionPremium };
  }

  function solveScopeForBudget(target, durationMonths, assumptions) {
    const minModel = modelCost(50, durationMonths, assumptions).total;
    const maxModel = modelCost(130, durationMonths, assumptions).total;
    if (target < minModel) return { scope: 50, model: modelCost(50, durationMonths, assumptions), reachable: false };
    if (target >= maxModel) return { scope: 130, model: modelCost(130, durationMonths, assumptions), reachable: true };
    let low = 50;
    let high = 130;
    for (let i = 0; i < 45; i += 1) {
      const mid = (low + high) / 2;
      if (modelCost(mid, durationMonths, assumptions).total <= target) low = mid;
      else high = mid;
    }
    return { scope: low, model: modelCost(low, durationMonths, assumptions), reachable: true };
  }

  // Budget-driven scope uses the natural duration for each candidate scope level.
  function solveScopeNaturalForBudget(target, assumptions) {
    const minScope = modelCost(50, naturalDuration(50, assumptions.monthsPerPoint), assumptions).total;
    const maxScope = modelCost(130, naturalDuration(130, assumptions.monthsPerPoint), assumptions).total;
    if (target < minScope) return { scope: 50, model: modelCost(50, naturalDuration(50, assumptions.monthsPerPoint), assumptions), reachable: false };
    if (target >= maxScope) return { scope: 130, model: modelCost(130, naturalDuration(130, assumptions.monthsPerPoint), assumptions), reachable: true };
    let low = 50;
    let high = 130;
    for (let i = 0; i < 45; i += 1) {
      const mid = (low + high) / 2;
      const duration = naturalDuration(mid, assumptions.monthsPerPoint);
      if (modelCost(mid, duration, assumptions).total <= target) low = mid;
      else high = mid;
    }
    const duration = naturalDuration(low, assumptions.monthsPerPoint);
    return { scope: low, model: modelCost(low, duration, assumptions), reachable: true };
  }

  function solveDurationForBudget(scopePercent, target, assumptions, fallbackDuration) {
    const natural = naturalDuration(scopePercent, assumptions.monthsPerPoint);
    const baseModel = modelCost(scopePercent, natural, assumptions);
    if (target >= baseModel.total) return { duration: natural, model: baseModel, reachable: true };
    if (assumptions.compressionPercent <= 0) return { duration: 18, model: modelCost(scopePercent, 18, assumptions), reachable: false };
    const monthlyPremium = baseline * assumptions.compressionPercent / 100;
    const neededCompression = (target - baseModel.scopedDelivery) / monthlyPremium;
    if (neededCompression < 0) return { duration: 18, model: modelCost(scopePercent, 18, assumptions), reachable: false };
    const duration = clamp(natural - neededCompression, 18, 60);
    const model = modelCost(scopePercent, duration, assumptions);
    return { duration, model, reachable: model.total <= target + 0.01 };
  }

  const state = {
    scope: 100,
    duration: 36,
    costLimit: ceiling,
    lock: 'none',
    lockValue: { scope: 100, duration: 36, costLimit: ceiling },
    driver: 'scope',
    assumptions: { monthsPerPoint: 0.15, compressionPercent: 0.5 },
    scenarioSaves: []
  };

  function readAssumptions() {
    state.assumptions.monthsPerPoint = clamp(root.querySelector('#wf-scope-months')?.value ?? 0.15, 0, 0.5);
    state.assumptions.compressionPercent = clamp(root.querySelector('#wf-compression-rate')?.value ?? 0.5, 0, 3);
  }

  function updateTriple(driver) {
    readAssumptions();
    const assumptions = state.assumptions;
    state.driver = driver;
    let scope = state.scope;
    let duration = state.duration;
    let costLimit = state.costLimit;
    let note = '';

    if (state.lock === 'none') {
      if (driver === 'scope') {
        scope = clamp(root.querySelector('#wf-scope')?.value ?? scope, 50, 130);
        duration = naturalDuration(scope, assumptions.monthsPerPoint);
      } else if (driver === 'time') {
        duration = clamp(root.querySelector('#wf-time')?.value ?? duration, 18, 60);
        scope = assumptions.monthsPerPoint > 0
          ? clamp(100 + (duration - baselineMonths) / assumptions.monthsPerPoint, 50, 130)
          : 100;
      } else if (driver === 'cost') {
        costLimit = clamp(root.querySelector('#wf-cost')?.value ?? costLimit, 500, 1300);
        const solved = solveScopeNaturalForBudget(costLimit, assumptions);
        scope = solved.scope;
        duration = naturalDuration(scope, assumptions.monthsPerPoint);
        if (!solved.reachable) note = 'The selected budget is below the minimum modelled cost at 50% scope.';
        else if (solved.scope >= 129.99 && solved.model.total < costLimit - 0.1) note = 'The scope reached its 130% model limit; some of the selected budget remains unused.';
      }
    } else if (state.lock === 'scope') {
      scope = state.lockValue.scope;
      if (driver === 'time') duration = clamp(root.querySelector('#wf-time')?.value ?? duration, 18, 60);
      if (driver === 'cost') {
        costLimit = clamp(root.querySelector('#wf-cost')?.value ?? costLimit, 500, 1300);
        const solved = solveDurationForBudget(scope, costLimit, assumptions, duration);
        duration = solved.duration;
        if (!solved.reachable) note = 'The locked scope has a minimum cost that exceeds the selected budget; the shortest available schedule does not close the gap.';
      }
    } else if (state.lock === 'time') {
      duration = state.lockValue.duration;
      if (driver === 'scope') scope = clamp(root.querySelector('#wf-scope')?.value ?? scope, 50, 130);
      if (driver === 'cost') {
        costLimit = clamp(root.querySelector('#wf-cost')?.value ?? costLimit, 500, 1300);
        const solved = solveScopeForBudget(costLimit, duration, assumptions);
        scope = solved.scope;
        if (!solved.reachable) note = 'The locked duration and minimum 50% scope still exceed the selected budget.';
      }
    } else if (state.lock === 'cost') {
      costLimit = state.lockValue.costLimit;
      if (driver === 'scope') {
        const requestedScope = clamp(root.querySelector('#wf-scope')?.value ?? scope, 50, 130);
        const requestedModel = modelCost(requestedScope, naturalDuration(requestedScope, assumptions.monthsPerPoint), assumptions);
        if (requestedModel.total <= costLimit) scope = requestedScope;
        else {
          scope = solveScopeNaturalForBudget(costLimit, assumptions).scope;
          note = 'The locked budget limits the requested scope; scope was reduced to the highest modelled level within the budget.';
        }
        duration = naturalDuration(scope, assumptions.monthsPerPoint);
      }
      if (driver === 'time') {
        const requestedDuration = clamp(root.querySelector('#wf-time')?.value ?? duration, 18, 60);
        const derivedScope = assumptions.monthsPerPoint > 0
          ? clamp(100 + (requestedDuration - baselineMonths) / assumptions.monthsPerPoint, 50, 130)
          : 100;
        const requestedModel = modelCost(derivedScope, requestedDuration, assumptions);
        if (requestedModel.total <= costLimit) {
          duration = requestedDuration;
          scope = derivedScope;
        } else {
          const solved = solveScopeForBudget(costLimit, requestedDuration, assumptions);
          scope = solved.scope;
          duration = requestedDuration;
          note = 'The locked budget limits the scope that can fit within the selected duration.';
        }
      }
    }

    state.scope = clamp(scope, 50, 130);
    state.duration = clamp(duration, 18, 60);
    state.costLimit = clamp(costLimit, 500, 1300);
    renderTriple(note);
  }

  function renderTriple(note = '') {
    const assumptions = state.assumptions;
    const model = modelCost(state.scope, state.duration, assumptions);
    const close = dateAtMonthOffset(state.duration);
    const deltaCost = model.total - baseline;
    const reserveUsed = Math.max(0, model.total - baseline);
    const reserveLeft = reserve - reserveUsed;
    const overCeiling = Math.max(0, model.total - ceiling);
    const activeLock = state.lock;

    const scopeControl = root.querySelector('#wf-scope');
    const timeControl = root.querySelector('#wf-time');
    const costControl = root.querySelector('#wf-cost');
    if (scopeControl) { scopeControl.value = String(round(state.scope, 1)); scopeControl.disabled = activeLock === 'scope'; }
    if (timeControl) { timeControl.value = String(round(state.duration, 1)); timeControl.disabled = activeLock === 'time'; }
    if (costControl) { costControl.value = String(Math.round(state.costLimit)); costControl.disabled = activeLock === 'cost'; }
    const scopeValue = root.querySelector('#wf-scope-value');
    const timeValue = root.querySelector('#wf-time-value');
    const costValue = root.querySelector('#wf-cost-value');
    if (scopeValue) scopeValue.textContent = number(state.scope, 1) + '%';
    if (timeValue) timeValue.textContent = number(state.duration, 1) + ' months';
    if (costValue) costValue.textContent = money(state.costLimit, 0);

    const upToValues = upToAccounts.map((account) => ({
      name: account.name,
      value: Math.round(account.quantity * state.scope / 100),
      unit: account.unit
    }));
    root.querySelector('#wf-scope-quantities').innerHTML = upToValues.map((item) => '<span><strong>' + number(item.value, 0) + '</strong><small>' + escapeHTML(item.name) + '</small></span>').join('');

    const costRows = model.accountRows.map((row) => {
      const delta = row.amount - row.baseline;
      return '<tr><td>' + escapeHTML(row.name) + (row.conditional ? ' <span class="wf-mini-tag">Conditional</span>' : '') + '</td><td>' + money(row.baseline) + '</td><td>' + money(row.amount) + '</td><td class="' + (delta > 0.01 ? 'wf-up' : delta < -0.01 ? 'wf-down' : '') + '">' + (delta > 0.01 ? '+' : '') + money(delta) + '</td></tr>';
    }).join('');
    root.querySelector('#wf-account-changes').innerHTML = costRows;

    const activityRows = activities.map((activity, index) => {
      const basePeriods = activity.periods.map((label) => halfYearLabels.indexOf(label)).filter((period) => period >= 0);
      const baseStart = Math.min.apply(null, basePeriods) * 6;
      const baseEnd = (Math.max.apply(null, basePeriods) + 1) * 6;
      const scale = state.duration / baselineMonths;
      const newStart = Math.round(baseStart * scale);
      const newEnd = Math.max(newStart + 1, Math.round(baseEnd * scale));
      const baseRange = periodSpan(baseStart, baseEnd);
      const newRange = periodSpan(newStart, newEnd);
      const moved = baseRange !== newRange;
      return '<tr><td>' + (index + 1) + '. ' + escapeHTML(activity.name) + '</td><td>' + escapeHTML(baseRange) + '</td><td>' + escapeHTML(newRange) + '</td><td>' + (moved ? '<span class="wf-mini-tag">Moved</span>' : 'No change') + '</td></tr>';
    }).join('');
    root.querySelector('#wf-activity-moves').innerHTML = activityRows;

    const chartMax = ceiling * 1.3;
    const chartRows = [
      { label: 'Document delivery baseline', value: baseline, fill: 'var(--color-muted)' },
      { label: 'Scenario delivery cost', value: model.total, fill: 'var(--color-red)' },
      { label: 'Funding ceiling', value: ceiling, fill: 'var(--color-red-soft)' }
    ];
    const chartParts = chartRows.map((item, index) => {
      const y = 18 + index * 40;
      const width = clamp(item.value / chartMax * 350, 0, 350);
      return '<text x="0" y="' + (y + 11) + '" class="wf-svg-label">' + item.label + '</text>' +
        '<rect x="205" y="' + y + '" width="350" height="15" rx="7" class="wf-svg-track" />' +
        '<rect x="205" y="' + y + '" width="' + width.toFixed(1) + '" height="15" rx="7" style="fill:' + item.fill + '" />' +
        '<text x="565" y="' + (y + 11) + '" class="wf-svg-value">' + money(item.value, 0) + '</text>';
    }).join('');
    root.querySelector('#wf-baseline-vs-scenario').innerHTML = '<svg viewBox="0 0 690 138" role="img" aria-label="Baseline delivery cost, scenario delivery cost and funding ceiling comparison"><title>Baseline versus scenario cost comparison</title>' + chartParts + '</svg>';

    const verdict = [];
    if (overCeiling > 0.01) verdict.push('The scenario exceeds the documented funding ceiling by ' + money(overCeiling) + '.');
    else if (reserveUsed > 0.01) verdict.push(money(reserveUsed) + ' of the sponsor-controlled reserve is used; ' + money(Math.max(0, reserveLeft)) + ' remains.');
    else verdict.push('The scenario remains within the delivery baseline; no reserve is modelled as used.');
    if (close > baselineClose) verdict.push('The projected closing date is ' + formatDate(close) + ', after the document’s December 31, 2029 closing date.');
    else if (close < baselineClose) verdict.push('The modelled closing date is ' + formatDate(close) + ', before the document’s December 31, 2029 closing date.');
    else verdict.push('The modelled closing date matches December 31, 2029.');
    if (note) verdict.push(note);
    const verdictNode = root.querySelector('#wf-triple-verdict');
    verdictNode.innerHTML = verdict.map((line) => '<p>' + escapeHTML(line) + '</p>').join('');
    root.querySelector('#wf-triple-values').innerHTML = [
      ['Scope', number(state.scope, 1) + '%', signedPercent(state.scope - 100)],
      ['Duration', number(state.duration, 1) + ' months', signedPercent((state.duration / 36 - 1) * 100)],
      ['Modelled delivery cost', money(model.total), signedPercent((deltaCost / baseline) * 100)],
      ['Closing date', formatDate(close), close > baselineClose ? 'After baseline' : close < baselineClose ? 'Before baseline' : 'Baseline date']
    ].map((item) => '<div class="wf-output"><small>' + item[0] + '</small><strong>' + item[1] + '</strong><span>' + item[2] + '</span></div>').join('');
    root.querySelector('#wf-triple-footnote').textContent = 'Assumption — not from the document: the start is anchored to January 1, 2027 because the Word document specifies January 2027 but not a specific day. Scope is applied to quantity-based budget lines; non-quantity components remain fixed. The time relationship and compression premium are editable assumptions. The activity-period view proportionally stretches the source schedule as a visual model assumption.';

    root.querySelector('#wf-cost-unallocated').textContent = model.total > state.costLimit + 0.01
      ? 'Selected cost cap not met: the modelled delivery cost exceeds it by ' + money(model.total - state.costLimit) + '. Review the lock setting or assumptions.'
      : 'Budget cap not allocated by the model: ' + money(Math.max(0, state.costLimit - model.total)) + '. A budget ceiling is not treated as a target to spend.';
  }

  function signedPercent(value) {
    return (value > 0 ? '+' : '') + number(value, 1) + '%';
  }

  function miniSummary(items) {
    return '<div class="wf-mini-summary">' + items.map((item) => '<div><small>' + item.label + '</small><strong>' + item.value + '</strong></div>').join('') + '</div>';
  }

  function table(headers, rows, className = '') {
    return '<div class="wf-table-wrap"><table class="wf-table ' + className + '"><thead><tr>' + headers.map((header) => '<th scope="col">' + header + '</th>').join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function scenarioCard(id, title, description, content, open = false) {
    return '<details class="wf-scenario" id="' + id + '" ' + (open ? 'open' : '') + '><summary><span class="wf-scenario__number">' + id.replace('wf-', '').replace(/[^0-9]/g, '') + '</span><span><strong>' + title + '</strong><small>' + description + '</small></span><span class="wf-chevron" aria-hidden="true">⌄</span></summary><div class="wf-scenario__body">' + content + '</div></details>';
  }

  function render() {
    const quantityControls = upToAccounts.map((account, index) => '<label class="wf-field"><span>' + escapeHTML(account.name) + '</span><input type="number" min="0" max="' + Math.round(account.quantity * 1.5) + '" step="1" value="' + account.quantity + '" data-quantity-id="' + escapeHTML(account.id) + '"><small>Document: up to ' + number(account.quantity, 0) + ' ' + escapeHTML(account.unit) + '; unit cost ' + money(account.unitCost, 2) + ' per item.</small></label>').join('');
    const riskCards = data.risks.map((risk) => '<div class="wf-risk" data-risk-id="' + risk.id + '"><label class="wf-risk__select"><input type="checkbox" data-risk-check="' + risk.id + '"><span><strong>' + risk.id + '. ' + escapeHTML(risk.name) + '</strong><small>Proposed owner: ' + escapeHTML(risk.owner) + '</small></span></label><div class="wf-risk__details"><p><b>Trigger</b> — ' + escapeHTML(risk.trigger) + '</p><p><b>Prevention</b> — ' + escapeHTML(risk.prevention) + '</p><div class="wf-risk__inputs"><label class="wf-field"><span>Delay (months; user-entered)</span><input type="number" min="0" max="36" step="1" value="0" data-risk-delay="' + risk.id + '"></label><label class="wf-field"><span>Cost impact (CAD millions; user-entered)</span><input type="number" min="0" max="1000" step="1" value="0" data-risk-cost="' + risk.id + '"></label></div></div></div>').join('');
    const budgetAccountOptions = accounts.map((account) => '<option value="' + escapeHTML(account.id) + '">' + escapeHTML(account.name) + '</option>').join('');
    const roiPresetOptions = returnData.scenarios.map((scenario, index) => '<option value="' + index + '">Document scenario ' + (index + 1) + ' — ' + money(scenario.annualGrossBenefit, 0) + ' annual gross benefit</option>').join('');

    const tripleContent = '<div class="wf-triple-grid">' +
      '<div class="wf-panel wf-panel--controls"><div class="wf-panel__heading"><div><h3>Linked constraints</h3><p>Move one control; the model recalculates the others.</p></div><label class="wf-field wf-lock"><span>Lock constraint</span><select id="wf-lock" class="select-control"><option value="none">None</option><option value="scope">Scope</option><option value="time">Time</option><option value="cost">Cost</option></select></label></div>' +
      '<label class="wf-slider"><span><b>Scope</b><strong id="wf-scope-value">100%</strong></span><small>Percent of planned quantity-based scope (50%–130%)</small><input id="wf-scope" type="range" min="50" max="130" step="1" value="100"></label>' +
      '<label class="wf-slider"><span><b>Time</b><strong id="wf-time-value">36 months</strong></span><small>Project duration from the January 2027 start period (18–60 months)</small><input id="wf-time" type="range" min="18" max="60" step="1" value="36"></label>' +
      '<label class="wf-slider"><span><b>Cost cap</b><strong id="wf-cost-value">CAD $1,000m</strong></span><small>Available total cost against the documented funding ceiling (CAD millions)</small><input id="wf-cost" type="range" min="500" max="1300" step="10" value="1000"></label>' +
      '<div class="wf-quantity-board"><b>Quantity counts at this scope</b><div id="wf-scope-quantities"></div></div>' +
      '<div class="wf-assumptions"><h4>Editable model assumptions — not from the document</h4><div class="wf-assumption-grid"><label class="wf-field"><span>Extra duration per +1 scope percentage point (months)</span><input id="wf-scope-months" type="number" min="0" max="0.5" step="0.01" value="0.15"></label><label class="wf-field"><span>Schedule compression premium per month (% of baseline)</span><input id="wf-compression-rate" type="number" min="0" max="3" step="0.1" value="0.5"></label></div></div>' +
      '<div class="wf-actions"><button type="button" class="button-secondary" id="wf-reset">Reset to document baseline</button><button type="button" class="button-primary" id="wf-save">Save scenario</button><span id="wf-save-status" aria-live="polite"></span></div></div>' +
      '<div class="wf-panel wf-panel--results"><div class="wf-panel__heading"><div><h3>Baseline versus scenario</h3><p>Derived values only; no actual spending or progress.</p></div><span class="wf-source">Source: Cost and Time pages</span></div><div id="wf-triple-values" class="wf-output-grid"></div><div id="wf-baseline-vs-scenario" class="wf-meters"></div><div id="wf-triple-verdict" class="wf-verdict" aria-live="polite"></div><p id="wf-cost-unallocated" class="wf-muted"></p><p id="wf-triple-footnote" class="wf-muted"></p></div></div>' +
      '<div class="wf-panel"><div class="wf-panel__heading"><h3>Cost account changes</h3><span class="wf-source">Source: Cost page</span></div>' + '<div class="wf-table-wrap"><table class="wf-table"><thead><tr><th>Cost account</th><th>Document baseline</th><th>Scenario</th><th>Change</th></tr></thead><tbody id="wf-account-changes"></tbody></table></div></div>' +
      '<div class="wf-panel"><div class="wf-panel__heading"><div><h3>Schedule activity movement</h3><p>Periods are proportionally stretched as a model assumption, not a document fact.</p></div><span class="wf-source">Source: Time page</span></div><div class="wf-table-wrap"><table class="wf-table"><thead><tr><th>Activity</th><th>Document periods</th><th>Scenario periods</th><th>Change</th></tr></thead><tbody id="wf-activity-moves"></tbody></table></div></div>' +
      '<details class="wf-formula"><summary>How this is calculated</summary><div><p><b>Quantity-based cost:</b> fixed account components + (documented quantities × documented unit costs × scope percentage).</p><p><b>Natural duration:</b> 36 months + (scope percentage − 100) × the editable months-per-percentage-point assumption.</p><p><b>Compression premium:</b> CAD 900m × assumed monthly premium × months compressed below natural duration.</p><p><b>Modelled cost:</b> sum of quantity-adjusted cost accounts + compression premium. Reserve used = max(0, modelled cost − CAD 900m). Funding-ceiling breach = max(0, modelled cost − CAD 1,000m).</p><p><b>Projected closing date:</b> January 2027 plus the scenario duration, ending on the last day of the resulting month.</p><p><b>Schedule display:</b> each source activity window is proportionally stretched to the scenario duration. The document does not provide task dependencies or a scope-to-time conversion.</p></div></details>';

    const delayContent = '<div class="wf-control-row"><label class="wf-field"><span>Activity to delay</span><select id="wf-delay-activity" class="select-control">' + activities.map((activity, index) => '<option value="' + index + '">' + (index + 1) + '. ' + escapeHTML(activity.name) + '</option>').join('') + '</select></label><label class="wf-field"><span>Delay (months)</span><input id="wf-delay-months" type="number" min="0" max="36" step="1" value="3"></label></div><div id="wf-delay-result" class="wf-live-result" aria-live="polite"></div><p class="wf-assumption-note">Assumption — not from the document: the selected activity and every later activity in the document’s schedule order shift by the entered number of months. Activity durations are preserved; the final close activity therefore shifts by the same amount.</p>';

    const fallback = data.time.timingNotes.find((note) => note.fallback);
    const fallbackContent = '<label class="wf-check-line"><input id="wf-fallback-toggle" type="checkbox"><span><b>Apply the document’s data-access fallback</b><small>Switch from normal live-data testing to the documented fallback.</small></span></label><blockquote class="wf-verbatim">' + escapeHTML(fallback.note) + '</blockquote><label class="wf-field"><span>Optional live-testing delay to model (months; assumption — not from the document)</span><input id="wf-fallback-delay" type="number" min="0" max="36" step="1" value="0"></label><div id="wf-fallback-result" class="wf-live-result" aria-live="polite"></div><p class="wf-assumption-note">The note does not quantify a closing-date impact. With a zero user-entered delay, the model reports the testing change but does not invent a project delay.</p>';

    const expansionContent = '<label class="wf-check-line"><input id="wf-expansion-approved" type="checkbox" checked><span><b>Expansion approved</b><small>The schedule activity is conditional in the document.</small></span></label><div class="wf-verbatim">' + escapeHTML(activities.find((activity) => activity.conditional).name) + '</div><label class="wf-check-line wf-check-line--sub"><input id="wf-expansion-account" type="checkbox"><span><b>Treat the conditional budget account as unreleased</b><small>' + escapeHTML(conditionalAccount.name) + ': ' + money(conditionalAccount.amount, 0) + ' — this linkage is an assumption, not stated in the document.</small></span></label><div id="wf-expansion-result" class="wf-live-result" aria-live="polite"></div>';

    const cutContent = '<div class="wf-control-row"><label class="wf-field"><span>Budget cut</span><input id="wf-cut-percent" type="range" min="0" max="50" step="1" value="10"><small id="wf-cut-label">10% reduction from the CAD 900m delivery baseline</small></label><label class="wf-field"><span>Cut method</span><select id="wf-cut-method" class="select-control"><option value="proportional">Reduce all accounts proportionally</option><option value="protect">Protect one account</option></select></label><label class="wf-field" id="wf-protect-wrap"><span>Protected account</span><select id="wf-protect-account" class="select-control">' + budgetAccountOptions + '</select></label></div><div id="wf-cut-result" class="wf-live-result" aria-live="polite"></div>';

    const inflationContent = '<div class="wf-control-row"><label class="wf-field"><span>Unit-cost inflation</span><input id="wf-inflation-percent" type="range" min="0" max="50" step="1" value="5"><small id="wf-inflation-label">5% increase</small></label><label class="wf-field"><span>Apply to</span><select id="wf-inflation-scope" class="select-control"><option value="all">All cost accounts</option><option value="one">One selected account</option></select></label><label class="wf-field"><span>Account</span><select id="wf-inflation-account" class="select-control">' + budgetAccountOptions + '</select></label></div><div id="wf-inflation-result" class="wf-live-result" aria-live="polite"></div>';

    const quantitiesContent = '<p class="wf-muted">Change each document quantity marked “up to”. The unit costs remain at the documented rates.</p><div class="wf-quantity-inputs">' + quantityControls + '</div><div id="wf-quantity-result" class="wf-live-result" aria-live="polite"></div>';

    const reserveContent = '<label class="wf-field"><span>Authorized reserve drawdown (CAD millions)</span><input id="wf-reserve-draw" type="range" min="0" max="150" step="1" value="0"><small id="wf-reserve-label">CAD $0m used</small></label><div id="wf-reserve-result" class="wf-live-result" aria-live="polite"></div><p class="wf-assumption-note">The document identifies a CAD 100m sponsor-controlled reserve. The amount and authorization event are user-entered scenario values.</p>';

    const labourContent = '<label class="wf-field"><span>Direct labour and partner backfill (FTE-years)</span><input id="wf-labour-years" type="range" min="300" max="900" step="10" value="600"><small id="wf-labour-label">600 FTE-years</small></label><div id="wf-labour-result" class="wf-live-result" aria-live="polite"></div><p class="wf-muted">Documented rate: CAD 0.150 million per FTE-year. Documented baseline: 600 FTE-years and CAD 90 million.</p>';

    const risksContent = '<p class="wf-assumption-note">All event impacts start at zero. Select a risk and enter the delay and cost impact yourself. No risk probability or impact is pre-filled as a fact. Assumption — not from the document: selected delays are added sequentially to the closing date; selected costs draw from the sponsor-controlled reserve.</p><div class="wf-risk-list">' + riskCards + '</div><div id="wf-risk-result" class="wf-live-result" aria-live="polite"></div>';

    const roiContent = '<div class="wf-control-row"><label class="wf-field"><span>Preset</span><select id="wf-roi-preset" class="select-control"><option value="custom">Custom</option>' + roiPresetOptions + '</select></label><label class="wf-field"><span>Annual gross benefit (CAD millions)</span><input id="wf-roi-benefit" type="range" min="0" max="250" step="1" value="20"><small id="wf-roi-benefit-label">CAD $20m</small></label><label class="wf-field"><span>Annual operating cost (CAD millions)</span><input id="wf-roi-opex" type="range" min="0" max="100" step="1" value="35"><small id="wf-roi-opex-label">CAD $35m</small></label><label class="wf-field"><span>Horizon (years)</span><input id="wf-roi-horizon" type="range" min="1" max="30" step="1" value="10"><small id="wf-roi-horizon-label">10 years</small></label><label class="wf-field"><span>Discount rate</span><input id="wf-roi-rate" type="range" min="0" max="15" step="0.25" value="3"><small id="wf-roi-rate-label">3.00%</small></label></div><div id="wf-roi-result" class="wf-live-result" aria-live="polite"></div><div id="wf-roi-document-check" class="wf-document-check"></div><details class="wf-formula wf-formula--nested"><summary>ROI explorer formulas</summary><div><p>Investment = documented funding ceiling (CAD 1,000m).</p><p>Annual net = annual gross benefit − annual operating cost.</p><p>Simple payback = investment ÷ annual net, when annual net is positive.</p><p>NPV = −investment + annual net × annuity factor, where annuity factor = (1 − (1 + discount rate)<sup>−horizon</sup>) ÷ discount rate. At a zero discount rate, the annuity factor equals the horizon.</p><p>ROI = (total gross benefit − total cost) ÷ total cost × 100, where total cost = investment + operating cost × horizon.</p></div></details>';

    root.innerHTML = '<style>' + buildStyles() + '</style>' +
      '<div class="wf-intro"><div><span class="wf-kicker">PLANNED / DERIVED / WHAT-IF ONLY</span><h2>Scenario workspace</h2><p>Test changes against the document baseline. These calculations do not represent actual project spending, progress or approvals.</p></div><span class="wf-intro__source">Source: Project proposal</span></div>' +
      '<section class="wf-section"><div class="wf-section__head"><div><h3>Triple-constraint model</h3><p>Scope, time and cost interact through explicitly labelled model assumptions.</p></div><span class="wf-section__index">01</span></div>' + tripleContent + '</section>' +
      '<section class="wf-section"><div class="wf-section__head"><div><h3>Additional scenario tools</h3><p>Each tool starts from the document baseline unless its inputs specify otherwise.</p></div><span class="wf-section__index">02–11</span></div><div class="wf-scenario-list">' +
      scenarioCard('wf-scenario-1', 'Delay an activity', 'Shift a selected task and every later schedule activity.', delayContent) +
      scenarioCard('wf-scenario-2', 'Data-access fallback', 'Apply the timing note exactly; enter any delay impact separately.', fallbackContent) +
      scenarioCard('wf-scenario-3', 'Expansion decision', 'Toggle the conditional expansion activity and separately model account release.', expansionContent) +
      scenarioCard('wf-scenario-4', 'Budget cut', 'Reduce account allocations proportionally or protect one account.', cutContent) +
      scenarioCard('wf-scenario-5', 'Unit-cost inflation', 'Increase all accounts or one selected account.', inflationContent) +
      scenarioCard('wf-scenario-6', 'Quantity explorer', 'Change each documented “up to” quantity.', quantitiesContent) +
      scenarioCard('wf-scenario-7', 'Reserve drawdown', 'Model authorized changes or risk events using the documented reserve.', reserveContent) +
      scenarioCard('wf-scenario-8', 'Labour sensitivity', 'Change direct labour FTE-years using the documented rate.', labourContent) +
      scenarioCard('wf-scenario-9', 'Risk-event simulator', 'Select any of the ten risks and enter impacts yourself.', risksContent) +
      scenarioCard('wf-scenario-10', 'ROI and payback explorer', 'Recalculate payback, NPV and ROI using the document formulas.', roiContent, true) +
      '</div></section>' +
      '<section class="wf-section wf-saved-section"><div class="wf-section__head"><div><h3>Saved triple-constraint scenarios</h3><p>Compare up to three saved scenarios side by side. Saved in this page session only.</p></div><span class="wf-section__index">COMPARE</span></div><div id="wf-saved-scenarios" class="wf-saved-grid"><p class="wf-muted">No scenarios saved yet.</p></div></section>';

    wireTriple();
    wireScenarios();
    updateTriple('scope');
    updateDelay();
    updateFallback();
    updateExpansion();
    updateBudgetCut();
    updateInflation();
    updateQuantities();
    updateReserve();
    updateLabour();
    updateRisks();
    updateROI();
  }

  function buildStyles() {
    return `
      #whatif-root{display:grid;gap:24px;color:var(--color-nav)}
      #whatif-root *{box-sizing:border-box}
      .wf-intro,.wf-section__head,.wf-panel__heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
      .wf-intro{padding:18px 20px;border:1px solid var(--color-line);border-radius:20px;background:var(--color-card)}
      .wf-intro h2{margin:4px 0 6px;color:var(--color-title);font-size:24px;font-weight:500;letter-spacing:-.04em}
      .wf-intro p,.wf-section__head p,.wf-panel__heading p{margin:0;color:var(--color-muted);font-size:11px;line-height:1.55}
      .wf-kicker,.wf-section__index,.wf-source{color:var(--color-muted);font-size:9px;font-weight:700;letter-spacing:.08em}
      .wf-intro__source{white-space:nowrap;color:var(--color-muted);font-size:10px}
      .wf-section{display:grid;gap:12px}
      .wf-section__head{align-items:center;padding:0 2px}
      .wf-section__head h3,.wf-panel__heading h3{margin:0 0 4px;color:var(--color-title);font-size:17px;font-weight:500}
      .wf-section__index{padding:6px 9px;border:1px solid var(--color-line);border-radius:999px;white-space:nowrap}
      .wf-triple-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
      .wf-panel{min-width:0;padding:17px;border:1px solid var(--color-line);border-radius:19px;background:var(--color-card);display:grid;align-content:start;gap:14px}
      .wf-panel--controls{grid-row:span 2}
      .wf-panel__heading{align-items:center}
      .wf-panel__heading h3{font-size:15px}
      .wf-panel__heading p{font-size:10px}
      .wf-lock{min-width:118px;max-width:150px}
      .wf-field{display:grid;gap:6px;min-width:0;color:var(--color-nav);font-size:10px;font-weight:600}
      .wf-field small{color:var(--color-muted);font-size:9px;font-weight:400;line-height:1.4}
      .wf-field input:disabled,.wf-slider input:disabled{opacity:.45;cursor:not-allowed}
      .wf-slider{display:grid;gap:6px;padding:11px 12px;border:1px solid var(--color-line);border-radius:13px;background:var(--color-panel)}
      .wf-slider>span{display:flex;justify-content:space-between;gap:10px;font-size:11px}
      .wf-slider>span b{font-weight:600}
      .wf-slider>span strong{color:var(--color-red);font-size:12px;font-variant-numeric:tabular-nums}
      .wf-slider>small{color:var(--color-muted);font-size:9px}
      .wf-slider input{width:100%;accent-color:var(--color-red)}
      .wf-quantity-board{display:grid;gap:8px;padding:12px;border-radius:13px;background:var(--color-red-tint);font-size:10px}
      .wf-quantity-board>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .wf-quantity-board span{display:grid;gap:2px;min-width:0}
      .wf-quantity-board strong{font-size:16px;color:var(--color-red);font-variant-numeric:tabular-nums}
      .wf-quantity-board small{color:var(--color-muted);font-size:9px;line-height:1.35}
      .wf-assumptions{padding:12px;border:1px dashed var(--color-red-soft);border-radius:13px}
      .wf-assumptions h4{margin:0 0 9px;color:var(--color-red);font-size:10px}
      .wf-assumption-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
      .wf-assumption-note{margin:10px 0 0;padding:10px 12px;border-left:3px solid var(--color-red-soft);background:var(--color-red-tint);color:var(--color-muted);font-size:10px;line-height:1.55}
      .wf-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .wf-actions [aria-live]{color:var(--color-muted);font-size:10px}
      .wf-output-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      .wf-output,.wf-mini-summary>div{display:grid;gap:3px;padding:11px;border-radius:12px;background:var(--color-panel);min-width:0}
      .wf-output small,.wf-mini-summary small{color:var(--color-muted);font-size:9px}
      .wf-output strong,.wf-mini-summary strong{color:var(--color-title);font-size:15px;font-weight:600;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
      .wf-output span{color:var(--color-red);font-size:9px}
      .wf-meters{display:grid;gap:10px}.wf-meters svg{display:block;width:100%;height:auto;overflow:visible}.wf-svg-label{fill:var(--color-muted);font-size:11px}.wf-svg-value{fill:var(--color-nav);font-size:10px;text-anchor:start}.wf-svg-track{fill:var(--color-line)}
      .wf-meter-row{display:grid;gap:5px}
      .wf-meter-row>div:first-child{display:flex;justify-content:space-between;gap:10px;color:var(--color-muted);font-size:9px}
      .wf-meter-row strong{color:var(--color-nav);font-size:9px;white-space:nowrap}
      .wf-meter{height:8px;overflow:hidden;border-radius:99px;background:var(--color-line)}
      .wf-meter>span{display:block;height:100%;border-radius:99px;background:var(--color-red)}
      .wf-meter__scenario{background:var(--color-red-soft)!important}
      .wf-meter__ceiling{background:var(--color-muted)!important}
      .wf-verdict{padding:10px 12px;border-radius:12px;background:var(--color-red-tint);color:var(--color-nav);font-size:10px;line-height:1.5}
      .wf-verdict p{margin:0 0 5px}.wf-verdict p:last-child{margin:0}
      .wf-muted{margin:0;color:var(--color-muted);font-size:10px;line-height:1.5}
      .wf-table-wrap{width:100%;overflow-x:auto}
      .wf-table{width:100%;border-collapse:collapse;font-size:10px;min-width:560px}
      .wf-table th,.wf-table td{padding:9px 8px;border-bottom:1px solid var(--color-line);text-align:left;vertical-align:top}
      .wf-table th{color:var(--color-muted);font-size:9px;font-weight:600;white-space:nowrap}
      .wf-table td{color:var(--color-nav);line-height:1.4}
      .wf-mini-tag{display:inline-block;margin:2px;padding:2px 6px;border-radius:99px;background:var(--color-red-tint);color:var(--color-red);font-size:8px;white-space:nowrap}
      .wf-up{color:var(--color-red)!important}.wf-down{color:var(--color-muted)!important}
      .wf-formula{border:1px solid var(--color-line);border-radius:13px;background:var(--color-panel);padding:11px 13px}
      .wf-formula>summary{cursor:pointer;color:var(--color-nav);font-size:10px;font-weight:700}
      .wf-formula>div{padding-top:8px;color:var(--color-muted);font-size:10px;line-height:1.55}
      .wf-formula p{margin:5px 0}
      .wf-scenario-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:start}
      .wf-scenario{min-width:0;border:1px solid var(--color-line);border-radius:16px;background:var(--color-card);overflow:hidden}
      .wf-scenario>summary{display:grid;grid-template-columns:26px minmax(0,1fr) 16px;align-items:center;gap:10px;padding:14px;cursor:pointer;list-style:none}
      .wf-scenario>summary::-webkit-details-marker{display:none}
      .wf-scenario__number{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;background:var(--color-red);color:var(--color-card);font-size:10px;font-weight:700}
      .wf-scenario>summary strong{display:block;color:var(--color-title);font-size:12px;font-weight:600}
      .wf-scenario>summary small{display:block;margin-top:3px;color:var(--color-muted);font-size:9px;line-height:1.35}
      .wf-chevron{color:var(--color-muted);transition:transform .15s ease}
      .wf-scenario[open] .wf-chevron{transform:rotate(180deg)}
      .wf-scenario__body{display:grid;gap:12px;padding:0 14px 15px;border-top:1px solid var(--color-line)}
      .wf-control-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding-top:12px}
      .wf-control-row .wf-field:only-child{grid-column:1/-1}
      .wf-live-result{min-width:0;padding:11px;border-radius:12px;background:var(--color-panel);color:var(--color-nav);font-size:10px;line-height:1.5}
      .wf-live-result:empty{display:none}
      .wf-live-result strong{color:var(--color-title)}
      .wf-live-result p{margin:4px 0}
      .wf-live-result p:last-child{margin-bottom:0}
      .wf-verbatim{margin:0;padding:10px 12px;border-left:3px solid var(--color-red);background:var(--color-red-tint);color:var(--color-nav);font-size:10px;line-height:1.55}
      .wf-check-line{display:flex;align-items:flex-start;gap:9px;padding-top:12px;font-size:10px;cursor:pointer}
      .wf-check-line input{margin:2px 0 0;accent-color:var(--color-red)}
      .wf-check-line b,.wf-check-line small{display:block}
      .wf-check-line b{font-size:10px;color:var(--color-title)}
      .wf-check-line small{margin-top:3px;color:var(--color-muted);font-size:9px;line-height:1.45}
      .wf-check-line--sub{padding:10px;border-radius:11px;background:var(--color-panel)}
      .wf-quantity-inputs{display:grid;gap:9px;padding-top:10px}
      .wf-quantity-inputs .wf-field{grid-template-columns:minmax(0,1fr) 110px;align-items:center}
      .wf-quantity-inputs .wf-field small{grid-column:1/-1}
      .wf-risk-list{display:grid;gap:8px;padding-top:10px}
      .wf-risk{padding:10px;border:1px solid var(--color-line);border-radius:12px}
      .wf-risk__select{display:flex;align-items:center;gap:9px;cursor:pointer}
      .wf-risk__select input{accent-color:var(--color-red)}
      .wf-risk__select strong,.wf-risk__select small{display:block}
      .wf-risk__select strong{font-size:10px;color:var(--color-title)}
      .wf-risk__select small{font-size:9px;color:var(--color-muted);margin-top:2px}
      .wf-risk__details{display:grid;gap:5px;padding:9px 0 0 23px;color:var(--color-muted);font-size:9px}
      .wf-risk__details p{margin:0;line-height:1.45}
      .wf-risk__details b{color:var(--color-nav)}
      .wf-risk__inputs{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:6px}
      .wf-document-check{font-size:10px;color:var(--color-muted)}
      .wf-document-check table{width:100%;border-collapse:collapse}
      .wf-document-check th,.wf-document-check td{padding:7px;border-bottom:1px solid var(--color-line);text-align:left}
      .wf-document-check .wf-match{color:var(--color-red);font-weight:700}
      .wf-saved-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
      .wf-saved-card{display:grid;gap:6px;padding:13px;border:1px solid var(--color-line);border-radius:13px;background:var(--color-card)}
      .wf-saved-card strong{font-size:11px;color:var(--color-title)}
      .wf-saved-card span{font-size:9px;color:var(--color-muted)}
      .wf-saved-card button{justify-self:start}
      .wf-saved-section{padding-bottom:8px}
      @media(max-width:850px){.wf-triple-grid{grid-template-columns:1fr}.wf-panel--controls{grid-row:auto}.wf-scenario-list{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.wf-scenario-list,.wf-assumption-grid,.wf-control-row,.wf-risk__inputs{grid-template-columns:1fr}.wf-output-grid{grid-template-columns:1fr 1fr}.wf-saved-grid{grid-template-columns:1fr}.wf-intro{display:grid}.wf-intro__source{white-space:normal}.wf-panel{padding:13px}.wf-quantity-board>div{grid-template-columns:1fr 1fr}}
      @media print{#whatif-root .wf-scenario:not([open])>.wf-scenario__body{display:none}#whatif-root .wf-actions,#whatif-root input,#whatif-root select{print-color-adjust:exact}}
    `;
  }


  function handleAssumptionChange() {
    readAssumptions();
    let note = '';
    if (state.lock === 'scope') {
      state.duration = naturalDuration(state.scope, state.assumptions.monthsPerPoint);
    } else if (state.lock === 'time') {
      state.scope = state.assumptions.monthsPerPoint > 0
        ? clamp(100 + (state.duration - baselineMonths) / state.assumptions.monthsPerPoint, 50, 130)
        : 100;
    } else if (state.lock === 'cost') {
      const solved = solveScopeNaturalForBudget(state.costLimit, state.assumptions);
      state.scope = solved.scope;
      state.duration = naturalDuration(state.scope, state.assumptions.monthsPerPoint);
      if (!solved.reachable) note = 'The locked budget is below the minimum modelled cost at 50% scope.';
    }
    renderTriple(note);
  }

  function wireTriple() {
    root.querySelector('#wf-scope').addEventListener('input', () => updateTriple('scope'));
    root.querySelector('#wf-time').addEventListener('input', () => updateTriple('time'));
    root.querySelector('#wf-cost').addEventListener('input', () => updateTriple('cost'));
    root.querySelector('#wf-scope-months').addEventListener('change', handleAssumptionChange);
    root.querySelector('#wf-compression-rate').addEventListener('change', handleAssumptionChange);
    root.querySelector('#wf-lock').addEventListener('change', (event) => {
      state.lock = event.target.value;
      state.lockValue = { scope: state.scope, duration: state.duration, costLimit: state.costLimit };
      updateTriple(state.driver);
    });
    root.querySelector('#wf-reset').addEventListener('click', () => {
      state.scope = 100; state.duration = 36; state.costLimit = ceiling;
      state.lock = 'none'; state.lockValue = { scope: 100, duration: 36, costLimit: ceiling };
      state.assumptions = { monthsPerPoint: 0.15, compressionPercent: 0.5 };
      root.querySelector('#wf-lock').value = 'none';
      root.querySelector('#wf-scope').value = '100';
      root.querySelector('#wf-time').value = '36';
      root.querySelector('#wf-cost').value = String(ceiling);
      root.querySelector('#wf-scope-months').value = '0.15';
      root.querySelector('#wf-compression-rate').value = '0.5';
      updateTriple('scope');
    });
    root.querySelector('#wf-save').addEventListener('click', saveTripleScenario);
  }

  function wireScenarios() {
    const on = (selector, event, handler) => {
      const node = root.querySelector(selector);
      if (node) node.addEventListener(event, handler);
    };
    ['#wf-delay-activity', '#wf-delay-months'].forEach((selector) => on(selector, 'input', updateDelay));
    on('#wf-fallback-toggle', 'change', updateFallback);
    on('#wf-fallback-delay', 'input', updateFallback);
    on('#wf-expansion-approved', 'change', updateExpansion);
    on('#wf-expansion-account', 'change', updateExpansion);
    on('#wf-cut-percent', 'input', updateBudgetCut);
    on('#wf-cut-method', 'change', updateBudgetCut);
    on('#wf-protect-account', 'change', updateBudgetCut);
    on('#wf-inflation-percent', 'input', updateInflation);
    on('#wf-inflation-scope', 'change', updateInflation);
    on('#wf-inflation-account', 'change', updateInflation);
    root.querySelectorAll('[data-quantity-id]').forEach((node) => node.addEventListener('input', updateQuantities));
    on('#wf-reserve-draw', 'input', updateReserve);
    on('#wf-labour-years', 'input', updateLabour);
    root.querySelectorAll('[data-risk-check],[data-risk-delay],[data-risk-cost]').forEach((node) => node.addEventListener('input', updateRisks));
    on('#wf-roi-preset', 'change', applyROIPreset);
    ['#wf-roi-benefit', '#wf-roi-opex', '#wf-roi-horizon', '#wf-roi-rate'].forEach((selector) => on(selector, 'input', () => { root.querySelector('#wf-roi-preset').value = 'custom'; updateROI(); }));
    root.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-remove-saved]');
      if (removeButton) {
        const index = Number(removeButton.dataset.removeSaved);
        state.scenarioSaves.splice(index, 1);
        renderSavedScenarios();
      }
    });
  }

  function updateDelay() {
    const selectedIndex = Number(root.querySelector('#wf-delay-activity').value);
    const slip = clamp(root.querySelector('#wf-delay-months').value, 0, 36);
    const affected = activities.slice(selectedIndex).map((activity, offset) => {
      const originalIndex = selectedIndex + offset;
      const periods = activity.periods.map((label) => halfYearLabels.indexOf(label)).filter((index) => index >= 0);
      const start = Math.min.apply(null, periods) * 6 + slip;
      const end = (Math.max.apply(null, periods) + 1) * 6 + slip;
      return '<tr><td>' + escapeHTML(activity.name) + '</td><td>' + escapeHTML(periodSpan(Math.min.apply(null, periods) * 6, (Math.max.apply(null, periods) + 1) * 6)) + '</td><td>' + escapeHTML(periodSpan(start, end)) + '</td></tr>';
    }).join('');
    const close = addMonthsToDate(baselineClose, slip);
    root.querySelector('#wf-delay-result').innerHTML = '<p><strong>' + (activities.length - selectedIndex) + ' schedule activities affected.</strong> Selected activity and later rows shift by ' + slip + ' months.</p>' + miniSummary([{ label: 'Document closing date', value: formatDate(baselineClose) }, { label: 'Scenario close', value: formatDate(close) }, { label: 'Closing movement', value: '+' + slip + ' months' }]) + table(['Affected activity', 'Document periods', 'Scenario periods'], affected);
  }

  function updateFallback() {
    const active = root.querySelector('#wf-fallback-toggle').checked;
    const delay = clamp(root.querySelector('#wf-fallback-delay').value, 0, 36);
    const close = addMonthsToDate(baselineClose, delay);
    let explanation = active
      ? '<p><strong>Fallback active.</strong> Early testing uses sample or made-up data; live testing is moved or reduced.</p>'
      : '<p><strong>Fallback not active.</strong> The standard planned testing path remains selected.</p>';
    if (active && delay === 0) explanation += '<p>The source note does not state a number of delay months. No closing-date change is calculated.</p>';
    if (active && delay > 0) explanation += '<p>User-entered assumption: live testing is delayed by ' + delay + ' months; projected close becomes ' + formatDate(close) + '.</p>';
    if (!active && delay > 0) explanation += '<p>A delay value is entered, but it is not applied until the fallback is activated.</p>';
    root.querySelector('#wf-fallback-result').innerHTML = explanation + miniSummary([{ label: 'Baseline close', value: formatDate(baselineClose) }, { label: 'Modelled close', value: active && delay > 0 ? formatDate(close) : 'Not changed' }]);
  }

  function updateExpansion() {
    const approved = root.querySelector('#wf-expansion-approved').checked;
    const accountUnreleased = root.querySelector('#wf-expansion-account').checked;
    const activityName = activities.find((activity) => activity.conditional).name;
    const amountRemoved = accountUnreleased ? conditionalAccount.amount : 0;
    const model = '<p><strong>Schedule:</strong> ' + (approved ? escapeHTML(activityName) + ' remains in the planned schedule.' : escapeHTML(activityName) + ' is switched off in this scenario.') + '</p>' +
      '<p><strong>Conditional budget account:</strong> ' + (accountUnreleased ? 'the ' + escapeHTML(conditionalAccount.name) + ' amount of ' + money(amountRemoved, 0) + ' is treated as unreleased.' : money(conditionalAccount.amount, 0) + ' remains shown in the budget because the document does not explicitly link its release to this activity.') + '</p>' +
      '<p><strong>Scenario delivery amount:</strong> ' + money(baseline - amountRemoved, 0) + ' (before other scenario changes).</p>';
    root.querySelector('#wf-expansion-result').innerHTML = model;
  }

  function updateBudgetCut() {
    const cut = clamp(root.querySelector('#wf-cut-percent').value, 0, 50);
    const method = root.querySelector('#wf-cut-method').value;
    const protectedId = root.querySelector('#wf-protect-account').value;
    root.querySelector('#wf-cut-label').textContent = cut + '% reduction from the CAD 900m delivery baseline';
    root.querySelector('#wf-protect-wrap').hidden = method !== 'protect';
    const target = baseline * (1 - cut / 100);
    const protectedAccount = accounts.find((account) => account.id === protectedId) || accounts[0];
    const remainingBase = baseline - (method === 'protect' ? protectedAccount.amount : 0);
    const remainingTarget = target - (method === 'protect' ? protectedAccount.amount : 0);
    const factor = method === 'protect' ? clamp(remainingTarget / remainingBase, 0, 1) : (1 - cut / 100);
    const achievedRows = accounts.map((account) => {
      const amount = method === 'protect' && account.id === protectedId ? account.amount : account.amount * factor;
      return { ...account, scenario: amount };
    });
    const total = achievedRows.reduce((sum, account) => sum + account.scenario, 0);
    const achievedCut = (baseline - total) / baseline * 100;
    const rows = achievedRows.map((account) => '<tr><td>' + escapeHTML(account.name) + '</td><td>' + money(account.amount) + '</td><td>' + money(account.scenario) + '</td></tr>').join('');
    root.querySelector('#wf-cut-result').innerHTML = miniSummary([{ label: 'Target after cut', value: money(target, 0) }, { label: 'Modelled delivery', value: money(total, 0) }, { label: 'Achieved reduction', value: number(achievedCut, 1) + '%' }, { label: 'Reserve remaining', value: money(Math.max(0, reserve - Math.max(0, total - baseline)), 0) }]) + table(['Account', 'Baseline', 'After cut'], rows) + (method === 'protect' && target < protectedAccount.amount ? '<p>Target reduction cannot be fully achieved while protecting this account; all other accounts are reduced to zero.</p>' : '');
  }

  function updateInflation() {
    const rate = clamp(root.querySelector('#wf-inflation-percent').value, 0, 50);
    const scope = root.querySelector('#wf-inflation-scope').value;
    const selectedId = root.querySelector('#wf-inflation-account').value;
    const selectedAccount = accounts.find((account) => account.id === selectedId) || accounts[0];
    root.querySelector('#wf-inflation-label').textContent = rate + '% increase';
    root.querySelector('#wf-inflation-account').disabled = scope !== 'one';
    const rows = accounts.map((account) => {
      const apply = scope === 'all' || account.id === selectedId;
      return { ...account, scenario: account.amount * (apply ? 1 + rate / 100 : 1), increase: account.amount * (apply ? rate / 100 : 0) };
    });
    const increase = rows.reduce((sum, row) => sum + row.increase, 0);
    const total = baseline + increase;
    const remainingReserve = reserve - increase;
    const selectedLabel = scope === 'all' ? 'All 11 accounts' : selectedAccount.name;
    root.querySelector('#wf-inflation-result').innerHTML = miniSummary([{ label: 'Affected scope', value: escapeHTML(selectedLabel) }, { label: 'Cost increase', value: money(increase) }, { label: 'New delivery baseline', value: money(total) }, { label: 'Reserve left', value: money(Math.max(0, remainingReserve)) }]) + (remainingReserve < 0 ? '<p><strong>Funding-ceiling breach:</strong> ' + money(-remainingReserve) + ' above the documented reserve and funding ceiling.</p>' : '<p>Inflation is covered by the documented reserve in this scenario.</p>');
  }

  function updateQuantities() {
    let delta = 0;
    const rows = upToAccounts.map((account) => {
      const control = root.querySelector('[data-quantity-id="' + account.id + '"]');
      const quantity = clamp(control.value, 0, Math.round(account.quantity * 1.5));
      const change = (quantity - account.quantity) * account.unitCost;
      delta += change;
      return '<tr><td>' + escapeHTML(account.name) + '</td><td>' + number(account.quantity, 0) + '</td><td>' + number(quantity, 0) + '</td><td>' + money(account.unitCost, 2) + '</td><td>' + (change > 0 ? '+' : '') + money(change) + '</td></tr>';
    }).join('');
    const total = baseline + delta;
    const remaining = reserve - delta;
    root.querySelector('#wf-quantity-result').innerHTML = miniSummary([{ label: 'Document delivery baseline', value: money(baseline, 0) }, { label: 'Quantity-adjusted total', value: money(total) }, { label: 'Change', value: (delta > 0 ? '+' : '') + money(delta) }, { label: 'Reserve left', value: money(Math.max(0, remaining)) }]) + table(['Up-to budget item', 'Document quantity', 'Scenario quantity', 'Unit cost', 'Cost change'], rows) + (remaining < 0 ? '<p><strong>Funding-ceiling breach:</strong> ' + money(-remaining) + '.</p>' : '');
  }

  function updateReserve() {
    const draw = clamp(root.querySelector('#wf-reserve-draw').value, 0, 150);
    const remaining = reserve - draw;
    root.querySelector('#wf-reserve-label').textContent = money(draw, 0) + ' used';
    root.querySelector('#wf-reserve-result').innerHTML = miniSummary([{ label: 'Documented reserve', value: money(reserve, 0) }, { label: 'Scenario drawdown', value: money(draw, 0) }, { label: 'Reserve remaining', value: money(Math.max(0, remaining), 0) }, { label: 'Share of funding ceiling', value: number(Math.max(0, remaining) / ceiling * 100, 1) + '%' }]) + (remaining < 0 ? '<p><strong>Reserve exhausted.</strong> The scenario exceeds the sponsor-controlled reserve by ' + money(-remaining) + '.</p>' : '<p>Remaining reserve is ' + number(remaining / ceiling * 100, 1) + '% of the total funding ceiling.</p>');
  }

  function updateLabour() {
    const years = clamp(root.querySelector('#wf-labour-years').value, 300, 900);
    const rate = labourAccount.unitCost;
    const cost = years * rate;
    const delta = cost - labourAccount.amount;
    const newDelivery = baseline + delta;
    const reserveLeft = reserve - Math.max(0, delta);
    root.querySelector('#wf-labour-label').textContent = number(years, 0) + ' FTE-years';
    root.querySelector('#wf-labour-result').innerHTML = miniSummary([{ label: 'Documented rate', value: money(rate, 3) + ' / FTE-year' }, { label: 'Scenario labour cost', value: money(cost) }, { label: 'Change from CAD 90m', value: (delta > 0 ? '+' : '') + money(delta) }, { label: 'Delivery total', value: money(newDelivery) }]) + (reserveLeft < 0 ? '<p><strong>Funding-ceiling breach:</strong> ' + money(-reserveLeft) + '.</p>' : '<p>Reserve remaining after this labour change: ' + money(Math.max(0, reserveLeft)) + '.</p>');
  }

  function updateRisks() {
    const selected = data.risks.filter((risk) => root.querySelector('[data-risk-check="' + risk.id + '"]').checked);
    let delay = 0;
    let cost = 0;
    selected.forEach((risk) => {
      delay += clamp(root.querySelector('[data-risk-delay="' + risk.id + '"]').value, 0, 36);
      cost += clamp(root.querySelector('[data-risk-cost="' + risk.id + '"]').value, 0, 1000);
    });
    const close = addMonthsToDate(baselineClose, delay);
    const remaining = reserve - cost;
    root.querySelector('#wf-risk-result').innerHTML = miniSummary([{ label: 'Selected risks', value: String(selected.length) }, { label: 'User-entered combined delay', value: delay + ' months' }, { label: 'User-entered cost impact', value: money(cost) }, { label: 'Projected closing date', value: formatDate(close) }, { label: 'Reserve remaining', value: money(Math.max(0, remaining)) }]) + (remaining < 0 ? '<p><strong>Funding-ceiling breach:</strong> ' + money(-remaining) + ' beyond the reserve.</p>' : '<p>Entered cost impacts remain within the documented reserve.</p>');
  }

  function applyROIPreset() {
    const index = root.querySelector('#wf-roi-preset').value;
    if (index !== 'custom') {
      const scenario = returnData.scenarios[Number(index)];
      root.querySelector('#wf-roi-benefit').value = String(scenario.annualGrossBenefit);
      root.querySelector('#wf-roi-opex').value = String(returnData.annualOperatingCost);
      root.querySelector('#wf-roi-horizon').value = String(returnData.horizonYears);
      root.querySelector('#wf-roi-rate').value = String(returnData.discountRate * 100);
    }
    updateROI();
  }

  function updateROI() {
    const benefit = clamp(root.querySelector('#wf-roi-benefit').value, 0, 250);
    const opex = clamp(root.querySelector('#wf-roi-opex').value, 0, 100);
    const horizon = clamp(root.querySelector('#wf-roi-horizon').value, 1, 30);
    const rate = clamp(root.querySelector('#wf-roi-rate').value, 0, 15) / 100;
    const net = benefit - opex;
    const investment = ceiling;
    const factor = rate === 0 ? horizon : (1 - Math.pow(1 + rate, -horizon)) / rate;
    const payback = net > 0 ? investment / net : null;
    const npv = -investment + net * factor;
    const totalGrossBenefit = benefit * horizon;
    const totalCost = investment + opex * horizon;
    const roi = (totalGrossBenefit - totalCost) / totalCost * 100;
    root.querySelector('#wf-roi-benefit-label').textContent = money(benefit, 0);
    root.querySelector('#wf-roi-opex-label').textContent = money(opex, 0);
    root.querySelector('#wf-roi-horizon-label').textContent = horizon + ' years';
    root.querySelector('#wf-roi-rate-label').textContent = number(rate * 100, 2) + '%';
    root.querySelector('#wf-roi-result').innerHTML = miniSummary([{ label: 'Annual net benefit', value: money(net) }, { label: 'Simple payback', value: payback == null ? 'No payback' : number(payback, 1) + ' years' }, { label: 'NPV', value: money(npv) }, { label: '10-year / selected-horizon ROI', value: number(roi, 1) + '%' }]);

    const selectedPreset = root.querySelector('#wf-roi-preset').value;
    let comparison = '';
    if (selectedPreset !== 'custom') {
      const source = returnData.scenarios[Number(selectedPreset)];
      const samePayback = (payback == null && source.statedSimplePayback === 'No payback') || (payback != null && Math.abs(round(payback, 1) - (Number.parseFloat(source.statedSimplePayback) || 0)) < 0.06);
      const sameNPV = Math.abs(round(npv, 1) - source.statedNPV) < 0.06;
      const sameROI = Math.abs(round(roi, 1) - source.statedROI) < 0.06;
      comparison = '<table><thead><tr><th>Measure</th><th>Calculated</th><th>Document</th><th>Check</th></tr></thead><tbody>' +
        '<tr><td>Payback</td><td>' + (payback == null ? 'No payback' : number(payback, 1) + ' years') + '</td><td>' + escapeHTML(source.statedSimplePayback) + '</td><td class="' + (samePayback ? 'wf-match' : '') + '">' + (samePayback ? 'Match' : 'Different') + '</td></tr>' +
        '<tr><td>NPV</td><td>' + money(npv) + '</td><td>' + money(source.statedNPV) + '</td><td class="' + (sameNPV ? 'wf-match' : '') + '">' + (sameNPV ? 'Match' : 'Different') + '</td></tr>' +
        '<tr><td>ROI</td><td>' + number(roi, 1) + '%</td><td>' + number(source.statedROI, 1) + '%</td><td class="' + (sameROI ? 'wf-match' : '') + '">' + (sameROI ? 'Match' : 'Different') + '</td></tr>' +
        '</tbody></table>' + ((!samePayback || !sameNPV || !sameROI) ? '<p>The calculated figure does not reproduce the document row. The document’s stated figure is retained in the comparison; no value has been silently substituted.</p>' : '<p>All three calculations reproduce the selected document scenario after rounding to one decimal place.</p>');
    }
    root.querySelector('#wf-roi-document-check').innerHTML = comparison;
  }

  function saveTripleScenario() {
    if (state.scenarioSaves.length >= 3) {
      root.querySelector('#wf-save-status').textContent = 'Three scenarios are already saved. Remove one before saving another.';
      return;
    }
    const model = modelCost(state.scope, state.duration, state.assumptions);
    state.scenarioSaves.push({
      name: 'Scenario ' + (state.scenarioSaves.length + 1),
      scope: state.scope,
      duration: state.duration,
      cost: model.total,
      cap: state.costLimit,
      close: formatDate(dateAtMonthOffset(state.duration))
    });
    root.querySelector('#wf-save-status').textContent = 'Scenario saved for this page session.';
    renderSavedScenarios();
  }

  function renderSavedScenarios() {
    const target = root.querySelector('#wf-saved-scenarios');
    if (!state.scenarioSaves.length) {
      target.innerHTML = '<p class="wf-muted">No scenarios saved yet.</p>';
      return;
    }
    target.innerHTML = state.scenarioSaves.map((scenario, index) => '<div class="wf-saved-card"><strong>' + escapeHTML(scenario.name) + '</strong><span>Scope: ' + number(scenario.scope, 1) + '%</span><span>Duration: ' + number(scenario.duration, 1) + ' months</span><span>Modelled delivery: ' + money(scenario.cost) + '</span><span>Closing: ' + escapeHTML(scenario.close) + '</span><button type="button" class="button-quiet" data-remove-saved="' + index + '">Remove</button></div>').join('');
  }

  // Basic consistency warning: if source account totals do not match, expose it rather than altering them.
  if (Math.abs(calculatedBaseline - baseline) > 0.001) {
    const alert = document.createElement('p');
    alert.className = 'wf-assumption-note';
    alert.textContent = 'Source-data warning: the sum of extracted budget accounts does not match the documented delivery baseline. Calculations use the extracted account values; review the source cross-check before relying on this model.';
    root.appendChild(alert);
  }

  render();
})(window);
