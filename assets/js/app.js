/*
 * Shared browser interactions for the Fraser Valley Preparedness Research Lab site.
 * All behaviour is local; this file makes no network, analytics or storage requests.
 * EDIT: Add page-specific interactions here only when they can be shared safely.
 */
(function (window, document) {
  'use strict';

  const SELECTORS = {
    sidebar: '.sidebar',
    mobileMenu: '.mobile-menu-toggle',
    sidebarBackdrop: '.sidebar-backdrop',
    search: '.search-pill input, [data-site-search]',
    filterChip: '[data-filter-chip], .filter-chip[data-filter-value]',
    tabButton: '[data-tab-button], .tab-button[aria-controls]',
    drawerOpen: '[data-drawer-title], [data-open-drawer]'
  };

  let drawer = null;
  let drawerBackdrop = null;
  let lastDrawerTrigger = null;

  const toText = (value) => value == null ? '' : String(value);
  const normalise = (value) => toText(value).trim().toLocaleLowerCase();

  function getProjectData() {
    return window.PROJECT_DATA || null;
  }

  function closeSidebar() {
    const sidebar = document.querySelector(SELECTORS.sidebar);
    const backdrop = document.querySelector(SELECTORS.sidebarBackdrop);
    const menu = document.querySelector(SELECTORS.mobileMenu);
    if (sidebar) sidebar.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
    if (menu) menu.setAttribute('aria-expanded', 'false');
  }

  function initMobileNavigation() {
    const sidebar = document.querySelector(SELECTORS.sidebar);
    const menu = document.querySelector(SELECTORS.mobileMenu);
    if (!sidebar || !menu) return;

    let backdrop = document.querySelector(SELECTORS.sidebarBackdrop);
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(backdrop);
    }

    menu.setAttribute('aria-controls', menu.getAttribute('aria-controls') || 'site-sidebar');
    if (!sidebar.id) sidebar.id = 'site-sidebar';
    menu.setAttribute('aria-expanded', 'false');

    menu.addEventListener('click', function () {
      const opening = !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', opening);
      backdrop.classList.toggle('is-visible', opening);
      menu.setAttribute('aria-expanded', String(opening));
    });
    backdrop.addEventListener('click', closeSidebar);
    sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeSidebar));
  }

  function animateNumber(element) {
    if (element.dataset.counted === 'true') return;
    const raw = element.dataset.countUp != null ? element.dataset.countUp : element.textContent;
    const target = Number(String(raw).replace(/[^0-9.+-]/g, ''));
    if (!Number.isFinite(target)) return;

    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    const decimals = Number.isInteger(Number(element.dataset.decimals))
      ? Math.max(0, Math.min(4, Number(element.dataset.decimals)))
      : (String(raw).includes('.') ? Math.min(2, String(raw).split('.')[1].length) : 0);
    const duration = Math.max(250, Math.min(1600, Number(element.dataset.countDuration) || 850));
    const start = performance.now();
    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    element.dataset.counted = 'true';
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      element.textContent = prefix + formatter.format(value) + suffix;
      if (progress < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }

  function initCountUps() {
    const elements = Array.from(document.querySelectorAll('[data-count-up]'));
    if (!elements.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach(animateNumber);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    elements.forEach((element) => observer.observe(element));
  }

  function initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach((element) => {
      const tip = element.getAttribute('data-tooltip');
      if (tip && !element.hasAttribute('title')) element.setAttribute('title', tip);
      if (tip && !element.hasAttribute('aria-label') && element.matches('button, a')) {
        element.setAttribute('aria-label', tip);
      }
    });
  }

  function ensureDrawer() {
    if (drawer && drawer.isConnected) return;

    drawerBackdrop = document.querySelector('.drawer-backdrop');
    if (!drawerBackdrop) {
      drawerBackdrop = document.createElement('div');
      drawerBackdrop.className = 'drawer-backdrop';
      drawerBackdrop.setAttribute('aria-hidden', 'true');
      document.body.appendChild(drawerBackdrop);
    }

    drawer = document.querySelector('.detail-drawer');
    if (!drawer) {
      drawer = document.createElement('aside');
      drawer.className = 'detail-drawer';
      drawer.id = 'site-detail-drawer';
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.innerHTML = [
        '<div class="detail-drawer__header">',
        '  <h2 class="detail-drawer__title" data-drawer-heading></h2>',
        '  <button class="icon-button" type="button" data-drawer-close aria-label="Close details">',
        '    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
        '  </button>',
        '</div>',
        '<div class="detail-drawer__body" data-drawer-body></div>'
      ].join('');
      document.body.appendChild(drawer);
    }

    drawerBackdrop.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('[data-drawer-close]').forEach((button) => {
      button.addEventListener('click', closeDrawer);
    });
  }

  function openDrawer(options) {
    ensureDrawer();
    const config = options || {};
    const heading = drawer.querySelector('[data-drawer-heading]');
    const body = drawer.querySelector('[data-drawer-body]');
    heading.textContent = config.title || 'Details';
    body.replaceChildren();

    if (config.contentElement) {
      const source = typeof config.contentElement === 'string'
        ? document.querySelector(config.contentElement)
        : config.contentElement;
      if (source) {
        const copy = source.cloneNode(true);
        copy.hidden = false;
        copy.removeAttribute('hidden');
        body.appendChild(copy);
      }
    } else if (config.text) {
      const paragraph = document.createElement('p');
      paragraph.textContent = config.text;
      body.appendChild(paragraph);
    }

    if (config.source) {
      const sourceLabel = document.createElement('span');
      sourceLabel.className = 'source-label';
      sourceLabel.textContent = 'Source: ' + config.source;
      body.appendChild(sourceLabel);
    }

    if (config.href) {
      const link = document.createElement('a');
      link.className = 'read-more';
      link.href = config.href;
      link.textContent = config.linkText || 'Open source page';
      body.appendChild(link);
    }

    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop.classList.add('is-visible');
    document.body.classList.add('drawer-open');
    const closeButton = drawer.querySelector('[data-drawer-close]');
    if (closeButton) closeButton.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (drawerBackdrop) drawerBackdrop.classList.remove('is-visible');
    document.body.classList.remove('drawer-open');
    if (lastDrawerTrigger && lastDrawerTrigger.isConnected) lastDrawerTrigger.focus();
  }

  function initDrawers() {
    document.addEventListener('click', function (event) {
      const trigger = event.target.closest(SELECTORS.drawerOpen);
      if (!trigger) return;
      if (trigger.matches('a[href]') && !trigger.hasAttribute('data-drawer-title') && !trigger.hasAttribute('data-open-drawer')) return;
      event.preventDefault();
      lastDrawerTrigger = trigger;
      const target = trigger.getAttribute('data-open-drawer') || trigger.getAttribute('data-drawer-content');
      openDrawer({
        title: trigger.getAttribute('data-drawer-title') || trigger.getAttribute('aria-label') || trigger.textContent.trim(),
        text: trigger.getAttribute('data-drawer-text') || '',
        source: trigger.getAttribute('data-source') || '',
        href: trigger.getAttribute('data-source-href') || '',
        linkText: trigger.getAttribute('data-source-link-label') || 'Open source page',
        contentElement: target || null
      });
    });

    document.addEventListener('keydown', function (event) {
      if (!drawer || !drawer.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(drawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function initTabs() {
    document.querySelectorAll(SELECTORS.tabButton).forEach((button) => {
      button.addEventListener('click', function () {
        const group = button.closest('[data-tab-group], .tab-list') || button.parentElement;
        const targetId = button.dataset.tabPanel || button.getAttribute('aria-controls');
        if (!targetId) return;
        const target = document.getElementById(targetId.replace(/^#/, '')) || document.querySelector(targetId);
        if (!target) return;

        group.querySelectorAll(SELECTORS.tabButton).forEach((sibling) => {
          sibling.classList.remove('active');
          sibling.setAttribute('aria-selected', 'false');
          sibling.setAttribute('tabindex', '-1');
        });
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        button.setAttribute('tabindex', '0');

        const panelSelector = button.dataset.panelGroup;
        let panels = [];
        if (panelSelector) panels = Array.from(document.querySelectorAll(panelSelector));
        else if (group.dataset.panels) panels = Array.from(document.querySelectorAll(group.dataset.panels));
        else {
          const panelGroup = target.parentElement;
          panels = Array.from(panelGroup.children).filter((child) => child.matches('[role="tabpanel"], .tab-panel, [data-tab-content]'));
        }
        panels.forEach((panel) => { panel.hidden = panel.id !== target.id; });
      });
    });
  }

  function getFilterItems(scope) {
    if (scope) {
      const target = document.querySelector(scope);
      if (target) return Array.from(target.querySelectorAll('[data-filter-item], [data-category], .stat-card, .card[data-tags]'));
    }
    return Array.from(document.querySelectorAll('[data-filter-item], [data-category], .stat-card, .card[data-tags]'));
  }

  function initFilters() {
    document.querySelectorAll(SELECTORS.filterChip).forEach((chip) => {
      chip.addEventListener('click', function () {
        const groupId = chip.dataset.filterGroup || '';
        const siblingSelector = groupId
          ? '[data-filter-chip][data-filter-group="' + CSS.escape(groupId) + '"]'
          : SELECTORS.filterChip;
        document.querySelectorAll(siblingSelector).forEach((sibling) => {
          sibling.classList.remove('active');
          sibling.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');

        const value = normalise(chip.dataset.filterValue || chip.dataset.filter || 'all');
        const scope = chip.dataset.filterTarget || '';
        getFilterItems(scope).forEach((item) => {
          const category = normalise(item.dataset.category || item.dataset.filterValue || '');
          const tags = normalise(item.dataset.tags || item.dataset.filterTags || '');
          const match = value === 'all' || category === value || tags.split(/[ ,]+/).includes(value);
          item.hidden = !match;
        });
      });
    });
  }

  function initSearch() {
    document.querySelectorAll(SELECTORS.search).forEach((input) => {
      input.addEventListener('input', function () {
        const query = normalise(input.value);
        const scopeSelector = input.dataset.searchTarget || input.closest('[data-search-scope]')?.dataset.searchScope || '';
        const root = scopeSelector ? document.querySelector(scopeSelector) : document;
        if (!root) return;
        const items = root.querySelectorAll('[data-searchable], [data-filter-item], .stat-card, .card[data-search-text]');
        items.forEach((item) => {
          const searchText = normalise((item.dataset.searchText || '') + ' ' + item.textContent);
          const match = !query || searchText.includes(query);
          item.hidden = !match;
        });
      });
    });
  }

  function initMetricSwitchers() {
    const data = getProjectData();
    const definitions = {};
    if (data && data.project && data.cost && data.risks) {
      const start = new Date(data.project.startMonth + '-01T00:00:00');
      const close = new Date(data.project.closingDate + 'T00:00:00');
      const duration = (close.getFullYear() - start.getFullYear()) * 12 + (close.getMonth() - start.getMonth()) + 1;
      const ceiling = Number(data.cost.documentedTotals.fundingCeiling);
      definitions.duration = { value: String(duration), label: 'calendar months' };
      definitions.budget = { value: 'CAD $' + ceiling.toLocaleString('en-CA') + 'm', label: 'total funding ceiling' };
      definitions.risks = { value: String(data.risks.length), label: 'priority risks' };
    }
    document.querySelectorAll('[data-metric-switcher]').forEach((group) => {
      const valueTarget = group.closest('.sidebar__highlight')?.querySelector('[data-highlight-number]') || document.querySelector('[data-highlight-number]');
      const labelTarget = group.closest('.sidebar__highlight')?.querySelector('[data-highlight-caption]') || document.querySelector('[data-highlight-caption]');
      const buttons = Array.from(group.querySelectorAll('[data-metric-toggle]'));
      buttons.forEach((button) => {
        const definition = definitions[button.dataset.metricKey];
        if (definition) {
          button.dataset.metricValue = definition.value;
          button.dataset.metricLabel = definition.label;
        }
        button.addEventListener('click', function () {
          const value = button.dataset.metricValue;
          const label = button.dataset.metricLabel;
          if (valueTarget && value != null) valueTarget.textContent = value;
          if (labelTarget && label != null) labelTarget.textContent = label;
          buttons.forEach((sibling) => {
            const selected = sibling === button;
            sibling.classList.toggle('active', selected);
            sibling.setAttribute('aria-pressed', String(selected));
          });
        });
      });
      const selected = buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0];
      if (selected) {
        if (valueTarget && selected.dataset.metricValue != null) valueTarget.textContent = selected.dataset.metricValue;
        if (labelTarget && selected.dataset.metricLabel != null) labelTarget.textContent = selected.dataset.metricLabel;
      }
    });
  }

  function initSortableTables() {
    document.querySelectorAll('table[data-sortable] th[data-sort-key], table.sortable-table th[data-sort-key]').forEach((header) => {
      header.tabIndex = 0;
      header.setAttribute('role', 'button');
      header.addEventListener('click', () => sortTableColumn(header));
      header.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sortTableColumn(header);
        }
      });
    });
  }

  function sortTableColumn(header) {
    const table = header.closest('table');
    const body = table && table.tBodies[0];
    if (!body) return;
    const columnIndex = Array.from(header.parentElement.children).indexOf(header);
    const descending = header.dataset.sortDirection !== 'asc';
    const rows = Array.from(body.rows);
    const numeric = header.dataset.sortType === 'number';
    rows.sort((a, b) => {
      const aText = a.cells[columnIndex]?.dataset.sortValue || a.cells[columnIndex]?.textContent || '';
      const bText = b.cells[columnIndex]?.dataset.sortValue || b.cells[columnIndex]?.textContent || '';
      let comparison;
      if (numeric) comparison = Number(aText.replace(/[^0-9.-]/g, '')) - Number(bText.replace(/[^0-9.-]/g, ''));
      else comparison = aText.trim().localeCompare(bText.trim(), undefined, { numeric: true, sensitivity: 'base' });
      return descending ? -comparison : comparison;
    });
    rows.forEach((row) => body.appendChild(row));
    header.parentElement.querySelectorAll('[data-sort-key]').forEach((sibling) => {
      if (sibling !== header) delete sibling.dataset.sortDirection;
    });
    header.dataset.sortDirection = descending ? 'desc' : 'asc';
    header.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
  }

  function renderDeclarativeCharts() {
    const data = getProjectData();
    const charts = window.ProjectCharts;
    if (!data || !charts) return;

    document.querySelectorAll('[data-chart]').forEach((element) => {
      if (element.dataset.chartReady === 'true') return;
      const type = element.dataset.chart;
      try {
        if (type === 'cost-donut') charts.donut(element, data.cost.accounts.map((item) => ({ label: item.name, value: item.amount })), { centreLabel: 'Baseline', centreValue: 'CAD 900m' });
        else if (type === 'cost-bars') charts.rankedBars(element, data.cost.accounts.map((item) => ({ label: item.name, value: item.amount })), { format: (value) => 'CAD ' + value + 'm' });
        else if (type === 'timeline-route') charts.route(element, data.time.activities);
        else if (type === 'schedule-gantt') charts.gantt(element, data.time.periods, data.time.activities);
        else if (type === 'roi-lollipop') charts.lollipop(element, data.returnAnalysis.scenarios.map((item) => ({ label: 'CAD ' + item.annualGrossBenefit + 'm', value: item.statedROI })), { highlightIndex: data.returnAnalysis.scenarios.length - 1, suffix: '%' });
        else if (type === 'period-activity-bars') {
          const periodItems = data.time.periods.map((period) => ({
            label: period,
            value: data.time.activities.filter((activity) => activity.periods.includes(period)).length
          }));
          charts.bars(element, periodItems, { orientation: 'vertical', format: (value) => String(value) });
        } else if (type === 'reserve-gauge') charts.gauge(element, data.cost.documentedTotals.deliveryBaseline, data.cost.documentedTotals.fundingCeiling, { label: 'Delivery baseline', valueLabel: 'CAD 900m' });
        else return;
        element.dataset.chartReady = 'true';
      } catch (error) {
        element.textContent = 'Chart unavailable. Check the chart data and page markup.';
        element.setAttribute('role', 'status');
        if (window.console && console.error) console.error('Chart rendering error:', type, error);
      }
    });
  }

  function init() {
    initMobileNavigation();
    initCountUps();
    initTooltips();
    initDrawers();
    initTabs();
    initFilters();
    initSearch();
    initMetricSwitchers();
    initSortableTables();
    renderDeclarativeCharts();
  }

  window.ProjectApp = {
    init: init,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    closeSidebar: closeSidebar,
    renderDeclarativeCharts: renderDeclarativeCharts,
    getProjectData: getProjectData
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window, document);
