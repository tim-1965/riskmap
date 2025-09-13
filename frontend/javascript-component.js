/**
 * Labor Rights Risk Assessment Tool - JavaScript Component
 * Handles all functionality including API calls, UI interactions, and risk calculations
 */

(function() {
    'use strict';

    // Configuration
    const API_BASE_URL = 'https://riskmap-production.up.railway.app/api';

    // Global state
    let countriesData = [];
    let industriesData = [];
    let effectivenessMode = false;
    let usingFallbackData = false;
    let currentRiskData = null;
    let worldMapComponent = null;

    const sliderIds = ['continuous-monitoring', 'unannounced-audit', 'announced-audit', 'self-assessment', 'no-engagement'];
    const defaultEffectiveness = {
        continuous_monitoring: 85,
        unannounced_audit: 50,
        announced_audit: 15,
        self_assessment: 5,
        no_engagement: 0
    };

    // Fallback data for when API is not available
    const fallbackCountries = [
        { country: 'United States', base_risk: 22 },
        { country: 'Canada', base_risk: 16 },
        { country: 'Mexico', base_risk: 52 },
        { country: 'Brazil', base_risk: 45 },
        { country: 'United Kingdom', base_risk: 18 },
        { country: 'Germany', base_risk: 15 },
        { country: 'France', base_risk: 23 },
        { country: 'Italy', base_risk: 28 },
        { country: 'Spain', base_risk: 26 },
        { country: 'China', base_risk: 65 },
        { country: 'India', base_risk: 58 },
        { country: 'Japan', base_risk: 17 },
        { country: 'South Korea', base_risk: 25 },
        { country: 'Australia', base_risk: 16 },
        { country: 'Bangladesh', base_risk: 82 },
        { country: 'Vietnam', base_risk: 55 },
        { country: 'Thailand', base_risk: 62 },
        { country: 'Philippines', base_risk: 75 },
        { country: 'Indonesia', base_risk: 58 },
        { country: 'Turkey', base_risk: 62 },
        { country: 'Egypt', base_risk: 78 },
        { country: 'South Africa', base_risk: 42 }
    ];

    const fallbackIndustries = [
        { industry: 'Agriculture', risk_multiplier: 1.4 },
        { industry: 'Mining', risk_multiplier: 1.5 },
        { industry: 'Manufacturing', risk_multiplier: 1.2 },
        { industry: 'Textiles', risk_multiplier: 1.6 },
        { industry: 'Electronics', risk_multiplier: 1.3 },
        { industry: 'Automotive', risk_multiplier: 1.1 },
        { industry: 'Construction', risk_multiplier: 1.4 },
        { industry: 'Energy', risk_multiplier: 1.3 },
        { industry: 'Healthcare', risk_multiplier: 0.9 },
        { industry: 'Finance', risk_multiplier: 0.8 },
        { industry: 'Retail', risk_multiplier: 1.1 },
        { industry: 'Hospitality', risk_multiplier: 1.3 },
        { industry: 'Logistics', risk_multiplier: 1.2 },
        { industry: 'Chemicals', risk_multiplier: 1.3 },
        { industry: 'Telecommunications', risk_multiplier: 0.9 }
    ];

    /**
     * API Functions
     */
    function updateAPIStatus(isLive) {
        const statusEl = document.getElementById('api-status');
        const statusTextEl = document.getElementById('api-status-text');

        if (statusEl && statusTextEl) {
            if (isLive) {
                statusEl.className = 'api-status live';
                statusTextEl.textContent = 'Live Data';
            } else {
                statusEl.className = 'api-status fallback';
                statusTextEl.textContent = 'Demo Mode';
            }
        }
    }

    async function fetchCountries() {
        try {
            const response = await fetch(`${API_BASE_URL}/countries`);
            if (response.ok) {
                const data = await response.json();
                updateAPIStatus(true);
                usingFallbackData = false;
                return data.map(country => country.country).sort();
            }
        } catch (error) {
            console.log('Using fallback countries data');
        }

        updateAPIStatus(false);
        usingFallbackData = true;
        return fallbackCountries.map(c => c.country).sort();
    }

    async function fetchIndustries() {
        try {
            const response = await fetch(`${API_BASE_URL}/industries`);
            if (response.ok) {
                const data = await response.json();
                return data.map(industry => industry.industry).sort();
            }
        } catch (error) {
            console.log('Using fallback industries data');
        }
        return fallbackIndustries.map(i => i.industry).sort();
    }

    async function calculateRiskAPI(industry, countries, hrddStrategies, hrddEffectiveness) {
        if (!usingFallbackData) {
            try {
                const response = await fetch(`${API_BASE_URL}/calculate-risk`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        industry: industry,
                        countries: countries,
                        hrdd_strategies: hrddStrategies,
                        hrdd_effectiveness: hrddEffectiveness
                    }),
                });

                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.log('API unavailable, using fallback calculation');
            }
        }

        // Fallback calculation
        return calculateRiskFallback(industry, countries, hrddStrategies, hrddEffectiveness);
    }

    function calculateRiskFallback(industry, countries, hrddStrategies, hrddEffectiveness) {
        // Get industry multiplier
        const industryData = fallbackIndustries.find(i => i.industry.toLowerCase() === industry.toLowerCase());
        const industryMultiplier = industryData ? industryData.risk_multiplier : 1.2;

        // Calculate HRDD effectiveness
        let weighted = 0;
        Object.entries(hrddStrategies).forEach(([strategy, percentage]) => {
            const effectiveness = hrddEffectiveness[strategy] || defaultEffectiveness[strategy.replace('-', '_')] || 0;
            weighted += (percentage * effectiveness) / 100;
        });

        const hrddMultiplier = Math.max(0.5, Math.min(1.5, 1.5 - (weighted / 100)));

        // Calculate country risks
        const countryRisks = countries.map(country => {
            const countryData = fallbackCountries.find(c => c.country === country);
            const baseRisk = countryData ? countryData.base_risk : 50;
            const finalRisk = Math.max(0, Math.min(100, Math.round(baseRisk * industryMultiplier * hrddMultiplier)));

            return {
                country: country,
                risk: finalRisk
            };
        });

        const overallRisk = Math.round(countryRisks.reduce((sum, item) => sum + item.risk, 0) / countryRisks.length);

        return {
            overall_risk: overallRisk,
            country_risks: countryRisks,
            hrdd_data: {
                multiplier: hrddMultiplier,
                effectiveness: weighted
            }
        };
    }

    /**
     * World Map Component using D3
     */
    class WorldMapComponent {
        constructor(containerId) {
            this.container = d3.select(`#${containerId}`);
            this.tooltip = d3.select('body').append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.8)')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('font-size', '14px')
                .style('z-index', '1000')
                .style('opacity', 0);
            
            this.selectedCountries = new Set();
            this.riskData = new Map();
            this.width = this.container.node().clientWidth || 1000;
            this.height = 500;

            this.init();
        }

        async init() {
            try {
                const NAME_MAP = {
                    'United States of America': 'United States',
                    'Viet Nam': 'Vietnam',
                    'Korea, Republic of': 'South Korea'
                };

                const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
                const countries = topojson.feature(world, world.objects.countries).features;

                const projection = d3.geoNaturalEarth1().fitSize([this.width, this.height], { type: 'Sphere' });
                const path = d3.geoPath(projection);

                this.svg = this.container.append('svg')
                    .attr('class', 'world-map-svg')
                    .attr('width', this.width)
                    .attr('height', this.height);

                this.svg.selectAll('path')
                    .data(countries)
                    .enter()
                    .append('path')
                    .attr('class', 'country-path')
                    .attr('data-country', d => NAME_MAP[d.properties.name] || d.properties.name)
                    .attr('d', path)
                    .on('mouseenter', (event, d) => this.showTooltip(event, d3.select(event.currentTarget).attr('data-country')))
                    .on('mousemove', (event) => this.updateTooltipPosition(event))
                    .on('mouseleave', () => this.hideTooltip())
                    .on('click', (event) => this.toggleCountrySelection(
                        d3.select(event.currentTarget).attr('data-country'),
                        event.currentTarget
                    ));
            } catch (error) {
                console.log('World map initialization failed:', error);
                this.showFallbackMessage();
            }
        }

        showFallbackMessage() {
            this.container.html('<div class="map-placeholder">World map unavailable - using fallback country list</div>');
        }

        updateRiskData(riskResults) {
            if (!this.svg) return;

            this.svg.selectAll('.country-path')
                .classed('risk-very-low', false)
                .classed('risk-low', false)
                .classed('risk-medium', false)
                .classed('risk-high', false)
                .classed('risk-very-high', false);

            riskResults.country_risks.forEach(countryRisk => {
                this.riskData.set(countryRisk.country, countryRisk.risk);
                const path = this.findCountryPath(countryRisk.country);
                if (path) {
                    const riskClass = this.getRiskClass(countryRisk.risk);
                    d3.select(path).classed(riskClass, true);
                }
            });
        }

        findCountryPath(countryName) {
            if (!this.svg) return null;
            return this.svg.selectAll('.country-path').filter(function() {
                return d3.select(this).attr('data-country') === countryName;
            }).node();
        }

        getRiskClass(riskScore) {
            if (riskScore <= 20) return 'risk-very-low';
            if (riskScore <= 40) return 'risk-low';
            if (riskScore <= 60) return 'risk-medium';
            if (riskScore <= 80) return 'risk-high';
            return 'risk-very-high';
        }

        showTooltip(event, countryName) {
            const risk = this.riskData.get(countryName);
            const text = risk !== undefined ? `${countryName}: ${risk}` : countryName;
            this.tooltip.style('opacity', 1).text(text);
            this.updateTooltipPosition(event);
        }

        updateTooltipPosition(event) {
            this.tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY + 10) + 'px');
        }

        hideTooltip() {
            this.tooltip.style('opacity', 0);
        }

        toggleCountrySelection(countryName, pathElement) {
            if (!countryName || !pathElement) return;
            
            const path = d3.select(pathElement);
            if (this.selectedCountries.has(countryName)) {
                this.selectedCountries.delete(countryName);
                path.classed('selected', false);
            } else {
                this.selectedCountries.add(countryName);
                path.classed('selected', true);
            }

            const event = new CustomEvent('countrySelectionChanged', {
                detail: { selectedCountries: Array.from(this.selectedCountries) }
            });
            this.container.node().dispatchEvent(event);
        }

        setSelectedCountries(countries) {
            if (!this.svg) return;
            
            this.selectedCountries = new Set(countries);
            this.svg.selectAll('.country-path').each((d, i, nodes) => {
                const name = d3.select(nodes[i]).attr('data-country');
                d3.select(nodes[i]).classed('selected', this.selectedCountries.has(name));
            });
        }
    }

    /**
     * UI Population Functions
     */
    async function populateIndustries() {
        const select = document.getElementById('industry');
        if (!select) return;

        select.innerHTML = '<option value="">Loading industries...</option>';
        industriesData = await fetchIndustries();

        select.innerHTML = '<option value="">Select industry</option>';
        industriesData.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry;
            option.textContent = industry.charAt(0).toUpperCase() + industry.slice(1);
            select.appendChild(option);
        });
    }

    async function populateCountries() {
        const container = document.getElementById('country-selector');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading countries...</div>';
        countriesData = await fetchCountries();

        container.innerHTML = '';
        countriesData.forEach(country => {
            const wrapper = document.createElement('div');
            wrapper.className = 'country-checkbox';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.value = country;
            input.id = 'country-' + country.replace(/\s+/g, '-').toLowerCase();

            const label = document.createElement('label');
            label.setAttribute('for', input.id);
            label.textContent = country;

            // Add event listener for map sync
            input.addEventListener('change', () => {
                if (worldMapComponent) {
                    const selectedCountries = getSelectedCountries();
                    worldMapComponent.setSelectedCountries(selectedCountries);
                }
            });

            wrapper.appendChild(input);
            wrapper.appendChild(label);
            container.appendChild(wrapper);
        });
    }

    function getSelectedCountries() {
        return Array.from(document.querySelectorAll('#country-selector input:checked'))
            .map(cb => cb.value);
    }

    function setSelectedCountries(countries) {
        const checkboxes = document.querySelectorAll('#country-selector input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = countries.includes(cb.value);
        });
    }

    /**
     * HRDD Slider Functions
     */
    function updateTotal() {
        let total = 0;
        sliderIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) total += Number(element.value);
        });

        const totalEl = document.getElementById('total-percentage');
        const statusEl = document.getElementById('total-status');

        if (totalEl) totalEl.textContent = total + '%';
        if (statusEl) {
            if (total === 100) {
                statusEl.textContent = '✓';
                statusEl.className = 'total-status valid';
            } else {
                statusEl.textContent = '✗';
                statusEl.className = 'total-status invalid';
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
            const effectiveness = effEl ? Number(effEl.value) : defaultEffectiveness[id.replace('-', '_')] || 0;

            weighted += (coverage * effectiveness) / 100;

            const score = coverage * effectiveness;
            if (score > topScore) {
                topScore = score;
                topStrategy = id;
            }
        });

        weighted = Math.round(weighted * 10) / 10;

        const elements = {
            'weighted-effectiveness': weighted + '%',
            'estimated-reduction': weighted + '%',
            'risk-reduction-display': weighted + '%',
            'coverage-quality': weighted > 60 ? 'Strong' : weighted > 30 ? 'Moderate' : 'Weak',
            'top-strategy': topStrategy.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
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
                    const suffix = id === 'no-engagement' ? ' - baseline' : '';
                    effDisplay.textContent = `(${effInput.value}% effective${suffix})`;
                    updateWeightedEffectiveness();
                });
            }
        });
        updateTotal();
    }

    /**
     * HRDD Management Functions
     */
    function toggleEffectivenessMode() {
        effectivenessMode = !effectivenessMode;

        document.querySelectorAll('.effectiveness-control').forEach(el => {
            el.style.display = effectivenessMode ? 'flex' : 'none';
        });

        document.querySelectorAll('.effectiveness-display').forEach(el => {
            el.style.display = effectivenessMode ? 'none' : 'inline';
        });

        const toggleBtn = document.getElementById('effectiveness-toggle');
        const note = document.getElementById('effectiveness-note');

        if (toggleBtn) {
            toggleBtn.textContent = effectivenessMode ?
                '🚫 Use Default Effectiveness' :
                '📊 Customize Effectiveness';
        }

        if (note) {
            note.textContent = effectivenessMode ?
                'Enter effectiveness for each strategy' :
                'Click to adjust effectiveness percentages based on your experience';
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

            if (effInput && effDisplay) {
                const defaultEff = defaultEffectiveness[id.replace('-', '_')] || 0;
                effInput.value = defaultEff;
                const suffix = id === 'no-engagement' ? ' - baseline' : '';
                effDisplay.textContent = `(${defaultEff}% effective${suffix})`;
            }
        });
        updateTotal();
    }

    /**
     * Risk Calculation and Display
     */
    async function calculateRisk() {
        const selectedCountries = getSelectedCountries();
        const selectedIndustry = document.getElementById('industry').value;
        const errorEl = document.getElementById('error-message');

        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }

        if (!selectedIndustry) {
            if (errorEl) {
                errorEl.textContent = 'Please select an industry.';
                errorEl.style.display = 'block';
            }
            return;
        }

        if (selectedCountries.length === 0) {
            if (errorEl) {
                errorEl.textContent = 'Please select at least one country.';
                errorEl.style.display = 'block';
            }
            return;
        }

        let totalCoverage = 0;
        const hrddStrategies = {};
        const hrddEffectiveness = {};

        sliderIds.forEach(id => {
            const coverageEl = document.getElementById(id);
            const effEl = document.getElementById(id + '-effectiveness');
            const coverage = coverageEl ? Number(coverageEl.value) : 0;
            const effectiveness = effEl ? Number(effEl.value) : defaultEffectiveness[id.replace('-', '_')] || 0;

            totalCoverage += coverage;
            hrddStrategies[id.replace('-', '_')] = coverage;
            hrddEffectiveness[id.replace('-', '_')] = effectiveness;
        });

        if (totalCoverage !== 100) {
            if (errorEl) {
                errorEl.textContent = 'Coverage percentages must total 100%.';
                errorEl.style.display = 'block';
            }
            return;
        }

        try {
            const result = await calculateRiskAPI(selectedIndustry, selectedCountries, hrddStrategies, hrddEffectiveness);
            currentRiskData = result;
            displayResults(result);
        } catch (error) {
            if (errorEl) {
                errorEl.textContent = 'Error calculating risk. Please try again.';
                errorEl.style.display = 'block';
            }
        }
    }

    function displayResults(result) {
        const riskScoreEl = document.getElementById('risk-score');
        const riskLevelEl = document.getElementById('risk-level');

        if (riskScoreEl) riskScoreEl.textContent = result.overall_risk.toFixed(0);

        if (riskLevelEl) {
            let level = 'Very High Risk';
            let className = 'very-high-risk';

            if (result.overall_risk <= 20) {
                level = 'Very Low Risk';
                className = 'low-risk';
            } else if (result.overall_risk <= 40) {
                level = 'Low Risk';
                className = 'low-risk';
            } else if (result.overall_risk <= 60) {
                level = 'Medium Risk';
                className = 'medium-risk';
            } else if (result.overall_risk <= 80) {
                level = 'High Risk';
                className = 'high-risk';
            }

            riskLevelEl.textContent = level;
            riskLevelEl.className = `risk-level ${className}`;
        }

        // Update country list
        const listEl = document.getElementById('country-risk-list');
        if (listEl) {
            listEl.innerHTML = '';
            result.country_risks.forEach(countryRisk => {
                const item = document.createElement('div');
                item.className = 'country-item';

                let riskClass = 'low-risk';
                if (countryRisk.risk > 80) riskClass = 'very-high-risk';
                else if (countryRisk.risk > 60) riskClass = 'high-risk';
                else if (countryRisk.risk > 40) riskClass = 'medium-risk';

                item.innerHTML = `
                    <span>${countryRisk.country}</span>
                    <span class="country-risk ${riskClass}">${countryRisk.risk.toFixed(0)}</span>
                `;
                listEl.appendChild(item);
            });
        }

        // Update world map if available
        if (worldMapComponent) {
            worldMapComponent.updateRiskData(result);
        }

        // Show results in map placeholder if map unavailable
        const mapPlaceholder = document.getElementById('map-placeholder');
        if (mapPlaceholder) {
            const resultsDiv = document.getElementById('map-results');
            if (resultsDiv) {
                resultsDiv.innerHTML = '<h4>Country Risk Scores:</h4>';
                result.country_risks.forEach(countryRisk => {
                    const item = document.createElement('div');
                    item.style.marginBottom = '5px';
                    item.innerHTML = `<strong>${countryRisk.country}:</strong> ${countryRisk.risk}`;
                    resultsDiv.appendChild(item);
                });
            }
        }
    }

    /**
     * World Map Integration
     */
    function initializeWorldMap() {
        if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
            console.log('D3 or TopoJSON not available - map functionality will be limited');
            return;
        }

        worldMapComponent = new WorldMapComponent('world-map');

        const mapContainer = document.getElementById('world-map');
        if (mapContainer) {
            mapContainer.addEventListener('countrySelectionChanged', (event) => {
                setSelectedCountries(event.detail.selectedCountries);
            });
        }
    }

    /**
     * Initialization
     */
    async function initialize() {
        updateAPIStatus(false); // Start with fallback status

        // Load data
        await Promise.all([
            populateIndustries(),
            populateCountries()
        ]);

        setupSliders();

        // Initialize world map
        initializeWorldMap();

        const btn = document.getElementById('calculate-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Calculate Risk';
        }
    }

    /**
     * Export functions to global scope for onclick handlers
     */
    window.toggleEffectivenessMode = toggleEffectivenessMode;
    window.calculateRisk = calculateRisk;
    window.loadPreset = loadPreset;

    /**
     * Export main functions for external use
     */
    window.RiskAssessmentTool = {
        initialize,
        updateAPIStatus,
        getSelectedCountries,
        setSelectedCountries,
        getCurrentRiskData: () => currentRiskData,
        getWorldMapComponent: () => worldMapComponent
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();