(function() {
  'use strict';
  const sliderIds = ['continuous-monitoring','unannounced-audit','announced-audit','self-assessment','no-engagement'];
  const defaultEffectiveness = {
    'continuous-monitoring': 85,
    'unannounced-audit': 50,
    'announced-audit': 15,
    'self-assessment': 5,
    'no-engagement': 0
  };
  let effectivenessMode = false;

  function populateIndustries() {
    const industries = ['Agriculture','Manufacturing','Services'];
    const select = document.getElementById('industry');
    if (!select) return;
    select.innerHTML = '<option value="">Select industry</option>';
    industries.forEach(ind => {
      const opt = document.createElement('option');
      opt.value = ind;
      opt.textContent = ind;
      select.appendChild(opt);
    });
  }

  function populateCountries() {
    const countries = ['United States','Germany','China','India','Brazil'];
    const container = document.getElementById('country-selector');
    if (!container) return;
    container.innerHTML = '';
    countries.forEach(country => {
      const wrap = document.createElement('div');
      wrap.className = 'country-checkbox';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = country;
      input.id = 'country-' + country.split(' ').join('-').toLowerCase();
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.textContent = country;
      wrap.appendChild(input);
      wrap.appendChild(label);
      container.appendChild(wrap);
    });
  }

  function updateTotal() {
    let total = 0;
    sliderIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) total += Number(el.value);
    });
    const totalEl = document.getElementById('total-percentage');
    const statusEl = document.getElementById('total-status');
    if (totalEl) totalEl.textContent = total + '%';
    if (statusEl) {
      if (total === 100) {
        statusEl.textContent = '✓';
        statusEl.style.color = '#28a745';
      } else {
        statusEl.textContent = '✗';
        statusEl.style.color = '#dc3545';
      }
    }
    updateWeightedEffectiveness();
  }

  function updateWeightedEffectiveness() {
    let weighted = 0;
    let topStrategy = '';
    let topScore = -1;
    sliderIds.forEach(id => {
      const coverageEl = document.getElementById(id);
      const effEl = document.getElementById(id + '-effectiveness');
      const coverage = coverageEl ? Number(coverageEl.value) : 0;
      const eff = effEl ? Number(effEl.value) : 0;
      weighted += coverage * eff / 100;
      const score = coverage * eff;
      if (score > topScore) {
        topScore = score;
        topStrategy = id;
      }
    });
    weighted = Math.round(weighted * 10) / 10;
    const weightedEl = document.getElementById('weighted-effectiveness');
    const reductionEl = document.getElementById('estimated-reduction');
    const riskReductionDisplay = document.getElementById('risk-reduction-display');
    const coverageQuality = document.getElementById('coverage-quality');
    const topStrategyEl = document.getElementById('top-strategy');
    if (weightedEl) weightedEl.textContent = weighted + '%';
    if (reductionEl) reductionEl.textContent = weighted + '%';
    if (riskReductionDisplay) riskReductionDisplay.textContent = weighted + '%';
    if (coverageQuality) {
      coverageQuality.textContent = weighted > 60 ? 'Strong' : weighted > 30 ? 'Moderate' : 'Weak';
    }
    if (topStrategyEl) {
      topStrategyEl.textContent = topStrategy.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    }
  }

  function setupSliders() {
    sliderIds.forEach(id => {
      const slider = document.getElementById(id);
      const valueEl = document.getElementById(id + '-value');
      if (slider && valueEl) {
        slider.addEventListener('input', () => {
          valueEl.textContent = slider.value + '%';
          updateTotal();
        });
      }
      const effInput = document.getElementById(id + '-effectiveness');
      const effDisplay = document.getElementById(id + '-eff-display');
      if (effInput && effDisplay) {
        effInput.addEventListener('input', () => {
          effDisplay.textContent = '(' + effInput.value + '% effective' + (id === 'no-engagement' ? ' - baseline' : '') + ')';
          updateWeightedEffectiveness();
        });
      }
    });
    updateTotal();
  }

  function toggleEffectivenessMode() {
    effectivenessMode = !effectivenessMode;
    Array.from(document.querySelectorAll('.effectiveness-control')).forEach(el => {
      el.style.display = effectivenessMode ? 'flex' : 'none';
    });
    Array.from(document.querySelectorAll('.effectiveness-display')).forEach(el => {
      el.style.display = effectivenessMode ? 'none' : 'inline';
    });
    const toggleBtn = document.getElementById('effectiveness-toggle');
    const note = document.getElementById('effectiveness-note');
    if (toggleBtn) {
      toggleBtn.textContent = effectivenessMode ? '🚫 Use Default Effectiveness' : '📊 Customize Effectiveness';
    }
    if (note) {
      note.textContent = effectivenessMode
        ? 'Enter effectiveness for each strategy'
        : 'Click to adjust effectiveness percentages based on your experience';
    }
  }

  const presets = {
    conservative: {
      'continuous-monitoring': 30,
      'unannounced-audit': 20,
      'announced-audit': 25,
      'self-assessment': 20,
      'no-engagement': 5
    },
    balanced: {
      'continuous-monitoring': 20,
      'unannounced-audit': 15,
      'announced-audit': 25,
      'self-assessment': 30,
      'no-engagement': 10
    },
    aggressive: {
      'continuous-monitoring': 40,
      'unannounced-audit': 30,
      'announced-audit': 20,
      'self-assessment': 5,
      'no-engagement': 5
    },
    minimal: {
      'continuous-monitoring': 5,
      'unannounced-audit': 5,
      'announced-audit': 10,
      'self-assessment': 30,
      'no-engagement': 50
    }
  };

  function loadPreset(name) {
    const values = presets[name];
    if (!values) return;
    sliderIds.forEach(id => {
      const slider = document.getElementById(id);
      const valueEl = document.getElementById(id + '-value');
      if (slider && valueEl && values[id] !== undefined) {
        slider.value = values[id];
        valueEl.textContent = values[id] + '%';
      }
      const effInput = document.getElementById(id + '-effectiveness');
      const effDisplay = document.getElementById(id + '-eff-display');
      if (effInput && effDisplay && defaultEffectiveness[id] !== undefined) {
        effInput.value = defaultEffectiveness[id];
        effDisplay.textContent = '(' + defaultEffectiveness[id] + '% effective' + (id === 'no-engagement' ? ' - baseline' : '') + ')';
      }
    });
    updateTotal();
  }

  function calculateRisk() {
    const selectedCountries = Array.from(document.querySelectorAll('#country-selector input:checked')).map(cb => cb.value);
    const errorEl = document.getElementById('error-message');
    if (errorEl) errorEl.textContent = '';
    if (selectedCountries.length === 0) {
      if (errorEl) errorEl.textContent = 'Please select at least one country.';
      return;
    }
    let totalCoverage = 0;
    let weighted = 0;
    sliderIds.forEach(id => {
      const coverageEl = document.getElementById(id);
      const effEl = document.getElementById(id + '-effectiveness');
      const coverage = coverageEl ? Number(coverageEl.value) : 0;
      const eff = effEl ? Number(effEl.value) : 0;
      totalCoverage += coverage;
      weighted += coverage * eff / 100;
    });
    if (totalCoverage !== 100) {
      if (errorEl) errorEl.textContent = 'Coverage percentages must total 100%.';
      return;
    }
    const baseRisk = 70;
    const finalRisk = Math.max(0, baseRisk - weighted);
    const riskScoreEl = document.getElementById('risk-score');
    const riskLevelEl = document.getElementById('risk-level');
    if (riskScoreEl) riskScoreEl.textContent = finalRisk.toFixed(1);
    if (riskLevelEl) {
      let level = 'Very High Risk';
      if (finalRisk <= 25) level = 'Low Risk';
      else if (finalRisk <= 50) level = 'Medium Risk';
      else if (finalRisk <= 75) level = 'High Risk';
      riskLevelEl.textContent = level;
    }
    const listEl = document.getElementById('country-risk-list');
    if (listEl) {
      listEl.innerHTML = '';
      selectedCountries.forEach(c => {
        const item = document.createElement('div');
        const countryRisk = Math.max(0, Math.min(100, finalRisk + (Math.random()*20 - 10)));
        item.textContent = c + ': ' + countryRisk.toFixed(1);
        listEl.appendChild(item);
      });
    }
    const mapResults = document.getElementById('map-results');
    if (mapResults && listEl) {
      mapResults.innerHTML = listEl.innerHTML;
    }
  }

  function initialize() {
    populateIndustries();
    populateCountries();
    setupSliders();
    const btn = document.getElementById('calculate-btn');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Calculate Risk';
    }
  }

  const root = typeof window !== 'undefined' ? window : globalThis;
  root.toggleEffectivenessMode = toggleEffectivenessMode;
  root.calculateRisk = calculateRisk;
  root.loadPreset = loadPreset;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      root.addEventListener('DOMContentLoaded', initialize);
    } else {
      initialize();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      toggleEffectivenessMode,
      calculateRisk,
      loadPreset
    };
  }
})();