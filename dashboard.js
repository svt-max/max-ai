const supabaseUrl = 'https://tdqvjwoiqysxetxhohtc.supabase.co';
const supabaseKey = 'sb_publishable_zpHOnWoyHHNYqi-Feq8o6w_vSkErwP7';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Central View Router
function switchView(viewId) {
    const views = ['upload-section', 'dashboard-section', 'template-builder-section'];
    
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === viewId) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        }
    });
}

document.getElementById('csv-upload').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: async function(results) {
            const formattedData = results.data.filter(row => row['Type'] === 'Invoice').map(row => ({
                invoice_number: row['Invoice ID'],
                debtor_name: row['Debtor Name'],
                amount: row['Outstanding'],
                days_overdue: row['Days Overdue'],
                status: 'draft'
            }));

            // Stop and check the payload
            console.log("Parsed Data:", formattedData);
            if (formattedData.length === 0) {
                alert("Upload failed: No rows matched Type='Invoice'. Check your CSV headers.");
                return;
            }

            // Insert into Supabase
            const { data, error } = await _supabase.from('invoices').insert(formattedData);
            
            if (error) {
                console.error("Upload failed:", error);
                alert(`Database error: ${error.message}`);
            } else {
                loadDashboardData(); 
            }
        }
    });
});

async function loadDashboardData() {
    const { data: invoices, error } = await _supabase
        .from('invoices')
        .select('*')
        .neq('status', 'paid'); // Only show active invoices

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    // Gatekeeper: If no active invoices exist, stay on the upload screen
    if (!invoices || invoices.length === 0) {
        switchView('upload-section');
        return; 
    }

    // Pass this data to your existing populateTable and chart functions
    processData(invoices); 
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Add this function to dashboard.js
async function markAsPaid(id) {
    const { error } = await _supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id);

    if (error) {
        alert("Could not update status.");
    } else {
        loadDashboardData(); // Refresh the table
    }
}

function processData(data) {
    // 1. Separate by Type
    const invoices = data.filter(row => row['Type'] === 'Invoice');
    const credits = data.filter(row => row['Type'] === 'Credit Note' || row['Type'] === 'Unallocated Payment');

    // 2. Calculate Totals
    const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv['Outstanding'] || 0), 0);
    const totalCredits = credits.reduce((sum, cred) => sum + (cred['Outstanding'] || 0), 0);

    // 3. Bucket Logic (Replicating Pandas pd.cut)
    let criticalOverdue = 0;
    let criticalCount = 0;
    let agingBuckets = { 'Not yet due': 0, '1-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 };

    invoices.forEach(inv => {
        const days = inv['Days Overdue'];
        const amount = inv['Outstanding'];
        
        if (days <= 0) agingBuckets['Not yet due'] += amount;
        else if (days <= 30) agingBuckets['1-30'] += amount;
        else if (days <= 60) agingBuckets['31-60'] += amount;
        else if (days <= 90) agingBuckets['61-90'] += amount;
        else if (days <= 180) agingBuckets['91-180'] += amount;
        else {
            agingBuckets['180+'] += amount;
            criticalOverdue += amount;
            criticalCount++;
        }
    });

    // Normalized Risk Scoring
    const maxAmount = Math.max(...invoices.map(i => i['Outstanding'] || 0));
    const maxDays = Math.max(...invoices.map(i => i['Days Overdue'] || 0));
    
    invoices.forEach(inv => {
        inv.SizeScore = ((inv['Outstanding'] || 0) / maxAmount) * 100;
        inv.DueScore = ((inv['Days Overdue'] || 0) / maxDays) * 100;
        // Weighted: 60% age, 40% size 
        inv.RiskScore = (inv.DueScore * 0.6) + (inv.SizeScore * 0.4);
    });

    // Draw DOM Charts
    renderAgingChart(agingBuckets);
    renderDebtorChart(invoices);

    // 4. Update UI
    switchView('dashboard-section');
    
    document.getElementById('stat-total').innerText = `£${totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('stat-critical').innerText = `£${criticalOverdue.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('stat-credits').innerText = `£${Math.abs(totalCredits).toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    // 5. Generate Summary Text (Rules-based approach)
    generateSummary(totalOutstanding, criticalOverdue, criticalCount, totalCredits, invoices.length);

    // 6. Populate Table
    populateTable(invoices);
}

function generateSummary(total, criticalAmount, criticalCount, credits, totalCount) {
    const percentageCritical = ((criticalAmount / total) * 100).toFixed(0);
    const content = document.getElementById('summary-content');
    
    content.innerHTML = `
        <p>Here's a summary of the key findings from your ${totalCount}-invoice dataset:</p>
        <p>The headline number is concerning. Of <strong>£${total.toLocaleString()}</strong> in outstanding invoices, <strong>£${criticalAmount.toLocaleString()} (${percentageCritical}%)</strong> is more than 180 days overdue across ${criticalCount} invoices — that's your most urgent collection priority.</p>
        <p>Credits and unallocated payments (<strong>£${Math.abs(credits).toLocaleString()}</strong>) haven't been matched against outstanding invoices. Allocating these could meaningfully reduce the headline figure.</p>
        <h3 class="font-bold text-white mt-6 mb-2">Recommended next steps:</h3>
        <ul class="list-disc pl-5 space-y-2">
            <li>Prioritise the ${criticalCount} invoices over 180 days.</li>
            <li>Allocate the £${Math.abs(credits).toLocaleString()} in credits to reduce net exposure.</li>
            <li>Review credit terms to tighten up the early-stage aging buckets.</li>
        </ul>
    `;
}

function toggleSummaryDrawer() {
    const drawer = document.getElementById('summary-drawer');
    drawer.classList.toggle('translate-x-full');
}

function populateTable(invoices) {
    // Sort by most overdue first
    invoices.sort((a, b) => b['Days Overdue'] - a['Days Overdue']);
    
    const tbody = document.getElementById('invoice-table-body');
    tbody.innerHTML = '';

    // Only show top 50 to prevent DOM lag, or implement pagination
    invoices.slice(0, 50).forEach(inv => {
        const safeName = (inv['Debtor Name'] || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-800/50 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-sky-400">${inv['Invoice ID']}</td>
            <td class="px-6 py-4 font-medium text-white">${inv['Debtor Name']}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${inv['Days Overdue'] > 90 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}">
                    ${inv['Days Overdue']} days
                </span>
            </td>
            <td class="px-6 py-4">£${inv['Outstanding'].toLocaleString()}</td>
            <td class="px-6 py-4">
                ${getRiskBadge(inv.RiskScore, inv.SizeScore, inv.DueScore)}
            </td>
            <td class="px-6 py-4 flex gap-2">
                <button onclick="openEditor('${inv.invoice_number}', '${safeName}', ${inv.amount})" class="text-sm bg-slate-700 hover:bg-sky-500 hover:text-white px-3 py-1 rounded transition-colors">
                    Draft Reminder
                </button>
                <button onclick="markAsPaid('${inv.id}')" class="text-sm bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1 rounded transition-colors">
                    Mark Paid
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getRiskBadge(total, size, due) {
    let label = 'Medium', colorClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (total > 70) { label = 'Critical'; colorClass = 'bg-red-500/20 text-red-400 border-red-500/30'; }
    else if (total > 40) { label = 'High'; colorClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30'; }
    
    return `
        <div class="flex flex-col gap-1.5 w-28 group relative cursor-help">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold border text-center ${colorClass}">${label} (${total.toFixed(0)})</span>
            
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-[10px] text-slate-300 pointer-events-none">
                <div class="flex justify-between mb-1"><span class="text-slate-400">Age Risk (60%):</span> <span class="font-bold text-red-400">${due.toFixed(1)}</span></div>
                <div class="flex justify-between"><span class="text-slate-400">Size Risk (40%):</span> <span class="font-bold text-sky-400">${size.toFixed(1)}</span></div>
            </div>
            <div class="flex h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 gap-[1px]">
                <div class="bg-sky-400" style="width: ${size}%" title="Size weight"></div>
                <div class="bg-red-400" style="width: ${due}%" title="Age weight"></div>
            </div>
        </div>
    `;
}

function renderAgingChart(buckets) {
    const container = document.getElementById('aging-chart-container');
    if(!container) return;
    
    const maxVal = Math.max(...Object.values(buckets));
    const colors = ['bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600', 'bg-teal-700', 'bg-red-400', 'bg-red-600'];
    
    container.innerHTML = Object.entries(buckets).map(([label, val], idx) => {
        const heightPercent = val === 0 ? 0 : Math.max(8, (val / maxVal) * 100);
        return `
        <div class="flex flex-col items-center justify-end flex-1 group h-full pb-10 relative">
            <div class="w-full max-w-[40px] ${colors[idx]} rounded-t-sm transition-all relative" style="height: ${heightPercent}%">
                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1 rounded z-10">£${(val/1000).toFixed(0)}k</span>
            </div>
            <span class="absolute bottom-1 text-[10px] text-slate-400 -rotate-45 whitespace-nowrap transform -translate-x-3">${label}</span>
        </div>
        `;
    }).join('');
}

function renderDebtorChart(invoices) {
    const container = document.getElementById('debtor-chart-container');
    if(!container) return;
    
    // Aggregate by debtor
    const debtors = {};
    invoices.forEach(inv => {
        debtors[inv['Debtor Name']] = (debtors[inv['Debtor Name']] || 0) + (inv['Outstanding'] || 0);
    });
    
    const sortedDebtors = Object.entries(debtors).sort((a,b) => b[1] - a[1]).slice(0, 5);
    const maxDebt = sortedDebtors[0]?.[1] || 1;
    
    container.innerHTML = sortedDebtors.map(([name, val], idx) => {
        const widthPercent = (val / maxDebt) * 100;
        const opacity = 1 - (idx * 0.15);
        return `
        <div class="flex items-center gap-4 text-xs">
            <span class="w-28 truncate text-slate-300 text-right font-medium" title="${name}">${name}</span>
            <div class="flex-1 h-7 bg-slate-900/50 rounded overflow-hidden relative group">
                <div class="h-full bg-indigo-500 rounded transition-all" style="width: ${widthPercent}%; opacity: ${opacity}"></div>
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100">£${val.toLocaleString()}</span>
            </div>
        </div>
        `;
    }).join('');
}
