// --- 1. GLOBAL STATE & TEXTS ---
let appState = {
    dataMode: 'real',
    tone: 'friendly',
    color: '#0ea5e9', 
    invoiceStyle: 'table',
    isMobilePreviewing: false,
    logoUrl: '',
    currency: 'EUR',
    fontFamily: 'Helvetica, Arial, sans-serif', // NEW
    headerStyle: 'classic' // NEW
};

const presetTexts = {
    direct: "This invoice is now due. Please process payment immediately to avoid service interruption.",
    friendly: "Just a friendly reminder that the enclosed invoice is now due. Let us know if you need any help or have questions!",
    formal: "We are writing to remind you that payment for the enclosed invoice is due. Prompt payment is greatly appreciated.",
    informative: "This is an automated notification that the attached invoice has reached its due date.",
    aggressive: "Your account is past due. Pay immediately to prevent service suspension and further collection actions.",
    informal: "Looks like this one might have slipped your mind! Please take care of this invoice when you get a chance."
};

// --- 2. INITIALIZATION & FLOW ---
document.addEventListener('DOMContentLoaded', () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const dateString = date.toISOString().split('T')[0];
    const dueEl = document.getElementById('invoice-due');
    if(dueEl) dueEl.value = dateString;

    // --- DYNAMIC GLOBAL CURRENCY POPULATION ---
    const currencySelector = document.getElementById('currency-selector');
    if (currencySelector && Intl.supportedValuesOf) {
        const currencies = Intl.supportedValuesOf('currency');
        const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
        
        currencySelector.innerHTML = currencies.map(code => {
            let name = code;
            try { name = currencyNames.of(code); } catch(e) {}
            return `<option value="${code}" ${code === 'EUR' ? 'selected' : ''}>${code} - ${name}</option>`;
        }).join('');
    }
    
    toggleDataMode('real');
    setTimeout(() => toggleStep(1), 100); 
});

// --- DYNAMIC SELECTORS ---
function selectColor(hex, btn) {
    appState.color = hex;
    document.querySelectorAll('.color-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'ring-white');
    });
    btn.classList.add('ring-2', 'ring-offset-2', 'ring-offset-slate-900', 'ring-white');
    compileEmailPreview();
}

function selectTone(tone, btn) {
    appState.tone = tone;
    document.querySelectorAll('.tone-btn').forEach(b => {
        b.classList.remove('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
        b.classList.add('bg-slate-900', 'border-slate-700', 'text-slate-300');
        b.querySelector('i').classList.replace('text-white', 'text-sky-400');
    });
    btn.classList.remove('bg-slate-900', 'border-slate-700', 'text-slate-300');
    btn.classList.add('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
    btn.querySelector('i').classList.replace('text-sky-400', 'text-white');
    compileEmailPreview();
}

function selectStyle(style, btn) {
    appState.invoiceStyle = style;
    document.querySelectorAll('.style-btn').forEach(b => {
        b.classList.remove('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
        b.classList.add('bg-slate-900', 'border-slate-700', 'text-slate-300');
        b.querySelector('i').classList.replace('text-white', 'text-sky-400');
        b.querySelector('.subtext').classList.replace('text-sky-200', 'text-slate-500');
    });
    btn.classList.remove('bg-slate-900', 'border-slate-700', 'text-slate-300');
    btn.classList.add('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
    btn.querySelector('i').classList.replace('text-sky-400', 'text-white');
    btn.querySelector('.subtext').classList.replace('text-slate-500', 'text-sky-200');
    compileEmailPreview();
}

function selectFont(font, btn) {
    appState.fontFamily = font;
    document.querySelectorAll('.font-btn').forEach(b => {
        b.classList.remove('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
        b.classList.add('bg-slate-900', 'border-slate-700', 'text-slate-300');
        b.querySelector('.font-check').classList.replace('text-white', 'text-transparent');
    });
    btn.classList.remove('bg-slate-900', 'border-slate-700', 'text-slate-300');
    btn.classList.add('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
    btn.querySelector('.font-check').classList.replace('text-transparent', 'text-white');
    compileEmailPreview();
}

function selectHeader(style, btn) {
    appState.headerStyle = style;
    document.querySelectorAll('.header-btn').forEach(b => {
        b.classList.remove('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
        b.classList.add('bg-slate-900', 'border-slate-700', 'text-slate-300');
        if(b.querySelector('i.icon-active')) {
            b.querySelector('i').classList.replace('text-white', 'text-sky-400');
            b.querySelector('i').classList.replace('icon-active', 'icon-inactive');
        }
    });
    btn.classList.remove('bg-slate-900', 'border-slate-700', 'text-slate-300');
    btn.classList.add('bg-sky-500/20', 'border-sky-500', 'text-white', 'ring-1', 'ring-sky-500');
    btn.querySelector('i').classList.replace('text-sky-400', 'text-white');
    btn.querySelector('i').classList.replace('icon-inactive', 'icon-active');
    compileEmailPreview();
}

// --- MOBILE UI LOGIC ---
function toggleMobilePreview() {
    const leftPanel = document.getElementById('mobile-control-panel');
    const rightPanel = document.getElementById('mobile-preview-panel');
    const toggleBtn = document.getElementById('btn-mobile-toggle');

    appState.isMobilePreviewing = !appState.isMobilePreviewing;

    if (appState.isMobilePreviewing) {
        leftPanel.classList.add('hidden');
        rightPanel.classList.remove('hidden');
        setTimeout(() => rightPanel.classList.remove('opacity-0'), 10);
        toggleBtn.innerHTML = '<i class="ph-bold ph-pencil-simple text-lg"></i> Back to Editing';
    } else {
        rightPanel.classList.add('hidden');
        rightPanel.classList.add('opacity-0');
        leftPanel.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="ph-bold ph-eye text-lg"></i> View Live Preview';
    }
}

function pingMobileButton() {
    const btn = document.getElementById('btn-mobile-toggle');
    if(btn && window.innerWidth < 1024) {
        btn.classList.add('scale-105', 'ring-4', 'ring-sky-500/50');
        setTimeout(() => btn.classList.remove('scale-105', 'ring-4', 'ring-sky-500/50'), 600);
    }
}

// --- ACCORDION LOGIC ---
function toggleStep(stepNumber) {
    for(let i=1; i<=5; i++) {
        const el = document.getElementById('step-' + i);
        const icon = document.getElementById('icon-step-' + i);
        const badge = document.getElementById('badge-step-' + i);
        
        if(i === stepNumber) {
            if(el) el.style.maxHeight = '1500px'; // Increased from 800px to 1500px
            if(icon) icon.classList.add('rotate-180');
            if(badge) {
                badge.classList.remove('bg-slate-700', 'text-slate-300');
                badge.classList.add('bg-sky-500', 'text-white');
            }
        } else {
            if(el) el.style.maxHeight = '0px';
            if(icon) icon.classList.remove('rotate-180');
            if(badge) {
                badge.classList.add('bg-slate-700', 'text-slate-300');
                badge.classList.remove('bg-sky-500', 'text-white');
            }
        }
    }
}

function toggleDataMode(mode) {
    appState.dataMode = mode;
    const btnReal = document.getElementById('btn-data-real');
    const btnMock = document.getElementById('btn-data-mock');
    const btnNextStep1 = document.getElementById('btn-next-step-1');
    const step2Card = document.getElementById('step-card-2');
    const step3Card = document.getElementById('step-card-3');
    
    if(mode === 'real') {
        btnReal.classList.add('bg-sky-500', 'text-white');
        btnReal.classList.remove('bg-slate-800', 'text-slate-400', 'border', 'border-slate-700');
        btnMock.classList.remove('bg-sky-500', 'text-white');
        btnMock.classList.add('bg-slate-800', 'text-slate-400', 'border', 'border-slate-700');
        
        // Show steps 2 and 3 and fix badge numbers
        step2Card.style.display = 'block';
        step3Card.style.display = 'block';
        document.getElementById('badge-step-4').innerText = '4';
        document.getElementById('badge-step-5').innerText = '5';
        
        btnNextStep1.onclick = () => toggleStep(2);
        setTimeout(() => toggleStep(2), 50);
    } else {
        btnMock.classList.add('bg-sky-500', 'text-white');
        btnMock.classList.remove('bg-slate-800', 'text-slate-400', 'border', 'border-slate-700');
        btnReal.classList.remove('bg-sky-500', 'text-white');
        btnReal.classList.add('bg-slate-800', 'text-slate-400', 'border', 'border-slate-700');
        
        // Hide steps 2 and 3 and adjust badge numbers
        step2Card.style.display = 'none';
        step3Card.style.display = 'none';
        document.getElementById('badge-step-4').innerText = '2';
        document.getElementById('badge-step-5').innerText = '3';
        
        btnNextStep1.onclick = () => toggleStep(4);
        setTimeout(() => toggleStep(4), 50);
    }
    compileEmailPreview();
    pingMobileButton();
}

function addLineItem() {
    const container = document.getElementById('line-items-container');
    const itemHtml = `<div class="flex gap-2 line-item mt-2"><input type="text" placeholder="Description" class="item-desc flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-2 focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()"><input type="number" placeholder="Qty" class="item-qty w-12 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 text-center focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()"><input type="number" placeholder="Price" class="item-price w-20 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()"><button onclick="this.parentElement.remove(); compileEmailPreview();" class="text-slate-500 hover:text-red-400 transition-colors"><i class="ph-bold ph-trash"></i></button></div>`;
    container.insertAdjacentHTML('beforeend', itemHtml);
}

// --- LOGO UPLOAD ---
async function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const uploadText = document.getElementById('upload-text');
    const uploadIcon = document.getElementById('upload-icon');
    const dropzone = document.getElementById('logo-upload-zone');
    
    uploadText.innerText = "Compressing & uploading...";
    uploadIcon.className = "ph-bold ph-spinner animate-spin text-2xl text-sky-400";
    dropzone.classList.add('border-sky-500', 'bg-sky-500/10');

    try {
        const compressedBlob = await compressImage(file, 300);
        const response = await fetch(`/api/upload?filename=compressed-${encodeURIComponent(file.name)}`, {
            method: 'POST',
            body: compressedBlob, 
        });

        if (!response.ok) throw new Error(`Upload failed with status: ${response.status}`);
        const data = await response.json();
        
        appState.logoUrl = data.url; 

        uploadText.innerText = "Logo optimized and uploaded!";
        uploadText.classList.add('text-emerald-400');
        uploadIcon.className = "ph-bold ph-check-circle text-2xl text-emerald-400";
        dropzone.classList.replace('border-sky-500', 'border-emerald-500');
        dropzone.classList.replace('bg-sky-500/10', 'bg-emerald-500/10');

        compileEmailPreview();
    } catch (error) {
        console.error("Upload error:", error);
        uploadText.innerText = "Upload failed. Try again.";
        uploadText.classList.add('text-red-400');
        uploadIcon.className = "ph-bold ph-warning text-2xl text-red-400";
        dropzone.classList.replace('border-sky-500', 'border-red-500');
    }
}

function compressImage(file, maxSize) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => resolve(blob), 'image/png', 0.9);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// --- EMAIL COMPILER ---
function compileEmailPreview() {
    const isMock = appState.dataMode === 'mock';
    
    const formatter = new Intl.NumberFormat(undefined, { 
        style: 'currency', 
        currency: appState.currency || 'EUR' 
    });
    
    let subTotal = 0;
    let itemsHtmlTable = '';
    let itemsHtmlBold = '';
    let itemsHtmlSubtle = '';
    
    if (isMock) {
        itemsHtmlTable = `<tr><td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">[Item Description] <span style="color:#9ca3af; font-size: 12px;">x[Qty]</span></td><td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; text-align: right;">[Amount]</td></tr>`;
        itemsHtmlBold = `<tr><td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px; font-weight: bold;">[Item Description] <span style="color:#94a3b8; font-size: 12px; font-weight: normal;">x[Qty]</span></td><td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; text-align: right; font-weight: bold;">[Amount]</td></tr>`;
        itemsHtmlSubtle = `<tr><td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; color: #475569; font-size: 13px;">[Item Description] <span style="color:#94a3b8; font-size: 11px;">x[Qty]</span></td><td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; color: #334155; font-size: 13px; text-align: right;">[Amount]</td></tr>`;
    } else {
        const items = document.querySelectorAll('.line-item');
        items.forEach(item => {
            const desc = item.querySelector('.item-desc').value || '[Description]';
            const qty = parseFloat(item.querySelector('.item-qty').value) || 0;
            const price = parseFloat(item.querySelector('.item-price').value) || 0;
            const lineTotal = qty * price;
            subTotal += lineTotal;
            
            itemsHtmlTable += `<tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${desc} <span style="color:#9ca3af; font-size: 12px;">x${qty}</span></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; text-align: right;">${formatter.format(lineTotal)}</td>
            </tr>`;
            
            itemsHtmlBold += `<tr>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 14px; font-weight: bold;">${desc} <span style="color:#94a3b8; font-size: 12px; font-weight: normal;">x${qty}</span></td>
                <td style="padding: 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; text-align: right; font-weight: bold;">${formatter.format(lineTotal)}</td>
            </tr>`;
            
            itemsHtmlSubtle += `<tr>
                <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; color: #475569; font-size: 13px;">${desc} <span style="color:#94a3b8; font-size: 11px;">x${qty}</span></td>
                <td style="padding: 10px 0; border-bottom: 1px dashed #e2e8f0; color: #334155; font-size: 13px; text-align: right;">${formatter.format(lineTotal)}</td>
            </tr>`;
        });
    }

    const vatInput = document.getElementById('invoice-vat');
    const vatRate = vatInput ? (parseFloat(vatInput.value) || 0) : 0;
    const vatAmount = subTotal * (vatRate / 100);
    const totalAmount = subTotal + vatAmount;

    const data = {
        invNum: isMock ? '[Invoice Number]' : (document.getElementById('invoice-number').value || '[Invoice Number]'),
        due: isMock ? '[Due Date]' : (document.getElementById('invoice-due').value || '[Due Date]'),
        cName: isMock ? '[Client Name]' : (document.getElementById('client-name').value || '[Client Name]'),
        cEmail: isMock ? '[Client Email]' : (document.getElementById('client-email').value || '[Client Email]'),
        // Your Company Data always pulls real values or a clean fallback - no brackets!
        sName: document.getElementById('sender-name').value || 'Your Company Name',
        bName: document.getElementById('bank-name').value || 'Bank Name',
        bBic: document.getElementById('bank-bic').value || 'BIC/SWIFT',
        bIban: document.getElementById('bank-iban').value || 'IBAN',
        sub: isMock ? '[Subtotal]' : formatter.format(subTotal),
        vatAmount: isMock ? '[VAT Amount]' : formatter.format(vatAmount),
        vatRate: isMock ? '[VAT %]' : vatRate,
        total: isMock ? '[Total Amount]' : formatter.format(totalAmount),
        color: appState.color,
        bodyText: presetTexts[appState.tone] || presetTexts.friendly
    };

    const logoHtml = appState.logoUrl 
        ? `<img src="${appState.logoUrl}" alt="Logo" style="max-height: 48px; max-width: 150px; display: block; outline: none; border: none; text-decoration: none;" />`
        : `<div style="width: 48px; height: 48px; background-color: #f8fafc; border-radius: 8px; text-align: center; line-height: 48px; color: #94a3b8; font-size: 12px; font-weight: bold; border: 1px dashed #cbd5e1;">LOGO</div>`;

    let invoiceBlock = '';
    if (appState.invoiceStyle === 'table') {
        invoiceBlock = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
            <tr><td style="padding: 16px; background-color: #f9fafb;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Description</td>
                        <td style="font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; text-align: right;">Amount</td>
                    </tr>
                    ${itemsHtmlTable}
                    <tr>
                        <td style="padding-top: 12px; font-size: 12px; color: #6b7280; text-align: right;">Subtotal</td>
                        <td style="padding-top: 12px; font-size: 14px; color: #111827; text-align: right;">${data.sub}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 6px; font-size: 12px; color: #6b7280; text-align: right;">VAT (${data.vatRate}%)</td>
                        <td style="padding-top: 6px; font-size: 14px; color: #111827; text-align: right;">${data.vatAmount}</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 12px; font-size: 14px; font-weight: bold; color: #111827; text-align: right;">Total Due</td>
                        <td style="padding-top: 12px; font-size: 18px; font-weight: bold; color: ${data.color}; text-align: right;">${data.total}</td>
                    </tr>
                </table>
            </td></tr>
        </table>`;
    } else if (appState.invoiceStyle === 'card') {
        invoiceBlock = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <tr><td style="padding: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Amount Due</p>
                <p style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: ${data.color};">${data.total}</p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Due Date: <span style="color: #ef4444; font-weight: bold;">${data.due}</span></p>
            </td></tr>
        </table>`;
    } else if (appState.invoiceStyle === 'bold') {
        invoiceBlock = `
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border: 2px solid #0f172a; border-radius: 8px; overflow: hidden;">
            <tr>
                <td style="background-color: #0f172a; padding: 16px; color: #ffffff; font-size: 12px; font-weight: bold; text-transform: uppercase;">Description</td>
                <td style="background-color: #0f172a; padding: 16px; color: #ffffff; font-size: 12px; font-weight: bold; text-transform: uppercase; text-align: right;">Amount</td>
            </tr>
            ${itemsHtmlBold}
            <tr>
                <td style="padding: 16px 16px 8px 16px; font-size: 13px; font-weight: bold; color: #64748b; text-align: right; background-color: #f8fafc;">Subtotal</td>
                <td style="padding: 16px 16px 8px 16px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right; background-color: #f8fafc;">${data.sub}</td>
            </tr>
            <tr>
                <td style="padding: 0 16px 16px 16px; font-size: 13px; font-weight: bold; color: #64748b; text-align: right; background-color: #f8fafc;">VAT (${data.vatRate}%)</td>
                <td style="padding: 0 16px 16px 16px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right; background-color: #f8fafc;">${data.vatAmount}</td>
            </tr>
            <tr>
                <td style="padding: 16px; font-size: 14px; font-weight: bold; color: #ffffff; text-align: right; background-color: ${data.color};">TOTAL DUE</td>
                <td style="padding: 16px; font-size: 24px; font-weight: bold; color: #ffffff; text-align: right; background-color: ${data.color};">${data.total}</td>
            </tr>
        </table>`;
    } else if (appState.invoiceStyle === 'subtle') {
        invoiceBlock = `
        <div style="margin-bottom: 32px;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                    <td style="font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Description</td>
                    <td style="font-size: 11px; color: #94a3b8; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-align: right;">Amount</td>
                </tr>
                ${itemsHtmlSubtle}
                <tr>
                    <td style="padding-top: 16px; font-size: 13px; color: #64748b; text-align: right;">Subtotal</td>
                    <td style="padding-top: 16px; font-size: 13px; color: #0f172a; text-align: right;">${data.sub}</td>
                </tr>
                <tr>
                    <td style="padding-top: 4px; font-size: 13px; color: #64748b; text-align: right;">VAT (${data.vatRate}%)</td>
                    <td style="padding-top: 4px; font-size: 13px; color: #0f172a; text-align: right;">${data.vatAmount}</td>
                </tr>
                <tr>
                    <td style="padding-top: 16px; font-size: 14px; font-weight: bold; color: #0f172a; text-align: right;">Total Due</td>
                    <td style="padding-top: 16px; font-size: 20px; font-weight: bold; color: ${data.color}; text-align: right;">${data.total}</td>
                </tr>
            </table>
        </div>`;
    }

    // --- BUILD DYNAMIC HEADER ---
    let headerBlockHTML = '';
    
    if (appState.headerStyle === 'classic') {
        headerBlockHTML = `
            <tr><td height="6" style="background-color: ${data.color};"></td></tr>
            <tr>
                <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f8fafc;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <h1 style="margin: 0 0 4px 0; font-size: 24px; color: #111827; text-transform: uppercase;">REMINDER</h1>
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Invoice: ${data.invNum}</p>
                            </td>
                            <td align="right">${logoHtml}</td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    } else if (appState.headerStyle === 'bold-top') {
        headerBlockHTML = `
            <tr><td height="16" style="background-color: ${data.color};"></td></tr>
            <tr>
                <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #f8fafc;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <h1 style="margin: 0 0 4px 0; font-size: 24px; color: #111827; text-transform: uppercase;">REMINDER</h1>
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Invoice: ${data.invNum}</p>
                            </td>
                            <td align="right">${logoHtml}</td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    } else if (appState.headerStyle === 'dashed') {
        headerBlockHTML = `
            <tr>
                <td style="padding: 32px 32px 24px 32px; border-bottom: 2px dashed ${data.color};">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <h1 style="margin: 0 0 4px 0; font-size: 24px; color: ${data.color}; text-transform: uppercase;">REMINDER</h1>
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Invoice: ${data.invNum}</p>
                            </td>
                            <td align="right">${logoHtml}</td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    } else if (appState.headerStyle === 'block') {
        // Solid block header with inverted text
        headerBlockHTML = `
            <tr>
                <td style="padding: 32px; background-color: ${data.color};">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                            <td>
                                <h1 style="margin: 0 0 4px 0; font-size: 24px; color: #ffffff; text-transform: uppercase;">REMINDER</h1>
                                <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8);">Invoice: ${data.invNum}</p>
                            </td>
                            <td align="right">
                                <div style="background: #ffffff; padding: 8px; border-radius: 8px; display: inline-block;">
                                    ${logoHtml}
                                </div>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>`;
    }

    // --- ASSEMBLE FINAL HTML ---
    // Notice the font-family is now injected dynamically at the very top div
    const emailHTML = `
    <div style="background-color: #f1f5f9; padding: 20px 0; font-family: ${appState.fontFamily}; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            ${headerBlockHTML}

            <tr>
                <td style="padding: 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
                    <p style="margin: 0 0 4px 0; font-size: 18px; font-weight: bold; color: #0f172a;">${data.cName}</p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b;">${data.cEmail}</p>

                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #334155; line-height: 1.6;">
                        ${data.bodyText}
                    </p>

                    ${invoiceBlock}

                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <tr><td style="padding: 16px;">
                            <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase;">Payment Details</p>
                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="font-size: 13px; color: #334155; padding-bottom: 4px;"><strong>Bank:</strong> ${data.bName}</td>
                                    <td style="font-size: 13px; color: #334155; padding-bottom: 4px;"><strong>BIC:</strong> ${data.bBic}</td>
                                </tr>
                                <tr>
                                    <td colspan="2" style="font-size: 13px; color: #334155;"><strong>IBAN:</strong> ${data.bIban}</td>
                                </tr>
                            </table>
                        </td></tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding: 32px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 24px 0; font-size: 12px; color: #64748b;">${data.sName} • System Generated Email</p>
                    
                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 24px; max-width: 300px; margin: 0 auto;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #0f172a;">Want to automate your reminders?</p>
                        <table border="0" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                                <td align="center">
                                    <a style="font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; background-color: #0ea5e9; text-decoration: none; padding: 10px 24px; border-radius: 6px; display: inline-block; font-weight: bold; letter-spacing: 0.3px; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);" href="https://app.maxcredible.com/signup/" target="_blank" rel="noopener">Start Free Trial</a>
                                </td>
                            </tr>
                        </table>
                    </div>

                </td>
            </tr>
        </table>
    </div>`;;

    document.getElementById('email-canvas').innerHTML = emailHTML;
}

// --- MODAL CONTROLS ---
function openSuccessModal() {
    const modal = document.getElementById('success-modal');
    const card = document.getElementById('success-modal-card');
    modal.classList.remove('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
}

function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    const card = document.getElementById('success-modal-card');
    modal.classList.add('opacity-0', 'pointer-events-none');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
}

// --- AUTH INTERCEPTOR & MODAL CONTROLS ---
function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('opacity-0', 'pointer-events-none');
    document.getElementById('auth-modal-card').classList.replace('scale-95', 'scale-100');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('auth-modal-card').classList.replace('scale-100', 'scale-95');
}

async function dispatchEmail() {
    const emailInput = document.getElementById('target-email');
    if(!emailInput.value) {
        alert('Please enter a target email address.');
        return;
    }

    const { data: { user }, error } = await _supabase.auth.getUser();
    
    if (error || !user) {
        alert("Session error. Please refresh the page.");
        return;
    }

    // Intercept anonymous users
    if (user.is_anonymous) {
        openAuthModal();
        return;
    }

    // Proceed if fully registered
    executeSend(); 
}

async function upgradeAccountAndSend() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('btn-upgrade');

    if (!email || !password) {
        alert("Email and password required.");
        return;
    }
    
    btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Saving...';

    const { data, error } = await _supabase.auth.updateUser({
        email: email,
        password: password
    });

    if (error) {
        alert(error.message);
        btn.innerHTML = 'Create Account';
        return;
    }

    closeAuthModal();
    executeSend(); 
}

// --- ACTUAL SEND LOGIC ---
async function executeSend() {
    const emailInput = document.getElementById('target-email');
    const sendBtn = emailInput.nextElementSibling;
    const email = emailInput.value;
    const rawHTML = document.getElementById('email-canvas').innerHTML;
    const senderName = document.getElementById('sender-name') ? document.getElementById('sender-name').value : "MaxCredible";

    const originalBtnHtml = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i> Sending...';
    sendBtn.disabled = true;

    try {
        const invoiceId = document.getElementById('invoice-number').value;

        const response = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                subject: `Invoice & Payment Reminder from ${senderName || 'Your Company'}`,
                html: rawHTML,
                invoiceId: invoiceId
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}...`);
        }

        const { error: dbError } = await _supabase
            .from('invoices')
            .update({ 
                status: 'sent',
                debtor_email: email // Captures the target email
            })
            .eq('invoice_number', invoiceId);

        if (dbError) {
            console.warn("Email sent, but failed to update Supabase status:", dbError);
        }

        sendBtn.innerHTML = '<i class="ph-bold ph-check"></i> Sent!';
        openSuccessModal();
        
    } catch (error) {
        console.error("Dispatch Error:", error);
        alert(`Error: ${error.message}`);
        sendBtn.innerHTML = originalBtnHtml;
    } finally {
        setTimeout(() => {
            sendBtn.innerHTML = originalBtnHtml;
            sendBtn.disabled = false;
        }, 3000);
    }
}

function openEditor(invoiceId, debtorName, amount) {
    // Route to the builder
    switchView('template-builder-section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Pre-fill the core metadata
    document.getElementById('client-name').value = debtorName;
    document.getElementById('invoice-number').value = invoiceId;
    
    // Rebuild line items container with the outstanding amount
    const container = document.getElementById('line-items-container');
    container.innerHTML = `
        <div class="flex gap-2 line-item mt-2">
            <input type="text" value="Outstanding Balance" class="item-desc flex-1 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 py-2 focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()">
            <input type="number" value="1" class="item-qty w-12 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 text-center focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()">
            <input type="number" value="${amount}" class="item-price w-24 bg-slate-900 border border-slate-700 text-white text-xs rounded px-2 focus:border-sky-500 focus:outline-none" oninput="compileEmailPreview()">
        </div>
    `;
    
    // Force the appState to real data and render
    toggleDataMode('real');
    compileEmailPreview();
}
