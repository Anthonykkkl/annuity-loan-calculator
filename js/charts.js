/**
 * D3.js chart rendering with animations
 * Interactive visualizations for loan data
 */

import { formatCurrency, formatMonthYear } from './utils.js';

/**
 * Creates a timeline chart showing loan balance over time
 * 
 * @param {string} containerId - Container element ID
 * @param {Array} schedule - Amortization schedule
 * @param {Object} options - Chart options
 */
export function createTimelineChart(containerId, schedule, options = {}) {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('❌ D3.js is not loaded. Charts will not render.');
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container || !schedule || schedule.length === 0) {
        console.warn('⚠️  Cannot create timeline chart: missing container or data');
        return;
    }
    
    // Extract baseline schedule from options
    const baselineSchedule = options.baselineSchedule || null;
    const hasBaseline = baselineSchedule && baselineSchedule.length > 0;
    
    // Clear existing chart
    container.innerHTML = '';
    
    // Set up dimensions
    const margin = { top: 20, right: hasBaseline ? 150 : 30, bottom: 50, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const maxLength = hasBaseline ? Math.max(schedule.length, baselineSchedule.length) : schedule.length;
    const xScale = d3.scaleLinear()
        .domain([0, maxLength])
        .range([0, width]);
    
    // Calculate max value from both schedules
    const maxValueCurrent = d3.max(schedule, d => d.remainingBalance + d.cumulativeInterest);
    const maxValueBaseline = hasBaseline ? d3.max(baselineSchedule, d => d.remainingBalance + d.cumulativeInterest) : 0;
    const maxValue = Math.max(maxValueCurrent, maxValueBaseline);
    
    const yScale = d3.scaleLinear()
        .domain([0, maxValue])
        .nice()
        .range([height, 0]);
    
    // Axes
    const xAxis = d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d => `${Math.floor(d / 12)}y`);
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(d => formatCurrency(d));
    
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.x-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    svg.append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.y-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    // Grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.1)
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
        )
        .selectAll('line')
        .style('stroke', '#cbd5e1');
    
    // Style grid domain line
    svg.select('.grid')
        .select('.domain')
        .style('stroke', '#475569');
    
    // Area generator for remaining balance
    const areaBalance = d3.area()
        .x((d, i) => xScale(i))
        .y0(height)
        .y1(d => yScale(d.remainingBalance))
        .curve(d3.curveMonotoneX);
    
    // Area generator for cumulative interest
    const areaInterest = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d.remainingBalance))
        .y1(d => yScale(d.remainingBalance + d.cumulativeInterest))
        .curve(d3.curveMonotoneX);
    
    // Draw remaining balance area
    const balancePath = svg.append('path')
        .datum(schedule)
        .attr('class', 'area-balance')
        .attr('fill', '#2563eb')
        .attr('opacity', 0.7)
        .attr('d', areaBalance);
    
    // Draw cumulative interest area
    const interestPath = svg.append('path')
        .datum(schedule)
        .attr('class', 'area-interest')
        .attr('fill', '#f59e0b')
        .attr('opacity', 0.6)
        .attr('d', areaInterest);
    
    // Animate paths
    const pathLength = balancePath.node().getTotalLength();
    balancePath
        .attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1500)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    
    // Draw baseline comparison line (if provided)
    if (hasBaseline) {
        const baselineLine = d3.line()
            .x((d, i) => xScale(i))
            .y(d => yScale(d.remainingBalance))
            .curve(d3.curveMonotoneX);
        
        const baselinePath = svg.append('path')
            .datum(baselineSchedule)
            .attr('class', 'baseline-line')
            .attr('fill', 'none')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.8)
            .attr('d', baselineLine);
        
        // Animate baseline
        const baselineLength = baselinePath.node().getTotalLength();
        baselinePath
            .attr('stroke-dasharray', `5,5,${baselineLength}`)
            .attr('stroke-dashoffset', baselineLength)
            .transition()
            .duration(1500)
            .ease(d3.easeCubicOut)
            .attr('stroke-dashoffset', 0);
    }
    
    // Add special payment markers
    const specialPayments = schedule.filter(d => d.specialPayment > 0);
    
    svg.selectAll('.special-marker')
        .data(specialPayments)
        .enter()
        .append('circle')
        .attr('class', 'special-marker')
        .attr('cx', (d, i) => xScale(schedule.indexOf(d)))
        .attr('cy', d => yScale(d.remainingBalance))
        .attr('r', 0)
        .attr('fill', '#10b981')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .transition()
        .delay(1500)
        .duration(500)
        .attr('r', 6);
    
    // Legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    const legendData = [
        { label: 'Principal', color: '#2563eb', type: 'area' },
        { label: 'Interest', color: '#f59e0b', type: 'area' },
        { label: 'Special Payment', color: '#10b981', type: 'circle' }
    ];
    
    if (hasBaseline) {
        legendData.push({ label: 'Without Special Payments', color: '#94a3b8', type: 'dashed' });
    }
    
    legendData.forEach((item, i) => {
        const legendRow = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        if (item.type === 'circle') {
            legendRow.append('circle')
                .attr('cx', 6)
                .attr('cy', 6)
                .attr('r', 5)
                .attr('fill', item.color)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1);
        } else if (item.type === 'dashed') {
            legendRow.append('line')
                .attr('x1', 0)
                .attr('y1', 6)
                .attr('x2', 12)
                .attr('y2', 6)
                .attr('stroke', item.color)
                .attr('stroke-width', 2)
                .attr('stroke-dasharray', '3,3');
        } else {
            legendRow.append('rect')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', item.color);
        }
        
        legendRow.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .style('font-size', '12px')
            .style('fill', '#f8fafc')
            .text(item.label);
    });
    
    // Tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'chart-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    // Add invisible overlay for mouse events
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mousemove', function(event) {
            const [mouseX] = d3.pointer(event);
            const index = Math.round(xScale.invert(mouseX));
            
            if (index >= 0 && index < schedule.length) {
                const data = schedule[index];
                tooltip
                    .style('visibility', 'visible')
                    .html(`
                        <strong>Month ${data.month}</strong><br/>
                        Balance: ${formatCurrency(data.remainingBalance)}<br/>
                        Interest Paid: ${formatCurrency(data.cumulativeInterest)}<br/>
                        ${data.specialPayment > 0 ? `Special: ${formatCurrency(data.specialPayment)}` : ''}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            }
        })
        .on('mouseout', () => {
            tooltip.style('visibility', 'hidden');
        });
}

/**
 * Creates a breakdown chart showing principal vs interest over time
 * 
 * @param {string} containerId - Container element ID
 * @param {Array} schedule - Amortization schedule
 */
export function createBreakdownChart(containerId, schedule) {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('❌ D3.js is not loaded. Charts will not render.');
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container || !schedule || schedule.length === 0) {
        console.warn('⚠️  Cannot create breakdown chart: missing container or data');
        return;
    }
    
    container.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Scales
    const xScale = d3.scaleLinear()
        .domain([0, schedule.length])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(schedule, d => d.interest + d.principal)])
        .nice()
        .range([height, 0]);
    
    // Axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${Math.floor(d / 12)}y`))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.x-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => formatCurrency(d)))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.y-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    // Stacked area generator
    const stack = d3.stack()
        .keys(['principal', 'interest'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    
    const series = stack(schedule);
    
    const area = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]))
        .curve(d3.curveMonotoneX);
    
    const colors = {
        principal: '#2563eb',
        interest: '#f59e0b'
    };
    
    // Draw stacked areas
    svg.selectAll('.layer')
        .data(series)
        .enter()
        .append('path')
        .attr('class', 'layer')
        .attr('fill', d => colors[d.key])
        .attr('opacity', 0.7)
        .attr('d', area)
        .on('mouseover', function() {
            d3.select(this).attr('opacity', 0.9);
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.7);
        });
    
    // Find crossover point where principal exceeds interest
    const crossoverIndex = schedule.findIndex(d => d.principal > d.interest);
    if (crossoverIndex > 0) {
        svg.append('line')
            .attr('x1', xScale(crossoverIndex))
            .attr('x2', xScale(crossoverIndex))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('opacity', 0.5);
        
        svg.append('text')
            .attr('x', xScale(crossoverIndex) + 5)
            .attr('y', 15)
            .style('font-size', '11px')
            .style('fill', '#10b981')
            .style('font-weight', '600')
            .text('Principal > Interest');
    }
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    [
        { label: 'Principal', color: '#2563eb' },
        { label: 'Interest', color: '#f59e0b' }
    ].forEach((item, i) => {
        const row = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        row.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', item.color);
        
        row.append('text')
            .attr('x', 18)
            .attr('y', 10)
            .style('font-size', '12px')
            .style('fill', '#f8fafc')
            .text(item.label);
    });
}

/**
 * Creates a comparison chart overlaying two scenarios
 * 
 * @param {string} containerId - Container element ID
 * @param {Array} baseline - Baseline schedule
 * @param {Array} optimized - Optimized schedule
 */
export function createComparisonChart(containerId, baseline, optimized) {
    // Check if D3 is loaded
    if (typeof d3 === 'undefined') {
        console.error('❌ D3.js is not loaded. Charts will not render.');
        return;
    }
    
    const container = document.getElementById(containerId);
    if (!container || !baseline || !optimized) {
        console.warn('⚠️  Cannot create comparison chart: missing container or data');
        return;
    }
    
    container.innerHTML = '';
    
    const margin = { top: 20, right: 30, bottom: 50, left: 80 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const maxLength = Math.max(baseline.length, optimized.length);
    
    const xScale = d3.scaleLinear()
        .domain([0, maxLength])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max([...baseline, ...optimized], d => d.remainingBalance)])
        .nice()
        .range([height, 0]);
    
    // Axes
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${Math.floor(d / 12)}y`))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.x-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).ticks(8).tickFormat(d => formatCurrency(d)))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#cbd5e1');
    
    // Style axis lines and ticks
    svg.select('.y-axis')
        .selectAll('line, path')
        .style('stroke', '#475569');
    
    // Line generators
    const line = d3.line()
        .x((d, i) => xScale(i))
        .y(d => yScale(d.remainingBalance))
        .curve(d3.curveMonotoneX);
    
    // Draw baseline
    svg.append('path')
        .datum(baseline)
        .attr('fill', 'none')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', line);
    
    // Draw optimized
    svg.append('path')
        .datum(optimized)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 3)
        .attr('d', line);
    
    // Fill area between curves
    const area = d3.area()
        .x((d, i) => xScale(i))
        .y0((d, i) => {
            const baselineValue = i < baseline.length ? baseline[i].remainingBalance : 0;
            return yScale(baselineValue);
        })
        .y1(d => yScale(d.remainingBalance))
        .curve(d3.curveMonotoneX);
    
    svg.append('path')
        .datum(optimized.slice(0, Math.min(baseline.length, optimized.length)))
        .attr('fill', '#10b981')
        .attr('opacity', 0.2)
        .attr('d', area);
    
    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, 10)`);
    
    [
        { label: 'Current', color: '#9ca3af', dashed: true },
        { label: 'Optimized', color: '#10b981', dashed: false }
    ].forEach((item, i) => {
        const row = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);
        
        row.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 6)
            .attr('y2', 6)
            .attr('stroke', item.color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', item.dashed ? '5,5' : 'none');
        
        row.append('text')
            .attr('x', 25)
            .attr('y', 10)
            .style('font-size', '12px')
            .style('fill', '#f8fafc')
            .text(item.label);
    });
}

/**
 * Updates an existing chart with new data (with animation)
 * 
 * @param {string} containerId - Container element ID
 * @param {Array} newSchedule - New schedule data
 * @param {string} chartType - Type of chart ('timeline', 'breakdown', 'comparison')
 */
export function updateChart(containerId, newSchedule, chartType = 'timeline') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Fade out old chart
    d3.select(container)
        .transition()
        .duration(300)
        .style('opacity', 0)
        .on('end', () => {
            // Recreate chart with new data
            if (chartType === 'timeline') {
                createTimelineChart(containerId, newSchedule);
            } else if (chartType === 'breakdown') {
                createBreakdownChart(containerId, newSchedule);
            }
            
            // Fade in new chart
            d3.select(container)
                .style('opacity', 0)
                .transition()
                .duration(300)
                .style('opacity', 1);
        });
}
