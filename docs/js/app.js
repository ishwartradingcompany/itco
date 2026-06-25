        // Indian Rupee, bullet, checkmark - from code points to avoid file encoding issues
        const RU = String.fromCharCode(0x20B9);
        const BULLET = String.fromCharCode(0x2022);
        const CHECK = String.fromCharCode(0x2713);

        // Escape user input for safe HTML display (XSS prevention)
        function escapeHtml(str) {
            if (str == null || str === '') return '';
            var s = String(str);
            return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function collectUniqueNonEmpty(values) {
            const seen = new Set();
            const out = [];
            (values || []).forEach(function(value) {
                const text = String(value == null ? '' : value).trim();
                if (!text) return;
                const key = text.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                out.push(text);
            });
            return out;
        }

        function summarizeMultiValue(values, fallbackText) {
            const list = collectUniqueNonEmpty(values);
            if (list.length === 0) return fallbackText || '-';
            if (list.length === 1) return list[0];
            return 'Multiple (' + list.length + ')';
        }

        let purchaseInlineBrokerageRowIndex = 0;
        let saleInlineBrokerageRowIndex = 0;

        function getActiveBrokerList() {
            return (appData.brokers || []).filter(function(broker) { return broker.active !== false; });
        }

        function getInlineBrokerOptionsHtml(selectedId) {
            const selected = selectedId == null ? '' : String(selectedId);
            let html = '<option value="">Select Broker</option>';
            getActiveBrokerList().forEach(function(broker) {
                const idText = String(broker.id);
                const selectedAttr = idText === selected ? ' selected' : '';
                html += '<option value="' + escapeHtml(idText) + '"' + selectedAttr + '>' + escapeHtml(broker.name || idText) + '</option>';
            });
            return html;
        }

        function renderPurchaseInlineBrokerageRow(index, entry, canRemove) {
            const brokerId = entry && entry.brokerId != null ? String(entry.brokerId) : '';
            const amount = entry && entry.amount != null ? Number(entry.amount) : '';
            return `
                <div class="purchase-inline-brokerage-row grid grid-cols-1 md:grid-cols-3 gap-3 items-end" data-index="${index}">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Broker</label>
                        <select class="purchase-inline-brokerage-broker w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                            ${getInlineBrokerOptionsHtml(brokerId)}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                        <input type="number" class="purchase-inline-brokerage-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="Brokerage Amount" value="${amount !== '' ? amount : ''}" min="0" step="0.01">
                    </div>
                    <div>
                        ${canRemove ? `<button type="button" onclick="removePurchaseBrokerageRow(${index})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>` : '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>'}
                    </div>
                </div>
            `;
        }

        function renderSaleInlineBrokerageRow(index, entry, canRemove) {
            const brokerId = entry && entry.brokerId != null ? String(entry.brokerId) : '';
            const amount = entry && entry.amount != null ? Number(entry.amount) : '';
            return `
                <div class="sale-inline-brokerage-row grid grid-cols-1 md:grid-cols-3 gap-3 items-end" data-index="${index}">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Broker</label>
                        <select class="sale-inline-brokerage-broker w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent">
                            ${getInlineBrokerOptionsHtml(brokerId)}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                        <input type="number" class="sale-inline-brokerage-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent" placeholder="Brokerage Amount" value="${amount !== '' ? amount : ''}" min="0" step="0.01">
                    </div>
                    <div>
                        ${canRemove ? `<button type="button" onclick="removeSaleBrokerageRow(${index})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>` : '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>'}
                    </div>
                </div>
            `;
        }

        function setPurchaseBrokerageRows(entries) {
            const container = document.getElementById('purchaseBrokerageRows');
            if (!container) return;
            const list = (entries && entries.length) ? entries : [];
            purchaseInlineBrokerageRowIndex = 0;
            container.innerHTML = '';
            if (list.length === 0) return;
            list.forEach(function(entry, idx) {
                const rowIndex = ++purchaseInlineBrokerageRowIndex;
                container.insertAdjacentHTML('beforeend', renderPurchaseInlineBrokerageRow(rowIndex, entry, idx > 0));
            });
        }

        function setSaleBrokerageRows(entries) {
            const container = document.getElementById('saleBrokerageRows');
            if (!container) return;
            const list = (entries && entries.length) ? entries : [];
            saleInlineBrokerageRowIndex = 0;
            container.innerHTML = '';
            if (list.length === 0) return;
            list.forEach(function(entry, idx) {
                const rowIndex = ++saleInlineBrokerageRowIndex;
                container.insertAdjacentHTML('beforeend', renderSaleInlineBrokerageRow(rowIndex, entry, idx > 0));
            });
        }

        function addPurchaseBrokerageRow(entry) {
            const container = document.getElementById('purchaseBrokerageRows');
            if (!container) return;
            const rowIndex = ++purchaseInlineBrokerageRowIndex;
            const existingRows = container.querySelectorAll('.purchase-inline-brokerage-row').length;
            container.insertAdjacentHTML('beforeend', renderPurchaseInlineBrokerageRow(rowIndex, entry || {}, existingRows > 0));
            const firstRow = container.querySelector('.purchase-inline-brokerage-row');
            if (firstRow) {
                const firstIndex = Number(firstRow.getAttribute('data-index'));
                const firstBtnWrap = firstRow.querySelector('div:last-child');
                if (firstBtnWrap) {
                    const hasMultiple = container.querySelectorAll('.purchase-inline-brokerage-row').length > 1;
                    firstBtnWrap.innerHTML = hasMultiple
                        ? `<button type="button" onclick="removePurchaseBrokerageRow(${firstIndex})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>`
                        : '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>';
                }
            }
        }

        function addSaleBrokerageRow(entry) {
            const container = document.getElementById('saleBrokerageRows');
            if (!container) return;
            const rowIndex = ++saleInlineBrokerageRowIndex;
            const existingRows = container.querySelectorAll('.sale-inline-brokerage-row').length;
            container.insertAdjacentHTML('beforeend', renderSaleInlineBrokerageRow(rowIndex, entry || {}, existingRows > 0));
            const firstRow = container.querySelector('.sale-inline-brokerage-row');
            if (firstRow) {
                const firstIndex = Number(firstRow.getAttribute('data-index'));
                const firstBtnWrap = firstRow.querySelector('div:last-child');
                if (firstBtnWrap) {
                    const hasMultiple = container.querySelectorAll('.sale-inline-brokerage-row').length > 1;
                    firstBtnWrap.innerHTML = hasMultiple
                        ? `<button type="button" onclick="removeSaleBrokerageRow(${firstIndex})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>`
                        : '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>';
                }
            }
        }

        function removePurchaseBrokerageRow(index) {
            const row = document.querySelector('.purchase-inline-brokerage-row[data-index="' + String(index) + '"]');
            if (!row) return;
            row.remove();
            const container = document.getElementById('purchaseBrokerageRows');
            if (!container) return;
            const rows = container.querySelectorAll('.purchase-inline-brokerage-row');
            if (rows.length === 1) {
                const onlyRow = rows[0];
                const wrap = onlyRow.querySelector('div:last-child');
                if (wrap) wrap.innerHTML = '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>';
            }
        }

        function removeSaleBrokerageRow(index) {
            const row = document.querySelector('.sale-inline-brokerage-row[data-index="' + String(index) + '"]');
            if (!row) return;
            row.remove();
            const container = document.getElementById('saleBrokerageRows');
            if (!container) return;
            const rows = container.querySelectorAll('.sale-inline-brokerage-row');
            if (rows.length === 1) {
                const onlyRow = rows[0];
                const wrap = onlyRow.querySelector('div:last-child');
                if (wrap) wrap.innerHTML = '<div class="text-xs text-slate-500 px-1">At least one row required when posting brokerage</div>';
            }
        }

        function togglePurchaseBrokerageSection() {
            const toggle = document.getElementById('purchasePostBrokerageToggle');
            const container = document.getElementById('purchaseInlineBrokerageContainer');
            if (!toggle || !container) return;
            container.classList.toggle('hidden', !toggle.checked);
            if (toggle.checked) {
                const hasRows = container.querySelectorAll('.purchase-inline-brokerage-row').length > 0;
                if (!hasRows) addPurchaseBrokerageRow();
            }
        }

        function toggleSaleBrokerageSection() {
            const toggle = document.getElementById('salePostBrokerageToggle');
            const container = document.getElementById('saleInlineBrokerageContainer');
            if (!toggle || !container) return;
            container.classList.toggle('hidden', !toggle.checked);
            if (toggle.checked) {
                const hasRows = container.querySelectorAll('.sale-inline-brokerage-row').length > 0;
                if (!hasRows) addSaleBrokerageRow();
            }
        }

        function getPurchaseBrokerageEntries() {
            const rows = document.querySelectorAll('.purchase-inline-brokerage-row');
            const entries = [];
            rows.forEach(function(row) {
                const brokerEl = row.querySelector('.purchase-inline-brokerage-broker');
                const amountEl = row.querySelector('.purchase-inline-brokerage-amount');
                if (!brokerEl || !amountEl) return;
                const brokerId = (brokerEl.value || '').trim();
                const amount = parseFloat(amountEl.value) || 0;
                if (!brokerId || amount <= 0) return;
                const broker = (appData.brokers || []).find(function(b) { return String(b.id) === String(brokerId); });
                entries.push({
                    brokerId: brokerId,
                    brokerName: broker ? broker.name : (brokerEl.options[brokerEl.selectedIndex] ? brokerEl.options[brokerEl.selectedIndex].text : ''),
                    amount: +amount.toFixed(2)
                });
            });
            return entries;
        }

        function getSaleBrokerageEntries() {
            const rows = document.querySelectorAll('.sale-inline-brokerage-row');
            const entries = [];
            rows.forEach(function(row) {
                const brokerEl = row.querySelector('.sale-inline-brokerage-broker');
                const amountEl = row.querySelector('.sale-inline-brokerage-amount');
                if (!brokerEl || !amountEl) return;
                const brokerId = (brokerEl.value || '').trim();
                const amount = parseFloat(amountEl.value) || 0;
                if (!brokerId || amount <= 0) return;
                const broker = (appData.brokers || []).find(function(b) { return String(b.id) === String(brokerId); });
                entries.push({
                    brokerId: brokerId,
                    brokerName: broker ? broker.name : (brokerEl.options[brokerEl.selectedIndex] ? brokerEl.options[brokerEl.selectedIndex].text : ''),
                    amount: +amount.toFixed(2)
                });
            });
            return entries;
        }

        function refreshInlineBrokerageBrokerOptions() {
            const purchaseSelects = document.querySelectorAll('.purchase-inline-brokerage-broker');
            purchaseSelects.forEach(function(select) {
                const value = select.value || '';
                select.innerHTML = getInlineBrokerOptionsHtml(value);
                select.value = value;
            });
            const saleSelects = document.querySelectorAll('.sale-inline-brokerage-broker');
            saleSelects.forEach(function(select) {
                const value = select.value || '';
                select.innerHTML = getInlineBrokerOptionsHtml(value);
                select.value = value;
            });
        }

        function summarizeItemForBrokerage(items) {
            const safeItems = Array.isArray(items) ? items : [];
            const itemIds = collectUniqueNonEmpty(safeItems.map(function(item) { return item.itemId; }));
            if (itemIds.length === 1) {
                const match = (appData.items || []).find(function(item) { return String(item.id) === String(itemIds[0]); });
                return {
                    itemId: itemIds[0],
                    itemName: match ? match.name : (safeItems[0] && safeItems[0].itemName ? safeItems[0].itemName : 'Item')
                };
            }
            return {
                itemId: 'multiple',
                itemName: 'Multiple Items'
            };
        }

        function removeInlineBrokerageBySource(sourceKey, invoiceId) {
            appData.brokerage = (appData.brokerage || []).filter(function(entry) {
                return !(entry.source === sourceKey && String(entry.sourceInvoiceId) === String(invoiceId));
            });
        }

        function pushInlineBrokerageEntries(config) {
            const entries = config.entries || [];
            if (!entries.length) return;
            const itemInfo = summarizeItemForBrokerage(config.items || []);
            entries.forEach(function(entry, idx) {
                const amount = parseFloat(entry.amount) || 0;
                if (amount <= 0) return;
                const brokerage = {
                    id: Date.now() + idx + Math.floor(Math.random() * 1000),
                    date: config.date || '',
                    brokerId: entry.brokerId,
                    brokerName: entry.brokerName || '',
                    itemId: itemInfo.itemId,
                    itemName: itemInfo.itemName,
                    type: config.type,
                    amount: +amount.toFixed(2),
                    reference: config.reference || '',
                    source: config.source,
                    sourceInvoiceId: config.sourceInvoiceId,
                    sourceInvoiceNo: config.sourceInvoiceNo
                };
                appData.brokerage.push(brokerage);
            });
        }

        function allocateBrokerageEntriesByGroups(entries, groups) {
            const safeEntries = Array.isArray(entries) ? entries : [];
            const safeGroups = Array.isArray(groups) ? groups : [];
            if (!safeEntries.length || !safeGroups.length) return safeGroups.map(function() { return []; });
            const totalValue = safeGroups.reduce(function(sum, group) { return sum + (parseFloat(group.itemsTotal) || 0); }, 0);
            return safeGroups.map(function(group, groupIdx) {
                return safeEntries.map(function(entry) {
                    if (groupIdx === safeGroups.length - 1) {
                        const usedSoFar = safeGroups.slice(0, groupIdx).reduce(function(sum, prevGroup, prevIdx) {
                            const prevAlloc = safeEntries.map(function(prevEntry) {
                                if (String(prevEntry.brokerId) !== String(entry.brokerId)) return 0;
                                if (totalValue > 0) {
                                    const ratio = (parseFloat(prevGroup.itemsTotal) || 0) / totalValue;
                                    return +(prevEntry.amount * ratio).toFixed(2);
                                }
                                return +(prevEntry.amount / safeGroups.length).toFixed(2);
                            }).reduce(function(s, v) { return s + v; }, 0);
                            return sum + prevAlloc;
                        }, 0);
                        return {
                            brokerId: entry.brokerId,
                            brokerName: entry.brokerName,
                            amount: +Math.max(0, (parseFloat(entry.amount) || 0) - usedSoFar).toFixed(2)
                        };
                    }
                    const ratio = totalValue > 0 ? ((parseFloat(group.itemsTotal) || 0) / totalValue) : (1 / safeGroups.length);
                    return {
                        brokerId: entry.brokerId,
                        brokerName: entry.brokerName,
                        amount: +((parseFloat(entry.amount) || 0) * ratio).toFixed(2)
                    };
                }).filter(function(alloc) { return alloc.amount > 0; });
            });
        }

        // Audit trail: who/when (uses currentUser from auth.js)
        function getAuditMeta(isNew) {
            const who = (typeof currentUserEmail !== 'undefined' && currentUserEmail) ? currentUserEmail : 'anonymous';
            const when = new Date().toISOString();
            return isNew ? { createdAt: when, createdBy: who } : { updatedAt: when, updatedBy: who };
        }

        // Global data storage
        let appData = {
            company: {},
            items: [],
            suppliers: [],
            customers: [],
            brokers: [],
            coldStorages: [],
            purchases: [],
            sales: [],
            inventory: {},
            brokerage: [],
            deductions: [],
            payments: [],
            adjustments: [],
            openingBalances: [],
            coldStorageLots: [],
            coldStorageCharges: [],
            coldStorageMovements: [],
            coldStorageDamages: []
        };

       // Current invoice items (temporary storage)
let currentPurchaseItems = [];
let currentSaleItems = [];
let linkedPurchases = []; // Store linked purchases for current sale
let tempLinkedPurchases = []; // Temporary storage while modal is open
let deductionLinkedPurchase = null; // Store linked purchase for deduction
let deductionLinkedSale = null; // Store linked sale for deduction

// Pagination State
const paginationState = {
    purchases: { currentPage: 1, pageSize: 10 },
    sales: { currentPage: 1, pageSize: 10 },
    brokerage: { currentPage: 1, pageSize: 10 },
    deductions: { currentPage: 1, pageSize: 10 },
    payments: { currentPage: 1, pageSize: 10 },
    stockMovement: { currentPage: 1, pageSize: 10 },
    coldLots: { currentPage: 1, pageSize: 10 },
    coldMovements: { currentPage: 1, pageSize: 10 },
    coldVendorPayables: { currentPage: 1, pageSize: 10 },
    pnl: { currentPage: 1, pageSize: 10 },
    ledger: { currentPage: 1, pageSize: 10 },
    openingBalance: { currentPage: 1, pageSize: 10 }
};

let activeRowActionMenuKey = '';
let rowActionMenuHandlersInited = false;

function closeRowActionMenus() {
    activeRowActionMenuKey = '';
    document.querySelectorAll('.row-action-more-btn').forEach(function(btn) {
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.row-action-menu').forEach(function(menu) {
        menu.classList.add('hidden');
    });
}

function toggleRowActionMenu(event, menuKey) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const wrap = event && event.currentTarget ? event.currentTarget.closest('.row-action-menu-wrap') : null;
    if (!wrap) return;
    const menu = wrap.querySelector('.row-action-menu');
    const trigger = wrap.querySelector('.row-action-more-btn');
    if (!menu || !trigger) return;

    const shouldOpen = menu.classList.contains('hidden') || activeRowActionMenuKey !== menuKey;
    closeRowActionMenus();
    if (shouldOpen) {
        menu.classList.remove('hidden');
        trigger.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        activeRowActionMenuKey = menuKey;
    }
}

function initRowActionMenuHandlers() {
    if (rowActionMenuHandlersInited) return;
    rowActionMenuHandlersInited = true;

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.row-action-menu-wrap')) {
            closeRowActionMenus();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeRowActionMenus();
        }
    });
}

const ledgerTableSort = { column: 'date', direction: 'desc' };

function ledgerEntryChronoCompare(a, b) {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (ta !== tb) return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
    return String(a.id).localeCompare(String(b.id));
}

function finalizeLedgerEntriesInChronologicalOrder(entries) {
    if (!entries || !entries.length) return;
    entries.sort(ledgerEntryChronoCompare);
    let balance = 0;
    entries.forEach(function(entry, idx) {
        balance += (parseFloat(entry.debit) || 0) - (parseFloat(entry.credit) || 0);
        entry.balance = balance;
        entry._chronoIdx = idx;
    });
}

function applyLedgerTableSort(entries) {
    if (!entries || !entries.length) return;
    const col = ledgerTableSort.column;
    const asc = ledgerTableSort.direction === 'asc';
    entries.sort(function(a, b) {
        let base = 0;
        switch (col) {
            case 'date':
                base = new Date(a.date).getTime() - new Date(b.date).getTime();
                if (base === 0) base = (a._chronoIdx - b._chronoIdx);
                break;
            case 'description':
                base = String(a.description || '').localeCompare(String(b.description || ''));
                break;
            case 'invoice':
                base = String(a.invoice || '').localeCompare(String(b.invoice || ''));
                break;
            case 'debit':
                base = (parseFloat(a.debit) || 0) - (parseFloat(b.debit) || 0);
                if (base === 0) base = (a._chronoIdx - b._chronoIdx);
                break;
            case 'credit':
                base = (parseFloat(a.credit) || 0) - (parseFloat(b.credit) || 0);
                if (base === 0) base = (a._chronoIdx - b._chronoIdx);
                break;
            case 'balance':
                base = (parseFloat(a.balance) || 0) - (parseFloat(b.balance) || 0);
                if (base === 0) base = (a._chronoIdx - b._chronoIdx);
                break;
            default:
                base = new Date(a.date).getTime() - new Date(b.date).getTime();
                if (base === 0) base = (a._chronoIdx - b._chronoIdx);
        }
        if (!asc) base = -base;
        if (base !== 0) return base > 0 ? 1 : -1;
        return a._chronoIdx - b._chronoIdx;
    });
}

function setLedgerSort(column) {
    if (ledgerTableSort.column === column) {
        ledgerTableSort.direction = ledgerTableSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        ledgerTableSort.column = column;
        ledgerTableSort.direction = column === 'date' ? 'desc' : 'asc';
    }
    if (Array.isArray(currentLedgerData) && currentLedgerData.length) {
        applyLedgerTableSort(currentLedgerData);
        paginationState.ledger.currentPage = 1;
        renderLedgerTable(currentLedgerData);
    }
}

function updateLedgerSortIndicators() {
    const keys = ['date', 'description', 'invoice', 'debit', 'credit', 'balance'];
    keys.forEach(function(key) {
        const el = document.getElementById('ledgerSortInd_' + key);
        if (!el) return;
        if (ledgerTableSort.column === key) {
            el.textContent = ledgerTableSort.direction === 'asc' ? '\u25B2' : '\u25BC';
            el.className = 'text-primary font-semibold ml-1';
        } else {
            el.textContent = '';
            el.className = 'ml-1';
        }
    });
}

// Generic Pagination Functions
function renderPagination(containerId, totalItems, currentPage, pageSize, onPageChange, onPageSizeChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    if (totalItems === 0) {
        container.innerHTML = '';
        return;
    }
    
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    
    let paginationHTML = `
        <div class="pagination-info">
            Showing ${startItem} to ${endItem} of ${totalItems} entries
        </div>
        <div class="pagination-controls">
            <div class="page-size-selector">
                <label>Show:</label>
                <select onchange="${onPageSizeChange}(this.value)">
                    <option value="5" ${pageSize === 5 ? 'selected' : ''}>5</option>
                    <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                    <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                </select>
            </div>
            <button class="pagination-btn" onclick="${onPageChange}(1)" ${currentPage === 1 ? 'disabled' : ''}>
                First
            </button>
            <button class="pagination-btn" onclick="${onPageChange}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                Prev
            </button>
            <div class="pagination-numbers">
    `;
    
    // Generate page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-number ${i === currentPage ? 'active' : ''}" onclick="${onPageChange}(${i})">
                ${i}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    
    paginationHTML += `
            </div>
            <button class="pagination-btn" onclick="${onPageChange}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
            <button class="pagination-btn" onclick="${onPageChange}(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                Last
            </button>
        </div>
    `;
    
    container.innerHTML = paginationHTML;
}

// Get paginated data slice
function getPaginatedData(data, currentPage, pageSize) {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
}

// Page change handlers for each section
function changePurchasePage(page) {
    paginationState.purchases.currentPage = page;
    renderPurchaseTable();
}

function changePurchasePageSize(size) {
    paginationState.purchases.pageSize = parseInt(size);
    paginationState.purchases.currentPage = 1;
    renderPurchaseTable();
}

function changeSalesPage(page) {
    paginationState.sales.currentPage = page;
    renderSalesTable();
}

function changeSalesPageSize(size) {
    paginationState.sales.pageSize = parseInt(size);
    paginationState.sales.currentPage = 1;
    renderSalesTable();
}

function changeBrokeragePage(page) {
    paginationState.brokerage.currentPage = page;
    renderBrokerageTable();
}

function changeBrokeragePageSize(size) {
    paginationState.brokerage.pageSize = parseInt(size);
    paginationState.brokerage.currentPage = 1;
    renderBrokerageTable();
}

function changeDeductionsPage(page) {
    paginationState.deductions.currentPage = page;
    renderDeductionsTable();
}

function changeDeductionsPageSize(size) {
    paginationState.deductions.pageSize = parseInt(size);
    paginationState.deductions.currentPage = 1;
    renderDeductionsTable();
}

function changeStockMovementPage(page) {
    paginationState.stockMovement.currentPage = page;
    renderStockMovementTable();
}

function changeStockMovementPageSize(size) {
    paginationState.stockMovement.pageSize = parseInt(size);
    paginationState.stockMovement.currentPage = 1;
    renderStockMovementTable();
}

function changeColdLotsPage(page) {
    paginationState.coldLots.currentPage = page;
    renderColdStorageLotsTable();
}

function changeColdLotsPageSize(size) {
    paginationState.coldLots.pageSize = parseInt(size);
    paginationState.coldLots.currentPage = 1;
    renderColdStorageLotsTable();
}

function changeColdMovementPage(page) {
    paginationState.coldMovements.currentPage = page;
    renderColdStorageMovementsHistory();
}

function changeColdMovementPageSize(size) {
    paginationState.coldMovements.pageSize = parseInt(size);
    paginationState.coldMovements.currentPage = 1;
    renderColdStorageMovementsHistory();
}

function changeColdVendorPayablesPage(page) {
    paginationState.coldVendorPayables.currentPage = page;
    renderColdVendorPayablesSummary();
}

function changeColdVendorPayablesPageSize(size) {
    paginationState.coldVendorPayables.pageSize = parseInt(size);
    paginationState.coldVendorPayables.currentPage = 1;
    renderColdVendorPayablesSummary();
}

function changePnlPage(page) {
    paginationState.pnl.currentPage = page;
    renderPnLWithCurrentData();
}

function changePnlPageSize(size) {
    paginationState.pnl.pageSize = parseInt(size);
    paginationState.pnl.currentPage = 1;
    renderPnLWithCurrentData();
}

function changeLedgerPage(page) {
    paginationState.ledger.currentPage = page;
    renderLedgerWithCurrentData();
}

function changeLedgerPageSize(size) {
    paginationState.ledger.pageSize = parseInt(size);
    paginationState.ledger.currentPage = 1;
    renderLedgerWithCurrentData();
}

function changeOpeningBalancePage(page) {
    paginationState.openingBalance.currentPage = page;
    updateOpeningBalanceHistory();
}

function changeOpeningBalancePageSize(size) {
    paginationState.openingBalance.pageSize = parseInt(size);
    paginationState.openingBalance.currentPage = 1;
    updateOpeningBalanceHistory();
}

function changePaymentsPage(page) {
    paginationState.payments.currentPage = page;
    loadPaymentsTracking();
}

function changePaymentsPageSize(size) {
    paginationState.payments.pageSize = parseInt(size);
    paginationState.payments.currentPage = 1;
    loadPaymentsTracking();
}

function onPaymentsFilterChange() {
    paginationState.payments.currentPage = 1;
    loadPaymentsTracking();
}

// Store current data for P&L and Ledger for pagination
let currentPnLData = [];
let currentPnLPurchaseSummary = [];
let currentLedgerData = [];

function renderPnLWithCurrentData() {
    renderPnLTable(currentPnLData);
    renderPnLPurchaseSummary(currentPnLPurchaseSummary);
}

function switchPnLTab(tabName) {
    var detailedPanel = document.getElementById('pnlDetailedPanel');
    var summaryPanel = document.getElementById('pnlSummaryPanel');
    var detailedTab = document.getElementById('pnlTabDetailed');
    var summaryTab = document.getElementById('pnlTabSummary');
    if (!detailedPanel || !summaryPanel || !detailedTab || !summaryTab) return;

    if (tabName === 'summary') {
        detailedPanel.classList.add('hidden');
        summaryPanel.classList.remove('hidden');
        detailedTab.classList.remove('bg-primary', 'text-white');
        detailedTab.classList.add('bg-slate-100', 'text-slate-700');
        summaryTab.classList.remove('bg-slate-100', 'text-slate-700');
        summaryTab.classList.add('bg-primary', 'text-white');
    } else {
        summaryPanel.classList.add('hidden');
        detailedPanel.classList.remove('hidden');
        summaryTab.classList.remove('bg-primary', 'text-white');
        summaryTab.classList.add('bg-slate-100', 'text-slate-700');
        detailedTab.classList.remove('bg-slate-100', 'text-slate-700');
        detailedTab.classList.add('bg-primary', 'text-white');
    }
}

function renderLedgerWithCurrentData() {
    renderLedgerTable(currentLedgerData);
}

function rebuildInventoryFromTransactions() {
    const rebuilt = {};
    (appData.purchases || []).forEach(function(purchase) {
        (purchase.items || []).forEach(function(item) {
            const itemId = item.itemId;
            if (itemId == null) return;
            const qty = parseFloat(item.grossWeight ?? item.quantity ?? 0) || 0;
            const baseCost = parseFloat(item.total ?? 0) || 0;
            const coldStorageCost = parseFloat(item.coldStorageCost ?? 0) || 0;
            const val = baseCost + coldStorageCost;
            if (!rebuilt[itemId]) rebuilt[itemId] = { quantity: 0, totalCost: 0 };
            rebuilt[itemId].quantity += qty;
            rebuilt[itemId].totalCost += val;
        });
    });

    (appData.sales || []).forEach(function(sale) {
        (sale.items || []).forEach(function(item) {
            const itemId = item.itemId;
            if (itemId == null) return;
            const qty = parseFloat(item.grossWeight ?? item.quantity ?? 0) || 0;
            if (!rebuilt[itemId]) rebuilt[itemId] = { quantity: 0, totalCost: 0 };
            rebuilt[itemId].quantity -= qty;
            const totalQtyBeforeDeduct = rebuilt[itemId].quantity + qty;
            const avgCost = totalQtyBeforeDeduct > 0 ? (rebuilt[itemId].totalCost / totalQtyBeforeDeduct) : 0;
            rebuilt[itemId].totalCost -= (avgCost * qty);
        });
    });

    // Adjust normal inventory by active cold-storage lots so moved stock
    // does not appear in general inventory cards after reload/recalculate.
    (appData.coldStorageLots || []).forEach(function(lot) {
        const itemId = lot && lot.itemId;
        if (itemId == null || !rebuilt[itemId]) return;
        const activeQty = Math.max(0, parseFloat(lot.qtyInCold) || 0);
        if (activeQty <= 0) return;
        const releasedQty = Math.max(0, parseFloat(lot.releaseQtyTotal) || 0);
        const shrinkageQty = Math.max(0, parseFloat(lot.shrinkageQtyTotal) || 0);
        const lotTotalQty = activeQty + releasedQty + shrinkageQty;
        const lotSourceCost = Math.max(0, parseFloat(lot.sourceInventoryCost) || 0);
        const activeSourceCost = lotTotalQty > 0 ? (lotSourceCost * (activeQty / lotTotalQty)) : 0;
        rebuilt[itemId].quantity -= activeQty;
        rebuilt[itemId].totalCost -= activeSourceCost;
    });

    // Cleanup tiny floating dust / invalid negatives from historic data.
    Object.keys(rebuilt).forEach(function(itemId) {
        const q = rebuilt[itemId].quantity || 0;
        const c = rebuilt[itemId].totalCost || 0;
        if (Math.abs(q) < 0.0001) rebuilt[itemId].quantity = 0;
        if (Math.abs(c) < 0.0001) rebuilt[itemId].totalCost = 0;
        if (rebuilt[itemId].quantity <= 0 && rebuilt[itemId].totalCost <= 0) {
            delete rebuilt[itemId];
        }
    });

    appData.inventory = rebuilt;
}

// Load data from Firestore on page load
function loadData() {
    console.log("ðŸ“¡ Loading data from Firestore...");
    
    SHARED_DOC_REF.onSnapshot((doc) => {
        if (doc && doc.exists) {
            const savedData = doc.data().data;
            if (savedData) {
                suppressNextLocalSave = true;

                console.log("ðŸ“¥ Data received from Firestore");
                console.log("   - openingBalances in Firebase:", savedData.openingBalances);
                
                appData = savedData;
                // Ensure arrays and settings exist (older Firestore docs may lack these keys)
                appData.payments = appData.payments || [];
                appData.openingBalances = appData.openingBalances || [];
                appData.coldStorageLots = appData.coldStorageLots || [];
                appData.coldStorageCharges = appData.coldStorageCharges || [];
                appData.coldStorageMovements = appData.coldStorageMovements || [];
                appData.coldStorageDamages = appData.coldStorageDamages || [];
                appData.coldStorages = appData.coldStorages || [];
                appData.settings = appData.settings || {};
                normalizeColdStorageLotFields();
                appData.coldStorages = appData.coldStorages.map(function(cs, idx) {
                    const safe = cs || {};
                    return {
                        id: safe.id != null ? safe.id : (Date.now() + idx),
                        name: String(safe.name || '').trim(),
                        vendorName: String(safe.vendorName || '').trim(),
                        details: String(safe.details || '').trim(),
                        active: safe.active !== false
                    };
                }).filter(function(cs) { return !!cs.name; });
                normalizeColdStorageReferences();
                const purchaseColdBackfillChanged = syncPurchaseAutoColdLotsForPurchaseIds(null, { skipCleanup: true });
                rebuildInventoryFromTransactions();

                // Refresh ALL UI sections now that data is loaded
                updateDashboard();
                populateDropdowns();
                updateItemsList();
                updateSuppliersList();
                updateCustomersList();
                updateBrokersList();
                updateColdStoragesList();
                updatePurchaseHistory();
                updateSalesHistory();
                updateBrokerageHistory();
                updateDeductionsHistory();
                loadCompanyDetails(); // Load company details into form fields

                console.log("âœ… Data loaded from Firestore and UI updated");
                console.log("   - appData.openingBalances in memory:", appData.openingBalances);
                
                // Update records count in header
                if (typeof updateRecordsCount === 'function') {
                    updateRecordsCount();
                }

                setTimeout(() => { suppressNextLocalSave = false; }, 200);
                if (purchaseColdBackfillChanged) {
                    setTimeout(function() {
                        if (!suppressNextLocalSave) saveData();
                    }, 450);
                }
            }
        } else {
            console.log("â„¹ï¸ No online data yet. Using defaults.");
        }
    }, (err) => {
        console.error("âŒ Firestore onSnapshot error:", err);
    });
}

   // Save data to Firestore
function saveData() {
    if (suppressNextLocalSave) {
        console.log("â›” Save suppressed (change came from Firestore).");
        return;
    }

    console.log("ðŸ’¾ Saving to Firebase...");
    var _p = JSON.stringify(appData);
    if (_p.length > 900000) console.warn("App data large (" + (_p.length/1024).toFixed(0) + " KB). Consider archiving old records.");
    SHARED_DOC_REF.set({
        data: appData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        console.log("âœ… Data saved to Firestore successfully");
        console.log("   - Saved openingBalances:", appData.openingBalances);
    }).catch((error) => {
        console.error("âŒ Error saving to Firestore:", error);
        alert("Failed to save data! Error: " + error.message);
    });
}
function manualSave() {
  const btn = document.querySelector('.btn-save');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="inline-flex items-center gap-2"><svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving...</span>'; }
  SHARED_DOC_REF.set({
      data: appData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
      console.log("Data saved to Firestore (manual save)");

      // Show message
      const msg = document.getElementById("save-message");
      msg.classList.remove("hidden");
      setTimeout(function(){ if(msg) msg.classList.add("hidden"); }, 3000);
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  }).catch((error) => {
      console.error("âŒ Error saving to Firestore:", error);
      alert("Error saving data!");
      if (btn) { btn.disabled = false; btn.innerHTML = originalText; }
  });
}

function saveAsJSON() {
    try {
        // Create JSON backup of all app data
        const jsonData = JSON.stringify(appData, null, 2);
        
        // Create a blob with the JSON data
        const blob = new Blob([jsonData], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with current date and time
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
        a.download = `ITCO_Backup_${dateStr}_${timeStr}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log("âœ… JSON backup downloaded successfully");
    } catch (error) {
        console.error("âŒ Error creating JSON backup:", error);
        alert("Error creating backup file!");
    }
}

function restoreFromJSON() {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Confirm before restoring
        if (!confirm('âš ï¸ WARNING: This will replace all current data with the backup data. Are you sure you want to continue?')) {
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                
                // Validate the data structure
                if (!jsonData || typeof jsonData !== 'object') {
                    throw new Error('Invalid backup file format');
                }
                
                // Restore the data
                appData = jsonData;
                
                // Ensure all required properties exist
                appData.items = appData.items || [];
                appData.suppliers = appData.suppliers || [];
                appData.customers = appData.customers || [];
                appData.brokers = appData.brokers || [];
                appData.coldStorages = appData.coldStorages || [];
                appData.purchases = appData.purchases || [];
                appData.sales = appData.sales || [];
                appData.brokerages = appData.brokerages || [];
                appData.deductions = appData.deductions || [];
                appData.adjustments = appData.adjustments || [];
                appData.payments = appData.payments || [];
                appData.settings = appData.settings || {};
                appData.inventory = appData.inventory || {};
                normalizeColdStorageLotFields();
                rebuildInventoryFromTransactions();
                (appData.items || []).forEach(function(i){ if (i.active === undefined) i.active = true; });
                (appData.suppliers || []).forEach(function(s){ if (s.active === undefined) s.active = true; });
                (appData.customers || []).forEach(function(c){ if (c.active === undefined) c.active = true; });
                (appData.brokers || []).forEach(function(b){ if (b.active === undefined) b.active = true; });
                (appData.coldStorages || []).forEach(function(cs){ if (cs.active === undefined) cs.active = true; });
                appData.coldStorages = (appData.coldStorages || []).map(function(cs, idx) {
                    const safe = cs || {};
                    return {
                        id: safe.id != null ? safe.id : (Date.now() + idx),
                        name: String(safe.name || '').trim(),
                        vendorName: String(safe.vendorName || '').trim(),
                        details: String(safe.details || '').trim(),
                        active: safe.active !== false
                    };
                }).filter(function(cs) { return !!cs.name; });
                normalizeColdStorageReferences();
                // Save to Firebase
                saveData();
                
                // Refresh all displays
                updateItemsList();
                updateSuppliersList();
                updateCustomersList();
                updateBrokersList();
                updateColdStoragesList();
                updatePurchaseHistory();
                updateSalesHistory();
                updateBrokerageHistory();
                updateDeductionsHistory();
                updateDashboard();
                refreshInventory();
                
                alert('âœ… Data restored successfully from backup!');
                console.log("âœ… Data restored from JSON backup");
                
            } catch (error) {
                console.error("âŒ Error restoring backup:", error);
                alert('Error restoring backup file! Please make sure you selected a valid backup file.');
            }
        };
        
        reader.onerror = function() {
            alert('Error reading backup file!');
        };
        
        reader.readAsText(file);
    };
    
    // Trigger file selection
    input.click();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut().then(() => {
            console.log("âœ… User logged out successfully");
            // Redirect to login page or reload
            window.location.reload();
        }).catch((error) => {
            console.error("âŒ Error logging out:", error);
            alert("Error logging out!");
        });
    }
}

// Delete All (password protected) - Records vs Masters, similar to Transportation app
var deleteAllPendingAction = null;
function getDeleteAllPassword() {
    appData.settings = appData.settings || {};
    return (appData.settings.deleteAllPassword && String(appData.settings.deleteAllPassword).trim()) ? String(appData.settings.deleteAllPassword).trim() : 'NFc@@1993jc';
}
function openDeleteAllModal(action) {
    deleteAllPendingAction = action;
    var titleEl = document.getElementById('deleteAllModalTitle');
    var msgEl = document.getElementById('deleteAllModalMessage');
    var pwdEl = document.getElementById('deleteAllPassword');
    if (action === 'records') {
        if (titleEl) titleEl.textContent = 'Delete All Records';
        if (msgEl) msgEl.textContent = 'This will permanently delete all transactions: Purchases, Sales, Brokerage, Deductions, Payments, Adjustments, Opening Balances, and Inventory. This cannot be undone. Enter password to confirm.';
    } else {
        if (titleEl) titleEl.textContent = 'Delete All Masters';
        if (msgEl) msgEl.textContent = 'This will permanently delete all master data: Items, Suppliers, Customers, Brokers, Cold Storages, and Company details. Records (transactions) will remain. This cannot be undone. Enter password to confirm.';
    }
    if (pwdEl) { pwdEl.value = ''; pwdEl.focus(); }
    var modal = document.getElementById('deleteAllModal');
    if (modal) modal.classList.remove('hidden');
}
function closeDeleteAllModal() {
    deleteAllPendingAction = null;
    var pwdEl = document.getElementById('deleteAllPassword');
    if (pwdEl) pwdEl.value = '';
    var modal = document.getElementById('deleteAllModal');
    if (modal) modal.classList.add('hidden');
}
function confirmDeleteAll() {
    var pwdEl = document.getElementById('deleteAllPassword');
    var entered = (pwdEl && pwdEl.value) ? String(pwdEl.value).trim() : '';
    var expected = getDeleteAllPassword();
    if (entered !== expected) {
        alert('Incorrect password. Delete cancelled.');
        return;
    }
    if (deleteAllPendingAction === 'records') {
        deleteAllRecords();
    } else if (deleteAllPendingAction === 'masters') {
        deleteAllMasters();
    }
    closeDeleteAllModal();
}
function deleteAllRecords() {
    appData.purchases = [];
    appData.sales = [];
    appData.brokerage = [];
    appData.deductions = [];
    appData.payments = [];
    appData.adjustments = [];
    appData.openingBalances = [];
    appData.inventory = {};
    saveData();
    updateDashboard();
    populateDropdowns();
    updatePurchaseHistory();
    updateSalesHistory();
    updateBrokerageHistory();
    updateDeductionsHistory();
    refreshInventory();
    if (typeof loadPaymentsTracking === 'function') loadPaymentsTracking();
    if (typeof updateOpeningBalanceHistory === 'function') updateOpeningBalanceHistory();
    if (typeof updateRecordsCount === 'function') updateRecordsCount();
    alert('All records have been deleted.');
}
function deleteAllMasters() {
    appData.items = [];
    appData.suppliers = [];
    appData.customers = [];
    appData.brokers = [];
    appData.coldStorages = [];
    appData.company = {};
    saveData();
    populateDropdowns();
    updateItemsList();
    updateSuppliersList();
    updateCustomersList();
    updateBrokersList();
    updateColdStoragesList();
    loadCompanyDetails();
    updateDashboard();
    if (typeof updateRecordsCount === 'function') updateRecordsCount();
    alert('All masters have been deleted. Records (transactions) are unchanged.');
}

        // Navigation
        // Close view modal
        function closeViewModal() {
            document.getElementById('viewModal').classList.add('hidden');
        }

        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.add('hidden');
            });
            
            // Remove active class from all nav items in sidebar
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Remove active class from header icon buttons
            document.querySelectorAll('.header-icon-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.remove('hidden');
            }
            
            // Add active class to clicked nav item (sidebar)
            const activeBtn = document.querySelector(`.nav-item[data-page="${pageId}"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
            
            // Add active class to header icon button if applicable
            const activeHeaderBtn = document.querySelector(`.header-icon-btn[data-page="${pageId}"]`);
            if (activeHeaderBtn) {
                activeHeaderBtn.classList.add('active');
            }
            
            // Update header title
            const titleEl = document.getElementById('pageTitle');
            if (titleEl && pageTitles[pageId]) {
                titleEl.textContent = pageTitles[pageId];
            }
            
            // Close sidebar on mobile after navigation
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth < 1024) {
                sidebar.classList.remove('open');
            }
            
            // Update page-specific content
            if (pageId === 'inventory') {
                refreshInventory();
                if (typeof switchInventoryTab === 'function') switchInventoryTab('general');
            } else if (pageId === 'purchase') {
                populateDropdowns();
                // Show history view by default
                hidePurchaseForm();
            } else if (pageId === 'sales') {
                populateDropdowns();
                // Show history view by default
                hideSalesForm();
            } else if (pageId === 'payments') {
                loadPaymentsTracking();
            } else if (pageId === 'opening') {
                populateOpeningBalanceDropdowns();
                updateOpeningBalanceHistory();
            } else if (pageId === 'reports') {
                if (typeof setDefaultReportDates === 'function') setDefaultReportDates();
            } else if (pageId === 'ledger') {
                if (typeof updateLedgerOptions === 'function') updateLedgerOptions();
                if (typeof initLedgerEntitySearch === 'function') initLedgerEntitySearch();
                if (typeof syncLedgerEntityDisplay === 'function') syncLedgerEntityDisplay();
                if (typeof renderLedgerSummaryCards === 'function') renderLedgerSummaryCards();
            }
            
            // Update records count
            if (typeof updateRecordsCount === 'function') {
                updateRecordsCount();
            }
        }

        // Purchase Form Show/Hide Functions
        // Auto Invoice Number Generation with Financial Year
        function getFinancialYear() {
            const today = new Date();
            const month = today.getMonth(); // 0-11 (Jan=0, Apr=3)
            const year = today.getFullYear();
            // Financial year runs April to March
            // If current month is Jan, Feb, Mar (0,1,2), FY is previous year
            // If current month is Apr-Dec (3-11), FY is current year
            if (month < 3) { // Jan, Feb, Mar
                return year - 1;
            } else { // Apr to Dec
                return year;
            }
        }
        
        function generatePurchaseInvoiceNumber() {
            const fy = getFinancialYear();
            const prefix = `PUR-${fy}-`;
            const maxExistingNumber = appData.purchases
                .map(p => p.invoice)
                .filter(inv => inv && inv.startsWith(prefix))
                .map(inv => parseInt(inv.replace(prefix, ''), 10) || 0)
                .filter(n => n >= 1)
                .reduce((max, n) => Math.max(max, n), 0);
            const nextNumber = maxExistingNumber + 1;
            return prefix + String(nextNumber).padStart(3, '0');
        }

        function generateNextPurchaseInvoiceNumber(reservedInvoices) {
            const fy = getFinancialYear();
            const prefix = `PUR-${fy}-`;
            const existingNumbers = new Set(appData.purchases
                .map(p => p.invoice)
                .filter(inv => inv && inv.startsWith(prefix))
                .map(inv => parseInt(inv.replace(prefix, ''), 10) || 0)
                .filter(n => n >= 1));
            (reservedInvoices || new Set()).forEach(inv => {
                if (inv && inv.startsWith(prefix)) {
                    const n = parseInt(inv.replace(prefix, ''), 10) || 0;
                    if (n >= 1) existingNumbers.add(n);
                }
            });
            let nextNumber = 1;
            while (existingNumbers.has(nextNumber)) nextNumber++;
            return prefix + String(nextNumber).padStart(3, '0');
        }
        
        function generateSaleInvoiceNumber() {
            const fy = getFinancialYear();
            const prefix = `SALE-${fy}-`;
            const maxExistingNumber = appData.sales
                .map(s => s.invoice)
                .filter(inv => inv && inv.startsWith(prefix))
                .map(inv => parseInt(inv.replace(prefix, ''), 10) || 0)
                .filter(n => n >= 1)
                .reduce((max, n) => Math.max(max, n), 0);
            const nextNumber = maxExistingNumber + 1;
            return prefix + String(nextNumber).padStart(3, '0');
        }
        
        function showPurchaseForm() {
            document.getElementById('purchaseHistoryView').classList.add('hidden');
            document.getElementById('purchaseEntryView').classList.remove('hidden');
            document.getElementById('addPurchaseBtn').classList.add('hidden');
            // Auto-generate only for NEW entry, never while editing.
            if (editingPurchaseId === null) {
                document.getElementById('purchaseInvoice').value = generatePurchaseInvoiceNumber();
            }
            onPurchaseChargeModeChange();
            if (typeof switchPurchaseItemTab === 'function') switchPurchaseItemTab('basic');
        }

        function hidePurchaseForm() {
            document.getElementById('purchaseHistoryView').classList.remove('hidden');
            document.getElementById('purchaseEntryView').classList.add('hidden');
            document.getElementById('addPurchaseBtn').classList.remove('hidden');
            clearPurchaseForm();
        }

        // Sales Form Show/Hide Functions
        function showSalesForm() {
            document.getElementById('salesHistoryView').classList.add('hidden');
            document.getElementById('salesEntryView').classList.remove('hidden');
            document.getElementById('addSalesBtn').classList.add('hidden');
            // Auto-generate only for NEW entry, never while editing.
            if (editingSaleId === null) {
                // Always start a fresh linking state for a new sale.
                linkedPurchases = [];
                tempLinkedPurchases = [];
                updateLinkedPurchasesDisplay();
                document.getElementById('saleInvoice').value = generateSaleInvoiceNumber();
            }
        }

        function hideSalesForm() {
            document.getElementById('salesHistoryView').classList.remove('hidden');
            document.getElementById('salesEntryView').classList.add('hidden');
            document.getElementById('addSalesBtn').classList.remove('hidden');
            clearSaleForm();
        }

        // Master Data Functions
        function saveCompanyDetails() {
            appData.company = {
                name: document.getElementById('companyName').value,
                address: (document.getElementById('companyAddress') && document.getElementById('companyAddress').value) ? document.getElementById('companyAddress').value.trim() : '',
                gstin: (document.getElementById('companyGSTIN') && document.getElementById('companyGSTIN').value) || '',
                bank1: {
                    name: document.getElementById('bankName1').value,
                    account: document.getElementById('bankAccount1').value,
                    ifsc: document.getElementById('ifsc1').value
                },
                bank2: {
                    name: document.getElementById('bankName2').value,
                    account: document.getElementById('bankAccount2').value,
                    ifsc: document.getElementById('ifsc2').value
                },
                bank3: {
                    name: (document.getElementById('bankName3') && document.getElementById('bankName3').value) || '',
                    account: (document.getElementById('bankAccount3') && document.getElementById('bankAccount3').value) || '',
                    ifsc: (document.getElementById('ifsc3') && document.getElementById('ifsc3').value) || ''
                },
                upi: document.getElementById('upiNumber').value
            };
            saveData();
            if (typeof populatePaymentBankAccounts === 'function') populatePaymentBankAccounts();
            alert('Company details saved successfully!');
        }

        function loadCompanyDetails() {
            if (appData.company) {
                document.getElementById('companyName').value = appData.company.name || '';
                var addrEl = document.getElementById('companyAddress');
                if (addrEl) addrEl.value = appData.company.address || '';
                var gstinEl = document.getElementById('companyGSTIN');
                if (gstinEl) gstinEl.value = appData.company.gstin || '';
                document.getElementById('bankName1').value = appData.company.bank1?.name || '';
                document.getElementById('bankAccount1').value = appData.company.bank1?.account || '';
                document.getElementById('ifsc1').value = appData.company.bank1?.ifsc || '';
                document.getElementById('bankName2').value = appData.company.bank2?.name || '';
                document.getElementById('bankAccount2').value = appData.company.bank2?.account || '';
                document.getElementById('ifsc2').value = appData.company.bank2?.ifsc || '';
                var b3Name = document.getElementById('bankName3');
                var b3Acc = document.getElementById('bankAccount3');
                var b3Ifsc = document.getElementById('ifsc3');
                if (b3Name) b3Name.value = appData.company.bank3?.name || '';
                if (b3Acc) b3Acc.value = appData.company.bank3?.account || '';
                if (b3Ifsc) b3Ifsc.value = appData.company.bank3?.ifsc || '';
                document.getElementById('upiNumber').value = appData.company.upi || '';
            }
        }

        function getCompanyBankAccounts() {
            const company = appData.company || {};
            const result = [];
            ['bank1', 'bank2', 'bank3'].forEach((key, idx) => {
                const bank = company[key] || {};
                const name = (bank.name || '').trim();
                const account = (bank.account || '').trim();
                if (!name && !account) return;
                result.push({
                    id: key,
                    label: `${name || `Bank ${idx + 1}`}${account ? ` - ${account}` : ''}`,
                    name: name || `Bank ${idx + 1}`,
                    account: account
                });
            });
            return result;
        }

        let editingItemId = null;
        let editingSupplierId = null;
        let editingCustomerId = null;
        let editingBrokerId = null;
        let editingColdStorageId = null;

        function addItem() {
            const name = document.getElementById('itemName').value;
            const category = document.getElementById('itemCategory').value;
            const unit = document.getElementById('itemUnit').value;
            var minStockEl = document.getElementById('itemMinStock');
            const minStock = (minStockEl && parseFloat(minStockEl.value)) || 0;
            if (name && category && unit) {
                if (editingItemId) {
                    const item = appData.items.find(i => i.id === editingItemId);
                    if (item) {
                        item.name = name;
                        item.category = category;
                        item.unit = unit;
                        item.minStock = minStock;
                    }
                    editingItemId = null;
                } else {
                    const item = {
                        id: Date.now(),
                        name: name,
                        category: category,
                        unit: unit,
                        minStock: minStock,
                        active: true
                    };
                    appData.items.push(item);
                }
                saveData();
                updateItemsList();
                populateDropdowns();
                
                if (minStockEl) minStockEl.value = '';
                document.getElementById('itemName').value = '';
                document.getElementById('itemCategory').value = '';
                document.getElementById('itemUnit').value = '';
            }
        }

        function getMasterSearchTerm(inputId) {
            var el = document.getElementById(inputId);
            return (el && el.value) ? el.value.trim().toLowerCase() : '';
        }
        function updateItemsList() {
            const container = document.getElementById('itemsList');
            if (!container) return;
            var term = getMasterSearchTerm('masterSearchItems');
            container.innerHTML = '';
            var items = (appData.items || []).filter(function(item) {
                if (!term) return true;
                var name = (item.name || '').toLowerCase();
                var cat = (item.category || '').toLowerCase();
                var unit = (item.unit || '').toLowerCase();
                return name.indexOf(term) >= 0 || cat.indexOf(term) >= 0 || unit.indexOf(term) >= 0;
            });
            items.forEach(function(item) {
                var minStr = (item.minStock != null && item.minStock > 0) ? ' Min: ' + item.minStock : '';
                var active = item.active !== false;
                var div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
                div.innerHTML = '<span>' + (active ? '' : '<span class="text-slate-400 line-through">') + item.name + ' (' + item.category + ') - ' + item.unit + minStr + (active ? '' : '</span>') + '</span>' +
                    '<div class="space-x-2">' +
                    '<button onclick="editItem(' + item.id + ')" class="text-blue-500 hover:text-blue-700">Edit</button>' +
                    (active ? '<button onclick="setItemActive(' + item.id + ', false)" class="text-amber-600 hover:text-amber-800">Deactivate</button>' : '<button onclick="setItemActive(' + item.id + ', true)" class="text-green-600 hover:text-green-800">Activate</button>') +
                    '<button onclick="removeItem(' + item.id + ')" class="text-red-500 hover:text-red-700">\u00D7</button>' +
                    '</div>';
                container.appendChild(div);
            });
        }
        function applyMasterSearch() {
            updateItemsList();
            updateSuppliersList();
            updateCustomersList();
            updateBrokersList();
            updateColdStoragesList();
        }

        function setItemActive(id, active) {
            var item = appData.items.find(function(i) { return i.id === id; });
            if (item) { item.active = active; saveData(); updateItemsList(); populateDropdowns(); }
        }

        function editItem(id) {
            var item = appData.items.find(function(i) { return i.id === id; });
            if (item) {
                editingItemId = id;
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemCategory').value = item.category;
                document.getElementById('itemUnit').value = item.unit;
                var minStockEl = document.getElementById('itemMinStock');
                if (minStockEl) minStockEl.value = (item.minStock != null && item.minStock > 0) ? item.minStock : '';
            }
        }

        function removeItem(id) {
            appData.items = appData.items.filter(item => item.id !== id);
            saveData();
            updateItemsList();
            populateDropdowns();
        }

        function normalizedName(str) { return (String(str || '').trim().toLowerCase()); }
        function isDuplicateSupplierName(name, excludeId) {
            var n = normalizedName(name);
            return (appData.suppliers || []).some(function(s) { return (s.id !== excludeId) && normalizedName(s.name) === n; });
        }
        function isDuplicateCustomerName(name, excludeId) {
            var n = normalizedName(name);
            return (appData.customers || []).some(function(c) { return (c.id !== excludeId) && normalizedName(c.name) === n; });
        }
        function isDuplicateBrokerName(name, excludeId) {
            var n = normalizedName(name);
            return (appData.brokers || []).some(function(b) { return (b.id !== excludeId) && normalizedName(b.name) === n; });
        }
        function isDuplicateColdStorageName(name, excludeId) {
            var n = normalizedName(name);
            return (appData.coldStorages || []).some(function(cs) { return (cs.id !== excludeId) && normalizedName(cs.name) === n; });
        }
        function normalizeMobileForWhatsApp(rawMobile) {
            var digits = String(rawMobile || '').replace(/\D/g, '');
            if (!digits) return '';
            if (digits.length === 10) return '91' + digits;
            if (digits.length === 12 && digits.indexOf('91') === 0) return digits;
            return digits;
        }
        function formatDateForMessage(dateStr) {
            if (!dateStr) return '-';
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB');
            }
            return dateStr;
        }
        function openWhatsAppChat(rawMobile, message) {
            var mobile = normalizeMobileForWhatsApp(rawMobile);
            if (!mobile || mobile.length < 10) return false;
            var text = encodeURIComponent(String(message || '').trim());
            window.open('https://wa.me/' + mobile + '?text=' + text, '_blank');
            return true;
        }
        function createRenderableHtmlWrapper(htmlContent) {
            var parser = new DOMParser();
            var parsedDoc = parser.parseFromString(String(htmlContent || ''), 'text/html');
            var styleText = Array.from(parsedDoc.querySelectorAll('style')).map(function(s) { return s.textContent || ''; }).join('\n');
            var bodyHtml = (parsedDoc.body && parsedDoc.body.innerHTML) ? parsedDoc.body.innerHTML : String(htmlContent || '');

            var wrapper = document.createElement('div');
            wrapper.style.position = 'fixed';
            wrapper.style.left = '0';
            wrapper.style.top = '0';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.zIndex = '2147483647';
            wrapper.style.width = '794px';
            wrapper.style.background = '#ffffff';
            wrapper.style.overflow = 'visible';
            wrapper.innerHTML = '<style>' + styleText + '</style>' + bodyHtml;
            document.body.appendChild(wrapper);
            return wrapper;
        }

        function downloadStyledAttachmentFromHtml(htmlContent, fileBaseName, format) {
            var ext = String(format || 'pdf').toLowerCase();
            var cleanBase = String(fileBaseName || ('invoice-' + Date.now())).replace(/\.(pdf|jpg|jpeg)$/i, '');
            var wrapper = createRenderableHtmlWrapper(htmlContent);
            var pause = new Promise(function(resolve) { setTimeout(resolve, 100); });

            if (ext === 'jpg' || ext === 'jpeg') {
                if (typeof window.html2canvas === 'undefined') {
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                    alert('Image engine not loaded. Please refresh and try again.');
                    return Promise.resolve(false);
                }
                return pause.then(function() {
                    return window.html2canvas(wrapper, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        windowWidth: wrapper.scrollWidth,
                        windowHeight: wrapper.scrollHeight
                    }).then(function(canvas) {
                        var imageExt = (ext === 'jpeg') ? 'jpeg' : 'jpg';
                        var mime = imageExt === 'jpeg' ? 'image/jpeg' : 'image/jpeg';
                        var quality = 0.95;
                        var link = document.createElement('a');
                        link.href = canvas.toDataURL(mime, quality);
                        link.download = cleanBase + '.' + imageExt;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                        return true;
                    }).catch(function(err) {
                        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                        console.error('Image generation failed:', err);
                        alert('Failed to generate image. Please try again.');
                        return false;
                    });
                });
            }

            if (typeof window.html2pdf === 'undefined') {
                if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                alert('PDF engine not loaded. Please refresh and try again.');
                return Promise.resolve(false);
            }
            return pause.then(function() {
                return window.html2pdf().set({
                    margin: [0, 0, 0, 0],
                    filename: cleanBase + '.pdf',
                    pagebreak: { mode: ['css', 'legacy'] },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).from(wrapper).save().then(function() {
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                    return true;
                }).catch(function(err) {
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                    console.error('PDF generation failed:', err);
                    alert('Failed to generate PDF. Please try again.');
                    return false;
                });
            });
        }

        function chooseWhatsAppAttachmentFormat() {
            var useJpg = confirm('For WhatsApp attachment: Click OK for JPG image, Cancel for PDF.');
            return useJpg ? 'jpg' : 'pdf';
        }
        function downloadPurchaseInvoicePdf(purchase, format) {
            if (!purchase) return Promise.resolve(false);
            var fileBase = 'purchase-invoice-' + String(purchase.invoice || purchase.id || Date.now()).replace(/[^\w-]/g, '_');
            return downloadStyledAttachmentFromHtml(buildPurchaseInvoiceHtml(purchase), fileBase, format || 'pdf');
        }
        function downloadSaleInvoicePdf(sale, format) {
            if (!sale) return Promise.resolve(false);
            var fileBase = 'sales-invoice-' + String(sale.invoice || sale.id || Date.now()).replace(/[^\w-]/g, '_');
            return downloadStyledAttachmentFromHtml(buildSaleInvoiceHtml(sale), fileBase, format || 'pdf');
        }
        function downloadLedgerPdf(format) {
            var entries = (typeof currentLedgerData !== 'undefined' && Array.isArray(currentLedgerData)) ? currentLedgerData : [];
            var meta = window.currentLedgerData || {};
            if (!meta.type || !meta.entityId || !entries.length) {
                alert('Please generate ledger first.');
                return Promise.resolve(false);
            }
            var fileBase = 'ledger-' + String(meta.entityName || meta.entityId || Date.now()).replace(/[^\w-]/g, '_');
            return downloadStyledAttachmentFromHtml(buildLedgerStatementHtml(entries, meta), fileBase, format || 'pdf');
        }
        function buildLedgerSnapshotForEntity(entityType, entityId) {
            var entries = [];
            var entityName = '';
            var type = String(entityType || '');
            var idStr = String(entityId || '');

            if (type === 'supplier') {
                var supplier = (appData.suppliers || []).find(function(s) { return String(s.id) === idStr; });
                entityName = supplier ? supplier.name : 'Unknown Supplier';

                (appData.openingBalances || [])
                    .filter(function(ob) { return ob.entityType === 'supplier' && String(ob.entityId) === idStr; })
                    .forEach(function(opening) {
                        entries.push({
                            date: opening.date,
                            description: 'Opening Balance - ' + (opening.description || 'Old Purchases Pending'),
                            invoice: opening.reference || 'Opening',
                            debit: parseFloat(opening.amount) || 0,
                            credit: 0
                        });
                    });

                (appData.purchases || [])
                    .filter(function(p) { return String(p.supplierId) === idStr; })
                    .forEach(function(purchase) {
                        entries.push({
                            date: purchase.date,
                            description: 'Purchase - ' + (purchase.itemName || 'Multiple Items'),
                            invoice: purchase.invoice || '',
                            debit: parseFloat(purchase.grandTotal || purchase.total) || 0,
                            credit: 0
                        });
                    });

                (appData.adjustments || [])
                    .filter(function(adj) { return adj.type === 'supplier_adjustment' && String(adj.entityId) === idStr; })
                    .forEach(function(adjustment) {
                        entries.push({
                            date: adjustment.date,
                            description: 'Adjustment - ' + (adjustment.reference || ''),
                            invoice: '',
                            debit: 0,
                            credit: parseFloat(adjustment.amount) || 0
                        });
                    });

                (appData.payments || [])
                    .filter(function(p) {
                        var purchaseMatch = p.type === 'purchase' && (appData.purchases || []).find(function(pur) {
                            return pur.id === p.invoiceId && String(pur.supplierId) === idStr;
                        });
                        var ledgerMatch = p.type === 'ledger_payment' && p.entityType === 'supplier' && String(p.entityId) === idStr;
                        return purchaseMatch || ledgerMatch;
                    })
                    .forEach(function(payment) {
                        entries.push({
                            date: payment.date,
                            description: 'Payment - ' + (payment.mode || '') + (payment.bankAccountName ? (' (' + payment.bankAccountName + ')') : ''),
                            invoice: payment.invoice || '',
                            debit: 0,
                            credit: parseFloat(payment.amount) || 0
                        });
                    });
            } else if (type === 'customer') {
                var customer = (appData.customers || []).find(function(c) { return String(c.id) === idStr; });
                entityName = customer ? customer.name : 'Unknown Customer';

                (appData.openingBalances || [])
                    .filter(function(ob) { return ob.entityType === 'customer' && String(ob.entityId) === idStr; })
                    .forEach(function(opening) {
                        entries.push({
                            date: opening.date,
                            description: 'Opening Balance - ' + (opening.description || 'Old Sales Pending'),
                            invoice: opening.reference || 'Opening',
                            debit: parseFloat(opening.amount) || 0,
                            credit: 0
                        });
                    });

                (appData.sales || [])
                    .filter(function(s) { return String(s.customerId) === idStr; })
                    .forEach(function(sale) {
                        entries.push({
                            date: sale.date,
                            description: 'Sale - ' + (sale.itemName || 'Multiple Items'),
                            invoice: sale.invoice || '',
                            debit: parseFloat(sale.grandTotal || sale.total) || 0,
                            credit: 0
                        });
                    });

                (appData.deductions || [])
                    .filter(function(d) { return String(d.customerId) === idStr; })
                    .forEach(function(deduction) {
                        entries.push({
                            date: deduction.date,
                            description: 'Deduction - ' + (deduction.reason || ''),
                            invoice: deduction.invoice || '',
                            debit: 0,
                            credit: parseFloat(deduction.amount) || 0
                        });
                    });

                (appData.payments || [])
                    .filter(function(p) {
                        var saleMatch = p.type === 'sale' && (appData.sales || []).find(function(sale) {
                            return sale.id === p.invoiceId && String(sale.customerId) === idStr;
                        });
                        var ledgerMatch = p.type === 'ledger_receipt' && p.entityType === 'customer' && String(p.entityId) === idStr;
                        return saleMatch || ledgerMatch;
                    })
                    .forEach(function(payment) {
                        entries.push({
                            date: payment.date,
                            description: 'Receipt - ' + (payment.mode || '') + (payment.bankAccountName ? (' (' + payment.bankAccountName + ')') : ''),
                            invoice: payment.invoice || '',
                            debit: 0,
                            credit: parseFloat(payment.amount) || 0
                        });
                    });
            }

            entries.sort(function(a, b) {
                return String(a.date || '').localeCompare(String(b.date || ''));
            });
            var running = 0;
            entries.forEach(function(e) {
                running += (parseFloat(e.debit) || 0) - (parseFloat(e.credit) || 0);
                e.balance = running;
            });

            return {
                type: type,
                entityId: idStr,
                entityName: entityName,
                balance: running,
                entries: entries
            };
        }
        async function ensureImageEngineLoaded() {
            if (typeof window.html2canvas !== 'undefined') return true;
            var existing = document.getElementById('html2canvas-cdn-loader');
            if (existing && existing.getAttribute('data-ready') === '1') return true;

            return new Promise(function(resolve) {
                var script = existing || document.createElement('script');
                if (!existing) {
                    script.id = 'html2canvas-cdn-loader';
                    script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
                    script.async = true;
                    document.head.appendChild(script);
                }
                script.onload = function() {
                    script.setAttribute('data-ready', '1');
                    resolve(typeof window.html2canvas !== 'undefined');
                };
                script.onerror = function() {
                    resolve(false);
                };
            });
        }
        async function renderHtmlToCanvas(htmlContent) {
            var ready = await ensureImageEngineLoaded();
            if (!ready) {
                alert('Image engine not loaded. Please refresh and try again.');
                return null;
            }
            var wrapper = createRenderableHtmlWrapper(htmlContent);
            return new Promise(function(resolve) { setTimeout(resolve, 120); }).then(function() {
                return window.html2canvas(wrapper, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    windowWidth: wrapper.scrollWidth,
                    windowHeight: wrapper.scrollHeight
                }).then(function(canvas) {
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                    return canvas;
                }).catch(function(err) {
                    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
                    console.error('Canvas render failed:', err);
                    return null;
                });
            });
        }
        function downloadCanvasAsJpg(canvas, fileBaseName) {
            if (!canvas) return false;
            var link = document.createElement('a');
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.download = String(fileBaseName || ('invoice-ledger-' + Date.now())) + '.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        }
        function mergeInvoiceLedgerCanvases(invoiceCanvas, ledgerCanvas) {
            if (!invoiceCanvas || !ledgerCanvas) return null;
            var gap = 24;
            var outCanvas = document.createElement('canvas');
            outCanvas.width = Math.max(invoiceCanvas.width, ledgerCanvas.width);
            outCanvas.height = invoiceCanvas.height + gap + ledgerCanvas.height;
            var ctx = outCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
            ctx.drawImage(invoiceCanvas, 0, 0);
            ctx.drawImage(ledgerCanvas, 0, invoiceCanvas.height + gap);
            return outCanvas;
        }
        function downloadCanvasAsPdf(canvas, fileBaseName) {
            if (!canvas) return false;
            if (!(window.jspdf && window.jspdf.jsPDF)) {
                alert('PDF engine not loaded. Please refresh and try again.');
                return false;
            }
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF('p', 'mm', 'a4');
            var pageWidth = 210;
            var pageHeight = 297;
            var mmPerPx = pageWidth / canvas.width;
            var maxSliceHeightPx = Math.max(200, Math.floor(pageHeight / mmPerPx));
            var yOffset = 0;
            var pageIndex = 0;

            while (yOffset < canvas.height) {
                var sliceHeight = Math.min(maxSliceHeightPx, canvas.height - yOffset);
                var sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeight;
                var sctx = sliceCanvas.getContext('2d');
                sctx.fillStyle = '#ffffff';
                sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sctx.drawImage(
                    canvas,
                    0, yOffset, canvas.width, sliceHeight,
                    0, 0, sliceCanvas.width, sliceCanvas.height
                );
                var imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                if (pageIndex > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, sliceHeight * mmPerPx);
                yOffset += sliceHeight;
                pageIndex += 1;
            }
            pdf.save(String(fileBaseName || ('invoice-ledger-' + Date.now())) + '.pdf');
            return true;
        }
        function appendCanvasToPdfPages(pdf, canvas, useCurrentPageForFirstSlice) {
            if (!pdf || !canvas) return;
            var pageWidth = 210;
            var pageHeight = 297;
            var mmPerPx = pageWidth / canvas.width;
            var maxSliceHeightPx = Math.max(200, Math.floor(pageHeight / mmPerPx));
            var yOffset = 0;
            var isFirstSlice = true;

            while (yOffset < canvas.height) {
                var sliceHeight = Math.min(maxSliceHeightPx, canvas.height - yOffset);
                var sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceHeight;
                var sctx = sliceCanvas.getContext('2d');
                sctx.fillStyle = '#ffffff';
                sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
                sctx.drawImage(
                    canvas,
                    0, yOffset, canvas.width, sliceHeight,
                    0, 0, sliceCanvas.width, sliceCanvas.height
                );

                if (!isFirstSlice || !useCurrentPageForFirstSlice) {
                    pdf.addPage();
                }
                var imgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, sliceHeight * mmPerPx);

                yOffset += sliceHeight;
                isFirstSlice = false;
                useCurrentPageForFirstSlice = true;
            }
        }
        function downloadInvoiceAndLedgerPdf(invoiceCanvas, ledgerCanvas, fileBaseName) {
            if (!invoiceCanvas || !ledgerCanvas) return false;
            if (!(window.jspdf && window.jspdf.jsPDF)) {
                alert('PDF engine not loaded. Please refresh and try again.');
                return false;
            }
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF('p', 'mm', 'a4');
            appendCanvasToPdfPages(pdf, invoiceCanvas, true);   // First section starts on page 1
            appendCanvasToPdfPages(pdf, ledgerCanvas, false);   // Ledger starts on a new page
            pdf.save(String(fileBaseName || ('invoice-ledger-' + Date.now())) + '.pdf');
            return true;
        }
        function extractHtmlParts(fullHtml) {
            var parser = new DOMParser();
            var parsed = parser.parseFromString(String(fullHtml || ''), 'text/html');
            var styleText = Array.from(parsed.querySelectorAll('style')).map(function(s) { return s.textContent || ''; }).join('\n');
            var bodyHtml = (parsed.body && parsed.body.innerHTML) ? parsed.body.innerHTML : '';
            return { styles: styleText, body: bodyHtml };
        }
        function buildCombinedInvoiceLedgerHtml(invoiceHtml, ledgerHtml, titleText) {
            var inv = extractHtmlParts(invoiceHtml);
            var led = extractHtmlParts(ledgerHtml);
            var mergedStyles =
                (inv.styles || '') + '\n' +
                (led.styles || '') + '\n' +
                '.combined-divider{height:14px;border-top:2px dashed #cbd5e1;margin:12px 0;}' +
                '.combined-title{font-family:Segoe UI,Arial,sans-serif;font-weight:700;font-size:14px;margin:0 0 8px 0;color:#1e293b;}';
            return '<html><head><meta charset="UTF-8"><title>' + escapeHtml(titleText || 'Invoice + Ledger') + '</title><style>' +
                mergedStyles +
                '</style></head><body>' +
                '<p class="combined-title">' + escapeHtml(titleText || 'Invoice + Ledger') + '</p>' +
                '<div class="combined-section invoice-section">' + (inv.body || '') + '</div>' +
                '<div class="combined-divider"></div>' +
                '<div class="combined-section ledger-section">' + (led.body || '') + '</div>' +
                '</body></html>';
        }
        async function downloadPurchaseInvoiceWithLedgerJpg(purchaseId) {
            var purchase = (appData.purchases || []).find(function(p) { return p.id === purchaseId; });
            if (!purchase) return;
            var ledgerSnap = buildLedgerSnapshotForEntity('supplier', purchase.supplierId);
            if (!ledgerSnap.entries.length) {
                alert('No ledger entries found for this supplier.');
                return;
            }
            var invoiceHtml = buildPurchaseInvoiceHtml(purchase);
            var ledgerHtml = buildLedgerStatementHtml(ledgerSnap.entries, {
                type: ledgerSnap.type,
                entityId: ledgerSnap.entityId,
                entityName: ledgerSnap.entityName,
                balance: ledgerSnap.balance,
                fromDate: '',
                toDate: ''
            });
            var base = 'purchase-invoice-ledger-' + String(purchase.invoice || purchase.id || Date.now()).replace(/[^\w-]/g, '_');
            var invoiceCanvas = await renderHtmlToCanvas(invoiceHtml);
            var ledgerCanvas = await renderHtmlToCanvas(ledgerHtml);
            if (!invoiceCanvas || !ledgerCanvas) {
                alert('Could not generate combined file. Please try again.');
                return;
            }
            var outCanvas = mergeInvoiceLedgerCanvases(invoiceCanvas, ledgerCanvas);
            if (!outCanvas) {
                alert('Could not generate combined file. Please try again.');
                return;
            }
            downloadInvoiceAndLedgerPdf(invoiceCanvas, ledgerCanvas, base);
            downloadCanvasAsJpg(outCanvas, base);
        }
        async function downloadSaleInvoiceWithLedgerJpg(saleId) {
            var sale = (appData.sales || []).find(function(s) { return s.id === saleId; });
            if (!sale) return;
            var ledgerSnap = buildLedgerSnapshotForEntity('customer', sale.customerId);
            if (!ledgerSnap.entries.length) {
                alert('No ledger entries found for this customer.');
                return;
            }
            var invoiceHtml = buildSaleInvoiceHtml(sale);
            var ledgerHtml = buildLedgerStatementHtml(ledgerSnap.entries, {
                type: ledgerSnap.type,
                entityId: ledgerSnap.entityId,
                entityName: ledgerSnap.entityName,
                balance: ledgerSnap.balance,
                fromDate: '',
                toDate: ''
            });
            var base = 'sale-invoice-ledger-' + String(sale.invoice || sale.id || Date.now()).replace(/[^\w-]/g, '_');
            var invoiceCanvas = await renderHtmlToCanvas(invoiceHtml);
            var ledgerCanvas = await renderHtmlToCanvas(ledgerHtml);
            if (!invoiceCanvas || !ledgerCanvas) {
                alert('Could not generate combined file. Please try again.');
                return;
            }
            var outCanvas = mergeInvoiceLedgerCanvases(invoiceCanvas, ledgerCanvas);
            if (!outCanvas) {
                alert('Could not generate combined file. Please try again.');
                return;
            }
            downloadInvoiceAndLedgerPdf(invoiceCanvas, ledgerCanvas, base);
            downloadCanvasAsJpg(outCanvas, base);
        }
        function buildPurchaseWhatsAppMessage(purchase) {
            if (!purchase) return '';
            var total = parseFloat(purchase.grandTotal || purchase.total || 0);
            var paid = parseFloat(purchase.paid || 0);
            var balance = total - paid;
            return [
                (appData.company && appData.company.name) ? appData.company.name : 'Ishwar Trading Company',
                'Purchase Invoice: ' + (purchase.invoice || '-'),
                'Date: ' + formatDateForMessage(purchase.date),
                'Supplier: ' + (purchase.supplierName || '-'),
                'Total: ' + RU + total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                'Paid: ' + RU + paid.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                'Balance: ' + RU + balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                '',
                'Please verify ledger details.'
            ].join('\n');
        }
        function buildSaleWhatsAppMessage(sale) {
            if (!sale) return '';
            var total = parseFloat(sale.grandTotal || sale.total || 0);
            var received = parseFloat(sale.received || 0);
            var balance = total - received;
            return [
                (appData.company && appData.company.name) ? appData.company.name : 'Ishwar Trading Company',
                'Sales Invoice: ' + (sale.invoice || '-'),
                'Date: ' + formatDateForMessage(sale.date),
                'Customer: ' + (sale.customerName || '-'),
                'Total: ' + RU + total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                'Received: ' + RU + received.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                'Balance: ' + RU + balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                '',
                'Thank you for your business.'
            ].join('\n');
        }
        function buildLedgerWhatsAppMessage() {
            var meta = window.currentLedgerData || {};
            var entries = (typeof currentLedgerData !== 'undefined' && Array.isArray(currentLedgerData)) ? currentLedgerData : [];
            var fromDate = (document.getElementById('ledgerFromDate') || {}).value || '';
            var toDate = (document.getElementById('ledgerToDate') || {}).value || '';
            var periodLine = (fromDate || toDate)
                ? ('Period: ' + (fromDate || 'Start') + ' to ' + (toDate || 'Today'))
                : 'Period: All entries';
            var topEntries = entries.slice(-5).map(function(e) {
                return '- ' + (e.date || '-') + ' | ' + (e.description || '-') + ' | Bal ' + RU + (parseFloat(e.balance) || 0).toFixed(2);
            });
            return [
                (appData.company && appData.company.name) ? appData.company.name : 'Ishwar Trading Company',
                'Ledger Statement',
                'Party: ' + (meta.entityName || '-'),
                periodLine,
                'Current Balance: ' + RU + (parseFloat(meta.balance) || 0).toFixed(2),
                '',
                'Recent Entries:',
                topEntries.join('\n') || '- No entries',
                '',
                'Please confirm the ledger balance.'
            ].join('\n');
        }
        async function sendPurchaseWhatsApp(purchaseId) {
            var purchase = (appData.purchases || []).find(function(p) { return p.id === purchaseId; });
            if (!purchase) return;
            var supplier = (appData.suppliers || []).find(function(s) { return String(s.id) === String(purchase.supplierId); });
            if (!supplier || !supplier.mobile) {
                alert('Mobile not found for this supplier. Please update it in Masters first.');
                return;
            }
            var format = chooseWhatsAppAttachmentFormat();
            var pdfOk = await downloadPurchaseInvoicePdf(purchase, format);
            if (!pdfOk) return;
            if (!openWhatsAppChat(supplier.mobile, buildPurchaseWhatsAppMessage(purchase))) {
                alert('Invalid mobile number for this supplier. Please correct it in Masters.');
                return;
            }
            alert('Invoice file downloaded. Please attach it in WhatsApp chat and send.');
        }
        async function sendSaleWhatsApp(saleId) {
            var sale = (appData.sales || []).find(function(s) { return s.id === saleId; });
            if (!sale) return;
            var customer = (appData.customers || []).find(function(c) { return String(c.id) === String(sale.customerId); });
            if (!customer || !customer.mobile) {
                alert('Mobile not found for this customer. Please update it in Masters first.');
                return;
            }
            var format = chooseWhatsAppAttachmentFormat();
            var pdfOk = await downloadSaleInvoicePdf(sale, format);
            if (!pdfOk) return;
            if (!openWhatsAppChat(customer.mobile, buildSaleWhatsAppMessage(sale))) {
                alert('Invalid mobile number for this customer. Please correct it in Masters.');
                return;
            }
            alert('Invoice file downloaded. Please attach it in WhatsApp chat and send.');
        }
        async function sendLedgerWhatsApp() {
            var meta = window.currentLedgerData || {};
            if (!meta.type || !meta.entityId) {
                alert('Please generate a supplier or customer ledger first.');
                return;
            }
            if (meta.type !== 'supplier' && meta.type !== 'customer') {
                alert('WhatsApp is available only for supplier and customer ledgers.');
                return;
            }
            var party = meta.type === 'supplier'
                ? (appData.suppliers || []).find(function(s) { return String(s.id) === String(meta.entityId); })
                : (appData.customers || []).find(function(c) { return String(c.id) === String(meta.entityId); });
            if (!party || !party.mobile) {
                alert('Mobile not found for this party. Please update it in Masters first.');
                return;
            }
            var format = chooseWhatsAppAttachmentFormat();
            var pdfOk = await downloadLedgerPdf(format);
            if (!pdfOk) return;
            if (!openWhatsAppChat(party.mobile, buildLedgerWhatsAppMessage())) {
                alert('Invalid mobile number for this party. Please correct it in Masters.');
                return;
            }
            alert('Ledger file downloaded. Please attach it in WhatsApp chat and send.');
        }
        function addSupplier() {
            var rawName = document.getElementById('supplierName').value;
            const name = rawName ? String(rawName).trim() : '';
            const mobile = (document.getElementById('supplierMobile').value || '').trim();
            const address = (document.getElementById('supplierAddress').value || '').trim();
            const account = (document.getElementById('supplierAccount').value || '').trim();
            const ifsc = (document.getElementById('supplierIFSC').value || '').trim();
            var gstinEl = document.getElementById('supplierGSTIN');
            const gstin = gstinEl ? (gstinEl.value || '').trim() : '';
            if (name && mobile && address) {
                if (editingSupplierId) {
                    if (isDuplicateSupplierName(name, editingSupplierId)) { alert('Another supplier with this name already exists (including with different spaces).'); return; }
                    const supplier = appData.suppliers.find(s => s.id === editingSupplierId);
                    if (supplier) {
                        supplier.name = name;
                        supplier.mobile = mobile;
                        supplier.address = address;
                        supplier.account = account;
                        supplier.ifsc = ifsc;
                        supplier.gstin = gstin;
                    }
                    editingSupplierId = null;
                } else {
                    if (isDuplicateSupplierName(name)) { alert('Supplier with this name already exists (including with different spaces).'); return; }
                    const supplier = {
                        id: Date.now(),
                        name: name,
                        mobile: mobile,
                        address: address,
                        account: account,
                        ifsc: ifsc,
                        gstin: gstin,
                        active: true
                    };
                    appData.suppliers.push(supplier);
                }
                saveData();
                updateSuppliersList();
                populateDropdowns();
                document.getElementById('supplierName').value = '';
                document.getElementById('supplierMobile').value = '';
                document.getElementById('supplierAddress').value = '';
                document.getElementById('supplierAccount').value = '';
                document.getElementById('supplierIFSC').value = '';
                if (gstinEl) gstinEl.value = '';
                hideSupplierForm();
            } else {
                alert('Please fill in Name, Mobile and Address');
            }
        }

        function showSupplierForm() {
            document.getElementById('suppliersListView').classList.add('hidden');
            document.getElementById('supplierFormView').classList.remove('hidden');
        }

        function hideSupplierForm() {
            document.getElementById('suppliersListView').classList.remove('hidden');
            document.getElementById('supplierFormView').classList.add('hidden');
            // Clear form
            document.getElementById('supplierName').value = '';
            document.getElementById('supplierMobile').value = '';
            document.getElementById('supplierAddress').value = '';
            document.getElementById('supplierAccount').value = '';
            document.getElementById('supplierIFSC').value = '';
            var gstinEl = document.getElementById('supplierGSTIN');
            if (gstinEl) gstinEl.value = '';
            editingSupplierId = null;
        }

        function updateSuppliersList() {
            const container = document.getElementById('suppliersList');
            if (!container) return;
            var term = getMasterSearchTerm('masterSearchSuppliers');
            container.innerHTML = '';
            var suppliers = (appData.suppliers || []).filter(function(s) {
                if (!term) return true;
                var n = (s.name || '').toLowerCase();
                var m = (s.mobile || '').toLowerCase();
                var a = (s.address || '').toLowerCase();
                return n.indexOf(term) >= 0 || m.indexOf(term) >= 0 || a.indexOf(term) >= 0;
            });
            suppliers.forEach(function(supplier) {
                var active = supplier.active !== false;
                var div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
                div.innerHTML = '<span>' + (active ? '' : '<span class="text-slate-400 line-through">') + supplier.name + (active ? '' : '</span>') + '</span>' +
                    '<div class="space-x-2">' +
                    '<button onclick="editSupplier(' + supplier.id + ')" class="text-blue-500 hover:text-blue-700">Edit</button>' +
                    (active ? '<button onclick="setSupplierActive(' + supplier.id + ', false)" class="text-amber-600 hover:text-amber-800">Deactivate</button>' : '<button onclick="setSupplierActive(' + supplier.id + ', true)" class="text-green-600 hover:text-green-800">Activate</button>') +
                    '<button onclick="removeSupplier(' + supplier.id + ')" class="text-red-500 hover:text-red-700">\u00D7</button>' +
                    '</div>';
                container.appendChild(div);
            });
        }
        function setSupplierActive(id, active) { var s = appData.suppliers.find(function(x){ return x.id === id; }); if (s) { s.active = active; saveData(); updateSuppliersList(); populateDropdowns(); } }

        function editSupplier(id) {
            const supplier = appData.suppliers.find(s => s.id === id);
            if (supplier) {
                showSupplierForm();
                editingSupplierId = id;
                document.getElementById('supplierName').value = supplier.name;
                document.getElementById('supplierMobile').value = supplier.mobile || '';
                document.getElementById('supplierAddress').value = supplier.address;
                document.getElementById('supplierAccount').value = supplier.account || '';
                document.getElementById('supplierIFSC').value = supplier.ifsc || '';
                var gstinEl = document.getElementById('supplierGSTIN');
                if (gstinEl) gstinEl.value = supplier.gstin || '';
            }
        }

        function removeSupplier(id) {
            appData.suppliers = appData.suppliers.filter(supplier => supplier.id !== id);
            saveData();
            updateSuppliersList();
            populateDropdowns();
        }

        function addCustomer() {
            var rawName = document.getElementById('customerName').value;
            const name = rawName ? String(rawName).trim() : '';
            const mobile = (document.getElementById('customerMobile').value || '').trim();
            const address = (document.getElementById('customerAddress').value || '').trim();
            const account = (document.getElementById('customerAccount').value || '').trim();
            var custGstinEl = document.getElementById('customerGSTIN');
            const custGstin = custGstinEl ? (custGstinEl.value || '').trim() : '';
            var creditLimitEl = document.getElementById('customerCreditLimit');
            const creditLimit = (creditLimitEl && creditLimitEl.value !== '') ? parseFloat(creditLimitEl.value) : 200000;
            if (name && mobile && address) {
                if (editingCustomerId) {
                    if (isDuplicateCustomerName(name, editingCustomerId)) { alert('Another customer with this name already exists (including with different spaces).'); return; }
                    const customer = appData.customers.find(c => c.id === editingCustomerId);
                    if (customer) {
                        customer.name = name;
                        customer.mobile = mobile;
                        customer.address = address;
                        customer.account = account;
                        customer.gstin = custGstin;
                        customer.creditLimit = creditLimit;
                    }
                    editingCustomerId = null;
                } else {
                    if (isDuplicateCustomerName(name)) { alert('Customer with this name already exists (including with different spaces).'); return; }
                    const customer = {
                        id: Date.now(),
                        name: name,
                        mobile: mobile,
                        address: address,
                        account: account,
                        gstin: custGstin,
                        creditLimit: creditLimit,
                        active: true
                    };
                    appData.customers.push(customer);
                }
                saveData();
                updateCustomersList();
                populateDropdowns();
                document.getElementById('customerName').value = '';
                document.getElementById('customerMobile').value = '';
                document.getElementById('customerAddress').value = '';
                document.getElementById('customerAccount').value = '';
                if (custGstinEl) custGstinEl.value = '';
                if (creditLimitEl) creditLimitEl.value = '';
                hideCustomerForm();
            } else {
                alert('Please fill in Name, Mobile and Address');
            }
        }

        function showCustomerForm() {
            document.getElementById('customersListView').classList.add('hidden');
            document.getElementById('customerFormView').classList.remove('hidden');
        }

        function hideCustomerForm() {
            document.getElementById('customersListView').classList.remove('hidden');
            document.getElementById('customerFormView').classList.add('hidden');
            // Clear form
            document.getElementById('customerName').value = '';
            document.getElementById('customerMobile').value = '';
            document.getElementById('customerAddress').value = '';
            document.getElementById('customerAccount').value = '';
            var custGstinEl = document.getElementById('customerGSTIN');
            if (custGstinEl) custGstinEl.value = '';
            var creditLimitEl = document.getElementById('customerCreditLimit');
            if (creditLimitEl) creditLimitEl.value = '';
            editingCustomerId = null;
        }

        function updateCustomersList() {
            const container = document.getElementById('customersList');
            if (!container) return;
            var term = getMasterSearchTerm('masterSearchCustomers');
            container.innerHTML = '';
            var customers = (appData.customers || []).filter(function(c) {
                if (!term) return true;
                var n = (c.name || '').toLowerCase();
                var m = (c.mobile || '').toLowerCase();
                var a = (c.address || '').toLowerCase();
                return n.indexOf(term) >= 0 || m.indexOf(term) >= 0 || a.indexOf(term) >= 0;
            });
            customers.forEach(function(customer) {
                var active = customer.active !== false;
                var div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
                div.innerHTML = '<span>' + (active ? '' : '<span class="text-slate-400 line-through">') + customer.name + (active ? '' : '</span>') + '</span>' +
                    '<div class="space-x-2">' +
                    '<button onclick="editCustomer(' + customer.id + ')" class="text-blue-500 hover:text-blue-700">Edit</button>' +
                    (active ? '<button onclick="setCustomerActive(' + customer.id + ', false)" class="text-amber-600 hover:text-amber-800">Deactivate</button>' : '<button onclick="setCustomerActive(' + customer.id + ', true)" class="text-green-600 hover:text-green-800">Activate</button>') +
                    '<button onclick="removeCustomer(' + customer.id + ')" class="text-red-500 hover:text-red-700">\u00D7</button>' +
                    '</div>';
                container.appendChild(div);
            });
        }
        function setCustomerActive(id, active) { var c = appData.customers.find(function(x){ return x.id === id; }); if (c) { c.active = active; saveData(); updateCustomersList(); populateDropdowns(); } }

        function editCustomer(id) {
            const customer = appData.customers.find(c => c.id === id);
            if (customer) {
                showCustomerForm();
                editingCustomerId = id;
                document.getElementById('customerName').value = customer.name;
                document.getElementById('customerMobile').value = customer.mobile || '';
                document.getElementById('customerAddress').value = customer.address;
                document.getElementById('customerAccount').value = customer.account || '';
                var custGstinEl = document.getElementById('customerGSTIN');
                if (custGstinEl) custGstinEl.value = customer.gstin || '';
                var creditLimitEl = document.getElementById('customerCreditLimit');
                if (creditLimitEl) creditLimitEl.value = (customer.creditLimit != null && customer.creditLimit !== '') ? String(customer.creditLimit) : '';
            }
        }

        function removeCustomer(id) {
            appData.customers = appData.customers.filter(customer => customer.id !== id);
            saveData();
            updateCustomersList();
            populateDropdowns();
        }

        function addBroker() {
            var rawName = document.getElementById('brokerName').value;
            const name = rawName ? String(rawName).trim() : '';
            const mobile = (document.getElementById('brokerMobile').value || '').trim();
            const details = (document.getElementById('brokerDetails').value || '').trim();
            const account = (document.getElementById('brokerAccount').value || '').trim();
            if (name && mobile && details) {
                if (editingBrokerId) {
                    if (isDuplicateBrokerName(name, editingBrokerId)) { alert('Another broker with this name already exists (including with different spaces).'); return; }
                    const broker = appData.brokers.find(b => b.id === editingBrokerId);
                    if (broker) {
                        broker.name = name;
                        broker.mobile = mobile;
                        broker.details = details;
                        broker.account = account;
                    }
                    editingBrokerId = null;
                } else {
                    if (isDuplicateBrokerName(name)) { alert('Broker with this name already exists (including with different spaces).'); return; }
                    const broker = {
                        id: Date.now(),
                        name: name,
                        mobile: mobile,
                        details: details,
                        account: account,
                        active: true
                    };
                    appData.brokers.push(broker);
                }
                saveData();
                updateBrokersList();
                populateDropdowns();
                
                // Clear form
                document.getElementById('brokerName').value = '';
                document.getElementById('brokerMobile').value = '';
                document.getElementById('brokerDetails').value = '';
                document.getElementById('brokerAccount').value = '';
                
                // Hide form after adding
                hideBrokerForm();
            } else {
                alert('Please fill in Name, Mobile and Details');
            }
        }

        function showBrokerForm() {
            document.getElementById('brokersListView').classList.add('hidden');
            document.getElementById('brokerFormView').classList.remove('hidden');
        }

        function hideBrokerForm() {
            document.getElementById('brokersListView').classList.remove('hidden');
            document.getElementById('brokerFormView').classList.add('hidden');
            // Clear form
            document.getElementById('brokerName').value = '';
            document.getElementById('brokerMobile').value = '';
            document.getElementById('brokerDetails').value = '';
            document.getElementById('brokerAccount').value = '';
            editingBrokerId = null;
        }

        function updateBrokersList() {
            const container = document.getElementById('brokersList');
            if (!container) return;
            var term = getMasterSearchTerm('masterSearchBrokers');
            container.innerHTML = '';
            var brokers = (appData.brokers || []).filter(function(b) {
                if (!term) return true;
                var n = (b.name || '').toLowerCase();
                var m = (b.mobile || '').toLowerCase();
                var d = (b.details || '').toLowerCase();
                return n.indexOf(term) >= 0 || m.indexOf(term) >= 0 || d.indexOf(term) >= 0;
            });
            brokers.forEach(function(broker) {
                var active = broker.active !== false;
                var div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
                div.innerHTML = '<span>' + (active ? '' : '<span class="text-slate-400 line-through">') + broker.name + (active ? '' : '</span>') + '</span>' +
                    '<div class="space-x-2">' +
                    '<button onclick="editBroker(' + broker.id + ')" class="text-blue-500 hover:text-blue-700">Edit</button>' +
                    (active ? '<button onclick="setBrokerActive(' + broker.id + ', false)" class="text-amber-600 hover:text-amber-800">Deactivate</button>' : '<button onclick="setBrokerActive(' + broker.id + ', true)" class="text-green-600 hover:text-green-800">Activate</button>') +
                    '<button onclick="removeBroker(' + broker.id + ')" class="text-red-500 hover:text-red-700">\u00D7</button>' +
                    '</div>';
                container.appendChild(div);
            });
        }
        function setBrokerActive(id, active) { var b = appData.brokers.find(function(x){ return x.id === id; }); if (b) { b.active = active; saveData(); updateBrokersList(); populateDropdowns(); } }

        function editBroker(id) {
            const broker = appData.brokers.find(b => b.id === id);
            if (broker) {
                showBrokerForm();
                editingBrokerId = id;
                document.getElementById('brokerName').value = broker.name;
                document.getElementById('brokerMobile').value = broker.mobile || '';
                document.getElementById('brokerDetails').value = broker.details;
                document.getElementById('brokerAccount').value = broker.account || '';
            }
        }

        function removeBroker(id) {
            appData.brokers = appData.brokers.filter(broker => broker.id !== id);
            saveData();
            updateBrokersList();
            populateDropdowns();
        }

        function showColdStorageForm() {
            document.getElementById('coldStoragesListView').classList.add('hidden');
            document.getElementById('coldStorageFormView').classList.remove('hidden');
        }

        function hideColdStorageForm() {
            document.getElementById('coldStoragesListView').classList.remove('hidden');
            document.getElementById('coldStorageFormView').classList.add('hidden');
            const nameEl = document.getElementById('coldStorageMasterName');
            const vendorEl = document.getElementById('coldStorageMasterVendorName');
            const detailsEl = document.getElementById('coldStorageMasterDetails');
            if (nameEl) nameEl.value = '';
            if (vendorEl) vendorEl.value = '';
            if (detailsEl) detailsEl.value = '';
            editingColdStorageId = null;
        }

        function addColdStorageMaster() {
            const rawName = document.getElementById('coldStorageMasterName').value;
            const name = rawName ? String(rawName).trim() : '';
            const vendorName = (document.getElementById('coldStorageMasterVendorName').value || '').trim();
            const details = (document.getElementById('coldStorageMasterDetails').value || '').trim();
            if (!name) {
                alert('Please enter Cold Storage Name.');
                return;
            }
            if (editingColdStorageId) {
                if (isDuplicateColdStorageName(name, editingColdStorageId)) {
                    alert('Another cold storage with this name already exists.');
                    return;
                }
                const coldStorage = (appData.coldStorages || []).find(function(cs) { return cs.id === editingColdStorageId; });
                if (coldStorage) {
                    coldStorage.name = name;
                    coldStorage.vendorName = vendorName;
                    coldStorage.details = details;
                }
                editingColdStorageId = null;
            } else {
                if (isDuplicateColdStorageName(name)) {
                    alert('Cold storage with this name already exists.');
                    return;
                }
                appData.coldStorages = appData.coldStorages || [];
                appData.coldStorages.push({
                    id: Date.now(),
                    name: name,
                    vendorName: vendorName,
                    details: details,
                    active: true
                });
            }
            saveData();
            updateColdStoragesList();
            populateDropdowns();
            hideColdStorageForm();
        }

        function updateColdStoragesList() {
            const container = document.getElementById('coldStoragesList');
            if (!container) return;
            const term = getMasterSearchTerm('masterSearchColdStorages');
            container.innerHTML = '';
            const storages = (appData.coldStorages || []).filter(function(cs) {
                if (!term) return true;
                return ((cs.name || '').toLowerCase().indexOf(term) >= 0)
                    || ((cs.vendorName || '').toLowerCase().indexOf(term) >= 0)
                    || ((cs.details || '').toLowerCase().indexOf(term) >= 0);
            });
            storages.forEach(function(cs) {
                const active = cs.active !== false;
                const vendorLabel = cs.vendorName ? (' | Vendor: ' + cs.vendorName) : '';
                const detailsLabel = cs.details ? (' | ' + cs.details) : '';
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center p-2 bg-gray-50 rounded';
                div.innerHTML = '<span>' + (active ? '' : '<span class="text-slate-400 line-through">') + escapeHtml(cs.name || '-') + escapeHtml(vendorLabel) + escapeHtml(detailsLabel) + (active ? '' : '</span>') + '</span>' +
                    '<div class="space-x-2">' +
                    '<button onclick="editColdStorageMaster(' + cs.id + ')" class="text-blue-500 hover:text-blue-700">Edit</button>' +
                    (active ? '<button onclick="setColdStorageActive(' + cs.id + ', false)" class="text-amber-600 hover:text-amber-800">Deactivate</button>' : '<button onclick="setColdStorageActive(' + cs.id + ', true)" class="text-green-600 hover:text-green-800">Activate</button>') +
                    '<button onclick="removeColdStorageMaster(' + cs.id + ')" class="text-red-500 hover:text-red-700">×</button>' +
                    '</div>';
                container.appendChild(div);
            });
        }

        function setColdStorageActive(id, active) {
            const coldStorage = (appData.coldStorages || []).find(function(cs) { return cs.id === id; });
            if (!coldStorage) return;
            coldStorage.active = active;
            saveData();
            updateColdStoragesList();
            populateDropdowns();
        }

        function editColdStorageMaster(id) {
            const coldStorage = (appData.coldStorages || []).find(function(cs) { return cs.id === id; });
            if (!coldStorage) return;
            showColdStorageForm();
            editingColdStorageId = id;
            document.getElementById('coldStorageMasterName').value = coldStorage.name || '';
            document.getElementById('coldStorageMasterVendorName').value = coldStorage.vendorName || '';
            document.getElementById('coldStorageMasterDetails').value = coldStorage.details || '';
        }

        function removeColdStorageMaster(id) {
            appData.coldStorages = (appData.coldStorages || []).filter(function(cs) { return cs.id !== id; });
            saveData();
            updateColdStoragesList();
            populateDropdowns();
        }

        function getColdStorageMasterNameById(id) {
            const idStr = String(id || '').trim();
            if (!idStr) return '';
            const coldStorage = (appData.coldStorages || []).find(function(cs) { return String(cs.id || '') === idStr; });
            return coldStorage ? String(coldStorage.name || '').trim() : '';
        }

        function resolveColdStorageSelection(selectId, fallbackName) {
            const selectEl = document.getElementById(selectId);
            const selectedId = selectEl ? String(selectEl.value || '').trim() : '';
            if (selectedId.indexOf('__legacy__:') === 0) {
                return {
                    id: '',
                    name: selectedId.replace('__legacy__:', '').trim()
                };
            }
            const selectedName = selectedId ? getColdStorageMasterNameById(selectedId) : '';
            const legacyName = String(fallbackName || '').trim();
            return {
                id: selectedId || '',
                name: String(selectedName || legacyName || '').trim()
            };
        }

        function populateColdStorageSelect(selectId, placeholder, selectedId, selectedName) {
            const selectEl = document.getElementById(selectId);
            if (!selectEl) return;
            const idStr = String(selectedId || '').trim();
            const nameStr = String(selectedName || '').trim();
            const activeStorages = (appData.coldStorages || []).filter(function(cs) { return cs.active !== false; });
            selectEl.innerHTML = `<option value="">${escapeHtml(placeholder || 'Select cold storage')}</option>`;
            activeStorages.forEach(function(cs) {
                const vendorPart = cs.vendorName ? ` | ${cs.vendorName}` : '';
                selectEl.innerHTML += `<option value="${cs.id}">${escapeHtml(cs.name || '')}${escapeHtml(vendorPart)}</option>`;
            });
            if (idStr && selectEl.querySelector(`option[value="${idStr}"]`)) {
                selectEl.value = idStr;
                return;
            }
            if (nameStr) {
                const byName = activeStorages.find(function(cs) {
                    return normalizedName(cs.name) === normalizedName(nameStr);
                });
                if (byName) {
                    selectEl.value = String(byName.id);
                    return;
                }
                const legacyValue = '__legacy__:' + nameStr;
                selectEl.innerHTML += `<option value="${legacyValue}" data-legacy="1">${escapeHtml(nameStr)} (legacy)</option>`;
                selectEl.value = legacyValue;
                return;
            }
            selectEl.value = '';
        }

        function populateColdStorageNameDropdowns() {
            const purchaseSelected = resolveColdStorageSelection('purchaseColdStorageName');
            const moveSelected = resolveColdStorageSelection('coldMoveStorageName');
            const editSelected = resolveColdStorageSelection('coldLotEditStorageName');
            populateColdStorageSelect('purchaseColdStorageName', 'Select cold storage', purchaseSelected.id, purchaseSelected.name);
            populateColdStorageSelect('coldMoveStorageName', 'Select cold storage', moveSelected.id, moveSelected.name);
            populateColdStorageSelect('coldLotEditStorageName', 'Select cold storage', editSelected.id, editSelected.name);
        }

        function normalizeColdStorageReferences() {
            const activeStorages = (appData.coldStorages || []).filter(function(cs) { return cs.active !== false; });
            const byNormalizedName = {};
            activeStorages.forEach(function(cs) {
                const key = normalizedName(cs.name);
                if (key && !byNormalizedName[key]) byNormalizedName[key] = cs;
            });
            const resolve = function(id, name) {
                const byIdName = String(getColdStorageMasterNameById(id) || '').trim();
                if (byIdName) return { id: String(id || ''), name: byIdName };
                const byName = byNormalizedName[normalizedName(name)];
                if (byName) return { id: String(byName.id || ''), name: String(byName.name || '').trim() };
                return { id: '', name: String(name || '').trim() };
            };
            (appData.purchases || []).forEach(function(purchase) {
                (purchase.items || []).forEach(function(item) {
                    if (!item || !item.isColdStorage) return;
                    const resolved = resolve(item.coldStorageId, item.coldStorageName);
                    item.coldStorageId = resolved.id;
                    item.coldStorageName = resolved.name;
                });
            });
            (appData.coldStorageLots || []).forEach(function(lot) {
                if (!lot) return;
                const resolved = resolve(lot.coldStorageId, lot.coldStorageName);
                lot.coldStorageId = resolved.id;
                lot.coldStorageName = resolved.name || lot.coldStorageName;
            });
        }

        function normalizeColdStorageLotFields() {
            appData.coldStorageLots = (appData.coldStorageLots || []).map(function(lot) {
                const safe = lot || {};
                safe.releaseQtyTotal = Math.max(0, parseFloat(safe.releaseQtyTotal) || 0);
                safe.releaseBagsTotal = Math.max(0, parseFloat(safe.releaseBagsTotal) || 0);
                safe.damageQtyTotal = Math.max(0, parseFloat(safe.damageQtyTotal) || 0);
                safe.damageBagsTotal = Math.max(0, parseFloat(safe.damageBagsTotal) || 0);
                safe.shrinkageQtyTotal = Math.max(0, parseFloat(safe.shrinkageQtyTotal) || 0);
                safe.companyExpenseAtMove = Math.max(0, parseFloat(safe.companyExpenseAtMove) || 0);
                safe.companyExpenseReason = String(safe.companyExpenseReason || '').trim();
                return safe;
            });
        }

        // Populate dropdowns
        function populateDropdowns() {
            // Purchase page dropdowns
            const purchaseSupplier = document.getElementById('purchaseSupplier');
            const purchaseItem = document.getElementById('purchaseItem');
            
            if (purchaseSupplier) {
                purchaseSupplier.innerHTML = '<option value="">Select Supplier</option>';
                (appData.suppliers || []).filter(function(s){ return s.active !== false; }).forEach(supplier => {
                    purchaseSupplier.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
                });
            }
            
            if (purchaseItem) {
                purchaseItem.innerHTML = '<option value="">Select Item</option>';
                (appData.items || []).filter(function(i){ return i.active !== false; }).forEach(item => {
                    purchaseItem.innerHTML += `<option value="${item.id}">${item.name}</option>`;
                });
            }

            // Sales page dropdowns
            const saleCustomer = document.getElementById('saleCustomer');
            const saleItem = document.getElementById('saleItem');
            
            if (saleCustomer) {
                saleCustomer.innerHTML = '<option value="">Select Customer</option>';
                (appData.customers || []).filter(function(c){ return c.active !== false; }).forEach(customer => {
                    saleCustomer.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                });
            }
            
            if (saleItem) {
                saleItem.innerHTML = '<option value="">Select Item</option>';
                Object.keys(appData.inventory).forEach(itemId => {
                    const item = appData.items.find(i => i.id == itemId);
                    const availableQty = getSaleAvailableQty(itemId);
                    if (item && availableQty > 0) {
                        saleItem.innerHTML += `<option value="${item.id}">${item.name} (Available: ${availableQty.toFixed(2)})</option>`;
                    }
                });
            }

            // Broker page dropdowns
            const brokeragebroker = document.getElementById('brokeragebroker');
            const brokerageItem = document.getElementById('brokerageItem');
            
            if (brokeragebroker) {
                brokeragebroker.innerHTML = '<option value="">Select Broker</option>';
                (appData.brokers || []).filter(function(b){ return b.active !== false; }).forEach(broker => {
                    brokeragebroker.innerHTML += `<option value="${broker.id}">${broker.name}</option>`;
                });
            }
            
            if (brokerageItem) {
                brokerageItem.innerHTML = '<option value="">Select Item</option>';
                (appData.items || []).filter(function(i){ return i.active !== false; }).forEach(item => {
                    brokerageItem.innerHTML += `<option value="${item.id}">${item.name}</option>`;
                });
            }

            // Deductions page dropdown
            const deductionCustomer = document.getElementById('deductionCustomer');
            if (deductionCustomer) {
                deductionCustomer.innerHTML = '<option value="">Select Customer</option>';
                (appData.customers || []).filter(function(c){ return c.active !== false; }).forEach(customer => {
                    deductionCustomer.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                });
            }
            
            const deductionInvoice = document.getElementById('deductionInvoice');
            if (deductionInvoice) {
                deductionInvoice.innerHTML = '<option value="">Select Sales Invoice</option>';
                appData.sales.forEach(sale => {
                    deductionInvoice.innerHTML += `<option value="${sale.invoice}">${sale.invoice} - ${sale.customerName}</option>`;
                });
            }
            
            // Opening balance dropdowns
            populateOpeningBalanceDropdowns();
            populateColdStorageNameDropdowns();
            refreshInlineBrokerageBrokerOptions();
            syncPurchaseSupplierDisplay();
            syncSaleCustomerDisplay();
            syncLedgerEntityDisplay();
            initPurchaseSupplierSearch();
            initSaleCustomerSearch();
            initLedgerEntitySearch();
            if (typeof populateColdVendorPayablesFilterOptions === 'function') populateColdVendorPayablesFilterOptions();
        }

        function syncPurchaseSupplierDisplay() {
            var sel = document.getElementById('purchaseSupplier');
            var inp = document.getElementById('purchaseSupplierInput');
            if (sel && inp) { var opt = sel.options[sel.selectedIndex]; inp.value = (opt && opt.value) ? (opt.text || '') : ''; }
        }
        function syncSaleCustomerDisplay() {
            var sel = document.getElementById('saleCustomer');
            var inp = document.getElementById('saleCustomerInput');
            if (sel && inp) { var opt = sel.options[sel.selectedIndex]; inp.value = (opt && opt.value) ? (opt.text || '') : ''; }
        }
        function getLedgerEntitiesForType(type) {
            var t = String(type || '').trim().toLowerCase();
            if (t === 'supplier') return (appData.suppliers || []).filter(function(s) { return s.active !== false; });
            if (t === 'customer') return (appData.customers || []).filter(function(c) { return c.active !== false; });
            if (t === 'broker') return (appData.brokers || []).filter(function(b) { return b.active !== false; });
            if (t === 'cold_storage') {
                var entities = [];
                var byKey = {};
                (appData.coldStorages || []).filter(function(cs) { return cs.active !== false && String(cs.name || '').trim(); }).forEach(function(cs) {
                    var name = String(cs.name || '').trim();
                    var key = normalizedName(name);
                    if (!key || byKey[key]) return;
                    byKey[key] = true;
                    entities.push({
                        id: 'cs_master_' + String(cs.id),
                        name: name,
                        source: 'master',
                        masterId: String(cs.id),
                        matchKey: key
                    });
                });
                (appData.coldStorageLots || []).forEach(function(lot) {
                    var name = String(lot && lot.coldStorageName || '').trim();
                    var key = normalizedName(name);
                    if (!key || byKey[key]) return;
                    byKey[key] = true;
                    entities.push({
                        id: 'cs_name_' + key,
                        name: name,
                        source: 'name',
                        masterId: '',
                        matchKey: key
                    });
                });
                return entities.sort(function(a, b) { return String(a.name || '').localeCompare(String(b.name || '')); });
            }
            return [];
        }

        function calculateLedgerSummaryTotals() {
            var toAmount = function(value) {
                return Math.max(0, parseFloat(value) || 0);
            };
            var toId = function(value) {
                return String(value == null ? '' : value).trim();
            };

            var purchaseById = {};
            (appData.purchases || []).forEach(function(purchase) {
                purchaseById[toId(purchase.id)] = purchase;
            });
            var saleById = {};
            (appData.sales || []).forEach(function(sale) {
                saleById[toId(sale.id)] = sale;
            });
            var brokerageById = {};
            (appData.brokerage || []).forEach(function(entry) {
                brokerageById[toId(entry.id)] = entry;
            });
            var lotById = {};
            (appData.coldStorageLots || []).forEach(function(lot) {
                lotById[toId(lot.id)] = lot;
            });

            var supplierIdSet = {};
            (appData.suppliers || []).forEach(function(s) { supplierIdSet[toId(s.id)] = true; });
            (appData.purchases || []).forEach(function(p) { supplierIdSet[toId(p.supplierId)] = true; });
            (appData.openingBalances || []).forEach(function(ob) { if (ob.entityType === 'supplier') supplierIdSet[toId(ob.entityId)] = true; });
            (appData.adjustments || []).forEach(function(adj) { if (adj.type === 'supplier_adjustment') supplierIdSet[toId(adj.entityId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_payment' && payment.entityType === 'supplier') supplierIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'purchase') {
                    var pur = purchaseById[toId(payment.invoiceId)];
                    if (pur) supplierIdSet[toId(pur.supplierId)] = true;
                }
            });

            var customerIdSet = {};
            (appData.customers || []).forEach(function(c) { customerIdSet[toId(c.id)] = true; });
            (appData.sales || []).forEach(function(s) { customerIdSet[toId(s.customerId)] = true; });
            (appData.openingBalances || []).forEach(function(ob) { if (ob.entityType === 'customer') customerIdSet[toId(ob.entityId)] = true; });
            (appData.deductions || []).forEach(function(d) { customerIdSet[toId(d.customerId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_receipt' && payment.entityType === 'customer') customerIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'sale') {
                    var sale = saleById[toId(payment.invoiceId)];
                    if (sale) customerIdSet[toId(sale.customerId)] = true;
                }
            });

            var brokerIdSet = {};
            (appData.brokers || []).forEach(function(b) { brokerIdSet[toId(b.id)] = true; });
            (appData.brokerage || []).forEach(function(entry) { brokerIdSet[toId(entry.brokerId)] = true; });
            (appData.adjustments || []).forEach(function(adj) { if (adj.type === 'broker_adjustment') brokerIdSet[toId(adj.entityId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_payment' && payment.entityType === 'broker') brokerIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'brokerage') {
                    var brokerageEntry = brokerageById[toId(payment.invoiceId)];
                    if (brokerageEntry) brokerIdSet[toId(brokerageEntry.brokerId)] = true;
                }
            });

            var suppliersPayable = 0;
            Object.keys(supplierIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.openingBalances || []).forEach(function(ob) {
                    if (ob.entityType === 'supplier' && toId(ob.entityId) === id) debit += toAmount(ob.amount);
                });
                (appData.purchases || []).forEach(function(purchase) {
                    if (toId(purchase.supplierId) === id) debit += toAmount(purchase.grandTotal || purchase.total);
                });
                (appData.adjustments || []).forEach(function(adj) {
                    if (adj.type === 'supplier_adjustment' && toId(adj.entityId) === id) credit += toAmount(adj.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isPurchasePayment = payment.type === 'purchase' && purchaseById[toId(payment.invoiceId)] && toId(purchaseById[toId(payment.invoiceId)].supplierId) === id;
                    var isLedgerPayment = payment.type === 'ledger_payment' && payment.entityType === 'supplier' && toId(payment.entityId) === id;
                    if (isPurchasePayment || isLedgerPayment) credit += toAmount(payment.amount);
                });
                suppliersPayable += Math.max(0, debit - credit);
            });

            var customersReceivable = 0;
            Object.keys(customerIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.openingBalances || []).forEach(function(ob) {
                    if (ob.entityType === 'customer' && toId(ob.entityId) === id) debit += toAmount(ob.amount);
                });
                (appData.sales || []).forEach(function(sale) {
                    if (toId(sale.customerId) === id) debit += toAmount(sale.grandTotal || sale.total);
                });
                (appData.deductions || []).forEach(function(deduction) {
                    if (toId(deduction.customerId) === id) credit += toAmount(deduction.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isSalePayment = payment.type === 'sale' && saleById[toId(payment.invoiceId)] && toId(saleById[toId(payment.invoiceId)].customerId) === id;
                    var isLedgerReceipt = payment.type === 'ledger_receipt' && payment.entityType === 'customer' && toId(payment.entityId) === id;
                    if (isSalePayment || isLedgerReceipt) credit += toAmount(payment.amount);
                });
                customersReceivable += Math.max(0, debit - credit);
            });

            var brokersPayable = 0;
            Object.keys(brokerIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.brokerage || []).forEach(function(entry) {
                    if (toId(entry.brokerId) === id) debit += toAmount(entry.amount);
                });
                (appData.adjustments || []).forEach(function(adj) {
                    if (adj.type === 'broker_adjustment' && toId(adj.entityId) === id) credit += toAmount(adj.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isBrokeragePayment = payment.type === 'brokerage' && brokerageById[toId(payment.invoiceId)] && toId(brokerageById[toId(payment.invoiceId)].brokerId) === id;
                    var isLedgerPayment = payment.type === 'ledger_payment' && payment.entityType === 'broker' && toId(payment.entityId) === id;
                    if (isBrokeragePayment || isLedgerPayment) credit += toAmount(payment.amount);
                });
                brokersPayable += Math.max(0, debit - credit);
            });

            var coldStoragePayable = 0;
            var coldStorageEntities = getLedgerEntitiesForType('cold_storage') || [];
            coldStorageEntities.forEach(function(entity) {
                var selectedMatchKey = normalizedName((entity && entity.name) || '');
                var selectedMasterId = toId(entity && entity.masterId);
                if (!selectedMatchKey && !selectedMasterId) return;
                var matchesLot = function(lot) {
                    if (!lot) return false;
                    if (selectedMasterId && toId(lot.coldStorageId) === selectedMasterId) return true;
                    return normalizedName(lot.coldStorageName) === selectedMatchKey;
                };

                var debit = 0;
                var credit = 0;
                (appData.coldStorageMovements || []).forEach(function(movement) {
                    var moveType = String(movement.type || '');
                    if (!['move_in', 'charge_add'].includes(moveType)) return;
                    var lot = lotById[toId(movement.lotId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(movement.coldStorageName) === selectedMatchKey;
                    if (matched) debit += toAmount(movement.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    if (String(payment.type || '').toLowerCase() !== 'cold_storage_payment') return;
                    var lot = lotById[toId(payment.invoiceId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(payment.party) === selectedMatchKey;
                    if (matched) credit += toAmount(payment.amount);
                });
                (appData.coldStorageDamages || []).forEach(function(damage) {
                    if (toAmount(damage.vendorShareAmount) <= 0) return;
                    var lot = lotById[toId(damage.lotId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(damage.coldStorageName) === selectedMatchKey;
                    if (matched) credit += toAmount(damage.vendorShareAmount);
                });
                coldStoragePayable += Math.max(0, debit - credit);
            });

            return {
                suppliersPayable: suppliersPayable,
                customersReceivable: customersReceivable,
                brokersPayable: brokersPayable,
                coldStoragePayable: coldStoragePayable
            };
        }

        function getLedgerSummaryBreakdowns() {
            var toAmount = function(value) {
                return Math.max(0, parseFloat(value) || 0);
            };
            var toId = function(value) {
                return String(value == null ? '' : value).trim();
            };
            var toName = function(value, fallback) {
                var v = String(value || '').trim();
                return v || fallback;
            };

            var purchaseById = {};
            (appData.purchases || []).forEach(function(purchase) { purchaseById[toId(purchase.id)] = purchase; });
            var saleById = {};
            (appData.sales || []).forEach(function(sale) { saleById[toId(sale.id)] = sale; });
            var brokerageById = {};
            (appData.brokerage || []).forEach(function(entry) { brokerageById[toId(entry.id)] = entry; });
            var lotById = {};
            (appData.coldStorageLots || []).forEach(function(lot) { lotById[toId(lot.id)] = lot; });

            var supplierNameById = {};
            (appData.suppliers || []).forEach(function(s) { supplierNameById[toId(s.id)] = toName(s.name, 'Unknown Supplier'); });
            var customerNameById = {};
            (appData.customers || []).forEach(function(c) { customerNameById[toId(c.id)] = toName(c.name, 'Unknown Customer'); });
            var brokerNameById = {};
            (appData.brokers || []).forEach(function(b) { brokerNameById[toId(b.id)] = toName(b.name, 'Unknown Broker'); });

            var supplierIdSet = {};
            (appData.suppliers || []).forEach(function(s) { supplierIdSet[toId(s.id)] = true; });
            (appData.purchases || []).forEach(function(p) { supplierIdSet[toId(p.supplierId)] = true; });
            (appData.openingBalances || []).forEach(function(ob) { if (ob.entityType === 'supplier') supplierIdSet[toId(ob.entityId)] = true; });
            (appData.adjustments || []).forEach(function(adj) { if (adj.type === 'supplier_adjustment') supplierIdSet[toId(adj.entityId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_payment' && payment.entityType === 'supplier') supplierIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'purchase') {
                    var pur = purchaseById[toId(payment.invoiceId)];
                    if (pur) supplierIdSet[toId(pur.supplierId)] = true;
                }
            });

            var customerIdSet = {};
            (appData.customers || []).forEach(function(c) { customerIdSet[toId(c.id)] = true; });
            (appData.sales || []).forEach(function(s) { customerIdSet[toId(s.customerId)] = true; });
            (appData.openingBalances || []).forEach(function(ob) { if (ob.entityType === 'customer') customerIdSet[toId(ob.entityId)] = true; });
            (appData.deductions || []).forEach(function(d) { customerIdSet[toId(d.customerId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_receipt' && payment.entityType === 'customer') customerIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'sale') {
                    var sale = saleById[toId(payment.invoiceId)];
                    if (sale) customerIdSet[toId(sale.customerId)] = true;
                }
            });

            var brokerIdSet = {};
            (appData.brokers || []).forEach(function(b) { brokerIdSet[toId(b.id)] = true; });
            (appData.brokerage || []).forEach(function(entry) { brokerIdSet[toId(entry.brokerId)] = true; });
            (appData.adjustments || []).forEach(function(adj) { if (adj.type === 'broker_adjustment') brokerIdSet[toId(adj.entityId)] = true; });
            (appData.payments || []).forEach(function(payment) {
                if (payment.type === 'ledger_payment' && payment.entityType === 'broker') brokerIdSet[toId(payment.entityId)] = true;
                if (payment.type === 'brokerage') {
                    var brokerageEntry = brokerageById[toId(payment.invoiceId)];
                    if (brokerageEntry) brokerIdSet[toId(brokerageEntry.brokerId)] = true;
                }
            });

            var supplierRows = [];
            Object.keys(supplierIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.openingBalances || []).forEach(function(ob) {
                    if (ob.entityType === 'supplier' && toId(ob.entityId) === id) debit += toAmount(ob.amount);
                });
                (appData.purchases || []).forEach(function(purchase) {
                    if (toId(purchase.supplierId) === id) debit += toAmount(purchase.grandTotal || purchase.total);
                });
                (appData.adjustments || []).forEach(function(adj) {
                    if (adj.type === 'supplier_adjustment' && toId(adj.entityId) === id) credit += toAmount(adj.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isPurchasePayment = payment.type === 'purchase' && purchaseById[toId(payment.invoiceId)] && toId(purchaseById[toId(payment.invoiceId)].supplierId) === id;
                    var isLedgerPayment = payment.type === 'ledger_payment' && payment.entityType === 'supplier' && toId(payment.entityId) === id;
                    if (isPurchasePayment || isLedgerPayment) credit += toAmount(payment.amount);
                });
                var outstanding = Math.max(0, debit - credit);
                if (outstanding <= 0) return;
                supplierRows.push({ id: id, name: supplierNameById[id] || ('Supplier ' + id), amount: +outstanding.toFixed(2) });
            });

            var customerRows = [];
            Object.keys(customerIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.openingBalances || []).forEach(function(ob) {
                    if (ob.entityType === 'customer' && toId(ob.entityId) === id) debit += toAmount(ob.amount);
                });
                (appData.sales || []).forEach(function(sale) {
                    if (toId(sale.customerId) === id) debit += toAmount(sale.grandTotal || sale.total);
                });
                (appData.deductions || []).forEach(function(deduction) {
                    if (toId(deduction.customerId) === id) credit += toAmount(deduction.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isSalePayment = payment.type === 'sale' && saleById[toId(payment.invoiceId)] && toId(saleById[toId(payment.invoiceId)].customerId) === id;
                    var isLedgerReceipt = payment.type === 'ledger_receipt' && payment.entityType === 'customer' && toId(payment.entityId) === id;
                    if (isSalePayment || isLedgerReceipt) credit += toAmount(payment.amount);
                });
                var outstanding = Math.max(0, debit - credit);
                if (outstanding <= 0) return;
                customerRows.push({ id: id, name: customerNameById[id] || ('Customer ' + id), amount: +outstanding.toFixed(2) });
            });

            var brokerRows = [];
            Object.keys(brokerIdSet).forEach(function(id) {
                if (!id) return;
                var debit = 0;
                var credit = 0;
                (appData.brokerage || []).forEach(function(entry) {
                    if (toId(entry.brokerId) === id) debit += toAmount(entry.amount);
                });
                (appData.adjustments || []).forEach(function(adj) {
                    if (adj.type === 'broker_adjustment' && toId(adj.entityId) === id) credit += toAmount(adj.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    var isBrokeragePayment = payment.type === 'brokerage' && brokerageById[toId(payment.invoiceId)] && toId(brokerageById[toId(payment.invoiceId)].brokerId) === id;
                    var isLedgerPayment = payment.type === 'ledger_payment' && payment.entityType === 'broker' && toId(payment.entityId) === id;
                    if (isBrokeragePayment || isLedgerPayment) credit += toAmount(payment.amount);
                });
                var outstanding = Math.max(0, debit - credit);
                if (outstanding <= 0) return;
                brokerRows.push({ id: id, name: brokerNameById[id] || ('Broker ' + id), amount: +outstanding.toFixed(2) });
            });

            var coldStorageRows = [];
            var coldStorageEntities = getLedgerEntitiesForType('cold_storage') || [];
            coldStorageEntities.forEach(function(entity) {
                var selectedMatchKey = normalizedName((entity && entity.name) || '');
                var selectedMasterId = toId(entity && entity.masterId);
                if (!selectedMatchKey && !selectedMasterId) return;
                var matchesLot = function(lot) {
                    if (!lot) return false;
                    if (selectedMasterId && toId(lot.coldStorageId) === selectedMasterId) return true;
                    return normalizedName(lot.coldStorageName) === selectedMatchKey;
                };
                var debit = 0;
                var credit = 0;
                (appData.coldStorageMovements || []).forEach(function(movement) {
                    var moveType = String(movement.type || '');
                    if (!['move_in', 'charge_add'].includes(moveType)) return;
                    var lot = lotById[toId(movement.lotId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(movement.coldStorageName) === selectedMatchKey;
                    if (matched) debit += toAmount(movement.amount);
                });
                (appData.payments || []).forEach(function(payment) {
                    if (String(payment.type || '').toLowerCase() !== 'cold_storage_payment') return;
                    var lot = lotById[toId(payment.invoiceId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(payment.party) === selectedMatchKey;
                    if (matched) credit += toAmount(payment.amount);
                });
                (appData.coldStorageDamages || []).forEach(function(damage) {
                    if (toAmount(damage.vendorShareAmount) <= 0) return;
                    var lot = lotById[toId(damage.lotId)];
                    var matched = lot ? matchesLot(lot) : normalizedName(damage.coldStorageName) === selectedMatchKey;
                    if (matched) credit += toAmount(damage.vendorShareAmount);
                });
                var outstanding = Math.max(0, debit - credit);
                if (outstanding <= 0) return;
                coldStorageRows.push({
                    id: toId(entity.id),
                    name: toName(entity.name, 'Cold Storage'),
                    amount: +outstanding.toFixed(2)
                });
            });

            var byAmountDesc = function(a, b) {
                if (b.amount !== a.amount) return b.amount - a.amount;
                return String(a.name || '').localeCompare(String(b.name || ''));
            };
            supplierRows.sort(byAmountDesc);
            customerRows.sort(byAmountDesc);
            brokerRows.sort(byAmountDesc);
            coldStorageRows.sort(byAmountDesc);

            var sumRows = function(rows) {
                return rows.reduce(function(sum, row) { return sum + (parseFloat(row.amount) || 0); }, 0);
            };

            return {
                supplier: {
                    title: 'Payable to Suppliers',
                    rows: supplierRows,
                    total: +sumRows(supplierRows).toFixed(2)
                },
                customer: {
                    title: 'Receivable from Customers',
                    rows: customerRows,
                    total: +sumRows(customerRows).toFixed(2)
                },
                broker: {
                    title: 'Payable to Brokers',
                    rows: brokerRows,
                    total: +sumRows(brokerRows).toFixed(2)
                },
                cold_storage: {
                    title: 'Payable to Cold Storage',
                    rows: coldStorageRows,
                    total: +sumRows(coldStorageRows).toFixed(2)
                }
            };
        }

        function formatLedgerSummaryAmount(value) {
            return RU + (Math.max(0, parseFloat(value) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        function closeLedgerSummaryDrilldown() {
            var modal = document.getElementById('ledgerSummaryDrilldownModal');
            if (modal) modal.classList.add('hidden');
        }

        function openLedgerSummaryDrilldown(type) {
            var breakdown = getLedgerSummaryBreakdowns();
            var block = breakdown[String(type || '')];
            if (!block) return;
            var modal = document.getElementById('ledgerSummaryDrilldownModal');
            var titleEl = document.getElementById('ledgerSummaryDrilldownTitle');
            var listEl = document.getElementById('ledgerSummaryDrilldownList');
            var totalEl = document.getElementById('ledgerSummaryDrilldownTotal');
            if (!modal || !titleEl || !listEl || !totalEl) return;

            titleEl.textContent = block.title;
            if (!block.rows.length) {
                listEl.innerHTML = '<p class="text-sm text-slate-500">No outstanding entities found.</p>';
            } else {
                listEl.innerHTML = block.rows.map(function(row) {
                    return '<div class="ledger-drilldown-row">' +
                        '<span class="ledger-drilldown-name">' + escapeHtml(row.name || '-') + '</span>' +
                        '<span class="ledger-drilldown-amount">' + formatLedgerSummaryAmount(row.amount) + '</span>' +
                    '</div>';
                }).join('');
            }
            totalEl.textContent = formatLedgerSummaryAmount(block.total);
            modal.classList.remove('hidden');
        }

        function initLedgerSummaryDrilldownModal() {
            if (document.body && document.body.dataset.ledgerDrilldownInit === '1') return;
            if (document.body) document.body.dataset.ledgerDrilldownInit = '1';
            document.addEventListener('click', function(e) {
                var modal = document.getElementById('ledgerSummaryDrilldownModal');
                if (!modal || modal.classList.contains('hidden')) return;
                if (e.target === modal) closeLedgerSummaryDrilldown();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') closeLedgerSummaryDrilldown();
            });
        }

        function renderLedgerSummaryCards() {
            var breakdown = getLedgerSummaryBreakdowns();
            var summary = {
                suppliersPayable: (breakdown.supplier && breakdown.supplier.total) || 0,
                customersReceivable: (breakdown.customer && breakdown.customer.total) || 0,
                brokersPayable: (breakdown.broker && breakdown.broker.total) || 0,
                coldStoragePayable: (breakdown.cold_storage && breakdown.cold_storage.total) || 0
            };
            var suppliersEl = document.getElementById('ledgerSummarySuppliersPayable');
            var customersEl = document.getElementById('ledgerSummaryCustomersReceivable');
            var brokersEl = document.getElementById('ledgerSummaryBrokersPayable');
            var coldStorageEl = document.getElementById('ledgerSummaryColdStoragePayable');
            if (suppliersEl) suppliersEl.textContent = formatLedgerSummaryAmount(summary.suppliersPayable);
            if (customersEl) customersEl.textContent = formatLedgerSummaryAmount(summary.customersReceivable);
            if (brokersEl) brokersEl.textContent = formatLedgerSummaryAmount(summary.brokersPayable);
            if (coldStorageEl) coldStorageEl.textContent = formatLedgerSummaryAmount(summary.coldStoragePayable);
        }

        function syncLedgerEntityDisplay() {
            var sel = document.getElementById('ledgerEntity');
            var inp = document.getElementById('ledgerEntityInput');
            if (!sel || !inp) return;
            var opt = sel.options[sel.selectedIndex];
            inp.value = (opt && opt.value) ? (opt.text || '') : '';
        }
        function chooseLedgerEntity(id, name) {
            var sel = document.getElementById('ledgerEntity');
            var inp = document.getElementById('ledgerEntityInput');
            var dd = document.getElementById('ledgerEntityDropdown');
            if (!sel || !inp) return;
            sel.value = String(id || '');
            inp.value = String(name || '').trim();
            if (dd) dd.classList.add('hidden');
        }
        function renderLedgerEntityDropdown(filter) {
            var typeEl = document.getElementById('ledgerType');
            var dd = document.getElementById('ledgerEntityDropdown');
            if (!typeEl || !dd) return;
            var list = getLedgerEntitiesForType(typeEl.value);
            if (filter) {
                var f = String(filter).trim().toLowerCase();
                list = list.filter(function(entity) {
                    return String(entity && entity.name || '').toLowerCase().indexOf(f) >= 0;
                });
            }
            if (!typeEl.value) {
                dd.innerHTML = '<div class="px-3 py-2 text-slate-500 text-sm">Select ledger type first</div>';
                dd.classList.remove('hidden');
                return;
            }
            if (!list.length) {
                dd.innerHTML = '<div class="px-3 py-2 text-slate-500 text-sm">No matching entities found</div>';
                dd.classList.remove('hidden');
                return;
            }
            dd.innerHTML = list.map(function(entity, idx) {
                return '<div class="px-3 py-2 cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0" data-id="' + entity.id + '" data-name="' + escapeHtml(entity.name || '') + '" data-index="' + idx + '">' + escapeHtml(entity.name || '') + '</div>';
            }).join('');
            dd.dataset.activeIndex = '0';
            dd.classList.remove('hidden');
        }
        function initLedgerEntitySearch() {
            var inp = document.getElementById('ledgerEntityInput');
            var dd = document.getElementById('ledgerEntityDropdown');
            var sel = document.getElementById('ledgerEntity');
            if (!inp || !dd || !sel || inp._searchInited) return;
            inp._searchInited = true;
            inp.addEventListener('focus', function() { renderLedgerEntityDropdown(''); });
            inp.addEventListener('click', function() { renderLedgerEntityDropdown(''); });
            inp.addEventListener('input', function() {
                sel.value = '';
                renderLedgerEntityDropdown(inp.value);
            });
            inp.addEventListener('keydown', function(e) {
                var rows = Array.prototype.slice.call(dd.querySelectorAll('[data-id]'));
                if (e.key === 'Escape') {
                    dd.classList.add('hidden');
                    return;
                }
                if (!rows.length) return;
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    var currentIndex = parseInt(dd.dataset.activeIndex || '-1', 10);
                    if (Number.isNaN(currentIndex)) currentIndex = -1;
                    if (e.key === 'ArrowDown') currentIndex = Math.min(rows.length - 1, currentIndex + 1);
                    if (e.key === 'ArrowUp') currentIndex = Math.max(0, currentIndex - 1);
                    dd.dataset.activeIndex = String(currentIndex);
                    rows.forEach(function(row, idx) {
                        row.classList.toggle('bg-slate-100', idx === currentIndex);
                    });
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    var chosenIndex = parseInt(dd.dataset.activeIndex || '0', 10);
                    if (Number.isNaN(chosenIndex) || chosenIndex < 0 || chosenIndex >= rows.length) chosenIndex = 0;
                    var row = rows[chosenIndex];
                    chooseLedgerEntity(row.getAttribute('data-id'), row.getAttribute('data-name') || row.textContent);
                }
            });
            dd.addEventListener('click', function(e) {
                var row = e.target.closest('[data-id]');
                if (row) {
                    chooseLedgerEntity(row.getAttribute('data-id'), row.getAttribute('data-name') || row.textContent);
                }
            });
            document.addEventListener('click', function(e) {
                if (!e.target.closest('#ledgerEntityInput') && !e.target.closest('#ledgerEntityDropdown')) {
                    dd.classList.add('hidden');
                    var selectedText = '';
                    var selected = sel.options[sel.selectedIndex];
                    if (selected && selected.value) selectedText = selected.text || '';
                    if (String(inp.value || '').trim() !== String(selectedText || '').trim()) {
                        sel.value = '';
                    }
                }
            });
        }
        function renderPurchaseSupplierDropdown(filter) {
            var list = (appData.suppliers || []).filter(function(s){ return s.active !== false; });
            if (filter) { var f = String(filter).trim().toLowerCase(); list = list.filter(function(s) { return (s.name || '').toLowerCase().indexOf(f) >= 0; }); }
            var dd = document.getElementById('purchaseSupplierDropdown');
            if (!dd) return;
            dd.innerHTML = list.map(function(s){ return '<div class="px-3 py-2 cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0" data-id="'+s.id+'">'+escapeHtml(s.name||'')+'</div>'; }).join('');
            dd.classList.remove('hidden');
        }
        function renderSaleCustomerDropdown(filter) {
            var list = (appData.customers || []).filter(function(c){ return c.active !== false; });
            if (filter) { var f = String(filter).trim().toLowerCase(); list = list.filter(function(c) { return (c.name || '').toLowerCase().indexOf(f) >= 0; }); }
            var dd = document.getElementById('saleCustomerDropdown');
            if (!dd) return;
            dd.innerHTML = list.map(function(c){ return '<div class="px-3 py-2 cursor-pointer hover:bg-slate-100 border-b border-slate-100 last:border-0" data-id="'+c.id+'">'+escapeHtml(c.name||'')+'</div>'; }).join('');
            dd.classList.remove('hidden');
        }
        function initPurchaseSupplierSearch() {
            var inp = document.getElementById('purchaseSupplierInput');
            var dd = document.getElementById('purchaseSupplierDropdown');
            if (!inp || !dd || inp._searchInited) return;
            inp._searchInited = true;
            inp.addEventListener('focus', function(){ renderPurchaseSupplierDropdown(inp.value); });
            inp.addEventListener('input', function(){ renderPurchaseSupplierDropdown(inp.value); });
            inp.addEventListener('keyup', function(){ renderPurchaseSupplierDropdown(inp.value); });
            inp.addEventListener('blur', function(){ setTimeout(function(){ dd.classList.add('hidden'); }, 200); });
            dd.addEventListener('click', function(e){
                var row = e.target.closest('[data-id]');
                if (row) {
                    var id = row.getAttribute('data-id');
                    var name = row.textContent;
                    var sel = document.getElementById('purchaseSupplier');
                    if (sel) sel.value = id;
                    inp.value = name;
                    dd.classList.add('hidden');
                }
            });
        }
        function initSaleCustomerSearch() {
            var inp = document.getElementById('saleCustomerInput');
            var dd = document.getElementById('saleCustomerDropdown');
            if (!inp || !dd || inp._searchInited) return;
            inp._searchInited = true;
            inp.addEventListener('focus', function(){ renderSaleCustomerDropdown(inp.value); });
            inp.addEventListener('input', function(){ renderSaleCustomerDropdown(inp.value); });
            inp.addEventListener('keyup', function(){ renderSaleCustomerDropdown(inp.value); });
            inp.addEventListener('blur', function(){ setTimeout(function(){ dd.classList.add('hidden'); }, 200); });
            dd.addEventListener('click', function(e){
                var row = e.target.closest('[data-id]');
                if (row) {
                    var id = row.getAttribute('data-id');
                    var name = row.textContent;
                    var sel = document.getElementById('saleCustomer');
                    if (sel) sel.value = id;
                    inp.value = name;
                    dd.classList.add('hidden');
                }
            });
        }
        function openAddSupplierModalFromPurchase() {
            document.getElementById('quickSupplierName').value = '';
            document.getElementById('quickSupplierMobile').value = '';
            document.getElementById('quickSupplierAddress').value = '';
            document.getElementById('quickSupplierAccount').value = '';
            document.getElementById('quickSupplierIFSC').value = '';
            document.getElementById('quickSupplierGSTIN').value = '';
            document.getElementById('quickAddSupplierModal').classList.remove('hidden');
        }
        function closeQuickAddSupplierModal() {
            document.getElementById('quickAddSupplierModal').classList.add('hidden');
        }
        function saveQuickAddSupplier() {
            var name = (document.getElementById('quickSupplierName').value || '').trim();
            var mobile = (document.getElementById('quickSupplierMobile').value || '').trim();
            var address = (document.getElementById('quickSupplierAddress').value || '').trim();
            if (!name || !mobile || !address) { alert('Name, Mobile and Address are required.'); return; }
            if (isDuplicateSupplierName(name)) { alert('Supplier with this name already exists (including with different spaces).'); return; }
            var supplier = {
                id: Date.now(),
                name: name,
                mobile: mobile,
                address: address,
                account: (document.getElementById('quickSupplierAccount').value || '').trim(),
                ifsc: (document.getElementById('quickSupplierIFSC').value || '').trim(),
                gstin: (document.getElementById('quickSupplierGSTIN').value || '').trim(),
                active: true
            };
            appData.suppliers = appData.suppliers || [];
            appData.suppliers.push(supplier);
            saveData();
            updateSuppliersList();
            populateDropdowns();
            document.getElementById('purchaseSupplier').value = supplier.id;
            document.getElementById('purchaseSupplierInput').value = supplier.name;
            closeQuickAddSupplierModal();
            alert('Supplier added to masters and selected.');
        }
        function openAddCustomerModalFromSale() {
            document.getElementById('quickCustomerName').value = '';
            document.getElementById('quickCustomerMobile').value = '';
            document.getElementById('quickCustomerAddress').value = '';
            document.getElementById('quickCustomerAccount').value = '';
            document.getElementById('quickCustomerGSTIN').value = '';
            document.getElementById('quickAddCustomerModal').classList.remove('hidden');
        }
        function closeQuickAddCustomerModal() {
            document.getElementById('quickAddCustomerModal').classList.add('hidden');
        }
        function saveQuickAddCustomer() {
            var name = (document.getElementById('quickCustomerName').value || '').trim();
            var mobile = (document.getElementById('quickCustomerMobile').value || '').trim();
            var address = (document.getElementById('quickCustomerAddress').value || '').trim();
            if (!name || !mobile || !address) { alert('Name, Mobile and Address are required.'); return; }
            if (isDuplicateCustomerName(name)) { alert('Customer with this name already exists (including with different spaces).'); return; }
            var customer = {
                id: Date.now(),
                name: name,
                mobile: mobile,
                address: address,
                account: (document.getElementById('quickCustomerAccount').value || '').trim(),
                gstin: (document.getElementById('quickCustomerGSTIN').value || '').trim(),
                active: true
            };
            appData.customers = appData.customers || [];
            appData.customers.push(customer);
            saveData();
            updateCustomersList();
            populateDropdowns();
            document.getElementById('saleCustomer').value = customer.id;
            document.getElementById('saleCustomerInput').value = customer.name;
            closeQuickAddCustomerModal();
            alert('Customer added to masters and selected.');
        }

        // Purchase functions
        function updatePurchaseInputs() {
            const itemId = document.getElementById('purchaseItem').value;
            const unitDisplay = document.getElementById('purchaseUnitDisplay');
            const rateContainer = document.getElementById('purchaseRateContainer');
            const amountContainer = document.getElementById('purchaseAmountContainer');
            const rateLabel = document.getElementById('purchaseRateLabel');
            const rateHelp = document.getElementById('purchaseRateHelp');
            const discountQtyContainer = document.getElementById('purchaseDiscountQtyContainer');
            const bagsContainer = document.getElementById('purchaseBagsContainer');
            const discountContainer = document.getElementById('purchaseDiscountContainer');
            
            // Get labels to update
            const grossLabel = document.querySelector('label[for="purchaseQuantity"]');
            const netLabel = document.querySelector('label[for="purchaseNetWeight"]');
            const netHelp = document.querySelector('#purchaseNetWeight').nextElementSibling;
            const purchaseQuantityEl = document.getElementById('purchaseQuantity');
            const purchaseNetWeightEl = document.getElementById('purchaseNetWeight');
            
            if (itemId) {
                const item = appData.items.find(i => i.id == itemId);
                if (item) {
                    unitDisplay.textContent = `Unit: ${item.unit}`;
                    
                    // Special handling for coconut products
                    if (item.name.toLowerCase().includes('coconut')) {
                        bagsContainer.style.display = 'none';
                        if (discountContainer) discountContainer.style.display = 'none';
                        discountQtyContainer.style.display = 'block';
                        rateContainer.style.display = 'block';
                        amountContainer.style.display = 'none';
                        
                        // Update labels for coconut
                        if (grossLabel) grossLabel.textContent = 'Gross Quantity';
                        if (purchaseQuantityEl) purchaseQuantityEl.placeholder = 'Gross Quantity';
                        if (netLabel) netLabel.textContent = 'Net Quantity';
                        if (purchaseNetWeightEl) purchaseNetWeightEl.placeholder = 'Net Quantity';
                        if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Discount)';
                        rateLabel.textContent = `Rate per ${item.unit}`;
                        rateHelp.textContent = `Enter rate per ${item.unit}`;
                        
                        // Clear bags value for coconut
                        document.getElementById('purchaseBags').value = '0';
                    } else if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                        // For quantity-based items, show amount input instead of rate
                        rateContainer.style.display = 'none';
                        amountContainer.style.display = 'block';
                        bagsContainer.style.display = 'none';
                        if (discountContainer) discountContainer.style.display = 'none';
                        discountQtyContainer.style.display = 'none';
                        document.getElementById('purchaseDiscountQty').value = '0';
                        
                        if (grossLabel) grossLabel.textContent = 'Gross Weight (kg)';
                        if (purchaseQuantityEl) purchaseQuantityEl.placeholder = 'Gross Weight';
                        if (netLabel) netLabel.textContent = 'Net Weight';
                        if (purchaseNetWeightEl) purchaseNetWeightEl.placeholder = 'Net Weight';
                        if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
                    } else {
                        rateContainer.style.display = 'block';
                        amountContainer.style.display = 'none';
                        bagsContainer.style.display = 'block';
                        if (discountContainer) discountContainer.style.display = 'block';
                        discountQtyContainer.style.display = 'none';
                        document.getElementById('purchaseDiscountQty').value = '0';
                        
                        if (grossLabel) grossLabel.textContent = 'Gross Weight (kg)';
                        if (purchaseQuantityEl) purchaseQuantityEl.placeholder = 'Gross Weight';
                        if (netLabel) netLabel.textContent = 'Net Weight';
                        if (purchaseNetWeightEl) purchaseNetWeightEl.placeholder = 'Net Weight';
                        if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
                        rateLabel.textContent = `Rate per ${item.unit}`;
                        rateHelp.textContent = `Enter rate per ${item.unit}`;
                    }
                }
            } else {
                unitDisplay.textContent = 'Select item first';
                rateContainer.style.display = 'block';
                amountContainer.style.display = 'none';
                bagsContainer.style.display = 'block';
                if (discountContainer) discountContainer.style.display = 'block';
                discountQtyContainer.style.display = 'none';
                rateLabel.textContent = 'Rate per Unit';
                rateHelp.textContent = 'Enter rate per unit';
                if (grossLabel) grossLabel.textContent = 'Gross Weight (kg)';
                if (purchaseQuantityEl) purchaseQuantityEl.placeholder = 'Gross Weight';
                if (netLabel) netLabel.textContent = 'Net Weight';
                if (purchaseNetWeightEl) purchaseNetWeightEl.placeholder = 'Net Weight';
                if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
            }
            
            calculatePurchaseItemTotal();
        }

        function calculatePurchaseItemTotal() {
            const grossWeight = parseFloat(document.getElementById('purchaseQuantity').value) || 0;
            const discount = parseFloat(document.getElementById('purchaseDiscount').value) || 0;
            const discountQty = parseFloat(document.getElementById('purchaseDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('purchaseRate').value) || 0;
            const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
            
            const itemId = document.getElementById('purchaseItem').value;
            if (!itemId) return;
            
            const item = appData.items.find(i => i.id == itemId);
            let netWeight = grossWeight;
            let total = 0;
            
            if (item.name.toLowerCase().includes('coconut')) {
                netWeight = grossWeight - discountQty;
                total = netWeight * rate;
            } else if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                total = amount;
                netWeight = grossWeight;
            } else {
                // Weight-based: Net = Gross - Discount (Discount box; flows from Bags)
                netWeight = grossWeight - discount;
                total = netWeight * rate;
            }
            
            document.getElementById('purchaseNetWeight').value = netWeight;
            document.getElementById('purchaseItemTotal').value = total.toFixed(2);
        }

        function recalcPurchaseItemTotalFromNetWeight() {
            var netInput = parseFloat(document.getElementById('purchaseNetWeight').value);
            if (isNaN(netInput)) return;
            var itemId = document.getElementById('purchaseItem').value;
            if (!itemId) return;
            var item = appData.items.find(i => i.id == itemId);
            if (!item) return;
            var rate = parseFloat(document.getElementById('purchaseRate').value) || 0;
            var amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
            if (item.name.toLowerCase().includes('coconut')) {
                document.getElementById('purchaseItemTotal').value = (netInput * rate).toFixed(2);
            } else if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                document.getElementById('purchaseItemTotal').value = amount;
            } else {
                document.getElementById('purchaseItemTotal').value = (netInput * rate).toFixed(2);
            }
        }

        function calculatePurchaseColdStorageCost() {
            const costEl = document.getElementById('purchaseColdStorageCost');
            const toggleEl = document.getElementById('purchaseColdStorageToggle');
            const rentCostDisplay = document.getElementById('purchaseColdStorageRentCostDisplay');
            const inCostDisplay = document.getElementById('purchaseColdStorageInCostDisplay');
            const outCostDisplay = document.getElementById('purchaseColdStorageOutCostDisplay');
            const otherDisplay = document.getElementById('purchaseColdStorageOtherDisplay');
            const companyExpenseDisplay = document.getElementById('purchaseColdStorageCompanyExpenseDisplay');
            const totalDisplay = document.getElementById('purchaseColdStorageTotalDisplay');
            const rentRateDisplay = document.getElementById('purchaseColdStorageRentRateDisplay');
            const weightDisplay = document.getElementById('purchaseColdStorageWeightDisplay');
            const inRateDisplay = document.getElementById('purchaseColdStorageInRateDisplay');
            const outRateDisplay = document.getElementById('purchaseColdStorageOutRateDisplay');
            const inBagsDisplay = document.getElementById('purchaseColdStorageInBagsDisplay');
            const outBagsDisplay = document.getElementById('purchaseColdStorageOutBagsDisplay');
            if (!costEl || !toggleEl || !toggleEl.checked) {
                if (costEl) costEl.value = '';
                if (rentCostDisplay) rentCostDisplay.textContent = '0.00';
                if (inCostDisplay) inCostDisplay.textContent = '0.00';
                if (outCostDisplay) outCostDisplay.textContent = '0.00';
                if (otherDisplay) otherDisplay.textContent = '0.00';
                if (companyExpenseDisplay) companyExpenseDisplay.textContent = '0.00';
                if (totalDisplay) totalDisplay.textContent = '0.00';
                if (rentRateDisplay) rentRateDisplay.textContent = '0.00';
                if (weightDisplay) weightDisplay.textContent = '0.00';
                if (inRateDisplay) inRateDisplay.textContent = '0.00';
                if (outRateDisplay) outRateDisplay.textContent = '0.00';
                if (inBagsDisplay) inBagsDisplay.textContent = '0.00';
                if (outBagsDisplay) outBagsDisplay.textContent = '0.00';
                return 0;
            }
            const grossWeight = Math.max(0, parseFloat(document.getElementById('purchaseQuantity') && document.getElementById('purchaseQuantity').value) || 0);
            const bags = Math.max(0, parseFloat(document.getElementById('purchaseBags') && document.getElementById('purchaseBags').value) || 0);
            const moveQtyInput = parseFloat(document.getElementById('purchaseColdMoveQty') && document.getElementById('purchaseColdMoveQty').value);
            const moveBagsInput = parseFloat(document.getElementById('purchaseColdMoveBags') && document.getElementById('purchaseColdMoveBags').value);
            const moveQty = Math.max(0, !isNaN(moveQtyInput) ? moveQtyInput : grossWeight);
            const moveBags = Math.max(0, !isNaN(moveBagsInput) ? moveBagsInput : bags);
            const rentPerKg = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageRentPerKg') && document.getElementById('purchaseColdStorageRentPerKg').value) || 0);
            const inPerBag = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageInPerBag') && document.getElementById('purchaseColdStorageInPerBag').value) || 0);
            const outPerBag = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageOutPerBag') && document.getElementById('purchaseColdStorageOutPerBag').value) || 0);
            const otherCharge = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageOtherCharge') && document.getElementById('purchaseColdStorageOtherCharge').value) || 0);
            const companyExpense = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageCompanyExpense') && document.getElementById('purchaseColdStorageCompanyExpense').value) || 0);
            const rentCost = moveQty * rentPerKg;
            const inCost = moveBags * inPerBag;
            const outCost = moveBags * outPerBag;
            const totalCost = rentCost + inCost + outCost + otherCharge;
            costEl.value = totalCost.toFixed(2);
            if (rentCostDisplay) rentCostDisplay.textContent = rentCost.toFixed(2);
            if (inCostDisplay) inCostDisplay.textContent = inCost.toFixed(2);
            if (outCostDisplay) outCostDisplay.textContent = outCost.toFixed(2);
            if (otherDisplay) otherDisplay.textContent = otherCharge.toFixed(2);
            if (companyExpenseDisplay) companyExpenseDisplay.textContent = companyExpense.toFixed(2);
            if (totalDisplay) totalDisplay.textContent = totalCost.toFixed(2);
            if (rentRateDisplay) rentRateDisplay.textContent = rentPerKg.toFixed(2);
            if (weightDisplay) weightDisplay.textContent = moveQty.toFixed(2);
            if (inRateDisplay) inRateDisplay.textContent = inPerBag.toFixed(2);
            if (outRateDisplay) outRateDisplay.textContent = outPerBag.toFixed(2);
            if (inBagsDisplay) inBagsDisplay.textContent = moveBags.toFixed(2);
            if (outBagsDisplay) outBagsDisplay.textContent = moveBags.toFixed(2);
            return totalCost;
        }

        function switchPurchaseItemTab(tabName) {
            const basicBtn = document.getElementById('purchaseItemTabBasicBtn');
            const coldBtn = document.getElementById('purchaseItemTabColdBtn');
            const basicTab = document.getElementById('purchaseItemTabBasic');
            const coldTab = document.getElementById('purchaseItemTabCold');
            const toggleEl = document.getElementById('purchaseColdStorageToggle');
            if (!basicBtn || !coldBtn || !basicTab || !coldTab) return;
            const coldEnabled = !!(toggleEl && toggleEl.checked);
            const nextTab = (tabName === 'cold' && coldEnabled) ? 'cold' : 'basic';

            basicTab.classList.toggle('hidden', nextTab !== 'basic');
            coldTab.classList.toggle('hidden', nextTab !== 'cold');

            basicBtn.classList.toggle('bg-primary', nextTab === 'basic');
            basicBtn.classList.toggle('text-white', nextTab === 'basic');
            basicBtn.classList.toggle('bg-slate-100', nextTab !== 'basic');
            basicBtn.classList.toggle('text-slate-700', nextTab !== 'basic');

            coldBtn.classList.toggle('hidden', !coldEnabled);
            coldBtn.classList.toggle('bg-primary', nextTab === 'cold');
            coldBtn.classList.toggle('text-white', nextTab === 'cold');
            coldBtn.classList.toggle('bg-slate-100', nextTab !== 'cold');
            coldBtn.classList.toggle('text-slate-700', nextTab !== 'cold');
        }

        function resetPurchaseColdStorageInputs() {
            const toggleEl = document.getElementById('purchaseColdStorageToggle');
            const fieldsEl = document.getElementById('purchaseColdStorageFields');
            const rentEl = document.getElementById('purchaseColdStorageRentPerKg');
            const inEl = document.getElementById('purchaseColdStorageInPerBag');
            const outEl = document.getElementById('purchaseColdStorageOutPerBag');
            const otherEl = document.getElementById('purchaseColdStorageOtherCharge');
            const companyExpenseEl = document.getElementById('purchaseColdStorageCompanyExpense');
            const costEl = document.getElementById('purchaseColdStorageCost');
            const moveQtyEl = document.getElementById('purchaseColdMoveQty');
            const moveBagsEl = document.getElementById('purchaseColdMoveBags');
            const storageNameEl = document.getElementById('purchaseColdStorageName');
            const storageVendorEl = document.getElementById('purchaseColdStorageVendorName');
            const remarksEl = document.getElementById('purchaseColdStorageRemarks');
            const companyExpenseReasonEl = document.getElementById('purchaseColdStorageCompanyExpenseReason');
            if (toggleEl) toggleEl.checked = false;
            if (fieldsEl) fieldsEl.style.display = 'grid';
            if (rentEl) rentEl.value = '';
            if (inEl) inEl.value = '';
            if (outEl) outEl.value = '';
            if (otherEl) otherEl.value = '';
            if (companyExpenseEl) companyExpenseEl.value = '';
            if (costEl) costEl.value = '';
            if (moveQtyEl) moveQtyEl.value = '';
            if (moveBagsEl) moveBagsEl.value = '';
            if (storageNameEl) storageNameEl.value = '';
            if (storageVendorEl) storageVendorEl.value = '';
            if (remarksEl) remarksEl.value = '';
            if (companyExpenseReasonEl) companyExpenseReasonEl.value = '';
            if (typeof switchPurchaseItemTab === 'function') switchPurchaseItemTab('basic');
            calculatePurchaseColdStorageCost();
        }

        function togglePurchaseColdStorageFields() {
            const toggleEl = document.getElementById('purchaseColdStorageToggle');
            const fieldsEl = document.getElementById('purchaseColdStorageFields');
            if (!toggleEl || !fieldsEl) return;
            fieldsEl.style.display = 'grid';
            if (typeof switchPurchaseItemTab === 'function') switchPurchaseItemTab(toggleEl.checked ? 'cold' : 'basic');
            if (!toggleEl.checked) {
                const rentEl = document.getElementById('purchaseColdStorageRentPerKg');
                const inEl = document.getElementById('purchaseColdStorageInPerBag');
                const outEl = document.getElementById('purchaseColdStorageOutPerBag');
                const otherEl = document.getElementById('purchaseColdStorageOtherCharge');
                const companyExpenseEl = document.getElementById('purchaseColdStorageCompanyExpense');
                const costEl = document.getElementById('purchaseColdStorageCost');
                const moveQtyEl = document.getElementById('purchaseColdMoveQty');
                const moveBagsEl = document.getElementById('purchaseColdMoveBags');
                const storageNameEl = document.getElementById('purchaseColdStorageName');
                const storageVendorEl = document.getElementById('purchaseColdStorageVendorName');
                const companyExpenseReasonEl = document.getElementById('purchaseColdStorageCompanyExpenseReason');
                if (rentEl) rentEl.value = '';
                if (inEl) inEl.value = '';
                if (outEl) outEl.value = '';
                if (otherEl) otherEl.value = '';
                if (companyExpenseEl) companyExpenseEl.value = '';
                if (costEl) costEl.value = '';
                if (moveQtyEl) moveQtyEl.value = '';
                if (moveBagsEl) moveBagsEl.value = '';
                if (storageNameEl) storageNameEl.value = '';
                if (storageVendorEl) storageVendorEl.value = '';
                if (companyExpenseReasonEl) companyExpenseReasonEl.value = '';
                return;
            }
            calculatePurchaseColdStorageCost();
        }

        let editingPurchaseItemIndex = -1;

        function addItemToPurchase() {
            const itemId = document.getElementById('purchaseItem').value;
            const supplierId = document.getElementById('purchaseSupplier').value;
            const date = (document.getElementById('purchaseDate') && document.getElementById('purchaseDate').value) ? document.getElementById('purchaseDate').value : '';
            const truck = (document.getElementById('purchaseTruck') && document.getElementById('purchaseTruck').value) ? document.getElementById('purchaseTruck').value.trim() : '';
            const lrNumber = (document.getElementById('purchaseLRNumber') && document.getElementById('purchaseLRNumber').value) ? document.getElementById('purchaseLRNumber').value.trim() : '';
            const kaantaParchi = (document.getElementById('purchaseKaantaParchi') && document.getElementById('purchaseKaantaParchi').value) ? document.getElementById('purchaseKaantaParchi').value.trim() : '';
            const grossWeight = parseFloat(document.getElementById('purchaseQuantity').value);
            const bags = parseFloat(document.getElementById('purchaseBags').value) || 0;
            const discountQty = parseFloat(document.getElementById('purchaseDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('purchaseRate').value) || 0;
            const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
            const isColdStorage = !!(document.getElementById('purchaseColdStorageToggle') && document.getElementById('purchaseColdStorageToggle').checked);
            const coldStorageRentPerKg = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageRentPerKg') && document.getElementById('purchaseColdStorageRentPerKg').value) || 0);
            const coldStorageInPerBag = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageInPerBag') && document.getElementById('purchaseColdStorageInPerBag').value) || 0);
            const coldStorageOutPerBag = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageOutPerBag') && document.getElementById('purchaseColdStorageOutPerBag').value) || 0);
            const coldStorageOtherCharge = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageOtherCharge') && document.getElementById('purchaseColdStorageOtherCharge').value) || 0);
            const coldStorageCompanyExpense = Math.max(0, parseFloat(document.getElementById('purchaseColdStorageCompanyExpense') && document.getElementById('purchaseColdStorageCompanyExpense').value) || 0);
            const coldStorageCompanyExpenseReason = (document.getElementById('purchaseColdStorageCompanyExpenseReason') && document.getElementById('purchaseColdStorageCompanyExpenseReason').value) ? document.getElementById('purchaseColdStorageCompanyExpenseReason').value.trim() : '';
            const coldMoveQtyInput = parseFloat(document.getElementById('purchaseColdMoveQty') && document.getElementById('purchaseColdMoveQty').value);
            const coldMoveBagsInput = parseFloat(document.getElementById('purchaseColdMoveBags') && document.getElementById('purchaseColdMoveBags').value);
            const selectedColdStorage = resolveColdStorageSelection('purchaseColdStorageName');
            const coldStorageId = selectedColdStorage.id;
            const coldStorageName = selectedColdStorage.name;
            const coldStorageVendorName = (document.getElementById('purchaseColdStorageVendorName') && document.getElementById('purchaseColdStorageVendorName').value) ? document.getElementById('purchaseColdStorageVendorName').value.trim() : '';
            const coldStorageRemarks = (document.getElementById('purchaseColdStorageRemarks') && document.getElementById('purchaseColdStorageRemarks').value) ? document.getElementById('purchaseColdStorageRemarks').value.trim() : '';
            
            if (!date || !supplierId || !itemId || !grossWeight) {
                alert('Please select date, supplier, item and enter gross weight');
                return;
            }
            
            const supplier = appData.suppliers.find(s => s.id == supplierId);
            const item = appData.items.find(i => i.id == itemId);
            if (!supplier || !item) {
                alert('Invalid supplier or item selected');
                return;
            }
            let netWeight = grossWeight;
            let total = 0;
            
            if (item.name.toLowerCase().includes('coconut')) {
                // For coconut: Net Quantity = Gross - Discount
                if (!rate) {
                    alert('Please enter rate per unit');
                    return;
                }
                netWeight = grossWeight - discountQty;
                total = netWeight * rate;
            } else if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                if (!amount) {
                    alert('Please enter total amount for quantity items');
                    return;
                }
                total = amount;
                netWeight = grossWeight;
            } else {
                if (!rate) {
                    alert('Please enter rate per unit');
                    return;
                }
                var discountVal = parseFloat(document.getElementById('purchaseDiscount').value) || 0;
                netWeight = grossWeight - discountVal;
                total = netWeight * rate;
            }
            // Use edited net weight from input if user changed it
            var inputNet = parseFloat(document.getElementById('purchaseNetWeight').value);
            if (!isNaN(inputNet) && inputNet >= 0) {
                netWeight = inputNet;
                if (item.name.toLowerCase().includes('coconut')) total = netWeight * rate;
                else if (item.unit.toLowerCase() !== 'qty' && item.unit.toLowerCase() !== 'quantity') total = netWeight * rate;
            }
            const coldMoveQty = isColdStorage ? Math.max(0, !isNaN(coldMoveQtyInput) ? coldMoveQtyInput : grossWeight) : 0;
            const coldMoveBags = isColdStorage ? Math.max(0, !isNaN(coldMoveBagsInput) ? coldMoveBagsInput : bags) : 0;
            const coldStorageCost = isColdStorage
                ? ((Math.max(0, coldMoveQty) * coldStorageRentPerKg) + (Math.max(0, coldMoveBags) * (coldStorageInPerBag + coldStorageOutPerBag)) + coldStorageOtherCharge)
                : 0;
            if (isColdStorage && (!coldStorageName || !coldStorageVendorName)) {
                alert('Please enter Cold Storage Name and Cold Storage Vendor Name.');
                return;
            }
            if (isColdStorage && coldMoveQty <= 0) {
                alert('Please enter Move Qty to Cold (must be greater than zero).');
                return;
            }
            if (isColdStorage && coldMoveQty - Math.max(0, grossWeight) > 0.0001) {
                alert('Move Qty to Cold cannot exceed gross quantity.');
                return;
            }
            if (isColdStorage && coldMoveBags - Math.max(0, bags) > 0.0001) {
                alert('Move Bags to Cold cannot exceed line bags.');
                return;
            }
            
            const purchaseItem = {
                id: (editingPurchaseItemIndex >= 0 && currentPurchaseItems[editingPurchaseItemIndex])
                    ? currentPurchaseItems[editingPurchaseItemIndex].id
                    : Date.now(),
                supplierId: supplierId,
                supplierName: supplier.name,
                date: date,
                truck: truck,
                lrNumber: lrNumber,
                kaantaParchi: kaantaParchi,
                itemId: itemId,
                itemName: item.name,
                grossWeight: grossWeight,
                bags: bags,
                netWeight: netWeight,
                discountQty: discountQty, // Store discount for reference
                rate: rate,
                total: total, // Invoice amount = rate x net quantity
                isCoconut: item.name.toLowerCase().includes('coconut'), // Flag for special handling
                isColdStorage: isColdStorage,
                coldStorageRentPerKg: isColdStorage ? coldStorageRentPerKg : 0,
                coldStorageInPerBag: isColdStorage ? coldStorageInPerBag : 0,
                coldStorageOutPerBag: isColdStorage ? coldStorageOutPerBag : 0,
                coldStorageInOutPerBag: isColdStorage ? (coldStorageInPerBag + coldStorageOutPerBag) : 0,
                coldStorageOtherCharge: isColdStorage ? coldStorageOtherCharge : 0,
                coldStorageCompanyExpense: isColdStorage ? +coldStorageCompanyExpense.toFixed(2) : 0,
                coldStorageCompanyExpenseReason: isColdStorage ? coldStorageCompanyExpenseReason : '',
                coldMoveQty: isColdStorage ? +coldMoveQty.toFixed(2) : 0,
                coldMoveBags: isColdStorage ? +coldMoveBags.toFixed(2) : 0,
                coldStorageId: isColdStorage ? coldStorageId : '',
                coldStorageName: isColdStorage ? coldStorageName : '',
                coldStorageVendorName: isColdStorage ? coldStorageVendorName : '',
                coldStorageCost: isColdStorage ? +coldStorageCost.toFixed(2) : 0,
                coldStorageRemarks: isColdStorage ? coldStorageRemarks : ''
            };
            
            if (editingPurchaseItemIndex >= 0) {
                currentPurchaseItems[editingPurchaseItemIndex] = purchaseItem;
                editingPurchaseItemIndex = -1;
                resetPurchaseItemFormMode();
            } else {
                currentPurchaseItems.push(purchaseItem);
            }
            updateCurrentPurchaseItemsDisplay();
            calculatePurchaseTotals();
            
            // Clear item form
            document.getElementById('purchaseItem').value = '';
            document.getElementById('purchaseQuantity').value = '';
            document.getElementById('purchaseBags').value = '';
            document.getElementById('purchaseDiscount').value = '0';
            document.getElementById('purchaseNetWeight').value = '';
            document.getElementById('purchaseDiscountQty').value = '0';
            document.getElementById('purchaseRate').value = '';
            document.getElementById('purchaseAmount').value = '';
            document.getElementById('purchaseItemTotal').value = '';
            const coldMoveQtyEl = document.getElementById('purchaseColdMoveQty');
            const coldMoveBagsEl = document.getElementById('purchaseColdMoveBags');
            if (coldMoveQtyEl) coldMoveQtyEl.value = '';
            if (coldMoveBagsEl) coldMoveBagsEl.value = '';
            var pkp = document.getElementById('purchaseKaantaParchi');
            if (pkp) pkp.value = '';
            document.getElementById('purchaseDiscountQtyContainer').style.display = 'none';
            document.getElementById('purchaseBagsContainer').style.display = 'block';
            resetPurchaseColdStorageInputs();
        }

        function editItemInPurchase(index) {
            const item = currentPurchaseItems[index];
            if (!item) return;
            editingPurchaseItemIndex = index;

            const supplierEl = document.getElementById('purchaseSupplier');
            if (supplierEl) {
                let supplierOpt = supplierEl.querySelector('option[value="' + item.supplierId + '"]');
                if (!supplierOpt && item.supplierId != null) {
                    supplierOpt = document.createElement('option');
                    supplierOpt.value = item.supplierId;
                    supplierOpt.textContent = (item.supplierName || 'Supplier') + ' (Editing)';
                    supplierEl.appendChild(supplierOpt);
                }
                supplierEl.value = item.supplierId || '';
            }
            if (typeof syncPurchaseSupplierDisplay === 'function') syncPurchaseSupplierDisplay();

            const purchaseItemEl = document.getElementById('purchaseItem');
            if (purchaseItemEl) {
                let itemOpt = purchaseItemEl.querySelector('option[value="' + item.itemId + '"]');
                if (!itemOpt && item.itemId != null) {
                    itemOpt = document.createElement('option');
                    itemOpt.value = item.itemId;
                    itemOpt.textContent = (item.itemName || 'Item') + ' (Editing)';
                    purchaseItemEl.appendChild(itemOpt);
                }
                purchaseItemEl.value = item.itemId || '';
            }
            if (typeof updatePurchaseInputs === 'function') updatePurchaseInputs();

            document.getElementById('purchaseQuantity').value = item.grossWeight || '';
            document.getElementById('purchaseBags').value = item.bags || 0;
            const discountVal = Math.max(0, (parseFloat(item.grossWeight) || 0) - (parseFloat(item.netWeight) || 0));
            document.getElementById('purchaseDiscount').value = item.isCoconut ? 0 : (item.bags || discountVal || 0);
            document.getElementById('purchaseDiscountQty').value = item.discountQty || 0;
            document.getElementById('purchaseRate').value = item.rate || '';
            document.getElementById('purchaseAmount').value = item.total || '';
            var pkp = document.getElementById('purchaseKaantaParchi');
            if (pkp) pkp.value = item.kaantaParchi || '';
            if (item.date) document.getElementById('purchaseDate').value = item.date;
            document.getElementById('purchaseTruck').value = item.truck || '';
            var plrEdit = document.getElementById('purchaseLRNumber');
            if (plrEdit) plrEdit.value = item.lrNumber || '';
            const coldToggleEl = document.getElementById('purchaseColdStorageToggle');
            const coldRentEl = document.getElementById('purchaseColdStorageRentPerKg');
            const coldInEl = document.getElementById('purchaseColdStorageInPerBag');
            const coldOutEl = document.getElementById('purchaseColdStorageOutPerBag');
            const coldOtherEl = document.getElementById('purchaseColdStorageOtherCharge');
            const coldCompanyExpenseEl = document.getElementById('purchaseColdStorageCompanyExpense');
            const coldMoveQtyEl = document.getElementById('purchaseColdMoveQty');
            const coldMoveBagsEl = document.getElementById('purchaseColdMoveBags');
            const coldStorageNameEl = document.getElementById('purchaseColdStorageName');
            const coldStorageVendorEl = document.getElementById('purchaseColdStorageVendorName');
            const coldRemarksEl = document.getElementById('purchaseColdStorageRemarks');
            const coldCompanyExpenseReasonEl = document.getElementById('purchaseColdStorageCompanyExpenseReason');
            if (coldToggleEl) coldToggleEl.checked = !!item.isColdStorage;
            if (coldRentEl) coldRentEl.value = item.coldStorageRentPerKg || 0;
            if (coldInEl) coldInEl.value = (item.coldStorageInPerBag != null ? item.coldStorageInPerBag : (item.coldStorageInOutPerBag || 0));
            if (coldOutEl) coldOutEl.value = (item.coldStorageOutPerBag != null ? item.coldStorageOutPerBag : 0);
            if (coldOtherEl) coldOtherEl.value = item.coldStorageOtherCharge || 0;
            if (coldCompanyExpenseEl) coldCompanyExpenseEl.value = item.coldStorageCompanyExpense || 0;
            if (coldMoveQtyEl) coldMoveQtyEl.value = (item.coldMoveQty != null ? item.coldMoveQty : item.grossWeight || 0);
            if (coldMoveBagsEl) coldMoveBagsEl.value = (item.coldMoveBags != null ? item.coldMoveBags : item.bags || 0);
            if (coldStorageNameEl) {
                populateColdStorageSelect('purchaseColdStorageName', 'Select cold storage', item.coldStorageId || '', item.coldStorageName || '');
            }
            if (coldStorageVendorEl) coldStorageVendorEl.value = item.coldStorageVendorName || '';
            if (coldRemarksEl) coldRemarksEl.value = item.coldStorageRemarks || '';
            if (coldCompanyExpenseReasonEl) coldCompanyExpenseReasonEl.value = item.coldStorageCompanyExpenseReason || '';
            togglePurchaseColdStorageFields();
            calculatePurchaseColdStorageCost();

            calculatePurchaseItemTotal();
            document.getElementById('purchaseNetWeight').value = item.netWeight || '';
            document.getElementById('purchaseItemTotal').value = (item.total != null) ? Number(item.total).toFixed(2) : '';

            const btn = document.querySelector('button[onclick="addItemToPurchase()"]');
            if (btn) {
                btn.textContent = 'Update Item';
                btn.classList.remove('bg-secondary');
                btn.classList.add('bg-amber-600');
            }

            updateCurrentPurchaseItemsDisplay();
            const target = document.getElementById('purchaseItem');
            if (target && typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function cancelEditPurchaseItem() {
            editingPurchaseItemIndex = -1;
            resetPurchaseItemFormMode();
            document.getElementById('purchaseItem').value = '';
            document.getElementById('purchaseQuantity').value = '';
            document.getElementById('purchaseBags').value = '';
            document.getElementById('purchaseDiscount').value = '0';
            document.getElementById('purchaseNetWeight').value = '';
            document.getElementById('purchaseDiscountQty').value = '0';
            document.getElementById('purchaseRate').value = '';
            document.getElementById('purchaseAmount').value = '';
            document.getElementById('purchaseItemTotal').value = '';
            var pkp = document.getElementById('purchaseKaantaParchi');
            if (pkp) pkp.value = '';
            resetPurchaseColdStorageInputs();
            if (typeof updatePurchaseInputs === 'function') updatePurchaseInputs();
            updateCurrentPurchaseItemsDisplay();
        }

        function resetPurchaseItemFormMode() {
            const btn = document.querySelector('button[onclick="addItemToPurchase()"]');
            if (btn) {
                btn.textContent = 'Add Item to Invoice';
                btn.classList.remove('bg-amber-600');
                btn.classList.add('bg-secondary');
            }
        }

        function updateCurrentPurchaseItemsDisplay() {
            const tbody = document.getElementById('currentPurchaseItems');
            const tfoot = document.getElementById('currentPurchaseItemsTotals');
            tbody.innerHTML = '';
            if (tfoot) tfoot.innerHTML = '';
            
            if (currentPurchaseItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="13" class="px-4 py-8 text-center text-slate-500">No items added yet</td></tr>';
                return;
            }
            
            const discountVal = (gross, net) => (gross != null && net != null && !isNaN(gross) && !isNaN(net)) ? (gross - net) : '';
            
            currentPurchaseItems.forEach((item, index) => {
                const row = document.createElement('tr');
                const isEditing = (index === editingPurchaseItemIndex);
                row.className = 'border-b border-slate-200' + (isEditing ? ' bg-amber-50' : '');
                const bagsDisplay = item.isCoconut ? (item.discountQty || 0) : (item.bags ?? '');
                const discountDisplay = discountVal(item.grossWeight, item.netWeight);
                const actionCell = isEditing
                    ? `<button type="button" class="js-cancel-edit-purchase text-slate-600 hover:text-slate-800 font-medium mr-3">Cancel</button>
                       <button type="button" class="js-remove-purchase-item text-red-500 hover:text-red-700 font-medium">Remove</button>`
                    : `<button type="button" class="js-edit-purchase-item text-blue-600 hover:text-blue-800 font-medium mr-3">Edit</button>
                       <button type="button" class="js-remove-purchase-item text-red-500 hover:text-red-700 font-medium">Remove</button>`;
                
                row.innerHTML = `
                    <td class="px-4 py-3">
                        <div>${escapeHtml(item.supplierName || '-')}</div>
                        <div class="text-xs text-slate-500">${escapeHtml(item.date || '-')} | ${escapeHtml(item.truck || '-')} | ${escapeHtml(item.lrNumber || '-')} | ${escapeHtml(item.cityName || item.city || '-')}</div>
                    </td>
                    <td class="px-4 py-3">${item.itemName}</td>
                    <td class="px-4 py-3">${item.grossWeight}</td>
                    <td class="px-4 py-3">${bagsDisplay}</td>
                    <td class="px-4 py-3">${discountDisplay}</td>
                    <td class="px-4 py-3">${item.netWeight}</td>
                    <td class="px-4 py-3">${RU}${item.rate}</td>
                    <td class="px-4 py-3">${RU}${item.total.toFixed(2)}</td>
                    <td class="px-4 py-3">${escapeHtml(item.kaantaParchi || '-')}</td>
                    <td class="px-4 py-3">${item.isColdStorage ? 'Yes' : '-'}</td>
                    <td class="px-4 py-3">${item.isColdStorage ? (RU + (parseFloat(item.coldStorageCost) || 0).toFixed(2)) : '-'}</td>
                    <td class="px-4 py-3">${item.isColdStorage ? escapeHtml(item.coldStorageRemarks || '-') : '-'}</td>
                    <td class="px-4 py-3">${actionCell}</td>
                `;
                const editBtn = row.querySelector('.js-edit-purchase-item');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        editItemInPurchase(index);
                    });
                }
                const cancelBtn = row.querySelector('.js-cancel-edit-purchase');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        cancelEditPurchaseItem();
                    });
                }
                const removeBtn = row.querySelector('.js-remove-purchase-item');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        removeItemFromPurchase(index);
                    });
                }
                tbody.appendChild(row);
            });
            const totals = currentPurchaseItems.reduce(function(acc, item) {
                const bagsVal = item.isCoconut ? (parseFloat(item.discountQty) || 0) : (parseFloat(item.bags) || 0);
                acc.gross += parseFloat(item.grossWeight) || 0;
                acc.bags += bagsVal;
                acc.net += parseFloat(item.netWeight) || 0;
                acc.amount += parseFloat(item.total) || 0;
                return acc;
            }, { gross: 0, bags: 0, net: 0, amount: 0 });
            if (tfoot) {
                tfoot.innerHTML = `
                    <tr class="bg-slate-100 border-t border-slate-300">
                        <td class="px-4 py-3 text-right font-semibold text-slate-700" colspan="2">Totals</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.gross.toFixed(2)}</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.bags.toFixed(2)}</td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.net.toFixed(2)}</td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${RU}${totals.amount.toFixed(2)}</td>
                        <td class="px-4 py-3" colspan="5"></td>
                    </tr>
                `;
            }
            renderPurchaseSupplierChargeRows();
        }

        function removeItemFromPurchase(index) {
            if (editingPurchaseItemIndex === index) {
                editingPurchaseItemIndex = -1;
                resetPurchaseItemFormMode();
            } else if (editingPurchaseItemIndex > index) {
                editingPurchaseItemIndex -= 1;
            }
            currentPurchaseItems.splice(index, 1);
            updateCurrentPurchaseItemsDisplay();
            calculatePurchaseTotals();
        }

        function getPurchaseChargeMode() {
            const selected = document.querySelector('input[name="purchaseChargeMode"]:checked');
            return selected ? selected.value : 'total';
        }

        function getCurrentPurchaseSupplierGroups() {
            const grouped = {};
            currentPurchaseItems.forEach(item => {
                const supplierId = item.supplierId;
                if (!supplierId) return;
                if (!grouped[supplierId]) {
                    grouped[supplierId] = {
                        supplierId: supplierId,
                        supplierName: item.supplierName || 'Unknown',
                        items: [],
                        itemsTotal: 0
                    };
                }
                grouped[supplierId].items.push(item);
                grouped[supplierId].itemsTotal += (item.total || 0);
            });
            return grouped;
        }

        function renderPurchaseSupplierChargeRows() {
            const body = document.getElementById('purchaseSupplierChargesBody');
            if (!body) return;
            const groups = Object.values(getCurrentPurchaseSupplierGroups());
            if (groups.length === 0) {
                body.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">Add items with suppliers to enter manual charges</td></tr>';
                return;
            }

            const currentInputs = {};
            body.querySelectorAll('tr[data-supplier-id]').forEach(row => {
                const supplierId = row.getAttribute('data-supplier-id');
                currentInputs[supplierId] = {
                    hammali: parseFloat(row.querySelector('.purchase-supplier-charge-hammali')?.value) || 0,
                    advance: parseFloat(row.querySelector('.purchase-supplier-charge-advance')?.value) || 0,
                    other: parseFloat(row.querySelector('.purchase-supplier-charge-other')?.value) || 0
                };
            });

            body.innerHTML = groups.map(group => {
                const existing = currentInputs[group.supplierId] || { hammali: 0, advance: 0, other: 0 };
                return `
                    <tr class="border-b border-slate-200" data-supplier-id="${group.supplierId}">
                        <td class="px-4 py-3">${escapeHtml(group.supplierName)}</td>
                        <td class="px-4 py-3">${RU}${group.itemsTotal.toFixed(2)}</td>
                        <td class="px-4 py-3"><input type="number" class="purchase-supplier-charge-hammali w-full p-2 border border-slate-300 rounded" value="${existing.hammali}" oninput="calculatePurchaseTotals()"></td>
                        <td class="px-4 py-3"><input type="number" class="purchase-supplier-charge-advance w-full p-2 border border-slate-300 rounded" value="${existing.advance}" oninput="calculatePurchaseTotals()"></td>
                        <td class="px-4 py-3"><input type="number" class="purchase-supplier-charge-other w-full p-2 border border-slate-300 rounded" value="${existing.other}" oninput="calculatePurchaseTotals()"></td>
                    </tr>
                `;
            }).join('');
        }

        function getManualSupplierCharges() {
            const rows = document.querySelectorAll('#purchaseSupplierChargesBody tr[data-supplier-id]');
            const chargesBySupplier = {};
            rows.forEach(row => {
                const supplierId = row.getAttribute('data-supplier-id');
                chargesBySupplier[supplierId] = {
                    hammali: parseFloat(row.querySelector('.purchase-supplier-charge-hammali')?.value) || 0,
                    advance: parseFloat(row.querySelector('.purchase-supplier-charge-advance')?.value) || 0,
                    other: parseFloat(row.querySelector('.purchase-supplier-charge-other')?.value) || 0
                };
            });
            return chargesBySupplier;
        }

        function onPurchaseChargeModeChange() {
            const mode = getPurchaseChargeMode();
            const totalChargesSection = document.getElementById('purchaseTotalChargesSection');
            const totalOthersSection = document.getElementById('purchaseTotalOthersSection');
            const supplierChargesSection = document.getElementById('purchaseSupplierChargesSection');
            if (totalChargesSection) totalChargesSection.classList.toggle('hidden', mode !== 'total');
            if (totalOthersSection) totalOthersSection.classList.toggle('hidden', mode !== 'total');
            if (supplierChargesSection) supplierChargesSection.classList.toggle('hidden', mode !== 'supplier-wise');
            renderPurchaseSupplierChargeRows();
            calculatePurchaseTotals();
        }

        // Purchase Others management
        let purchaseOthersIndex = 1;
        
        function syncPurchaseOthersRowState(row) {
            if (!row) return;
            const isDone = row.dataset.done === 'true';
            const categoryEl = row.querySelector('.purchase-others-category');
            const reasonEl = row.querySelector('.purchase-others-reason');
            const amountEl = row.querySelector('.purchase-others-amount');
            const operationEl = row.querySelector('.purchase-others-operation');
            [categoryEl, reasonEl, amountEl, operationEl].forEach(el => {
                if (el) el.disabled = isDone;
            });
            const doneBtn = row.querySelector('.purchase-others-done-btn');
            const editBtn = row.querySelector('.purchase-others-edit-btn');
            if (doneBtn) doneBtn.classList.toggle('hidden', isDone);
            if (editBtn) editBtn.classList.toggle('hidden', !isDone);
        }
        
        function attachPurchaseOthersRowBehavior(row) {
            if (!row) return;
            row.classList.remove('md:grid-cols-3', 'md:grid-cols-4');
            row.classList.add('md:grid-cols-5');
            if (!row.dataset.index) {
                row.dataset.index = String(purchaseOthersIndex++);
            }
            if (!row.dataset.done) row.dataset.done = 'false';
            const rowIndex = row.getAttribute('data-index');
            const catSelect = row.querySelector('.purchase-others-category');
            const otherWrap = row.querySelector('.purchase-others-other-reason-wrap');
            if (catSelect && otherWrap) {
                otherWrap.style.display = catSelect.value === 'Other' ? 'block' : 'none';
                catSelect.addEventListener('change', function() {
                    otherWrap.style.display = this.value === 'Other' ? 'block' : 'none';
                    row.dataset.done = 'false';
                    syncPurchaseOthersRowState(row);
                });
            }
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(function(input) {
                if (input.classList.contains('purchase-others-category')) return;
                input.addEventListener('input', function() {
                    row.dataset.done = 'false';
                    syncPurchaseOthersRowState(row);
                });
                input.addEventListener('change', function() {
                    row.dataset.done = 'false';
                    syncPurchaseOthersRowState(row);
                });
            });
            if (!row.querySelector('.purchase-others-actions')) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'purchase-others-actions flex items-end gap-2';
                actionsDiv.innerHTML = `
                    <button type="button" onclick="donePurchaseOthersRow(${rowIndex})" class="purchase-others-done-btn flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Done</button>
                    <button type="button" onclick="editPurchaseOthersRow(${rowIndex})" class="purchase-others-edit-btn hidden flex-1 p-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Edit</button>
                    <button type="button" onclick="removePurchaseOthersRow(${rowIndex})" class="purchase-others-remove-btn p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>
                `;
                row.appendChild(actionsDiv);
            }
            syncPurchaseOthersRowState(row);
        }
        
        function initializePurchaseOthersRows() {
            const rows = document.querySelectorAll('.purchase-others-row');
            let maxIndex = 0;
            rows.forEach(function(row, idx) {
                if (!row.getAttribute('data-index')) {
                    row.setAttribute('data-index', String(idx));
                }
                const currentIndex = parseInt(row.getAttribute('data-index'), 10);
                if (!isNaN(currentIndex)) maxIndex = Math.max(maxIndex, currentIndex);
                attachPurchaseOthersRowBehavior(row);
            });
            purchaseOthersIndex = maxIndex + 1;
        }
        
        function donePurchaseOthersRow(index) {
            const row = document.querySelector('.purchase-others-row[data-index="' + String(index) + '"]');
            if (!row) return;
            const catEl = row.querySelector('.purchase-others-category');
            const reasonEl = row.querySelector('.purchase-others-reason');
            const amountEl = row.querySelector('.purchase-others-amount');
            const reason = catEl ? (catEl.value === 'Other' ? ((reasonEl && reasonEl.value) || '').trim() : catEl.value) : ((reasonEl && reasonEl.value) || '').trim();
            const amount = parseFloat((amountEl && amountEl.value) || 0) || 0;
            if (!reason || amount <= 0) {
                alert('Please enter a valid reason/category and amount before clicking Done.');
                return;
            }
            row.dataset.done = 'true';
            syncPurchaseOthersRowState(row);
            calculatePurchaseTotals();
        }
        
        function editPurchaseOthersRow(index) {
            const row = document.querySelector('.purchase-others-row[data-index="' + String(index) + '"]');
            if (!row) return;
            row.dataset.done = 'false';
            syncPurchaseOthersRowState(row);
            calculatePurchaseTotals();
        }
        
        function addPurchaseOthersRow() {
            const container = document.getElementById('purchaseOthersContainer');
            const newRow = document.createElement('div');
            newRow.className = 'purchase-others-row grid grid-cols-1 md:grid-cols-4 gap-4 mb-3';
            newRow.setAttribute('data-index', purchaseOthersIndex);
            newRow.innerHTML = `
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select class="purchase-others-category w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="Cold Storage Rent">Cold Storage Rent</option>
                        <option value="Labour">Labour</option>
                        <option value="Transport">Transport</option>
                        <option value="Stocking">Stocking</option>
                        <option value="Seed Investment">Seed Investment</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="purchase-others-other-reason-wrap" style="display: none;">
                    <label class="block text-sm font-medium text-slate-700 mb-2">Specify (Other)</label>
                    <input type="text" class="purchase-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                    <input type="number" class="purchase-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                    <select class="purchase-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="add">Add (+)</option>
                        <option value="reduce">Reduce (-)</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button type="button" onclick="removePurchaseOthersRow(${purchaseOthersIndex})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>
                </div>
            `;
            container.appendChild(newRow);
            attachPurchaseOthersRowBehavior(newRow);
            purchaseOthersIndex++;
        }
        
        function removePurchaseOthersRow(index) {
            const row = document.querySelector(`.purchase-others-row[data-index="${index}"]`);
            if (row) {
                row.remove();
                calculatePurchaseTotals();
            }
        }
        
        function getPurchaseOthersEntries() {
            const rows = document.querySelectorAll('.purchase-others-row');
            const entries = [];
            
            rows.forEach(row => {
                if (row.dataset.done !== 'true') return;
                const catEl = row.querySelector('.purchase-others-category');
                const reasonEl = row.querySelector('.purchase-others-reason');
                const reason = catEl ? (catEl.value === 'Other' ? (reasonEl && reasonEl.value) || '' : catEl.value) : (reasonEl && reasonEl.value) || '';
                const amount = parseFloat(row.querySelector('.purchase-others-amount').value) || 0;
                const operation = row.querySelector('.purchase-others-operation').value;
                
                if (amount > 0 && reason) {
                    entries.push({ reason, amount, operation });
                }
            });
            
            return entries;
        }

        function calculatePurchaseTotals() {
            const itemsTotal = currentPurchaseItems.reduce((sum, item) => sum + item.total, 0);
            const mode = getPurchaseChargeMode();
            let hammali = 0;
            let advance = 0;
            let othersTotal = 0;

            if (mode === 'supplier-wise') {
                const supplierCharges = getManualSupplierCharges();
                Object.keys(supplierCharges).forEach(supplierId => {
                    const charge = supplierCharges[supplierId];
                    hammali += charge.hammali;
                    advance += charge.advance;
                    othersTotal += charge.other;
                });
                document.getElementById('purchaseOthersDisplayContainer').style.display = othersTotal !== 0 ? 'block' : 'none';
                if (othersTotal !== 0) {
                    document.getElementById('purchaseOthersDisplay').textContent = Math.abs(othersTotal).toFixed(2);
                    document.getElementById('purchaseOthersSign').textContent = othersTotal >= 0 ? '+' : '-';
                }
            } else {
                hammali = parseFloat(document.getElementById('purchaseHammali').value) || 0;
                advance = parseFloat(document.getElementById('purchaseAdvance').value) || 0;
                const othersEntries = getPurchaseOthersEntries();
                othersEntries.forEach(entry => {
                    if (entry.operation === 'add') othersTotal += entry.amount;
                    else othersTotal -= entry.amount;
                });
                if (othersEntries.length > 0) {
                    document.getElementById('purchaseOthersDisplayContainer').style.display = 'block';
                    document.getElementById('purchaseOthersDisplay').textContent = Math.abs(othersTotal).toFixed(2);
                    document.getElementById('purchaseOthersSign').textContent = othersTotal >= 0 ? '+' : '-';
                } else {
                    document.getElementById('purchaseOthersDisplayContainer').style.display = 'none';
                }
            }

            let grandTotal = itemsTotal + hammali - advance + othersTotal;
            
            document.getElementById('purchaseItemsTotal').textContent = itemsTotal.toFixed(2);
            document.getElementById('purchaseHammaliDisplay').textContent = hammali.toFixed(2);
            document.getElementById('purchaseAdvanceDisplay').textContent = advance.toFixed(2);
            document.getElementById('purchaseGrandTotal').textContent = grandTotal.toFixed(2);
        }

        function savePurchaseInvoice() {
            const date = document.getElementById('purchaseDate').value;
            const invoice = document.getElementById('purchaseInvoice').value;
            const supplierId = document.getElementById('purchaseSupplier').value;
            const truck = document.getElementById('purchaseTruck').value;
            const lrNumber = (document.getElementById('purchaseLRNumber') && document.getElementById('purchaseLRNumber').value) ? document.getElementById('purchaseLRNumber').value.trim() : '';
            const chargeMode = getPurchaseChargeMode();
            const postInlineBrokerage = !!(document.getElementById('purchasePostBrokerageToggle') && document.getElementById('purchasePostBrokerageToggle').checked);
            const inlineBrokerageEntries = postInlineBrokerage ? getPurchaseBrokerageEntries() : [];
            const purchaseMessageTargets = [];
            const affectedPurchaseIds = [];
            
            if (!date || !invoice || currentPurchaseItems.length === 0) {
                alert('Please fill in all required fields and add at least one item');
                return;
            }
            if (postInlineBrokerage && inlineBrokerageEntries.length === 0) {
                alert('Please add at least one valid brokerage row (broker and amount) or turn off Post to Brokerage.');
                return;
            }

            const purchaseGroups = Object.values(getCurrentPurchaseSupplierGroups());
            if (purchaseGroups.length === 0) {
                alert('Please select supplier for each item before saving.');
                return;
            }
            const coldStorageMissingInfo = currentPurchaseItems.find(function(item) {
                return !!(item && item.isColdStorage && (!String(item.coldStorageName || '').trim() || !String(item.coldStorageVendorName || '').trim()));
            });
            if (coldStorageMissingInfo) {
                alert('Please enter Cold Storage Name and Vendor Name for all items marked Move to Cold Storage.');
                return;
            }

            const isEditingPurchase = editingPurchaseId !== null && editingPurchaseId !== undefined;
            if (isEditingPurchase) {
                const hammali = parseFloat(document.getElementById('purchaseHammali').value) || 0;
                const advance = parseFloat(document.getElementById('purchaseAdvance').value) || 0;
                const othersEntries = getPurchaseOthersEntries();
                const itemsTotal = currentPurchaseItems.reduce((sum, item) => sum + item.total, 0);
                let grandTotal = itemsTotal + hammali - advance;
                othersEntries.forEach(entry => {
                    if (entry.operation === 'add') grandTotal += entry.amount;
                    else grandTotal -= entry.amount;
                });

                const supplier = appData.suppliers.find(s => s.id == supplierId);
                if (!supplier) {
                    alert('Selected supplier not found');
                    return;
                }

                // Editing existing purchase
                const existingPurchase = appData.purchases.find(function(p) { return String(p.id) === String(editingPurchaseId); });
                if (!existingPurchase) {
                    alert('Original purchase entry not found for editing. Please reopen it and try again.');
                    return;
                }
                if (existingPurchase) {
                    const itemDates = collectUniqueNonEmpty(currentPurchaseItems.map(function(item) { return item.date || date; }));
                    const itemTrucks = collectUniqueNonEmpty(currentPurchaseItems.map(function(item) { return item.truck || truck; }));
                    const itemLrNumbers = collectUniqueNonEmpty(currentPurchaseItems.map(function(item) { return item.lrNumber || lrNumber; }));
                    const itemKaantaParchi = collectUniqueNonEmpty(currentPurchaseItems.map(function(item) { return item.kaantaParchi || ''; }));
                    // Reverse old inventory changes (using gross weight)
                    if (existingPurchase.items) {
                        existingPurchase.items.forEach(item => {
                            if (appData.inventory[item.itemId]) {
                                appData.inventory[item.itemId].quantity -= item.grossWeight;
                                appData.inventory[item.itemId].totalCost -= ((parseFloat(item.total) || 0) + (parseFloat(item.coldStorageCost) || 0));
                                if (appData.inventory[item.itemId].quantity <= 0) {
                                    delete appData.inventory[item.itemId];
                                }
                            }
                        });
                    }
                    
                    // Update purchase with new data
                    existingPurchase.date = itemDates[0] || date;
                    existingPurchase.invoice = invoice;
                    existingPurchase.masterInvoice = existingPurchase.masterInvoice || invoice;
                    existingPurchase.supplierId = supplierId;
                    existingPurchase.supplierName = supplier.name;
                    existingPurchase.truck = itemTrucks[0] || truck;
                    existingPurchase.lrNumber = itemLrNumbers[0] || lrNumber;
                    existingPurchase.multiDates = itemDates;
                    existingPurchase.multiTrucks = itemTrucks;
                    existingPurchase.multiLrNumbers = itemLrNumbers;
                    existingPurchase.multiKaantaParchi = itemKaantaParchi;
                    existingPurchase.inlineBrokerageEnabled = postInlineBrokerage;
                    existingPurchase.inlineBrokerageEntries = postInlineBrokerage ? inlineBrokerageEntries.map(function(entry) { return { brokerId: entry.brokerId, brokerName: entry.brokerName, amount: entry.amount }; }) : [];
                    existingPurchase.items = [...currentPurchaseItems];
                    existingPurchase.itemsTotal = itemsTotal;
                    existingPurchase.hammali = hammali;
                    existingPurchase.advance = advance;
                    existingPurchase.othersEntries = othersEntries;
                    existingPurchase.grandTotal = grandTotal;
                    existingPurchase.balance = grandTotal - (existingPurchase.paid || 0);
                    Object.assign(existingPurchase, getAuditMeta(false));
                    
                    // Add new inventory for updated purchase (using gross weight)
                    currentPurchaseItems.forEach(item => {
                        if (!appData.inventory[item.itemId]) {
                            appData.inventory[item.itemId] = { quantity: 0, totalCost: 0 };
                        }
                        appData.inventory[item.itemId].quantity += item.grossWeight;
                        appData.inventory[item.itemId].totalCost += ((parseFloat(item.total) || 0) + (parseFloat(item.coldStorageCost) || 0));
                    });
                    removeInlineBrokerageBySource('inline_purchase', existingPurchase.id);
                    if (postInlineBrokerage) {
                        pushInlineBrokerageEntries({
                            entries: inlineBrokerageEntries,
                            items: existingPurchase.items || [],
                            date: existingPurchase.date || date,
                            type: 'Purchase',
                            reference: existingPurchase.invoice || invoice,
                            source: 'inline_purchase',
                            sourceInvoiceId: existingPurchase.id,
                            sourceInvoiceNo: existingPurchase.invoice || invoice
                        });
                    }
                    purchaseMessageTargets.push(existingPurchase.id);
                    affectedPurchaseIds.push(existingPurchase.id);
                }
            } else {
                const manualCharges = getManualSupplierCharges();
                const totalHammali = parseFloat(document.getElementById('purchaseHammali').value) || 0;
                const totalAdvance = parseFloat(document.getElementById('purchaseAdvance').value) || 0;
                const totalOthersEntries = getPurchaseOthersEntries();
                const totalItemsValue = purchaseGroups.reduce((sum, group) => sum + group.itemsTotal, 0);
                const allocatedGroups = [];

                purchaseGroups.forEach(group => {
                    let hammali = 0;
                    let advance = 0;
                    let othersEntries = [];

                    if (chargeMode === 'supplier-wise') {
                        const charge = manualCharges[group.supplierId] || { hammali: 0, advance: 0, other: 0 };
                        hammali = charge.hammali;
                        advance = charge.advance;
                        if (charge.other !== 0) {
                            othersEntries = [{ reason: 'Manual supplier charge adjustment', amount: Math.abs(charge.other), operation: charge.other >= 0 ? 'add' : 'reduce' }];
                        }
                    } else {
                        const ratio = totalItemsValue > 0 ? (group.itemsTotal / totalItemsValue) : 0;
                        hammali = +(totalHammali * ratio).toFixed(2);
                        advance = +(totalAdvance * ratio).toFixed(2);
                        othersEntries = totalOthersEntries
                            .filter(entry => entry.amount > 0)
                            .map(entry => ({ reason: entry.reason, amount: +(entry.amount * ratio).toFixed(2), operation: entry.operation }))
                            .filter(entry => entry.amount > 0);
                    }

                    let grandTotal = group.itemsTotal + hammali - advance;
                    othersEntries.forEach(entry => {
                        if (entry.operation === 'add') grandTotal += entry.amount;
                        else grandTotal -= entry.amount;
                    });

                    allocatedGroups.push({
                        supplierId: group.supplierId,
                        supplierName: group.supplierName,
                        items: group.items,
                        itemsTotal: group.itemsTotal,
                        hammali: hammali,
                        advance: advance,
                        othersEntries: othersEntries,
                        grandTotal: +grandTotal.toFixed(2)
                    });
                });

                if (chargeMode === 'total' && allocatedGroups.length > 0) {
                    const allocatedGrand = allocatedGroups.reduce((sum, group) => sum + group.grandTotal, 0);
                    let expectedGrand = totalItemsValue + totalHammali - totalAdvance;
                    totalOthersEntries.forEach(entry => {
                        if (entry.operation === 'add') expectedGrand += entry.amount;
                        else expectedGrand -= entry.amount;
                    });
                    const delta = +(expectedGrand - allocatedGrand).toFixed(2);
                    if (delta !== 0) {
                        allocatedGroups[allocatedGroups.length - 1].grandTotal = +(allocatedGroups[allocatedGroups.length - 1].grandTotal + delta).toFixed(2);
                    }
                }

                const singleSupplierEntry = allocatedGroups.length === 1;
                const brokerageAllocations = postInlineBrokerage ? allocateBrokerageEntriesByGroups(inlineBrokerageEntries, allocatedGroups) : [];
                const createdPurchases = [];
                const existingInvoiceSet = new Set(
                    (appData.purchases || []).map(function(p) {
                        return String((p && p.invoice) || '').trim().toUpperCase();
                    }).filter(Boolean)
                );
                const reservedInvoiceSet = new Set();
                const groupInvoices = [];

                if (singleSupplierEntry) {
                    const rootTrim = String(invoice || '').trim().toUpperCase();
                    if (!isEditingPurchase && rootTrim && existingInvoiceSet.has(rootTrim)) {
                        alert('This Purchase invoice number is already used. Please use a unique invoice number.');
                        return;
                    }
                    groupInvoices.push(invoice);
                } else {
                    allocatedGroups.forEach(function(_group, idx) {
                        let suffix = idx + 1;
                        let selectedInvoice = '';
                        while (suffix < 10000 && !selectedInvoice) {
                            const candidate = invoice + '-' + suffix;
                            const candidateTrim = String(candidate || '').trim().toUpperCase();
                            if (candidateTrim && !existingInvoiceSet.has(candidateTrim) && !reservedInvoiceSet.has(candidateTrim)) {
                                selectedInvoice = candidate;
                                reservedInvoiceSet.add(candidateTrim);
                            }
                            suffix++;
                        }
                        if (!selectedInvoice) {
                            alert('Could not generate a unique invoice number. Please change the invoice and try again.');
                            return;
                        }
                        groupInvoices.push(selectedInvoice);
                    });
                }

                if (groupInvoices.length !== allocatedGroups.length) return;

                allocatedGroups.forEach((group, idx) => {
                    const groupInvoice = groupInvoices[idx];
                    const groupDates = collectUniqueNonEmpty(group.items.map(function(item) { return item.date || date; }));
                    const groupTrucks = collectUniqueNonEmpty(group.items.map(function(item) { return item.truck || truck; }));
                    const groupLrNumbers = collectUniqueNonEmpty(group.items.map(function(item) { return item.lrNumber || lrNumber; }));
                    const groupKaantaParchi = collectUniqueNonEmpty(group.items.map(function(item) { return item.kaantaParchi || ''; }));

                    const purchase = {
                        id: Date.now() + idx,
                        date: groupDates[0] || date,
                        invoice: groupInvoice,
                        masterInvoice: invoice,
                        supplierId: group.supplierId,
                        supplierName: group.supplierName,
                        truck: groupTrucks[0] || truck,
                        lrNumber: groupLrNumbers[0] || lrNumber,
                        multiDates: groupDates,
                        multiTrucks: groupTrucks,
                        multiLrNumbers: groupLrNumbers,
                        multiKaantaParchi: groupKaantaParchi,
                        inlineBrokerageEnabled: postInlineBrokerage,
                        inlineBrokerageEntries: postInlineBrokerage ? (brokerageAllocations[idx] || []) : [],
                        items: [...group.items],
                        itemsTotal: +group.itemsTotal.toFixed(2),
                        hammali: +group.hammali.toFixed(2),
                        advance: +group.advance.toFixed(2),
                        othersEntries: group.othersEntries,
                        grandTotal: group.grandTotal,
                        paid: 0,
                        balance: group.grandTotal,
                        sourceChargeMode: chargeMode,
                        ...getAuditMeta(true)
                    };
                    appData.purchases.push(purchase);
                    createdPurchases.push(purchase);
                    purchaseMessageTargets.push(purchase.id);
                    affectedPurchaseIds.push(purchase.id);
                });

                currentPurchaseItems.forEach(item => {
                    if (!appData.inventory[item.itemId]) {
                        appData.inventory[item.itemId] = { quantity: 0, totalCost: 0 };
                    }
                    appData.inventory[item.itemId].quantity += item.grossWeight;
                    appData.inventory[item.itemId].totalCost += ((parseFloat(item.total) || 0) + (parseFloat(item.coldStorageCost) || 0));
                });

                if (postInlineBrokerage) {
                    createdPurchases.forEach(function(createdPurchase, idx) {
                        pushInlineBrokerageEntries({
                            entries: brokerageAllocations[idx] || [],
                            items: createdPurchase.items || [],
                            date: createdPurchase.date || date,
                            type: 'Purchase',
                            reference: createdPurchase.invoice || invoice,
                            source: 'inline_purchase',
                            sourceInvoiceId: createdPurchase.id,
                            sourceInvoiceNo: createdPurchase.invoice || invoice
                        });
                    });
                }
            }
            syncPurchaseAutoColdLotsForPurchaseIds(affectedPurchaseIds);
            rebuildInventoryFromTransactions();
            
            saveData();
            updatePurchaseHistory();
            updateBrokerageHistory();
            updateDashboard();
            populateDropdowns();
            
            // Regenerate ledger only if type and entity are already selected (avoid "Please select ledger type and entity" alert)
            const ledgerTypeEl = document.getElementById('ledgerType');
            const ledgerEntityEl = document.getElementById('ledgerEntity');
            if (typeof generateLedger === 'function' && ledgerTypeEl && ledgerEntityEl && ledgerTypeEl.value && ledgerEntityEl.value) {
                generateLedger();
            }
            
            // Hide cancel button
            document.getElementById('cancelPurchaseEdit').classList.add('hidden');
            
            // Clear form and return to history view
            const wasEditing = editingPurchaseId !== null && editingPurchaseId !== undefined;
            clearPurchaseForm();
            editingPurchaseId = null;
            alert(wasEditing ? 'Purchase updated successfully!' : 'Purchase invoice(s) saved successfully!');

            if (purchaseMessageTargets.length > 0) {
                const doSend = confirm('Do you want to send this purchase invoice on WhatsApp now?');
                if (doSend) {
                    purchaseMessageTargets.forEach(function(id) { sendPurchaseWhatsApp(id); });
                }
            }
            
            // Return to history view
            hidePurchaseForm();
        }

        function clearPurchaseForm() {
            document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('purchaseInvoice').value = '';
            document.getElementById('purchaseSupplier').value = '';
            var psi = document.getElementById('purchaseSupplierInput');
            if (psi) psi.value = '';
            var psd = document.getElementById('purchaseSupplierDropdown');
            if (psd) psd.classList.add('hidden');
            document.getElementById('purchaseTruck').value = '';
            var plr = document.getElementById('purchaseLRNumber');
            if (plr) plr.value = '';
            var pkp = document.getElementById('purchaseKaantaParchi');
            if (pkp) pkp.value = '';
            document.getElementById('purchaseHammali').value = '';
            document.getElementById('purchaseAdvance').value = '';
            var pdEl = document.getElementById('purchaseDiscount');
            if (pdEl) pdEl.value = '0';
            resetPurchaseColdStorageInputs();
            
            // Clear all Others rows except the first one
            const container = document.getElementById('purchaseOthersContainer');
            container.innerHTML = `
                <div class="purchase-others-row grid grid-cols-1 md:grid-cols-4 gap-4 mb-3" data-index="0">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
                        <select class="purchase-others-category w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="Cold Storage Rent">Cold Storage Rent</option>
                            <option value="Labour">Labour</option>
                            <option value="Transport">Transport</option>
                            <option value="Stocking">Stocking</option>
                            <option value="Seed Investment">Seed Investment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="purchase-others-other-reason-wrap" style="display: none;">
                        <label class="block text-sm font-medium text-slate-700 mb-2">Specify (Other)</label>
                        <input type="text" class="purchase-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                        <input type="number" class="purchase-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                        <select class="purchase-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="add">Add (+)</option>
                            <option value="reduce">Reduce (-)</option>
                        </select>
                    </div>
                </div>
            `;
            initializePurchaseOthersRows();
            
            currentPurchaseItems = [];
            editingPurchaseItemIndex = -1;
            resetPurchaseItemFormMode();
            editingPurchaseId = null;
            updateCurrentPurchaseItemsDisplay();
            calculatePurchaseTotals();
        }

        function addPurchase() {
            const date = document.getElementById('purchaseDate').value;
            const invoice = document.getElementById('purchaseInvoice').value;
            const supplierId = document.getElementById('purchaseSupplier').value;
            const itemId = document.getElementById('purchaseItem').value;
            const quantity = parseFloat(document.getElementById('purchaseQuantity').value);
            
            if (!date || !invoice || !supplierId || !itemId || !quantity) {
                alert('Please fill in all required fields');
                return;
            }

            const invoiceTrim = (invoice || '').trim().toUpperCase();
            const isEditingPurchase = editingPurchaseId !== null && editingPurchaseId !== undefined;
            const editingIdStr = isEditingPurchase ? String(editingPurchaseId) : '';
            if (appData.purchases.some(function(p) {
                if ((p.invoice || '').trim().toUpperCase() !== invoiceTrim) return false;
                if (isEditingPurchase && String(p.id) === editingIdStr) return false;
                return true;
            })) {
                alert('This Purchase invoice number is already used. Please use a unique invoice number.');
                return;
            }
            
            const supplier = appData.suppliers.find(s => s.id == supplierId);
            const item = appData.items.find(i => i.id == itemId);
            
            if (!supplier || !item) {
                alert('Invalid supplier or item selected');
                return;
            }
            
            let total = 0;
            let rate = 0;
            
            if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                // For quantity-based items, use total amount
                const amount = parseFloat(document.getElementById('purchaseAmount').value);
                if (!amount) {
                    alert('Please enter the total amount');
                    return;
                }
                total = amount;
                rate = amount / quantity; // Calculate rate per unit for storage
            } else {
                // For weight-based items, use rate * quantity
                const unitRate = parseFloat(document.getElementById('purchaseRate').value);
                if (!unitRate) {
                    alert('Please enter the rate per unit');
                    return;
                }
                rate = unitRate;
                total = quantity * rate;
            }
            
            const purchase = {
                id: Date.now(),
                date: date,
                invoice: invoice,
                supplierId: supplierId,
                supplierName: supplier.name,
                itemId: itemId,
                itemName: item.name,
                quantity: quantity,
                rate: rate,
                total: total,
                ...getAuditMeta(true)
            };
            
            appData.purchases.push(purchase);
            
            // Update inventory
            if (!appData.inventory[itemId]) {
                appData.inventory[itemId] = { quantity: 0, totalCost: 0 };
            }
            appData.inventory[itemId].quantity += quantity;
            appData.inventory[itemId].totalCost += total;
            
            saveData();
            updatePurchaseHistory();
            updateDashboard();
            
            // Clear form
            document.getElementById('purchaseDate').value = '';
            document.getElementById('purchaseInvoice').value = '';
            document.getElementById('purchaseSupplier').value = '';
            document.getElementById('purchaseItem').value = '';
            document.getElementById('purchaseQuantity').value = '';
            document.getElementById('purchaseRate').value = '';
            document.getElementById('purchaseAmount').value = '';
            document.getElementById('purchaseTotal').textContent = '0';
            
            // Reset input visibility
            document.getElementById('purchaseRateContainer').style.display = 'block';
            document.getElementById('purchaseAmountContainer').style.display = 'none';
            document.getElementById('purchaseUnitDisplay').textContent = 'Select item first';
            
            alert('Purchase added successfully!');
        }

        // Store for filtered data
        let filteredPurchases = [];
        let filteredSales = [];
        let filteredBrokerage = [];
        let filteredDeductions = [];
        
        // Populate filter dropdowns
        function populateFilterDropdowns() {
            // Purchase supplier filter
            const purchaseSupplierFilter = document.getElementById('purchaseFilterSupplier');
            if (purchaseSupplierFilter) {
                const currentValue = purchaseSupplierFilter.value;
                purchaseSupplierFilter.innerHTML = '<option value="">All Suppliers</option>';
                appData.suppliers.forEach(s => {
                    purchaseSupplierFilter.innerHTML += `<option value="${s.id}">${s.name}</option>`;
                });
                purchaseSupplierFilter.value = currentValue;
            }
            
            // Sales customer filter
            const salesCustomerFilter = document.getElementById('salesFilterCustomer');
            if (salesCustomerFilter) {
                const currentValue = salesCustomerFilter.value;
                salesCustomerFilter.innerHTML = '<option value="">All Customers</option>';
                appData.customers.forEach(c => {
                    salesCustomerFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                });
                salesCustomerFilter.value = currentValue;
            }
            
            // Brokerage broker filter
            const brokerageFilterBroker = document.getElementById('brokerageFilterBroker');
            if (brokerageFilterBroker) {
                const currentValue = brokerageFilterBroker.value;
                brokerageFilterBroker.innerHTML = '<option value="">All Brokers</option>';
                appData.brokers.forEach(b => {
                    brokerageFilterBroker.innerHTML += `<option value="${b.id}">${b.name}</option>`;
                });
                brokerageFilterBroker.value = currentValue;
            }
            
            // Deductions customer filter
            const deductionsCustomerFilter = document.getElementById('deductionsFilterCustomer');
            if (deductionsCustomerFilter) {
                const currentValue = deductionsCustomerFilter.value;
                deductionsCustomerFilter.innerHTML = '<option value="">All Customers</option>';
                appData.customers.forEach(c => {
                    deductionsCustomerFilter.innerHTML += `<option value="${c.id}">${c.name}</option>`;
                });
                deductionsCustomerFilter.value = currentValue;
            }
        }
        
        // Filter Purchases
        function filterPurchases() {
            const search = (document.getElementById('purchaseSearch')?.value || '').toLowerCase();
            const supplierId = document.getElementById('purchaseFilterSupplier')?.value || '';
            const dateFrom = document.getElementById('purchaseDateFrom')?.value || '';
            const dateTo = document.getElementById('purchaseDateTo')?.value || '';
            const sortBy = document.getElementById('purchaseSort')?.value || 'date-desc';
            
            filteredPurchases = appData.purchases.filter(p => {
                // Search filter
                if (search) {
                    const searchFields = [p.invoice, p.supplierName, p.truck || ''].join(' ').toLowerCase();
                    if (!searchFields.includes(search)) return false;
                }
                // Supplier filter
                if (supplierId && p.supplierId != supplierId) return false;
                // Date filters
                if (dateFrom && p.date < dateFrom) return false;
                if (dateTo && p.date > dateTo) return false;
                return true;
            });
            
            // Sort
            filteredPurchases.sort((a, b) => {
                switch(sortBy) {
                    case 'date-asc': return new Date(a.date) - new Date(b.date);
                    case 'date-desc': return new Date(b.date) - new Date(a.date);
                    case 'amount-desc': return (b.grandTotal || b.total || 0) - (a.grandTotal || a.total || 0);
                    case 'amount-asc': return (a.grandTotal || a.total || 0) - (b.grandTotal || b.total || 0);
                    case 'supplier-asc': return (a.supplierName || '').localeCompare(b.supplierName || '');
                    case 'balance-desc': return ((b.grandTotal || 0) - (b.paid || 0)) - ((a.grandTotal || 0) - (a.paid || 0));
                    default: return new Date(b.date) - new Date(a.date);
                }
            });
            
            // Update count
            const countEl = document.getElementById('purchaseFilterCount');
            if (countEl) {
                countEl.textContent = `Showing ${filteredPurchases.length} of ${appData.purchases.length} purchases`;
            }
            
            // Reset to page 1 and render
            paginationState.purchases.currentPage = 1;
            renderPurchaseTable();
        }
        
        function clearPurchaseFilters() {
            document.getElementById('purchaseSearch').value = '';
            document.getElementById('purchaseFilterSupplier').value = '';
            document.getElementById('purchaseDateFrom').value = '';
            document.getElementById('purchaseDateTo').value = '';
            document.getElementById('purchaseSort').value = 'date-desc';
            filterPurchases();
        }
        
        function renderPurchaseTable() {
            const tbody = document.getElementById('purchaseHistory');
            closeRowActionMenus();
            tbody.innerHTML = '';
            
            if (filteredPurchases.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="px-4 py-12 text-center">
                            <div class="flex flex-col items-center text-slate-400">
                                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <p class="font-medium">No purchases found</p>
                                <p class="text-sm">Try adjusting your filters</p>
                            </div>
                        </td>
                    </tr>`;
                document.getElementById('purchasePagination').innerHTML = '';
                return;
            }
            
            const { currentPage, pageSize } = paginationState.purchases;
            const paginatedPurchases = getPaginatedData(filteredPurchases, currentPage, pageSize);
            
            paginatedPurchases.forEach((purchase, index) => {
                const itemsCount = purchase.items ? purchase.items.length : 1;
                const itemsText = purchase.items ? `${itemsCount} item${itemsCount > 1 ? 's' : ''}` : purchase.itemName || 'N/A';
                const grandTotal = purchase.grandTotal || purchase.total || 0;
                const paid = purchase.paid || 0;
                const currentBalance = grandTotal - paid;
                purchase.balance = currentBalance;
                const purchaseDateText = summarizeMultiValue(purchase.multiDates || [purchase.date], purchase.date || '-');
                const purchaseTruckText = summarizeMultiValue(purchase.multiTrucks || [purchase.truck], purchase.truck || '-');
                var linkedSales = (appData.sales || []).filter(function(s) {
                    return s.linkedPurchases && s.linkedPurchases.some(function(lp) {
                        return String(lp.purchaseId) === String(purchase.id);
                    });
                });
                var linkedDetails = linkedSales.map(function(s) {
                    var normalizedLinks = normalizeLinkedPurchasesForItems(s.linkedPurchases || [], s.items || []);
                    var qty = normalizedLinks.reduce(function(sum, lp) {
                        return String(lp.purchaseId) === String(purchase.id) ? (sum + getLinkedQtyValue(lp)) : sum;
                    }, 0);
                    var bags = normalizedLinks.reduce(function(sum, lp) {
                        return String(lp.purchaseId) === String(purchase.id) ? (sum + getLinkedBagsValue(lp)) : sum;
                    }, 0);
                    return {
                        invoice: s.invoice || ('Sale #' + s.id),
                        qty: qty,
                        bags: bags
                    };
                });
                var purchaseColdLots = (appData.coldStorageLots || []).filter(function(lot) {
                    return String(lot && lot.purchaseId || '') === String(purchase.id);
                });
                var purchaseHasColdMarkedItems = (purchase.items || []).some(function(item) {
                    return !!(item && item.isColdStorage);
                });
                var hasMovedToCold = purchaseColdLots.length > 0 || purchaseHasColdMarkedItems;
                var statusBadges = [];
                if (hasMovedToCold) {
                    var activeColdQty = purchaseColdLots.reduce(function(sum, lot) {
                        if (!lot || (lot.status || 'active') === 'released') return sum;
                        return sum + (parseFloat(lot.qtyInCold) || 0);
                    }, 0);
                    var coldStatusText = activeColdQty > 0.0001
                        ? ('Moved to Cold: ' + activeColdQty.toFixed(2) + ' kg in cold')
                        : 'Moved to Cold';
                    statusBadges.push('<span class="inline-block mr-1 mb-1 px-1.5 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800" title="Cold storage status for this purchase">' + escapeHtml(coldStatusText) + '</span>');
                }
                var linkedDetailsHtml = linkedDetails.length > 0
                    ? linkedDetails.map(function(entry) {
                        return '<div class="mb-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">' +
                            '<div class="font-semibold">' + escapeHtml(entry.invoice) + '</div>' +
                            '<div>Qty: ' + Number(entry.qty || 0).toFixed(2) + ' kg | Bags: ' + Number(entry.bags || 0).toFixed(2) + '</div>' +
                            '</div>';
                    }).join('')
                    : '<span class="text-xs text-slate-400">-</span>';
                var extraBadgesHtml = statusBadges.length > 0
                    ? '<div class="mt-1">' + statusBadges.join('') + '</div>'
                    : '';
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-blue-50/50 transition-colors align-top';
                row.innerHTML = `
                    <td class="px-4 py-3.5 text-sm whitespace-nowrap">
                        <span class="text-slate-600 font-medium">${escapeHtml(purchaseDateText)}</span>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                        <span class="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">${purchase.masterInvoice || purchase.invoice}</span>
                    </td>
                    <td class="px-4 py-3.5">
                        <span class="font-medium text-slate-700 text-sm">${escapeHtml(purchase.supplierName)}</span>
                    </td>
                    <td class="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">${escapeHtml(purchaseTruckText)}</td>
                    <td class="px-4 py-3.5">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            ${itemsText}
                        </span>
                    </td>
                    <td class="px-4 py-3.5 min-w-[220px]">
                        ${linkedDetailsHtml}
                        ${extraBadgesHtml}
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="font-semibold text-slate-800">${RU}${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="text-green-600 font-medium">${RU}${paid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${currentBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                            ${currentBalance > 0 ? RU + currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : 'Paid ' + CHECK}
                        </span>
                    </td>
                    <td class="px-4 py-3.5">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="viewPurchase(${purchase.id})" class="action-btn action-view" title="View"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg></button>
                            <button onclick="editPurchase(${purchase.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="printPurchaseInvoice(${purchase.id})" class="action-btn action-print" title="Print"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg></button>
                            <div class="relative row-action-menu-wrap">
                                <button type="button" onclick="toggleRowActionMenu(event, 'purchase-${purchase.id}')" class="action-btn row-action-more-btn" title="More actions" aria-haspopup="true" aria-expanded="false">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>
                                </button>
                                <div class="row-action-menu hidden absolute right-0 top-9 z-[90] min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); downloadPurchaseInvoiceWithLedgerJpg(${purchase.id});">Download Invoice + Ledger JPG</button>
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); sendPurchaseWhatsApp(${purchase.id});">Send WhatsApp</button>
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); payPurchase(${purchase.id});">Pay</button>
                                    <button type="button" class="row-action-menu-item row-action-menu-item-danger" onclick="closeRowActionMenus(); deletePurchase(${purchase.id});">Delete</button>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            renderPagination('purchasePagination', filteredPurchases.length, currentPage, pageSize, 'changePurchasePage', 'changePurchasePageSize');
        }
        
        function updatePurchaseHistory() {
            populateFilterDropdowns();
            filteredPurchases = [...appData.purchases];
            filterPurchases();
            
            // Update summary stats
            const totalCount = appData.purchases.length;
            const totalAmount = appData.purchases.reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
            const totalPaid = appData.purchases.reduce((sum, p) => {
                const payments = appData.payments.filter(pay => pay.type === 'purchase' && pay.invoiceId === p.id);
                return sum + payments.reduce((s, pay) => s + pay.amount, 0);
            }, 0);
            const pendingAmount = totalAmount - totalPaid;
            
            const countEl = document.getElementById('purchaseTotalCount');
            const amountEl = document.getElementById('purchaseTotalAmount');
            const pendingEl = document.getElementById('purchasePendingAmount');
            
            if (countEl) countEl.textContent = totalCount;
            if (amountEl) amountEl.textContent = `${RU}${(totalAmount/1000).toFixed(0)}K`;
            if (pendingEl) pendingEl.textContent = `${RU}${(pendingAmount/1000).toFixed(0)}K`;
        }

        // Calculate purchase total
        function calculatePurchaseTotal() {
            const itemId = document.getElementById('purchaseItem').value;
            const quantity = parseFloat(document.getElementById('purchaseQuantity').value) || 0;
            const purchaseTotalEl = document.getElementById('purchaseTotal');
            const purchaseItemTotalEl = document.getElementById('purchaseItemTotal');
            
            if (!itemId || !quantity) {
                if (purchaseTotalEl) purchaseTotalEl.textContent = '0';
                if (purchaseItemTotalEl) purchaseItemTotalEl.value = '0';
                return;
            }
            
            const item = appData.items.find(i => i.id == itemId);
            let total = 0;
            
            if (item.unit.toLowerCase() === 'qty' || item.unit.toLowerCase() === 'quantity') {
                // For quantity-based items, use total amount
                const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
                total = amount;
            } else {
                // For weight-based items, use rate * quantity
                const rate = parseFloat(document.getElementById('purchaseRate').value) || 0;
                total = quantity * rate;
            }
            
            if (purchaseTotalEl) purchaseTotalEl.textContent = total.toFixed(2);
            if (purchaseItemTotalEl) purchaseItemTotalEl.value = total.toFixed(2);
        }

        document.addEventListener('DOMContentLoaded', function() {
            const quantityInput = document.getElementById('purchaseQuantity');
            const rateInput = document.getElementById('purchaseRate');
            const amountInput = document.getElementById('purchaseAmount');
            
            if (quantityInput && rateInput && amountInput) {
                [quantityInput, rateInput, amountInput].forEach(input => {
                    input.addEventListener('input', calculatePurchaseTotal);
                });
            }
            
            // Sales total calculation
            const saleQuantityInput = document.getElementById('saleQuantity');
            const saleRateInput = document.getElementById('saleRate');
            
            if (saleQuantityInput && saleRateInput) {
                [saleQuantityInput, saleRateInput].forEach(input => {
                    input.addEventListener('input', function() {
                        const quantity = parseFloat(saleQuantityInput.value) || 0;
                        const rate = parseFloat(saleRateInput.value) || 0;
                        document.getElementById('saleTotal').textContent = (quantity * rate).toFixed(2);
                    });
                });
            }
        });

        // Inventory functions
        let currentInventoryTab = 'general';
        let editingColdLotId = null;
        let activeInlineReleaseLotId = null;
        let activeInlineMovementReleaseEditId = null;

        function switchInventoryTab(tabName) {
            currentInventoryTab = (tabName === 'cold') ? 'cold' : 'general';
            const generalSections = document.querySelectorAll('.inventory-general-section');
            const coldPanel = document.getElementById('coldStorageInventoryPanel');
            const generalBtn = document.getElementById('inventoryTabGeneralBtn');
            const coldBtn = document.getElementById('inventoryTabColdBtn');
            const showCold = currentInventoryTab === 'cold';

            generalSections.forEach(function(section) {
                if (section) section.classList.toggle('hidden', showCold);
            });
            if (coldPanel) coldPanel.classList.toggle('hidden', !showCold);
            if (generalBtn) {
                generalBtn.classList.toggle('bg-primary', !showCold);
                generalBtn.classList.toggle('text-white', !showCold);
                generalBtn.classList.toggle('bg-slate-100', showCold);
                generalBtn.classList.toggle('text-slate-700', showCold);
            }
            if (coldBtn) {
                coldBtn.classList.toggle('bg-primary', showCold);
                coldBtn.classList.toggle('text-white', showCold);
                coldBtn.classList.toggle('bg-slate-100', !showCold);
                coldBtn.classList.toggle('text-slate-700', !showCold);
            }
            if (showCold) {
                refreshColdStoragePanel();
            }
        }

        function getItemUnitById(itemId) {
            const item = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
            return item ? (item.unit || 'kg') : 'kg';
        }

        function getItemNameById(itemId) {
            const item = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
            return item ? item.name : String(itemId || '');
        }

        function getActiveColdQtyByItem(itemId) {
            if (itemId == null) return 0;
            return (appData.coldStorageLots || []).reduce(function(sum, lot) {
                if (!lot || String(lot.itemId) !== String(itemId)) return sum;
                if ((lot.status || 'active') === 'released') return sum;
                return sum + Math.max(0, parseFloat(lot.qtyInCold) || 0);
            }, 0);
        }

        function getActiveColdBagsByItem(itemId) {
            if (itemId == null) return 0;
            return (appData.coldStorageLots || []).reduce(function(sum, lot) {
                if (!lot || String(lot.itemId) !== String(itemId)) return sum;
                if ((lot.status || 'active') === 'released') return sum;
                return sum + Math.max(0, parseFloat(lot.bagsInCold) || 0);
            }, 0);
        }

        function getSaleAvailableQty(itemId) {
            if (itemId == null) return 0;
            const inventoryQty = Math.max(0, parseFloat(appData.inventory[itemId] && appData.inventory[itemId].quantity) || 0);
            return inventoryQty;
        }

        function calculateColdDamageLossEstimate(lot, damageQty) {
            const lotQty = Math.max(0, parseFloat(lot && lot.qtyInCold) || 0);
            const safeQty = Math.max(0, Math.min(lotQty, parseFloat(damageQty) || 0));
            if (!lot || safeQty <= 0 || lotQty <= 0) {
                return { safeQty: 0, sourceLoss: 0, chargeLoss: 0, totalLoss: 0, ratio: 0 };
            }
            const ratio = safeQty / lotQty;
            const sourceInventoryCost = Math.max(0, parseFloat(lot.sourceInventoryCost) || 0);
            const sourceLoss = sourceInventoryCost * ratio;
            return {
                safeQty: safeQty,
                sourceLoss: sourceLoss,
                chargeLoss: 0,
                totalLoss: sourceLoss,
                ratio: ratio
            };
        }

        function recalculateColdLotPayables(lot) {
            if (!lot) return;
            const estimated = Math.max(0, parseFloat(lot.estimatedTotalCharge) || 0);
            const paid = Math.max(0, parseFloat(lot.paidTotal) || 0);
            const payableAdjustments = Math.max(0, parseFloat(lot.payableAdjustmentTotal) || 0);
            lot.remainingPayable = Math.max(0, estimated - paid - payableAdjustments);
        }

        function canEditOrRemoveColdLot(lot) {
            if (!lot) return false;
            const periodic = Math.max(0, parseFloat(lot.periodicChargeTotal) || 0);
            const released = Math.max(0, parseFloat(lot.releaseQtyTotal) || 0);
            const damaged = Math.max(0, parseFloat(lot.damageQtyTotal) || 0);
            const shrinkage = Math.max(0, parseFloat(lot.shrinkageQtyTotal) || 0);
            const paid = Math.max(0, parseFloat(lot.paidTotal) || 0);
            return periodic <= 0 && released <= 0 && damaged <= 0 && shrinkage <= 0 && paid <= 0;
        }

        function getPurchaseAutoColdSourceKey(purchaseId, purchaseItem, itemIndex) {
            const itemIdPart = (purchaseItem && purchaseItem.id != null && purchaseItem.id !== '')
                ? String(purchaseItem.id)
                : `idx_${itemIndex}`;
            return `purchase_auto_${String(purchaseId)}_${itemIdPart}`;
        }

        function canReplaceAutoColdLot(lot) {
            if (!lot) return false;
            const periodic = Math.max(0, parseFloat(lot.periodicChargeTotal) || 0);
            const released = Math.max(0, parseFloat(lot.releaseQtyTotal) || 0);
            const damaged = Math.max(0, parseFloat(lot.damageQtyTotal) || 0);
            const shrinkage = Math.max(0, parseFloat(lot.shrinkageQtyTotal) || 0);
            const paid = Math.max(0, parseFloat(lot.paidTotal) || 0);
            const payableAdjustments = Math.max(0, parseFloat(lot.payableAdjustmentTotal) || 0);
            return periodic <= 0 && released <= 0 && damaged <= 0 && shrinkage <= 0 && paid <= 0 && payableAdjustments <= 0;
        }

        function hasAutoColdLotDownstreamActivity(lot) {
            if (!lot) return false;
            const periodic = Math.max(0, parseFloat(lot.periodicChargeTotal) || 0);
            const released = Math.max(0, parseFloat(lot.releaseQtyTotal) || 0);
            const damaged = Math.max(0, parseFloat(lot.damageQtyTotal) || 0);
            const shrinkage = Math.max(0, parseFloat(lot.shrinkageQtyTotal) || 0);
            const paid = Math.max(0, parseFloat(lot.paidTotal) || 0);
            const payableAdjustments = Math.max(0, parseFloat(lot.payableAdjustmentTotal) || 0);
            return periodic > 0 || released > 0 || damaged > 0 || shrinkage > 0 || paid > 0 || payableAdjustments > 0;
        }

        function updateAutoColdLotFromPurchaseItem(existingLot, purchase, purchaseItem, itemIndex) {
            if (!existingLot || !purchase || !purchaseItem) return false;
            const lineQty = Math.max(0, parseFloat(purchaseItem.grossWeight ?? purchaseItem.quantity ?? 0) || 0);
            const desiredQty = Math.max(0, parseFloat(purchaseItem.coldMoveQty ?? lineQty) || 0);
            if (desiredQty <= 0) return false;
            const lineBags = Math.max(0, parseFloat(purchaseItem.bags) || 0);
            const desiredBags = Math.max(0, parseFloat(purchaseItem.coldMoveBags ?? lineBags) || 0);
            const rentPerKg = Math.max(0, parseFloat(purchaseItem.coldStorageRentPerKg) || 0);
            const inPerBag = Math.max(0, parseFloat(purchaseItem.coldStorageInPerBag) || Math.max(0, parseFloat(purchaseItem.coldStorageInOutPerBag) || 0));
            const outPerBag = Math.max(0, parseFloat(purchaseItem.coldStorageOutPerBag) || 0);
            const inOutPerBag = inPerBag + outPerBag;
            const otherCharge = Math.max(0, parseFloat(purchaseItem.coldStorageOtherCharge) || 0);
            const companyExpenseAtMove = Math.max(0, parseFloat(purchaseItem.coldStorageCompanyExpense) || 0);
            const companyExpenseReason = String(purchaseItem.coldStorageCompanyExpenseReason || '').trim();
            const estimatedTotalCharge = Math.max(
                0,
                parseFloat(purchaseItem.coldStorageCost) || ((desiredQty * rentPerKg) + (desiredBags * (inPerBag + outPerBag)) + otherCharge)
            );
            const lineTotalInventoryCost = Math.max(0, (parseFloat(purchaseItem.total) || 0) + (parseFloat(purchaseItem.coldStorageCost) || 0));
            const sourceKey = getPurchaseAutoColdSourceKey(purchase.id, purchaseItem, itemIndex);
            const coldStorageId = String(purchaseItem.coldStorageId || '').trim();
            const coldStorageName = String(getColdStorageMasterNameById(coldStorageId) || purchaseItem.coldStorageName || '').trim() || 'Auto from Purchase';
            const vendorName = String(purchaseItem.coldStorageVendorName || purchaseItem.supplierName || purchase.supplierName || '').trim() || 'Unknown Vendor';
            const moveDate = purchaseItem.date || purchase.date || '';
            const remarks = String(purchaseItem.coldStorageRemarks || '').trim();
            const lotReference = String(purchaseItem.coldStorageReference || purchaseItem.kaantaParchi || '').trim();
            const supplierName = String(purchaseItem.supplierName || purchase.supplierName || '').trim() || '-';
            const lockQtyAndBags = hasAutoColdLotDownstreamActivity(existingLot);
            const qtyForLot = lockQtyAndBags ? Math.max(0, parseFloat(existingLot.qtyInCold) || 0) : desiredQty;
            const bagsForLot = lockQtyAndBags ? Math.max(0, parseFloat(existingLot.bagsInCold) || 0) : desiredBags;
            const sourceInventoryCost = lockQtyAndBags
                ? Math.max(0, parseFloat(existingLot.sourceInventoryCost) || 0)
                : (lineQty > 0
                    ? Math.max(0, lineTotalInventoryCost * Math.min(1, qtyForLot / lineQty))
                    : Math.max(0, lineTotalInventoryCost));

            const lotBefore = JSON.stringify({
                date: existingLot.date || '',
                itemId: existingLot.itemId || '',
                itemName: existingLot.itemName || '',
                unit: existingLot.unit || '',
                coldStorageId: existingLot.coldStorageId || '',
                coldStorageName: existingLot.coldStorageName || '',
                vendorName: existingLot.vendorName || '',
                supplierName: existingLot.supplierName || '',
                qtyInCold: +Math.max(0, parseFloat(existingLot.qtyInCold) || 0).toFixed(2),
                bagsInCold: +Math.max(0, parseFloat(existingLot.bagsInCold) || 0).toFixed(2),
                rentPerKg: +Math.max(0, parseFloat(existingLot.rentPerKg) || 0).toFixed(2),
                inOutPerBag: +Math.max(0, parseFloat(existingLot.inOutPerBag) || 0).toFixed(2),
                otherCharge: +Math.max(0, parseFloat(existingLot.otherCharge) || 0).toFixed(2),
                companyExpenseAtMove: +Math.max(0, parseFloat(existingLot.companyExpenseAtMove) || 0).toFixed(2),
                companyExpenseReason: String(existingLot.companyExpenseReason || ''),
                estimatedTotalCharge: +Math.max(0, parseFloat(existingLot.estimatedTotalCharge) || 0).toFixed(2),
                lotReference: String(existingLot.lotReference || ''),
                remarks: String(existingLot.remarks || ''),
                sourceInventoryCost: +Math.max(0, parseFloat(existingLot.sourceInventoryCost) || 0).toFixed(2),
                sourceKey: String(existingLot.sourceKey || ''),
                purchaseId: String(existingLot.purchaseId || ''),
                purchaseInvoice: String(existingLot.purchaseInvoice || ''),
                purchaseItemId: existingLot.purchaseItemId == null ? '' : String(existingLot.purchaseItemId)
            });

            existingLot.date = moveDate;
            existingLot.itemId = purchaseItem.itemId;
            existingLot.itemName = purchaseItem.itemName || getItemNameById(purchaseItem.itemId);
            existingLot.unit = getItemUnitById(purchaseItem.itemId);
            existingLot.coldStorageId = coldStorageId;
            existingLot.coldStorageName = coldStorageName;
            existingLot.vendorName = vendorName;
            existingLot.supplierName = supplierName;
            existingLot.qtyInCold = +qtyForLot.toFixed(2);
            existingLot.bagsInCold = +bagsForLot.toFixed(2);
            existingLot.rentPerKg = rentPerKg;
            existingLot.inOutPerBag = inOutPerBag;
            existingLot.otherCharge = otherCharge;
            existingLot.companyExpenseAtMove = +companyExpenseAtMove.toFixed(2);
            existingLot.companyExpenseReason = companyExpenseReason;
            existingLot.estimatedTotalCharge = +estimatedTotalCharge.toFixed(2);
            existingLot.lotReference = lotReference;
            existingLot.remarks = remarks;
            existingLot.sourceInventoryCost = +sourceInventoryCost.toFixed(2);
            existingLot.source = 'purchase_auto';
            existingLot.sourceKey = sourceKey;
            existingLot.purchaseId = purchase.id;
            existingLot.purchaseInvoice = purchase.invoice || '';
            existingLot.purchaseItemId = purchaseItem.id != null ? purchaseItem.id : null;
            recalculateColdLotPayables(existingLot);

            const lotAfter = JSON.stringify({
                date: existingLot.date || '',
                itemId: existingLot.itemId || '',
                itemName: existingLot.itemName || '',
                unit: existingLot.unit || '',
                coldStorageId: existingLot.coldStorageId || '',
                coldStorageName: existingLot.coldStorageName || '',
                vendorName: existingLot.vendorName || '',
                supplierName: existingLot.supplierName || '',
                qtyInCold: +Math.max(0, parseFloat(existingLot.qtyInCold) || 0).toFixed(2),
                bagsInCold: +Math.max(0, parseFloat(existingLot.bagsInCold) || 0).toFixed(2),
                rentPerKg: +Math.max(0, parseFloat(existingLot.rentPerKg) || 0).toFixed(2),
                inOutPerBag: +Math.max(0, parseFloat(existingLot.inOutPerBag) || 0).toFixed(2),
                otherCharge: +Math.max(0, parseFloat(existingLot.otherCharge) || 0).toFixed(2),
                companyExpenseAtMove: +Math.max(0, parseFloat(existingLot.companyExpenseAtMove) || 0).toFixed(2),
                companyExpenseReason: String(existingLot.companyExpenseReason || ''),
                estimatedTotalCharge: +Math.max(0, parseFloat(existingLot.estimatedTotalCharge) || 0).toFixed(2),
                lotReference: String(existingLot.lotReference || ''),
                remarks: String(existingLot.remarks || ''),
                sourceInventoryCost: +Math.max(0, parseFloat(existingLot.sourceInventoryCost) || 0).toFixed(2),
                sourceKey: String(existingLot.sourceKey || ''),
                purchaseId: String(existingLot.purchaseId || ''),
                purchaseInvoice: String(existingLot.purchaseInvoice || ''),
                purchaseItemId: existingLot.purchaseItemId == null ? '' : String(existingLot.purchaseItemId)
            });

            let changed = lotBefore !== lotAfter;
            if (changed) {
                Object.assign(existingLot, getAuditMeta(false));
            }

            appData.coldStorageMovements = appData.coldStorageMovements || [];
            let moveEntry = appData.coldStorageMovements.find(function(m) {
                return String(m.type || '') === 'move_in' && String(m.source || '') === 'purchase_auto' && String(m.sourceKey || '') === String(sourceKey);
            });
            if (!moveEntry) {
                moveEntry = appData.coldStorageMovements.find(function(m) {
                    return String(m.type || '') === 'move_in' && String(m.lotId || '') === String(existingLot.id);
                });
            }
            if (!moveEntry) {
                moveEntry = {
                    id: Date.now() + Math.floor(Math.random() * 1000) + itemIndex,
                    date: existingLot.date,
                    type: 'move_in',
                    lotId: existingLot.id,
                    itemId: existingLot.itemId,
                    itemName: existingLot.itemName,
                    coldStorageName: existingLot.coldStorageName,
                    vendorName: existingLot.vendorName,
                    supplierName: existingLot.supplierName || '-',
                    qty: existingLot.qtyInCold,
                    bags: existingLot.bagsInCold,
                    amount: existingLot.estimatedTotalCharge,
                    paidAmount: 0,
                    reference: existingLot.lotReference || '',
                    source: 'purchase_auto',
                    sourceKey: sourceKey,
                    purchaseId: purchase.id,
                    purchaseInvoice: purchase.invoice || '',
                    remarks: existingLot.remarks || ''
                };
                appData.coldStorageMovements.push(moveEntry);
                changed = true;
            } else {
                const moveBefore = JSON.stringify({
                    date: moveEntry.date || '',
                    lotId: String(moveEntry.lotId || ''),
                    itemId: String(moveEntry.itemId || ''),
                    itemName: String(moveEntry.itemName || ''),
                    coldStorageName: String(moveEntry.coldStorageName || ''),
                    vendorName: String(moveEntry.vendorName || ''),
                    supplierName: String(moveEntry.supplierName || ''),
                    qty: +Math.max(0, parseFloat(moveEntry.qty) || 0).toFixed(2),
                    bags: +Math.max(0, parseFloat(moveEntry.bags) || 0).toFixed(2),
                    amount: +Math.max(0, parseFloat(moveEntry.amount) || 0).toFixed(2),
                    paidAmount: +Math.max(0, parseFloat(moveEntry.paidAmount) || 0).toFixed(2),
                    reference: String(moveEntry.reference || ''),
                    source: String(moveEntry.source || ''),
                    sourceKey: String(moveEntry.sourceKey || ''),
                    purchaseId: String(moveEntry.purchaseId || ''),
                    purchaseInvoice: String(moveEntry.purchaseInvoice || ''),
                    remarks: String(moveEntry.remarks || '')
                });
                moveEntry.date = existingLot.date;
                moveEntry.lotId = existingLot.id;
                moveEntry.itemId = existingLot.itemId;
                moveEntry.itemName = existingLot.itemName;
                moveEntry.coldStorageName = existingLot.coldStorageName;
                moveEntry.vendorName = existingLot.vendorName;
                moveEntry.supplierName = existingLot.supplierName || '-';
                if (!lockQtyAndBags) {
                    moveEntry.qty = existingLot.qtyInCold;
                    moveEntry.bags = existingLot.bagsInCold;
                }
                moveEntry.amount = existingLot.estimatedTotalCharge;
                moveEntry.reference = existingLot.lotReference || '';
                moveEntry.source = 'purchase_auto';
                moveEntry.sourceKey = sourceKey;
                moveEntry.purchaseId = purchase.id;
                moveEntry.purchaseInvoice = purchase.invoice || '';
                moveEntry.remarks = existingLot.remarks || '';
                const moveAfter = JSON.stringify({
                    date: moveEntry.date || '',
                    lotId: String(moveEntry.lotId || ''),
                    itemId: String(moveEntry.itemId || ''),
                    itemName: String(moveEntry.itemName || ''),
                    coldStorageName: String(moveEntry.coldStorageName || ''),
                    vendorName: String(moveEntry.vendorName || ''),
                    supplierName: String(moveEntry.supplierName || ''),
                    qty: +Math.max(0, parseFloat(moveEntry.qty) || 0).toFixed(2),
                    bags: +Math.max(0, parseFloat(moveEntry.bags) || 0).toFixed(2),
                    amount: +Math.max(0, parseFloat(moveEntry.amount) || 0).toFixed(2),
                    paidAmount: +Math.max(0, parseFloat(moveEntry.paidAmount) || 0).toFixed(2),
                    reference: String(moveEntry.reference || ''),
                    source: String(moveEntry.source || ''),
                    sourceKey: String(moveEntry.sourceKey || ''),
                    purchaseId: String(moveEntry.purchaseId || ''),
                    purchaseInvoice: String(moveEntry.purchaseInvoice || ''),
                    remarks: String(moveEntry.remarks || '')
                });
                if (moveBefore !== moveAfter) changed = true;
            }

            let companyExpenseEntry = appData.coldStorageMovements.find(function(m) {
                return String(m.type || '') === 'company_expense' && String(m.source || '') === 'purchase_auto' && String(m.sourceKey || '') === String(sourceKey);
            });
            if (!companyExpenseEntry) {
                companyExpenseEntry = appData.coldStorageMovements.find(function(m) {
                    if (String(m.type || '') !== 'company_expense') return false;
                    if (moveEntry && String(m.linkedMoveMovementId || '') === String(moveEntry.id)) return true;
                    return String(m.lotId || '') === String(existingLot.id);
                });
            }
            if (companyExpenseAtMove > 0) {
                if (!companyExpenseEntry) {
                    appData.coldStorageMovements.push({
                        id: Date.now() + Math.floor(Math.random() * 1000) + itemIndex,
                        date: existingLot.date,
                        type: 'company_expense',
                        lotId: existingLot.id,
                        itemId: existingLot.itemId,
                        itemName: existingLot.itemName,
                        coldStorageName: existingLot.coldStorageName,
                        vendorName: existingLot.vendorName,
                        supplierName: existingLot.supplierName || '-',
                        qty: 0,
                        bags: 0,
                        amount: +companyExpenseAtMove.toFixed(2),
                        paidAmount: 0,
                        reference: existingLot.lotReference || '',
                        linkedMoveMovementId: moveEntry ? moveEntry.id : '',
                        source: 'purchase_auto',
                        sourceKey: sourceKey,
                        purchaseId: purchase.id,
                        purchaseInvoice: purchase.invoice || '',
                        remarks: companyExpenseReason || existingLot.remarks || 'Company cold move expense'
                    });
                    changed = true;
                } else {
                    const companyBefore = JSON.stringify({
                        date: String(companyExpenseEntry.date || ''),
                        lotId: String(companyExpenseEntry.lotId || ''),
                        itemId: String(companyExpenseEntry.itemId || ''),
                        itemName: String(companyExpenseEntry.itemName || ''),
                        coldStorageName: String(companyExpenseEntry.coldStorageName || ''),
                        vendorName: String(companyExpenseEntry.vendorName || ''),
                        supplierName: String(companyExpenseEntry.supplierName || ''),
                        qty: +Math.max(0, parseFloat(companyExpenseEntry.qty) || 0).toFixed(2),
                        bags: +Math.max(0, parseFloat(companyExpenseEntry.bags) || 0).toFixed(2),
                        amount: +Math.max(0, parseFloat(companyExpenseEntry.amount) || 0).toFixed(2),
                        reference: String(companyExpenseEntry.reference || ''),
                        linkedMoveMovementId: String(companyExpenseEntry.linkedMoveMovementId || ''),
                        source: String(companyExpenseEntry.source || ''),
                        sourceKey: String(companyExpenseEntry.sourceKey || ''),
                        purchaseId: String(companyExpenseEntry.purchaseId || ''),
                        purchaseInvoice: String(companyExpenseEntry.purchaseInvoice || ''),
                        remarks: String(companyExpenseEntry.remarks || '')
                    });
                    companyExpenseEntry.date = existingLot.date;
                    companyExpenseEntry.lotId = existingLot.id;
                    companyExpenseEntry.itemId = existingLot.itemId;
                    companyExpenseEntry.itemName = existingLot.itemName;
                    companyExpenseEntry.coldStorageName = existingLot.coldStorageName;
                    companyExpenseEntry.vendorName = existingLot.vendorName;
                    companyExpenseEntry.supplierName = existingLot.supplierName || '-';
                    companyExpenseEntry.qty = 0;
                    companyExpenseEntry.bags = 0;
                    companyExpenseEntry.amount = +companyExpenseAtMove.toFixed(2);
                    companyExpenseEntry.reference = existingLot.lotReference || '';
                    companyExpenseEntry.linkedMoveMovementId = moveEntry ? moveEntry.id : (companyExpenseEntry.linkedMoveMovementId || '');
                    companyExpenseEntry.source = 'purchase_auto';
                    companyExpenseEntry.sourceKey = sourceKey;
                    companyExpenseEntry.purchaseId = purchase.id;
                    companyExpenseEntry.purchaseInvoice = purchase.invoice || '';
                    companyExpenseEntry.remarks = companyExpenseReason || existingLot.remarks || 'Company cold move expense';
                    const companyAfter = JSON.stringify({
                        date: String(companyExpenseEntry.date || ''),
                        lotId: String(companyExpenseEntry.lotId || ''),
                        itemId: String(companyExpenseEntry.itemId || ''),
                        itemName: String(companyExpenseEntry.itemName || ''),
                        coldStorageName: String(companyExpenseEntry.coldStorageName || ''),
                        vendorName: String(companyExpenseEntry.vendorName || ''),
                        supplierName: String(companyExpenseEntry.supplierName || ''),
                        qty: +Math.max(0, parseFloat(companyExpenseEntry.qty) || 0).toFixed(2),
                        bags: +Math.max(0, parseFloat(companyExpenseEntry.bags) || 0).toFixed(2),
                        amount: +Math.max(0, parseFloat(companyExpenseEntry.amount) || 0).toFixed(2),
                        reference: String(companyExpenseEntry.reference || ''),
                        linkedMoveMovementId: String(companyExpenseEntry.linkedMoveMovementId || ''),
                        source: String(companyExpenseEntry.source || ''),
                        sourceKey: String(companyExpenseEntry.sourceKey || ''),
                        purchaseId: String(companyExpenseEntry.purchaseId || ''),
                        purchaseInvoice: String(companyExpenseEntry.purchaseInvoice || ''),
                        remarks: String(companyExpenseEntry.remarks || '')
                    });
                    if (companyBefore !== companyAfter) changed = true;
                }
            } else if (companyExpenseEntry) {
                const companyId = String(companyExpenseEntry.id || '');
                appData.coldStorageMovements = appData.coldStorageMovements.filter(function(m) {
                    return String(m.id || '') !== companyId;
                });
                changed = true;
            }
            return changed;
        }

        function createAutoColdLotFromPurchaseItem(purchase, purchaseItem, itemIndex) {
            if (!purchase || !purchaseItem) return null;
            const lineQty = Math.max(0, parseFloat(purchaseItem.grossWeight ?? purchaseItem.quantity ?? 0) || 0);
            const qty = Math.max(0, parseFloat(purchaseItem.coldMoveQty ?? lineQty) || 0);
            if (qty <= 0) return null;
            const lineBags = Math.max(0, parseFloat(purchaseItem.bags) || 0);
            const bags = Math.max(0, parseFloat(purchaseItem.coldMoveBags ?? lineBags) || 0);
            const rentPerKg = Math.max(0, parseFloat(purchaseItem.coldStorageRentPerKg) || 0);
            const inPerBag = Math.max(0, parseFloat(purchaseItem.coldStorageInPerBag) || Math.max(0, parseFloat(purchaseItem.coldStorageInOutPerBag) || 0));
            const outPerBag = Math.max(0, parseFloat(purchaseItem.coldStorageOutPerBag) || 0);
            const inOutPerBag = inPerBag + outPerBag;
            const otherCharge = Math.max(0, parseFloat(purchaseItem.coldStorageOtherCharge) || 0);
            const companyExpenseAtMove = Math.max(0, parseFloat(purchaseItem.coldStorageCompanyExpense) || 0);
            const companyExpenseReason = String(purchaseItem.coldStorageCompanyExpenseReason || '').trim();
            const estimatedTotalCharge = Math.max(
                0,
                parseFloat(purchaseItem.coldStorageCost) || ((qty * rentPerKg) + (bags * (inPerBag + outPerBag)) + otherCharge)
            );
            const lineTotalInventoryCost = Math.max(0, (parseFloat(purchaseItem.total) || 0) + (parseFloat(purchaseItem.coldStorageCost) || 0));
            const sourceInventoryCost = lineQty > 0
                ? Math.max(0, lineTotalInventoryCost * Math.min(1, qty / lineQty))
                : Math.max(0, lineTotalInventoryCost);
            const sourceKey = getPurchaseAutoColdSourceKey(purchase.id, purchaseItem, itemIndex);
            const lotId = Date.now() + Math.floor(Math.random() * 1000) + itemIndex;
            const coldStorageId = String(purchaseItem.coldStorageId || '').trim();
            const coldStorageName = String(getColdStorageMasterNameById(coldStorageId) || purchaseItem.coldStorageName || '').trim() || 'Auto from Purchase';
            const vendorName = String(purchaseItem.coldStorageVendorName || purchaseItem.supplierName || purchase.supplierName || '').trim() || 'Unknown Vendor';
            const moveDate = purchaseItem.date || purchase.date || '';
            const remarks = String(purchaseItem.coldStorageRemarks || '').trim();
            const lotReference = String(purchaseItem.coldStorageReference || purchaseItem.kaantaParchi || '').trim();
            const lot = {
                id: lotId,
                date: moveDate,
                itemId: purchaseItem.itemId,
                itemName: purchaseItem.itemName || getItemNameById(purchaseItem.itemId),
                unit: getItemUnitById(purchaseItem.itemId),
                coldStorageId: coldStorageId,
                coldStorageName: coldStorageName,
                vendorName: vendorName,
                supplierName: String(purchaseItem.supplierName || purchase.supplierName || '').trim() || '-',
                qtyInCold: qty,
                bagsInCold: bags,
                rentPerKg: rentPerKg,
                inOutPerBag: inOutPerBag,
                otherCharge: otherCharge,
                companyExpenseAtMove: +companyExpenseAtMove.toFixed(2),
                companyExpenseReason: companyExpenseReason,
                periodicChargeTotal: 0,
                estimatedTotalCharge: +estimatedTotalCharge.toFixed(2),
                paidAtMove: 0,
                paidAtRelease: 0,
                paidTotal: 0,
                payableAdjustmentTotal: 0,
                remainingPayable: +estimatedTotalCharge.toFixed(2),
                releaseQtyTotal: 0,
                releaseBagsTotal: 0,
                shrinkageQtyTotal: 0,
                damageQtyTotal: 0,
                damageBagsTotal: 0,
                damageLossTotal: 0,
                damageUsShareTotal: 0,
                damageVendorShareTotal: 0,
                status: 'active',
                remarks: remarks,
                lotReference: lotReference,
                sourceInventoryCost: +sourceInventoryCost.toFixed(2),
                source: 'purchase_auto',
                sourceKey: sourceKey,
                purchaseId: purchase.id,
                purchaseInvoice: purchase.invoice || '',
                purchaseItemId: purchaseItem.id != null ? purchaseItem.id : null,
                ...getAuditMeta(true)
            };
            recalculateColdLotPayables(lot);
            const movement = {
                id: Date.now() + Math.floor(Math.random() * 1000) + itemIndex,
                date: moveDate,
                type: 'move_in',
                lotId: lot.id,
                itemId: purchaseItem.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                qty: qty,
                bags: bags,
                amount: lot.estimatedTotalCharge,
                paidAmount: 0,
                reference: lotReference,
                source: 'purchase_auto',
                sourceKey: sourceKey,
                purchaseId: purchase.id,
                purchaseInvoice: purchase.invoice || '',
                remarks: remarks
            };
            appData.coldStorageLots = appData.coldStorageLots || [];
            appData.coldStorageLots.push(lot);
            appData.coldStorageMovements = appData.coldStorageMovements || [];
            appData.coldStorageMovements.push(movement);
            if (companyExpenseAtMove > 0) {
                appData.coldStorageMovements.push({
                    id: Date.now() + Math.floor(Math.random() * 1000) + itemIndex,
                    date: moveDate,
                    type: 'company_expense',
                    lotId: lot.id,
                    itemId: purchaseItem.itemId,
                    itemName: lot.itemName,
                    coldStorageName: lot.coldStorageName,
                    vendorName: lot.vendorName,
                    supplierName: lot.supplierName || '-',
                    qty: 0,
                    bags: 0,
                    amount: +companyExpenseAtMove.toFixed(2),
                    paidAmount: 0,
                    reference: lotReference,
                    linkedMoveMovementId: movement.id,
                    source: 'purchase_auto',
                    sourceKey: sourceKey,
                    purchaseId: purchase.id,
                    purchaseInvoice: purchase.invoice || '',
                    remarks: companyExpenseReason || remarks || 'Company cold move expense'
                });
            }
            return lot;
        }

        function syncPurchaseAutoColdLotsForPurchaseIds(purchaseIds, options) {
            const opts = options || {};
            const targetIds = Array.isArray(purchaseIds)
                ? purchaseIds.map(function(id) { return String(id); }).filter(Boolean)
                : [];
            const limitToIds = targetIds.length > 0;
            const targetPurchases = (appData.purchases || []).filter(function(purchase) {
                if (!purchase || purchase.id == null) return false;
                if (!limitToIds) return true;
                return targetIds.includes(String(purchase.id));
            });
            const desiredKeys = {};
            targetPurchases.forEach(function(purchase) {
                (purchase.items || []).forEach(function(item, idx) {
                    if (!item || !item.isColdStorage) return;
                    const qty = Math.max(0, parseFloat(item.grossWeight ?? item.quantity ?? 0) || 0);
                    if (qty <= 0) return;
                    const sourceKey = getPurchaseAutoColdSourceKey(purchase.id, item, idx);
                    desiredKeys[sourceKey] = { purchase: purchase, item: item, itemIndex: idx };
                });
            });

            let changed = false;
            appData.coldStorageLots = appData.coldStorageLots || [];
            appData.coldStorageMovements = appData.coldStorageMovements || [];

            if (limitToIds && !opts.skipCleanup) {
                const removableLotIds = new Set();
                appData.coldStorageLots = appData.coldStorageLots.filter(function(lot) {
                    if (String(lot.source || '') !== 'purchase_auto') return true;
                    if (!targetIds.includes(String(lot.purchaseId || ''))) return true;
                    const hasDesired = lot.sourceKey && desiredKeys[lot.sourceKey];
                    if (hasDesired) return true;
                    if (!canReplaceAutoColdLot(lot)) return true;
                    removableLotIds.add(String(lot.id));
                    changed = true;
                    return false;
                });
                if (removableLotIds.size > 0) {
                    appData.coldStorageMovements = appData.coldStorageMovements.filter(function(movement) {
                        return !removableLotIds.has(String(movement.lotId || ''));
                    });
                }
            }

            const existingLotsByKey = {};
            (appData.coldStorageLots || []).forEach(function(lot) {
                if (String(lot.source || '') !== 'purchase_auto' || !lot.sourceKey) return;
                existingLotsByKey[String(lot.sourceKey)] = lot;
            });

            Object.keys(desiredKeys).forEach(function(sourceKey) {
                const existingLot = existingLotsByKey[sourceKey];
                const payload = desiredKeys[sourceKey];
                if (existingLot) {
                    const updated = updateAutoColdLotFromPurchaseItem(existingLot, payload.purchase, payload.item, payload.itemIndex);
                    if (updated) changed = true;
                    return;
                }
                const created = createAutoColdLotFromPurchaseItem(payload.purchase, payload.item, payload.itemIndex);
                if (created) changed = true;
            });

            return changed;
        }

        function refreshColdStoragePanel() {
            const moveDateEl = document.getElementById('coldMoveDate');
            if (moveDateEl && !moveDateEl.value) moveDateEl.value = new Date().toISOString().split('T')[0];
            const chargeDateEl = document.getElementById('coldChargeDate');
            if (chargeDateEl && !chargeDateEl.value) chargeDateEl.value = new Date().toISOString().split('T')[0];
            const releaseDateEl = document.getElementById('coldReleaseDate');
            if (releaseDateEl && !releaseDateEl.value) releaseDateEl.value = new Date().toISOString().split('T')[0];
            const shrinkDateEl = document.getElementById('coldShrinkageDate');
            if (shrinkDateEl && !shrinkDateEl.value) shrinkDateEl.value = new Date().toISOString().split('T')[0];
            const damageDateEl = document.getElementById('coldDamageDate');
            if (damageDateEl && !damageDateEl.value) damageDateEl.value = new Date().toISOString().split('T')[0];
            populateColdStorageNameDropdowns();
            populateColdMoveItemOptions();
            populateColdLotSelectors();
            populateColdMovementLotFilterOptions();
            populateColdVendorPayablesFilterOptions();
            renderColdStorageSummaryCards();
            filterColdStorageLots();
            renderColdVendorPayablesSummary();
            renderColdStorageDamageSummary();
            renderColdStorageMovementsHistory();
        }

        function renderColdStorageSummaryCards() {
            const lots = appData.coldStorageLots || [];
            const movements = appData.coldStorageMovements || [];
            const totals = lots.reduce(function(acc, lot) {
                const qtyInCold = Math.max(0, parseFloat(lot.qtyInCold) || 0);
                const bagsInCold = Math.max(0, parseFloat(lot.bagsInCold) || 0);
                acc.availableQty += qtyInCold;
                acc.availableBags += bagsInCold;
                return acc;
            }, {
                availableQty: 0,
                availableBags: 0,
                movedQty: 0,
                movedBags: 0,
                releasedQty: 0,
                releasedBags: 0,
                damagedQty: 0,
                damagedBags: 0,
                shrinkageQty: 0
            });
            movements.forEach(function(m) {
                const type = String(m && m.type || '').trim().toLowerCase();
                const qty = Math.max(0, parseFloat(m && m.qty) || 0);
                const bags = Math.max(0, parseFloat(m && m.bags) || 0);
                if (type === 'move_in' || type === 'move') {
                    totals.movedQty += qty;
                    totals.movedBags += bags;
                } else if (type === 'release_out' || type === 'release') {
                    totals.releasedQty += qty;
                    totals.releasedBags += bags;
                } else if (type === 'damage') {
                    totals.damagedQty += qty;
                    totals.damagedBags += bags;
                } else if (type === 'shrinkage') {
                    totals.shrinkageQty += qty;
                }
            });

            const setText = function(id, text) {
                const el = document.getElementById(id);
                if (el) el.textContent = text;
            };
            setText('coldSummaryAvailableQty', `${totals.availableQty.toFixed(2)} kg`);
            setText('coldSummaryAvailableBags', `${totals.availableBags.toFixed(2)} bags`);
            setText('coldSummaryMovedQty', `${totals.movedQty.toFixed(2)} kg`);
            setText('coldSummaryMovedBags', `${totals.movedBags.toFixed(2)} bags`);
            setText('coldSummaryReleasedQty', `${totals.releasedQty.toFixed(2)} kg`);
            setText('coldSummaryReleasedBags', `${totals.releasedBags.toFixed(2)} bags`);
            setText('coldSummaryDamagedQty', `${totals.damagedQty.toFixed(2)} kg`);
            setText('coldSummaryDamagedBags', `${totals.damagedBags.toFixed(2)} bags`);
            setText('coldSummaryShrinkageQty', `${totals.shrinkageQty.toFixed(2)} kg`);
            setText('coldSummaryShrinkageBags', `0.00 bags`);
        }

        function openInlineColdRelease(lotId) {
            activeInlineReleaseLotId = String(lotId || '');
            renderColdStorageLotsTable();
        }

        function cancelInlineColdRelease() {
            activeInlineReleaseLotId = null;
            renderColdStorageLotsTable();
        }

        function updateInlineColdReleaseHint(lotId) {
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            const hintEl = document.getElementById('inlineColdReleaseHint_' + String(lotId));
            if (!hintEl) return;
            if (!lot) {
                hintEl.textContent = 'Available in lot: 0';
                return;
            }
            hintEl.textContent = 'Available in lot: ' + Number(lot.qtyInCold || 0).toFixed(2) + ' ' + (lot.unit || 'kg') +
                ' | Available bags: ' + Number(lot.bagsInCold || 0).toFixed(2) +
                ' | Remaining Payable: ' + RU + Number(lot.remainingPayable || 0).toFixed(2);
        }

        function populateColdMoveItemOptions() {
            const select = document.getElementById('coldMoveItem');
            if (!select) return;
            const current = select.value;
            select.innerHTML = '<option value="">Select Item</option>';
            Object.keys(appData.inventory || {}).forEach(function(itemId) {
                const qty = getSaleAvailableQty(itemId);
                if (qty <= 0) return;
                const itemName = getItemNameById(itemId);
                const unit = getItemUnitById(itemId);
                select.innerHTML += `<option value="${itemId}">${escapeHtml(itemName)} (${qty.toFixed(2)} ${escapeHtml(unit)} available)</option>`;
            });
            if (current && select.querySelector(`option[value="${current}"]`)) {
                select.value = current;
            }
            onColdMoveItemChange();
        }

        function onColdMoveItemChange() {
            const itemId = document.getElementById('coldMoveItem') ? document.getElementById('coldMoveItem').value : '';
            const hintEl = document.getElementById('coldMoveAvailableHint');
            if (!hintEl) return;
            if (!itemId) {
                hintEl.textContent = 'Available: 0';
                return;
            }
            const qty = getSaleAvailableQty(itemId);
            const qtyInCold = getActiveColdQtyByItem(itemId);
            const unit = getItemUnitById(itemId);
            hintEl.textContent = `Available: ${qty.toFixed(2)} ${unit} | In Cold: ${qtyInCold.toFixed(2)} ${unit}`;
        }

        function calculateColdMoveEstimatedTotals() {
            const qty = Math.max(0, parseFloat(document.getElementById('coldMoveQty') && document.getElementById('coldMoveQty').value) || 0);
            const bags = Math.max(0, parseFloat(document.getElementById('coldMoveBags') && document.getElementById('coldMoveBags').value) || 0);
            const rentPerKg = Math.max(0, parseFloat(document.getElementById('coldMoveRentPerKg') && document.getElementById('coldMoveRentPerKg').value) || 0);
            const inOutPerBag = Math.max(0, parseFloat(document.getElementById('coldMoveInOutPerBag') && document.getElementById('coldMoveInOutPerBag').value) || 0);
            const otherCharge = Math.max(0, parseFloat(document.getElementById('coldMoveOtherCharge') && document.getElementById('coldMoveOtherCharge').value) || 0);
            const total = (qty * rentPerKg) + (bags * inOutPerBag) + otherCharge;
            const totalEl = document.getElementById('coldMoveEstimatedCharge');
            if (totalEl) totalEl.value = total.toFixed(2);
            return total;
        }

        function setColdMoveEditMode(isEditing) {
            const submitBtn = document.getElementById('coldMoveSubmitBtn');
            const cancelBtn = document.getElementById('coldMoveCancelBtn');
            const modeLabel = document.getElementById('coldMoveModeLabel');
            const itemSelect = document.getElementById('coldMoveItem');
            if (submitBtn) submitBtn.textContent = isEditing ? 'Update Cold Lot' : 'Move to Cold';
            if (cancelBtn) cancelBtn.classList.toggle('hidden', !isEditing);
            if (modeLabel) modeLabel.classList.toggle('hidden', !isEditing);
            if (itemSelect) itemSelect.disabled = !!isEditing;
        }

        function resetColdMoveForm() {
            const moveDateEl = document.getElementById('coldMoveDate');
            const itemEl = document.getElementById('coldMoveItem');
            const qtyEl = document.getElementById('coldMoveQty');
            const bagsEl = document.getElementById('coldMoveBags');
            const storageEl = document.getElementById('coldMoveStorageName');
            const vendorEl = document.getElementById('coldMoveVendorName');
            const rentEl = document.getElementById('coldMoveRentPerKg');
            const inOutEl = document.getElementById('coldMoveInOutPerBag');
            const otherEl = document.getElementById('coldMoveOtherCharge');
            const companyExpenseEl = document.getElementById('coldMoveCompanyExpense');
            const companyExpenseReasonEl = document.getElementById('coldMoveCompanyExpenseReason');
            const paidEl = document.getElementById('coldMovePaidAtMove');
            const referenceEl = document.getElementById('coldMoveReference');
            const remarksEl = document.getElementById('coldMoveRemarks');
            if (moveDateEl) moveDateEl.value = new Date().toISOString().split('T')[0];
            if (itemEl) itemEl.value = '';
            if (qtyEl) qtyEl.value = '';
            if (bagsEl) bagsEl.value = '';
            if (storageEl) storageEl.value = '';
            if (vendorEl) vendorEl.value = '';
            if (rentEl) rentEl.value = '';
            if (inOutEl) inOutEl.value = '';
            if (otherEl) otherEl.value = '';
            if (companyExpenseEl) companyExpenseEl.value = '';
            if (companyExpenseReasonEl) companyExpenseReasonEl.value = '';
            if (paidEl) paidEl.value = '';
            if (referenceEl) referenceEl.value = '';
            if (remarksEl) remarksEl.value = '';
            calculateColdMoveEstimatedTotals();
            onColdMoveItemChange();
        }

        function moveToColdStorage() {
            const date = (document.getElementById('coldMoveDate') && document.getElementById('coldMoveDate').value) || '';
            const itemId = (document.getElementById('coldMoveItem') && document.getElementById('coldMoveItem').value) || '';
            const qty = Math.max(0, parseFloat(document.getElementById('coldMoveQty') && document.getElementById('coldMoveQty').value) || 0);
            const bags = Math.max(0, parseFloat(document.getElementById('coldMoveBags') && document.getElementById('coldMoveBags').value) || 0);
            const selectedColdStorage = resolveColdStorageSelection('coldMoveStorageName');
            const coldStorageId = selectedColdStorage.id;
            const coldStorageName = selectedColdStorage.name;
            const vendorName = (document.getElementById('coldMoveVendorName') && document.getElementById('coldMoveVendorName').value || '').trim();
            const rentPerKg = Math.max(0, parseFloat(document.getElementById('coldMoveRentPerKg') && document.getElementById('coldMoveRentPerKg').value) || 0);
            const inOutPerBag = Math.max(0, parseFloat(document.getElementById('coldMoveInOutPerBag') && document.getElementById('coldMoveInOutPerBag').value) || 0);
            const otherCharge = Math.max(0, parseFloat(document.getElementById('coldMoveOtherCharge') && document.getElementById('coldMoveOtherCharge').value) || 0);
            const companyExpense = Math.max(0, parseFloat(document.getElementById('coldMoveCompanyExpense') && document.getElementById('coldMoveCompanyExpense').value) || 0);
            const companyExpenseReason = String((document.getElementById('coldMoveCompanyExpenseReason') && document.getElementById('coldMoveCompanyExpenseReason').value) || '').trim();
            const paidAtMove = Math.max(0, parseFloat(document.getElementById('coldMovePaidAtMove') && document.getElementById('coldMovePaidAtMove').value) || 0);
            const lotReference = String((document.getElementById('coldMoveReference') && document.getElementById('coldMoveReference').value) || '').trim();
            const remarks = (document.getElementById('coldMoveRemarks') && document.getElementById('coldMoveRemarks').value || '').trim();
            if (!date || !itemId || qty <= 0 || !coldStorageName || !vendorName) {
                alert('Please fill date, item, quantity, cold storage name, and vendor name.');
                return;
            }
            if (!lotReference) {
                alert('Please enter LOT/CRATE reference.');
                return;
            }
            if (editingColdLotId != null) {
                const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(editingColdLotId); });
                if (!lot) {
                    alert('Cold lot not found.');
                    cancelColdLotEdit();
                    return;
                }
                if (!canEditOrRemoveColdLot(lot)) {
                    alert('This lot cannot be edited now because it already has release, damage, charges, or payment activity.');
                    cancelColdLotEdit();
                    return;
                }
                if (String(itemId) !== String(lot.itemId)) {
                    alert('Item cannot be changed during edit.');
                    return;
                }
                const estimatedTotalCharge = calculateColdMoveEstimatedTotals();
                if (paidAtMove > estimatedTotalCharge) {
                    alert('Paid at move cannot exceed estimated total charge.');
                    return;
                }
                const previousQty = Math.max(0, parseFloat(lot.qtyInCold) || 0);
                const unitCost = previousQty > 0 ? ((parseFloat(lot.sourceInventoryCost) || 0) / previousQty) : 0;
                lot.date = date;
                lot.qtyInCold = +qty.toFixed(2);
                lot.bagsInCold = +bags.toFixed(2);
                lot.coldStorageId = coldStorageId;
                lot.coldStorageName = coldStorageName;
                lot.vendorName = vendorName;
                lot.supplierName = lot.supplierName || '-';
                lot.rentPerKg = rentPerKg;
                lot.inOutPerBag = inOutPerBag;
                lot.otherCharge = otherCharge;
                lot.companyExpenseAtMove = +companyExpense.toFixed(2);
                lot.companyExpenseReason = companyExpenseReason;
                lot.estimatedTotalCharge = +estimatedTotalCharge.toFixed(2);
                lot.paidAtMove = +paidAtMove.toFixed(2);
                lot.paidTotal = +paidAtMove.toFixed(2);
                lot.sourceInventoryCost = +Math.max(0, unitCost * qty).toFixed(2);
                lot.lotReference = lotReference;
                lot.remarks = remarks;
                Object.assign(lot, getAuditMeta(false));
                recalculateColdLotPayables(lot);

                const moveEntry = (appData.coldStorageMovements || []).find(function(m) {
                    return String(m.lotId) === String(lot.id) && String(m.type || '') === 'move_in';
                });
                if (moveEntry) {
                    moveEntry.date = lot.date;
                    moveEntry.itemName = lot.itemName;
                    moveEntry.coldStorageName = lot.coldStorageName;
                    moveEntry.vendorName = lot.vendorName;
                    moveEntry.supplierName = lot.supplierName || '-';
                    moveEntry.qty = lot.qtyInCold;
                    moveEntry.bags = lot.bagsInCold;
                    moveEntry.amount = lot.estimatedTotalCharge;
                    moveEntry.paidAmount = lot.paidAtMove;
                    moveEntry.reference = lotReference;
                    moveEntry.remarks = lot.remarks;
                }
                const existingCompanyExpenseEntry = (appData.coldStorageMovements || []).find(function(m) {
                    if (String(m.type || '') !== 'company_expense') return false;
                    if (moveEntry && String(m.linkedMoveMovementId || '') === String(moveEntry.id)) return true;
                    return String(m.lotId || '') === String(lot.id || '');
                });
                if (companyExpense > 0) {
                    if (existingCompanyExpenseEntry) {
                        existingCompanyExpenseEntry.date = lot.date;
                        existingCompanyExpenseEntry.itemName = lot.itemName;
                        existingCompanyExpenseEntry.coldStorageName = lot.coldStorageName;
                        existingCompanyExpenseEntry.vendorName = lot.vendorName;
                        existingCompanyExpenseEntry.supplierName = lot.supplierName || '-';
                        existingCompanyExpenseEntry.qty = 0;
                        existingCompanyExpenseEntry.bags = 0;
                        existingCompanyExpenseEntry.amount = +companyExpense.toFixed(2);
                        existingCompanyExpenseEntry.reference = lotReference;
                        existingCompanyExpenseEntry.remarks = companyExpenseReason || lot.remarks || 'Company cold move expense';
                    } else {
                        appData.coldStorageMovements.push({
                            id: Date.now() + Math.floor(Math.random() * 1000),
                            date: lot.date,
                            type: 'company_expense',
                            lotId: lot.id,
                            itemId: lot.itemId,
                            itemName: lot.itemName,
                            coldStorageName: lot.coldStorageName,
                            vendorName: lot.vendorName,
                            supplierName: lot.supplierName || '-',
                            qty: 0,
                            bags: 0,
                            amount: +companyExpense.toFixed(2),
                            paidAmount: 0,
                            reference: lotReference,
                            linkedMoveMovementId: moveEntry ? moveEntry.id : '',
                            remarks: companyExpenseReason || lot.remarks || 'Company cold move expense'
                        });
                    }
                } else if (existingCompanyExpenseEntry) {
                    appData.coldStorageMovements = (appData.coldStorageMovements || []).filter(function(m) {
                        return String(m.id) !== String(existingCompanyExpenseEntry.id);
                    });
                }

                appData.payments = appData.payments || [];
                appData.payments = appData.payments.filter(function(payment) {
                    if (String(payment.type || '').toLowerCase() !== 'cold_storage_payment') return true;
                    if (String(payment.invoiceId || '') !== String(lot.id)) return true;
                    return String(payment.paidThrough || '') !== 'Cold Storage Move';
                });
                if (lot.paidAtMove > 0) {
                    appData.payments.push({
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        type: 'cold_storage_payment',
                        invoiceId: lot.id,
                        invoice: `COLD-${lot.id}`,
                        party: lot.vendorName,
                        amount: lot.paidAtMove,
                        mode: 'cash',
                        paidThrough: 'Cold Storage Move',
                        reference: lot.lotReference || '',
                        remarks: `Edited move payment | ${lot.coldStorageName}`,
                        date: lot.date
                    });
                }

                rebuildInventoryFromTransactions();
                saveData();
                refreshInventory();
                updateDashboard();
                refreshColdStoragePanel();
                cancelColdLotEdit();
                alert('Cold lot updated successfully.');
                return;
            }
            const stock = appData.inventory[itemId];
            const availableQty = getSaleAvailableQty(itemId);
            if (availableQty < qty) {
                alert('Insufficient quantity in normal inventory.');
                return;
            }
            const estimatedTotalCharge = calculateColdMoveEstimatedTotals();
            if (paidAtMove > estimatedTotalCharge) {
                alert('Paid at move cannot exceed estimated total charge.');
                return;
            }
            const totalCostBefore = parseFloat(stock.totalCost) || 0;
            const avgCost = availableQty > 0 ? (totalCostBefore / availableQty) : 0;
            const transferredValue = avgCost * qty;
            stock.quantity = availableQty - qty;
            stock.totalCost = totalCostBefore - transferredValue;
            if (stock.quantity <= 0.0001) delete appData.inventory[itemId];

            const lot = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                itemId: itemId,
                itemName: getItemNameById(itemId),
                unit: getItemUnitById(itemId),
                coldStorageId: coldStorageId,
                coldStorageName: coldStorageName,
                vendorName: vendorName,
                supplierName: '-',
                qtyInCold: qty,
                bagsInCold: bags,
                rentPerKg: rentPerKg,
                inOutPerBag: inOutPerBag,
                otherCharge: otherCharge,
                companyExpenseAtMove: +companyExpense.toFixed(2),
                companyExpenseReason: companyExpenseReason,
                periodicChargeTotal: 0,
                estimatedTotalCharge: estimatedTotalCharge,
                paidAtMove: paidAtMove,
                paidAtRelease: 0,
                paidTotal: paidAtMove,
                payableAdjustmentTotal: 0,
                remainingPayable: Math.max(0, estimatedTotalCharge - paidAtMove),
                releaseQtyTotal: 0,
                releaseBagsTotal: 0,
                shrinkageQtyTotal: 0,
                damageQtyTotal: 0,
                damageBagsTotal: 0,
                damageLossTotal: 0,
                damageUsShareTotal: 0,
                damageVendorShareTotal: 0,
                status: 'active',
                remarks: remarks,
                lotReference: lotReference,
                sourceInventoryCost: +transferredValue.toFixed(2),
                ...getAuditMeta(true)
            };
            recalculateColdLotPayables(lot);
            appData.coldStorageLots.push(lot);
            appData.coldStorageMovements = appData.coldStorageMovements || [];
            const moveMovement = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                type: 'move_in',
                lotId: lot.id,
                itemId: itemId,
                itemName: lot.itemName,
                coldStorageName: coldStorageName,
                vendorName: vendorName,
                supplierName: lot.supplierName,
                qty: qty,
                bags: bags,
                amount: estimatedTotalCharge,
                paidAmount: paidAtMove,
                reference: lotReference,
                remarks: remarks
            };
            appData.coldStorageMovements.push(moveMovement);
            if (companyExpense > 0) {
                appData.coldStorageMovements.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    date: date,
                    type: 'company_expense',
                    lotId: lot.id,
                    itemId: itemId,
                    itemName: lot.itemName,
                    coldStorageName: coldStorageName,
                    vendorName: vendorName,
                    supplierName: lot.supplierName,
                    qty: 0,
                    bags: 0,
                    amount: +companyExpense.toFixed(2),
                    paidAmount: 0,
                    reference: lotReference,
                    linkedMoveMovementId: moveMovement.id,
                    remarks: companyExpenseReason || remarks || 'Company cold move expense'
                });
            }

            if (paidAtMove > 0) {
                appData.payments = appData.payments || [];
                appData.payments.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    type: 'cold_storage_payment',
                    invoiceId: lot.id,
                    invoice: `COLD-${lot.id}`,
                    party: vendorName,
                    amount: paidAtMove,
                    mode: 'cash',
                    paidThrough: 'Cold Storage Move',
                    reference: lotReference,
                    remarks: `Move payment | ${coldStorageName}`,
                    date: date
                });
            }

            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            resetColdMoveForm();
            alert('Moved to cold storage successfully.');
        }

        function populateColdLotSelectors() {
            const chargeSelect = document.getElementById('coldChargeLotId');
            const releaseSelect = document.getElementById('coldReleaseLotId');
            const damageSelect = document.getElementById('coldDamageLotId');
            const shrinkageSelect = document.getElementById('coldShrinkageLotId');
            const currentCharge = chargeSelect ? chargeSelect.value : '';
            const currentRelease = releaseSelect ? releaseSelect.value : '';
            const currentDamage = damageSelect ? damageSelect.value : '';
            const currentShrinkage = shrinkageSelect ? shrinkageSelect.value : '';
            const activeLots = (appData.coldStorageLots || []).filter(function(lot) { return (lot.status || 'active') !== 'released' && (parseFloat(lot.qtyInCold) || 0) > 0; });
            const lotLabel = function(lot) {
                const qty = Number(lot && lot.qtyInCold || 0).toFixed(2);
                const bags = Number(lot && lot.bagsInCold || 0).toFixed(2);
                return `${escapeHtml(lot.itemName)} | ${escapeHtml(lot.coldStorageName)} | Qty ${qty} | Bags ${bags}`;
            };

            if (chargeSelect) {
                chargeSelect.innerHTML = '<option value="">Select Lot</option>';
                activeLots.forEach(function(lot) {
                    chargeSelect.innerHTML += `<option value="${lot.id}">${lotLabel(lot)}</option>`;
                });
                if (currentCharge && chargeSelect.querySelector(`option[value="${currentCharge}"]`)) chargeSelect.value = currentCharge;
            }

            if (releaseSelect) {
                releaseSelect.innerHTML = '<option value="">Select Lot</option>';
                activeLots.forEach(function(lot) {
                    releaseSelect.innerHTML += `<option value="${lot.id}">${lotLabel(lot)}</option>`;
                });
                if (currentRelease && releaseSelect.querySelector(`option[value="${currentRelease}"]`)) releaseSelect.value = currentRelease;
            }
            if (damageSelect) {
                damageSelect.innerHTML = '<option value="">Select Lot</option>';
                activeLots.forEach(function(lot) {
                    damageSelect.innerHTML += `<option value="${lot.id}">${lotLabel(lot)}</option>`;
                });
                if (currentDamage && damageSelect.querySelector(`option[value="${currentDamage}"]`)) damageSelect.value = currentDamage;
            }
            if (shrinkageSelect) {
                shrinkageSelect.innerHTML = '<option value="">Select Lot</option>';
                activeLots.forEach(function(lot) {
                    shrinkageSelect.innerHTML += `<option value="${lot.id}">${lotLabel(lot)}</option>`;
                });
                if (currentShrinkage && shrinkageSelect.querySelector(`option[value="${currentShrinkage}"]`)) shrinkageSelect.value = currentShrinkage;
            }
            onColdReleaseLotChange();
            onColdDamageLotChange();
            onColdShrinkageLotChange();
        }

        function getColdLotExpectedQtyByBags(lot, bagsValue) {
            const lotQty = Math.max(0, parseFloat(lot && lot.qtyInCold) || 0);
            const lotBags = Math.max(0, parseFloat(lot && lot.bagsInCold) || 0);
            const bags = Math.max(0, parseFloat(bagsValue) || 0);
            if (lotQty <= 0 || lotBags <= 0 || bags <= 0) return 0;
            return +(bags * (lotQty / lotBags)).toFixed(2);
        }

        function onColdReleaseLotChange() {
            const lotId = (document.getElementById('coldReleaseLotId') && document.getElementById('coldReleaseLotId').value) || '';
            const hintEl = document.getElementById('coldReleaseAvailableHint');
            if (!hintEl) return;
            if (!lotId) {
                hintEl.textContent = 'Available in lot: 0';
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                hintEl.textContent = 'Available in lot: 0';
                return;
            }
            const avgPerBag = (Math.max(0, parseFloat(lot.bagsInCold) || 0) > 0)
                ? ((Math.max(0, parseFloat(lot.qtyInCold) || 0)) / Math.max(0, parseFloat(lot.bagsInCold) || 0))
                : 0;
            hintEl.textContent = `Available in lot: ${Number(lot.qtyInCold || 0).toFixed(2)} ${lot.unit || 'kg'} | Bags: ${Number(lot.bagsInCold || 0).toFixed(2)} | Avg/Bag: ${avgPerBag.toFixed(2)} | Expected qty is reference only | Shrinkage applies only at final bag closure | Remaining Payable: ${RU}${Number(lot.remainingPayable || 0).toFixed(2)}`;
            updateColdReleaseExpectations();
        }

        function updateColdReleaseExpectations() {
            const lotId = (document.getElementById('coldReleaseLotId') && document.getElementById('coldReleaseLotId').value) || '';
            const hintEl = document.getElementById('coldReleaseAvailableHint');
            if (!hintEl || !lotId) return;
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) return;
            const releaseBags = Math.max(0, parseFloat(document.getElementById('coldReleaseBags') && document.getElementById('coldReleaseBags').value) || 0);
            const releaseQty = Math.max(0, parseFloat(document.getElementById('coldReleaseQty') && document.getElementById('coldReleaseQty').value) || 0);
            const expectedQty = getColdLotExpectedQtyByBags(lot, releaseBags);
            const isFinalBagRelease = Math.abs((Math.max(0, parseFloat(lot.bagsInCold) || 0) - releaseBags)) <= 0.0001;
            const shrinkageQty = isFinalBagRelease
                ? Math.max(0, +(Math.max(0, parseFloat(lot.qtyInCold) || 0) - releaseQty).toFixed(2))
                : 0;
            const avgPerBag = (Math.max(0, parseFloat(lot.bagsInCold) || 0) > 0)
                ? ((Math.max(0, parseFloat(lot.qtyInCold) || 0)) / Math.max(0, parseFloat(lot.bagsInCold) || 0))
                : 0;
            const finalNote = isFinalBagRelease ? ' | Final bag closure: remaining qty auto-adjusts to shrinkage' : ' | Non-final: shrinkage is 0';
            hintEl.textContent = `Available in lot: ${Number(lot.qtyInCold || 0).toFixed(2)} ${lot.unit || 'kg'} | Bags: ${Number(lot.bagsInCold || 0).toFixed(2)} | Avg/Bag: ${avgPerBag.toFixed(2)} | Expected Qty (reference): ${expectedQty.toFixed(2)} | Shrinkage: ${shrinkageQty.toFixed(2)}${finalNote} | Remaining Payable: ${RU}${Number(lot.remainingPayable || 0).toFixed(2)}`;
        }

        function onColdShrinkageLotChange() {
            const lotId = (document.getElementById('coldShrinkageLotId') && document.getElementById('coldShrinkageLotId').value) || '';
            const hintEl = document.getElementById('coldShrinkageAvailableHint');
            if (!hintEl) return;
            if (!lotId) {
                hintEl.textContent = 'Available in lot: 0';
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                hintEl.textContent = 'Available in lot: 0';
                return;
            }
            hintEl.textContent = `Available in lot: ${Number(lot.qtyInCold || 0).toFixed(2)} ${lot.unit || 'kg'} | Bags remain: ${Number(lot.bagsInCold || 0).toFixed(2)}`;
        }

        function onColdDamageLotChange() {
            const lotId = (document.getElementById('coldDamageLotId') && document.getElementById('coldDamageLotId').value) || '';
            const hintEl = document.getElementById('coldDamageAvailableHint');
            if (!hintEl) return;
            if (!lotId) {
                hintEl.textContent = 'Available in lot: 0 kg | 0 bags';
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                hintEl.textContent = 'Available in lot: 0 kg | 0 bags';
                return;
            }
            hintEl.textContent = `Available in lot: ${Number(lot.qtyInCold || 0).toFixed(2)} ${lot.unit || 'kg'} | ${Number(lot.bagsInCold || 0).toFixed(2)} bags`;
            syncColdDamageInputs(coldDamageLastEditedField);
        }

        function onColdDamageQtyInput() {
            coldDamageLastEditedField = 'qty';
            syncColdDamageInputs('qty');
        }

        function onColdDamageBagsInput() {
            coldDamageLastEditedField = 'bags';
            syncColdDamageInputs('bags');
        }

        function syncColdDamageInputs(changedField) {
            const lotId = (document.getElementById('coldDamageLotId') && document.getElementById('coldDamageLotId').value) || '';
            const qtyEl = document.getElementById('coldDamageQty');
            const bagsEl = document.getElementById('coldDamageBags');
            const qtyVal = Math.max(0, parseFloat(qtyEl && qtyEl.value) || 0);
            const bagsVal = Math.max(0, parseFloat(bagsEl && bagsEl.value) || 0);
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (lot) {
                const lotQty = Math.max(0, parseFloat(lot.qtyInCold) || 0);
                const lotBags = Math.max(0, parseFloat(lot.bagsInCold) || 0);
                const qtyPerBag = lotBags > 0 ? (lotQty / lotBags) : 0;
                if (changedField === 'qty' && bagsEl && qtyPerBag > 0) {
                    bagsEl.value = qtyVal > 0 ? (qtyVal / qtyPerBag).toFixed(2) : '';
                }
                if (changedField === 'bags' && qtyEl && qtyPerBag > 0) {
                    qtyEl.value = bagsVal > 0 ? (bagsVal * qtyPerBag).toFixed(2) : '';
                }
            }
            updateColdDamageEstimate();
        }

        function updateColdDamageEstimate() {
            const lotId = (document.getElementById('coldDamageLotId') && document.getElementById('coldDamageLotId').value) || '';
            const damageQty = Math.max(0, parseFloat(document.getElementById('coldDamageQty') && document.getElementById('coldDamageQty').value) || 0);
            const damageBags = Math.max(0, parseFloat(document.getElementById('coldDamageBags') && document.getElementById('coldDamageBags').value) || 0);
            const bearer = (document.getElementById('coldDamageBearer') && document.getElementById('coldDamageBearer').value) || 'us';
            const splitPercentInput = Math.max(0, Math.min(100, parseFloat(document.getElementById('coldDamageSplitPercent') && document.getElementById('coldDamageSplitPercent').value) || 50));
            const splitWrapper = document.getElementById('coldDamageSplitWrap');
            const otherShareLabelEl = document.getElementById('coldDamageOtherShareLabel');
            if (splitWrapper) splitWrapper.classList.toggle('hidden', bearer !== 'split');
            if (otherShareLabelEl) {
                if (bearer === 'supplier') otherShareLabelEl.textContent = 'Supplier Share';
                else if (bearer === 'no_one') otherShareLabelEl.textContent = 'Other Party Share';
                else otherShareLabelEl.textContent = 'Cold Storage Share';
            }

            const totalLossEl = document.getElementById('coldDamageTotalLossPreview');
            const usLossEl = document.getElementById('coldDamageUsLossPreview');
            const vendorLossEl = document.getElementById('coldDamageVendorLossPreview');

            if (!lotId) {
                if (totalLossEl) totalLossEl.textContent = `${RU}0.00`;
                if (usLossEl) usLossEl.textContent = `${RU}0.00`;
                if (vendorLossEl) vendorLossEl.textContent = `${RU}0.00`;
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) return;
            const lotBags = Math.max(0, parseFloat(lot.bagsInCold) || 0);
            const lotQty = Math.max(0, parseFloat(lot.qtyInCold) || 0);
            const qtyFromBags = (lotBags > 0) ? (damageBags * (lotQty / lotBags)) : 0;
            const effectiveQty = coldDamageLastEditedField === 'bags' ? qtyFromBags : damageQty;
            const estimates = calculateColdDamageLossEstimate(lot, effectiveQty);
            let vendorShareRatio = 0;
            if (bearer === 'cold') vendorShareRatio = 1;
            else if (bearer === 'supplier') vendorShareRatio = 1;
            else if (bearer === 'split') vendorShareRatio = splitPercentInput / 100;
            else if (bearer === 'no_one') vendorShareRatio = 0;
            const vendorShare = estimates.totalLoss * vendorShareRatio;
            const usShare = (bearer === 'no_one') ? 0 : (estimates.totalLoss - vendorShare);
            if (totalLossEl) totalLossEl.textContent = `${RU}${estimates.totalLoss.toFixed(2)}`;
            if (usLossEl) usLossEl.textContent = `${RU}${usShare.toFixed(2)}`;
            if (vendorLossEl) vendorLossEl.textContent = `${RU}${vendorShare.toFixed(2)}`;
        }

        function addColdPeriodicCharge() {
            const date = (document.getElementById('coldChargeDate') && document.getElementById('coldChargeDate').value) || '';
            const lotId = (document.getElementById('coldChargeLotId') && document.getElementById('coldChargeLotId').value) || '';
            const amount = Math.max(0, parseFloat(document.getElementById('coldChargeAmount') && document.getElementById('coldChargeAmount').value) || 0);
            const lotReference = String((document.getElementById('coldChargeReference') && document.getElementById('coldChargeReference').value) || '').trim();
            const remarks = (document.getElementById('coldChargeRemarks') && document.getElementById('coldChargeRemarks').value || '').trim();
            if (!date || !lotId || amount <= 0) {
                alert('Please select date, lot, and enter a valid amount.');
                return;
            }
            if (!lotReference) {
                alert('Please enter LOT/CRATE reference.');
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Selected lot not found.');
                return;
            }
            lot.periodicChargeTotal = (parseFloat(lot.periodicChargeTotal) || 0) + amount;
            lot.estimatedTotalCharge = (parseFloat(lot.estimatedTotalCharge) || 0) + amount;
            recalculateColdLotPayables(lot);
            appData.coldStorageCharges = appData.coldStorageCharges || [];
            appData.coldStorageCharges.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                amount: amount,
                reference: lotReference,
                remarks: remarks
            });
            appData.coldStorageMovements = appData.coldStorageMovements || [];
            appData.coldStorageMovements.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                type: 'charge_add',
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                amount: amount,
                reference: lotReference,
                remarks: remarks
            });
            saveData();
            refreshColdStoragePanel();
            alert('Periodic cold storage charge added.');
        }

        function appendColdStorageShrinkageMovement(lot, payload) {
            if (!lot) return null;
            const date = String(payload && payload.date || '').trim();
            const qty = Math.max(0, parseFloat(payload && payload.qty) || 0);
            const reference = String(payload && payload.reference || '').trim();
            const remarks = String(payload && payload.remarks || '').trim();
            const linkedReleaseMovementId = String(payload && payload.linkedReleaseMovementId || '').trim();
            const applyToLot = payload && payload.applyToLot !== false;
            if (!date || qty <= 0) return null;
            const qtyInLot = Math.max(0, parseFloat(lot.qtyInCold) || 0);
            if (qty > qtyInLot + 0.0001) return null;
            if (applyToLot) {
                lot.qtyInCold = +(qtyInLot - qty).toFixed(2);
                if (lot.qtyInCold <= 0.0001) lot.qtyInCold = 0;
                lot.shrinkageQtyTotal = +((parseFloat(lot.shrinkageQtyTotal) || 0) + qty).toFixed(2);
                lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : (lot.status || 'active');
            }
            appData.coldStorageMovements = appData.coldStorageMovements || [];
            const movement = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                type: 'shrinkage',
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                supplierName: lot.supplierName || '-',
                qty: +qty.toFixed(2),
                bags: 0,
                amount: 0,
                reference: reference,
                remarks: remarks,
                linkedReleaseMovementId: linkedReleaseMovementId || ''
            };
            appData.coldStorageMovements.push(movement);
            return movement;
        }

        function recordColdStorageShrinkage() {
            const date = (document.getElementById('coldShrinkageDate') && document.getElementById('coldShrinkageDate').value) || '';
            const lotId = (document.getElementById('coldShrinkageLotId') && document.getElementById('coldShrinkageLotId').value) || '';
            const shrinkageQty = Math.max(0, parseFloat(document.getElementById('coldShrinkageQty') && document.getElementById('coldShrinkageQty').value) || 0);
            const lotReference = String((document.getElementById('coldShrinkageReference') && document.getElementById('coldShrinkageReference').value) || '').trim();
            const remarks = (document.getElementById('coldShrinkageRemarks') && document.getElementById('coldShrinkageRemarks').value || '').trim();
            if (!date || !lotId || shrinkageQty <= 0) {
                alert('Please select date, lot and valid shrinkage quantity.');
                return;
            }
            if (!lotReference) {
                alert('Please enter LOT/CRATE reference.');
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Selected lot not found.');
                return;
            }
            const movement = appendColdStorageShrinkageMovement(lot, {
                date: date,
                qty: shrinkageQty,
                reference: lotReference,
                remarks: remarks
            });
            if (!movement) {
                alert('Shrinkage quantity cannot exceed available lot quantity.');
                return;
            }
            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            alert('Cold storage shrinkage recorded successfully.');
        }

        function applyColdLotRelease(payload) {
            const date = String(payload && payload.date || '');
            const lotId = String(payload && payload.lotId || '');
            const releaseQty = Math.max(0, parseFloat(payload && payload.releaseQty) || 0);
            const releaseBags = Math.max(0, parseFloat(payload && payload.releaseBags) || 0);
            const paidAtRelease = Math.max(0, parseFloat(payload && payload.paidAtRelease) || 0);
            const lotReference = String(payload && payload.reference || '').trim();
            const remarks = String(payload && payload.remarks || '').trim();
            if (!date || !lotId || releaseQty <= 0 || releaseBags <= 0) {
                alert('Please select date, lot, release bags, and release quantity.');
                return false;
            }
            if (!lotReference) {
                alert('Please enter LOT/CRATE reference.');
                return false;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Selected lot not found.');
                return false;
            }
            const qtyInLot = Math.max(0, parseFloat(lot.qtyInCold) || 0);
            const bagsInLot = Math.max(0, parseFloat(lot.bagsInCold) || 0);
            const expectedReleaseQty = getColdLotExpectedQtyByBags(lot, releaseBags);
            if (releaseBags > bagsInLot) {
                alert('Release bags cannot exceed lot bags.');
                return false;
            }
            if (releaseQty > qtyInLot + 0.0001) {
                alert('Actual release quantity cannot exceed lot quantity.');
                return false;
            }
            const isFinalBagRelease = Math.abs((bagsInLot - releaseBags)) <= 0.0001;
            const shrinkageQty = isFinalBagRelease
                ? Math.max(0, +(qtyInLot - releaseQty).toFixed(2))
                : 0;
            const totalQtyOut = +(releaseQty + shrinkageQty).toFixed(2);
            if (totalQtyOut > qtyInLot + 0.0001) {
                alert('Release quantity cannot exceed lot quantity.');
                return false;
            }
            if (paidAtRelease > (parseFloat(lot.remainingPayable) || 0)) {
                alert('Paid at release cannot exceed remaining payable.');
                return false;
            }
            lot.qtyInCold = +(qtyInLot - totalQtyOut).toFixed(2);
            if (lot.qtyInCold <= 0.0001) lot.qtyInCold = 0;
            lot.bagsInCold = +(bagsInLot - releaseBags).toFixed(2);
            if (lot.bagsInCold <= 0.0001) lot.bagsInCold = 0;
            lot.releaseQtyTotal = (parseFloat(lot.releaseQtyTotal) || 0) + releaseQty;
            lot.releaseBagsTotal = (parseFloat(lot.releaseBagsTotal) || 0) + releaseBags;
            lot.shrinkageQtyTotal = (parseFloat(lot.shrinkageQtyTotal) || 0) + shrinkageQty;
            lot.paidAtRelease = (parseFloat(lot.paidAtRelease) || 0) + paidAtRelease;
            lot.paidTotal = (parseFloat(lot.paidTotal) || 0) + paidAtRelease;
            if (lotReference) lot.lotReference = lotReference;
            recalculateColdLotPayables(lot);
            lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : 'partiallyReleased';

            if (!appData.inventory[lot.itemId]) appData.inventory[lot.itemId] = { quantity: 0, totalCost: 0 };
            const sourceCost = parseFloat(lot.sourceInventoryCost) || 0;
            const originalQty = (parseFloat(lot.releaseQtyTotal) || 0) + (parseFloat(lot.qtyInCold) || 0) + (parseFloat(lot.shrinkageQtyTotal) || 0);
            const avgInventoryCost = originalQty > 0 ? (sourceCost / originalQty) : 0;
            appData.inventory[lot.itemId].quantity += releaseQty;
            appData.inventory[lot.itemId].totalCost += (avgInventoryCost * releaseQty);

            appData.coldStorageMovements = appData.coldStorageMovements || [];
            const movementId = Date.now() + Math.floor(Math.random() * 1000);
            const movementEntry = {
                id: movementId,
                date: date,
                type: 'release_out',
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                qty: releaseQty,
                bags: releaseBags,
                amount: paidAtRelease,
                reference: lotReference,
                remarks: remarks,
                shrinkageQty: +shrinkageQty.toFixed(2),
                expectedQty: +expectedReleaseQty.toFixed(2),
                isFinalBagRelease: isFinalBagRelease
            };
            appData.coldStorageMovements.push(movementEntry);

            if (shrinkageQty > 0) {
                const shrinkageMovement = appendColdStorageShrinkageMovement(lot, {
                    date: date,
                    qty: shrinkageQty,
                    reference: lotReference,
                    remarks: (remarks ? (remarks + ' | ') : '') + 'Auto shrinkage at release',
                    linkedReleaseMovementId: movementEntry.id,
                    applyToLot: false
                });
                if (shrinkageMovement) {
                    movementEntry.linkedShrinkageMovementId = shrinkageMovement.id;
                }
            }

            if (paidAtRelease > 0) {
                appData.payments = appData.payments || [];
                const paymentEntry = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    type: 'cold_storage_payment',
                    invoiceId: lot.id,
                    invoice: `COLD-${lot.id}`,
                    party: lot.vendorName,
                    amount: paidAtRelease,
                    mode: 'cash',
                    paidThrough: 'Cold Storage Release',
                    reference: lotReference,
                    remarks: `Release payment | ${lot.coldStorageName}`,
                    date: date
                };
                appData.payments.push(paymentEntry);
                movementEntry.paymentId = paymentEntry.id;
            }

            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            return true;
        }

        function submitInlineColdRelease(lotId) {
            const idStr = String(lotId || '');
            const date = (document.getElementById('inlineColdReleaseDate_' + idStr) && document.getElementById('inlineColdReleaseDate_' + idStr).value) || '';
            const releaseQty = Math.max(0, parseFloat(document.getElementById('inlineColdReleaseQty_' + idStr) && document.getElementById('inlineColdReleaseQty_' + idStr).value) || 0);
            const releaseBags = Math.max(0, parseFloat(document.getElementById('inlineColdReleaseBags_' + idStr) && document.getElementById('inlineColdReleaseBags_' + idStr).value) || 0);
            const paidAtRelease = Math.max(0, parseFloat(document.getElementById('inlineColdReleasePaid_' + idStr) && document.getElementById('inlineColdReleasePaid_' + idStr).value) || 0);
            const lotReference = (document.getElementById('inlineColdReleaseReference_' + idStr) && document.getElementById('inlineColdReleaseReference_' + idStr).value || '').trim();
            const remarks = (document.getElementById('inlineColdReleaseRemarks_' + idStr) && document.getElementById('inlineColdReleaseRemarks_' + idStr).value || '').trim();
            if (applyColdLotRelease({ date: date, lotId: idStr, releaseQty: releaseQty, releaseBags: releaseBags, paidAtRelease: paidAtRelease, reference: lotReference, remarks: remarks })) {
                activeInlineReleaseLotId = null;
                alert('Released from cold storage successfully.');
            }
        }

        function releaseFromColdStorage() {
            const date = (document.getElementById('coldReleaseDate') && document.getElementById('coldReleaseDate').value) || '';
            const lotId = (document.getElementById('coldReleaseLotId') && document.getElementById('coldReleaseLotId').value) || '';
            const releaseBags = Math.max(0, parseFloat(document.getElementById('coldReleaseBags') && document.getElementById('coldReleaseBags').value) || 0);
            const releaseQty = Math.max(0, parseFloat(document.getElementById('coldReleaseQty') && document.getElementById('coldReleaseQty').value) || 0);
            const paidAtRelease = Math.max(0, parseFloat(document.getElementById('coldReleasePaidAmount') && document.getElementById('coldReleasePaidAmount').value) || 0);
            const lotReference = (document.getElementById('coldReleaseReference') && document.getElementById('coldReleaseReference').value || '').trim();
            const remarks = (document.getElementById('coldReleaseRemarks') && document.getElementById('coldReleaseRemarks').value || '').trim();
            if (applyColdLotRelease({ date: date, lotId: lotId, releaseQty: releaseQty, releaseBags: releaseBags, paidAtRelease: paidAtRelease, reference: lotReference, remarks: remarks })) {
                alert('Released from cold storage successfully.');
            }
        }

        function findReleasePaymentByMovement(movement, lot) {
            if (!movement) return null;
            const paymentId = movement.paymentId != null ? String(movement.paymentId) : '';
            if (paymentId) {
                const direct = (appData.payments || []).find(function(p) { return String(p.id) === paymentId; });
                if (direct) return direct;
            }
            const lotIdStr = String((movement.lotId != null ? movement.lotId : (lot && lot.id)) || '');
            return (appData.payments || []).find(function(p) {
                if (String(p.type || '').toLowerCase() !== 'cold_storage_payment') return false;
                if (String(p.paidThrough || '') !== 'Cold Storage Release') return false;
                if (String(p.invoiceId || '') !== lotIdStr) return false;
                const sameDate = String(p.date || '') === String(movement.date || '');
                const sameAmount = Math.abs((parseFloat(p.amount) || 0) - (parseFloat(movement.amount) || 0)) <= 0.01;
                return sameDate && sameAmount;
            }) || null;
        }

        function getColdReleaseMovementEditContext(movementId) {
            const move = (appData.coldStorageMovements || []).find(function(m) {
                return String(m.id) === String(movementId) && String(m.type || '') === 'release_out';
            });
            if (!move) return null;
            const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(move.lotId || ''); });
            if (!lot) return null;
            const linkedShrinkageMove = (appData.coldStorageMovements || []).find(function(m) {
                return String(m.type || '') === 'shrinkage' && String(m.linkedReleaseMovementId || '') === String(move.id || '');
            }) || (appData.coldStorageMovements || []).find(function(m) {
                return String(m.id || '') === String(move.linkedShrinkageMovementId || '');
            }) || null;
            const oldShrinkageQty = Math.max(0, parseFloat(linkedShrinkageMove && linkedShrinkageMove.qty) || parseFloat(move.shrinkageQty) || 0);
            const oldQty = Math.max(0, parseFloat(move.qty) || 0);
            const oldBags = Math.max(0, parseFloat(move.bags) || 0);
            const oldPaid = Math.max(0, parseFloat(move.amount) || 0);
            const baseQtyInLot = Math.max(0, (parseFloat(lot.qtyInCold) || 0) + oldQty + oldShrinkageQty);
            const baseBagsInLot = Math.max(0, (parseFloat(lot.bagsInCold) || 0) + oldBags);
            const baseReleaseQtyTotal = Math.max(0, (parseFloat(lot.releaseQtyTotal) || 0) - oldQty);
            const baseReleaseBagsTotal = Math.max(0, (parseFloat(lot.releaseBagsTotal) || 0) - oldBags);
            const baseShrinkageQtyTotal = Math.max(0, (parseFloat(lot.shrinkageQtyTotal) || 0) - oldShrinkageQty);
            const basePaidAtRelease = Math.max(0, (parseFloat(lot.paidAtRelease) || 0) - oldPaid);
            const basePaidTotal = Math.max(0, (parseFloat(lot.paidTotal) || 0) - oldPaid);
            const estimated = Math.max(0, parseFloat(lot.estimatedTotalCharge) || 0);
            const payableAdjustments = Math.max(0, parseFloat(lot.payableAdjustmentTotal) || 0);
            const maxEditablePaid = Math.max(0, estimated - payableAdjustments - basePaidTotal);
            return {
                move: move,
                lot: lot,
                oldQty: oldQty,
                oldBags: oldBags,
                oldPaid: oldPaid,
                oldShrinkageQty: oldShrinkageQty,
                baseQtyInLot: baseQtyInLot,
                baseBagsInLot: baseBagsInLot,
                baseReleaseQtyTotal: baseReleaseQtyTotal,
                baseReleaseBagsTotal: baseReleaseBagsTotal,
                baseShrinkageQtyTotal: baseShrinkageQtyTotal,
                basePaidAtRelease: basePaidAtRelease,
                basePaidTotal: basePaidTotal,
                maxEditablePaid: maxEditablePaid,
                linkedShrinkageMove: linkedShrinkageMove
            };
        }

        function editColdReleaseMovement(movementId) {
            const ctx = getColdReleaseMovementEditContext(movementId);
            if (!ctx) {
                alert('Release movement entry not found.');
                return;
            }
            activeInlineMovementReleaseEditId = String(movementId);
            renderColdStorageMovementsHistory();
        }

        function cancelEditColdReleaseMovement() {
            activeInlineMovementReleaseEditId = null;
            renderColdStorageMovementsHistory();
        }

        function submitEditColdReleaseMovement(movementId) {
            const ctx = getColdReleaseMovementEditContext(movementId);
            if (!ctx) {
                alert('Release movement entry not found.');
                return;
            }
            const idStr = String(movementId || '');
            const newDate = String((document.getElementById('movementReleaseEditDate_' + idStr) && document.getElementById('movementReleaseEditDate_' + idStr).value) || '').trim();
            const newQty = Math.max(0, parseFloat(document.getElementById('movementReleaseEditQty_' + idStr) && document.getElementById('movementReleaseEditQty_' + idStr).value) || 0);
            const newBags = Math.max(0, parseFloat(document.getElementById('movementReleaseEditBags_' + idStr) && document.getElementById('movementReleaseEditBags_' + idStr).value) || 0);
            const newPaid = Math.max(0, parseFloat(document.getElementById('movementReleaseEditPaid_' + idStr) && document.getElementById('movementReleaseEditPaid_' + idStr).value) || 0);
            const newReference = String((document.getElementById('movementReleaseEditReference_' + idStr) && document.getElementById('movementReleaseEditReference_' + idStr).value) || '').trim();
            const nextRemarks = String((document.getElementById('movementReleaseEditRemarks_' + idStr) && document.getElementById('movementReleaseEditRemarks_' + idStr).value) || '').trim();

            if (!newDate || newQty <= 0) {
                alert('Please enter valid date and release quantity.');
                return;
            }
            const expectedQty = getColdLotExpectedQtyByBags(ctx.lot, newBags);
            const isFinalBagRelease = Math.abs((ctx.baseBagsInLot - newBags)) <= 0.0001;
            const nextShrinkageQty = isFinalBagRelease
                ? Math.max(0, +(ctx.baseQtyInLot - newQty).toFixed(2))
                : 0;
            if (newQty + nextShrinkageQty > ctx.baseQtyInLot + 0.0001) {
                alert('Release quantity cannot exceed available lot quantity for this edit.');
                return;
            }
            if (newBags > ctx.baseBagsInLot + 0.0001) {
                alert('Release bags cannot exceed available lot bags for this edit.');
                return;
            }
            if (newPaid > ctx.maxEditablePaid + 0.0001) {
                alert('Paid at release cannot exceed remaining payable for this edit.');
                return;
            }
            if (!newReference) {
                alert('Please enter LOT/CRATE reference.');
                return;
            }

            const qtyReduction = Math.max(0, ctx.oldQty - newQty);
            if (qtyReduction > 0) {
                const currentNormalQty = Math.max(0, parseFloat(appData.inventory[ctx.lot.itemId] && appData.inventory[ctx.lot.itemId].quantity) || 0);
                if (currentNormalQty + 0.0001 < qtyReduction) {
                    alert('Cannot reduce this release quantity because corresponding stock is no longer available in normal inventory.');
                    return;
                }
            }

            if (!appData.inventory[ctx.lot.itemId]) appData.inventory[ctx.lot.itemId] = { quantity: 0, totalCost: 0 };
            const sourceCost = Math.max(0, parseFloat(ctx.lot.sourceInventoryCost) || 0);
            const originalQty = Math.max(0.0001, ctx.baseReleaseQtyTotal + ctx.baseShrinkageQtyTotal + ctx.baseQtyInLot);
            const avgInventoryCost = sourceCost / originalQty;
            const qtyDelta = newQty - ctx.oldQty;
            appData.inventory[ctx.lot.itemId].quantity = (parseFloat(appData.inventory[ctx.lot.itemId].quantity) || 0) + qtyDelta;
            appData.inventory[ctx.lot.itemId].totalCost = (parseFloat(appData.inventory[ctx.lot.itemId].totalCost) || 0) + (avgInventoryCost * qtyDelta);
            if ((parseFloat(appData.inventory[ctx.lot.itemId].quantity) || 0) <= 0.0001) {
                delete appData.inventory[ctx.lot.itemId];
            }

            ctx.lot.qtyInCold = +(ctx.baseQtyInLot - newQty - nextShrinkageQty).toFixed(2);
            ctx.lot.bagsInCold = +(ctx.baseBagsInLot - newBags).toFixed(2);
            ctx.lot.releaseQtyTotal = +(ctx.baseReleaseQtyTotal + newQty).toFixed(2);
            ctx.lot.releaseBagsTotal = +(ctx.baseReleaseBagsTotal + newBags).toFixed(2);
            ctx.lot.shrinkageQtyTotal = +(ctx.baseShrinkageQtyTotal + nextShrinkageQty).toFixed(2);
            ctx.lot.paidAtRelease = +(ctx.basePaidAtRelease + newPaid).toFixed(2);
            ctx.lot.paidTotal = +(ctx.basePaidTotal + newPaid).toFixed(2);
            recalculateColdLotPayables(ctx.lot);
            ctx.lot.status = (ctx.lot.qtyInCold <= 0.0001) ? 'released' : 'partiallyReleased';
            Object.assign(ctx.lot, getAuditMeta(false));

            if (ctx.linkedShrinkageMove) {
                if (nextShrinkageQty <= 0.0001) {
                    appData.coldStorageMovements = (appData.coldStorageMovements || []).filter(function(m) { return String(m.id) !== String(ctx.linkedShrinkageMove.id); });
                    delete ctx.move.linkedShrinkageMovementId;
                } else {
                    ctx.linkedShrinkageMove.date = newDate;
                    ctx.linkedShrinkageMove.qty = +nextShrinkageQty.toFixed(2);
                    ctx.linkedShrinkageMove.reference = newReference;
                    ctx.linkedShrinkageMove.remarks = (nextRemarks ? (nextRemarks + ' | ') : '') + 'Auto shrinkage at release';
                }
            } else if (nextShrinkageQty > 0.0001) {
                const nextShrinkMove = appendColdStorageShrinkageMovement(ctx.lot, {
                    date: newDate,
                    qty: nextShrinkageQty,
                    reference: newReference,
                    remarks: (nextRemarks ? (nextRemarks + ' | ') : '') + 'Auto shrinkage at release',
                    linkedReleaseMovementId: ctx.move.id,
                    applyToLot: false
                });
                if (nextShrinkMove) {
                    ctx.move.linkedShrinkageMovementId = nextShrinkMove.id;
                }
            }

            const payment = findReleasePaymentByMovement(ctx.move, ctx.lot);
            if (payment && newPaid <= 0.0001) {
                appData.payments = (appData.payments || []).filter(function(p) { return String(p.id) !== String(payment.id); });
                delete ctx.move.paymentId;
            } else if (payment && newPaid > 0.0001) {
                payment.date = newDate;
                payment.amount = +newPaid.toFixed(2);
                payment.party = ctx.lot.vendorName || payment.party;
                payment.invoiceId = ctx.lot.id;
                payment.invoice = `COLD-${ctx.lot.id}`;
                payment.paidThrough = 'Cold Storage Release';
                payment.reference = newReference;
                payment.remarks = `Release payment | ${ctx.lot.coldStorageName || '-'}`;
                ctx.move.paymentId = payment.id;
            } else if (!payment && newPaid > 0.0001) {
                appData.payments = appData.payments || [];
                const newPayment = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    type: 'cold_storage_payment',
                    invoiceId: ctx.lot.id,
                    invoice: `COLD-${ctx.lot.id}`,
                    party: ctx.lot.vendorName || '-',
                    amount: +newPaid.toFixed(2),
                    mode: 'cash',
                    paidThrough: 'Cold Storage Release',
                    reference: newReference,
                    remarks: `Release payment | ${ctx.lot.coldStorageName || '-'}`,
                    date: newDate
                };
                appData.payments.push(newPayment);
                ctx.move.paymentId = newPayment.id;
            }

            ctx.move.date = newDate;
            ctx.move.qty = +newQty.toFixed(2);
            ctx.move.bags = +newBags.toFixed(2);
            ctx.move.amount = +newPaid.toFixed(2);
            ctx.move.reference = newReference;
            ctx.move.remarks = nextRemarks;
            ctx.move.vendorName = ctx.lot.vendorName || ctx.move.vendorName;
            ctx.move.itemName = ctx.lot.itemName || ctx.move.itemName;
            ctx.move.coldStorageName = ctx.lot.coldStorageName || ctx.move.coldStorageName;
            ctx.move.shrinkageQty = +nextShrinkageQty.toFixed(2);
            ctx.move.expectedQty = +expectedQty.toFixed(2);
            ctx.move.isFinalBagRelease = isFinalBagRelease;

            activeInlineMovementReleaseEditId = null;
            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            alert('Release movement updated successfully.');
        }

        function deleteColdStorageMovement(movementId, rawType) {
            const type = String(rawType || '');
            if (!movementId) return;
            if (!confirm('Delete this movement entry? This will reverse related balances.')) return;

            if (type === 'cold_payment') {
                const payment = (appData.payments || []).find(function(p) { return String(p.id) === String(movementId); });
                if (!payment) return;
                const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(payment.invoiceId || ''); });
                if (lot) {
                    const amt = Math.max(0, parseFloat(payment.amount) || 0);
                    lot.paidTotal = +Math.max(0, (parseFloat(lot.paidTotal) || 0) - amt).toFixed(2);
                    if (String(payment.paidThrough || '') === 'Cold Storage Move') {
                        lot.paidAtMove = +Math.max(0, (parseFloat(lot.paidAtMove) || 0) - amt).toFixed(2);
                    } else {
                        lot.paidAtRelease = +Math.max(0, (parseFloat(lot.paidAtRelease) || 0) - amt).toFixed(2);
                    }
                    recalculateColdLotPayables(lot);
                }
                appData.payments = (appData.payments || []).filter(function(p) { return String(p.id) !== String(movementId); });
                saveData();
                refreshColdStoragePanel();
                alert('Payment entry deleted.');
                return;
            }

            const movement = (appData.coldStorageMovements || []).find(function(m) { return String(m.id) === String(movementId); });
            if (!movement) {
                alert('Movement not found.');
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(movement.lotId || ''); });

            if (type === 'move_in') {
                if (!lot || !canEditOrRemoveColdLot(lot)) {
                    alert('Move-in entry cannot be deleted once related activity exists.');
                    return;
                }
                removeColdLot(lot.id);
                return;
            }

            if (!lot) {
                alert('Related lot not found.');
                return;
            }

            if (type === 'release_out') {
                const qty = Math.max(0, parseFloat(movement.qty) || 0);
                const bags = Math.max(0, parseFloat(movement.bags) || 0);
                const paid = Math.max(0, parseFloat(movement.amount) || 0);
                const linkedShrink = (appData.coldStorageMovements || []).find(function(m) {
                    return String(m.type || '') === 'shrinkage' && String(m.linkedReleaseMovementId || '') === String(movement.id || '');
                }) || (appData.coldStorageMovements || []).find(function(m) {
                    return String(m.id || '') === String(movement.linkedShrinkageMovementId || '');
                }) || null;
                const shrinkQty = Math.max(0, parseFloat(linkedShrink && linkedShrink.qty) || parseFloat(movement.shrinkageQty) || 0);
                const inv = appData.inventory[lot.itemId];
                const invQty = Math.max(0, parseFloat(inv && inv.quantity) || 0);
                if (invQty + 0.0001 < qty) {
                    alert('Cannot delete this release because normal inventory has already been consumed.');
                    return;
                }
                lot.qtyInCold = +(Math.max(0, parseFloat(lot.qtyInCold) || 0) + qty + shrinkQty).toFixed(2);
                lot.bagsInCold = +(Math.max(0, parseFloat(lot.bagsInCold) || 0) + bags).toFixed(2);
                lot.releaseQtyTotal = +Math.max(0, (parseFloat(lot.releaseQtyTotal) || 0) - qty).toFixed(2);
                lot.releaseBagsTotal = +Math.max(0, (parseFloat(lot.releaseBagsTotal) || 0) - bags).toFixed(2);
                lot.shrinkageQtyTotal = +Math.max(0, (parseFloat(lot.shrinkageQtyTotal) || 0) - shrinkQty).toFixed(2);
                lot.paidAtRelease = +Math.max(0, (parseFloat(lot.paidAtRelease) || 0) - paid).toFixed(2);
                lot.paidTotal = +Math.max(0, (parseFloat(lot.paidTotal) || 0) - paid).toFixed(2);
                recalculateColdLotPayables(lot);
                lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : 'active';

                if (!appData.inventory[lot.itemId]) appData.inventory[lot.itemId] = { quantity: 0, totalCost: 0 };
                const sourceCost = Math.max(0, parseFloat(lot.sourceInventoryCost) || 0);
                const originalQty = Math.max(0.0001, (parseFloat(lot.releaseQtyTotal) || 0) + (parseFloat(lot.qtyInCold) || 0) + (parseFloat(lot.shrinkageQtyTotal) || 0));
                const avgCost = sourceCost / originalQty;
                appData.inventory[lot.itemId].quantity = Math.max(0, (parseFloat(appData.inventory[lot.itemId].quantity) || 0) - qty);
                appData.inventory[lot.itemId].totalCost = Math.max(0, (parseFloat(appData.inventory[lot.itemId].totalCost) || 0) - (avgCost * qty));
                if ((parseFloat(appData.inventory[lot.itemId].quantity) || 0) <= 0.0001) delete appData.inventory[lot.itemId];

                const payment = findReleasePaymentByMovement(movement, lot);
                if (payment) {
                    appData.payments = (appData.payments || []).filter(function(p) { return String(p.id) !== String(payment.id); });
                }
                if (linkedShrink) {
                    appData.coldStorageMovements = (appData.coldStorageMovements || []).filter(function(m) { return String(m.id) !== String(linkedShrink.id); });
                }
            } else if (type === 'charge_add') {
                const amount = Math.max(0, parseFloat(movement.amount) || 0);
                lot.periodicChargeTotal = +Math.max(0, (parseFloat(lot.periodicChargeTotal) || 0) - amount).toFixed(2);
                lot.estimatedTotalCharge = +Math.max(0, (parseFloat(lot.estimatedTotalCharge) || 0) - amount).toFixed(2);
                recalculateColdLotPayables(lot);
                appData.coldStorageCharges = (appData.coldStorageCharges || []).filter(function(c) {
                    return !(String(c.lotId) === String(lot.id) && String(c.date || '') === String(movement.date || '') && Math.abs((parseFloat(c.amount) || 0) - amount) <= 0.01);
                });
            } else if (type === 'damage') {
                const damage = (appData.coldStorageDamages || []).find(function(d) {
                    return String(d.lotId) === String(lot.id) && String(d.date || '') === String(movement.date || '') && Math.abs((parseFloat(d.damageQty) || 0) - (parseFloat(movement.qty) || 0)) <= 0.01;
                });
                const damageQty = Math.max(0, parseFloat(movement.qty) || 0);
                const damageBags = Math.max(0, parseFloat((damage && damage.damageBags) || movement.bags) || 0);
                lot.qtyInCold = +(Math.max(0, parseFloat(lot.qtyInCold) || 0) + damageQty).toFixed(2);
                lot.bagsInCold = +(Math.max(0, parseFloat(lot.bagsInCold) || 0) + damageBags).toFixed(2);
                lot.damageQtyTotal = +Math.max(0, (parseFloat(lot.damageQtyTotal) || 0) - damageQty).toFixed(2);
                lot.damageBagsTotal = +Math.max(0, (parseFloat(lot.damageBagsTotal) || 0) - damageBags).toFixed(2);
                lot.damageLossTotal = +Math.max(0, (parseFloat(lot.damageLossTotal) || 0) - (parseFloat(damage && damage.totalLoss) || 0)).toFixed(2);
                lot.damageUsShareTotal = +Math.max(0, (parseFloat(lot.damageUsShareTotal) || 0) - (parseFloat(damage && damage.usShareAmount) || 0)).toFixed(2);
                lot.damageVendorShareTotal = +Math.max(0, (parseFloat(lot.damageVendorShareTotal) || 0) - (parseFloat(damage && damage.vendorShareAmount) || 0)).toFixed(2);
                lot.sourceInventoryCost = +Math.max(0, (parseFloat(lot.sourceInventoryCost) || 0) + (parseFloat(damage && damage.sourceLoss) || 0)).toFixed(2);
                lot.payableAdjustmentTotal = +Math.max(0, (parseFloat(lot.payableAdjustmentTotal) || 0) - (parseFloat(damage && damage.payableReduction) || 0)).toFixed(2);
                recalculateColdLotPayables(lot);
                lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : 'active';
                appData.coldStorageDamages = (appData.coldStorageDamages || []).filter(function(d) { return d !== damage; });
            } else if (type === 'shrinkage') {
                const shrinkQty = Math.max(0, parseFloat(movement.qty) || 0);
                lot.qtyInCold = +(Math.max(0, parseFloat(lot.qtyInCold) || 0) + shrinkQty).toFixed(2);
                lot.shrinkageQtyTotal = +Math.max(0, (parseFloat(lot.shrinkageQtyTotal) || 0) - shrinkQty).toFixed(2);
                lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : 'active';
                const linkedRelease = (appData.coldStorageMovements || []).find(function(m) {
                    return String(m.id) === String(movement.linkedReleaseMovementId || '');
                });
                if (linkedRelease) {
                    linkedRelease.shrinkageQty = 0;
                    delete linkedRelease.linkedShrinkageMovementId;
                }
            } else if (type === 'company_expense') {
                const companyExpense = Math.max(0, parseFloat(movement.amount) || 0);
                lot.companyExpenseAtMove = +Math.max(0, (parseFloat(lot.companyExpenseAtMove) || 0) - companyExpense).toFixed(2);
            } else {
                alert('Delete is not supported for this movement type.');
                return;
            }

            appData.coldStorageMovements = (appData.coldStorageMovements || []).filter(function(m) { return String(m.id) !== String(movementId); });
            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            alert('Movement deleted successfully.');
        }

        function recordColdStorageDamage() {
            const date = (document.getElementById('coldDamageDate') && document.getElementById('coldDamageDate').value) || '';
            const lotId = (document.getElementById('coldDamageLotId') && document.getElementById('coldDamageLotId').value) || '';
            let damageQty = Math.max(0, parseFloat(document.getElementById('coldDamageQty') && document.getElementById('coldDamageQty').value) || 0);
            let damageBags = Math.max(0, parseFloat(document.getElementById('coldDamageBags') && document.getElementById('coldDamageBags').value) || 0);
            const bearer = (document.getElementById('coldDamageBearer') && document.getElementById('coldDamageBearer').value) || 'us';
            const splitPercent = Math.max(0, Math.min(100, parseFloat(document.getElementById('coldDamageSplitPercent') && document.getElementById('coldDamageSplitPercent').value) || 50));
            const lotReference = String((document.getElementById('coldDamageReference') && document.getElementById('coldDamageReference').value) || '').trim();
            const remarks = (document.getElementById('coldDamageRemarks') && document.getElementById('coldDamageRemarks').value || '').trim();
            if (!date || !lotId || damageQty <= 0) {
                alert('Please select date, lot and valid damage quantity.');
                return;
            }
            if (!lotReference) {
                alert('Please enter LOT/CRATE reference.');
                return;
            }
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Selected lot not found.');
                return;
            }
            const qtyInLot = Math.max(0, parseFloat(lot.qtyInCold) || 0);
            const bagsInLot = Math.max(0, parseFloat(lot.bagsInCold) || 0);
            const qtyPerBag = bagsInLot > 0 ? (qtyInLot / bagsInLot) : 0;
            if (coldDamageLastEditedField === 'bags' && qtyPerBag > 0) {
                damageQty = +(damageBags * qtyPerBag).toFixed(2);
            } else if (coldDamageLastEditedField !== 'bags' && qtyPerBag > 0) {
                damageBags = +(damageQty / qtyPerBag).toFixed(2);
            }
            if (damageQty > qtyInLot) {
                alert('Damage quantity cannot exceed available lot quantity.');
                return;
            }
            if (damageBags > bagsInLot + 0.0001) {
                alert('Damage bags cannot exceed available lot bags.');
                return;
            }
            if (!['us', 'cold', 'split', 'supplier', 'no_one'].includes(bearer)) {
                alert('Please select a valid bearer.');
                return;
            }

            const estimates = calculateColdDamageLossEstimate(lot, damageQty);
            let vendorShareRatio = 0;
            if (bearer === 'cold') vendorShareRatio = 1;
            else if (bearer === 'supplier') vendorShareRatio = 1;
            else if (bearer === 'split') vendorShareRatio = splitPercent / 100;
            const vendorShareAmount = +(estimates.totalLoss * vendorShareRatio).toFixed(2);
            const usShareAmount = +(bearer === 'no_one' ? 0 : (estimates.totalLoss - vendorShareAmount)).toFixed(2);
            const payableReduction = 0;
            const damagedBags = +Math.max(0, damageBags).toFixed(2);

            lot.qtyInCold = +(qtyInLot - damageQty).toFixed(2);
            if (lot.qtyInCold <= 0.0001) lot.qtyInCold = 0;
            lot.bagsInCold = +Math.max(0, bagsInLot - damagedBags).toFixed(2);
            lot.damageQtyTotal = (parseFloat(lot.damageQtyTotal) || 0) + damageQty;
            lot.damageBagsTotal = (parseFloat(lot.damageBagsTotal) || 0) + damagedBags;
            lot.damageLossTotal = (parseFloat(lot.damageLossTotal) || 0) + estimates.totalLoss;
            lot.damageUsShareTotal = (parseFloat(lot.damageUsShareTotal) || 0) + usShareAmount;
            lot.damageVendorShareTotal = (parseFloat(lot.damageVendorShareTotal) || 0) + vendorShareAmount;
            lot.sourceInventoryCost = +Math.max(0, (parseFloat(lot.sourceInventoryCost) || 0) - estimates.sourceLoss).toFixed(2);
            recalculateColdLotPayables(lot);
            lot.status = (lot.qtyInCold <= 0.0001) ? 'released' : 'active';

            appData.coldStorageDamages = appData.coldStorageDamages || [];
            appData.coldStorageDamages.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                damageQty: +damageQty.toFixed(2),
                damageBags: damagedBags,
                bearer: bearer,
                splitPercent: bearer === 'split' ? splitPercent : null,
                supplierName: lot.supplierName || '-',
                sourceLoss: +estimates.sourceLoss.toFixed(2),
                chargeLoss: +estimates.chargeLoss.toFixed(2),
                totalLoss: +estimates.totalLoss.toFixed(2),
                usShareAmount: usShareAmount,
                vendorShareAmount: vendorShareAmount,
                payableReduction: 0,
                reference: lotReference,
                remarks: remarks
            });

            appData.coldStorageMovements = appData.coldStorageMovements || [];
            appData.coldStorageMovements.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                date: date,
                type: 'damage',
                lotId: lot.id,
                itemId: lot.itemId,
                itemName: lot.itemName,
                coldStorageName: lot.coldStorageName,
                vendorName: lot.vendorName,
                qty: damageQty,
                bags: damagedBags,
                amount: estimates.totalLoss,
                payableReduction: 0,
                reference: lotReference,
                remarks: remarks
            });

            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            alert('Cold storage damage recorded successfully.');
        }

        function calculateColdLotEditEstimatedTotals() {
            const qty = Math.max(0, parseFloat(document.getElementById('coldLotEditQty') && document.getElementById('coldLotEditQty').value) || 0);
            const bags = Math.max(0, parseFloat(document.getElementById('coldLotEditBags') && document.getElementById('coldLotEditBags').value) || 0);
            const rentPerKg = Math.max(0, parseFloat(document.getElementById('coldLotEditRentPerKg') && document.getElementById('coldLotEditRentPerKg').value) || 0);
            const inOutPerBag = Math.max(0, parseFloat(document.getElementById('coldLotEditInOutPerBag') && document.getElementById('coldLotEditInOutPerBag').value) || 0);
            const otherCharge = Math.max(0, parseFloat(document.getElementById('coldLotEditOtherCharge') && document.getElementById('coldLotEditOtherCharge').value) || 0);
            const total = (qty * rentPerKg) + (bags * inOutPerBag) + otherCharge;
            const displayEl = document.getElementById('coldLotEditEstimatedCharge');
            if (displayEl) displayEl.textContent = `${RU}${total.toFixed(2)}`;
            return total;
        }

        function editColdLot(lotId) {
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Cold lot not found.');
                return;
            }
            if (!canEditOrRemoveColdLot(lot)) {
                alert('This lot cannot be edited now because it already has release, damage, charges, or payment activity.');
                return;
            }
            editingColdLotId = lot.id;
            const panel = document.getElementById('coldLotEditPanel');
            if (panel) panel.classList.add('hidden');
            if (document.getElementById('coldMoveDate')) document.getElementById('coldMoveDate').value = lot.date || '';
            if (document.getElementById('coldMoveItem')) document.getElementById('coldMoveItem').value = String(lot.itemId || '');
            if (document.getElementById('coldMoveQty')) document.getElementById('coldMoveQty').value = Number(lot.qtyInCold || 0).toFixed(2);
            if (document.getElementById('coldMoveBags')) document.getElementById('coldMoveBags').value = Number(lot.bagsInCold || 0).toFixed(2);
            if (document.getElementById('coldMoveStorageName')) {
                populateColdStorageSelect('coldMoveStorageName', 'Select cold storage', lot.coldStorageId || '', lot.coldStorageName || '');
            }
            if (document.getElementById('coldMoveVendorName')) document.getElementById('coldMoveVendorName').value = lot.vendorName || '';
            if (document.getElementById('coldMoveRentPerKg')) document.getElementById('coldMoveRentPerKg').value = Number(lot.rentPerKg || 0).toFixed(2);
            if (document.getElementById('coldMoveInOutPerBag')) document.getElementById('coldMoveInOutPerBag').value = Number(lot.inOutPerBag || 0).toFixed(2);
            if (document.getElementById('coldMoveOtherCharge')) document.getElementById('coldMoveOtherCharge').value = Number(lot.otherCharge || 0).toFixed(2);
            if (document.getElementById('coldMoveCompanyExpense')) document.getElementById('coldMoveCompanyExpense').value = Number(lot.companyExpenseAtMove || 0).toFixed(2);
            if (document.getElementById('coldMoveCompanyExpenseReason')) document.getElementById('coldMoveCompanyExpenseReason').value = lot.companyExpenseReason || '';
            if (document.getElementById('coldMovePaidAtMove')) document.getElementById('coldMovePaidAtMove').value = Number(lot.paidAtMove || 0).toFixed(2);
            if (document.getElementById('coldMoveReference')) document.getElementById('coldMoveReference').value = lot.lotReference || '';
            if (document.getElementById('coldMoveRemarks')) document.getElementById('coldMoveRemarks').value = lot.remarks || '';
            setColdMoveEditMode(true);
            calculateColdMoveEstimatedTotals();
            onColdMoveItemChange();
            const movePanel = document.getElementById('coldMoveItem');
            if (movePanel && typeof movePanel.scrollIntoView === 'function') {
                movePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function cancelColdLotEdit() {
            editingColdLotId = null;
            const panel = document.getElementById('coldLotEditPanel');
            if (panel) panel.classList.add('hidden');
            setColdMoveEditMode(false);
            resetColdMoveForm();
        }

        function saveColdLotEdit() {
            moveToColdStorage();
        }

        function removeColdLot(lotId) {
            const lot = (appData.coldStorageLots || []).find(function(x) { return String(x.id) === String(lotId); });
            if (!lot) {
                alert('Cold lot not found.');
                return;
            }
            if (!canEditOrRemoveColdLot(lot)) {
                alert('This lot cannot be removed now because it already has release, damage, charges, or payment activity.');
                return;
            }
            if (!confirm('Remove this cold lot? Inventory and movement history will be adjusted.')) return;
            appData.coldStorageLots = (appData.coldStorageLots || []).filter(function(x) { return String(x.id) !== String(lotId); });
            appData.coldStorageMovements = (appData.coldStorageMovements || []).filter(function(x) { return String(x.lotId) !== String(lotId); });
            appData.coldStorageCharges = (appData.coldStorageCharges || []).filter(function(x) { return String(x.lotId) !== String(lotId); });
            appData.coldStorageDamages = (appData.coldStorageDamages || []).filter(function(x) { return String(x.lotId) !== String(lotId); });
            appData.payments = (appData.payments || []).filter(function(x) {
                if (String(x.type || '').toLowerCase() !== 'cold_storage_payment') return true;
                return String(x.invoiceId || '') !== String(lotId);
            });
            if (editingColdLotId != null && String(editingColdLotId) === String(lotId)) {
                cancelColdLotEdit();
            }
            rebuildInventoryFromTransactions();
            saveData();
            refreshInventory();
            updateDashboard();
            refreshColdStoragePanel();
            alert('Cold lot removed successfully.');
        }

        function filterColdStorageLots() {
            const search = ((document.getElementById('coldLotsSearch') && document.getElementById('coldLotsSearch').value) || '').trim().toLowerCase();
            const activeLots = (appData.coldStorageLots || []).filter(function(lot) {
                return (parseFloat(lot.qtyInCold) || 0) > 0 && (lot.status || 'active') !== 'released';
            });
            if (!search) {
                filteredColdLots = null;
                paginationState.coldLots.currentPage = 1;
                renderColdStorageLotsTable();
                return;
            }
            filteredColdLots = activeLots.filter(function(lot) {
                const originalQty = Math.max(0, (parseFloat(lot.qtyInCold) || 0) + (parseFloat(lot.releaseQtyTotal) || 0) + (parseFloat(lot.damageQtyTotal) || 0) + (parseFloat(lot.shrinkageQtyTotal) || 0));
                const originalBags = Math.max(0, (parseFloat(lot.bagsInCold) || 0) + (parseFloat(lot.releaseBagsTotal) || 0) + (parseFloat(lot.damageBagsTotal) || 0));
                const haystack = [
                    lot.id,
                    lot.itemName,
                    lot.coldStorageName,
                    lot.vendorName,
                    lot.supplierName,
                    lot.lotReference,
                    lot.remarks,
                    originalQty.toFixed(2),
                    originalBags.toFixed(2),
                    Number(lot.qtyInCold || 0).toFixed(2),
                    Number(lot.bagsInCold || 0).toFixed(2)
                ].map(function(v) { return String(v || '').toLowerCase(); }).join(' | ');
                return haystack.indexOf(search) !== -1;
            });
            paginationState.coldLots.currentPage = 1;
            renderColdStorageLotsTable();
        }

        function renderColdStorageLotsTable() {
            const tbody = document.getElementById('coldStorageLotsBody');
            if (!tbody) return;
            const activeLots = Array.isArray(filteredColdLots)
                ? filteredColdLots
                : (appData.coldStorageLots || []).filter(function(lot) {
                    return (parseFloat(lot.qtyInCold) || 0) > 0 && (lot.status || 'active') !== 'released';
                });
            if (activeInlineReleaseLotId) {
                const stillVisible = activeLots.some(function(lot) { return String(lot.id) === String(activeInlineReleaseLotId); });
                if (!stillVisible) activeInlineReleaseLotId = null;
            }
            if (activeLots.length === 0) {
                tbody.innerHTML = '<tr><td colspan="16" class="px-4 py-8 text-center text-slate-500">No active cold lots yet</td></tr>';
                const pager = document.getElementById('coldLotsPagination');
                if (pager) pager.innerHTML = '';
                return;
            }
            const lotsSorted = activeLots.slice().sort(function(a, b) {
                const dt = String(b.date || '').localeCompare(String(a.date || ''));
                if (dt !== 0) return dt;
                return String(b.id || '').localeCompare(String(a.id || ''));
            });
            const maxPage = Math.max(1, Math.ceil(lotsSorted.length / paginationState.coldLots.pageSize));
            if (paginationState.coldLots.currentPage > maxPage) paginationState.coldLots.currentPage = maxPage;
            const cp = paginationState.coldLots.currentPage;
            const ps = paginationState.coldLots.pageSize;
            const pageLots = getPaginatedData(lotsSorted, cp, ps);
            tbody.innerHTML = '';
            pageLots.forEach(function(lot) {
                const originalQty = Math.max(0, (parseFloat(lot.qtyInCold) || 0) + (parseFloat(lot.releaseQtyTotal) || 0) + (parseFloat(lot.damageQtyTotal) || 0) + (parseFloat(lot.shrinkageQtyTotal) || 0));
                const originalBags = Math.max(0, (parseFloat(lot.bagsInCold) || 0) + (parseFloat(lot.releaseBagsTotal) || 0) + (parseFloat(lot.damageBagsTotal) || 0));
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-200';
                tr.innerHTML = `
                    <td class="px-3 py-2 text-sm">${lot.date || '-'}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(lot.itemName || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(lot.coldStorageName || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(lot.supplierName || '-')}</td>
                    <td class="px-3 py-2 text-sm text-right">${originalQty.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${originalBags.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${Number(lot.qtyInCold || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${Number(lot.bagsInCold || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${Number(lot.estimatedTotalCharge || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${Number(lot.paidTotal || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right text-amber-700">${RU}${Number(lot.payableAdjustmentTotal || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${Number(lot.remainingPayable || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right text-rose-700">${Number(lot.damageQtyTotal || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(String(lot.lotReference || '').trim() || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(lot.remarks || '-')}</td>
                    <td class="px-3 py-2 text-sm">
                        <div class="flex gap-2">
                            <button type="button" onclick="openInlineColdRelease(${JSON.stringify(lot.id)})" class="text-orange-600 hover:text-orange-800 font-medium">Release</button>
                            <button type="button" onclick="editColdLot(${JSON.stringify(lot.id)})" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                            <button type="button" onclick="removeColdLot(${JSON.stringify(lot.id)})" class="text-red-600 hover:text-red-800 font-medium">Remove</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);

                if (String(activeInlineReleaseLotId || '') === String(lot.id)) {
                    const detailTr = document.createElement('tr');
                    detailTr.className = 'border-b border-orange-200 bg-orange-50/40';
                    const inlineDate = new Date().toISOString().split('T')[0];
                    detailTr.innerHTML = `
                        <td colspan="16" class="px-3 py-3">
                            <div class="rounded-lg border border-orange-200 bg-white p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <p class="font-semibold text-slate-800">Release Lot: ${escapeHtml(lot.itemName || '-')} | ${escapeHtml(lot.coldStorageName || '-')}</p>
                                    <button type="button" onclick="cancelInlineColdRelease()" class="text-slate-500 hover:text-slate-700 text-sm">Close</button>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Date</label>
                                        <input type="date" id="inlineColdReleaseDate_${lot.id}" value="${inlineDate}" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Release Qty</label>
                                        <input type="number" id="inlineColdReleaseQty_${lot.id}" min="0" step="any" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Release Bags</label>
                                        <input type="number" id="inlineColdReleaseBags_${lot.id}" min="0" step="any" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Paid at Release</label>
                                        <input type="number" id="inlineColdReleasePaid_${lot.id}" min="0" step="any" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">LOT/CRATE Ref</label>
                                        <input type="text" id="inlineColdReleaseReference_${lot.id}" value="${escapeHtml(String(lot.lotReference || ''))}" placeholder="Lot/Crate number" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                                        <input type="text" id="inlineColdReleaseRemarks_${lot.id}" placeholder="Release notes" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                </div>
                                <p id="inlineColdReleaseHint_${lot.id}" class="text-xs text-slate-500 mt-2">Available in lot: ${Number(lot.qtyInCold || 0).toFixed(2)} ${escapeHtml(lot.unit || 'kg')} | Available bags: ${Number(lot.bagsInCold || 0).toFixed(2)} | Remaining Payable: ${RU}${Number(lot.remainingPayable || 0).toFixed(2)}</p>
                                <div class="mt-3 flex gap-2">
                                    <button type="button" onclick="submitInlineColdRelease(${JSON.stringify(lot.id)})" class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">Release Lot</button>
                                    <button type="button" onclick="cancelInlineColdRelease()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
                                </div>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(detailTr);
                }
            });
            renderPagination('coldLotsPagination', lotsSorted.length, cp, ps, 'changeColdLotsPage', 'changeColdLotsPageSize');
        }

        function getColdVendorPayablesGroupedRows() {
            const grouped = {};
            const getPurchaseItemFromLot = function(lot) {
                if (!lot) return null;
                const purchase = (appData.purchases || []).find(function(p) { return String(p.id || '') === String(lot.purchaseId || ''); });
                if (!purchase || !Array.isArray(purchase.items)) return null;
                const byItemId = String(lot.purchaseItemId || '');
                if (byItemId) {
                    return purchase.items.find(function(pi) { return String(pi.id || '') === byItemId; }) || null;
                }
                return purchase.items.find(function(pi) { return String(pi.itemId || '') === String(lot.itemId || ''); }) || null;
            };
            (appData.coldStorageLots || []).forEach(function(lot) {
                const vendor = String(lot.vendorName || '').trim() || 'Unknown Vendor';
                const storage = String(lot.coldStorageName || '').trim() || 'Unknown Storage';
                const key = vendor + '|' + storage;
                if (!grouped[key]) {
                    grouped[key] = {
                        key: key,
                        vendorName: vendor,
                        coldStorageName: storage,
                        purchaseInvoices: new Set(),
                        kaantaParchiNos: new Set(),
                        quantity: 0,
                        bags: 0,
                        totalCharge: 0,
                        totalPaid: 0,
                        adjustment: 0,
                        remaining: 0
                    };
                }
                const item = getPurchaseItemFromLot(lot);
                const invoiceNo = String(lot.purchaseInvoice || '').trim();
                if (invoiceNo) grouped[key].purchaseInvoices.add(invoiceNo);
                const kaantaNo = String((item && item.kaantaParchi) || '').trim();
                if (kaantaNo) grouped[key].kaantaParchiNos.add(kaantaNo);
                grouped[key].quantity += Math.max(0, parseFloat(lot.qtyInCold) || 0);
                grouped[key].bags += Math.max(0, parseFloat(lot.bagsInCold) || 0);
                grouped[key].totalCharge += parseFloat(lot.estimatedTotalCharge) || 0;
                grouped[key].totalPaid += parseFloat(lot.paidTotal) || 0;
                grouped[key].adjustment += parseFloat(lot.payableAdjustmentTotal) || 0;
                grouped[key].remaining += parseFloat(lot.remainingPayable) || 0;
            });
            return Object.values(grouped).sort(function(a, b) {
                const vendorCmp = String(a.vendorName || '').localeCompare(String(b.vendorName || ''));
                if (vendorCmp !== 0) return vendorCmp;
                return String(a.coldStorageName || '').localeCompare(String(b.coldStorageName || ''));
            });
        }

        function getFilteredColdVendorPayablesRows(sourceRows) {
            const rows = Array.isArray(sourceRows) ? sourceRows : getColdVendorPayablesGroupedRows();
            const search = ((document.getElementById('coldVendorPayablesSearch') && document.getElementById('coldVendorPayablesSearch').value) || '').trim().toLowerCase();
            const vendorFilter = (document.getElementById('coldVendorPayablesVendorFilter') && document.getElementById('coldVendorPayablesVendorFilter').value) || '';
            const storageFilter = (document.getElementById('coldVendorPayablesStorageFilter') && document.getElementById('coldVendorPayablesStorageFilter').value) || '';
            return rows.filter(function(row) {
                if (vendorFilter && row.vendorName !== vendorFilter) return false;
                if (storageFilter && row.coldStorageName !== storageFilter) return false;
                if (!search) return true;
                const invoiceText = Array.from(row.purchaseInvoices || []).join(', ');
                const kaantaText = Array.from(row.kaantaParchiNos || []).join(', ');
                const haystack = [row.vendorName, row.coldStorageName, invoiceText, kaantaText]
                    .map(function(v) { return String(v || '').toLowerCase(); })
                    .join(' | ');
                return haystack.indexOf(search) >= 0;
            });
        }

        function updateColdVendorPayablesKpis(rows) {
            const list = Array.isArray(rows) ? rows : [];
            const totals = list.reduce(function(acc, row) {
                acc.charge += parseFloat(row.totalCharge) || 0;
                acc.paid += parseFloat(row.totalPaid) || 0;
                acc.remaining += parseFloat(row.remaining) || 0;
                return acc;
            }, { charge: 0, paid: 0, remaining: 0 });
            const chargeEl = document.getElementById('coldVendorPayablesTotalCharge');
            const paidEl = document.getElementById('coldVendorPayablesTotalPaid');
            const remainingEl = document.getElementById('coldVendorPayablesTotalRemaining');
            if (chargeEl) chargeEl.textContent = RU + totals.charge.toFixed(2);
            if (paidEl) paidEl.textContent = RU + totals.paid.toFixed(2);
            if (remainingEl) remainingEl.textContent = RU + totals.remaining.toFixed(2);
        }

        function populateColdVendorPayablesFilterOptions() {
            const vendorEl = document.getElementById('coldVendorPayablesVendorFilter');
            const storageEl = document.getElementById('coldVendorPayablesStorageFilter');
            if (!vendorEl || !storageEl) return;
            const rows = getColdVendorPayablesGroupedRows();
            const selectedVendor = vendorEl.value || '';
            const selectedStorage = storageEl.value || '';
            const vendors = Array.from(new Set(rows.map(function(r) { return r.vendorName; }))).sort();
            const storages = Array.from(new Set(rows.map(function(r) { return r.coldStorageName; }))).sort();
            vendorEl.innerHTML = '<option value="">All Vendors</option>';
            vendors.forEach(function(vendor) {
                vendorEl.innerHTML += `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`;
            });
            storageEl.innerHTML = '<option value="">All Storages</option>';
            storages.forEach(function(storage) {
                storageEl.innerHTML += `<option value="${escapeHtml(storage)}">${escapeHtml(storage)}</option>`;
            });
            if (selectedVendor && vendorEl.querySelector(`option[value="${selectedVendor}"]`)) vendorEl.value = selectedVendor;
            if (selectedStorage && storageEl.querySelector(`option[value="${selectedStorage}"]`)) storageEl.value = selectedStorage;
        }

        function filterColdVendorPayables() {
            paginationState.coldVendorPayables.currentPage = 1;
            renderColdVendorPayablesSummary();
        }

        function clearColdVendorPayablesFilters() {
            const searchEl = document.getElementById('coldVendorPayablesSearch');
            const vendorEl = document.getElementById('coldVendorPayablesVendorFilter');
            const storageEl = document.getElementById('coldVendorPayablesStorageFilter');
            if (searchEl) searchEl.value = '';
            if (vendorEl) vendorEl.value = '';
            if (storageEl) storageEl.value = '';
            paginationState.coldVendorPayables.currentPage = 1;
            renderColdVendorPayablesSummary();
        }

        function renderColdVendorPayablesSummary() {
            const tbody = document.getElementById('coldVendorPayablesBody');
            if (!tbody) return;
            const groupedRows = getColdVendorPayablesGroupedRows();
            const filterKey = [
                ((document.getElementById('coldVendorPayablesSearch') && document.getElementById('coldVendorPayablesSearch').value) || '').trim().toLowerCase(),
                (document.getElementById('coldVendorPayablesVendorFilter') && document.getElementById('coldVendorPayablesVendorFilter').value) || '',
                (document.getElementById('coldVendorPayablesStorageFilter') && document.getElementById('coldVendorPayablesStorageFilter').value) || ''
            ].join('|');
            if (filterKey !== lastColdVendorPayablesFilterKey) {
                paginationState.coldVendorPayables.currentPage = 1;
                lastColdVendorPayablesFilterKey = filterKey;
            }
            const filteredRows = getFilteredColdVendorPayablesRows(groupedRows);
            updateColdVendorPayablesKpis(filteredRows);

            if (!filteredRows.length) {
                tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-slate-500">No cold storage payables found</td></tr>';
                const pager = document.getElementById('coldVendorPayablesPagination');
                if (pager) pager.innerHTML = '';
                return;
            }

            const pageSize = paginationState.coldVendorPayables.pageSize;
            const maxPage = Math.max(1, Math.ceil(filteredRows.length / pageSize));
            if (paginationState.coldVendorPayables.currentPage > maxPage) paginationState.coldVendorPayables.currentPage = maxPage;
            const rows = getPaginatedData(filteredRows, paginationState.coldVendorPayables.currentPage, pageSize);
            tbody.innerHTML = rows.map(function(row) {
                const invoiceText = Array.from(row.purchaseInvoices).join(', ') || '-';
                const kaantaText = Array.from(row.kaantaParchiNos).join(', ') || '-';
                return `<tr class="border-b border-slate-200">
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.vendorName)}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.coldStorageName)}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(invoiceText)}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(kaantaText)}</td>
                    <td class="px-3 py-2 text-sm text-right">${row.quantity.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${row.bags.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${row.totalCharge.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${row.totalPaid.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right text-amber-700">${RU}${row.adjustment.toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right">${RU}${row.remaining.toFixed(2)}</td>
                </tr>`;
            }).join('');
            renderPagination(
                'coldVendorPayablesPagination',
                filteredRows.length,
                paginationState.coldVendorPayables.currentPage,
                paginationState.coldVendorPayables.pageSize,
                'changeColdVendorPayablesPage',
                'changeColdVendorPayablesPageSize'
            );
        }

        function renderColdStorageDamageSummary() {
            const tbody = document.getElementById('coldDamageSummaryBody');
            if (!tbody) return;
            const rows = [...(appData.coldStorageDamages || [])]
                .sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); })
                .slice(0, 20);
            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">No damage records yet</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(row) {
                let bearerLabel = 'Us';
                if (row.bearer === 'cold') bearerLabel = 'Cold Storage';
                else if (row.bearer === 'split') bearerLabel = 'Split';
                else if (row.bearer === 'supplier') bearerLabel = `Supplier (${row.supplierName || '-'})`;
                else if (row.bearer === 'no_one') bearerLabel = 'No One';
                return `<tr class="border-b border-slate-200">
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.date || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.itemName || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.coldStorageName || '-')}</td>
                    <td class="px-3 py-2 text-sm text-right">${Number(row.damageQty || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(bearerLabel)}</td>
                    <td class="px-3 py-2 text-sm text-right text-rose-700">${RU}${Number(row.usShareAmount || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right text-emerald-700">${RU}${Number(row.vendorShareAmount || 0).toFixed(2)}</td>
                    <td class="px-3 py-2 text-sm text-right text-amber-700">${RU}${Number(row.payableReduction || 0).toFixed(2)}</td>
                </tr>`;
            }).join('');
        }

        function getFilteredColdStorageMovementRows(limitCount) {
            const movementRows = (appData.coldStorageMovements || []).map(function(m) {
                const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id || '') === String(m.lotId || ''); });
                const typeMap = {
                    move_in: 'Move In',
                    company_expense: 'Company Expense',
                    charge_add: 'Periodic Charge',
                    release_out: 'Release',
                    shrinkage: 'Shrinkage',
                    damage: 'Damage'
                };
                return {
                    movementId: m.id || '',
                    date: m.date || '',
                    lotId: m.lotId || '',
                    rawType: m.type || '',
                    type: typeMap[m.type] || (m.type || 'Movement'),
                    itemName: m.itemName || getItemNameById(m.itemId),
                    coldStorageName: m.coldStorageName || '-',
                    vendorName: m.vendorName || '-',
                    supplierName: m.supplierName || (lot ? (lot.supplierName || '-') : '-'),
                    originalBags: lot ? Math.max(0, (parseFloat(lot.bagsInCold) || 0) + (parseFloat(lot.releaseBagsTotal) || 0) + (parseFloat(lot.damageBagsTotal) || 0)) : 0,
                    qty: parseFloat(m.qty) || 0,
                    bags: parseFloat(m.bags) || 0,
                    amount: parseFloat(m.amount) || 0,
                    reference: String(m.reference || '').trim() || ((m.lotId ? `Lot ${m.lotId}` : '-')),
                    remarks: m.remarks || '-',
                    canEdit: String(m.type || '') === 'release_out',
                    canDelete: true
                };
            });

            const paymentRows = (appData.payments || [])
                .filter(function(p) { return String(p.type || '').toLowerCase() === 'cold_storage_payment'; })
                .map(function(p) {
                    const lotId = p.invoiceId || '';
                    const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(lotId); });
                    return {
                        movementId: p.id || '',
                        paymentId: p.id || '',
                        date: p.date || '',
                        lotId: lotId,
                        rawType: 'cold_payment',
                        type: 'Payment',
                        itemName: lot ? (lot.itemName || '-') : '-',
                        coldStorageName: lot ? (lot.coldStorageName || '-') : '-',
                        vendorName: p.party || (lot ? (lot.vendorName || '-') : '-'),
                        supplierName: lot ? (lot.supplierName || '-') : '-',
                        originalBags: lot ? Math.max(0, (parseFloat(lot.bagsInCold) || 0) + (parseFloat(lot.releaseBagsTotal) || 0) + (parseFloat(lot.damageBagsTotal) || 0)) : 0,
                        qty: 0,
                        bags: 0,
                        amount: parseFloat(p.amount) || 0,
                        reference: String(p.reference || '').trim() || (lotId ? `COLD-${lotId}` : (p.invoice || '-')),
                        remarks: p.remarks || (p.paidThrough ? `Via ${p.paidThrough}` : '-'),
                        canEdit: false,
                        canDelete: true
                    };
                });

            const fromDate = (document.getElementById('coldMovementFilterFrom') && document.getElementById('coldMovementFilterFrom').value) || '';
            const toDate = (document.getElementById('coldMovementFilterTo') && document.getElementById('coldMovementFilterTo').value) || '';
            const typeFilter = (document.getElementById('coldMovementFilterType') && document.getElementById('coldMovementFilterType').value) || '';
            const lotFilter = (document.getElementById('coldMovementFilterLotId') && document.getElementById('coldMovementFilterLotId').value) || '';
            const vendorFilter = ((document.getElementById('coldMovementFilterVendor') && document.getElementById('coldMovementFilterVendor').value) || '').trim().toLowerCase();

            const rows = movementRows.concat(paymentRows).filter(function(row) {
                const rowDate = String(row.date || '');
                if (fromDate && rowDate && rowDate < fromDate) return false;
                if (toDate && rowDate && rowDate > toDate) return false;
                if (typeFilter && String(row.rawType || '') !== String(typeFilter)) return false;
                if (lotFilter && String(row.lotId || '') !== String(lotFilter)) return false;
                if (vendorFilter && String(row.vendorName || '').toLowerCase().indexOf(vendorFilter) === -1) return false;
                return true;
            }).sort(function(a, b) {
                const dateCmp = String(b.date || '').localeCompare(String(a.date || ''));
                if (dateCmp !== 0) return dateCmp;
                return String(b.reference || '').localeCompare(String(a.reference || ''));
            });

            if (typeof limitCount === 'number' && limitCount > 0) {
                return rows.slice(0, limitCount);
            }
            return rows;
        }

        function renderColdStorageMovementsHistory() {
            const tbody = document.getElementById('coldMovementHistoryBody');
            if (!tbody) return;
            const filterKey = [
                (document.getElementById('coldMovementFilterFrom') && document.getElementById('coldMovementFilterFrom').value) || '',
                (document.getElementById('coldMovementFilterTo') && document.getElementById('coldMovementFilterTo').value) || '',
                (document.getElementById('coldMovementFilterType') && document.getElementById('coldMovementFilterType').value) || '',
                (document.getElementById('coldMovementFilterLotId') && document.getElementById('coldMovementFilterLotId').value) || '',
                ((document.getElementById('coldMovementFilterVendor') && document.getElementById('coldMovementFilterVendor').value) || '').trim().toLowerCase()
            ].join('|');
            if (filterKey !== lastColdMovementFilterKey) {
                paginationState.coldMovements.currentPage = 1;
                lastColdMovementFilterKey = filterKey;
            }
            const allRows = getFilteredColdStorageMovementRows();
            const pageSize = paginationState.coldMovements.pageSize;
            const maxPage = Math.max(1, Math.ceil(allRows.length / pageSize));
            if (paginationState.coldMovements.currentPage > maxPage) paginationState.coldMovements.currentPage = maxPage;
            const rows = getPaginatedData(allRows, paginationState.coldMovements.currentPage, pageSize);

            if (!allRows.length) {
                tbody.innerHTML = '<tr><td colspan="12" class="px-4 py-8 text-center text-slate-500">No matching cold storage movements found</td></tr>';
                const pager = document.getElementById('coldMovementPagination');
                if (pager) pager.innerHTML = '';
                return;
            }
            tbody.innerHTML = '';
            rows.forEach(function(row) {
                const qtyCell = row.qty > 0 ? Number(row.qty).toFixed(2) : '-';
                const bagsCell = row.bags > 0 ? Number(row.bags).toFixed(2) : '-';
                const originalBagsCell = row.originalBags > 0 ? Number(row.originalBags).toFixed(2) : '-';
                const amountCell = row.amount > 0 ? `${RU}${Number(row.amount).toFixed(2)}` : '-';
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-200';
                tr.innerHTML = `
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.date || '-')}</td>
                    <td class="px-3 py-2 text-sm font-medium text-slate-700">${escapeHtml(row.type || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.itemName || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.coldStorageName || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.supplierName || '-')}</td>
                    <td class="px-3 py-2 text-sm text-right">${originalBagsCell}</td>
                    <td class="px-3 py-2 text-sm text-right">${qtyCell}</td>
                    <td class="px-3 py-2 text-sm text-right">${bagsCell}</td>
                    <td class="px-3 py-2 text-sm text-right">${amountCell}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.reference || '-')}</td>
                    <td class="px-3 py-2 text-sm">${escapeHtml(row.remarks || '-')}</td>
                    <td class="px-3 py-2 text-sm">
                        <div class="flex gap-2">
                            ${row.movementId ? `<button type="button" onclick='viewColdStorageMovement(${JSON.stringify(row.movementId)}, ${JSON.stringify(row.rawType || "")})' class="text-slate-700 hover:text-slate-900 font-medium">View</button>` : ''}
                            ${row.canEdit && row.movementId ? `<button type="button" onclick="editColdReleaseMovement(${JSON.stringify(row.movementId)})" class="text-blue-600 hover:text-blue-800 font-medium">Edit</button>` : ''}
                            ${row.canDelete ? `<button type="button" onclick='deleteColdStorageMovement(${JSON.stringify(row.movementId)}, ${JSON.stringify(row.rawType || "")})' class="text-red-600 hover:text-red-800 font-medium">Delete</button>` : '-'}
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);

                if (row.canEdit && row.movementId && String(activeInlineMovementReleaseEditId || '') === String(row.movementId)) {
                    const ctx = getColdReleaseMovementEditContext(row.movementId);
                    if (!ctx) return;
                    const detailTr = document.createElement('tr');
                    detailTr.className = 'border-b border-blue-200 bg-blue-50/40';
                    detailTr.innerHTML = `
                        <td colspan="12" class="px-3 py-3">
                            <div class="rounded-lg border border-blue-200 bg-white p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <p class="font-semibold text-slate-800">Edit Release Movement: ${escapeHtml(ctx.lot.itemName || '-')} | Lot ${escapeHtml(String(ctx.lot.id || '-'))}</p>
                                    <button type="button" onclick="cancelEditColdReleaseMovement()" class="text-slate-500 hover:text-slate-700 text-sm">Close</button>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Date</label>
                                        <input type="date" id="movementReleaseEditDate_${row.movementId}" value="${escapeHtml(String(ctx.move.date || ''))}" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Release Qty</label>
                                        <input type="number" id="movementReleaseEditQty_${row.movementId}" min="0" max="${ctx.baseQtyInLot.toFixed(2)}" step="any" value="${ctx.oldQty.toFixed(2)}" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Release Bags</label>
                                        <input type="number" id="movementReleaseEditBags_${row.movementId}" min="0" max="${ctx.baseBagsInLot.toFixed(2)}" step="any" value="${ctx.oldBags.toFixed(2)}" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Paid at Release</label>
                                        <input type="number" id="movementReleaseEditPaid_${row.movementId}" min="0" max="${ctx.maxEditablePaid.toFixed(2)}" step="any" value="${ctx.oldPaid.toFixed(2)}" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">LOT/CRATE Ref</label>
                                        <input type="text" id="movementReleaseEditReference_${row.movementId}" value="${escapeHtml(String(ctx.move.reference || ''))}" placeholder="Lot/Crate number" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-slate-600 mb-1">Remarks</label>
                                        <input type="text" id="movementReleaseEditRemarks_${row.movementId}" value="${escapeHtml(String(ctx.move.remarks || ''))}" placeholder="Release notes" class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    </div>
                                </div>
                                <p class="text-xs text-slate-500 mt-2">
                                    Editable availability: ${ctx.baseQtyInLot.toFixed(2)} ${escapeHtml(ctx.lot.unit || 'kg')} | Bags: ${ctx.baseBagsInLot.toFixed(2)} | Max paid: ${RU}${ctx.maxEditablePaid.toFixed(2)}
                                </p>
                                <div class="mt-3 flex gap-2">
                                    <button type="button" onclick="submitEditColdReleaseMovement(${JSON.stringify(row.movementId)})" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">Save Changes</button>
                                    <button type="button" onclick="cancelEditColdReleaseMovement()" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">Cancel</button>
                                </div>
                            </div>
                        </td>
                    `;
                    tbody.appendChild(detailTr);
                }
            });
            renderPagination('coldMovementPagination', allRows.length, paginationState.coldMovements.currentPage, paginationState.coldMovements.pageSize, 'changeColdMovementPage', 'changeColdMovementPageSize');
        }

        function viewColdStorageMovement(movementId, rawType) {
            if (!movementId) return;
            const type = String(rawType || '');
            let row = null;
            if (type === 'cold_payment') {
                const p = (appData.payments || []).find(function(x) { return String(x.id) === String(movementId); });
                if (!p) return;
                const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(p.invoiceId || ''); });
                row = {
                    date: p.date || '-',
                    type: 'Payment',
                    itemName: lot ? (lot.itemName || '-') : '-',
                    coldStorageName: lot ? (lot.coldStorageName || '-') : '-',
                    vendorName: p.party || '-',
                    supplierName: lot ? (lot.supplierName || '-') : '-',
                    originalBags: lot ? Math.max(0, (parseFloat(lot.bagsInCold) || 0) + (parseFloat(lot.releaseBagsTotal) || 0) + (parseFloat(lot.damageBagsTotal) || 0)) : 0,
                    qty: 0,
                    bags: 0,
                    amount: parseFloat(p.amount) || 0,
                    reference: String(p.reference || '').trim() || (p.invoice || '-'),
                    remarks: p.remarks || '-'
                };
            } else {
                const m = (appData.coldStorageMovements || []).find(function(x) { return String(x.id) === String(movementId); });
                if (!m) return;
                const lotMatch = (appData.coldStorageLots || []).find(function(l) { return String(l.id || '') === String(m.lotId || ''); });
                const map = { move_in: 'Move In', company_expense: 'Company Expense', charge_add: 'Periodic Charge', release_out: 'Release', shrinkage: 'Shrinkage', damage: 'Damage' };
                row = {
                    date: m.date || '-',
                    type: map[m.type] || (m.type || 'Movement'),
                    itemName: m.itemName || getItemNameById(m.itemId),
                    coldStorageName: m.coldStorageName || '-',
                    vendorName: m.vendorName || '-',
                    supplierName: m.supplierName || (lotMatch ? (lotMatch.supplierName || '-') : '-'),
                    originalBags: lotMatch ? Math.max(0, (parseFloat(lotMatch.bagsInCold) || 0) + (parseFloat(lotMatch.releaseBagsTotal) || 0) + (parseFloat(lotMatch.damageBagsTotal) || 0)) : 0,
                    qty: parseFloat(m.qty) || 0,
                    bags: parseFloat(m.bags) || 0,
                    amount: parseFloat(m.amount) || 0,
                    reference: String(m.reference || '').trim() || ((m.lotId ? `Lot ${m.lotId}` : '-')),
                    remarks: m.remarks || '-'
                };
            }
            alert(
                'Movement Details\n\n' +
                'Date: ' + (row.date || '-') + '\n' +
                'Type: ' + (row.type || '-') + '\n' +
                'Item: ' + (row.itemName || '-') + '\n' +
                'Cold Storage: ' + (row.coldStorageName || '-') + '\n' +
                'Vendor: ' + (row.vendorName || '-') + '\n' +
                'Supplier: ' + (row.supplierName || '-') + '\n' +
                'Original Bags: ' + Number(row.originalBags || 0).toFixed(2) + '\n' +
                'Qty: ' + Number(row.qty || 0).toFixed(2) + '\n' +
                'Bags: ' + Number(row.bags || 0).toFixed(2) + '\n' +
                'Amount: ' + RU + Number(row.amount || 0).toFixed(2) + '\n' +
                'Reference: ' + (row.reference || '-') + '\n' +
                'Remarks: ' + (row.remarks || '-')
            );
        }

        function exportColdMovementTimelineCsv() {
            const rows = getFilteredColdStorageMovementRows();
            if (!rows.length) {
                alert('No movement rows found for current filters.');
                return;
            }
            const quoteCsv = function(value) {
                return '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"';
            };
            let csv = '\uFEFF';
            csv += 'Cold Storage Movement Timeline\n';
            csv += 'Exported On,' + quoteCsv(new Date().toLocaleString()) + '\n';
            csv += '\n';
            csv += 'Date,Type,Item,Cold Storage,Supplier,Original Bags,Qty,Bags,Amount,Reference,Remarks\n';
            rows.forEach(function(row) {
                csv += [
                    quoteCsv(row.date || '-'),
                    quoteCsv(row.type || '-'),
                    quoteCsv(row.itemName || '-'),
                    quoteCsv(row.coldStorageName || '-'),
                    quoteCsv(row.supplierName || '-'),
                    quoteCsv(row.originalBags > 0 ? Number(row.originalBags).toFixed(2) : ''),
                    quoteCsv(row.qty > 0 ? Number(row.qty).toFixed(2) : ''),
                    quoteCsv(row.bags > 0 ? Number(row.bags).toFixed(2) : ''),
                    quoteCsv(row.amount > 0 ? Number(row.amount).toFixed(2) : ''),
                    quoteCsv(row.reference || '-'),
                    quoteCsv(row.remarks || '-')
                ].join(',') + '\n';
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'cold_storage_movement_timeline.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function populateColdMovementLotFilterOptions() {
            const lotSelect = document.getElementById('coldMovementFilterLotId');
            if (!lotSelect) return;
            const current = lotSelect.value || '';
            const lotIds = Array.from(new Set((appData.coldStorageLots || []).map(function(lot) {
                return String(lot && lot.id ? lot.id : '');
            }).filter(function(id) { return !!id; })));
            lotSelect.innerHTML = '<option value="">All Lots</option>';
            lotIds.forEach(function(lotId) {
                const lot = (appData.coldStorageLots || []).find(function(l) { return String(l.id) === String(lotId); });
                const label = lot
                    ? `${lot.itemName || 'Item'} | ${lot.coldStorageName || '-'} | ${(lot.lotReference || '').trim() || ('Lot ' + lotId)}`
                    : `Lot ${lotId}`;
                lotSelect.innerHTML += `<option value="${lotId}">${escapeHtml(label)}</option>`;
            });
            if (current && lotSelect.querySelector(`option[value="${current}"]`)) {
                lotSelect.value = current;
            }
        }

        function clearColdMovementFilters() {
            const fromEl = document.getElementById('coldMovementFilterFrom');
            const toEl = document.getElementById('coldMovementFilterTo');
            const typeEl = document.getElementById('coldMovementFilterType');
            const lotEl = document.getElementById('coldMovementFilterLotId');
            const vendorEl = document.getElementById('coldMovementFilterVendor');
            if (fromEl) fromEl.value = '';
            if (toEl) toEl.value = '';
            if (typeEl) typeEl.value = '';
            if (lotEl) lotEl.value = '';
            if (vendorEl) vendorEl.value = '';
            paginationState.coldMovements.currentPage = 1;
            renderColdStorageMovementsHistory();
        }

        // Stock movement filtered data
        let filteredStockMovements = [];
        let allStockMovements = [];
        let filteredColdLots = null;
        let lastColdMovementFilterKey = '';
        let lastColdVendorPayablesFilterKey = '';
        let coldDamageLastEditedField = 'qty';

        function recalculateInventory() {
            rebuildInventoryFromTransactions();
            saveData();
            refreshInventory();
            updateDashboard();
            populateDropdowns();
            alert('Inventory recalculated successfully.');
        }
        
        function refreshInventory() {
            const grid = document.getElementById('inventoryGrid');
            grid.innerHTML = '';
            
            let totalItems = 0;
            let totalQty = 0;
            let totalValue = 0;
            
            if (Object.keys(appData.inventory).length === 0) {
                grid.innerHTML = `
                    <div class="text-center text-slate-500 col-span-full py-8">
                        <svg class="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                        <p>No inventory items found</p>
                        <p class="text-xs text-slate-400 mt-1">Add some purchases to see inventory</p>
                    </div>
                `;
            } else {
                Object.keys(appData.inventory).forEach(itemId => {
                    const item = appData.items.find(i => i.id == itemId);
                    const stock = appData.inventory[itemId];
                    
                    if (item && stock.quantity > 0) {
                        totalItems++;
                        totalQty += stock.quantity;
                        totalValue += stock.totalCost;
                        
                        const avgCost = stock.totalCost / stock.quantity;
                        const stockLevel = stock.quantity > 1000 ? 'high' : stock.quantity > 100 ? 'medium' : 'low';
                        const stockColors = {
                            high: 'from-green-500 to-emerald-500',
                            medium: 'from-amber-500 to-orange-500',
                            low: 'from-red-500 to-rose-500'
                        };
                        
                        const card = document.createElement('div');
                        card.className = 'bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow';
                        card.innerHTML = `
                            <div class="h-1 bg-gradient-to-r ${stockColors[stockLevel]}"></div>
                            <div class="p-4">
                                <div class="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 class="font-bold text-slate-800">${item.name}</h4>
                                        <span class="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">${item.category}</span>
                                    </div>
                                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                                    </div>
                                </div>
                                <div class="space-y-2">
                                    <div class="flex justify-between items-center">
                                        <span class="text-xs text-slate-500">Quantity</span>
                                        <span class="text-lg font-bold text-blue-600">${stock.quantity.toLocaleString('en-IN')} ${item.unit}</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-xs text-slate-500">Avg Cost</span>
                                        <span class="text-sm font-medium text-slate-700">${RU}${avgCost.toFixed(2)}/${item.unit}</span>
                                    </div>
                                    <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
                                        <span class="text-xs text-slate-500">Total Value</span>
                                        <span class="text-sm font-bold text-emerald-600">${RU}${stock.totalCost.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                    }
                });
            }
            
            // Update summary cards
            const invTotalItems = document.getElementById('invTotalItems');
            const invTotalQty = document.getElementById('invTotalQty');
            const invTotalValue = document.getElementById('invTotalValue');
            if (invTotalItems) invTotalItems.textContent = totalItems;
            if (invTotalQty) invTotalQty.textContent = totalQty.toLocaleString('en-IN');
            if (invTotalValue) invTotalValue.textContent = `${RU}${(totalValue/1000).toFixed(0)}K`;
            
            // Update stock movement
            updateStockMovement();
        }
        
        function updateStockMovement() {
            // Collect all stock movements from purchases, sales, and cold transfers
            allStockMovements = [];
            let movementSeq = 1;
            let totalInwardQty = 0;
            let totalOutwardQty = 0;
            
            // Add purchase movements
            appData.purchases.forEach(purchase => {
                if (purchase.items) {
                    purchase.items.forEach(item => {
                        const inwardQty = parseFloat(item.grossWeight) || 0;
                        totalInwardQty += inwardQty;
                        allStockMovements.push({
                            movementId: movementSeq++,
                            date: purchase.date,
                            itemName: item.itemName,
                            itemId: item.itemId,
                            type: 'Purchase',
                            quantity: inwardQty,
                            bags: Math.max(0, parseFloat(item.bags) || 0),
                            invoice: purchase.invoice,
                            reference: purchase.supplierName,
                            unit: item.unit || 'kg'
                        });
                    });
                }
            });
            
            // Add sale movements
            appData.sales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const outwardQty = parseFloat(item.grossWeight) || 0;
                        totalOutwardQty += outwardQty;
                        allStockMovements.push({
                            movementId: movementSeq++,
                            date: sale.date,
                            itemName: item.itemName,
                            itemId: item.itemId,
                            type: 'Sale',
                            quantity: -outwardQty,
                            bags: -Math.max(0, parseFloat(item.bags) || 0),
                            invoice: sale.invoice,
                            reference: sale.customerName,
                            unit: item.unit || 'kg'
                        });
                    });
                }
            });

            (appData.coldStorageMovements || []).forEach(function(m) {
                const t = String(m.type || '');
                if (t === 'move_in') {
                    const q = Math.max(0, parseFloat(m.qty) || 0);
                    const b = Math.max(0, parseFloat(m.bags) || 0);
                    if (q > 0) {
                        totalOutwardQty += q;
                        allStockMovements.push({
                            movementId: movementSeq++,
                            date: m.date || '',
                            itemName: m.itemName || getItemNameById(m.itemId),
                            itemId: m.itemId,
                            type: 'MoveToCold',
                            quantity: -q,
                            bags: -b,
                            invoice: `COLD-${m.lotId || ''}`,
                            reference: (m.reference || '').trim() || (m.coldStorageName || 'Cold Storage'),
                            unit: getItemUnitById(m.itemId) || 'kg'
                        });
                    }
                }
                if (t === 'release_out') {
                    const q = Math.max(0, parseFloat(m.qty) || 0);
                    const b = Math.max(0, parseFloat(m.bags) || 0);
                    if (q > 0) {
                        totalInwardQty += q;
                        allStockMovements.push({
                            movementId: movementSeq++,
                            date: m.date || '',
                            itemName: m.itemName || getItemNameById(m.itemId),
                            itemId: m.itemId,
                            type: 'ReleaseFromCold',
                            quantity: q,
                            bags: b,
                            invoice: `COLD-${m.lotId || ''}`,
                            reference: (m.reference || '').trim() || (m.coldStorageName || 'Cold Storage'),
                            unit: getItemUnitById(m.itemId) || 'kg'
                        });
                    }
                }
            });
            
            // Populate item filter dropdown
            const itemFilterEl = document.getElementById('stockMovementFilterItem');
            if (itemFilterEl) {
                const currentValue = itemFilterEl.value;
                const uniqueItems = [...new Set(allStockMovements.map(m => m.itemName))].sort();
                itemFilterEl.innerHTML = '<option value="">All Items</option>';
                uniqueItems.forEach(item => {
                    itemFilterEl.innerHTML += `<option value="${item}">${item}</option>`;
                });
                itemFilterEl.value = currentValue;
            }
            
            // Update total movements count
            const invTotalMovements = document.getElementById('invTotalMovements');
            if (invTotalMovements) invTotalMovements.textContent = allStockMovements.length;

            // Dashboard style KPIs inspired by inventory cockpit layouts.
            const invKpiReceived = document.getElementById('invKpiReceived');
            const invKpiDispatched = document.getElementById('invKpiDispatched');
            const invKpiAvailable = document.getElementById('invKpiAvailable');
            if (invKpiReceived) invKpiReceived.textContent = totalInwardQty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (invKpiDispatched) invKpiDispatched.textContent = totalOutwardQty.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            if (invKpiAvailable) {
                const netAvailable = totalInwardQty - totalOutwardQty;
                invKpiAvailable.textContent = netAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            
            // Apply filters
            filterStockMovement();
        }
        
        function filterStockMovement() {
            const search = (document.getElementById('stockMovementSearch')?.value || '').toLowerCase();
            const itemFilter = document.getElementById('stockMovementFilterItem')?.value || '';
            const typeFilter = document.getElementById('stockMovementFilterType')?.value || '';
            const dateFrom = document.getElementById('stockMovementDateFrom')?.value || '';
            const sortBy = document.getElementById('stockMovementSort')?.value || 'date-desc';
            
            // Filter
            filteredStockMovements = allStockMovements.filter(m => {
                if (search && !String(m.itemName || '').toLowerCase().includes(search) && !String(m.reference || '').toLowerCase().includes(search)) return false;
                if (itemFilter && m.itemName !== itemFilter) return false;
                if (typeFilter && m.type !== typeFilter) return false;
                if (dateFrom && m.date < dateFrom) return false;
                return true;
            });
            
            // Sort
            filteredStockMovements.sort((a, b) => {
                switch(sortBy) {
                    case 'date-asc': return a.date.localeCompare(b.date);
                    case 'date-desc': return b.date.localeCompare(a.date);
                    case 'qty-desc': return Math.abs(b.quantity) - Math.abs(a.quantity);
                    case 'qty-asc': return Math.abs(a.quantity) - Math.abs(b.quantity);
                    case 'item-asc': return a.itemName.localeCompare(b.itemName);
                    default: return b.date.localeCompare(a.date);
                }
            });
            
            // Update count
            const countEl = document.getElementById('stockMovementFilterCount');
            if (countEl) {
                countEl.textContent = `Showing ${filteredStockMovements.length} of ${allStockMovements.length} movements`;
            }
            
            paginationState.stockMovement.currentPage = 1;
            renderStockMovementTable();
        }
        
        function clearStockMovementFilters() {
            document.getElementById('stockMovementSearch').value = '';
            document.getElementById('stockMovementFilterItem').value = '';
            document.getElementById('stockMovementFilterType').value = '';
            document.getElementById('stockMovementDateFrom').value = '';
            document.getElementById('stockMovementSort').value = 'date-desc';
            filterStockMovement();
        }
        
        function renderStockMovementTable() {
            const tbody = document.getElementById('stockMovement');
            tbody.innerHTML = '';
            
            if (filteredStockMovements.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-4 py-12 text-center text-slate-500">
                            <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            No stock movements found
                        </td>
                    </tr>
                `;
                document.getElementById('stockMovementPagination').innerHTML = '';
                return;
            }
            
            // Calculate running balances per item using chronological order
            // (independent of current display sort) for a stable, audit-friendly balance.
            const balanceLookup = {};
            const groupedByItem = {};
            filteredStockMovements.forEach(function(m) {
                const key = String(m.itemId || m.itemName || '');
                if (!groupedByItem[key]) groupedByItem[key] = [];
                groupedByItem[key].push(m);
            });
            Object.keys(groupedByItem).forEach(function(key) {
                const rows = groupedByItem[key].slice().sort(function(a, b) {
                    const d = String(a.date || '').localeCompare(String(b.date || ''));
                    if (d !== 0) return d;
                    const t = String(a.type || '').localeCompare(String(b.type || ''));
                    if (t !== 0) return t;
                    return (a.movementId || 0) - (b.movementId || 0);
                });
                let running = 0;
                rows.forEach(function(r) {
                    running += (parseFloat(r.quantity) || 0);
                    balanceLookup[r.movementId] = running;
                });
            });
            
            // Paginate
            const { currentPage, pageSize } = paginationState.stockMovement;
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedMovements = filteredStockMovements.slice(startIndex, startIndex + pageSize);
            
            paginatedMovements.forEach(m => {
                const qty = parseFloat(m.quantity) || 0;
                const bags = parseFloat(m.bags) || 0;
                const runningBalance = (m.movementId != null && balanceLookup[m.movementId] != null)
                    ? balanceLookup[m.movementId]
                    : qty;
                const dateText = (m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date))
                    ? new Date(m.date + 'T00:00:00').toLocaleDateString('en-GB')
                    : (m.date || '-');
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-100 hover:bg-cyan-50/60 transition-colors';
                if ((startIndex + paginatedMovements.indexOf(m)) % 2 === 0) {
                    tr.classList.add('bg-white');
                } else {
                    tr.classList.add('bg-slate-50/40');
                }
                const isInward = qty >= 0;
                const movementPill = isInward
                    ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">IN</span>'
                    : '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200 shadow-sm">OUT</span>';
                tr.innerHTML = `
                    <td class="px-4 py-3 align-top">
                        <span class="text-sm font-semibold text-slate-700">${dateText}</span>
                    </td>
                    <td class="px-4 py-3 align-top">
                        <div class="flex flex-col">
                            <span class="font-semibold text-slate-800">${m.itemName}</span>
                            <span class="text-[11px] text-slate-500">${m.unit || 'kg'}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full flex items-center justify-center ${isInward ? 'bg-emerald-100' : 'bg-rose-100'}">
                                <svg class="w-3 h-3 ${isInward ? 'text-emerald-600' : 'text-rose-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isInward ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'}"/>
                                </svg>
                            </span>
                            ${movementPill}
                        </div>
                    </td>
                    <td class="px-4 py-3 align-top">
                        <div class="text-xs leading-5 bg-slate-50 rounded-md px-2.5 py-1.5 border border-slate-200">
                            <span class="font-semibold text-slate-700">${m.invoice || '-'}</span>
                            <span class="text-slate-500 block">${m.reference || '-'}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-right align-top">
                        <span class="font-bold tabular-nums ${qty > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${qty > 0 ? '+' : ''}${qty.toLocaleString('en-IN', {minimumFractionDigits: 2})} ${m.unit}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right align-top">
                        <span class="font-semibold tabular-nums ${bags > 0 ? 'text-green-700' : (bags < 0 ? 'text-red-700' : 'text-slate-500')}">
                            ${bags === 0 ? '-' : ((bags > 0 ? '+' : '') + bags.toLocaleString('en-IN', {minimumFractionDigits: 2}))}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right align-top">
                        <span class="inline-flex font-semibold tabular-nums text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            ${runningBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})} ${m.unit}
                        </span>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            renderPagination('stockMovementPagination', filteredStockMovements.length, currentPage, pageSize, 'changeStockMovementPage', 'changeStockMovementPageSize');
        }

        // Sales functions
        function updateAvailableStock() {
            const itemId = document.getElementById('saleItem').value;
            const availableStockElement = document.getElementById('availableStock');
            const discountQtyContainer = document.getElementById('saleDiscountQtyContainer');
            const bagsContainer = document.querySelector('#saleBags').parentElement;
            
            // Get labels to update
            const grossLabel = document.querySelector('label[for="saleQuantity"]');
            const netLabel = document.querySelector('label[for="saleNetWeight"]');
            const netHelp = document.querySelector('#saleNetWeight').nextElementSibling;
            const saleQuantityEl = document.getElementById('saleQuantity');
            const saleNetWeightEl = document.getElementById('saleNetWeight');
            
            if (itemId && appData.inventory[itemId]) {
                const item = appData.items.find(i => i.id == itemId);
                const availableQty = getSaleAvailableQty(itemId);
                const coldQty = getActiveColdQtyByItem(itemId);
                availableStockElement.textContent = `Available: ${availableQty.toFixed(2)} ${item.unit} | In Cold: ${coldQty.toFixed(2)} ${item.unit}`;
                
                // Special handling for coconut products
                if (item.name.toLowerCase().includes('coconut')) {
                    bagsContainer.style.display = 'none';
                    discountQtyContainer.style.display = 'block';
                    
                    // Update labels for coconut
                    if (grossLabel) grossLabel.textContent = 'Gross Quantity (kg)';
                    if (saleQuantityEl) saleQuantityEl.placeholder = 'Gross Quantity';
                    if (netLabel) netLabel.textContent = 'Net Quantity';
                    if (saleNetWeightEl) saleNetWeightEl.placeholder = 'Net Quantity';
                    if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Discount)';
                    
                    // Clear bags value for coconut
                    document.getElementById('saleBags').value = '0';
                } else {
                    bagsContainer.style.display = 'block';
                    discountQtyContainer.style.display = 'none';
                    document.getElementById('saleDiscountQty').value = '0';
                    
                    // Reset labels
                    if (grossLabel) grossLabel.textContent = 'Gross Weight (kg)';
                    if (saleQuantityEl) saleQuantityEl.placeholder = 'Gross Weight';
                    if (netLabel) netLabel.textContent = 'Net Weight';
                    if (saleNetWeightEl) saleNetWeightEl.placeholder = 'Net Weight';
                    if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Bags)';
                }
            } else {
                availableStockElement.textContent = 'Available: 0';
                bagsContainer.style.display = 'block';
                discountQtyContainer.style.display = 'none';
                
                // Reset labels
                if (grossLabel) grossLabel.textContent = 'Gross Weight (kg)';
                if (saleQuantityEl) saleQuantityEl.placeholder = 'Gross Weight';
                if (netLabel) netLabel.textContent = 'Net Weight';
                if (saleNetWeightEl) saleNetWeightEl.placeholder = 'Net Weight';
                if (netHelp) netHelp.textContent = 'Auto-calculated (Gross - Bags)';
            }
            calculateSaleItemTotal();
        }

        function calculateSaleItemTotal() {
            const itemId = document.getElementById('saleItem').value;
            const item = itemId ? appData.items.find(i => i.id == itemId) : null;
            const grossWeight = parseFloat(document.getElementById('saleQuantity').value) || 0;
            const discount = parseFloat(document.getElementById('saleDiscount').value) || 0;
            const discountQty = parseFloat(document.getElementById('saleDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('saleRate').value) || 0;

            // Determine coconut-style discount handling:
            //  1) By the selected item if present.
            //  2) Otherwise, infer from the Discount Qty container visibility (used in edit mode
            //     when the item dropdown may not include items with zero inventory).
            let isCoconut = false;
            if (item && item.name && item.name.toLowerCase().includes('coconut')) {
                isCoconut = true;
            } else {
                const discountQtyContainer = document.getElementById('saleDiscountQtyContainer');
                if (discountQtyContainer && discountQtyContainer.style.display !== 'none') {
                    isCoconut = true;
                }
            }

            let netWeight = 0;
            let total = 0;
            if (isCoconut) {
                netWeight = grossWeight - discountQty;
            } else {
                netWeight = grossWeight - discount;
            }
            total = netWeight * rate;

            document.getElementById('saleNetWeight').value = netWeight;
            document.getElementById('saleItemTotal').value = total.toFixed(2);
        }

        function recalcSaleItemTotalFromNetWeight() {
            var netInput = parseFloat(document.getElementById('saleNetWeight').value);
            if (isNaN(netInput)) return;
            var itemId = document.getElementById('saleItem').value;
            if (!itemId) return;
            var item = appData.items.find(i => i.id == itemId);
            if (!item) return;
            var rate = parseFloat(document.getElementById('saleRate').value) || 0;
            if (item.name.toLowerCase().includes('coconut')) {
                document.getElementById('saleItemTotal').value = (netInput * rate).toFixed(2);
            } else {
                document.getElementById('saleItemTotal').value = (netInput * rate).toFixed(2);
            }
        }

        let editingSaleItemIndex = -1;

        function addItemToSale() {
            const itemId = document.getElementById('saleItem').value;
            const date = (document.getElementById('saleDate') && document.getElementById('saleDate').value) ? document.getElementById('saleDate').value : '';
            const truck = (document.getElementById('saleTruck') && document.getElementById('saleTruck').value) ? document.getElementById('saleTruck').value.trim() : '';
            const lrNumber = (document.getElementById('saleLRNumber') && document.getElementById('saleLRNumber').value) ? document.getElementById('saleLRNumber').value.trim() : '';
            const kaantaParchi = (document.getElementById('saleKaantaParchi') && document.getElementById('saleKaantaParchi').value) ? document.getElementById('saleKaantaParchi').value.trim() : '';
            const cityName = (document.getElementById('saleCityName') && document.getElementById('saleCityName').value) ? document.getElementById('saleCityName').value.trim() : '';
            const grossWeight = parseFloat(document.getElementById('saleQuantity').value);
            const bags = parseFloat(document.getElementById('saleBags').value) || 0;
            const discountQty = parseFloat(document.getElementById('saleDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('saleRate').value);
            
            if (!date || !itemId || !grossWeight || !rate) {
                alert('Please select date, item, enter gross weight and rate');
                return;
            }
            
            const item = appData.items.find(i => i.id == itemId);
            let netWeight = 0;
            let total = 0;
            
            if (item.name.toLowerCase().includes('coconut')) {
                netWeight = grossWeight - discountQty;
                total = netWeight * rate;
            } else {
                var discountVal = parseFloat(document.getElementById('saleDiscount').value) || 0;
                netWeight = grossWeight - discountVal;
                total = netWeight * rate;
            }
            // Use edited net weight from input if user changed it
            var inputNet = parseFloat(document.getElementById('saleNetWeight').value);
            if (!isNaN(inputNet) && inputNet >= 0) {
                netWeight = inputNet;
                total = netWeight * rate;
            }
            
            // Effective availability: include gross weight of the row being edited (if same item).
            let effectiveAvailable = getSaleAvailableQty(itemId);
            if (editingSaleItemIndex >= 0) {
                const existingRow = currentSaleItems[editingSaleItemIndex];
                if (existingRow && String(existingRow.itemId) === String(itemId)) {
                    effectiveAvailable += parseFloat(existingRow.grossWeight) || 0;
                }
            }
            if (effectiveAvailable < grossWeight) {
                alert('Insufficient stock available!');
                return;
            }
            
            const saleItem = {
                id: (editingSaleItemIndex >= 0 && currentSaleItems[editingSaleItemIndex])
                    ? currentSaleItems[editingSaleItemIndex].id
                    : Date.now(),
                itemId: itemId,
                itemName: item.name,
                date: date,
                truck: truck,
                lrNumber: lrNumber,
                kaantaParchi: kaantaParchi,
                cityName: cityName,
                grossWeight: grossWeight, // Gross quantity to be deducted from inventory
                bags: bags,
                netWeight: netWeight, // Net quantity after discount (for display)
                discountQty: discountQty, // Store discount for reference
                rate: rate,
                total: total, // Invoice amount = rate x net quantity
                isCoconut: item.name.toLowerCase().includes('coconut') // Flag for special handling
            };
            
            if (editingSaleItemIndex >= 0) {
                currentSaleItems[editingSaleItemIndex] = saleItem;
                editingSaleItemIndex = -1;
                resetSaleItemFormMode();
            } else {
                currentSaleItems.push(saleItem);
            }
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            
            // Clear item form
            document.getElementById('saleItem').value = '';
            document.getElementById('saleQuantity').value = '';
            document.getElementById('saleBags').value = '';
            document.getElementById('saleDiscount').value = '0';
            document.getElementById('saleNetWeight').value = '';
            document.getElementById('saleDiscountQty').value = '0';
            document.getElementById('saleRate').value = '';
            document.getElementById('saleItemTotal').value = '';
            document.getElementById('availableStock').textContent = 'Available: 0';
            var skp = document.getElementById('saleKaantaParchi');
            if (skp) skp.value = '';
            var cityEl = document.getElementById('saleCityName');
            if (cityEl) cityEl.value = '';
            document.getElementById('saleDiscountQtyContainer').style.display = 'none';
        }

        function editItemInSale(index) {
            const item = currentSaleItems[index];
            if (!item) return;
            editingSaleItemIndex = index;

            const saleItemEl = document.getElementById('saleItem');
            // The Sale Item dropdown only lists items with inventory>0. In edit mode
            // the item may not be present, so ensure an option exists.
            let option = saleItemEl.querySelector('option[value="' + item.itemId + '"]');
            if (!option) {
                option = document.createElement('option');
                option.value = item.itemId;
                option.textContent = item.itemName + ' (Editing)';
                saleItemEl.appendChild(option);
            }
            saleItemEl.value = item.itemId;
            // Refresh available stock display (this switches coconut/non-coconut UI too).
            if (typeof updateAvailableStock === 'function') {
                updateAvailableStock();
            }
            document.getElementById('saleDiscountQtyContainer').style.display = item.isCoconut ? '' : 'none';

            // Populate input values (same order as the "new item" flow).
            document.getElementById('saleQuantity').value = item.grossWeight || '';
            document.getElementById('saleBags').value = item.bags || 0;
            const saleDiscountVal = Math.max(0, (parseFloat(item.grossWeight) || 0) - (parseFloat(item.netWeight) || 0));
            document.getElementById('saleDiscount').value = item.isCoconut ? 0 : (item.bags || saleDiscountVal || 0);
            document.getElementById('saleDiscountQty').value = item.discountQty || 0;
            document.getElementById('saleRate').value = item.rate || '';
            var skp = document.getElementById('saleKaantaParchi');
            if (skp) skp.value = item.kaantaParchi || '';
            var cityEl = document.getElementById('saleCityName');
            if (cityEl) cityEl.value = item.cityName || item.city || '';
            if (item.date) document.getElementById('saleDate').value = item.date;
            document.getElementById('saleTruck').value = item.truck || '';
            document.getElementById('saleLRNumber').value = item.lrNumber || '';

            // Let the shared auto-calc compute Net Weight & Item Total (same as new entry).
            calculateSaleItemTotal();
            document.getElementById('saleNetWeight').value = item.netWeight || '';
            document.getElementById('saleItemTotal').value = (item.total != null) ? Number(item.total).toFixed(2) : '';
            
            // Change the "Add Item" button to "Update Item" visually.
            const btn = document.querySelector('button[onclick="addItemToSale()"]');
            if (btn) {
                btn.textContent = 'Update Item';
                btn.classList.remove('bg-secondary');
                btn.classList.add('bg-amber-600');
            }
            
            updateCurrentSaleItemsDisplay();
            var target = document.getElementById('saleItem');
            if (target && typeof target.scrollIntoView === 'function') {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function cancelEditSaleItem() {
            editingSaleItemIndex = -1;
            resetSaleItemFormMode();
            document.getElementById('saleItem').value = '';
            document.getElementById('saleQuantity').value = '';
            document.getElementById('saleBags').value = '';
            document.getElementById('saleDiscount').value = '0';
            document.getElementById('saleNetWeight').value = '';
            document.getElementById('saleDiscountQty').value = '0';
            document.getElementById('saleRate').value = '';
            document.getElementById('saleItemTotal').value = '';
            document.getElementById('availableStock').textContent = 'Available: 0';
            var skp = document.getElementById('saleKaantaParchi');
            if (skp) skp.value = '';
            var cityEl = document.getElementById('saleCityName');
            if (cityEl) cityEl.value = '';
            document.getElementById('saleDiscountQtyContainer').style.display = 'none';
            updateCurrentSaleItemsDisplay();
        }

        function resetSaleItemFormMode() {
            const btn = document.querySelector('button[onclick="addItemToSale()"]');
            if (btn) {
                btn.textContent = 'Add Item to Invoice';
                btn.classList.remove('bg-amber-600');
                btn.classList.add('bg-secondary');
            }
        }

        function updateCurrentSaleItemsDisplay() {
            const tbody = document.getElementById('currentSaleItems');
            const tfoot = document.getElementById('currentSaleItemsTotals');
            tbody.innerHTML = '';
            if (tfoot) tfoot.innerHTML = '';
            
            if (currentSaleItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No items added yet</td></tr>';
                return;
            }
            
            currentSaleItems.forEach((item, index) => {
                const row = document.createElement('tr');
                const isEditing = (index === editingSaleItemIndex);
                row.className = 'border-b border-slate-200' + (isEditing ? ' bg-amber-50' : '');
                
                // For coconut, show discount quantity instead of bags
                const middleColumn = item.isCoconut 
                    ? `<td class="px-4 py-3">${item.discountQty || 0}</td>` 
                    : `<td class="px-4 py-3">${item.bags}</td>`;
                
                const actionCell = isEditing
                    ? `<button onclick="cancelEditSaleItem()" class="text-slate-600 hover:text-slate-800 font-medium mr-3">Cancel</button>
                       <button onclick="removeItemFromSale(${index})" class="text-red-500 hover:text-red-700 font-medium">Remove</button>`
                    : `<button onclick="editItemInSale(${index})" class="text-blue-600 hover:text-blue-800 font-medium mr-3">Edit</button>
                       <button onclick="removeItemFromSale(${index})" class="text-red-500 hover:text-red-700 font-medium">Remove</button>`;

                row.innerHTML = `
                    <td class="px-4 py-3">
                        <div>${item.itemName}</div>
                        <div class="text-xs text-slate-500">${escapeHtml(item.date || '-')} | ${escapeHtml(item.truck || '-')} | ${escapeHtml(item.lrNumber || '-')}</div>
                    </td>
                    <td class="px-4 py-3">${item.grossWeight}</td>
                    ${middleColumn}
                    <td class="px-4 py-3">${item.netWeight}</td>
                    <td class="px-4 py-3">${RU}${item.rate}</td>
                    <td class="px-4 py-3">${RU}${item.total.toFixed(2)}</td>
                    <td class="px-4 py-3">${escapeHtml(item.kaantaParchi || '-')}</td>
                    <td class="px-4 py-3">${escapeHtml(item.cityName || item.city || '-')}</td>
                    <td class="px-4 py-3">${actionCell}</td>
                `;
                tbody.appendChild(row);
            });
            const totals = currentSaleItems.reduce(function(acc, item) {
                const bagsVal = item.isCoconut ? (parseFloat(item.discountQty) || 0) : (parseFloat(item.bags) || 0);
                acc.gross += parseFloat(item.grossWeight) || 0;
                acc.bags += bagsVal;
                acc.net += parseFloat(item.netWeight) || 0;
                acc.amount += parseFloat(item.total) || 0;
                return acc;
            }, { gross: 0, bags: 0, net: 0, amount: 0 });
            if (tfoot) {
                tfoot.innerHTML = `
                    <tr class="bg-slate-100 border-t border-slate-300">
                        <td class="px-4 py-3 text-right font-semibold text-slate-700">Totals</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.gross.toFixed(2)}</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.bags.toFixed(2)}</td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${totals.net.toFixed(2)}</td>
                        <td class="px-4 py-3"></td>
                        <td class="px-4 py-3 font-semibold text-slate-800">${RU}${totals.amount.toFixed(2)}</td>
                        <td class="px-4 py-3" colspan="3"></td>
                    </tr>
                `;
            }
        }

        function removeItemFromSale(index) {
            if (editingSaleItemIndex === index) {
                // Cancel edit mode first before removing.
                editingSaleItemIndex = -1;
                resetSaleItemFormMode();
            } else if (editingSaleItemIndex > index) {
                editingSaleItemIndex -= 1;
            }
            currentSaleItems.splice(index, 1);
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
        }

        // Sales Others management
        let saleOthersIndex = 1;
        
        function syncSaleOthersRowState(row) {
            if (!row) return;
            const isDone = row.dataset.done === 'true';
            const reasonEl = row.querySelector('.sale-others-reason');
            const amountEl = row.querySelector('.sale-others-amount');
            const operationEl = row.querySelector('.sale-others-operation');
            [reasonEl, amountEl, operationEl].forEach(el => {
                if (el) el.disabled = isDone;
            });
            const doneBtn = row.querySelector('.sale-others-done-btn');
            const editBtn = row.querySelector('.sale-others-edit-btn');
            if (doneBtn) doneBtn.classList.toggle('hidden', isDone);
            if (editBtn) editBtn.classList.toggle('hidden', !isDone);
        }
        
        function attachSaleOthersRowBehavior(row) {
            if (!row) return;
            row.classList.remove('md:grid-cols-3');
            row.classList.add('md:grid-cols-4');
            if (!row.dataset.index) {
                row.dataset.index = String(saleOthersIndex++);
            }
            if (!row.dataset.done) row.dataset.done = 'false';
            const rowIndex = row.getAttribute('data-index');
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(function(input) {
                input.oninput = function() {
                    row.dataset.done = 'false';
                    syncSaleOthersRowState(row);
                };
                input.onchange = function() {
                    row.dataset.done = 'false';
                    syncSaleOthersRowState(row);
                };
            });
            if (!row.querySelector('.sale-others-actions')) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'sale-others-actions flex items-end gap-2';
                actionsDiv.innerHTML = `
                    <button type="button" onclick="doneSaleOthersRow(${rowIndex})" class="sale-others-done-btn flex-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Done</button>
                    <button type="button" onclick="editSaleOthersRow(${rowIndex})" class="sale-others-edit-btn hidden flex-1 p-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">Edit</button>
                    <button type="button" onclick="removeSaleOthersRow(${rowIndex})" class="sale-others-remove-btn p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>
                `;
                row.appendChild(actionsDiv);
            }
            syncSaleOthersRowState(row);
        }
        
        function initializeSaleOthersRows() {
            const rows = document.querySelectorAll('.sale-others-row');
            let maxIndex = 0;
            rows.forEach(function(row, idx) {
                if (!row.getAttribute('data-index')) {
                    row.setAttribute('data-index', String(idx));
                }
                const currentIndex = parseInt(row.getAttribute('data-index'), 10);
                if (!isNaN(currentIndex)) maxIndex = Math.max(maxIndex, currentIndex);
                attachSaleOthersRowBehavior(row);
            });
            saleOthersIndex = maxIndex + 1;
        }
        
        function doneSaleOthersRow(index) {
            const row = document.querySelector('.sale-others-row[data-index="' + String(index) + '"]');
            if (!row) return;
            const reason = ((row.querySelector('.sale-others-reason') || {}).value || '').trim();
            const amount = parseFloat(((row.querySelector('.sale-others-amount') || {}).value) || 0) || 0;
            if (!reason || amount <= 0) {
                alert('Please enter a valid reason and amount before clicking Done.');
                return;
            }
            row.dataset.done = 'true';
            syncSaleOthersRowState(row);
            calculateSaleTotals();
        }
        
        function editSaleOthersRow(index) {
            const row = document.querySelector('.sale-others-row[data-index="' + String(index) + '"]');
            if (!row) return;
            row.dataset.done = 'false';
            syncSaleOthersRowState(row);
            calculateSaleTotals();
        }
        
        function addSaleOthersRow() {
            const container = document.getElementById('saleOthersContainer');
            const newRow = document.createElement('div');
            newRow.className = 'sale-others-row grid grid-cols-1 md:grid-cols-4 gap-4 mb-3';
            newRow.setAttribute('data-index', saleOthersIndex);
            newRow.innerHTML = `
                <div>
                    <input type="text" class="sale-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason">
                </div>
                <div>
                    <input type="number" class="sale-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                </div>
                <div>
                    <select class="sale-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option value="add">Add (+)</option>
                        <option value="reduce">Reduce (-)</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button type="button" onclick="removeSaleOthersRow(${saleOthersIndex})" class="w-full p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Remove</button>
                </div>
            `;
            container.appendChild(newRow);
            
            attachSaleOthersRowBehavior(newRow);
            
            saleOthersIndex++;
        }
        
        function removeSaleOthersRow(index) {
            const row = document.querySelector(`.sale-others-row[data-index="${index}"]`);
            if (row) {
                row.remove();
                calculateSaleTotals();
            }
        }
        
        function getSaleOthersEntries() {
            const rows = document.querySelectorAll('.sale-others-row');
            const entries = [];
            
            rows.forEach(row => {
                if (row.dataset.done !== 'true') return;
                const reason = row.querySelector('.sale-others-reason').value;
                const amount = parseFloat(row.querySelector('.sale-others-amount').value) || 0;
                const operation = row.querySelector('.sale-others-operation').value;
                
                if (amount > 0 && reason) {
                    entries.push({ reason, amount, operation });
                }
            });
            
            return entries;
        }

        function calculateSaleTotals() {
            const itemsTotal = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
            const hammali = parseFloat(document.getElementById('saleHammali').value) || 0;
            const advance = parseFloat(document.getElementById('saleAdvance').value) || 0;
            const truckAdvance = parseFloat(document.getElementById('saleTruckAdvance').value) || 0;
            
            // Get all Others entries
            const othersEntries = getSaleOthersEntries();
            let othersTotal = 0;
            
            othersEntries.forEach(entry => {
                if (entry.operation === 'add') {
                    othersTotal += entry.amount;
                } else {
                    othersTotal -= entry.amount;
                }
            });
            
            // Calculate grand total with all Others AND truck advance
            let grandTotal = itemsTotal + hammali - advance + truckAdvance + othersTotal;
            
            // Display Others total if any entries exist
            if (othersEntries.length > 0) {
                document.getElementById('saleOthersDisplayContainer').style.display = 'block';
                document.getElementById('saleOthersDisplay').textContent = Math.abs(othersTotal).toFixed(2);
                document.getElementById('saleOthersSign').textContent = othersTotal >= 0 ? '+' : '-';
            } else {
                document.getElementById('saleOthersDisplayContainer').style.display = 'none';
            }
            
            document.getElementById('saleItemsTotal').textContent = itemsTotal.toFixed(2);
            document.getElementById('saleHammaliDisplay').textContent = hammali.toFixed(2);
            document.getElementById('saleAdvanceDisplay').textContent = advance.toFixed(2);
            document.getElementById('saleTruckAdvanceDisplay').textContent = truckAdvance.toFixed(2);
            document.getElementById('saleGrandTotal').textContent = grandTotal.toFixed(2);
        }

        function saveSaleInvoice() {
            const date = document.getElementById('saleDate').value;
            const invoice = document.getElementById('saleInvoice').value;
            const customerId = document.getElementById('saleCustomer').value;
            const truck = document.getElementById('saleTruck').value;
            const lrNumber = document.getElementById('saleLRNumber').value;
            const hammali = parseFloat(document.getElementById('saleHammali').value) || 0;
            const advance = parseFloat(document.getElementById('saleAdvance').value) || 0;
            const truckAdvance = parseFloat(document.getElementById('saleTruckAdvance').value) || 0;
            const othersEntries = getSaleOthersEntries();
            const postInlineBrokerage = !!(document.getElementById('salePostBrokerageToggle') && document.getElementById('salePostBrokerageToggle').checked);
            const inlineBrokerageEntries = postInlineBrokerage ? getSaleBrokerageEntries() : [];
            let saleMessageTargetId = null;
            
            if (!date || !invoice || !customerId || currentSaleItems.length === 0) {
                alert('Please fill in all required fields and add at least one item');
                return;
            }
            if (postInlineBrokerage && inlineBrokerageEntries.length === 0) {
                alert('Please add at least one valid brokerage row (broker and amount) or turn off Post to Brokerage.');
                return;
            }

            const invoiceTrim = (invoice || '').trim().toUpperCase();
            const duplicateSale = appData.sales.find(s => (s.invoice || '').trim().toUpperCase() === invoiceTrim && s.id !== editingSaleId);
            if (duplicateSale) {
                alert('This Sales invoice number is already used. Please use a unique invoice number.');
                return;
            }
            
            const customer = appData.customers.find(c => c.id == customerId);
            if (!customer) {
                alert('Selected customer not found');
                return;
            }
            const itemDates = collectUniqueNonEmpty(currentSaleItems.map(function(item) { return item.date || date; }));
            const itemTrucks = collectUniqueNonEmpty(currentSaleItems.map(function(item) { return item.truck || truck; }));
            const itemLrNumbers = collectUniqueNonEmpty(currentSaleItems.map(function(item) { return item.lrNumber || lrNumber; }));
            const itemKaantaParchi = collectUniqueNonEmpty(currentSaleItems.map(function(item) { return item.kaantaParchi || ''; }));
            // Mandatory item-wise purchase linking for sale items.
            linkedPurchases = normalizeLinkedPurchasesForItems(linkedPurchases, currentSaleItems);
            if (!linkedPurchases.length) {
                alert('Purchase linking is compulsory item-wise. Please click "Link Purchase" and link all sale item quantities.');
                return;
            }
            const linkTolerance = 0.01;
            const requiredByItemForSave = {};
            currentSaleItems.forEach(function(item) {
                const itemId = String(item.itemId);
                requiredByItemForSave[itemId] = (requiredByItemForSave[itemId] || 0) + (parseFloat(item.grossWeight) || 0);
            });
            const linkedByItemForSave = {};
            linkedPurchases.forEach(function(link) {
                const itemId = String(link.itemId || '');
                if (!itemId) return;
                linkedByItemForSave[itemId] = (linkedByItemForSave[itemId] || 0) + getLinkedQtyValue(link);
            });
            for (const itemId in requiredByItemForSave) {
                const req = requiredByItemForSave[itemId] || 0;
                const lnk = linkedByItemForSave[itemId] || 0;
                if (Math.abs(req - lnk) > linkTolerance) {
                    const itemObj = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
                    const name = itemObj ? itemObj.name : itemId;
                    alert('Purchase linking incomplete for item "' + name + '". Required ' + req.toFixed(2) + ' kg, linked ' + lnk.toFixed(2) + ' kg.');
                    return;
                }
            }
            // Sale rate is independent from purchase. Ensure each sale item has its own valid rate.
            for (let i = 0; i < currentSaleItems.length; i++) {
                const row = currentSaleItems[i];
                const saleRate = parseFloat(row.rate) || 0;
                if (saleRate <= 0) {
                    const itemName = row.itemName || ('Item ' + (row.itemId || ''));
                    alert('Please enter sale rate for "' + itemName + '" before saving.');
                    return;
                }
            }
            // Negative stock check: ensure no item goes below zero
            const requiredByItem = {};
            currentSaleItems.forEach(item => {
                requiredByItem[item.itemId] = (requiredByItem[item.itemId] || 0) + item.grossWeight;
            });
            let availableByItem = {};
            Object.keys(appData.inventory || {}).forEach(id => {
                availableByItem[id] = appData.inventory[id].quantity || 0;
            });
            if (editingSaleId) {
                const existingSale = appData.sales.find(s => s.id === editingSaleId);
                if (existingSale && existingSale.items && !saleEditInventoryReversed) {
                    existingSale.items.forEach(item => {
                        availableByItem[item.itemId] = (availableByItem[item.itemId] || 0) + item.grossWeight;
                    });
                }
            }
            for (const itemId in requiredByItem) {
                const required = requiredByItem[itemId];
                const available = availableByItem[itemId] || 0;
                if (available < required) {
                    const item = appData.items.find(i => i.id == itemId);
                    const name = item ? item.name : itemId;
                    const unit = item ? (item.unit || 'kg') : 'kg';
                    alert('Negative stock not allowed. "' + name + '" has available ' + available.toFixed(2) + ' ' + unit + ' but sale requires ' + required.toFixed(2) + ' ' + unit + '. Reduce quantity or add purchase first.');
                    return;
                }
            }
            const itemsTotal = currentSaleItems.reduce((sum, item) => sum + item.total, 0);
            
            // Calculate grand total with Others AND truck advance
            let grandTotal = itemsTotal + hammali - advance + truckAdvance;
            othersEntries.forEach(entry => {
                if (entry.operation === 'add') {
                    grandTotal += entry.amount;
                } else {
                    grandTotal -= entry.amount;
                }
            });
            
            // Credit limit alert: balance after this sale exceeds customer credit limit (default 2 lacs)
            const creditLimit = (customer.creditLimit != null && customer.creditLimit !== '') ? parseFloat(customer.creditLimit) : 200000;
            const balanceBefore = getCustomerBalance(customerId, editingSaleId);
            const balanceAfter = editingSaleId
                ? (balanceBefore - ((appData.sales.find(s => s.id === editingSaleId) || {}).grandTotal || 0) + grandTotal)
                : (balanceBefore + grandTotal);
            if (balanceAfter > creditLimit) {
                const ok = confirm('Credit limit alert: "' + customer.name + '" has credit limit ' + RU + creditLimit.toLocaleString('en-IN') + '. After this sale, balance will be ' + RU + balanceAfter.toLocaleString('en-IN') + '. Do you still want to save?');
                if (!ok) return;
            }
            
            if (editingSaleId) {
                // Editing existing sale
                const existingSale = appData.sales.find(s => s.id === editingSaleId);
                if (existingSale) {
                    // In normal edit flow we already restored old stock when edit was opened.
                    // Keep fallback for safety when save is called without active edit session.
                    if (!saleEditInventoryReversed) {
                        adjustInventoryForSaleItems(existingSale.items || [], +1);
                    }
                    
                    // Update sale with new data
                    existingSale.date = date;
                    existingSale.invoice = invoice;
                    existingSale.customerId = customerId;
                    existingSale.customerName = customer.name;
                    existingSale.date = itemDates[0] || date;
                    existingSale.truck = itemTrucks[0] || truck;
                    existingSale.lrNumber = itemLrNumbers[0] || lrNumber;
                    existingSale.masterInvoice = existingSale.masterInvoice || invoice;
                    existingSale.multiDates = itemDates;
                    existingSale.multiTrucks = itemTrucks;
                    existingSale.multiLrNumbers = itemLrNumbers;
                    existingSale.multiKaantaParchi = itemKaantaParchi;
                    existingSale.inlineBrokerageEnabled = postInlineBrokerage;
                    existingSale.inlineBrokerageEntries = postInlineBrokerage ? inlineBrokerageEntries.map(function(entry) { return { brokerId: entry.brokerId, brokerName: entry.brokerName, amount: entry.amount }; }) : [];
                    existingSale.items = [...currentSaleItems];
                    existingSale.itemsTotal = itemsTotal;
                    existingSale.hammali = hammali;
                    existingSale.advance = advance;
                    existingSale.truckAdvance = truckAdvance;
                    existingSale.othersEntries = othersEntries;
                    existingSale.grandTotal = grandTotal;
                    existingSale.balance = grandTotal - (existingSale.received || 0);
                    existingSale.linkedPurchases = [...linkedPurchases]; // Add linked purchases
                    Object.assign(existingSale, getAuditMeta(false));
                    removeInlineBrokerageBySource('inline_sale', existingSale.id);
                    if (postInlineBrokerage) {
                        pushInlineBrokerageEntries({
                            entries: inlineBrokerageEntries,
                            items: existingSale.items || [],
                            date: existingSale.date || date,
                            type: 'Sale',
                            reference: existingSale.invoice || invoice,
                            source: 'inline_sale',
                            sourceInvoiceId: existingSale.id,
                            sourceInvoiceNo: existingSale.invoice || invoice
                        });
                    }
                    
                    // Deduct new inventory for updated sale (using gross weight)
                    adjustInventoryForSaleItems(currentSaleItems, -1);
                    saleMessageTargetId = existingSale.id;
                }
                resetSaleEditSessionState();
                editingSaleId = null;
            } else {
                // Creating new sale
                const sale = {
                    id: Date.now(),
                    date: itemDates[0] || date,
                    invoice: invoice,
                    masterInvoice: invoice,
                    customerId: customerId,
                    customerName: customer.name,
                    truck: itemTrucks[0] || truck,
                    lrNumber: itemLrNumbers[0] || lrNumber,
                    multiDates: itemDates,
                    multiTrucks: itemTrucks,
                    multiLrNumbers: itemLrNumbers,
                    multiKaantaParchi: itemKaantaParchi,
                    inlineBrokerageEnabled: postInlineBrokerage,
                    inlineBrokerageEntries: postInlineBrokerage ? inlineBrokerageEntries.map(function(entry) { return { brokerId: entry.brokerId, brokerName: entry.brokerName, amount: entry.amount }; }) : [],
                    items: [...currentSaleItems],
                    itemsTotal: itemsTotal,
                    hammali: hammali,
                    advance: advance,
                    truckAdvance: truckAdvance,
                    othersEntries: othersEntries,
                    grandTotal: grandTotal,
                    received: 0, // Don't count advance as received initially
                    balance: grandTotal, // Full amount is balance initially
                    linkedPurchases: [...linkedPurchases], // Add linked purchases
                    ...getAuditMeta(true)
                };
                appData.sales.push(sale);
                if (postInlineBrokerage) {
                    pushInlineBrokerageEntries({
                        entries: inlineBrokerageEntries,
                        items: sale.items || [],
                        date: sale.date || date,
                        type: 'Sale',
                        reference: sale.invoice || invoice,
                        source: 'inline_sale',
                        sourceInvoiceId: sale.id,
                        sourceInvoiceNo: sale.invoice || invoice
                    });
                }
                saleMessageTargetId = sale.id;
                
                // Update inventory for new sale (using gross weight)
                adjustInventoryForSaleItems(currentSaleItems, -1);
            }
            
            saveData();
            updateSalesHistory();
            updateBrokerageHistory();
            updateDashboard();
            populateDropdowns();
            
            // Regenerate ledger if on ledger page to show new entry immediately
            if (typeof generateLedger === 'function') {
                generateLedger();
            }
            
            // Hide cancel button
            document.getElementById('cancelSaleEdit').classList.add('hidden');
            
            // Clear form and return to history view
            clearSaleForm();
            const wasEditing = editingSaleId !== null;
            editingSaleId = null;
            alert(wasEditing ? 'Sale updated successfully!' : 'Sale invoice saved successfully!');

            if (saleMessageTargetId != null) {
                const doSend = confirm('Do you want to send this sales invoice on WhatsApp now?');
                if (doSend) {
                    sendSaleWhatsApp(saleMessageTargetId);
                }
            }
            
            // Return to history view
            hideSalesForm();
        }

        function clearSaleForm() {
            document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('saleInvoice').value = '';
            document.getElementById('saleCustomer').value = '';
            var sci = document.getElementById('saleCustomerInput');
            if (sci) sci.value = '';
            var scd = document.getElementById('saleCustomerDropdown');
            if (scd) scd.classList.add('hidden');
            document.getElementById('saleTruck').value = '';
            document.getElementById('saleLRNumber').value = '';
            var skp = document.getElementById('saleKaantaParchi');
            if (skp) skp.value = '';
            document.getElementById('saleHammali').value = '';
            document.getElementById('saleAdvance').value = '';
            document.getElementById('saleTruckAdvance').value = '';
            var sdEl = document.getElementById('saleDiscount');
            if (sdEl) sdEl.value = '0';
            
            // Clear all Others rows except the first one
            const container = document.getElementById('saleOthersContainer');
            container.innerHTML = `
                <div class="sale-others-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-3" data-index="0">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Reason/Description</label>
                        <input type="text" class="sale-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason (e.g., Transport, Commission)">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                        <input type="number" class="sale-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                        <select class="sale-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="add">Add (+)</option>
                            <option value="reduce">Reduce (-)</option>
                        </select>
                    </div>
                </div>
            `;
            initializeSaleOthersRows();
            
            currentSaleItems = [];
            editingSaleId = null;
            editingSaleItemIndex = -1;
            resetSaleItemFormMode();
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            
            // Clear linked purchases
            linkedPurchases = [];
            updateLinkedPurchasesDisplay();
        }

        // Purchase Linking Functions (Item-wise mandatory linking)
        function getLinkedQtyValue(link) {
            if (!link) return 0;
            return parseFloat(link.quantityUsed ?? link.quantity ?? link.qtyUsed ?? link.qty ?? 0) || 0;
        }

        function getLinkedBagsValue(link) {
            if (!link) return 0;
            return parseFloat(link.bagsUsed ?? link.bags ?? 0) || 0;
        }

        function getPurchaseLineKey(purchaseId, itemId, purchaseItemId, lineIdx) {
            const pid = String(purchaseId || '');
            const iid = String(itemId || '');
            if (purchaseItemId != null && String(purchaseItemId) !== '') {
                return pid + '|' + iid + '|id:' + String(purchaseItemId);
            }
            return pid + '|' + iid + '|idx:' + String(lineIdx || 0);
        }

        function getPurchaseLineRows(filterItemId) {
            const hasFilter = filterItemId != null && String(filterItemId) !== '';
            const targetItemId = hasFilter ? String(filterItemId) : '';
            const rows = [];
            (appData.purchases || []).forEach(function(purchase) {
                (purchase.items || []).forEach(function(pItem, pIdx) {
                    const itemId = String(pItem.itemId || '');
                    if (!itemId) return;
                    if (hasFilter && itemId !== targetItemId) return;
                    const qty = Math.max(0, parseFloat(pItem.grossWeight ?? pItem.quantity ?? pItem.netWeight ?? 0) || 0);
                    rows.push({
                        purchase: purchase,
                        purchaseId: String(purchase.id),
                        itemId: itemId,
                        purchaseItemId: (pItem.id != null && pItem.id !== '') ? String(pItem.id) : '',
                        lineIdx: pIdx,
                        lineKey: getPurchaseLineKey(purchase.id, itemId, pItem.id, pIdx),
                        date: pItem.date || purchase.date || '',
                        itemName: pItem.itemName || ((appData.items || []).find(function(i) { return String(i.id) === itemId; }) || {}).name || itemId,
                        kaantaParchi: pItem.kaantaParchi || '',
                        grossWeight: Math.max(0, parseFloat(pItem.grossWeight ?? pItem.quantity ?? pItem.netWeight ?? 0) || 0),
                        qty: qty,
                        bags: Math.max(0, parseFloat(pItem.bags) || 0),
                        netWeight: Math.max(0, parseFloat(pItem.netWeight ?? pItem.quantity ?? 0) || 0)
                    });
                });
            });
            return rows;
        }

        function normalizeLinkedPurchasesForItems(rawLinks, saleItems) {
            const safeLinks = Array.isArray(rawLinks) ? rawLinks : [];
            const safeSaleItems = Array.isArray(saleItems) ? saleItems : [];
            const requiredByItem = {};
            let totalSaleQty = 0;
            safeSaleItems.forEach(function(si) {
                const itemId = si && si.itemId != null ? String(si.itemId) : '';
                const qty = parseFloat(si.grossWeight ?? si.quantity ?? si.netWeight ?? 0) || 0;
                if (!itemId || qty <= 0) return;
                requiredByItem[itemId] = (requiredByItem[itemId] || 0) + qty;
                totalSaleQty += qty;
            });
            const itemIds = Object.keys(requiredByItem);
            const normalized = [];
            safeLinks.forEach(function(link) {
                const qty = getLinkedQtyValue(link);
                if (qty <= 0) return;
                const purchaseId = link.purchaseId;
                const purchaseItemId = (link.purchaseItemId != null && link.purchaseItemId !== '') ? String(link.purchaseItemId) : '';
                if (link.itemId != null && link.itemId !== '') {
                    normalized.push({ purchaseId: purchaseId, itemId: String(link.itemId), purchaseItemId: purchaseItemId, quantityUsed: qty, bagsUsed: getLinkedBagsValue(link) });
                    return;
                }
                if (itemIds.length === 0) return;
                if (itemIds.length === 1 || totalSaleQty <= 0) {
                    normalized.push({ purchaseId: purchaseId, itemId: itemIds[0], purchaseItemId: purchaseItemId, quantityUsed: qty, bagsUsed: getLinkedBagsValue(link) });
                    return;
                }
                itemIds.forEach(function(itemId) {
                    const ratio = requiredByItem[itemId] / totalSaleQty;
                    normalized.push({ purchaseId: purchaseId, itemId: itemId, purchaseItemId: purchaseItemId, quantityUsed: qty * ratio, bagsUsed: getLinkedBagsValue(link) * ratio });
                });
            });
            const map = {};
            normalized.forEach(function(l) {
                const lineKey = getPurchaseLineKey(l.purchaseId, l.itemId, l.purchaseItemId, 0);
                if (!map[lineKey]) map[lineKey] = { purchaseId: l.purchaseId, itemId: String(l.itemId), purchaseItemId: String(l.purchaseItemId || ''), quantityUsed: 0, bagsUsed: 0 };
                map[lineKey].quantityUsed += (parseFloat(l.quantityUsed) || 0);
                map[lineKey].bagsUsed += (parseFloat(l.bagsUsed) || 0);
            });
            return Object.keys(map).map(function(k) {
                const v = map[k];
                v.quantityUsed = +v.quantityUsed.toFixed(2);
                v.bagsUsed = +v.bagsUsed.toFixed(2);
                return v;
            });
        }

        function getPurchaseLineColdReservedQty(lineRow) {
            if (!lineRow) return 0;
            const targetPurchaseId = String(lineRow.purchaseId);
            const targetItemId = String(lineRow.itemId);
            const targetPurchaseItemId = String(lineRow.purchaseItemId || '');

            function activeQtyInColdLot(lot) {
                if (!lot || String(lot.itemId) !== targetItemId) return 0;
                if ((lot.status || 'active') === 'released') return 0;
                return Math.max(0, parseFloat(lot.qtyInCold) || 0);
            }

            let fromExplicitLots = 0;
            let explicitColdOnItem = 0;
            (appData.coldStorageLots || []).forEach(function(lot) {
                const q = activeQtyInColdLot(lot);
                if (q <= 0) return;
                const pid = lot.purchaseId;
                if (pid != null && String(pid) !== '') {
                    explicitColdOnItem += q;
                    const lotPurchaseId = String(pid);
                    const lotPurchaseItemId = (lot.purchaseItemId != null && lot.purchaseItemId !== '') ? String(lot.purchaseItemId) : '';
                    if (lotPurchaseId === targetPurchaseId && lotPurchaseItemId && targetPurchaseItemId && lotPurchaseItemId === targetPurchaseItemId) {
                        fromExplicitLots += q;
                    }
                }
            });

            const activeColdQty = getActiveColdQtyByItem(targetItemId);
            const unattributedCold = Math.max(0, activeColdQty - explicitColdOnItem);
            if (unattributedCold <= 0.0001) return Math.max(0, fromExplicitLots);

            const purchaseLineRows = getPurchaseLineRows(targetItemId);
            purchaseLineRows.sort(function(a, b) {
                const cmp = String(a.date).localeCompare(String(b.date));
                if (cmp !== 0) return cmp;
                const pidCmp = String(a.purchaseId).localeCompare(String(b.purchaseId));
                if (pidCmp !== 0) return pidCmp;
                return a.lineIdx - b.lineIdx;
            });

            let remaining = unattributedCold;
            const reservedByLine = {};
            purchaseLineRows.forEach(function(row) {
                if (remaining <= 0 || row.qty <= 0) return;
                const used = Math.min(row.qty, remaining);
                remaining -= used;
                reservedByLine[row.lineKey] = (reservedByLine[row.lineKey] || 0) + used;
            });
            return Math.max(0, fromExplicitLots + (reservedByLine[lineRow.lineKey] || 0));
        }

        function getPurchaseLineColdReservedBags(lineRow) {
            if (!lineRow) return 0;
            const targetPurchaseId = String(lineRow.purchaseId);
            const targetItemId = String(lineRow.itemId);
            const targetPurchaseItemId = String(lineRow.purchaseItemId || '');

            function activeBagsInColdLot(lot) {
                if (!lot || String(lot.itemId) !== targetItemId) return 0;
                if ((lot.status || 'active') === 'released') return 0;
                return Math.max(0, parseFloat(lot.bagsInCold) || 0);
            }

            let fromExplicitLots = 0;
            let explicitColdBagsOnItem = 0;
            (appData.coldStorageLots || []).forEach(function(lot) {
                const b = activeBagsInColdLot(lot);
                if (b <= 0) return;
                const pid = lot.purchaseId;
                if (pid != null && String(pid) !== '') {
                    explicitColdBagsOnItem += b;
                    const lotPurchaseId = String(pid);
                    const lotPurchaseItemId = (lot.purchaseItemId != null && lot.purchaseItemId !== '') ? String(lot.purchaseItemId) : '';
                    if (lotPurchaseId === targetPurchaseId && lotPurchaseItemId && targetPurchaseItemId && lotPurchaseItemId === targetPurchaseItemId) {
                        fromExplicitLots += b;
                    }
                }
            });

            const activeColdBags = getActiveColdBagsByItem(targetItemId);
            const unattributedColdBags = Math.max(0, activeColdBags - explicitColdBagsOnItem);
            if (unattributedColdBags <= 0.0001) return Math.max(0, fromExplicitLots);

            const purchaseLineRows = getPurchaseLineRows(targetItemId);
            purchaseLineRows.sort(function(a, b) {
                const cmp = String(a.date).localeCompare(String(b.date));
                if (cmp !== 0) return cmp;
                const pidCmp = String(a.purchaseId).localeCompare(String(b.purchaseId));
                if (pidCmp !== 0) return pidCmp;
                return a.lineIdx - b.lineIdx;
            });

            let remaining = unattributedColdBags;
            const reservedByLine = {};
            purchaseLineRows.forEach(function(row) {
                const rowBags = Math.max(0, parseFloat(row.bags) || 0);
                if (remaining <= 0 || rowBags <= 0) return;
                const used = Math.min(rowBags, remaining);
                remaining -= used;
                reservedByLine[row.lineKey] = (reservedByLine[row.lineKey] || 0) + used;
            });
            return Math.max(0, fromExplicitLots + (reservedByLine[lineRow.lineKey] || 0));
        }

        function getPurchaseLineAvailableQty(lineRow, currentEditingSaleId, currentTempLinks) {
            if (!lineRow) return 0;
            const rowPurchaseId = String(lineRow.purchaseId);
            const rowItemId = String(lineRow.itemId);
            const rowPurchaseItemId = String(lineRow.purchaseItemId || '');

            const coldReservedQty = getPurchaseLineColdReservedQty(lineRow);
            const alreadyLinked = (appData.sales || []).reduce(function(sum, sale) {
                const saleIdStr = (sale && sale.id !== undefined && sale.id !== null) ? String(sale.id) : null;
                if (sale.linkedPurchases && (!currentEditingSaleId || saleIdStr !== currentEditingSaleId)) {
                    const normalized = normalizeLinkedPurchasesForItems(sale.linkedPurchases, sale.items || []);
                    const used = normalized.reduce(function(acc, lp) {
                        if (String(lp.purchaseId) !== rowPurchaseId || String(lp.itemId) !== rowItemId) return acc;
                        if (!rowPurchaseItemId) return acc + getLinkedQtyValue(lp);
                        if (String(lp.purchaseItemId || '') === rowPurchaseItemId) return acc + getLinkedQtyValue(lp);
                        return acc;
                    }, 0);
                    return sum + used;
                }
                return sum;
            }, 0);
            const currentTempQty = (currentTempLinks || []).reduce(function(sum, lp) {
                if (String(lp.purchaseId) !== rowPurchaseId || String(lp.itemId) !== rowItemId) return sum;
                if (!rowPurchaseItemId) return sum + getLinkedQtyValue(lp);
                if (String(lp.purchaseItemId || '') === rowPurchaseItemId) return sum + getLinkedQtyValue(lp);
                return sum;
            }, 0);
            return Math.max(0, (parseFloat(lineRow.qty) || 0) - coldReservedQty - alreadyLinked + currentTempQty);
        }

        function getPurchaseLineAvailableBags(lineRow, currentEditingSaleId, currentTempLinks) {
            if (!lineRow) return 0;
            const rowPurchaseId = String(lineRow.purchaseId);
            const rowItemId = String(lineRow.itemId);
            const rowPurchaseItemId = String(lineRow.purchaseItemId || '');
            const lineBags = Math.max(0, parseFloat(lineRow.bags) || 0);
            const coldReservedBags = Math.max(0, getPurchaseLineColdReservedBags(lineRow));
            const alreadyLinkedBags = (appData.sales || []).reduce(function(sum, sale) {
                const saleIdStr = (sale && sale.id !== undefined && sale.id !== null) ? String(sale.id) : null;
                if (sale.linkedPurchases && (!currentEditingSaleId || saleIdStr !== currentEditingSaleId)) {
                    const normalized = normalizeLinkedPurchasesForItems(sale.linkedPurchases, sale.items || []);
                    const used = normalized.reduce(function(acc, lp) {
                        if (String(lp.purchaseId) !== rowPurchaseId || String(lp.itemId) !== rowItemId) return acc;
                        if (!rowPurchaseItemId) return acc + getLinkedBagsValue(lp);
                        if (String(lp.purchaseItemId || '') === rowPurchaseItemId) return acc + getLinkedBagsValue(lp);
                        return acc;
                    }, 0);
                    return sum + used;
                }
                return sum;
            }, 0);
            const currentTempBags = (currentTempLinks || []).reduce(function(sum, lp) {
                if (String(lp.purchaseId) !== rowPurchaseId || String(lp.itemId) !== rowItemId) return sum;
                if (!rowPurchaseItemId) return sum + getLinkedBagsValue(lp);
                if (String(lp.purchaseItemId || '') === rowPurchaseItemId) return sum + getLinkedBagsValue(lp);
                return sum;
            }, 0);
            return Math.max(0, lineBags - coldReservedBags - alreadyLinkedBags + currentTempBags);
        }

        function getPurchaseLineReleasedPools(lineRow) {
            if (!lineRow) return { qty: 0, bags: 0 };
            const pid = String(lineRow.purchaseId || '');
            const iid = String(lineRow.itemId || '');
            const pItemId = String(lineRow.purchaseItemId || '');
            return (appData.coldStorageLots || []).reduce(function(acc, lot) {
                if (String(lot.itemId || '') !== iid) return acc;
                if (String(lot.purchaseId || '') !== pid) return acc;
                if (pItemId && String(lot.purchaseItemId || '') !== pItemId) return acc;
                acc.qty += Math.max(0, parseFloat(lot.releaseQtyTotal) || 0);
                acc.bags += Math.max(0, parseFloat(lot.releaseBagsTotal) || 0);
                return acc;
            }, { qty: 0, bags: 0 });
        }

        function getPurchaseLineSourceBuckets(lineRow, currentEditingSaleId, currentTempLinks) {
            const availableQty = getPurchaseLineAvailableQty(lineRow, currentEditingSaleId, currentTempLinks);
            const availableBags = getPurchaseLineAvailableBags(lineRow, currentEditingSaleId, currentTempLinks);
            const pools = getPurchaseLineReleasedPools(lineRow);
            const coldReleasedQty = Math.max(0, Math.min(availableQty, pools.qty));
            const coldReleasedBags = Math.max(0, Math.min(availableBags, pools.bags));
            const normalQty = Math.max(0, availableQty - coldReleasedQty);
            const normalBags = Math.max(0, availableBags - coldReleasedBags);
            return {
                availableQty: availableQty,
                availableBags: availableBags,
                coldReleasedQty: coldReleasedQty,
                coldReleasedBags: coldReleasedBags,
                normalQty: normalQty,
                normalBags: normalBags
            };
        }

        function getPurchaseItemAvailableQty(purchaseId, itemId, currentEditingSaleId, currentTempLinks) {
            const purchaseLineRows = getPurchaseLineRows(itemId).filter(function(row) {
                return String(row.purchaseId) === String(purchaseId) && String(row.itemId) === String(itemId);
            });
            return purchaseLineRows.reduce(function(sum, row) {
                return sum + getPurchaseLineAvailableQty(row, currentEditingSaleId, currentTempLinks);
            }, 0);
        }

        function getPurchaseItemColdReservedQty(purchaseId, itemId) {
            const targetPurchaseId = String(purchaseId);
            const targetItemId = String(itemId);

            function activeQtyInColdLot(lot) {
                if (!lot || String(lot.itemId) !== targetItemId) return 0;
                if ((lot.status || 'active') === 'released') return 0;
                return Math.max(0, parseFloat(lot.qtyInCold) || 0);
            }

            let fromLots = 0;
            let explicitColdOnItem = 0;
            (appData.coldStorageLots || []).forEach(function(lot) {
                const q = activeQtyInColdLot(lot);
                if (q <= 0) return;
                const pid = lot.purchaseId;
                if (pid != null && String(pid) !== '') {
                    explicitColdOnItem += q;
                    if (String(pid) === targetPurchaseId) {
                        fromLots += q;
                    }
                }
            });

            const activeColdQty = getActiveColdQtyByItem(targetItemId);
            const unattributedCold = Math.max(0, activeColdQty - explicitColdOnItem);

            if (unattributedCold <= 0.0001) {
                return Math.max(0, fromLots);
            }

            const purchaseItemRows = [];
            (appData.purchases || []).forEach(function(purchase) {
                (purchase.items || []).forEach(function(pItem) {
                    if (String(pItem.itemId) !== targetItemId) return;
                    purchaseItemRows.push({
                        purchaseId: String(purchase.id),
                        date: purchase.date || '',
                        qty: Math.max(0, parseFloat(pItem.grossWeight ?? pItem.quantity ?? pItem.netWeight ?? 0) || 0)
                    });
                });
            });
            purchaseItemRows.sort(function(a, b) {
                const cmp = String(a.date).localeCompare(String(b.date));
                if (cmp !== 0) return cmp;
                return String(a.purchaseId).localeCompare(String(b.purchaseId));
            });

            let remaining = unattributedCold;
            const reservedByPurchase = {};
            purchaseItemRows.forEach(function(row) {
                if (remaining <= 0 || row.qty <= 0) return;
                const used = Math.min(row.qty, remaining);
                remaining -= used;
                reservedByPurchase[row.purchaseId] = (reservedByPurchase[row.purchaseId] || 0) + used;
            });
            return Math.max(0, fromLots + (reservedByPurchase[targetPurchaseId] || 0));
        }

        function showPurchaseLinkingModal() {
            const container = document.getElementById('availablePurchasesList');
            container.innerHTML = '';
            const currentEditingSaleId = (editingSaleId !== null && editingSaleId !== undefined) ? String(editingSaleId) : null;
            tempLinkedPurchases = normalizeLinkedPurchasesForItems(linkedPurchases, currentSaleItems);

            function getExistingQtyForLine(lineRow) {
                return tempLinkedPurchases.reduce(function(sum, lp) {
                    if (String(lp.purchaseId) !== String(lineRow.purchaseId)) return sum;
                    if (String(lp.itemId) !== String(lineRow.itemId)) return sum;
                    if (String(lineRow.purchaseItemId || '') && String(lp.purchaseItemId || '') !== String(lineRow.purchaseItemId || '')) return sum;
                    return sum + getLinkedQtyValue(lp);
                }, 0);
            }

            function getExistingBagsForLine(lineRow) {
                return tempLinkedPurchases.reduce(function(sum, lp) {
                    if (String(lp.purchaseId) !== String(lineRow.purchaseId)) return sum;
                    if (String(lp.itemId) !== String(lineRow.itemId)) return sum;
                    if (String(lineRow.purchaseItemId || '') && String(lp.purchaseItemId || '') !== String(lineRow.purchaseItemId || '')) return sum;
                    return sum + getLinkedBagsValue(lp);
                }, 0);
            }

            function renderLineRow(lineRow, inputId) {
                const purchase = lineRow.purchase;
                const sourceBuckets = getPurchaseLineSourceBuckets(lineRow, currentEditingSaleId, tempLinkedPurchases);
                const availableQty = sourceBuckets.availableQty;
                const availableBags = sourceBuckets.availableBags;
                const existingQty = getExistingQtyForLine(lineRow);
                const existingBags = getExistingBagsForLine(lineRow);
                if (availableQty <= 0.0001 && existingQty <= 0.0001) return '';
                return `
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end py-2 border-b border-slate-100">
                        <div class="md:col-span-2">
                            <div class="font-medium text-slate-800">Invoice: ${escapeHtml(purchase.invoice)} | Supplier: ${escapeHtml(purchase.supplierName)}</div>
                            <div class="text-sm text-slate-600">Item: ${escapeHtml(lineRow.itemName)} | Kaanta Parchi: ${escapeHtml(lineRow.kaantaParchi || '-')}</div>
                            <div class="text-xs text-slate-500">Gross: ${lineRow.grossWeight.toFixed(2)} kg | Bags: ${lineRow.bags.toFixed(2)} | Net: ${lineRow.netWeight.toFixed(2)} kg</div>
                            <div class="text-sm ${availableQty > 0 ? 'text-green-600' : 'text-red-600'}">Available Quantity: ${availableQty.toFixed(2)} kg | Available Bags: ${availableBags.toFixed(2)}</div>
                            <div class="text-xs text-slate-600 mt-1">Normal: ${sourceBuckets.normalQty.toFixed(2)} kg / ${sourceBuckets.normalBags.toFixed(2)} bags | Cold Released: ${sourceBuckets.coldReleasedQty.toFixed(2)} kg / ${sourceBuckets.coldReleasedBags.toFixed(2)} bags</div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-xs text-slate-600 mb-1">Weight to be added (kg)</label>
                            <input type="number" id="${inputId}" data-purchase-id="${purchase.id}" data-item-id="${lineRow.itemId}" data-purchase-item-id="${lineRow.purchaseItemId || ''}" data-line-key="${lineRow.lineKey}" value="${existingQty > 0 ? existingQty.toFixed(2) : ''}" min="0" max="${availableQty.toFixed(2)}" step="0.01" oninput="enforcePurchaseLinkInputLimit(this)" class="link-item-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00">
                            <label class="block text-xs text-slate-600 mt-2 mb-1">Bags to use from this purchase line</label>
                            <input type="number" id="${inputId}_bags" data-line-key="${lineRow.lineKey}" value="${existingBags > 0 ? existingBags.toFixed(2) : ''}" min="0" max="${availableBags.toFixed(2)}" step="0.01" oninput="enforcePurchaseLinkInputLimit(this)" class="link-bags-input w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0.00">
                        </div>
                    </div>
                `;
            }

            // Allow linking before adding sale items: show all purchase items.
            if (!currentSaleItems || currentSaleItems.length === 0) {
                let rows = 0;
                const purchaseLineRows = getPurchaseLineRows();
                purchaseLineRows.forEach(function(lineRow, rowIdx) {
                    const inputId = 'link_pre_' + lineRow.purchaseId + '_' + lineRow.itemId + '_' + rowIdx;
                    const rowHtml = renderLineRow(lineRow, inputId);
                    if (!rowHtml) return;
                    const div = document.createElement('div');
                    div.className = 'border border-slate-300 rounded-lg p-4 bg-white';
                    div.innerHTML = rowHtml;
                    container.appendChild(div);
                    rows++;
                });
                if (rows === 0) {
                    container.innerHTML = '<p class="text-slate-500 text-center py-4">No purchase items available for linking.</p>';
                }
                document.getElementById('purchaseLinkingModal').classList.remove('hidden');
                refreshPurchaseLinkingLiveTotals();
                return;
            }

            currentSaleItems.forEach(function(saleItem, saleIdx) {
                const saleItemId = String(saleItem.itemId);
                const requiredQty = parseFloat(saleItem.grossWeight ?? saleItem.quantity ?? 0) || 0;
                const linkedQtyForItem = tempLinkedPurchases.reduce(function(sum, lp) {
                    return String(lp.itemId) === saleItemId ? sum + getLinkedQtyValue(lp) : sum;
                }, 0);
                const wrapper = document.createElement('div');
                wrapper.className = 'border border-slate-300 rounded-lg p-4 bg-white';
                const lines = [];
                lines.push('<div class="mb-3 pb-2 border-b border-slate-200">');
                lines.push('<div class="font-semibold text-slate-800">Sale Item: ' + escapeHtml(saleItem.itemName) + '</div>');
                lines.push('<div class="text-sm text-slate-600">Required Gross Qty: ' + requiredQty.toFixed(2) + ' kg | Linked: ' + linkedQtyForItem.toFixed(2) + ' kg</div>');
                lines.push('</div>');
                let matchedRows = 0;
                const saleLineRows = getPurchaseLineRows(saleItemId);
                saleLineRows.forEach(function(lineRow) {
                    const rowInputId = 'link_qty_' + saleIdx + '_' + lineRow.purchaseId + '_' + saleItemId + '_' + matchedRows;
                    const rowHtml = renderLineRow(lineRow, rowInputId);
                    if (!rowHtml) return;
                    matchedRows++;
                    lines.push(rowHtml);
                });
                if (matchedRows === 0) lines.push('<div class="text-sm text-red-600">No purchase with available quantity for this sale item.</div>');
                wrapper.innerHTML = lines.join('');
                container.appendChild(wrapper);
            });
            document.getElementById('purchaseLinkingModal').classList.remove('hidden');
            refreshPurchaseLinkingLiveTotals();
        }

        function refreshPurchaseLinkingLiveTotals() {
            const qtyEl = document.getElementById('purchaseLinkingLiveTotalQty');
            const bagsEl = document.getElementById('purchaseLinkingLiveTotalBags');
            const itemsSummaryEl = document.getElementById('purchaseLinkingLiveItemsSummary');
            if (!qtyEl || !bagsEl) return;
            let totalQty = 0;
            let totalBags = 0;
            const byItem = {};
            const itemOrder = [];
            const qtyInputs = Array.from(document.querySelectorAll('#availablePurchasesList .link-item-input'));
            qtyInputs.forEach(function(input) {
                const qtyVal = Math.max(0, parseFloat(input.value) || 0);
                const bagsInput = document.getElementById(input.id + '_bags');
                const bagsVal = Math.max(0, parseFloat(bagsInput && bagsInput.value) || 0);
                totalQty += qtyVal;
                totalBags += bagsVal;
                const itemId = String(input.getAttribute('data-item-id') || '');
                if (!itemId) return;
                if (!byItem[itemId]) {
                    byItem[itemId] = { qty: 0, bags: 0 };
                    itemOrder.push(itemId);
                }
                byItem[itemId].qty += qtyVal;
                byItem[itemId].bags += bagsVal;
            });
            qtyEl.textContent = totalQty.toFixed(2);
            bagsEl.textContent = totalBags.toFixed(2);
            if (itemsSummaryEl) {
                const parts = itemOrder.map(function(itemId) {
                    const vals = byItem[itemId];
                    const qty = Math.max(0, vals && vals.qty || 0);
                    const bags = Math.max(0, vals && vals.bags || 0);
                    if (qty <= 0.0001 && bags <= 0.0001) return '';
                    const itemObj = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
                    const itemName = itemObj ? itemObj.name : itemId;
                    return itemName + ': ' + qty.toFixed(2) + ' kg, ' + bags.toFixed(2) + ' bags';
                }).filter(Boolean);
                itemsSummaryEl.textContent = parts.length ? ('Items: ' + parts.join(' | ')) : 'Items: -';
            }
        }

        function resetPurchaseLinkingLiveTotals() {
            const qtyEl = document.getElementById('purchaseLinkingLiveTotalQty');
            const bagsEl = document.getElementById('purchaseLinkingLiveTotalBags');
            const itemsSummaryEl = document.getElementById('purchaseLinkingLiveItemsSummary');
            if (qtyEl) qtyEl.textContent = '0.00';
            if (bagsEl) bagsEl.textContent = '0.00';
            if (itemsSummaryEl) itemsSummaryEl.textContent = 'Items: -';
        }

        function enforcePurchaseLinkInputLimit(inputEl) {
            if (!inputEl) return;
            const raw = (inputEl.value || '').trim();
            if (raw === '') {
                refreshPurchaseLinkingLiveTotals();
                return;
            }
            let val = parseFloat(raw);
            if (isNaN(val)) {
                inputEl.value = '';
                refreshPurchaseLinkingLiveTotals();
                return;
            }
            const min = parseFloat(inputEl.min);
            const max = parseFloat(inputEl.max);
            if (!isNaN(min) && val < min) val = min;
            if (!isNaN(max) && val > max) val = max;
            inputEl.value = String(val);
            refreshPurchaseLinkingLiveTotals();
        }

        function applyLinkedQuantitiesToSaleItems(links) {
            const groupedRows = {};
            currentSaleItems.forEach(function(row, idx) {
                const itemId = String(row.itemId);
                if (!groupedRows[itemId]) groupedRows[itemId] = [];
                groupedRows[itemId].push({ idx: idx, row: row });
            });
            Object.keys(groupedRows).forEach(function(itemId) {
                const rows = groupedRows[itemId];
                const linkedQty = (links || []).reduce(function(sum, lp) {
                    return String(lp.itemId) === itemId ? sum + getLinkedQtyValue(lp) : sum;
                }, 0);
                const linkedBags = (links || []).reduce(function(sum, lp) {
                    return String(lp.itemId) === itemId ? sum + getLinkedBagsValue(lp) : sum;
                }, 0);
                if (linkedQty <= 0) return;
                const oldTotal = rows.reduce(function(sum, r) { return sum + (parseFloat(r.row.grossWeight) || 0); }, 0);
                let assigned = 0;
                let assignedBags = 0;
                rows.forEach(function(r, i) {
                    const oldGross = parseFloat(r.row.grossWeight) || 0;
                    let newGross = 0;
                    let newBags = 0;
                    if (i === rows.length - 1) newGross = linkedQty - assigned;
                    else {
                        const ratio = oldTotal > 0 ? (oldGross / oldTotal) : (1 / rows.length);
                        newGross = +(linkedQty * ratio).toFixed(2);
                        assigned += newGross;
                    }
                    if (i === rows.length - 1) newBags = linkedBags - assignedBags;
                    else {
                        const ratioBags = oldTotal > 0 ? (oldGross / oldTotal) : (1 / rows.length);
                        newBags = +(linkedBags * ratioBags).toFixed(2);
                        assignedBags += newBags;
                    }
                    r.row.grossWeight = +Math.max(0, newGross).toFixed(2);
                    if (r.row.isCoconut) r.row.netWeight = +Math.max(0, r.row.grossWeight - (parseFloat(r.row.discountQty) || 0)).toFixed(2);
                    else {
                        const useBags = Math.max(0, +newBags.toFixed(2));
                        r.row.bags = useBags;
                        r.row.netWeight = +Math.max(0, r.row.grossWeight - useBags).toFixed(2);
                    }
                    r.row.total = +((parseFloat(r.row.netWeight) || 0) * (parseFloat(r.row.rate) || 0)).toFixed(2);
                });
            });
        }

        function buildSaleItemsFromLinks(links) {
            const byItem = {};
            (links || []).forEach(function(link) {
                const itemId = String(link.itemId || '');
                const qty = getLinkedQtyValue(link);
                if (!itemId || qty <= 0) return;
                const purchase = (appData.purchases || []).find(function(p) { return String(p.id) === String(link.purchaseId); });
                const targetPurchaseItemId = String(link.purchaseItemId || '');
                const pItem = purchase && purchase.items
                    ? purchase.items.find(function(pi) {
                        if (targetPurchaseItemId) return String(pi.id || '') === targetPurchaseItemId;
                        return String(pi.itemId) === itemId;
                    })
                    : null;
                const grossBase = parseFloat((pItem && pItem.grossWeight) || 0) || qty;
                const isCoconutFromPurchase = !!(pItem && pItem.isCoconut);
                const pDiscountQty = parseFloat((pItem && pItem.discountQty) || 0) || 0;
                const pGross = parseFloat((pItem && pItem.grossWeight) || 0) || 0;
                const pNet = parseFloat((pItem && pItem.netWeight) || 0) || 0;
                const pGrossMinusNet = Math.max(0, pGross - pNet);
                const pBags = parseFloat((pItem && pItem.bags) || 0) || 0;
                const nonCoconutDiscount = pBags > 0 ? pBags : pGrossMinusNet;
                const coconutDiscount = pDiscountQty > 0 ? pDiscountQty : pGrossMinusNet;
                const nonCoconutRatio = grossBase > 0 ? (nonCoconutDiscount / grossBase) : 0;
                const coconutRatio = grossBase > 0 ? (coconutDiscount / grossBase) : 0;

                if (!byItem[itemId]) byItem[itemId] = { qty: 0, bags: 0, discountQty: 0, isCoconut: false };
                byItem[itemId].qty += qty;
                const linkedBags = getLinkedBagsValue(link);
                byItem[itemId].bags += (linkedBags > 0 ? linkedBags : (qty * nonCoconutRatio));
                byItem[itemId].discountQty += (qty * coconutRatio);
                byItem[itemId].isCoconut = byItem[itemId].isCoconut || isCoconutFromPurchase;
            });

            const generated = [];
            Object.keys(byItem).forEach(function(itemId, idx) {
                const itemMaster = (appData.items || []).find(function(i) { return String(i.id) === itemId; });
                const gross = +(byItem[itemId].qty || 0).toFixed(2);
                if (gross <= 0) return;
                const existingSaleRow = (currentSaleItems || []).find(function(r) { return String(r.itemId) === String(itemId); });
                const rate = +((existingSaleRow && existingSaleRow.rate) || 0);
                const isCoconut = byItem[itemId].isCoconut || !!(itemMaster && itemMaster.name && itemMaster.name.toLowerCase().includes('coconut'));
                const bagsVal = +Math.max(0, byItem[itemId].bags || 0).toFixed(2);
                const discountQtyVal = +Math.max(0, byItem[itemId].discountQty || 0).toFixed(2);
                const net = isCoconut
                    ? +Math.max(0, gross - discountQtyVal).toFixed(2)
                    : +Math.max(0, gross - bagsVal).toFixed(2);
                generated.push({
                    id: Date.now() + idx,
                    itemId: itemId,
                    itemName: itemMaster ? itemMaster.name : ('Item ' + itemId),
                    grossWeight: gross,
                    bags: isCoconut ? 0 : bagsVal,
                    netWeight: net,
                    discountQty: isCoconut ? discountQtyVal : 0,
                    rate: rate,
                    total: +(net * rate).toFixed(2),
                    isCoconut: isCoconut
                });
            });
            return generated;
        }

        function confirmPurchaseLinking() {
            const inputs = Array.from(document.querySelectorAll('#availablePurchasesList .link-item-input'));
            const validatedLinks = [];
            let hasValidationError = false;
            inputs.forEach(function(input) {
                if (hasValidationError) return;
                const qty = parseFloat(input.value) || 0;
                const max = parseFloat(input.max) || 0;
                const bagsInput = document.getElementById(input.id + '_bags');
                const bagsVal = bagsInput ? (parseFloat(bagsInput.value) || 0) : 0;
                const bagsMax = bagsInput ? (parseFloat(bagsInput.max) || 0) : 0;
                if (qty <= 0 && bagsVal <= 0) return;
                if (qty <= 0 && bagsVal > 0) {
                    alert('Please enter weight greater than zero when bags are entered.');
                    hasValidationError = true;
                    return;
                }
                if (qty < 0 || (max > 0 && qty - max > 0.0001)) {
                    alert('Entered weight cannot be more than available quantity.');
                    hasValidationError = true;
                    return;
                }
                if (bagsVal < 0 || (bagsMax > 0 && bagsVal - bagsMax > 0.0001)) {
                    alert('Entered bags cannot be more than available bags.');
                    hasValidationError = true;
                    return;
                }
                validatedLinks.push({
                    purchaseId: input.getAttribute('data-purchase-id'),
                    itemId: input.getAttribute('data-item-id'),
                    purchaseItemId: input.getAttribute('data-purchase-item-id') || '',
                    quantityUsed: +qty.toFixed(2),
                    bagsUsed: +bagsVal.toFixed(2)
                });
            });
            if (hasValidationError) return;

            if (!currentSaleItems || currentSaleItems.length === 0) {
                if (!validatedLinks.length) {
                    alert('Please enter at least one item quantity to link from purchases.');
                    return;
                }
                linkedPurchases = validatedLinks;
                currentSaleItems = buildSaleItemsFromLinks(validatedLinks);
                updateCurrentSaleItemsDisplay();
                calculateSaleTotals();
                updateLinkedPurchasesDisplay();
                closePurchaseLinkingModal();
                return;
            }

            const tolerance = 0.01;
            const requiredByItem = {};
            const requiredBagsByItem = {};
            currentSaleItems.forEach(function(row) {
                const itemId = String(row.itemId);
                requiredByItem[itemId] = (requiredByItem[itemId] || 0) + (parseFloat(row.grossWeight) || 0);
                requiredBagsByItem[itemId] = (requiredBagsByItem[itemId] || 0) + (parseFloat(row.bags) || 0);
            });
            const linkedByItem = {};
            const linkedBagsByItem = {};
            validatedLinks.forEach(function(lp) {
                const itemId = String(lp.itemId);
                linkedByItem[itemId] = (linkedByItem[itemId] || 0) + getLinkedQtyValue(lp);
                linkedBagsByItem[itemId] = (linkedBagsByItem[itemId] || 0) + getLinkedBagsValue(lp);
            });
            for (const itemId in requiredByItem) {
                const req = requiredByItem[itemId] || 0;
                const lnk = linkedByItem[itemId] || 0;
                if (Math.abs(req - lnk) > tolerance) {
                    const itemObj = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
                    const name = itemObj ? itemObj.name : itemId;
                    alert('Purchase linking is compulsory item-wise. Item "' + name + '" requires ' + req.toFixed(2) + ' kg, but linked ' + lnk.toFixed(2) + ' kg.');
                    return;
                }
                const reqBags = requiredBagsByItem[itemId] || 0;
                const lnkBags = linkedBagsByItem[itemId] || 0;
                if (Math.abs(reqBags - lnkBags) > tolerance) {
                    const itemObj = (appData.items || []).find(function(i) { return String(i.id) === String(itemId); });
                    const name = itemObj ? itemObj.name : itemId;
                    alert('Purchase linking bags are compulsory item-wise. Item "' + name + '" requires ' + reqBags.toFixed(2) + ' bags, but linked ' + lnkBags.toFixed(2) + ' bags.');
                    return;
                }
            }
            linkedPurchases = validatedLinks;
            applyLinkedQuantitiesToSaleItems(validatedLinks);
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            updateLinkedPurchasesDisplay();
            closePurchaseLinkingModal();
        }

        function updateLinkedPurchasesDisplay() {
            const container = document.getElementById('linkedPurchasesList');
            if (linkedPurchases.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-sm italic">No item-wise purchase links yet. Click "Link Purchase" to add.</p>';
                return;
            }
            container.innerHTML = '';
            linkedPurchases.forEach(function(link, idx) {
                const purchase = (appData.purchases || []).find(function(p) { return String(p.id) === String(link.purchaseId); });
                const item = (appData.items || []).find(function(i) { return String(i.id) === String(link.itemId); });
                const pItem = purchase && purchase.items
                    ? purchase.items.find(function(pi) {
                        if (String(link.purchaseItemId || '')) return String(pi.id || '') === String(link.purchaseItemId || '');
                        return String(pi.itemId || '') === String(link.itemId || '');
                    })
                    : null;
                const div = document.createElement('div');
                div.className = 'flex justify-between items-center p-3 bg-white border border-blue-300 rounded-lg';
                div.innerHTML = `
                    <div class="flex-1">
                        <div class="font-medium text-slate-800">Invoice: ${escapeHtml(purchase ? purchase.invoice : link.purchaseId)} | Supplier: ${escapeHtml(purchase ? purchase.supplierName : '-')}</div>
                        <div class="text-sm text-slate-600">Item: ${escapeHtml(item ? item.name : (link.itemId || '-'))} | Kaanta Parchi: ${escapeHtml((pItem && pItem.kaantaParchi) || '-')} | Qty: ${(getLinkedQtyValue(link)).toFixed(2)} kg | Bags: ${(getLinkedBagsValue(link)).toFixed(2)}</div>
                    </div>
                    <button onclick="removePurchaseLink(${idx})" class="text-red-600 hover:text-red-800 font-bold">✖</button>
                `;
                container.appendChild(div);
            });
        }

        function removePurchaseLink(index) {
            linkedPurchases.splice(index, 1);
            updateLinkedPurchasesDisplay();
        }

        function closePurchaseLinkingModal() {
            document.getElementById('purchaseLinkingModal').classList.add('hidden');
            resetPurchaseLinkingLiveTotals();
        }

        // Deduction Transaction Linking Functions
        function showDeductionPurchaseLinkingModal() {
            const container = document.getElementById('deductionAvailablePurchasesList');
            container.innerHTML = '';
            
            if (appData.purchases.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-center py-4">No purchase invoices available</p>';
            } else {
                appData.purchases.forEach(purchase => {
                    const isSelected = deductionLinkedPurchase && deductionLinkedPurchase.purchaseId === purchase.id;
                    
                    const div = document.createElement('div');
                    div.className = 'border border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-orange-50 transition-colors ' + (isSelected ? 'bg-orange-100 border-orange-400' : 'bg-white');
                    div.onclick = () => selectDeductionPurchase(purchase.id);
                    
                    div.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="font-semibold text-slate-800">Invoice: ${purchase.invoice}</div>
                                <div class="text-sm text-slate-600">Date: ${purchase.date} | Supplier: ${purchase.supplierName}</div>
                                <div class="text-sm text-slate-600">Total Amount: ${RU}${(purchase.grandTotal || purchase.total || 0).toFixed(2)}</div>
                            </div>
                            ${isSelected ? '<div class="text-orange-600 font-bold text-2xl">' + CHECK + '</div>' : ''}
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
            
            document.getElementById('deductionPurchaseLinkingModal').classList.remove('hidden');
        }

        let tempDeductionPurchase = null;

        function selectDeductionPurchase(purchaseId) {
            tempDeductionPurchase = purchaseId;
            // Refresh display to show selection
            showDeductionPurchaseLinkingModal();
        }

        function confirmDeductionPurchaseLinking() {
            if (tempDeductionPurchase) {
                const purchase = appData.purchases.find(p => p.id === tempDeductionPurchase);
                deductionLinkedPurchase = {
                    purchaseId: purchase.id,
                    invoice: purchase.invoice,
                    supplier: purchase.supplierName,
                    amount: purchase.grandTotal || purchase.total || 0
                };
                updateDeductionLinkedTransactionsDisplay();
            }
            closeDeductionPurchaseLinkingModal();
        }

        function closeDeductionPurchaseLinkingModal() {
            document.getElementById('deductionPurchaseLinkingModal').classList.add('hidden');
            tempDeductionPurchase = null;
        }

        function showDeductionSaleLinkingModal() {
            const container = document.getElementById('deductionAvailableSalesList');
            container.innerHTML = '';
            
            if (appData.sales.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-center py-4">No sale invoices available</p>';
            } else {
                appData.sales.forEach(sale => {
                    const isSelected = deductionLinkedSale && deductionLinkedSale.saleId === sale.id;
                    
                    const div = document.createElement('div');
                    div.className = 'border border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-blue-50 transition-colors ' + (isSelected ? 'bg-blue-100 border-blue-400' : 'bg-white');
                    div.onclick = () => selectDeductionSale(sale.id);
                    
                    div.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="font-semibold text-slate-800">Invoice: ${sale.invoice}</div>
                                <div class="text-sm text-slate-600">Date: ${sale.date} | Customer: ${sale.customerName}</div>
                                <div class="text-sm text-slate-600">Total Amount: ${RU}${(sale.grandTotal || sale.total || 0).toFixed(2)}</div>
                            </div>
                            ${isSelected ? '<div class="text-blue-600 font-bold text-2xl">' + CHECK + '</div>' : ''}
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
            
            document.getElementById('deductionSaleLinkingModal').classList.remove('hidden');
        }

        let tempDeductionSale = null;

        function selectDeductionSale(saleId) {
            tempDeductionSale = saleId;
            // Refresh display to show selection
            showDeductionSaleLinkingModal();
        }

        function confirmDeductionSaleLinking() {
            if (tempDeductionSale) {
                const sale = appData.sales.find(s => s.id === tempDeductionSale);
                deductionLinkedSale = {
                    saleId: sale.id,
                    invoice: sale.invoice,
                    customer: sale.customerName,
                    amount: sale.grandTotal || sale.total || 0
                };
                updateDeductionLinkedTransactionsDisplay();
            }
            closeDeductionSaleLinkingModal();
        }

        function closeDeductionSaleLinkingModal() {
            document.getElementById('deductionSaleLinkingModal').classList.add('hidden');
            tempDeductionSale = null;
        }

        function updateDeductionLinkedTransactionsDisplay() {
            const container = document.getElementById('deductionLinkedTransactionsList');
            
            if (!deductionLinkedPurchase && !deductionLinkedSale) {
                container.innerHTML = '<p class="text-slate-500 text-sm italic">No transactions linked yet.</p>';
            } else {
                container.innerHTML = '';
                
                if (deductionLinkedPurchase) {
                    const div = document.createElement('div');
                    div.className = 'flex justify-between items-center p-3 bg-white border border-orange-300 rounded-lg';
                    div.innerHTML = `
                        <div class="flex-1">
                            <div class="font-medium text-slate-800">Purchase: ${escapeHtml(deductionLinkedPurchase.invoice)}</div>
                            <div class="text-sm text-slate-600">Supplier: ${deductionLinkedPurchase.supplier} | Amount: ${RU}${deductionLinkedPurchase.amount.toFixed(2)}</div>
                        </div>
                        <button onclick="removeDeductionPurchaseLink()" class="text-red-600 hover:text-red-800 font-bold">\u2716</button>
                    `;
                    container.appendChild(div);
                }
                
                if (deductionLinkedSale) {
                    const div = document.createElement('div');
                    div.className = 'flex justify-between items-center p-3 bg-white border border-blue-300 rounded-lg';
                    div.innerHTML = `
                        <div class="flex-1">
                            <div class="font-medium text-slate-800">Sale: ${escapeHtml(deductionLinkedSale.invoice)}</div>
                            <div class="text-sm text-slate-600">Customer: ${deductionLinkedSale.customer} | Amount: ${RU}${deductionLinkedSale.amount.toFixed(2)}</div>
                        </div>
                        <button onclick="removeDeductionSaleLink()" class="text-red-600 hover:text-red-800 font-bold">\u2716</button>
                    `;
                    container.appendChild(div);
                }
            }
        }

        function removeDeductionPurchaseLink() {
            deductionLinkedPurchase = null;
            updateDeductionLinkedTransactionsDisplay();
        }

        function removeDeductionSaleLink() {
            deductionLinkedSale = null;
            updateDeductionLinkedTransactionsDisplay();
        }

        function addSale() {
            const date = document.getElementById('saleDate').value;
            const invoice = document.getElementById('saleInvoice').value;
            const customerId = document.getElementById('saleCustomer').value;
            const itemId = document.getElementById('saleItem').value;
            const quantity = parseFloat(document.getElementById('saleQuantity').value);
            const rate = parseFloat(document.getElementById('saleRate').value);
            
            if (date && invoice && customerId && itemId && quantity && rate) {
                const invoiceTrim = (invoice || '').trim().toUpperCase();
                if (appData.sales.some(s => (s.invoice || '').trim().toUpperCase() === invoiceTrim)) {
                    alert('This Sales invoice number is already used. Please use a unique invoice number.');
                    return;
                }
                // Check if enough stock is available
                if (!appData.inventory[itemId] || getSaleAvailableQty(itemId) < quantity) {
                    alert('Insufficient stock available!');
                    return;
                }
                
                const customer = appData.customers.find(c => c.id == customerId);
                const item = appData.items.find(i => i.id == itemId);
                const total = quantity * rate;
                
                const sale = {
                    id: Date.now(),
                    date: date,
                    invoice: invoice,
                    customerId: customerId,
                    customerName: customer.name,
                    itemId: itemId,
                    itemName: item.name,
                    quantity: quantity,
                    rate: rate,
                    total: total,
                    ...getAuditMeta(true)
                };
                
                appData.sales.push(sale);
                
                // Update inventory
                appData.inventory[itemId].quantity -= quantity;
                const totalQty = appData.inventory[itemId].quantity + quantity;
                const avgCost = totalQty > 0 ? appData.inventory[itemId].totalCost / totalQty : 0;
                appData.inventory[itemId].totalCost -= (avgCost * quantity);
                
                saveData();
                updateSalesHistory();
                updateDashboard();
                populateDropdowns();
                
                // Clear form
                document.getElementById('saleDate').value = '';
                document.getElementById('saleInvoice').value = '';
                document.getElementById('saleCustomer').value = '';
                document.getElementById('saleItem').value = '';
                document.getElementById('saleQuantity').value = '';
                document.getElementById('saleRate').value = '';
                document.getElementById('saleTotal').textContent = '0';
                document.getElementById('availableStock').textContent = 'Available: 0';
                
                alert('Sale added successfully!');
            }
        }

        // Filter Sales
        function filterSales() {
            const search = (document.getElementById('salesSearch')?.value || '').toLowerCase();
            const customerId = document.getElementById('salesFilterCustomer')?.value || '';
            const dateFrom = document.getElementById('salesDateFrom')?.value || '';
            const dateTo = document.getElementById('salesDateTo')?.value || '';
            const sortBy = document.getElementById('salesSort')?.value || 'date-desc';
            
            filteredSales = appData.sales.filter(s => {
                // Search filter
                if (search) {
                    const searchFields = [s.invoice, s.customerName, s.truck || ''].join(' ').toLowerCase();
                    if (!searchFields.includes(search)) return false;
                }
                // Customer filter
                if (customerId && s.customerId != customerId) return false;
                // Date filters
                if (dateFrom && s.date < dateFrom) return false;
                if (dateTo && s.date > dateTo) return false;
                return true;
            });
            
            // Sort
            filteredSales.sort((a, b) => {
                switch(sortBy) {
                    case 'date-asc': return new Date(a.date) - new Date(b.date);
                    case 'date-desc': return new Date(b.date) - new Date(a.date);
                    case 'amount-desc': return (b.grandTotal || b.total || 0) - (a.grandTotal || a.total || 0);
                    case 'amount-asc': return (a.grandTotal || a.total || 0) - (b.grandTotal || b.total || 0);
                    case 'customer-asc': return (a.customerName || '').localeCompare(b.customerName || '');
                    case 'balance-desc': return ((b.grandTotal || 0) - (b.received || 0)) - ((a.grandTotal || 0) - (a.received || 0));
                    default: return new Date(b.date) - new Date(a.date);
                }
            });
            
            // Update count
            const countEl = document.getElementById('salesFilterCount');
            if (countEl) {
                countEl.textContent = `Showing ${filteredSales.length} of ${appData.sales.length} sales`;
            }
            
            // Reset to page 1 and render
            paginationState.sales.currentPage = 1;
            renderSalesTable();
        }
        
        function clearSalesFilters() {
            document.getElementById('salesSearch').value = '';
            document.getElementById('salesFilterCustomer').value = '';
            document.getElementById('salesDateFrom').value = '';
            document.getElementById('salesDateTo').value = '';
            document.getElementById('salesSort').value = 'date-desc';
            filterSales();
        }
        
        function renderSalesTable() {
            const tbody = document.getElementById('salesHistory');
            closeRowActionMenus();
            tbody.innerHTML = '';
            
            if (filteredSales.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="10" class="px-4 py-12 text-center">
                            <div class="flex flex-col items-center text-slate-400">
                                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <p class="font-medium">No sales found</p>
                                <p class="text-sm">Try adjusting your filters</p>
                            </div>
                        </td>
                    </tr>`;
                document.getElementById('salesPagination').innerHTML = '';
                return;
            }
            
            const { currentPage, pageSize } = paginationState.sales;
            const paginatedSales = getPaginatedData(filteredSales, currentPage, pageSize);
            
            paginatedSales.forEach((sale, index) => {
                const itemsCount = sale.items ? sale.items.length : 1;
                const itemsText = sale.items ? `${itemsCount} item${itemsCount > 1 ? 's' : ''}` : sale.itemName || 'N/A';
                const grandTotal = sale.grandTotal || sale.total || 0;
                const received = sale.received || 0;
                const currentBalance = grandTotal - received;
                sale.balance = currentBalance;
                const saleDateText = summarizeMultiValue(sale.multiDates || [sale.date], sale.date || '-');
                const saleTruckText = summarizeMultiValue(sale.multiTrucks || [sale.truck], sale.truck || '-');
                const linkedRows = normalizeLinkedPurchasesForItems((sale && sale.linkedPurchases) ? sale.linkedPurchases : [], sale.items || []);
                const linkedPurchaseMap = {};
                linkedRows.forEach(function(lp) {
                    const purchase = (appData.purchases || []).find(function(p) { return String(p.id) === String(lp.purchaseId); });
                    const invoice = purchase ? (purchase.invoice || lp.purchaseId) : (lp.purchaseId || '-');
                    const key = String(invoice);
                    if (!linkedPurchaseMap[key]) linkedPurchaseMap[key] = { invoice: invoice, qty: 0, bags: 0 };
                    linkedPurchaseMap[key].qty += getLinkedQtyValue(lp);
                    linkedPurchaseMap[key].bags += getLinkedBagsValue(lp);
                });
                const linkedPurchaseGroups = Object.values(linkedPurchaseMap);
                const linkedPurchaseDetailsHtml = linkedPurchaseGroups.length
                    ? linkedPurchaseGroups.map(function(row) {
                        return `<div class="mb-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800">
                            <div class="font-semibold">${escapeHtml(row.invoice)}</div>
                            <div>Qty: ${Number(row.qty || 0).toFixed(2)} kg | Bags: ${Number(row.bags || 0).toFixed(2)}</div>
                        </div>`;
                    }).join('')
                    : '<span class="text-xs text-slate-400">-</span>';
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-green-50/50 transition-colors align-top';
                row.innerHTML = `
                    <td class="px-4 py-3.5 text-sm whitespace-nowrap">
                        <span class="text-slate-600 font-medium">${escapeHtml(saleDateText)}</span>
                    </td>
                    <td class="px-4 py-3.5 whitespace-nowrap">
                        <span class="font-mono text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">${sale.masterInvoice || sale.invoice}</span>
                    </td>
                    <td class="px-4 py-3.5">
                        <span class="font-medium text-slate-700 text-sm">${escapeHtml(sale.customerName)}</span>
                    </td>
                    <td class="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">${escapeHtml(saleTruckText)}</td>
                    <td class="px-4 py-3.5">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            ${itemsText}
                        </span>
                    </td>
                    <td class="px-4 py-3.5 min-w-[220px]">
                        ${linkedPurchaseDetailsHtml}
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="font-semibold text-slate-800">${RU}${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="text-green-600 font-medium">${RU}${received.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3.5 text-right whitespace-nowrap">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${currentBalance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
                            ${currentBalance > 0 ? RU + currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : 'Received ' + CHECK}
                        </span>
                    </td>
                    <td class="px-4 py-3.5">
                        <div class="flex items-center justify-center gap-1.5">
                            <button onclick="viewSale(${sale.id})" class="action-btn action-view" title="View"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg></button>
                            <button onclick="editSale(${sale.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="printSaleInvoice(${sale.id})" class="action-btn action-print" title="Print Invoice"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg></button>
                            <div class="relative row-action-menu-wrap">
                                <button type="button" onclick="toggleRowActionMenu(event, 'sale-${sale.id}')" class="action-btn row-action-more-btn" title="More actions" aria-haspopup="true" aria-expanded="false">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/></svg>
                                </button>
                                <div class="row-action-menu hidden absolute right-0 top-9 z-[90] min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg py-1">
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); downloadSaleInvoiceWithLedgerJpg(${sale.id});">Download Invoice + Ledger JPG</button>
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); sendSaleWhatsApp(${sale.id});">Send WhatsApp</button>
                                    <button type="button" class="row-action-menu-item" onclick="closeRowActionMenus(); receiveSale(${sale.id});">Receive Payment</button>
                                    <button type="button" class="row-action-menu-item row-action-menu-item-danger" onclick="closeRowActionMenus(); deleteSale(${sale.id});">Delete</button>
                                </div>
                            </div>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            renderPagination('salesPagination', filteredSales.length, currentPage, pageSize, 'changeSalesPage', 'changeSalesPageSize');
        }
        
        function updateSalesHistory() {
            populateFilterDropdowns();
            filteredSales = [...appData.sales];
            filterSales();
            
            // Update summary stats
            const totalCount = appData.sales.length;
            const totalAmount = appData.sales.reduce((sum, s) => sum + (s.grandTotal || s.total || 0), 0);
            const totalReceived = appData.sales.reduce((sum, s) => {
                const payments = appData.payments.filter(pay => pay.type === 'sale' && pay.invoiceId === s.id);
                return sum + payments.reduce((r, pay) => r + pay.amount, 0);
            }, 0);
            const pendingAmount = totalAmount - totalReceived;
            
            const countEl = document.getElementById('salesTotalCount');
            const amountEl = document.getElementById('salesTotalAmount');
            const pendingEl = document.getElementById('salesPendingAmount');
            
            if (countEl) countEl.textContent = totalCount;
            if (amountEl) amountEl.textContent = `${RU}${(totalAmount/1000).toFixed(0)}K`;
            if (pendingEl) pendingEl.textContent = `${RU}${(pendingAmount/1000).toFixed(0)}K`;
        }

        // Brokerage functions
        function updateBrokerageInvoices() {
            const type = document.getElementById('brokerageType').value;
            const referenceSelect = document.getElementById('brokerageReference');
            
            referenceSelect.innerHTML = '<option value="">Select Invoice</option>';
            
            if (type === 'Purchase') {
                appData.purchases.forEach(purchase => {
                    referenceSelect.innerHTML += `<option value="${purchase.invoice}">${purchase.invoice} - ${purchase.supplierName}</option>`;
                });
            } else if (type === 'Sale') {
                appData.sales.forEach(sale => {
                    referenceSelect.innerHTML += `<option value="${sale.invoice}">${sale.invoice} - ${sale.customerName}</option>`;
                });
            }
        }

        function addBrokerage() {
            const date = document.getElementById('brokerageDate').value;
            const brokerId = document.getElementById('brokeragebroker').value;
            const itemId = document.getElementById('brokerageItem').value;
            const type = document.getElementById('brokerageType').value;
            const amount = parseFloat(document.getElementById('brokerageAmount').value);
            const reference = document.getElementById('brokerageReference').value;
            
            if (date && brokerId && itemId && type && amount) {
                const broker = appData.brokers.find(b => b.id == brokerId);
                const item = appData.items.find(i => i.id == itemId);
                
                const brokerage = {
                    id: Date.now(),
                    date: date,
                    brokerId: brokerId,
                    brokerName: broker.name,
                    itemId: itemId,
                    itemName: item.name,
                    type: type,
                    amount: amount,
                    reference: reference
                };
                
                appData.brokerage.push(brokerage);
                saveData();
                updateBrokerageHistory();
                
                // Regenerate ledger if on ledger page to show new entry immediately
                if (typeof generateLedger === 'function') {
                    generateLedger();
                }
                
                // Clear form
                document.getElementById('brokerageDate').value = '';
                document.getElementById('brokeragebroker').value = '';
                document.getElementById('brokerageItem').value = '';
                document.getElementById('brokerageType').value = '';
                document.getElementById('brokerageAmount').value = '';
                document.getElementById('brokerageReference').value = '';
                
                alert('Brokerage entry added successfully!');
            }
        }

        // Filter Brokerage
        function filterBrokerage() {
            const search = (document.getElementById('brokerageSearch')?.value || '').toLowerCase();
            const brokerId = document.getElementById('brokerageFilterBroker')?.value || '';
            const type = document.getElementById('brokerageFilterType')?.value || '';
            const dateFrom = document.getElementById('brokerageDateFrom')?.value || '';
            const sortBy = document.getElementById('brokerageSort')?.value || 'date-desc';
            
            filteredBrokerage = appData.brokerage.filter(b => {
                // Search filter
                if (search) {
                    const searchFields = [b.brokerName, b.itemName, b.reference || ''].join(' ').toLowerCase();
                    if (!searchFields.includes(search)) return false;
                }
                // Broker filter
                if (brokerId && b.brokerId != brokerId) return false;
                // Type filter
                if (type && b.type?.toLowerCase() !== type.toLowerCase()) return false;
                // Date filter
                if (dateFrom && b.date < dateFrom) return false;
                return true;
            });
            
            // Sort
            filteredBrokerage.sort((a, b) => {
                switch(sortBy) {
                    case 'date-asc': return new Date(a.date) - new Date(b.date);
                    case 'date-desc': return new Date(b.date) - new Date(a.date);
                    case 'amount-desc': return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
                    case 'amount-asc': return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
                    case 'broker-asc': return (a.brokerName || '').localeCompare(b.brokerName || '');
                    default: return new Date(b.date) - new Date(a.date);
                }
            });
            
            // Update count
            const countEl = document.getElementById('brokerageFilterCount');
            if (countEl) {
                countEl.textContent = `Showing ${filteredBrokerage.length} of ${appData.brokerage.length} entries`;
            }
            
            paginationState.brokerage.currentPage = 1;
            renderBrokerageTable();
        }
        
        function clearBrokerageFilters() {
            document.getElementById('brokerageSearch').value = '';
            document.getElementById('brokerageFilterBroker').value = '';
            document.getElementById('brokerageFilterType').value = '';
            document.getElementById('brokerageDateFrom').value = '';
            document.getElementById('brokerageSort').value = 'date-desc';
            filterBrokerage();
        }
        
        function renderBrokerageTable() {
            const tbody = document.getElementById('brokerageHistory');
            tbody.innerHTML = '';
            
            if (filteredBrokerage.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No brokerage entries found</td></tr>';
                document.getElementById('brokeragePagination').innerHTML = '';
                return;
            }
            
            const { currentPage, pageSize } = paginationState.brokerage;
            const paginatedBrokerage = getPaginatedData(filteredBrokerage, currentPage, pageSize);
            
            paginatedBrokerage.forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-200 hover:bg-slate-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${entry.date}</td>
                    <td class="px-4 py-3">${entry.brokerName}</td>
                    <td class="px-4 py-3">${entry.itemName}</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full ${entry.type === 'Purchase' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}">${entry.type}</span></td>
                    <td class="px-4 py-3">${RU}${entry.amount}</td>
                    <td class="px-4 py-3">${entry.reference}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1">
                            <button onclick="printBrokerageEntry(${entry.id})" class="action-btn action-print" title="Print"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg></button>
                            <button onclick="editBrokerage(${entry.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="payBrokerage(${entry.id})" class="action-btn action-pay" title="Pay"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2H6V3zm0 4h12v2h-4.5c-.83 2.07-2.6 3.56-4.74 3.94L14 21h-2.5l-5.24-8H6v-2h4.5c1.38 0 2.56-.8 3.12-1.94L6 9V7z"/></svg></button>
                            <button onclick="deleteBrokerage(${entry.id})" class="action-btn action-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            renderPagination('brokeragePagination', filteredBrokerage.length, currentPage, pageSize, 'changeBrokeragePage', 'changeBrokeragePageSize');
        }
        
        function updateBrokerageHistory() {
            populateFilterDropdowns();
            filteredBrokerage = [...appData.brokerage];
            filterBrokerage();
        }

        // Brokerage action functions
        function printBrokerageEntry(brokerageId) {
            const entry = appData.brokerage.find(b => b.id === brokerageId);
            if (!entry) return;
            
            const printWindow = window.open('', '_blank');
            const company = appData.company;
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Brokerage Entry - ${entry.reference}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .details { margin-bottom: 20px; }
                        .font-bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${company.name || 'ITCO Trade Management'}</h1>
                        <h2>BROKERAGE ENTRY</h2></div>
                    </div>
                    
                    <div class="details">
                        <p><strong>Date:</strong> ${entry.date}</p>
                        <p><strong>Broker:</strong> ${entry.brokerName}</p>
                        <p><strong>Item:</strong> ${entry.itemName}</p>
                        <p><strong>Type:</strong> ${entry.type}</p>
                        <p><strong>Amount:</strong> ${RU}${entry.amount}</p>
                        <p><strong>Reference Invoice:</strong> ${entry.reference}</p>
                    </div>
                </body>
                </html>
            `);
            
            printWindow.document.close();
            printWindow.print();
        }

        function editBrokerage(brokerageId) {
            const entry = appData.brokerage.find(b => b.id === brokerageId);
            if (!entry) return;
            
            document.getElementById('brokerageDate').value = entry.date;
            document.getElementById('brokeragebroker').value = entry.brokerId;
            document.getElementById('brokerageItem').value = entry.itemId;
            document.getElementById('brokerageType').value = entry.type;
            document.getElementById('brokerageAmount').value = entry.amount;
            
            // Update invoice dropdown and select the reference
            updateBrokerageInvoices();
            setTimeout(() => {
                document.getElementById('brokerageReference').value = entry.reference;
            }, 100);
            
            // Remove the old entry
            appData.brokerage = appData.brokerage.filter(b => b.id !== brokerageId);
            updateBrokerageHistory();
            
            showPage('broker');
            alert('Brokerage entry loaded for editing. Make changes and save to update.');
        }

        function payBrokerage(brokerageId) {
            const entry = appData.brokerage.find(b => b.id === brokerageId);
            if (!entry) return;
            
            currentPaymentData = {
                type: 'brokerage',
                id: brokerageId,
                invoice: entry.reference,
                party: entry.brokerName,
                balance: entry.amount
            };
            
            document.getElementById('paymentModalTitle').textContent = 'Pay Brokerage to Broker';
            document.getElementById('balanceDisplay').textContent = `Amount: ${RU}${entry.amount.toFixed(2)}`;
            document.getElementById('paymentAmount').value = entry.amount;
            document.getElementById('paymentMode').value = '';
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) paymentModeEl.onchange = onPaymentModeChange;
            populatePaymentBankAccounts();
            const paymentBankAccountEl = document.getElementById('paymentBankAccount');
            if (paymentBankAccountEl) paymentBankAccountEl.value = '';
            onPaymentModeChange();
            document.getElementById('paidThrough').value = '';
            document.getElementById('paymentRemarks').value = '';
            setPaymentModalDefaultDate();
            
            document.getElementById('paymentModal').classList.remove('hidden');
        }

        function deleteBrokerage(brokerageId) {
            if (confirm('Are you sure you want to delete this brokerage entry?')) {
                appData.brokerage = appData.brokerage.filter(b => b.id !== brokerageId);
                saveData();
                updateBrokerageHistory();
                alert('Brokerage entry deleted successfully!');
            }
        }

        // Adjustment fields function
        function showAdjustmentFields() {
            const adjustmentType = document.getElementById('adjustmentType').value;
            const adjustmentFields = document.getElementById('adjustmentFields');
            const splitAdjustmentFields = document.getElementById('splitAdjustmentFields');
            const adjustmentEntityLabel = document.getElementById('adjustmentEntityLabel');
            const adjustmentEntity = document.getElementById('adjustmentEntity');
            const adjustmentAmountHelp = document.getElementById('adjustmentAmountHelp');
            
            // Hide all fields first
            adjustmentFields.style.display = 'none';
            splitAdjustmentFields.style.display = 'none';
            
            if (adjustmentType === 'Supplier' || adjustmentType === 'Broker') {
                adjustmentFields.style.display = 'grid';
                
                if (adjustmentType === 'Supplier') {
                    adjustmentEntityLabel.textContent = 'Select Supplier';
                    adjustmentEntity.innerHTML = '<option value="">Select Supplier</option>';
                    appData.suppliers.forEach(supplier => {
                        adjustmentEntity.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
                    });
                    adjustmentAmountHelp.textContent = 'Amount to adjust with supplier';
                } else if (adjustmentType === 'Broker') {
                    adjustmentEntityLabel.textContent = 'Select Broker';
                    adjustmentEntity.innerHTML = '<option value="">Select Broker</option>';
                    appData.brokers.forEach(broker => {
                        adjustmentEntity.innerHTML += `<option value="${broker.id}">${broker.name}</option>`;
                    });
                    adjustmentAmountHelp.textContent = 'Amount to adjust with broker';
                }
            } else if (adjustmentType === 'Split') {
                splitAdjustmentFields.style.display = 'grid';
                
                // Populate broker dropdown
                const splitBroker = document.getElementById('splitBroker');
                splitBroker.innerHTML = '<option value="">Select Broker</option>';
                appData.brokers.forEach(broker => {
                    splitBroker.innerHTML += `<option value="${broker.id}">${broker.name}</option>`;
                });
                
                // Populate supplier dropdown
                const splitSupplier = document.getElementById('splitSupplier');
                splitSupplier.innerHTML = '<option value="">Select Supplier</option>';
                appData.suppliers.forEach(supplier => {
                    splitSupplier.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
                });
            }
        }

        // Deductions functions
        function addDeduction() {
            const date = document.getElementById('deductionDate').value;
            const customerId = document.getElementById('deductionCustomer').value;
            const invoice = document.getElementById('deductionInvoice').value;
            const amount = parseFloat(document.getElementById('deductionAmount').value);
            const reason = document.getElementById('deductionReason').value;
            const adjustmentType = document.getElementById('adjustmentType').value;
            
            if (date && customerId && amount && reason) {
                const customer = appData.customers.find(c => c.id == customerId);
                let adjustmentEntityId = null;
                let adjustmentEntityName = '';
                let adjustmentAmount = 0;
                let lossAmount = amount;
                let splitAdjustments = null;
                
                // Handle adjustments
                if (adjustmentType === 'Supplier' || adjustmentType === 'Broker') {
                    adjustmentEntityId = document.getElementById('adjustmentEntity').value;
                    adjustmentAmount = parseFloat(document.getElementById('adjustmentAmount').value) || 0;
                    
                    if (!adjustmentEntityId || adjustmentAmount <= 0) {
                        alert('Please select entity and enter adjustment amount');
                        return;
                    }
                    
                    if (adjustmentAmount > amount) {
                        alert('Adjustment amount cannot exceed deduction amount');
                        return;
                    }
                    
                    lossAmount = amount - adjustmentAmount;
                    
                    if (adjustmentType === 'Supplier') {
                        const supplier = appData.suppliers.find(s => s.id == adjustmentEntityId);
                        adjustmentEntityName = supplier.name;
                        
                        // Create adjustment entry for supplier ledger
                        if (!appData.adjustments) appData.adjustments = [];
                        appData.adjustments.push({
                            id: Date.now(),
                            date: date,
                            type: 'supplier_adjustment',
                            entityId: adjustmentEntityId,
                            entityName: adjustmentEntityName,
                            amount: adjustmentAmount,
                            reference: `Deduction adjustment - ${invoice}`,
                            deductionId: Date.now() + 1
                        });
                    } else if (adjustmentType === 'Broker') {
                        const broker = appData.brokers.find(b => b.id == adjustmentEntityId);
                        adjustmentEntityName = broker.name;
                        
                        // Create adjustment entry for broker ledger
                        if (!appData.adjustments) appData.adjustments = [];
                        appData.adjustments.push({
                            id: Date.now(),
                            date: date,
                            type: 'broker_adjustment',
                            entityId: adjustmentEntityId,
                            entityName: adjustmentEntityName,
                            amount: adjustmentAmount,
                            reference: `Deduction adjustment - ${invoice}`,
                            deductionId: Date.now() + 1
                        });
                    }
                } else if (adjustmentType === 'Split') {
                    const splitBrokerId = document.getElementById('splitBroker').value;
                    const splitBrokerAmount = parseFloat(document.getElementById('splitBrokerAmount').value) || 0;
                    const splitSupplierId = document.getElementById('splitSupplier').value;
                    const splitSupplierAmount = parseFloat(document.getElementById('splitSupplierAmount').value) || 0;
                    
                    if (!splitBrokerId || !splitSupplierId || splitBrokerAmount <= 0 || splitSupplierAmount <= 0) {
                        alert('Please select both broker and supplier with valid amounts');
                        return;
                    }
                    
                    const totalSplitAmount = splitBrokerAmount + splitSupplierAmount;
                    if (totalSplitAmount > amount) {
                        alert('Total split adjustment amount cannot exceed deduction amount');
                        return;
                    }
                    
                    lossAmount = amount - totalSplitAmount;
                    adjustmentAmount = totalSplitAmount;
                    
                    const broker = appData.brokers.find(b => b.id == splitBrokerId);
                    const supplier = appData.suppliers.find(s => s.id == splitSupplierId);
                    
                    splitAdjustments = {
                        broker: { id: splitBrokerId, name: broker.name, amount: splitBrokerAmount },
                        supplier: { id: splitSupplierId, name: supplier.name, amount: splitSupplierAmount }
                    };
                    
                    adjustmentEntityName = `${broker.name} (${RU}${splitBrokerAmount}) + ${supplier.name} (${RU}${splitSupplierAmount})`;
                    
                    // Create adjustment entries
                    if (!appData.adjustments) appData.adjustments = [];
                    
                    // Broker adjustment
                    appData.adjustments.push({
                        id: Date.now(),
                        date: date,
                        type: 'broker_adjustment',
                        entityId: splitBrokerId,
                        entityName: broker.name,
                        amount: splitBrokerAmount,
                        reference: `Split deduction adjustment - ${invoice}`,
                        deductionId: Date.now() + 1
                    });
                    
                    // Supplier adjustment
                    appData.adjustments.push({
                        id: Date.now() + 1,
                        date: date,
                        type: 'supplier_adjustment',
                        entityId: splitSupplierId,
                        entityName: supplier.name,
                        amount: splitSupplierAmount,
                        reference: `Split deduction adjustment - ${invoice}`,
                        deductionId: Date.now() + 1
                    });
                }
                
                const deduction = {
                    id: Date.now() + 1,
                    date: date,
                    customerId: customerId,
                    customerName: customer.name,
                    invoice: invoice,
                    amount: amount,
                    reason: reason,
                    adjustmentType: adjustmentType,
                    adjustmentEntityId: adjustmentEntityId,
                    adjustmentEntityName: adjustmentEntityName,
                    adjustmentAmount: adjustmentAmount,
                    splitAdjustments: splitAdjustments,
                    lossAmount: lossAmount,
                    linkedPurchase: deductionLinkedPurchase,
                    linkedSale: deductionLinkedSale
                };
                
                appData.deductions.push(deduction);
                saveData();
                updateDeductionsHistory();
                
                // Regenerate ledger if on ledger page to show new entry immediately
                if (typeof generateLedger === 'function') {
                    generateLedger();
                }
                
                // Clear form
                document.getElementById('deductionDate').value = '';
                document.getElementById('deductionCustomer').value = '';
                document.getElementById('deductionInvoice').value = '';
                document.getElementById('deductionAmount').value = '';
                document.getElementById('deductionReason').value = '';
                document.getElementById('adjustmentType').value = '';
                document.getElementById('adjustmentEntity').value = '';
                document.getElementById('adjustmentAmount').value = '';
                document.getElementById('splitBroker').value = '';
                document.getElementById('splitBrokerAmount').value = '';
                document.getElementById('splitSupplier').value = '';
                document.getElementById('splitSupplierAmount').value = '';
                document.getElementById('adjustmentFields').style.display = 'none';
                document.getElementById('splitAdjustmentFields').style.display = 'none';
                
                // Clear linked transactions
                deductionLinkedPurchase = null;
                deductionLinkedSale = null;
                updateDeductionLinkedTransactionsDisplay();
                
                alert(`Deduction entry added successfully! Loss amount: ${RU}${lossAmount.toFixed(2)}`);
            }
        }

        // Filter Deductions
        function filterDeductions() {
            const search = (document.getElementById('deductionsSearch')?.value || '').toLowerCase();
            const customerId = document.getElementById('deductionsFilterCustomer')?.value || '';
            const dateFrom = document.getElementById('deductionsDateFrom')?.value || '';
            const dateTo = document.getElementById('deductionsDateTo')?.value || '';
            const sortBy = document.getElementById('deductionsSort')?.value || 'date-desc';
            
            filteredDeductions = appData.deductions.filter(d => {
                // Search filter
                if (search) {
                    const searchFields = [d.customerName, d.invoice, d.reason || ''].join(' ').toLowerCase();
                    if (!searchFields.includes(search)) return false;
                }
                // Customer filter
                if (customerId && d.customerId != customerId) return false;
                // Date filters
                if (dateFrom && d.date < dateFrom) return false;
                if (dateTo && d.date > dateTo) return false;
                return true;
            });
            
            // Sort
            filteredDeductions.sort((a, b) => {
                switch(sortBy) {
                    case 'date-asc': return new Date(a.date) - new Date(b.date);
                    case 'date-desc': return new Date(b.date) - new Date(a.date);
                    case 'amount-desc': return (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0);
                    case 'amount-asc': return (parseFloat(a.amount) || 0) - (parseFloat(b.amount) || 0);
                    case 'customer-asc': return (a.customerName || '').localeCompare(b.customerName || '');
                    default: return new Date(b.date) - new Date(a.date);
                }
            });
            
            // Update count
            const countEl = document.getElementById('deductionsFilterCount');
            if (countEl) {
                countEl.textContent = `Showing ${filteredDeductions.length} of ${appData.deductions.length} deductions`;
            }
            
            paginationState.deductions.currentPage = 1;
            renderDeductionsTable();
        }
        
        function clearDeductionsFilters() {
            document.getElementById('deductionsSearch').value = '';
            document.getElementById('deductionsFilterCustomer').value = '';
            document.getElementById('deductionsDateFrom').value = '';
            document.getElementById('deductionsDateTo').value = '';
            document.getElementById('deductionsSort').value = 'date-desc';
            filterDeductions();
        }
        
        function renderDeductionsTable() {
            const tbody = document.getElementById('deductionsHistory');
            tbody.innerHTML = '';
            
            if (filteredDeductions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">No deductions found</td></tr>';
                document.getElementById('deductionsPagination').innerHTML = '';
                return;
            }
            
            const { currentPage, pageSize } = paginationState.deductions;
            const paginatedDeductions = getPaginatedData(filteredDeductions, currentPage, pageSize);
            
            paginatedDeductions.forEach(deduction => {
                let adjustmentText = deduction.adjustmentType || 'Loss';
                if (deduction.adjustmentEntityName && deduction.adjustmentAmount) {
                    adjustmentText += ` (${deduction.adjustmentEntityName}: ${RU}${deduction.adjustmentAmount})`;
                }
                
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-200 hover:bg-slate-50';
                row.innerHTML = `
                    <td class="px-4 py-3">${deduction.date}</td>
                    <td class="px-4 py-3">${deduction.customerName}</td>
                    <td class="px-4 py-3">${deduction.invoice}</td>
                    <td class="px-4 py-3">${RU}${deduction.amount}</td>
                    <td class="px-4 py-3">${deduction.reason}</td>
                    <td class="px-4 py-3">${adjustmentText}</td>
                    <td class="px-4 py-3 text-red-600 font-medium">${RU}${(deduction.lossAmount || deduction.amount).toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-1">
                            <button onclick="editDeduction(${deduction.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="deleteDeduction(${deduction.id})" class="action-btn action-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            renderPagination('deductionsPagination', filteredDeductions.length, currentPage, pageSize, 'changeDeductionsPage', 'changeDeductionsPageSize');
        }
        
        function updateDeductionsHistory() {
            populateFilterDropdowns();
            filteredDeductions = [...appData.deductions];
            filterDeductions();
        }

        // Dashboard update
        function updateDashboard() {
            // Calculate net payables (to suppliers) - includes opening balances
            const totalPurchases = appData.purchases.reduce((sum, purchase) => sum + (purchase.grandTotal || purchase.total || 0), 0);
            const openingPayables = (appData.openingBalances || [])
                .filter(ob => ob.type === 'payable')
                .reduce((sum, ob) => sum + (ob.amount || 0), 0);
            const supplierPayments = appData.payments
                .filter(payment => payment.type === 'purchase' || (payment.type === 'ledger_payment' && payment.entityType === 'supplier'))
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const netPayables = Math.max(0, totalPurchases + openingPayables - supplierPayments);
            
            // Calculate net receivables (from customers)
            const totalSales = appData.sales.reduce((sum, sale) => sum + (sale.grandTotal || sale.total || 0), 0);
            const openingReceivables = (appData.openingBalances || [])
                .filter(ob => ob.type === 'receivable')
                .reduce((sum, ob) => sum + (ob.amount || 0), 0);
            const totalDeductions = appData.deductions.reduce((sum, deduction) => sum + (deduction.amount || 0), 0);
            const customerPayments = appData.payments
                .filter(payment => payment.type === 'sale' || (payment.type === 'ledger_receipt' && payment.entityType === 'customer'))
                .reduce((sum, payment) => sum + (payment.amount || 0), 0);
            const netReceivables = Math.max(0, totalSales + openingReceivables - totalDeductions - customerPayments);
            
            // Calculate stock value
            let stockValue = 0;
            const stockDetails = [];
            Object.keys(appData.inventory || {}).forEach(itemId => {
                const inventory = appData.inventory[itemId];
                if (inventory && inventory.quantity > 0) {
                    const item = appData.items.find(i => i.id == itemId);
                    if (item) {
                        stockValue += (inventory.totalCost || 0);
                        stockDetails.push({ name: item.name, quantity: inventory.quantity, unit: item.unit, value: inventory.totalCost || 0 });
                    }
                }
            });
            
            // Update key metrics
            document.getElementById('netPayables').textContent = `${RU}${(netPayables || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            document.getElementById('netReceivables').textContent = `${RU}${(netReceivables || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            document.getElementById('stockValue').textContent = `${RU}${(stockValue || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            
            // Net Position
            const netPosition = netReceivables - netPayables;
            const netPositionEl = document.getElementById('netPosition');
            if (netPositionEl) {
                netPositionEl.textContent = `${netPosition >= 0 ? '+' : ''}${RU}${netPosition.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            }
            
            // Update last updated time
            const updateTimeEl = document.getElementById('dashboardUpdateTime');
            if (updateTimeEl) {
                updateTimeEl.textContent = new Date().toLocaleTimeString('en-IN');
            }
            
            // Update inventory status
            const stockDetailsContainer = document.getElementById('stockDetails');
            const inventoryCountEl = document.getElementById('inventoryItemCount');
            if (stockDetailsContainer) {
                if (stockDetails.length === 0) {
                    stockDetailsContainer.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No items in stock</div>';
                } else {
                    stockDetailsContainer.innerHTML = stockDetails.map(detail => `
                        <div class="flex justify-between items-center text-xs py-2 px-2 bg-slate-50 rounded-lg mb-1">
                            <span class="font-medium text-slate-700">${detail.name}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-slate-500">${detail.quantity.toFixed(1)} ${detail.unit}</span>
                                <span class="text-amber-600 font-bold">${RU}${detail.value.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    `).join('');
                }
                if (inventoryCountEl) inventoryCountEl.textContent = `${stockDetails.length} items`;
            }
            
            // Update Top Suppliers
            const supplierTotals = {};
            appData.purchases.forEach(p => {
                if (!supplierTotals[p.supplierId]) supplierTotals[p.supplierId] = { name: p.supplierName, total: 0, count: 0 };
                supplierTotals[p.supplierId].total += (p.grandTotal || p.total || 0);
                supplierTotals[p.supplierId].count++;
            });
            const topSuppliersEl = document.getElementById('topSuppliers');
            if (topSuppliersEl) {
                const topSuppliers = Object.values(supplierTotals).sort((a, b) => b.total - a.total).slice(0, 5);
                if (topSuppliers.length === 0) {
                    topSuppliersEl.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No purchase data</div>';
                } else {
                    topSuppliersEl.innerHTML = topSuppliers.map((s, i) => `
                        <div class="flex items-center gap-2 text-xs py-2 px-2 bg-slate-50 rounded-lg">
                            <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">${i + 1}</span>
                            <span class="flex-1 font-medium text-slate-700 truncate">${s.name}</span>
                            <span class="text-slate-500">${s.count} orders</span>
                            <span class="text-blue-600 font-bold">${RU}${(s.total/1000).toFixed(0)}K</span>
                        </div>
                    `).join('');
                }
            }
            
            // Update Top Customers
            const customerTotals = {};
            appData.sales.forEach(s => {
                if (!customerTotals[s.customerId]) customerTotals[s.customerId] = { name: s.customerName, total: 0, count: 0 };
                customerTotals[s.customerId].total += (s.grandTotal || s.total || 0);
                customerTotals[s.customerId].count++;
            });
            const topCustomersEl = document.getElementById('topCustomers');
            if (topCustomersEl) {
                const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);
                if (topCustomers.length === 0) {
                    topCustomersEl.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No sales data</div>';
                } else {
                    topCustomersEl.innerHTML = topCustomers.map((c, i) => `
                        <div class="flex items-center gap-2 text-xs py-2 px-2 bg-slate-50 rounded-lg">
                            <span class="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs">${i + 1}</span>
                            <span class="flex-1 font-medium text-slate-700 truncate">${c.name}</span>
                            <span class="text-slate-500">${c.count} orders</span>
                            <span class="text-green-600 font-bold">${RU}${(c.total/1000).toFixed(0)}K</span>
                        </div>
                    `).join('');
                }
            }
            
            // Update Recent Transactions
            const recentTransactionsEl = document.getElementById('recentTransactions');
            if (recentTransactionsEl) {
                const allTransactions = [
                    ...appData.purchases.map(p => ({ type: 'purchase', date: p.date, desc: `Purchase from ${p.supplierName}`, amount: p.grandTotal || p.total, invoice: p.invoice })),
                    ...appData.sales.map(s => ({ type: 'sale', date: s.date, desc: `Sale to ${s.customerName}`, amount: s.grandTotal || s.total, invoice: s.invoice }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
                
                if (allTransactions.length === 0) {
                    recentTransactionsEl.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No recent transactions</div>';
                } else {
                    recentTransactionsEl.innerHTML = allTransactions.map(t => `
                        <div class="flex items-center gap-3 text-xs py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'sale' ? 'bg-green-100' : 'bg-red-100'}">
                                <svg class="w-4 h-4 ${t.type === 'sale' ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${t.type === 'sale' ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'}"/>
                                </svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium text-slate-700 truncate">${escapeHtml(t.desc)}</p>
                                <p class="text-slate-400">${escapeHtml(t.date)} ${BULLET} ${escapeHtml(t.invoice)}</p>
                            </div>
                            <span class="${t.type === 'sale' ? 'text-green-600' : 'text-red-600'} font-bold flex-shrink-0">
                                ${t.type === 'sale' ? '+' : '-'}${RU}${(t.amount || 0).toLocaleString('en-IN')}
                            </span>
                        </div>
                    `).join('');
                }
            }
            
            // Update Payment Alerts
            const paymentAlertsEl = document.getElementById('paymentAlerts');
            const alertsCountEl = document.getElementById('paymentAlertsCount');
            if (paymentAlertsEl) {
                const unpaidPurchases = appData.purchases.filter(p => {
                    const balance = (p.grandTotal || p.total || 0) - (p.paid || 0);
                    return balance > 0;
                }).slice(0, 5);
                
                const unpaidSales = appData.sales.filter(s => {
                    const balance = (s.grandTotal || s.total || 0) - (s.received || 0);
                    return balance > 0;
                }).slice(0, 5);
                
                const totalAlerts = unpaidPurchases.length + unpaidSales.length;
                if (alertsCountEl) alertsCountEl.textContent = `${totalAlerts} pending`;
                
                if (totalAlerts === 0) {
                    paymentAlertsEl.innerHTML = '<div class="text-xs text-green-500 italic text-center py-4">' + CHECK + ' All payments cleared</div>';
                } else {
                    let alertsHtml = '';
                    unpaidPurchases.forEach(p => {
                        const balance = (p.grandTotal || p.total || 0) - (p.paid || 0);
                        const daysOld = p.date ? Math.floor((Date.now() - new Date(p.date)) / (24 * 60 * 60 * 1000)) : 0;
                        const isOverdue = daysOld > 30;
                        alertsHtml += `
                            <div class="flex items-center gap-2 text-xs py-2 px-2 bg-red-50 rounded-lg border border-red-100">
                                <svg class="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="flex-1 text-slate-700">Pay <strong>${escapeHtml(p.supplierName)}</strong>${isOverdue ? ' <span class="inline-block px-1.5 py-0.5 rounded text-red-700 bg-red-200 font-semibold">Overdue</span>' : ''}</span>
                                <span class="text-red-600 font-bold">${RU}${balance.toLocaleString('en-IN')}</span>
                            </div>
                        `;
                    });
                    unpaidSales.forEach(s => {
                        const balance = (s.grandTotal || s.total || 0) - (s.received || 0);
                        const daysOld = s.date ? Math.floor((Date.now() - new Date(s.date)) / (24 * 60 * 60 * 1000)) : 0;
                        const isOverdue = daysOld > 30;
                        alertsHtml += `
                            <div class="flex items-center gap-2 text-xs py-2 px-2 bg-amber-50 rounded-lg border border-amber-100">
                                <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                <span class="flex-1 text-slate-700">Collect from <strong>${escapeHtml(s.customerName)}</strong>${isOverdue ? ' <span class="inline-block px-1.5 py-0.5 rounded text-amber-800 bg-amber-200 font-semibold">Overdue</span>' : ''}</span>
                                <span class="text-amber-600 font-bold">${RU}${balance.toLocaleString('en-IN')}</span>
                            </div>
                        `;
                    });
                    paymentAlertsEl.innerHTML = alertsHtml;
                }
            }
            
            // Low Stock Alerts (items with minStock set and current qty below it)
            var lowStockAlertsEl = document.getElementById('lowStockAlerts');
            var lowStockCountEl = document.getElementById('lowStockCount');
            if (lowStockAlertsEl && lowStockCountEl) {
                var lowStockList = [];
                (appData.items || []).forEach(function(item) {
                    if (item.active === false) return;
                    var minStock = parseFloat(item.minStock);
                    if (!minStock || minStock <= 0) return;
                    var inv = appData.inventory[item.id];
                    var qty = inv ? inv.quantity : 0;
                    if (qty < minStock) lowStockList.push({ name: item.name, qty: qty, min: minStock, unit: item.unit || 'kg' });
                });
                lowStockCountEl.textContent = lowStockList.length;
                if (lowStockList.length === 0) {
                    lowStockAlertsEl.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No low stock items</div>';
                } else {
                    lowStockAlertsEl.innerHTML = lowStockList.map(function(l) {
                        return '<div class="flex items-center gap-2 text-xs py-2 px-2 bg-amber-50 rounded-lg border border-amber-100">' +
                            '<span class="flex-1 font-medium text-slate-700">' + l.name + '</span>' +
                            '<span class="text-amber-600 font-bold">' + l.qty + ' / ' + l.min + ' ' + l.unit + '</span></div>';
                    }).join('');
                }
            }
            
            // Credit limit exceeded (customers with balance > credit limit, default 2 lacs)
            var creditLimitListEl = document.getElementById('creditLimitExceededList');
            var creditLimitCountEl = document.getElementById('creditLimitExceededCount');
            if (creditLimitListEl && creditLimitCountEl && typeof getCustomerBalance === 'function') {
                var overLimit = [];
                (appData.customers || []).forEach(function(c) {
                    if (c.active === false) return;
                    var limit = (c.creditLimit != null && c.creditLimit !== '') ? parseFloat(c.creditLimit) : 200000;
                    var bal = getCustomerBalance(c.id);
                    if (bal > limit) overLimit.push({ name: c.name, balance: bal, limit: limit });
                });
                creditLimitCountEl.textContent = overLimit.length;
                if (overLimit.length === 0) {
                    creditLimitListEl.innerHTML = '<div class="text-xs text-slate-400 italic text-center py-4">No customers over limit</div>';
                } else {
                    creditLimitListEl.innerHTML = overLimit.map(function(o) {
                        return '<div class="flex items-center gap-2 text-xs py-2 px-2 bg-red-50 rounded-lg border border-red-100">' +
                            '<span class="flex-1 font-medium text-slate-700">' + escapeHtml(o.name) + '</span>' +
                            '<span class="text-red-600 font-bold">' + RU + o.balance.toLocaleString('en-IN', {minimumFractionDigits: 2}) + ' &gt; ' + RU + o.limit.toLocaleString('en-IN') + '</span></div>';
                    }).join('');
                }
            }
            
            // Update Business Summary Footer
            const summaryItems = document.getElementById('summaryItems');
            const summarySuppliers = document.getElementById('summarySuppliers');
            const summaryCustomers = document.getElementById('summaryCustomers');
            const summaryPurchases = document.getElementById('summaryPurchases');
            const summarySales = document.getElementById('summarySales');
            const summaryBrokers = document.getElementById('summaryBrokers');
            
            if (summaryItems) summaryItems.textContent = appData.items.length;
            if (summarySuppliers) summarySuppliers.textContent = appData.suppliers.length;
            if (summaryCustomers) summaryCustomers.textContent = appData.customers.length;
            if (summaryPurchases) summaryPurchases.textContent = appData.purchases.length;
            if (summarySales) summarySales.textContent = appData.sales.length;
            if (summaryBrokers) summaryBrokers.textContent = appData.brokers.length;
            
            // Update Performance Chart
            updateDashboardCharts();
        }
        
        // Dashboard Charts
        function updateDashboardCharts() {
            const periodValue = document.getElementById('chartPeriod')?.value || 'all';
            const today = new Date();
            
            let periodPurchases, periodSales, periodBrokerage, periodDeductions;
            
            if (periodValue === 'all') {
                // All time - no date filter
                periodPurchases = appData.purchases;
                periodSales = appData.sales;
                periodBrokerage = appData.brokerage;
                periodDeductions = appData.deductions;
            } else {
                const days = parseInt(periodValue);
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() - days);
                
                // Filter data by date range
                periodPurchases = appData.purchases.filter(p => new Date(p.date) >= startDate);
                periodSales = appData.sales.filter(s => new Date(s.date) >= startDate);
                periodBrokerage = appData.brokerage.filter(b => new Date(b.date) >= startDate);
                periodDeductions = appData.deductions.filter(d => new Date(d.date) >= startDate);
            }
            
            // Calculate totals accurately (matching P&L calculation)
            const totalPurchasesInPeriod = periodPurchases.reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
            
            // Sales revenue excluding truck advance
            const totalSalesInPeriod = periodSales.reduce((sum, s) => {
                const saleTotal = s.grandTotal || s.total || 0;
                const truckAdvance = s.truckAdvance || 0;
                return sum + saleTotal - truckAdvance;
            }, 0);
            
            // Brokerage and deductions
            const totalBrokerage = periodBrokerage.reduce((sum, b) => sum + (b.amount || 0), 0);
            const totalDeductions = periodDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
            
            // Net Profit = Revenue - Purchases - Brokerage - Deductions
            const grossProfit = totalSalesInPeriod - totalPurchasesInPeriod - totalBrokerage - totalDeductions;
            const totalTransactions = periodPurchases.length + periodSales.length;
            const profitMargin = totalSalesInPeriod > 0 ? ((grossProfit / totalSalesInPeriod) * 100) : 0;
            
            // Update summary cards
            const chartTotalSales = document.getElementById('chartTotalSales');
            const chartTotalPurchases = document.getElementById('chartTotalPurchases');
            const chartGrossProfit = document.getElementById('chartGrossProfit');
            const chartTransactions = document.getElementById('chartTransactions');
            
            if (chartTotalSales) chartTotalSales.textContent = `${RU}${(totalSalesInPeriod/1000).toFixed(0)}K`;
            if (chartTotalPurchases) chartTotalPurchases.textContent = `${RU}${(totalPurchasesInPeriod/1000).toFixed(0)}K`;
            if (chartGrossProfit) {
                chartGrossProfit.textContent = `${grossProfit >= 0 ? '+' : ''}${RU}${(grossProfit/1000).toFixed(0)}K`;
                chartGrossProfit.className = `text-lg font-bold ${grossProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`;
            }
            if (chartTransactions) chartTransactions.textContent = totalTransactions;
            
            // Update Donut Chart
            const circumference = 2 * Math.PI * 60; // 377
            const total = totalSalesInPeriod + totalPurchasesInPeriod;
            
            const salesArc = document.getElementById('salesArc');
            const purchasesArc = document.getElementById('purchasesArc');
            const donutCenterValue = document.getElementById('donutCenterValue');
            const donutProfitPercent = document.getElementById('donutProfitPercent');
            const donutSalesValue = document.getElementById('donutSalesValue');
            const donutPurchasesValue = document.getElementById('donutPurchasesValue');
            const donutMarginValue = document.getElementById('donutMarginValue');
            
            if (salesArc && purchasesArc && total > 0) {
                const salesPercent = totalSalesInPeriod / total;
                const purchasesPercent = totalPurchasesInPeriod / total;
                
                const salesDash = salesPercent * circumference;
                const purchasesDash = purchasesPercent * circumference;
                
                // Sales arc starts at top
                salesArc.setAttribute('stroke-dasharray', `${salesDash} ${circumference}`);
                
                // Purchases arc starts where sales ends
                purchasesArc.setAttribute('stroke-dasharray', `${purchasesDash} ${circumference}`);
                purchasesArc.setAttribute('stroke-dashoffset', -salesDash + (circumference * 0.25));
            } else if (salesArc && purchasesArc) {
                salesArc.setAttribute('stroke-dasharray', `0 ${circumference}`);
                purchasesArc.setAttribute('stroke-dasharray', `0 ${circumference}`);
            }
            
            // Update center value and legend
            if (donutCenterValue) {
                const profitK = grossProfit / 1000;
                donutCenterValue.textContent = `${grossProfit >= 0 ? '' : '-'}${RU}${Math.abs(profitK).toFixed(0)}K`;
                donutCenterValue.className = `text-xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`;
            }
            if (donutProfitPercent) {
                donutProfitPercent.textContent = `${profitMargin >= 0 ? '+' : ''}${profitMargin.toFixed(1)}%`;
                donutProfitPercent.className = `text-xs font-semibold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`;
            }
            if (donutSalesValue) donutSalesValue.textContent = `${RU}${(totalSalesInPeriod/1000).toFixed(0)}K`;
            if (donutPurchasesValue) donutPurchasesValue.textContent = `${RU}${(totalPurchasesInPeriod/1000).toFixed(0)}K`;
            if (donutMarginValue) {
                donutMarginValue.textContent = `${profitMargin.toFixed(1)}%`;
                donutMarginValue.className = `text-sm font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`;
            }

            if (typeof renderLedgerSummaryCards === 'function') {
                renderLedgerSummaryCards();
            }
        }

        // Payment reminders function
        function updatePaymentReminders() {
            const reminderContainer = document.getElementById('paymentReminders');
            if (!reminderContainer) return;
            reminderContainer.innerHTML = '';
            
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            // Calculate customer balances and last payment dates
            const customerBalances = {};
            
            // Add sales to customer balances
            appData.sales.forEach(sale => {
                if (!customerBalances[sale.customerId]) {
                    customerBalances[sale.customerId] = {
                        customerName: sale.customerName,
                        balance: 0,
                        lastPaymentDate: null,
                        lastSaleDate: sale.date
                    };
                }
                customerBalances[sale.customerId].balance += sale.total;
                
                // Update last sale date if this sale is more recent
                if (new Date(sale.date) > new Date(customerBalances[sale.customerId].lastSaleDate)) {
                    customerBalances[sale.customerId].lastSaleDate = sale.date;
                }
            });
            
            // Subtract deductions from customer balances
            appData.deductions.forEach(deduction => {
                if (customerBalances[deduction.customerId]) {
                    customerBalances[deduction.customerId].balance -= deduction.amount;
                }
            });
            
            // Find customers with balance > 1 lakh and no payments for over a week
            const reminders = [];
            Object.keys(customerBalances).forEach(customerId => {
                const customer = customerBalances[customerId];
                const lastSaleDate = new Date(customer.lastSaleDate);
                
                if (customer.balance > 100000 && lastSaleDate < oneWeekAgo) {
                    const daysSinceLastSale = Math.floor((new Date() - lastSaleDate) / (1000 * 60 * 60 * 24));
                    reminders.push({
                        customerName: customer.customerName,
                        balance: customer.balance,
                        daysSince: daysSinceLastSale
                    });
                }
            });
            
            if (reminders.length === 0) {
                reminderContainer.innerHTML = `
                    <div class="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <span class="text-slate-600 font-medium">No payment reminders</span>
                    </div>
                `;
            } else {
                reminders.forEach(reminder => {
                    const div = document.createElement('div');
                    div.className = 'flex justify-between items-center p-4 bg-gradient-to-r from-danger/5 to-danger/10 border border-danger/20 rounded-xl hover:shadow-soft transition-all duration-200';
                    div.innerHTML = `
                        <div class="flex-1">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-danger/20 rounded-full flex items-center justify-center">
                                    <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                                    </svg>
                                </div>
                                <div>
                                    <span class="font-semibold text-danger text-lg">${reminder.customerName}</span>
                                    <p class="text-sm text-danger/80 font-medium">Outstanding: ${RU}${reminder.balance.toLocaleString()}</p>
                                    <p class="text-xs text-danger/60">${reminder.daysSince} days since last transaction</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-medium">URGENT</span>
                        </div>
                    `;
                    reminderContainer.appendChild(div);
                });
            }
        }

        // P&L functions
       function generatePnL() {
  const filterType = document.getElementById('pnlFilterType').value;

  let filteredPurchases = appData.purchases;
  let filteredSales = appData.sales;
  let filteredBrokerage = appData.brokerage;
  let filteredDeductions = appData.deductions;
  let filteredColdDamages = appData.coldStorageDamages || [];

  const today = new Date();
  let startDate = null;
  let endDate = today;

  // Decide startDate based on selected filter
  if (filterType === 'thismonth') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  } else if (filterType === 'last30days') {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
  } else if (filterType === 'last3months') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
  } else if (filterType === 'last6months') {
    startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
  } else if (filterType === 'custom') {
    const startInput = document.getElementById('pnlStartDate')?.value;
    const endInput = document.getElementById('pnlEndDate')?.value;
    if (startInput && endInput) {
      startDate = new Date(startInput);
      endDate = new Date(endInput);
      endDate.setHours(23, 59, 59, 999); // include full last day
    } else {
      console.warn("Custom date range not fully selected");
      startDate = null; // skip filtering until user picks both dates
    }
  } else if (filterType === 'all' || !filterType) {
    startDate = null; // no filtering - show all transactions
  }

  // Apply date filters if we have a startDate
  if (startDate) {
    const inRange = (entryDateStr) => {
      if (!entryDateStr) return false;
      const d = new Date(entryDateStr);
      return d >= startDate && d <= endDate;
    };

    filteredPurchases = filteredPurchases.filter(p => inRange(p.date));
    filteredSales = filteredSales.filter(s => inRange(s.date));
    filteredBrokerage = filteredBrokerage.filter(b => inRange(b.date));
    filteredDeductions = filteredDeductions.filter(d => inRange(d.date));
    filteredColdDamages = filteredColdDamages.filter(dmg => inRange(dmg.date));
  }

  console.log('P&L Filter Debug:', {
    filterType,
    startDate,
    endDate,
    totalPurchases: appData.purchases.length,
    totalSales: appData.sales.length,
    filteredPurchases: filteredPurchases.length,
    filteredSales: filteredSales.length,
    samplePurchaseDate: appData.purchases[0]?.date,
    sampleSaleDate: appData.sales[0]?.date
  });
        
            function getPurchaseColdStorageTotal(purchase) {
                if (!purchase || !Array.isArray(purchase.items)) return 0;
                return purchase.items.reduce(function(sum, item) {
                    return sum + (parseFloat(item && item.coldStorageCost) || 0);
                }, 0);
            }

            // Calculate totals for P&L:
            // - EXCLUDE `truckAdvance` from sale revenue (already done earlier)
            // - EXCLUDE invoice-level `advance` from both purchase costs and sale revenue by ADDING it back.
            //   This prevents advance (received/paid) fields from affecting profit/loss.
            const totalRevenue = filteredSales.reduce((sum, sale) => {
                const saleTotal = (sale.grandTotal || sale.total || 0);
                const truckAdvance = sale.truckAdvance || 0;
                const invoiceAdvance = parseFloat(sale.advance) || 0;
                return sum + saleTotal - truckAdvance + invoiceAdvance; // subtract truck advance; add invoice advance back
            }, 0);
            const totalBasePurchaseCost = filteredPurchases.reduce((sum, purchase) => {
                const purchaseTotal = (purchase.grandTotal || purchase.total || 0);
                const invoiceAdvance = parseFloat(purchase.advance) || 0;
                return sum + purchaseTotal + invoiceAdvance; // add invoice advance back to exclude from P&L
            }, 0);
            const totalColdStorageCost = filteredPurchases.reduce((sum, purchase) => {
                return sum + getPurchaseColdStorageTotal(purchase);
            }, 0);
            const totalLotColdStorageCost = (appData.coldStorageLots || []).reduce((sum, lot) => {
                return sum + (parseFloat(lot.estimatedTotalCharge) || 0);
            }, 0);
            const totalCompanyColdMoveExpense = (appData.coldStorageMovements || []).reduce((sum, movement) => {
                if (String(movement.type || '') !== 'company_expense') return sum;
                if (startDate) {
                    const movementDate = movement.date ? new Date(movement.date) : null;
                    if (!movementDate || movementDate < startDate || movementDate > endDate) return sum;
                }
                return sum + (parseFloat(movement.amount) || 0);
            }, 0);
            const totalColdDamageUsShare = filteredColdDamages.reduce((sum, row) => {
                return sum + (parseFloat(row.usShareAmount) || 0);
            }, 0);
            const totalColdDamageVendorRecovery = filteredColdDamages.reduce((sum, row) => {
                return sum + (parseFloat(row.payableReduction) || 0);
            }, 0);
            const totalEffectivePurchaseCost = totalBasePurchaseCost + totalColdStorageCost;
            const totalCosts = totalEffectivePurchaseCost + totalCompanyColdMoveExpense + totalColdDamageUsShare - totalColdDamageVendorRecovery;
            const totalBrokerage = filteredBrokerage.reduce((sum, entry) => sum + (entry.amount || 0), 0);
            const totalDeductionsAmount = filteredDeductions.reduce((sum, d) => {
                var amt = parseFloat(d.amount) || 0;
                var loss = (d.lossAmount !== undefined && d.lossAmount !== null && d.lossAmount !== '') ? parseFloat(d.lossAmount) : amt;
                return sum + loss;
            }, 0);
            const netProfit = totalRevenue - totalCosts - totalBrokerage - totalDeductionsAmount;
            
            // Update summary
            document.getElementById('totalRevenue').textContent = `${RU}${totalRevenue.toFixed(2)}`;
            document.getElementById('totalCosts').textContent = `${RU}${(totalCosts + totalBrokerage).toFixed(2)}`;
            document.getElementById('netProfit').textContent = `${RU}${netProfit.toFixed(2)}`;
            var basePurchaseCostEl = document.getElementById('pnlBasePurchaseCost');
            var coldStorageCostEl = document.getElementById('pnlColdStorageCost');
            var effectivePurchaseCostEl = document.getElementById('pnlEffectivePurchaseCost');
            var coldDamageLossEl = document.getElementById('pnlColdDamageLoss');
            var coldDamageRecoveryEl = document.getElementById('pnlColdDamageRecovery');
            var companyColdMoveExpenseEl = document.getElementById('pnlCompanyColdMoveExpense');
            if (basePurchaseCostEl) basePurchaseCostEl.textContent = `${RU}${totalBasePurchaseCost.toFixed(2)}`;
            if (coldStorageCostEl) coldStorageCostEl.textContent = `${RU}${(totalColdStorageCost + totalLotColdStorageCost).toFixed(2)}`;
            if (effectivePurchaseCostEl) effectivePurchaseCostEl.textContent = `${RU}${totalEffectivePurchaseCost.toFixed(2)}`;
            if (coldDamageLossEl) coldDamageLossEl.textContent = `${RU}${totalColdDamageUsShare.toFixed(2)}`;
            if (coldDamageRecoveryEl) coldDamageRecoveryEl.textContent = `${RU}${totalColdDamageVendorRecovery.toFixed(2)}`;
            if (companyColdMoveExpenseEl) companyColdMoveExpenseEl.textContent = `${RU}${totalCompanyColdMoveExpense.toFixed(2)}`;
            
            // Helper: deduction totals for a sale (by linkedSale.saleId or invoice match). Uses lossAmount for P&L so adjustment (supplier/broker share) is respected.
            function getDeductionsForSale(sale) {
                if (!sale || !appData.deductions || !appData.deductions.length) return { netLoss: 0, adjustmentTotal: 0 };
                var deductionsForSale = appData.deductions.filter(function(d) {
                    if (d.linkedSale && d.linkedSale.saleId === sale.id) return true;
                    if (d.invoice && sale.invoice && String(d.invoice).trim() === String(sale.invoice).trim()) return true;
                    return false;
                });
                var netLoss = 0;
                var adjustmentTotal = 0;
                deductionsForSale.forEach(function(d) {
                    var amt = parseFloat(d.amount) || 0;
                    var loss = (d.lossAmount !== undefined && d.lossAmount !== null && d.lossAmount !== '') ? parseFloat(d.lossAmount) : amt;
                    var adj = parseFloat(d.adjustmentAmount) || 0;
                    netLoss += loss;
                    adjustmentTotal += adj;
                });
                return { netLoss: netLoss, adjustmentTotal: adjustmentTotal };
            }

            // Helper: brokerage totals linked to specific sale/purchase invoice.
            function getBrokerageForSale(sale) {
                if (!sale || !filteredBrokerage || !filteredBrokerage.length) return 0;
                var saleInvoice = String(sale.invoice || '').trim();
                return filteredBrokerage
                    .filter(function(b) {
                        if (String(b.type || '').toLowerCase() !== 'sale') return false;
                        return String(b.reference || '').trim() === saleInvoice;
                    })
                    .reduce(function(sum, b) { return sum + (parseFloat(b.amount) || 0); }, 0);
            }

            function getBrokerageForPurchase(purchase) {
                if (!purchase || !filteredBrokerage || !filteredBrokerage.length) return 0;
                var purchaseInvoice = String(purchase.invoice || '').trim();
                return filteredBrokerage
                    .filter(function(b) {
                        if (String(b.type || '').toLowerCase() !== 'purchase') return false;
                        return String(b.reference || '').trim() === purchaseInvoice;
                    })
                    .reduce(function(sum, b) { return sum + (parseFloat(b.amount) || 0); }, 0);
            }
            
            // Create P&L rows based on linked purchases
            const pnlRows = [];
            
            // Process sales with linked purchases
            filteredSales.forEach(sale => {
                const saleTotal = sale.grandTotal || sale.total || 0;
                const saleTruckAdvance = sale.truckAdvance || 0;
                const invoiceAdvance = parseFloat(sale.advance) || 0;
                const saleNetAmount = saleTotal - saleTruckAdvance + invoiceAdvance; // exclude invoice advance from P&L
                const saleBrokerageTotal = getBrokerageForSale(sale);
                var deductionTotals = getDeductionsForSale(sale);
                var totalDeductionForSale = deductionTotals.netLoss;
                var totalAdjustmentForSale = deductionTotals.adjustmentTotal || 0;
                
                if (sale.linkedPurchases && sale.linkedPurchases.length > 0) {
                    const totalSaleQty = sale.items ? sale.items.reduce((sum, item) => sum + item.grossWeight, 0) : 1;
                    // Sale has linked purchases - show each linked purchase
                    sale.linkedPurchases.forEach(link => {
                        const purchase = appData.purchases.find(p => String(p.id) === String(link.purchaseId));
                        if (purchase && filteredPurchases.some(fp => fp.id === purchase.id)) {
                            // Calculate proportional amounts based on quantity used
                            const totalPurchaseQty = purchase.items ? purchase.items.reduce((sum, item) => sum + item.grossWeight, 0) : 1;
                            const purchaseTotalRaw = purchase.grandTotal || purchase.total || 0;
                            const purchaseInvoiceAdvance = parseFloat(purchase.advance) || 0;
                            const purchaseBaseForPnL = purchaseTotalRaw + purchaseInvoiceAdvance; // exclude invoice advance from P&L
                            const purchaseColdStorageForPnL = getPurchaseColdStorageTotal(purchase);
                            const purchaseTotalForPnL = purchaseBaseForPnL + purchaseColdStorageForPnL;
                            const proportionalBasePurchaseCost = totalPurchaseQty > 0 ? (purchaseBaseForPnL / totalPurchaseQty) * link.quantityUsed : 0;
                            const proportionalColdStorageCost = totalPurchaseQty > 0 ? (purchaseColdStorageForPnL / totalPurchaseQty) * link.quantityUsed : 0;
                            const proportionalPurchaseCost = proportionalBasePurchaseCost + proportionalColdStorageCost;
                            const purchaseBrokerageTotal = getBrokerageForPurchase(purchase);
                            
                            // Calculate proportional sale amount
                            const proportionalSaleAmount = totalSaleQty > 0 ? (saleNetAmount / totalSaleQty) * link.quantityUsed : 0;
                            var ratio = totalSaleQty > 0 ? (link.quantityUsed / totalSaleQty) : (1 / sale.linkedPurchases.length);
                            var deductionAllocation = totalDeductionForSale * ratio;
                            var adjustmentAllocation = totalAdjustmentForSale * ratio;
                            var saleBrokerageAllocation = saleBrokerageTotal * ratio;
                            var purchaseRatio = totalPurchaseQty > 0 ? (link.quantityUsed / totalPurchaseQty) : ratio;
                            var purchaseBrokerageAllocation = purchaseBrokerageTotal * purchaseRatio;
                            var brokerageAllocation = saleBrokerageAllocation + purchaseBrokerageAllocation;
                            const profitLoss = proportionalSaleAmount - proportionalPurchaseCost - deductionAllocation - brokerageAllocation;
                            
                            pnlRows.push({
                                purchaseDate: purchase.date,
                                purchaseInvoice: purchase.invoice,
                                purchaseSupplier: purchase.supplierName,
                                purchaseTotal: proportionalPurchaseCost,
                                purchaseBaseAmount: proportionalBasePurchaseCost,
                                coldStorageAmount: proportionalColdStorageCost,
                                saleDate: sale.date,
                                saleInvoice: sale.invoice,
                                saleCustomer: sale.customerName,
                                saleTotal: proportionalSaleAmount,
                                profitLoss: profitLoss,
                                quantityUsed: link.quantityUsed,
                                deductionsAmount: deductionAllocation,
                                adjustmentAmount: adjustmentAllocation,
                                brokerageAmount: brokerageAllocation
                            });
                        }
                    });
                } else {
                    // Sale without linked purchases - show as standalone
                    var standaloneSaleBrokerage = saleBrokerageTotal;
                    pnlRows.push({
                        purchaseDate: null,
                        purchaseInvoice: null,
                        purchaseSupplier: null,
                        purchaseTotal: 0,
                        purchaseBaseAmount: 0,
                        coldStorageAmount: 0,
                        saleDate: sale.date,
                        saleInvoice: sale.invoice,
                        saleCustomer: sale.customerName,
                        saleTotal: saleNetAmount,
                        profitLoss: saleNetAmount - totalDeductionForSale - standaloneSaleBrokerage,
                        quantityUsed: null,
                        deductionsAmount: totalDeductionForSale,
                        adjustmentAmount: totalAdjustmentForSale,
                        brokerageAmount: standaloneSaleBrokerage
                    });
                }
            });
            
            // Add unlinked purchases (purchases not linked to any sale)
            const linkedPurchaseIds = new Set();
            filteredSales.forEach(sale => {
                if (sale.linkedPurchases) {
                    sale.linkedPurchases.forEach(link => {
                        linkedPurchaseIds.add(String(link.purchaseId));
                    });
                }
            });
            
            filteredPurchases.forEach(purchase => {
                if (!linkedPurchaseIds.has(String(purchase.id))) {
                    const purchaseBaseTotal = (purchase.grandTotal || purchase.total || 0) + (parseFloat(purchase.advance) || 0); // exclude invoice advance from P&L
                    const coldStorageTotal = getPurchaseColdStorageTotal(purchase);
                    const purchaseTotal = purchaseBaseTotal + coldStorageTotal;
                    const purchaseBrokerage = getBrokerageForPurchase(purchase);
                    pnlRows.push({
                        purchaseDate: purchase.date,
                        purchaseInvoice: purchase.invoice,
                        purchaseSupplier: purchase.supplierName,
                        purchaseTotal: purchaseTotal,
                        purchaseBaseAmount: purchaseBaseTotal,
                        coldStorageAmount: coldStorageTotal,
                        saleDate: null,
                        saleInvoice: null,
                        saleCustomer: null,
                        saleTotal: 0,
                        profitLoss: -(purchaseTotal + purchaseBrokerage),
                        quantityUsed: null,
                        deductionsAmount: 0,
                        adjustmentAmount: 0,
                        brokerageAmount: purchaseBrokerage
                    });
                }
            });

            // Add standalone brokerage rows for entries not tied to any displayed invoice row.
            var representedBrokerage = pnlRows.reduce(function(sum, row) {
                return sum + (parseFloat(row.brokerageAmount) || 0);
            }, 0);
            var brokerageRemainder = totalBrokerage - representedBrokerage;
            if (Math.abs(brokerageRemainder) > 0.05) {
                pnlRows.push({
                    purchaseDate: null,
                    purchaseInvoice: null,
                    purchaseSupplier: null,
                    purchaseTotal: 0,
                    purchaseBaseAmount: 0,
                    coldStorageAmount: 0,
                    saleDate: null,
                    saleInvoice: null,
                    saleCustomer: null,
                    saleTotal: 0,
                    profitLoss: -brokerageRemainder,
                    quantityUsed: null,
                    deductionsAmount: 0,
                    adjustmentAmount: 0,
                    brokerageAmount: brokerageRemainder
                });
            }
            
            // Sort by date (purchase date or sale date)
            pnlRows.sort((a, b) => {
                const dateA = a.purchaseDate || a.saleDate || '';
                const dateB = b.purchaseDate || b.saleDate || '';
                return dateA.localeCompare(dateB);
            });
            
            // Store for pagination
            currentPnLData = pnlRows;
            currentPnLPurchaseSummary = buildPnLPurchaseSummary(pnlRows);
            paginationState.pnl.currentPage = 1; // Reset to first page
            
            // Render the table with pagination
            renderPnLTable(pnlRows);
            renderPnLPurchaseSummary(currentPnLPurchaseSummary);
            switchPnLTab('detailed');
            
            // Show export button after generating report
            document.getElementById('exportPnLBtn').style.display = 'block';
        }

        function buildPnLPurchaseSummary(pnlRows) {
            const grouped = {};
            (pnlRows || []).forEach(function(row) {
                const invoice = row.purchaseInvoice || '-';
                const key = invoice + '|' + (row.purchaseSupplier || '-');
                if (!grouped[key]) {
                    grouped[key] = {
                        purchaseInvoice: invoice,
                        purchaseSupplier: row.purchaseSupplier || '-',
                        purchaseTotal: 0,
                        coldStorageAmount: 0,
                        saleTotal: 0,
                        profitLoss: 0,
                        linkedSales: new Set()
                    };
                }
                grouped[key].purchaseTotal += (parseFloat(row.purchaseTotal) || 0);
                grouped[key].coldStorageAmount += (parseFloat(row.coldStorageAmount) || 0);
                grouped[key].saleTotal += (parseFloat(row.saleTotal) || 0);
                grouped[key].profitLoss += (parseFloat(row.profitLoss) || 0);
                if (row.saleInvoice && row.saleInvoice !== '-') grouped[key].linkedSales.add(row.saleInvoice);
            });
            return Object.keys(grouped).map(function(k) {
                const g = grouped[k];
                return {
                    purchaseInvoice: g.purchaseInvoice,
                    purchaseSupplier: g.purchaseSupplier,
                    purchaseTotal: +g.purchaseTotal.toFixed(2),
                    coldStorageAmount: +g.coldStorageAmount.toFixed(2),
                    saleTotal: +g.saleTotal.toFixed(2),
                    profitLoss: +g.profitLoss.toFixed(2),
                    linkedSalesCount: g.linkedSales.size,
                    linkedSalesInvoices: Array.from(g.linkedSales).sort(function(a, b) {
                        return String(a).localeCompare(String(b));
                    }).join(', ')
                };
            }).sort(function(a, b) {
                return String(a.purchaseInvoice).localeCompare(String(b.purchaseInvoice));
            });
        }

        function renderPnLPurchaseSummary(summaryRows) {
            const tbody = document.getElementById('pnlPurchaseSummaryBody');
            if (!tbody) return;
            const rows = summaryRows || [];
            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">Generate a report to view purchase-wise summary</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(function(r) {
                return '<tr class="border-b border-slate-200 hover:bg-slate-50">' +
                    '<td class="px-4 py-3 font-medium text-slate-800">' + escapeHtml(r.purchaseInvoice) + '</td>' +
                    '<td class="px-4 py-3 text-slate-700">' + escapeHtml(r.purchaseSupplier) + '</td>' +
                    '<td class="px-4 py-3 text-slate-700">' + escapeHtml(r.linkedSalesInvoices || '-') + '</td>' +
                    '<td class="px-4 py-3 text-right text-slate-700">' + RU + r.purchaseTotal.toFixed(2) + '</td>' +
                    '<td class="px-4 py-3 text-right text-cyan-700 font-medium">' + RU + (r.coldStorageAmount || 0).toFixed(2) + '</td>' +
                    '<td class="px-4 py-3 text-right text-slate-700">' + RU + r.saleTotal.toFixed(2) + '</td>' +
                    '<td class="px-4 py-3 text-right ' + (r.profitLoss >= 0 ? 'text-green-600' : 'text-red-600') + ' font-semibold">' +
                    (r.profitLoss >= 0 ? '+' : '') + RU + r.profitLoss.toFixed(2) + '</td>' +
                '</tr>';
            }).join('');
        }

        function onPnLViewModeChange() {
            renderPnLTable(currentPnLData || []);
        }
        
        function renderPnLTable(pnlRows) {
            // Update P&L details table
            const tbody = document.getElementById('pnlDetails');
            tbody.innerHTML = '';
            
            if (pnlRows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No P&L data to display</td></tr>';
                document.getElementById('pnlPagination').innerHTML = '';
                return;
            }
            
            // Optional grouped view
            const groupedToggle = document.getElementById('pnlGroupByPurchase');
            const useGrouped = !!(groupedToggle && groupedToggle.checked);
            const sourceRows = useGrouped
                ? buildPnLPurchaseSummary(pnlRows).map(function(g) {
                    return {
                        purchaseDate: '-',
                        purchaseInvoice: g.purchaseInvoice,
                        purchaseSupplier: g.purchaseSupplier,
                        purchaseTotal: g.purchaseTotal,
                        purchaseBaseAmount: (g.purchaseTotal || 0) - (g.coldStorageAmount || 0),
                        coldStorageAmount: g.coldStorageAmount || 0,
                        saleDate: '-',
                        saleInvoice: g.linkedSalesInvoices || '-',
                        saleCustomer: '-',
                        saleTotal: g.saleTotal,
                        profitLoss: g.profitLoss,
                        quantityUsed: null,
                        deductionsAmount: 0,
                        adjustmentAmount: 0,
                        brokerageAmount: 0
                    };
                })
                : pnlRows;

            // Get paginated data
            const { currentPage, pageSize } = paginationState.pnl;
            const paginatedRows = getPaginatedData(sourceRows, currentPage, pageSize);
            
            paginatedRows.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-200 hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseDate || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseInvoice || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseSupplier || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30 border-r-2 border-r-slate-300">
                        ${row.purchaseTotal > 0 ? `${RU}${row.purchaseTotal.toFixed(2)}` : '-'}
                        ${(row.coldStorageAmount || 0) > 0 ? `<br><small class="text-xs text-cyan-700">Cold: ${RU}${(row.coldStorageAmount || 0).toFixed(2)}</small>` : ''}
                        ${(row.purchaseBaseAmount || 0) > 0 ? `<br><small class="text-xs text-slate-500">Base: ${RU}${(row.purchaseBaseAmount || 0).toFixed(2)}</small>` : ''}
                    </td>
                    <td class="px-4 py-3 bg-green-50/30">${row.saleDate || '-'}</td>
                    <td class="px-4 py-3 bg-green-50/30">${row.saleInvoice || '-'}</td>
                    <td class="px-4 py-3 bg-green-50/30">${row.saleCustomer || '-'}</td>
                    <td class="px-4 py-3 bg-green-50/30 border-r-2 border-r-slate-300">${row.saleTotal > 0 ? `${RU}${row.saleTotal.toFixed(2)}` : '-'}</td>
                    <td class="px-4 py-3 bg-amber-50/30 ${row.profitLoss >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}">
                        ${row.profitLoss >= 0 ? '+' : ''}${RU}${row.profitLoss.toFixed(2)}
                        ${row.quantityUsed ? `<br><small class="text-xs text-slate-500">(${row.quantityUsed} kg)</small>` : ''}
                        ${(row.deductionsAmount || 0) > 0 ? `<br><small class="text-xs text-red-600">Ded: ${RU}${(row.deductionsAmount || 0).toFixed(2)}</small>` : ''}
                        ${(row.brokerageAmount || 0) > 0 ? `<br><small class="text-xs text-indigo-600">Brkg: ${RU}${(row.brokerageAmount || 0).toFixed(2)}</small>` : ''}
                        ${(row.adjustmentAmount || 0) > 0 ? `<br><small class="text-xs text-slate-600">Adj: ${RU}${(row.adjustmentAmount || 0).toFixed(2)}</small>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Calculate totals from all data (not just paginated) - net profit is sum of row profit (already includes deductions)
            const totalCosts = sourceRows.reduce((sum, row) => sum + (row.purchaseTotal || 0), 0);
            const totalRevenue = sourceRows.reduce((sum, row) => sum + (row.saleTotal || 0), 0);
            const netProfit = sourceRows.reduce((sum, row) => sum + (row.profitLoss || 0), 0);
            
            // Add grand total row only on last page
            const totalPages = Math.ceil(sourceRows.length / pageSize);
            if (currentPage === totalPages) {
                const grandTotalRow = document.createElement('tr');
                grandTotalRow.className = 'bg-slate-200 font-bold text-lg';
                grandTotalRow.innerHTML = `
                    <td colspan="3" class="px-4 py-4 text-right bg-blue-100">GRAND TOTAL:</td>
                    <td class="px-4 py-4 bg-blue-100 border-r-2 border-r-slate-400">${RU}${totalCosts.toFixed(2)}</td>
                    <td colspan="3" class="px-4 py-4 bg-green-100"></td>
                    <td class="px-4 py-4 bg-green-100 border-r-2 border-r-slate-400">${RU}${totalRevenue.toFixed(2)}</td>
                    <td class="px-4 py-4 bg-amber-100 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${netProfit >= 0 ? '+' : ''}${RU}${netProfit.toFixed(2)}
                    </td>
                `;
                tbody.appendChild(grandTotalRow);
            }
            
            // Render pagination
            renderPagination(
                'pnlPagination',
                sourceRows.length,
                currentPage,
                pageSize,
                'changePnlPage',
                'changePnlPageSize'
            );
        }

        function exportPnLReport() {
            var filterTypeEl = document.getElementById('pnlFilterType');
            var filterType = filterTypeEl ? filterTypeEl.value : '';
            var filterValueEl = document.getElementById('pnlFilterValue');
            var filterValue = filterValueEl ? filterValueEl.value : '';
            
            var filterName = 'All';
            if (filterType && filterValue) {
                if (filterType === 'last3months') {
                    var date = new Date(filterValue + '-01');
                    filterName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                }
            }
            
            var csv = '\uFEFF';
            csv += 'P&L Statement Report\n';
            csv += 'Generated on,' + new Date().toLocaleDateString() + '\n';
            csv += 'Filter,' + (filterType ? filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('last3months', 'Last 3 Months') : 'All Transactions') + '\n';
            csv += 'Filter Value,' + filterName + '\n\n';
            
            var totalRevenueEl = document.getElementById('totalRevenue');
            var totalCostsEl = document.getElementById('totalCosts');
            var netProfitEl = document.getElementById('netProfit');
            var basePurchaseCostEl = document.getElementById('pnlBasePurchaseCost');
            var coldStorageCostEl = document.getElementById('pnlColdStorageCost');
            var effectivePurchaseCostEl = document.getElementById('pnlEffectivePurchaseCost');
            var coldDamageLossEl = document.getElementById('pnlColdDamageLoss');
            var coldDamageRecoveryEl = document.getElementById('pnlColdDamageRecovery');
            var companyColdMoveExpenseEl = document.getElementById('pnlCompanyColdMoveExpense');
            var totalRevenue = totalRevenueEl ? (totalRevenueEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var totalCosts = totalCostsEl ? (totalCostsEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var netProfit = netProfitEl ? (netProfitEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var basePurchaseCost = basePurchaseCostEl ? (basePurchaseCostEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var coldStorageCost = coldStorageCostEl ? (coldStorageCostEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var effectivePurchaseCost = effectivePurchaseCostEl ? (effectivePurchaseCostEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var coldDamageLoss = coldDamageLossEl ? (coldDamageLossEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var coldDamageRecovery = coldDamageRecoveryEl ? (coldDamageRecoveryEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var companyColdMoveExpense = companyColdMoveExpenseEl ? (companyColdMoveExpenseEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            csv += 'SUMMARY\n';
            csv += 'Total Revenue,' + totalRevenue + '\n';
            csv += 'Total Costs,' + totalCosts + '\n';
            csv += 'Base Purchase Cost,' + basePurchaseCost + '\n';
            csv += 'Cold Storage Cost,' + coldStorageCost + '\n';
            csv += 'Effective Purchase Cost,' + effectivePurchaseCost + '\n';
            csv += 'Company Cold Move Expense,' + companyColdMoveExpense + '\n';
            csv += 'Cold Damage Loss (Our Share),' + coldDamageLoss + '\n';
            csv += 'Cold Damage Recovery (Vendor Share),' + coldDamageRecovery + '\n';
            csv += 'Net Profit,' + netProfit + '\n\n';
            
            csv += 'DETAILED P&L STATEMENT\n';
            csv += 'Purchase Date,Purchase Invoice,Supplier,Purchase Total,Sale Date,Sale Invoice,Customer,Sale Total,Profit/Loss,Deductions,Adjustment\n';
            
            var data = (typeof currentPnLData !== 'undefined' && currentPnLData) ? currentPnLData : [];
            if (data.length === 0) {
                alert('No P&L data to export. Please generate the P&L report first (select a filter and ensure data is loaded).');
                return;
            }
            data.forEach(function(row) {
                var purchaseTotal = (row.purchaseTotal != null && row.purchaseTotal > 0) ? row.purchaseTotal.toFixed(2) : '-';
                var saleTotal = (row.saleTotal != null && row.saleTotal > 0) ? row.saleTotal.toFixed(2) : '-';
                var profitLoss = (row.profitLoss != null) ? row.profitLoss.toFixed(2) : '-';
                var ded = (row.deductionsAmount != null && row.deductionsAmount > 0) ? row.deductionsAmount.toFixed(2) : '';
                var adj = (row.adjustmentAmount != null && row.adjustmentAmount > 0) ? row.adjustmentAmount.toFixed(2) : '';
                csv += '"' + (row.purchaseDate || '-') + '","' + (row.purchaseInvoice || '-') + '","' + (row.purchaseSupplier || '-') + '",' + purchaseTotal + ',"' + (row.saleDate || '-') + '","' + (row.saleInvoice || '-') + '","' + (row.saleCustomer || '-') + '",' + saleTotal + ',' + profitLoss + ',' + ded + ',' + adj + '\n';
            });

            var summaryRows = (typeof currentPnLPurchaseSummary !== 'undefined' && currentPnLPurchaseSummary) ? currentPnLPurchaseSummary : [];
            csv += '\nPURCHASE-WISE P&L SUMMARY\n';
            csv += 'Purchase Invoice,Supplier,Sales Invoices,Purchase Total,Sale Total,Net Profit/Loss\n';
            summaryRows.forEach(function(r) {
                csv += '"' + (r.purchaseInvoice || '-') + '","' + (r.purchaseSupplier || '-') + '",' +
                    '"' + ((r.linkedSalesInvoices || '-').replace(/"/g, '""')) + '",' +
                    (r.purchaseTotal != null ? r.purchaseTotal.toFixed(2) : '0.00') + ',' +
                    (r.saleTotal != null ? r.saleTotal.toFixed(2) : '0.00') + ',' +
                    (r.profitLoss != null ? r.profitLoss.toFixed(2) : '0.00') + '\n';
            });
            
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'PnL_Report_' + filterName.replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            alert('P&L Report exported successfully!');
        }
function onPnLFilterChange() {
  const filterType = document.getElementById('pnlFilterType').value;
  const customRangeDiv = document.getElementById('customDateRange');

  // Show or hide the custom date range inputs
  if (customRangeDiv) {
    customRangeDiv.style.display = (filterType === 'custom') ? 'flex' : 'none';
  }

  // Automatically refresh report if not custom
  if (filterType && filterType !== 'custom') {
    generatePnL();
  }
}
        // Customer balance (receivable) for credit limit checks
        function getCustomerBalance(customerId, excludeSaleId) {
            let balance = 0;
            if (appData.openingBalances) {
                appData.openingBalances
                    .filter(ob => ob.entityType === 'customer' && String(ob.entityId) === String(customerId))
                    .forEach(ob => { balance += ob.amount || 0; });
            }
            (appData.sales || []).filter(s => s.customerId == customerId && s.id !== excludeSaleId).forEach(s => {
                balance += s.grandTotal || s.total || 0;
            });
            (appData.deductions || []).filter(d => d.customerId == customerId).forEach(d => {
                balance -= d.amount || 0;
            });
            (appData.payments || []).filter(p => {
                if (p.type === 'ledger_receipt' && p.entityType === 'customer' && p.entityId == customerId) return true;
                if (p.type === 'sale') {
                    const sale = (appData.sales || []).find(s => s.id === p.invoiceId);
                    return sale && sale.customerId == customerId;
                }
                return false;
            }).forEach(p => { balance -= p.amount || 0; });
            return balance;
        }

        // Ledger functions
        function updateLedgerOptions() {
            const type = document.getElementById('ledgerType').value;
            const entitySelect = document.getElementById('ledgerEntity');
            const entityInput = document.getElementById('ledgerEntityInput');
            
            entitySelect.innerHTML = '<option value="">Select Entity</option>';
            getLedgerEntitiesForType(type).forEach(function(entity) {
                entitySelect.innerHTML += `<option value="${entity.id}">${entity.name}</option>`;
            });
            entitySelect.value = '';
            if (entityInput) entityInput.value = '';
            const entityDropdown = document.getElementById('ledgerEntityDropdown');
            if (entityDropdown) {
                entityDropdown.innerHTML = '';
                entityDropdown.classList.add('hidden');
                entityDropdown.dataset.activeIndex = '0';
            }
            syncLedgerEntityDisplay();
        }

        function generateLedger() {
            const type = document.getElementById('ledgerType').value;
            const entityId = document.getElementById('ledgerEntity').value;
            
            if (!type || !entityId) {
                alert('Please select ledger type and entity');
                return;
            }
            
            const tbody = document.getElementById('ledgerEntries');
            tbody.innerHTML = '';
            
            let entries = [];
            let balance = 0;
            let entityName = '';
            const ledgerEntities = getLedgerEntitiesForType(type);
            const selectedLedgerEntity = ledgerEntities.find(function(e) { return String(e.id) === String(entityId); }) || null;
            
            // Get entity name
            if (type === 'supplier') {
                const supplier = appData.suppliers.find(s => s.id == entityId);
                entityName = supplier ? supplier.name : 'Unknown Supplier';
            } else if (type === 'customer') {
                const customer = appData.customers.find(c => c.id == entityId);
                entityName = customer ? customer.name : 'Unknown Customer';
            } else if (type === 'broker') {
                const broker = appData.brokers.find(b => b.id == entityId);
                entityName = broker ? broker.name : 'Unknown Broker';
            } else if (type === 'cold_storage') {
                entityName = selectedLedgerEntity ? (selectedLedgerEntity.name || 'Unknown Cold Storage') : 'Unknown Cold Storage';
            }
            
            if (type === 'supplier') {
                // Add opening balance entries first (if any)
                if (appData.openingBalances) {
                    appData.openingBalances
                        .filter(ob => ob.entityType === 'supplier' && String(ob.entityId) === String(entityId))
                        .forEach(opening => {
                            entries.push({
                                id: `opening_${opening.id}`,
                                type: 'opening',
                                sourceId: opening.id,
                                date: opening.date,
                                description: `Opening Balance - ${opening.description || 'Old Purchases Pending'}`,
                                invoice: opening.reference || 'Opening',
                                debit: opening.amount,
                                credit: 0,
                                balance: 0, // Will be calculated after sorting
                                canDelete: false
                            });
                        });
                }
                
                // Add purchase entries (debit to supplier)
                appData.purchases
                    .filter(p => p.supplierId == entityId)
                    .forEach(purchase => {
                        entries.push({
                            id: `purchase_${purchase.id}`,
                            type: 'purchase',
                            sourceId: purchase.id,
                            date: purchase.date,
                            description: `Purchase - ${purchase.itemName || 'Multiple Items'}`,
                            invoice: purchase.invoice,
                            debit: purchase.grandTotal || purchase.total,
                            credit: 0,
                            balance: 0, // Will be calculated after sorting
                            canDelete: true
                        });
                    });
                
                // Add adjustment entries (credit to supplier - reduces balance)
                if (appData.adjustments) {
                    appData.adjustments
                        .filter(adj => adj.type === 'supplier_adjustment' && adj.entityId == entityId)
                        .forEach(adjustment => {
                            entries.push({
                                id: `adjustment_${adjustment.id}`,
                                type: 'adjustment',
                                sourceId: adjustment.id,
                                date: adjustment.date,
                                description: `Adjustment - ${adjustment.reference}`,
                                invoice: '',
                                debit: 0,
                                credit: adjustment.amount,
                                balance: 0, // Will be calculated after sorting
                                canDelete: true
                            });
                        });
                }
                
                // Add payment entries (credit to supplier - reduces balance)
                appData.payments
                    .filter(p => (p.type === 'purchase' && appData.purchases.find(pur => pur.id === p.invoiceId && pur.supplierId == entityId)) || 
                                (p.type === 'ledger_payment' && p.entityType === 'supplier' && p.entityId == entityId))
                    .forEach(payment => {
                        entries.push({
                            id: `payment_${payment.id}`,
                            type: 'payment',
                            sourceId: payment.id,
                            date: payment.date,
                            description: `Payment - ${payment.mode}${payment.bankAccountName ? ' (' + payment.bankAccountName + ')' : ''} ${payment.paidThrough ? 'via ' + payment.paidThrough : ''}`,
                            invoice: payment.invoice,
                            debit: 0,
                            credit: payment.amount,
                            balance: 0, // Will be calculated after sorting
                            canDelete: true
                        });
                    });
            } else if (type === 'customer') {
                // Add opening balance entries first (if any)
                if (appData.openingBalances) {
                    appData.openingBalances
                        .filter(ob => ob.entityType === 'customer' && String(ob.entityId) === String(entityId))
                        .forEach(opening => {
                            entries.push({
                                id: `opening_${opening.id}`,
                                type: 'opening',
                                sourceId: opening.id,
                                date: opening.date,
                                description: `Opening Balance - ${opening.description || 'Old Sales Pending'}`,
                                invoice: opening.reference || 'Opening',
                                debit: opening.amount,
                                credit: 0,
                                balance: 0, // Will be calculated after sorting
                                canDelete: false
                            });
                        });
                }
                
                // Add sales entries (DEBIT to customer - they owe us)
                appData.sales
                    .filter(s => s.customerId == entityId)
                    .forEach(sale => {
                        entries.push({
                            id: `sale_${sale.id}`,
                            type: 'sale',
                            sourceId: sale.id,
                            date: sale.date,
                            description: `Sale - ${sale.itemName || 'Multiple Items'}`,
                            invoice: sale.invoice,
                            debit: sale.grandTotal || sale.total,
                            credit: 0,
                            balance: 0, // Will be calculated after sorting
                            canDelete: true
                        });
                    });
                
                // Add deduction entries (CREDIT to customer - reduces what they owe)
                appData.deductions
                    .filter(d => d.customerId == entityId)
                    .forEach(deduction => {
                        entries.push({
                            id: `deduction_${deduction.id}`,
                            type: 'deduction',
                            sourceId: deduction.id,
                            date: deduction.date,
                            description: `Deduction - ${deduction.reason}`,
                            invoice: deduction.invoice,
                            debit: 0,
                            credit: deduction.amount,
                            balance: 0, // Will be calculated after sorting
                            canDelete: true
                        });
                    });
                
                // Add payment entries (CREDIT to customer - they paid us)
                appData.payments
                    .filter(p => (p.type === 'sale' && appData.sales.find(sale => sale.id === p.invoiceId && sale.customerId == entityId)) || 
                                (p.type === 'ledger_receipt' && p.entityType === 'customer' && p.entityId == entityId))
                    .forEach(payment => {
                        entries.push({
                            id: `payment_${payment.id}`,
                            type: 'payment',
                            sourceId: payment.id,
                            date: payment.date,
                            description: `Receipt - ${payment.mode}${payment.bankAccountName ? ' (' + payment.bankAccountName + ')' : ''} ${payment.paidThrough ? 'via ' + payment.paidThrough : ''}`,
                            invoice: payment.invoice,
                            debit: 0,
                            credit: payment.amount,
                            balance: 0, // Will be calculated after sorting
                            canDelete: true
                        });
                    });
            } else if (type === 'broker') {
                // Add brokerage entries
                appData.brokerage
                    .filter(b => b.brokerId == entityId)
                    .forEach(entry => {
                        balance += entry.amount;
                        entries.push({
                            id: `brokerage_${entry.id}`,
                            type: 'brokerage',
                            sourceId: entry.id,
                            date: entry.date,
                            description: `${entry.type} - ${entry.itemName}`,
                            invoice: entry.reference,
                            debit: entry.amount,
                            credit: 0,
                            balance: balance,
                            canDelete: true
                        });
                    });
                
                // Add adjustment entries (credit to broker - reduces balance)
                if (appData.adjustments) {
                    appData.adjustments
                        .filter(adj => adj.type === 'broker_adjustment' && adj.entityId == entityId)
                        .forEach(adjustment => {
                            balance -= adjustment.amount;
                            entries.push({
                                id: `adjustment_${adjustment.id}`,
                                type: 'adjustment',
                                sourceId: adjustment.id,
                                date: adjustment.date,
                                description: `Adjustment - ${adjustment.reference}`,
                                invoice: '',
                                debit: 0,
                                credit: adjustment.amount,
                                balance: balance,
                                canDelete: true
                            });
                        });
                }
                
                // Add payment entries (credit to broker - reduces balance)
                appData.payments
                    .filter(p => (p.type === 'brokerage' && appData.brokerage.find(br => br.id === p.invoiceId && br.brokerId == entityId)) || 
                                (p.type === 'ledger_payment' && p.entityType === 'broker' && p.entityId == entityId))
                    .forEach(payment => {
                        balance -= payment.amount;
                        entries.push({
                            id: `payment_${payment.id}`,
                            type: 'payment',
                            sourceId: payment.id,
                            date: payment.date,
                            description: `Payment - ${payment.mode}${payment.bankAccountName ? ' (' + payment.bankAccountName + ')' : ''} ${payment.paidThrough ? 'via ' + payment.paidThrough : ''}`,
                            invoice: payment.invoice,
                            debit: 0,
                            credit: payment.amount,
                            balance: balance,
                            canDelete: true
                        });
                    });
            } else if (type === 'cold_storage') {
                const selectedMatchKey = normalizedName((selectedLedgerEntity && selectedLedgerEntity.name) || '');
                const selectedMasterId = String(selectedLedgerEntity && selectedLedgerEntity.masterId || '');
                const matchesLot = function(lot) {
                    if (!lot) return false;
                    if (selectedMasterId && String(lot.coldStorageId || '') === selectedMasterId) return true;
                    return normalizedName(lot.coldStorageName) === selectedMatchKey;
                };
                const lotById = {};
                (appData.coldStorageLots || []).forEach(function(lot) {
                    lotById[String(lot.id)] = lot;
                });

                // Debit entries: charges raised for this cold storage.
                (appData.coldStorageMovements || [])
                    .filter(function(m) {
                        const moveType = String(m.type || '');
                        if (!['move_in', 'charge_add'].includes(moveType)) return false;
                        const lot = lotById[String(m.lotId || '')];
                        if (lot) return matchesLot(lot);
                        return normalizedName(m.coldStorageName) === selectedMatchKey;
                    })
                    .forEach(function(m) {
                        const label = String(m.type || '') === 'move_in' ? 'Move to cold charge' : 'Periodic charge';
                        entries.push({
                            id: `cold_charge_${m.id}`,
                            type: 'cold_charge',
                            sourceId: m.id,
                            date: m.date || '',
                            description: `${label} - ${m.itemName || 'Lot'}`,
                            invoice: m.reference || (`LOT-${m.lotId || '-'}`),
                            debit: Math.max(0, parseFloat(m.amount) || 0),
                            credit: 0,
                            balance: 0,
                            canDelete: false
                        });
                    });

                // Credit entries: payments made to cold storage.
                (appData.payments || [])
                    .filter(function(p) {
                        if (String(p.type || '').toLowerCase() !== 'cold_storage_payment') return false;
                        const lot = lotById[String(p.invoiceId || '')];
                        if (lot) return matchesLot(lot);
                        return normalizedName(p.party) === selectedMatchKey;
                    })
                    .forEach(function(payment) {
                        entries.push({
                            id: `payment_${payment.id}`,
                            type: 'payment',
                            sourceId: payment.id,
                            date: payment.date || '',
                            description: `Payment - ${payment.mode || ''}${payment.paidThrough ? ' via ' + payment.paidThrough : ''}`,
                            invoice: payment.invoice || (`COLD-${payment.invoiceId || '-'}`),
                            debit: 0,
                            credit: Math.max(0, parseFloat(payment.amount) || 0),
                            balance: 0,
                            canDelete: true
                        });
                    });

                // Credit entries: vendor share damage recovery (if recorded).
                (appData.coldStorageDamages || [])
                    .filter(function(dmg) {
                        if ((parseFloat(dmg.vendorShareAmount) || 0) <= 0) return false;
                        const lot = lotById[String(dmg.lotId || '')];
                        if (lot) return matchesLot(lot);
                        return normalizedName(dmg.coldStorageName) === selectedMatchKey;
                    })
                    .forEach(function(damage) {
                        entries.push({
                            id: `cold_damage_recovery_${damage.id}`,
                            type: 'cold_recovery',
                            sourceId: damage.id,
                            date: damage.date || '',
                            description: `Damage recovery - ${damage.itemName || 'Lot'}`,
                            invoice: damage.reference || (`LOT-${damage.lotId || '-'}`),
                            debit: 0,
                            credit: Math.max(0, parseFloat(damage.vendorShareAmount) || 0),
                            balance: 0,
                            canDelete: false
                        });
                    });
            }
            
            finalizeLedgerEntriesInChronologicalOrder(entries);
            balance = entries.length ? entries[entries.length - 1].balance : 0;
            
            // Date range filter
            const fromDateEl = document.getElementById('ledgerFromDate');
            const toDateEl = document.getElementById('ledgerToDate');
            const fromDate = fromDateEl && fromDateEl.value ? fromDateEl.value : '';
            const toDate = toDateEl && toDateEl.value ? toDateEl.value : '';
            if (fromDate || toDate) {
                entries = entries.filter(e => {
                    if (fromDate && e.date < fromDate) return false;
                    if (toDate && e.date > toDate) return false;
                    return true;
                });
            }
            
            // Update balance display
            const balanceSection = document.getElementById('ledgerBalanceSection');
            const entityNameElement = document.getElementById('ledgerEntityName');
            const balanceElement = document.getElementById('ledgerBalance');
            const balanceTypeElement = document.getElementById('ledgerBalanceType');
            const payButton = document.getElementById('ledgerPayButton');
            const receiveButton = document.getElementById('ledgerReceiveButton');
            
            balanceSection.style.display = 'block';
            entityNameElement.textContent = entityName;
            balanceElement.textContent = `${RU}${balance.toFixed(2)}`;
            
            // Show appropriate buttons based on ledger type and balance
            payButton.style.display = 'none';
            receiveButton.style.display = 'none';
            
            if (type === 'supplier' && balance > 0) {
                balanceTypeElement.textContent = 'Amount Payable';
                balanceElement.className = 'text-2xl font-bold text-red-600';
                payButton.style.display = 'block';
            } else if (type === 'customer' && balance > 0) {
                balanceTypeElement.textContent = 'Amount Receivable';
                balanceElement.className = 'text-2xl font-bold text-green-600';
                receiveButton.style.display = 'block';
            } else if (type === 'broker' && balance > 0) {
                balanceTypeElement.textContent = 'Brokerage Payable';
                balanceElement.className = 'text-2xl font-bold text-red-600';
                payButton.style.display = 'block';
            } else if (type === 'cold_storage' && balance > 0) {
                balanceTypeElement.textContent = 'Cold Storage Payable';
                balanceElement.className = 'text-2xl font-bold text-red-600';
                payButton.style.display = 'block';
            } else {
                balanceTypeElement.textContent = 'Current Balance';
                balanceElement.className = 'text-2xl font-bold text-blue-600';
            }
            
            // Store current ledger data for payment functions
            window.currentLedgerData = {
                type: type,
                entityId: entityId,
                entityName: entityName,
                balance: balance
            };
            
            ledgerTableSort.column = 'date';
            ledgerTableSort.direction = 'desc';
            applyLedgerTableSort(entries);

            // Store entries for pagination
            currentLedgerData = entries;
            paginationState.ledger.currentPage = 1; // Reset to first page
            
            // Render the table with pagination
            renderLedgerTable(entries);
            if (typeof renderLedgerSummaryCards === 'function') renderLedgerSummaryCards();
            
            var printLedgerBtn = document.getElementById('printLedgerBtn');
            var sendLedgerWhatsAppBtn = document.getElementById('sendLedgerWhatsAppBtn');
            if (entries.length === 0) {
                balanceSection.style.display = 'none';
                document.getElementById('exportLedgerBtn').style.display = 'none';
                if (printLedgerBtn) printLedgerBtn.style.display = 'none';
                if (sendLedgerWhatsAppBtn) sendLedgerWhatsAppBtn.style.display = 'none';
            } else {
                document.getElementById('exportLedgerBtn').style.display = 'block';
                if (printLedgerBtn) printLedgerBtn.style.display = 'block';
                if (sendLedgerWhatsAppBtn) {
                    sendLedgerWhatsAppBtn.style.display = (type === 'supplier' || type === 'customer') ? 'block' : 'none';
                }
            }
        }
        
        function buildLedgerStatementHtml(entries, meta) {
            entries = Array.isArray(entries) ? entries : ((typeof currentLedgerData !== 'undefined' && Array.isArray(currentLedgerData)) ? currentLedgerData : []);
            const company = appData.company || {};
            const entityName = meta.entityName || document.getElementById('ledgerEntityName').textContent || 'Ledger';
            const balance = meta.balance != null ? meta.balance : 0;
            const ledgerType = meta.type || 'ledger';
            const typeLabel = ledgerType === 'supplier'
                ? 'Supplier'
                : ledgerType === 'customer'
                    ? 'Customer'
                    : ledgerType === 'cold_storage'
                        ? 'Cold Storage'
                        : 'Broker';
            const fromEl = document.getElementById('ledgerFromDate');
            const toEl = document.getElementById('ledgerToDate');
            const fromDate = fromEl && fromEl.value ? fromEl.value : '';
            const toDate = toEl && toEl.value ? toEl.value : '';
            const dateRangeText = (fromDate || toDate) ? ('Period: ' + (fromDate || '...') + ' to ' + (toDate || '...')) : 'All entries';
            let rowsHtml = entries.map(e => 
                '<tr><td class="inv-td">' + e.date + '</td><td class="inv-td">' + escapeHtml(e.description) + '</td><td class="inv-td">' + escapeHtml(e.invoice || '') + '</td><td class="inv-td text-right">' + (e.debit ? RU + e.debit.toFixed(2) : '-') + '</td><td class="inv-td text-right">' + (e.credit ? RU + e.credit.toFixed(2) : '-') + '</td><td class="inv-td text-right">' + RU + (e.balance || 0).toFixed(2) + '</td></tr>'
            ).join('');
            return `
                <html><head><title>Ledger - ${escapeHtml(entityName)}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
                    .inv-header { background: linear-gradient(135deg, #4f46e5 0%, #5b21b6 100%); color: #fff; text-align: center; padding: 20px; margin: -24px -24px 24px -24px; }
                    .inv-header h1 { margin: 0; font-size: 22px; }
                    .inv-header p { margin: 6px 0 0; font-size: 13px; opacity: 0.95; }
                    .inv-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                    .inv-table th { background: #4f46e5; color: #fff; padding: 10px; text-align: left; font-size: 12px; }
                    .inv-table td { border: 1px solid #e2e8f0; padding: 8px; font-size: 13px; }
                    .inv-td.text-right { text-align: right; }
                    .ledger-meta { margin-bottom: 16px; font-size: 13px; color: #64748b; }
                    .ledger-balance { margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; font-weight: 700; font-size: 16px; }
                </style></head><body>
                <div class="inv-header">
                    <h1>${escapeHtml(company.name || 'ITCO')}</h1>
                    ${company.address ? '<p>' + escapeHtml(company.address) + '</p>' : ''}
                    <p>${typeLabel} Ledger Statement</p>
                </div>
                <div class="ledger-meta">
                    <strong>${escapeHtml(entityName)}</strong><br>${dateRangeText}
                </div>
                <table class="inv-table">
                <thead><tr><th>Date</th><th>Description</th><th>Invoice</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                <tbody>${rowsHtml || '<tr><td colspan="6" class="inv-td text-center">No entries</td></tr>'}</tbody>
                </table>
                <div class="ledger-balance">Closing Balance: ${RU}${balance.toFixed(2)}</div>
                </body></html>
            `;
        }

        function printLedgerStatement() {
            const entries = typeof currentLedgerData !== 'undefined' && Array.isArray(currentLedgerData) ? currentLedgerData : [];
            const meta = window.currentLedgerData || {};
            const html = buildLedgerStatementHtml(entries, meta);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        }
        
        function renderLedgerTable(entries) {
            const tbody = document.getElementById('ledgerEntries');
            tbody.innerHTML = '';
            
            if (entries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No entries found for selected entity</td></tr>';
                document.getElementById('ledgerPagination').innerHTML = '';
                updateLedgerSortIndicators();
                return;
            }
            
            // Get paginated data
            const { currentPage, pageSize } = paginationState.ledger;
            const paginatedEntries = getPaginatedData(entries, currentPage, pageSize);
            
            // Populate table
            paginatedEntries.forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-200';
                row.innerHTML = `
                    <td class="px-4 py-3">${entry.date}</td>
                    <td class="px-4 py-3">${entry.description}</td>
                    <td class="px-4 py-3">${entry.invoice}</td>
                    <td class="px-4 py-3">${entry.debit ? RU + entry.debit.toFixed(2) : '-'}</td>
                    <td class="px-4 py-3">${entry.credit ? RU + entry.credit.toFixed(2) : '-'}</td>
                    <td class="px-4 py-3">${RU}${entry.balance.toFixed(2)}</td>
                    <td class="px-4 py-3">
                        ${entry.canDelete ? `<button onclick="deleteLedgerEntry('${entry.id}', '${entry.type}', ${entry.sourceId})" class="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>` : '-'}
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Render pagination
            renderPagination(
                'ledgerPagination',
                entries.length,
                currentPage,
                pageSize,
                'changeLedgerPage',
                'changeLedgerPageSize'
            );
            updateLedgerSortIndicators();
        }

        // Reports functions
        var currentReportType = '';
        function getReportDateRange() {
            var fromEl = document.getElementById('reportDateFrom');
            var toEl = document.getElementById('reportDateTo');
            return { from: fromEl ? fromEl.value : '', to: toEl ? toEl.value : '' };
        }
        function applyReportDateRange() {
            var reportType = currentReportType || (document.getElementById('exportBtn') && document.getElementById('exportBtn').getAttribute('data-report-type'));
            if (reportType) showReport(reportType);
        }
        function setDefaultReportDates() {
            var d = new Date();
            var fromEl = document.getElementById('reportDateFrom');
            var toEl = document.getElementById('reportDateTo');
            if (fromEl && !fromEl.value) {
                fromEl.value = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
            }
            if (toEl && !toEl.value) toEl.value = d.toISOString().slice(0, 10);
        }
        function applyReportDatePreset(value) {
            var fromEl = document.getElementById('reportDateFrom');
            var toEl = document.getElementById('reportDateTo');
            var presetEl = document.getElementById('reportDatePreset');
            if (!fromEl || !toEl || !value) return;
            var d = new Date();
            var from, to;
            switch (value) {
                case 'this_month':
                    from = new Date(d.getFullYear(), d.getMonth(), 1);
                    to = new Date();
                    break;
                case 'last_month':
                    from = new Date(d.getFullYear(), d.getMonth() - 1, 1);
                    to = new Date(d.getFullYear(), d.getMonth(), 0);
                    break;
                case 'last_3_months':
                    to = new Date();
                    from = new Date(to);
                    from.setMonth(from.getMonth() - 3);
                    break;
                case 'this_fy':
                    from = d.getMonth() >= 3 ? new Date(d.getFullYear(), 2, 1) : new Date(d.getFullYear() - 1, 2, 1);
                    to = new Date();
                    break;
                default: return;
            }
            fromEl.value = from.toISOString().slice(0, 10);
            toEl.value = to.toISOString().slice(0, 10);
            if (presetEl) presetEl.value = value;
            applyReportDateRange();
        }
        function showReport(reportType) {
            currentReportType = reportType;
            setDefaultReportDates();
            var range = getReportDateRange();
            var dateFilter = function(d) {
                if (range.from && d < range.from) return false;
                if (range.to && d > range.to) return false;
                return true;
            };
            const reportTitle = document.getElementById('reportTitle');
            const exportBtn = document.getElementById('exportBtn');
            const exportPdfBtn = document.getElementById('exportPdfBtn');
            const tableHead = document.getElementById('reportTableHead');
            const tableBody = document.getElementById('reportTableBody');
            
            exportBtn.style.display = 'block';
            exportBtn.setAttribute('data-report-type', reportType);
            if (exportPdfBtn) { exportPdfBtn.style.display = 'block'; }
            
            switch (reportType) {
                case 'purchases':
                    reportTitle.textContent = 'Purchase Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Invoice</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Supplier</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Items</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Total Amount</th>
                        </tr>
                    `;
                    
                    tableBody.innerHTML = '';
                    let purchaseTotal = 0;
                    (appData.purchases || []).filter(function(p){ return dateFilter(p.date); }).forEach(purchase => {
                        let itemsDisplay = '';
                        if (purchase.items && purchase.items.length > 0) {
                            itemsDisplay = purchase.items.map(item => 
                                `${item.itemName} (${item.netWeight} kg @ ${RU}${item.rate})`
                            ).join(', ');
                        } else if (purchase.itemName) {
                            itemsDisplay = `${purchase.itemName} (${purchase.quantity || 0} @ ${RU}${purchase.rate || 0})`;
                        } else {
                            itemsDisplay = 'No items';
                        }
                        
                        const amount = purchase.grandTotal || purchase.total || 0;
                        purchaseTotal += amount;
                        
                        const row = document.createElement('tr');
                        row.className = 'border-b border-slate-200';
                        row.innerHTML = `
                            <td class="px-4 py-3">${purchase.date}</td>
                            <td class="px-4 py-3">${purchase.invoice}</td>
                            <td class="px-4 py-3">${purchase.supplierName}</td>
                            <td class="px-4 py-3">${itemsDisplay}</td>
                            <td class="px-4 py-3">${RU}${amount.toFixed(2)}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Add total row for purchases
                    const purchaseTotalRow = document.createElement('tr');
                    purchaseTotalRow.className = 'bg-slate-100 border-t-2 border-slate-400 font-bold';
                    purchaseTotalRow.innerHTML = `
                        <td class="px-4 py-4" colspan="4" style="text-align: right;">Total:</td>
                        <td class="px-4 py-4">${RU}${purchaseTotal.toFixed(2)}</td>
                    `;
                    tableBody.appendChild(purchaseTotalRow);
                    break;
                    
                case 'sales':
                    reportTitle.textContent = 'Sales Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Invoice</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Customer</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Items</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Total Amount</th>
                        </tr>
                    `;
                    
                    tableBody.innerHTML = '';
                    let salesTotal = 0;
                    (appData.sales || []).filter(function(s){ return dateFilter(s.date); }).forEach(sale => {
                        let itemsDisplay = '';
                        if (sale.items && sale.items.length > 0) {
                            itemsDisplay = sale.items.map(item => 
                                `${item.itemName} (${item.netWeight} kg @ ${RU}${item.rate})`
                            ).join(', ');
                        } else if (sale.itemName) {
                            itemsDisplay = `${sale.itemName} (${sale.quantity || 0} @ ${RU}${sale.rate || 0})`;
                        } else {
                            itemsDisplay = 'No items';
                        }
                        
                        const amount = sale.grandTotal || sale.total || 0;
                        salesTotal += amount;
                        
                        const row = document.createElement('tr');
                        row.className = 'border-b border-slate-200';
                        row.innerHTML = `
                            <td class="px-4 py-3">${sale.date}</td>
                            <td class="px-4 py-3">${sale.invoice}</td>
                            <td class="px-4 py-3">${sale.customerName}</td>
                            <td class="px-4 py-3">${itemsDisplay}</td>
                            <td class="px-4 py-3">${RU}${amount.toFixed(2)}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Add total row for sales
                    const salesTotalRow = document.createElement('tr');
                    salesTotalRow.className = 'bg-slate-100 border-t-2 border-slate-400 font-bold';
                    salesTotalRow.innerHTML = `
                        <td class="px-4 py-4" colspan="4" style="text-align: right;">Total:</td>
                        <td class="px-4 py-4">${RU}${salesTotal.toFixed(2)}</td>
                    `;
                    tableBody.appendChild(salesTotalRow);
                    break;
                    
                case 'inventory':
                    reportTitle.textContent = 'Inventory Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Item</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Category</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Current Stock</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Unit</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Total Value</th>
                        </tr>
                    `;
                    
                    tableBody.innerHTML = '';
                    Object.keys(appData.inventory).forEach(itemId => {
                        const item = appData.items.find(i => i.id == itemId);
                        const stock = appData.inventory[itemId];
                        
                        if (item) {
                            const row = document.createElement('tr');
                            row.className = 'border-b border-slate-200';
                            row.innerHTML = `
                                <td class="px-4 py-3">${item.name}</td>
                                <td class="px-4 py-3">${item.category}</td>
                                <td class="px-4 py-3">${stock.quantity}</td>
                                <td class="px-4 py-3">${item.unit}</td>
                                <td class="px-4 py-3">${RU}${stock.totalCost.toFixed(2)}</td>
                            `;
                            tableBody.appendChild(row);
                        }
                    });
                    break;
                    
                case 'brokerage':
                    reportTitle.textContent = 'Brokerage Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Broker</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Item</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Type</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Amount</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Reference</th>
                        </tr>
                    `;
                    
                    tableBody.innerHTML = '';
                    (appData.brokerage || []).filter(function(e){ return dateFilter(e.date); }).forEach(entry => {
                        const row = document.createElement('tr');
                        row.className = 'border-b border-slate-200';
                        row.innerHTML = `
                            <td class="px-4 py-3">${entry.date}</td>
                            <td class="px-4 py-3">${entry.brokerName}</td>
                            <td class="px-4 py-3">${entry.itemName}</td>
                            <td class="px-4 py-3">${entry.type}</td>
                            <td class="px-4 py-3">${RU}${entry.amount}</td>
                            <td class="px-4 py-3">${entry.reference}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    break;
                    
                case 'deductions':
                    reportTitle.textContent = 'Deductions Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Customer</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Invoice</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Amount</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Reason</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Adjustment</th>
                        </tr>
                    `;
                    
                    tableBody.innerHTML = '';
                    (appData.deductions || []).filter(function(d){ return dateFilter(d.date); }).forEach(deduction => {
                        const row = document.createElement('tr');
                        row.className = 'border-b border-slate-200';
                        row.innerHTML = `
                            <td class="px-4 py-3">${deduction.date}</td>
                            <td class="px-4 py-3">${deduction.customerName}</td>
                            <td class="px-4 py-3">${deduction.invoice}</td>
                            <td class="px-4 py-3">${RU}${deduction.amount}</td>
                            <td class="px-4 py-3">${deduction.reason}</td>
                            <td class="px-4 py-3">${deduction.adjustmentType}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    break;
                    
                case 'summary':
                    reportTitle.textContent = 'Business Summary Report';
                    tableHead.innerHTML = `
                        <tr class="bg-slate-50">
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Metric</th>
                            <th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Value</th>
                        </tr>
                    `;
                    
                    const totalPurchaseValue = appData.purchases.reduce((sum, p) => sum + (p.grandTotal || p.total || 0), 0);
                    const totalSalesValue = appData.sales.reduce((sum, s) => sum + (s.grandTotal || s.total || 0), 0);
                    const totalBrokerageValue = appData.brokerage.reduce((sum, b) => sum + (b.amount || 0), 0);
                    const totalDeductionsValue = appData.deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
                    const totalInventoryValue = Object.values(appData.inventory).reduce((sum, inv) => sum + (inv.totalCost || 0), 0);
                    
                    tableBody.innerHTML = `
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Total Purchases</td>
                            <td class="px-4 py-3">${RU}${totalPurchaseValue.toFixed(2)}</td>
                        </tr>
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Total Sales</td>
                            <td class="px-4 py-3">${RU}${totalSalesValue.toFixed(2)}</td>
                        </tr>
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Total Brokerage</td>
                            <td class="px-4 py-3">${RU}${totalBrokerageValue.toFixed(2)}</td>
                        </tr>
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Total Deductions</td>
                            <td class="px-4 py-3">${RU}${totalDeductionsValue.toFixed(2)}</td>
                        </tr>
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Current Inventory Value</td>
                            <td class="px-4 py-3">${RU}${totalInventoryValue.toFixed(2)}</td>
                        </tr>
                        <tr class="border-b border-slate-200">
                            <td class="px-4 py-3 font-medium">Net Profit/Loss</td>
                            <td class="px-4 py-3 ${(totalSalesValue - totalPurchaseValue - totalBrokerageValue - totalDeductionsValue) >= 0 ? 'text-green-600' : 'text-red-600'}">${RU}${(totalSalesValue - totalPurchaseValue - totalBrokerageValue - totalDeductionsValue).toFixed(2)}</td>
                        </tr>
                    `;
                    break;
                    
                case 'ageing':
                    reportTitle.textContent = 'Ageing Report (Receivables & Payables)';
                    tableHead.innerHTML = '<tr class="bg-slate-50"><th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Party</th><th class="px-4 py-3 text-left text-sm font-medium text-slate-700">Type</th><th class="px-4 py-3 text-right text-sm font-medium text-slate-700">0-30 days</th><th class="px-4 py-3 text-right text-sm font-medium text-slate-700">31-60 days</th><th class="px-4 py-3 text-right text-sm font-medium text-slate-700">61-90 days</th><th class="px-4 py-3 text-right text-sm font-medium text-slate-700">90+ days</th><th class="px-4 py-3 text-right text-sm font-medium text-slate-700">Total</th></tr>';
                    tableBody.innerHTML = '';
                    var today = new Date();
                    today.setHours(0,0,0,0);
                    function daysDiff(d) { var t = new Date(d); t.setHours(0,0,0,0); return Math.floor((today - t) / (24*60*60*1000)); }
                    function bucket(days) {
                        if (days <= 30) return 'b0';
                        if (days <= 60) return 'b1';
                        if (days <= 90) return 'b2';
                        return 'b3';
                    }
                    var payablesByParty = {};
                    (appData.purchases || []).forEach(function(p) {
                        var bal = (p.grandTotal || p.total || 0) - (p.paid || 0);
                        if (bal <= 0) return;
                        var name = p.supplierName || 'Unknown';
                        if (!payablesByParty[name]) payablesByParty[name] = { b0:0, b1:0, b2:0, b3:0, total: 0 };
                        var days = daysDiff(p.date);
                        var b = bucket(days);
                        payablesByParty[name][b] += bal;
                        payablesByParty[name].total += bal;
                    });
                    var receivablesByParty = {};
                    (appData.sales || []).forEach(function(s) {
                        var bal = (s.grandTotal || s.total || 0) - (s.received || 0);
                        if (bal <= 0) return;
                        var name = s.customerName || 'Unknown';
                        if (!receivablesByParty[name]) receivablesByParty[name] = { b0:0, b1:0, b2:0, b3:0, total: 0 };
                        var days = daysDiff(s.date);
                        var b = bucket(days);
                        receivablesByParty[name][b] += bal;
                        receivablesByParty[name].total += bal;
                    });
                    Object.keys(payablesByParty).forEach(function(name) {
                        var o = payablesByParty[name];
                        var tr = document.createElement('tr');
                        tr.className = 'border-b border-slate-200';
                        tr.innerHTML = '<td class="px-4 py-3 font-medium">' + name + '</td><td class="px-4 py-3 text-red-600">Payable</td><td class="px-4 py-3 text-right">' + RU + (o.b0||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b1||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b2||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b3||0).toFixed(2) + '</td><td class="px-4 py-3 text-right font-bold">' + RU + (o.total||0).toFixed(2) + '</td>';
                        tableBody.appendChild(tr);
                    });
                    Object.keys(receivablesByParty).forEach(function(name) {
                        var o = receivablesByParty[name];
                        var tr = document.createElement('tr');
                        tr.className = 'border-b border-slate-200';
                        tr.innerHTML = '<td class="px-4 py-3 font-medium">' + name + '</td><td class="px-4 py-3 text-green-600">Receivable</td><td class="px-4 py-3 text-right">' + RU + (o.b0||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b1||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b2||0).toFixed(2) + '</td><td class="px-4 py-3 text-right">' + RU + (o.b3||0).toFixed(2) + '</td><td class="px-4 py-3 text-right font-bold">' + RU + (o.total||0).toFixed(2) + '</td>';
                        tableBody.appendChild(tr);
                    });
                    break;
            }
            
            if (tableBody.children.length === 0 && reportType !== 'summary' && reportType !== 'ageing') {
                tableBody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No data available for this report</td></tr>';
            }
        }

        function exportReportToPdf() {
            var reportTitleEl = document.getElementById('reportTitle');
            var table = document.getElementById('reportTable');
            if (!table || !reportTitleEl) return;
            var title = reportTitleEl.textContent || 'Report';
            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(title) + '</title><style>body{font-family:Arial,sans-serif;margin:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #333;padding:8px;text-align:left;} th{background:#f0f0f0;}</style></head><body><h2>' + escapeHtml(title) + '</h2>' + table.outerHTML + '</body></html>');
            win.document.close();
            win.focus();
            setTimeout(function() { win.print(); }, 250);
        }
        function exportReport() {
            var exportBtn = document.getElementById('exportBtn');
            var reportType = exportBtn ? exportBtn.getAttribute('data-report-type') : '';
            var table = document.getElementById('reportTable');
            if (!table) {
                alert('No report data to export. Please select a report category first.');
                return;
            }
            var rows = table.querySelectorAll('tr');
            if (!rows.length) {
                alert('No report data to export. Please select a report and apply date range.');
                return;
            }
            var csv = '\uFEFF';
            for (var i = 0; i < rows.length; i++) {
                var cols = rows[i].querySelectorAll('th, td');
                var rowData = Array.from(cols).map(function(col) { return (col.textContent || '').trim().replace(/\n/g, ' '); }).join(',');
                csv += rowData + '\n';
            }
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (reportType || 'report') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Action functions for purchase and sales
        // Number to words conversion function
        function numberToWords(num) {
            if (num === 0) return 'Zero';
            
            const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
            const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
            const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
            
            function convertLessThanThousand(n) {
                if (n === 0) return '';
                
                if (n < 10) return ones[n];
                if (n < 20) return teens[n - 10];
                if (n < 100) {
                    const ten = Math.floor(n / 10);
                    const one = n % 10;
                    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
                }
                
                const hundred = Math.floor(n / 100);
                const rest = n % 100;
                return ones[hundred] + ' Hundred' + (rest > 0 ? ' and ' + convertLessThanThousand(rest) : '');
            }
            
            // Handle decimal part (paise)
            const parts = num.toFixed(2).split('.');
            const rupees = parseInt(parts[0]);
            const paise = parseInt(parts[1]);
            
            let result = '';
            
            if (rupees === 0) {
                result = 'Zero Rupees';
            } else {
                const crore = Math.floor(rupees / 10000000);
                const lakh = Math.floor((rupees % 10000000) / 100000);
                const thousand = Math.floor((rupees % 100000) / 1000);
                const remainder = rupees % 1000;
                
                if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
                if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
                if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
                if (remainder > 0) result += convertLessThanThousand(remainder);
                
                result = result.trim() + ' Rupees';
            }
            
            if (paise > 0) {
                result += ' and ' + convertLessThanThousand(paise) + ' Paise';
            }
            
            return result + ' Only';
        }

        // Function to calculate ledger balance for supplier
        function getSupplierLedgerBalance(supplierId) {
            let balance = 0;
            
            // Ensure openingBalances array exists
            if (!appData.openingBalances) {
                appData.openingBalances = [];
            }
            
            // Add opening balances first
            appData.openingBalances
                .filter(ob => ob.entityType === 'supplier' && String(ob.entityId) === String(supplierId))
                .forEach(opening => {
                    balance += opening.amount;
                });
            
            // Add all purchases (debit to supplier)
            appData.purchases
                .filter(p => String(p.supplierId) === String(supplierId))
                .forEach(purchase => {
                    balance += purchase.grandTotal || purchase.total || 0;
                });
            
            // Subtract all payments (credit to supplier)
            appData.payments
                .filter(p => (p.type === 'purchase' && appData.purchases.find(pur => pur.id === p.invoiceId && String(pur.supplierId) === String(supplierId))) || 
                            (p.type === 'ledger_payment' && p.entityType === 'supplier' && String(p.entityId) === String(supplierId)))
                .forEach(payment => {
                    balance -= payment.amount;
                });
            
            // Subtract adjustments (credit to supplier)
            if (appData.adjustments) {
                appData.adjustments
                    .filter(adj => adj.type === 'supplier_adjustment' && String(adj.entityId) === String(supplierId))
                    .forEach(adjustment => {
                        balance -= adjustment.amount;
                    });
            }
            
            return balance;
        }

        // Function to calculate ledger balance for customer
        function getCustomerLedgerBalance(customerId) {
            let balance = 0;
            
            // Ensure openingBalances array exists
            if (!appData.openingBalances) {
                appData.openingBalances = [];
            }
            
            // Add opening balances first
            appData.openingBalances
                .filter(ob => ob.entityType === 'customer' && String(ob.entityId) === String(customerId))
                .forEach(opening => {
                    balance += opening.amount;
                });
            
            // Add all sales (debit to customer)
            appData.sales
                .filter(s => String(s.customerId) === String(customerId))
                .forEach(sale => {
                    balance += sale.grandTotal || sale.total || 0;
                });
            
            // Subtract all receipts (credit from customer)
            appData.payments
                .filter(p => (p.type === 'sale' && appData.sales.find(s => s.id === p.invoiceId && String(s.customerId) === String(customerId))) || 
                            ((p.type === 'ledger_receipt' || p.type === 'ledger_payment') && p.entityType === 'customer' && String(p.entityId) === String(customerId)))
                .forEach(payment => {
                    // For customer payments, positive amount means they paid us (reduces their balance)
                    balance -= Math.abs(payment.amount);
                });
            
            // Subtract deductions (reduces what customer owes us)
            appData.deductions
                .filter(d => String(d.customerId) === String(customerId))
                .forEach(deduction => {
                    balance -= deduction.amount;
                });
            
            // Subtract adjustments
            if (appData.adjustments) {
                appData.adjustments
                    .filter(adj => adj.type === 'customer_adjustment' && String(adj.entityId) === String(customerId))
                    .forEach(adjustment => {
                        balance -= adjustment.amount;
                    });
            }
            
            return balance;
        }

        function buildPurchaseInvoiceHtml(purchase) {
            if (!purchase) return '';
            const company = appData.company;
            const purchaseInvoiceText = purchase.masterInvoice || purchase.invoice;
            const purchaseLrText = collectUniqueNonEmpty(purchase.multiLrNumbers || [purchase.lrNumber]).join(', ') || (purchase.lrNumber || '-');
            
            let itemsHtml = '';
            if (purchase.items) {
                purchase.items.forEach((item) => {
                    const bagsDisplay = item.isCoconut ? (item.discountQty || 0) : (item.bags ?? '');
                    const discountDisplay = (item.grossWeight != null && item.netWeight != null && !isNaN(item.grossWeight) && !isNaN(item.netWeight)) ? (item.grossWeight - item.netWeight) : '';
                    itemsHtml += `
                        <tr>
                            <td class="inv-td">${item.itemName}</td>
                            <td class="inv-td">${escapeHtml(item.date || purchase.date || '-')}</td>
                            <td class="inv-td">${escapeHtml(item.truck || purchase.truck || '-')}</td>
                            <td class="inv-td text-center">${item.grossWeight}</td>
                            <td class="inv-td text-center">${bagsDisplay}</td>
                            <td class="inv-td text-center">${discountDisplay}</td>
                            <td class="inv-td text-center">${item.netWeight}</td>
                            <td class="inv-td text-right">${RU}${item.rate}</td>
                            <td class="inv-td text-right">${RU}${item.total.toFixed(2)}</td>
                            <td class="inv-td">${escapeHtml(item.kaantaParchi || '-')}</td>
                        </tr>
                    `;
                });
            }
            
            const supplier = appData.suppliers.find(s => s.id == purchase.supplierId);
            
            // Keep printed balance exactly aligned with ledger page calculations.
            const ledgerBalance = getSupplierLedgerBalance(purchase.supplierId);
            
            const amountInWords = numberToWords(purchase.grandTotal || purchase.total || 0);
            
            return `
                <html>
                <head>
                    <title>Purchase Invoice - ${purchaseInvoiceText}</title>
                    <style>
                        * { box-sizing: border-box; }
                        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
                        .inv-header {
                            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #5b21b6 100%);
                            color: #fff; text-align: center; padding: 24px 20px; margin: -24px -24px 24px -24px; border-radius: 0 0 12px 12px;
                        }
                        .inv-header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.02em; }
                        .inv-header .tagline { margin: 6px 0 0; font-size: 13px; opacity: 0.95; font-style: italic; }
                        .inv-header .company-meta { margin-top: 12px; font-size: 12px; opacity: 0.9; }
                        .inv-title { text-align: center; font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #1e293b; }
                        .inv-details-wrap { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
                        .inv-billto { font-size: 14px; }
                        .inv-billto .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
                        .inv-billto .name { font-size: 16px; font-weight: 700; color: #1e293b; }
                        .inv-meta-box {
                            background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 13px; min-width: 220px;
                        }
                        .inv-meta-box div { margin-bottom: 4px; }
                        .inv-meta-box div:last-child { margin-bottom: 0; }
                        .inv-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
                        .inv-table thead tr { background: linear-gradient(135deg, #4f46e5 0%, #5b21b6 100%); color: #fff; }
                        .inv-table th { padding: 12px 10px; text-align: left; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
                        .inv-table th.text-center, .inv-table td.text-center { text-align: center; }
                        .inv-table th.text-right, .inv-table td.text-right { text-align: right; }
                        .inv-td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
                        .inv-table tbody tr:nth-child(even) { background: #f8fafc; }
                        .totals { margin-top: 20px; text-align: right; font-size: 14px; }
                        .totals .grand { font-size: 18px; font-weight: 700; margin-top: 8px; }
                        .words-box { margin-top: 20px; padding: 12px 14px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; }
                        .ledger-box { margin-top: 16px; padding: 12px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 15px; }
                        .ledger-box.to-pay { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
                        .ledger-box.settled { background: #d1fae5; border: 1px solid #10b981; color: #065f46; }
                        .signature-section { margin-top: 36px; display: flex; justify-content: space-between; gap: 24px; }
                        .signature-box { border: 1px solid #cbd5e1; padding: 16px; text-align: center; border-radius: 8px; min-height: 80px; }
                        .signature-box .label { font-weight: 700; font-size: 12px; color: #475569; }
                    </style>
                </head>
                <body>
                    <div class="inv-header">
                        <h1>${company.name || 'Ishwar Trading Company'}</h1>
                        ${company.address ? `<p class="company-meta" style="margin-top:6px;font-size:13px;opacity:0.95;">${company.address}</p>` : ''}
                        <p class="tagline">Purchase Invoice</p>
                        ${company.gstin ? `<div class="company-meta">GST No: ${company.gstin}</div>` : ''}
                    </div>
                    <div class="inv-title">PURCHASE INVOICE</div>
                    <div class="inv-details-wrap">
                        <div class="inv-billto">
                            <div class="label">Supplier</div>
                            <div class="name">${purchase.supplierName || '—'}</div>
                            ${supplier && supplier.mobile ? `<div style="margin-top:6px;font-size:13px;">Mobile: ${supplier.mobile}</div>` : ''}
                            ${supplier && supplier.account ? `<div style="font-size:12px;">Account: ${supplier.account}${supplier.ifsc ? ' | IFSC: ' + supplier.ifsc : ''}</div>` : ''}
                        </div>
                        <div class="inv-meta-box">
                            <div><strong>Invoice No:</strong> ${purchaseInvoiceText}</div>
                            <div><strong>LR Number:</strong> ${escapeHtml(purchaseLrText)}</div>
                        </div>
                    </div>
                    <table class="inv-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Date</th>
                                <th>Truck No</th>
                                <th class="text-center">Gross Wt</th>
                                <th class="text-center">Bag/Quantity</th>
                                <th class="text-center">Discount</th>
                                <th class="text-center">Net Wt</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Amount</th>
                                <th>Kaanta Parchi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <div class="totals">
                        <div><strong>Items Total: ${RU}${(purchase.itemsTotal || purchase.total || 0).toFixed(2)}</strong></div>
                        <div>Hammali: ${RU}${(purchase.hammali || 0).toFixed(2)}</div>
                        <div>Advance: ${RU}${(purchase.advance || 0).toFixed(2)}</div>
                        ${purchase.othersEntries && purchase.othersEntries.length > 0 ? purchase.othersEntries.map(entry => 
                            `<div>${entry.operation === 'add' ? '+' : '-'} ${entry.reason}: ${RU}${entry.amount.toFixed(2)}</div>`
                        ).join('') : ''}
                        <div class="grand">Grand Total: ${RU}${(purchase.grandTotal || purchase.total || 0).toFixed(2)}</div>
                    </div>
                    <div class="words-box">
                        <strong>Amount in Words:</strong> ${amountInWords}
                    </div>
                    <div class="ledger-box ${ledgerBalance > 0 ? 'to-pay' : 'settled'}">
                        <span>Ledger Balance (${supplier ? supplier.name : 'Supplier'}):</span>
                        <span>${RU}${ledgerBalance.toFixed(2)} ${ledgerBalance > 0 ? '(To Pay)' : ledgerBalance < 0 ? '(To Receive)' : '(Settled)'}</span>
                    </div>
                    <div class="signature-section">
                        <div class="signature-box" style="width:200px;"><div style="height:50px;"></div><div class="label">Supplier Signature</div></div>
                        <div class="signature-box" style="width:260px;"><div style="height:50px;"></div><div class="label">Company Seal & Signature</div></div>
                    </div>
                </body>
                </html>
            `;
        }

        function printPurchaseInvoice(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(buildPurchaseInvoiceHtml(purchase));
            printWindow.document.close();
            printWindow.print();
        }

        function buildSaleInvoiceHtml(sale) {
            if (!sale) return '';
            const company = appData.company;
            const saleInvoiceText = sale.masterInvoice || sale.invoice;
            const saleLrText = collectUniqueNonEmpty(sale.multiLrNumbers || [sale.lrNumber]).join(', ') || (sale.lrNumber || '-');
            
            let itemsHtml = '';
            if (sale.items) {
                sale.items.forEach(item => {
                    // For coconut, show discount quantity instead of bags
                    const middleColumn = item.isCoconut 
                        ? `<td class="border px-2 py-1 text-center">${item.discountQty || 0}</td>` 
                        : `<td class="border px-2 py-1 text-center">${item.bags}</td>`;
                    
                    itemsHtml += `
                        <tr>
                            <td class="border px-2 py-1">${item.itemName}</td>
                            <td class="border px-2 py-1">${escapeHtml(item.date || sale.date || '-')}</td>
                            <td class="border px-2 py-1">${escapeHtml(item.truck || sale.truck || '-')}</td>
                            <td class="border px-2 py-1">${escapeHtml(item.cityName || item.city || '-')}</td>
                            <td class="border px-2 py-1 text-center">${item.grossWeight}</td>
                            ${middleColumn}
                            <td class="border px-2 py-1 text-center">${item.netWeight}</td>
                            <td class="border px-2 py-1 text-right">${RU}${item.rate}</td>
                            <td class="border px-2 py-1 text-right">${RU}${item.total.toFixed(2)}</td>
                            <td class="border px-2 py-1">${escapeHtml(item.kaantaParchi || '-')}</td>
                        </tr>
                    `;
                });
            }
            
            const customer = appData.customers.find(c => c.id == sale.customerId);
            
            // Keep printed balance exactly aligned with ledger page calculations.
            const ledgerBalance = getCustomerLedgerBalance(sale.customerId);
            
            const amountInWords = numberToWords(sale.grandTotal || sale.total || 0);
            
            return `
                <html>
                <head>
                    <title>Sale Invoice - ${saleInvoiceText}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .invoice-details { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        .border { border: 1px solid #000; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .totals { margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${company.name || 'ITCO Trade Management'}</h1>
                        ${company.address ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;">${company.address}</p>` : ''}
                        <h2>SALE INVOICE</h2>
                    </div>
                    
                    <div class="invoice-details">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong>Invoice No:</strong> ${saleInvoiceText}<br>
                                <strong>LR Number:</strong> ${escapeHtml(saleLrText)}
                            </div>
                            <div>
                                <strong>Customer:</strong> ${sale.customerName}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px; border: 1px solid #000; padding: 10px;">
                        <h3 style="margin: 0 0 10px 0; text-align: center;">BANK DETAILS</h3>
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong>Bank 1:</strong> ${company.bank1?.name || 'N/A'}<br>
                                <strong>Account:</strong> ${company.bank1?.account || 'N/A'}<br>
                                <strong>IFSC:</strong> ${company.bank1?.ifsc || 'N/A'}
                            </div>
                            <div>
                                <strong>Bank 2:</strong> ${company.bank2?.name || 'N/A'}<br>
                                <strong>Account:</strong> ${company.bank2?.account || 'N/A'}<br>
                                <strong>IFSC:</strong> ${company.bank2?.ifsc || 'N/A'}
                            </div>
                            <div>
                                <strong>Bank 3:</strong> ${company.bank3?.name || 'N/A'}<br>
                                <strong>Account:</strong> ${company.bank3?.account || 'N/A'}<br>
                                <strong>IFSC:</strong> ${company.bank3?.ifsc || 'N/A'}
                            </div>
                            <div>
                                <strong>UPI:</strong> ${company.upi || 'N/A'}
                            </div>
                        </div>
                    </div>
                        </div>
                    </div>
                    
                    <table class="border">
                        <thead>
                            <tr class="border">
                                <th class="border px-2 py-1">Item</th>
                                <th class="border px-2 py-1">Date</th>
                                <th class="border px-2 py-1">Truck No</th>
                                <th class="border px-2 py-1">City</th>
                                <th class="border px-2 py-1">Gross Weight</th>
                                <th class="border px-2 py-1">Bags/Discount</th>
                                <th class="border px-2 py-1">Net Weight</th>
                                <th class="border px-2 py-1">Rate</th>
                                <th class="border px-2 py-1">Amount</th>
                                <th class="border px-2 py-1">Kaanta Parchi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    
                    <div class="totals">
                        <div style="text-align: right;">
                            <div><strong>Items Total: ${RU}${(sale.itemsTotal || sale.total || 0).toFixed(2)}</strong></div>
                            <div>Hammali: ${RU}${(sale.hammali || 0).toFixed(2)}</div>
                            <div>Advance: ${RU}${(sale.advance || 0).toFixed(2)}</div>
                            <div style="color: #d97706;"><strong>Truck Advance: ${RU}${(sale.truckAdvance || 0).toFixed(2)}</strong></div>
                            ${sale.othersEntries && sale.othersEntries.length > 0 ? sale.othersEntries.map(entry => 
                                `<div>${entry.operation === 'add' ? '+' : '-'} ${entry.reason}: ${RU}${entry.amount.toFixed(2)}</div>`
                            ).join('') : ''}
                            <div class="font-bold" style="font-size: 18px; margin-top: 10px;">
                                Grand Total: ${RU}${(sale.grandTotal || sale.total || 0).toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border: 1px solid #ccc;">
                        <div class="font-bold">Amount in Words:</div>
                        <div style="font-size: 14px; margin-top: 5px;">${amountInWords}</div>
                    </div>
                    
                    <div style="margin-top: 15px; padding: 10px; background-color: ${ledgerBalance > 0 ? '#fff3cd' : '#d4edda'}; border: 1px solid ${ledgerBalance > 0 ? '#ffc107' : '#28a745'};">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="font-bold">Ledger Balance (${customer ? customer.name : 'Customer'}):</div>
                            <div class="font-bold" style="font-size: 16px; color: ${ledgerBalance > 0 ? '#856404' : '#155724'};">
                                ${RU}${ledgerBalance.toFixed(2)} ${ledgerBalance > 0 ? '(To Receive)' : ledgerBalance < 0 ? '(To Pay)' : '(Settled)'}
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 40px; display: flex; justify-content: flex-end;">
                        <div style="border: 1px solid #000; padding: 30px; text-center; width: 300px; height: 120px;">
                            <div style="margin-bottom: 70px;"></div>
                            <div class="font-bold">Company Seal & Signature</div>
                        </div>
                    </div>
                </body>
                </html>
            `;
        }

        function printSaleInvoice(saleId) {
            const sale = appData.sales.find(s => s.id === saleId);
            if (!sale) return;
            const printWindow = window.open('', '_blank');
            printWindow.document.write(buildSaleInvoiceHtml(sale));
            printWindow.document.close();
            printWindow.print();
        }

        let editingPurchaseId = null;
        let editingSaleId = null;
        let saleEditOriginalItems = null;
        let saleEditInventoryReversed = false;

        function adjustInventoryForSaleItems(items, direction) {
            if (!items || !items.length) return;
            items.forEach(item => {
                if (!appData.inventory[item.itemId]) {
                    appData.inventory[item.itemId] = { quantity: 0, totalCost: 0 };
                }
                const qty = parseFloat(item.grossWeight) || 0;
                if (qty <= 0) return;
                if (direction > 0) {
                    // Restore stock (used when opening edit session).
                    appData.inventory[item.itemId].quantity += qty;
                    const prevQty = appData.inventory[item.itemId].quantity - qty;
                    const avgCost = prevQty > 0 ? (appData.inventory[item.itemId].totalCost / prevQty) : 0;
                    appData.inventory[item.itemId].totalCost += (avgCost * qty);
                } else {
                    // Deduct stock (used on save/cancel from working stock).
                    appData.inventory[item.itemId].quantity -= qty;
                    const totalQty = appData.inventory[item.itemId].quantity + qty;
                    const avgCost = totalQty > 0 ? (appData.inventory[item.itemId].totalCost / totalQty) : 0;
                    appData.inventory[item.itemId].totalCost -= (avgCost * qty);
                }
            });
        }

        function resetSaleEditSessionState() {
            saleEditOriginalItems = null;
            saleEditInventoryReversed = false;
        }

        function viewPurchase(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) {
                alert('Purchase not found');
                return;
            }
            const purchaseDateText = summarizeMultiValue(purchase.multiDates || [purchase.date], purchase.date || 'N/A');
            const purchaseTruckText = summarizeMultiValue(purchase.multiTrucks || [purchase.truck], purchase.truck || 'N/A');
            const purchaseLrText = summarizeMultiValue(purchase.multiLrNumbers || [purchase.lrNumber], purchase.lrNumber || 'N/A');
            
            // Build items table
            let itemsTable = '';
            if (purchase.items && purchase.items.length > 0) {
                itemsTable = `
                    <table class="w-full border border-slate-300 mt-4">
                        <thead>
                            <tr class="bg-slate-100">
                                <th class="border border-slate-300 px-3 py-2 text-left text-sm">Item</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Gross Wt</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Bag/Quantity</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Discount</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Net Wt</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Rate</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Amount</th>
                                <th class="border border-slate-300 px-3 py-2 text-left text-sm">Kaanta Parchi</th>
                                <th class="border border-slate-300 px-3 py-2 text-left text-sm">City</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${purchase.items.map((item) => {
                                const bagsDisplay = item.isCoconut ? (item.discountQty || 0) : (item.bags ?? '');
                                const discountDisplay = (item.grossWeight != null && item.netWeight != null && !isNaN(item.grossWeight) && !isNaN(item.netWeight)) ? (item.grossWeight - item.netWeight) : '';
                                const unit = item.unit || '';
                                return `
                                <tr>
                                    <td class="border border-slate-300 px-3 py-2 text-sm">${item.itemName}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${item.grossWeight} ${unit}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${bagsDisplay}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${discountDisplay}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${item.netWeight} ${unit}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${item.rate.toFixed(2)}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm font-semibold">${RU}${item.total.toFixed(2)}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-sm">${escapeHtml(item.kaantaParchi || '-')}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-sm">${escapeHtml(item.cityName || item.city || '-')}</td>
                                </tr>
                            `; }).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            // Build others entries table
            let othersTable = '';
            if (purchase.othersEntries && purchase.othersEntries.length > 0) {
                othersTable = `
                    <div class="mt-4">
                        <h4 class="font-semibold text-sm mb-2">Other Charges:</h4>
                        <table class="w-full border border-slate-300">
                            <thead>
                                <tr class="bg-slate-100">
                                    <th class="border border-slate-300 px-3 py-2 text-left text-sm">Description</th>
                                    <th class="border border-slate-300 px-3 py-2 text-center text-sm">Operation</th>
                                    <th class="border border-slate-300 px-3 py-2 text-right text-sm">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchase.othersEntries.map(entry => `
                                    <tr>
                                        <td class="border border-slate-300 px-3 py-2 text-sm">${escapeHtml((entry.reason || entry.description || 'Other Charge'))}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-center text-sm">${escapeHtml(entry.operation || '-')}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${(parseFloat(entry.amount) || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            const content = `
                <div class="text-left">
                    <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                        <h3 class="text-xl font-bold text-slate-900 mb-1">Purchase Invoice</h3>
                        <p class="text-sm text-slate-600">Invoice No: ${purchase.masterInvoice || purchase.invoice}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded">
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(purchaseDateText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Supplier</p>
                            <p class="font-semibold text-slate-900">${purchase.supplierName}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Truck No</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(purchaseTruckText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">LR Number</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(purchaseLrText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Invoice No</p>
                            <p class="font-semibold text-slate-900">${purchase.masterInvoice || purchase.invoice}</p>
                        </div>
                    </div>
                    
                    ${itemsTable}
                    
                    <div class="mt-4 bg-slate-50 p-4 rounded border-2 border-slate-200">
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-600">Items Total:</span>
                                <span class="font-semibold">${RU}${(purchase.itemsTotal || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Hammali:</span>
                                <span class="font-semibold">${RU}${(purchase.hammali || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Advance:</span>
                                <span class="font-semibold">${RU}${(purchase.advance || 0).toFixed(2)}</span>
                            </div>
                            <div></div>
                            <div class="flex justify-between pt-3 border-t-2 border-slate-300 col-span-2">
                                <span class="text-slate-700 font-bold text-base">Grand Total:</span>
                                <span class="font-bold text-xl text-blue-600">${RU}${(purchase.grandTotal || purchase.total || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-slate-200">
                                <span class="text-slate-600">Paid:</span>
                                <span class="font-semibold text-green-600">${RU}${(purchase.paid || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-slate-200">
                                <span class="text-slate-600">Balance:</span>
                                <span class="font-semibold text-red-600">${RU}${(purchase.balance || purchase.grandTotal || purchase.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${othersTable}
                </div>
            `;
            
            document.getElementById('modalTitle').textContent = 'Purchase Details';
            document.getElementById('modalContent').innerHTML = content;
            document.getElementById('viewModal').classList.remove('hidden');
        }

        function editPurchase(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;
            
            editingPurchaseId = purchaseId;
            populateDropdowns();
            
            // Show the purchase form first so init logic runs before prefill.
            showPurchaseForm();
            
            // Fill the form with existing data
            document.getElementById('purchaseDate').value = (purchase.multiDates && purchase.multiDates.length > 0) ? purchase.multiDates[0] : purchase.date;
            document.getElementById('purchaseInvoice').value = purchase.invoice;
            document.getElementById('purchaseSupplier').value = purchase.supplierId;
            syncPurchaseSupplierDisplay();
            document.getElementById('purchaseTruck').value = (purchase.multiTrucks && purchase.multiTrucks.length > 0) ? purchase.multiTrucks[0] : (purchase.truck || '');
            var plrEl = document.getElementById('purchaseLRNumber');
            if (plrEl) plrEl.value = (purchase.multiLrNumbers && purchase.multiLrNumbers.length > 0) ? purchase.multiLrNumbers[0] : (purchase.lrNumber || '');
            var pkpEl = document.getElementById('purchaseKaantaParchi');
            if (pkpEl) pkpEl.value = (purchase.multiKaantaParchi && purchase.multiKaantaParchi.length > 0) ? purchase.multiKaantaParchi[0] : '';
            const purchaseBrokerageToggle = document.getElementById('purchasePostBrokerageToggle');
            if (purchaseBrokerageToggle) {
                purchaseBrokerageToggle.checked = !!purchase.inlineBrokerageEnabled;
            }
            setPurchaseBrokerageRows(purchase.inlineBrokerageEntries || []);
            togglePurchaseBrokerageSection();
            document.getElementById('purchaseHammali').value = purchase.hammali || 0;
            document.getElementById('purchaseAdvance').value = purchase.advance || 0;
            const totalModeRadio = document.getElementById('purchaseChargeModeTotal');
            if (totalModeRadio) totalModeRadio.checked = true;
            
            // Load items into current items array
            currentPurchaseItems = purchase.items ? [...purchase.items] : [];
            editingPurchaseItemIndex = -1;
            resetPurchaseItemFormMode();
            updateCurrentPurchaseItemsDisplay();
            onPurchaseChargeModeChange();
            calculatePurchaseTotals();
            
            // Scroll to form
            document.querySelector('#purchaseEntryView').scrollIntoView({ behavior: 'smooth' });
            
            alert('Purchase loaded for editing. Make changes and save to update, or click Cancel to abort.');
        }
        
        function cancelPurchaseEdit() {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                editingPurchaseId = null;
                currentPurchaseItems = [];
                clearPurchaseForm();
                
                // Return to history view
                hidePurchaseForm();
            }
        }

        function clearPurchaseForm() {
            document.getElementById('purchaseDate').value = '';
            document.getElementById('purchaseInvoice').value = '';
            document.getElementById('purchaseSupplier').value = '';
            var psi = document.getElementById('purchaseSupplierInput');
            if (psi) psi.value = '';
            var psd = document.getElementById('purchaseSupplierDropdown');
            if (psd) psd.classList.add('hidden');
            document.getElementById('purchaseTruck').value = '';
            var plr = document.getElementById('purchaseLRNumber');
            if (plr) plr.value = '';
            var pkp = document.getElementById('purchaseKaantaParchi');
            if (pkp) pkp.value = '';
            const purchaseBrokerageToggle = document.getElementById('purchasePostBrokerageToggle');
            if (purchaseBrokerageToggle) purchaseBrokerageToggle.checked = false;
            setPurchaseBrokerageRows([]);
            togglePurchaseBrokerageSection();
            document.getElementById('purchaseHammali').value = '';
            document.getElementById('purchaseAdvance').value = '';
            var pdEl = document.getElementById('purchaseDiscount');
            if (pdEl) pdEl.value = '0';
            resetPurchaseColdStorageInputs();
            
            // Clear Others fields (same structure as index.html: category + optional reason)
            const othersContainer = document.getElementById('purchaseOthersContainer');
            if (othersContainer) {
                othersContainer.innerHTML = `
                    <div class="purchase-others-row grid grid-cols-1 md:grid-cols-4 gap-4 mb-3" data-index="0">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Category</label>
                            <select class="purchase-others-category w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" onchange="var w=this.closest('.purchase-others-row').querySelector('.purchase-others-other-reason-wrap');if(w) w.style.display=this.value==='Other'?'block':'none'; calculatePurchaseTotals();">
                                <option value="Cold Storage Rent">Cold Storage Rent</option>
                                <option value="Labour">Labour</option>
                                <option value="Transport">Transport</option>
                                <option value="Stocking">Stocking</option>
                                <option value="Seed Investment">Seed Investment</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div class="purchase-others-other-reason-wrap" style="display: none;">
                            <label class="block text-sm font-medium text-slate-700 mb-2">Specify (Other)</label>
                            <input type="text" class="purchase-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                            <input type="number" class="purchase-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                            <select class="purchase-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="add">Add (+)</option>
                                <option value="reduce">Reduce (-)</option>
                            </select>
                        </div>
                    </div>
                `;
            }
            initializePurchaseOthersRows();
            
            // Clear current items
            currentPurchaseItems = [];
            editingPurchaseItemIndex = -1;
            resetPurchaseItemFormMode();
            updateCurrentPurchaseItemsDisplay();
            const totalModeRadio = document.getElementById('purchaseChargeModeTotal');
            if (totalModeRadio) totalModeRadio.checked = true;
            onPurchaseChargeModeChange();
            calculatePurchaseTotals();
            editingPurchaseId = null;
        }

        function viewSale(saleId) {
            const sale = appData.sales.find(s => s.id === saleId);
            if (!sale) {
                alert('Sale not found');
                return;
            }
            const saleDateText = summarizeMultiValue(sale.multiDates || [sale.date], sale.date || 'N/A');
            const saleTruckText = summarizeMultiValue(sale.multiTrucks || [sale.truck], sale.truck || 'N/A');
            const saleLrText = summarizeMultiValue(sale.multiLrNumbers || [sale.lrNumber], sale.lrNumber || 'N/A');
            
            // Build items table
            let itemsTable = '';
            if (sale.items && sale.items.length > 0) {
                itemsTable = `
                    <table class="w-full border border-slate-300 mt-4">
                        <thead>
                            <tr class="bg-slate-100">
                                <th class="border border-slate-300 px-3 py-2 text-left text-sm">Item</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Gross Wt</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Bags/Disc</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Net Wt</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Rate</th>
                                <th class="border border-slate-300 px-3 py-2 text-right text-sm">Amount</th>
                                <th class="border border-slate-300 px-3 py-2 text-left text-sm">Kaanta Parchi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sale.items.map(item => `
                                <tr>
                                    <td class="border border-slate-300 px-3 py-2 text-sm">${item.itemName}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${item.grossWeight} ${item.unit}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${item.bags || item.discountQty || 0}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${item.netWeight} ${item.unit}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${item.rate.toFixed(2)}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-right text-sm font-semibold">${RU}${item.total.toFixed(2)}</td>
                                    <td class="border border-slate-300 px-3 py-2 text-sm">${escapeHtml(item.kaantaParchi || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
            
            // Build others entries table
            let othersTable = '';
            if (sale.othersEntries && sale.othersEntries.length > 0) {
                othersTable = `
                    <div class="mt-4">
                        <h4 class="font-semibold text-sm mb-2">Other Charges:</h4>
                        <table class="w-full border border-slate-300">
                            <thead>
                                <tr class="bg-slate-100">
                                    <th class="border border-slate-300 px-3 py-2 text-left text-sm">Description</th>
                                    <th class="border border-slate-300 px-3 py-2 text-center text-sm">Operation</th>
                                    <th class="border border-slate-300 px-3 py-2 text-right text-sm">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sale.othersEntries.map(entry => `
                                    <tr>
                                        <td class="border border-slate-300 px-3 py-2 text-sm">${escapeHtml((entry.reason || entry.description || 'Other Charge'))}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-center text-sm">${escapeHtml(entry.operation || '-')}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${(parseFloat(entry.amount) || 0).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            const content = `
                <div class="text-left">
                    <div class="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded">
                        <h3 class="text-xl font-bold text-slate-900 mb-1">Sale Invoice</h3>
                        <p class="text-sm text-slate-600">Invoice No: ${sale.masterInvoice || sale.invoice}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded">
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(saleDateText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                            <p class="font-semibold text-slate-900">${sale.customerName}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Truck No</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(saleTruckText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">LR Number</p>
                            <p class="font-semibold text-slate-900">${escapeHtml(saleLrText)}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Invoice No</p>
                            <p class="font-semibold text-slate-900">${sale.masterInvoice || sale.invoice}</p>
                        </div>
                    </div>
                    
                    ${itemsTable}
                    
                    <div class="mt-4 bg-slate-50 p-4 rounded border-2 border-slate-200">
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="flex justify-between">
                                <span class="text-slate-600">Items Total:</span>
                                <span class="font-semibold">${RU}${(sale.itemsTotal || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Hammali:</span>
                                <span class="font-semibold">${RU}${(sale.hammali || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-slate-600">Advance:</span>
                                <span class="font-semibold">${RU}${(sale.advance || 0).toFixed(2)}</span>
                            </div>
                            <div></div>
                            <div class="flex justify-between pt-3 border-t-2 border-slate-300 col-span-2">
                                <span class="text-slate-700 font-bold text-base">Grand Total:</span>
                                <span class="font-bold text-xl text-blue-600">${RU}${(sale.grandTotal || sale.total || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-slate-200">
                                <span class="text-slate-600">Received:</span>
                                <span class="font-semibold text-green-600">${RU}${(sale.received || 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between pt-2 border-t border-slate-200">
                                <span class="text-slate-600">Balance:</span>
                                <span class="font-semibold text-red-600">${RU}${(sale.balance || sale.grandTotal || sale.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${othersTable}
                </div>
            `;
            
            document.getElementById('modalTitle').textContent = 'Sale Details';
            document.getElementById('modalContent').innerHTML = content;
            document.getElementById('viewModal').classList.remove('hidden');
        }

        function editSale(saleId) {
            const sale = appData.sales.find(s => s.id === saleId);
            if (!sale) return;

            // If another sale edit session was left open, put inventory back first.
            if (editingSaleId && saleEditInventoryReversed && saleEditOriginalItems) {
                adjustInventoryForSaleItems(saleEditOriginalItems, -1);
                resetSaleEditSessionState();
            }
            
            editingSaleId = saleId;
            saleEditOriginalItems = sale.items ? sale.items.map(i => ({ ...i })) : [];
            // Start edit session by restoring original stock quantities to working inventory.
            adjustInventoryForSaleItems(saleEditOriginalItems, +1);
            saleEditInventoryReversed = true;
            populateDropdowns();
            
            // Show the sales form first so init logic runs before prefill.
            showSalesForm();
            
            // Fill the form with existing data
            document.getElementById('saleDate').value = (sale.multiDates && sale.multiDates.length > 0) ? sale.multiDates[0] : sale.date;
            document.getElementById('saleInvoice').value = sale.invoice;
            document.getElementById('saleCustomer').value = sale.customerId;
            syncSaleCustomerDisplay();
            document.getElementById('saleTruck').value = (sale.multiTrucks && sale.multiTrucks.length > 0) ? sale.multiTrucks[0] : (sale.truck || '');
            document.getElementById('saleLRNumber').value = (sale.multiLrNumbers && sale.multiLrNumbers.length > 0) ? sale.multiLrNumbers[0] : (sale.lrNumber || '');
            var skpEl = document.getElementById('saleKaantaParchi');
            if (skpEl) skpEl.value = (sale.multiKaantaParchi && sale.multiKaantaParchi.length > 0) ? sale.multiKaantaParchi[0] : '';
            const saleBrokerageToggle = document.getElementById('salePostBrokerageToggle');
            if (saleBrokerageToggle) {
                saleBrokerageToggle.checked = !!sale.inlineBrokerageEnabled;
            }
            setSaleBrokerageRows(sale.inlineBrokerageEntries || []);
            toggleSaleBrokerageSection();
            document.getElementById('saleHammali').value = sale.hammali || 0;
            document.getElementById('saleAdvance').value = sale.advance || 0;
            
            // Load items into current items array
            currentSaleItems = sale.items ? [...sale.items] : [];
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            
            // Load linked purchases
            linkedPurchases = normalizeLinkedPurchasesForItems(sale.linkedPurchases ? [...sale.linkedPurchases] : [], currentSaleItems);
            updateLinkedPurchasesDisplay();
            
            // Scroll to form
            document.querySelector('#salesEntryView').scrollIntoView({ behavior: 'smooth' });
            
            alert('Sale loaded for editing. Make changes and save to update, or click Cancel to abort.');
        }
        
        function cancelSaleEdit() {
            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                // Restore inventory to original pre-edit state.
                if (saleEditInventoryReversed && saleEditOriginalItems) {
                    adjustInventoryForSaleItems(saleEditOriginalItems, -1);
                }
                resetSaleEditSessionState();
                populateDropdowns();
                editingSaleId = null;
                currentSaleItems = [];
                clearSaleForm();
                
                // Return to history view
                hideSalesForm();
            }
        }

        function clearSaleForm() {
            // If an edit session had restored stock temporarily, roll it back first.
            if (saleEditInventoryReversed && saleEditOriginalItems) {
                adjustInventoryForSaleItems(saleEditOriginalItems, -1);
            }
            document.getElementById('saleDate').value = '';
            document.getElementById('saleInvoice').value = '';
            document.getElementById('saleCustomer').value = '';
            var sci = document.getElementById('saleCustomerInput');
            if (sci) sci.value = '';
            var scd = document.getElementById('saleCustomerDropdown');
            if (scd) scd.classList.add('hidden');
            document.getElementById('saleTruck').value = '';
            document.getElementById('saleLRNumber').value = '';
            var skp = document.getElementById('saleKaantaParchi');
            if (skp) skp.value = '';
            const saleBrokerageToggle = document.getElementById('salePostBrokerageToggle');
            if (saleBrokerageToggle) saleBrokerageToggle.checked = false;
            setSaleBrokerageRows([]);
            toggleSaleBrokerageSection();
            document.getElementById('saleHammali').value = '';
            document.getElementById('saleAdvance').value = '';
            document.getElementById('saleTruckAdvance').value = '';
            var sdEl = document.getElementById('saleDiscount');
            if (sdEl) sdEl.value = '0';
            
            // Clear Others fields
            const othersContainer = document.getElementById('saleOthersContainer');
            if (othersContainer) {
                othersContainer.innerHTML = `
                    <div class="sale-others-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-4" data-index="0">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                            <input type="text" class="sale-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason (e.g., Transport, Commission)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                            <input type="number" class="sale-others-amount w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter amount">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Operation</label>
                            <select class="sale-others-operation w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                <option value="add">Add (+)</option>
                                <option value="reduce">Reduce (-)</option>
                            </select>
                        </div>
                    </div>
                `;
            }
            initializeSaleOthersRows();
            
            // Clear current items
            currentSaleItems = [];
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            editingSaleId = null;
            editingSaleItemIndex = -1;
            resetSaleItemFormMode();
            resetSaleEditSessionState();
            // Clear item-wise purchase links for fresh sale form.
            linkedPurchases = [];
            tempLinkedPurchases = [];
            updateLinkedPurchasesDisplay();
        }

        let currentPaymentData = null;

        function setPaymentModalDefaultDate() {
            const paymentDateEl = document.getElementById('paymentDate');
            if (!paymentDateEl) return;
            paymentDateEl.value = new Date().toISOString().split('T')[0];
        }

        function payPurchase(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;
            
            currentPaymentData = {
                type: 'purchase',
                id: purchaseId,
                invoice: purchase.invoice,
                party: purchase.supplierName,
                balance: purchase.balance
            };
            
            document.getElementById('paymentModalTitle').textContent = 'Record Payment to Supplier';
            document.getElementById('balanceDisplay').textContent = `Balance: ${RU}${purchase.balance.toFixed(2)}`;
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentMode').value = '';
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) paymentModeEl.onchange = onPaymentModeChange;
            populatePaymentBankAccounts();
            const paymentBankAccountEl = document.getElementById('paymentBankAccount');
            if (paymentBankAccountEl) paymentBankAccountEl.value = '';
            onPaymentModeChange();
            document.getElementById('paidThrough').value = '';
            document.getElementById('paymentRemarks').value = '';
            setPaymentModalDefaultDate();
            
            document.getElementById('paymentModal').classList.remove('hidden');
        }

        function receiveSale(saleId) {
            const sale = appData.sales.find(s => s.id === saleId);
            if (!sale) return;
            
            currentPaymentData = {
                type: 'sale',
                id: saleId,
                invoice: sale.invoice,
                party: sale.customerName,
                balance: sale.balance
            };
            
            document.getElementById('paymentModalTitle').textContent = 'Record Payment from Customer';
            document.getElementById('balanceDisplay').textContent = `Balance: ${RU}${sale.balance.toFixed(2)}`;
            document.getElementById('paymentAmount').value = '';
            document.getElementById('paymentMode').value = '';
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) paymentModeEl.onchange = onPaymentModeChange;
            populatePaymentBankAccounts();
            const paymentBankAccountEl = document.getElementById('paymentBankAccount');
            if (paymentBankAccountEl) paymentBankAccountEl.value = '';
            onPaymentModeChange();
            document.getElementById('paidThrough').value = '';
            document.getElementById('paymentRemarks').value = '';
            setPaymentModalDefaultDate();
            
            document.getElementById('paymentModal').classList.remove('hidden');
        }

        function closePaymentModal() {
            document.getElementById('paymentModal').classList.add('hidden');
            currentPaymentData = null;
        }
        function populatePaymentBankAccounts() {
            const selectEl = document.getElementById('paymentBankAccount');
            if (!selectEl) return;
            const currentValue = selectEl.value;
            const bankOptions = getCompanyBankAccounts();
            selectEl.innerHTML = '<option value="">Select Bank Account</option>';
            bankOptions.forEach(opt => {
                selectEl.innerHTML += `<option value="${opt.id}">${escapeHtml(opt.label)}</option>`;
            });
            if (currentValue && bankOptions.some(b => b.id === currentValue)) {
                selectEl.value = currentValue;
            }
        }
        function onPaymentModeChange() {
            const modeEl = document.getElementById('paymentMode');
            const wrapEl = document.getElementById('paymentBankAccountWrap');
            const selectEl = document.getElementById('paymentBankAccount');
            if (!modeEl || !wrapEl || !selectEl) return;
            const mode = String(modeEl.value || '').trim().toLowerCase();
            // Bank Transfer + UPI both should require a bank account selection.
            const needsBankAccount = mode === 'bank' || mode === 'upi';
            wrapEl.classList.toggle('hidden', !needsBankAccount);
            // Hardening: some themes/CSS can interfere with `hidden` class.
            // Use inline display as a backup to guarantee visibility.
            wrapEl.style.display = needsBankAccount ? '' : 'none';
            if (needsBankAccount) {
                populatePaymentBankAccounts();
            } else {
                selectEl.value = '';
            }
        }
        function printPaymentVoucherFromModal() {
            var titleEl = document.getElementById('paymentModalTitle');
            var amountEl = document.getElementById('paymentAmount');
            var modeEl = document.getElementById('paymentMode');
            var throughEl = document.getElementById('paidThrough');
            var bankAccountEl = document.getElementById('paymentBankAccount');
            var remarksEl = document.getElementById('paymentRemarks');
            var paymentDateEl = document.getElementById('paymentDate');
            var party = currentPaymentData ? currentPaymentData.party : '';
            var invoice = currentPaymentData ? currentPaymentData.invoice : '';
            var amount = amountEl ? parseFloat(amountEl.value) || 0 : 0;
            var mode = modeEl ? (modeEl.options[modeEl.selectedIndex] && modeEl.options[modeEl.selectedIndex].text) || modeEl.value : '';
            var paidThrough = throughEl ? throughEl.value : '';
            var bankAccountLabel = '-';
            if (bankAccountEl && bankAccountEl.value) {
                var selectedBank = bankAccountEl.options[bankAccountEl.selectedIndex];
                bankAccountLabel = selectedBank ? selectedBank.text : '-';
            }
            var remarks = remarksEl ? remarksEl.value : '';
            var companyName = (appData.company && appData.company.name) ? appData.company.name : 'ITCO';
            var d = new Date();
            var selectedDateValue = paymentDateEl && paymentDateEl.value ? paymentDateEl.value : new Date().toISOString().split('T')[0];
            var dateStr = selectedDateValue;
            var timeStr = d.toLocaleTimeString('en-IN', { hour12: true });
            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html><head><title>Payment Voucher</title></head><body style="font-family: Arial, sans-serif; padding: 24px; max-width: 400px;">' +
                '<div style="border: 2px solid #333; padding: 20px;">' +
                '<h2 style="margin: 0 0 16px 0; text-align: center;">PAYMENT VOUCHER</h2>' +
                '<p style="margin: 4px 0;"><strong>Date:</strong> ' + dateStr + ' &nbsp; <strong>Time:</strong> ' + timeStr + '</p>' +
                '<p style="margin: 4px 0;"><strong>Party:</strong> ' + (party || '-') + '</p>' +
                '<p style="margin: 4px 0;"><strong>Invoice/Ref:</strong> ' + (invoice || '-') + '</p>' +
                '<p style="margin: 4px 0;"><strong>Amount:</strong> ' + RU + ' ' + amount.toFixed(2) + '</p>' +
                '<p style="margin: 4px 0;"><strong>Amount in Words:</strong> ' + (typeof numberToWords === "function" ? numberToWords(amount) : amount.toFixed(2)) + '</p>' +
                '<p style="margin: 4px 0;"><strong>Mode:</strong> ' + (mode || '-') + '</p>' +
                ((modeEl && (modeEl.value === 'bank' || modeEl.value === 'upi')) ? '<p style="margin: 4px 0;"><strong>Bank Account:</strong> ' + bankAccountLabel + '</p>' : '') +
                (paidThrough ? '<p style="margin: 4px 0;"><strong>Paid Through:</strong> ' + paidThrough + '</p>' : '') +
                (remarks ? '<p style="margin: 4px 0;"><strong>Remarks:</strong> ' + remarks + '</p>' : '') +
                '<hr style="margin: 16px 0;">' +
                '<p style="font-size: 12px; color: #666; text-align: center;">' + companyName + '</p>' +
                '</div></body></html>');
            win.document.close();
            win.print();
        }

        function savePayment() {
            if (!currentPaymentData) return;
            
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const mode = document.getElementById('paymentMode').value;
            const paymentDate = (document.getElementById('paymentDate') && document.getElementById('paymentDate').value) ? document.getElementById('paymentDate').value : '';
            const bankAccountId = (document.getElementById('paymentBankAccount') && document.getElementById('paymentBankAccount').value) || '';
            const paidThrough = document.getElementById('paidThrough').value;
            const remarks = document.getElementById('paymentRemarks').value;
            
            if (!amount || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            if (!mode) {
                alert('Please select payment mode');
                return;
            }
            if (!paymentDate) {
                alert('Please select payment date');
                return;
            }

            const needsBankAccount = mode === 'bank' || mode === 'upi';
            if (needsBankAccount && !bankAccountId) {
                alert('Please select bank account for Bank Transfer/UPI payment mode');
                return;
            }
            
            if (amount > currentPaymentData.balance) {
                alert('Payment amount cannot exceed balance');
                return;
            }
            
            // Update the transaction
            if (currentPaymentData.type === 'purchase') {
                const purchase = appData.purchases.find(p => p.id === currentPaymentData.id);
                if (purchase) {
                    purchase.paid += amount;
                    purchase.balance -= amount;
                }
            } else if (currentPaymentData.type === 'sale') {
                const sale = appData.sales.find(s => s.id === currentPaymentData.id);
                if (sale) {
                    sale.received += amount;
                    sale.balance -= amount;
                }
            } else if (currentPaymentData.type === 'brokerage') {
                // For brokerage, we just record the payment
                // The brokerage entry itself doesn't have a balance field
            } else if (currentPaymentData.type === 'ledger_payment' || currentPaymentData.type === 'ledger_receipt') {
                // For ledger payments, we create a direct payment entry
                // This will be reflected in the ledger when regenerated
            }
            
            // Record payment
            const selectedBank = getCompanyBankAccounts().find(b => b.id === bankAccountId);
            const paymentRecord = {
                id: Date.now(),
                type: currentPaymentData.type,
                invoiceId: currentPaymentData.id || null,
                invoice: currentPaymentData.invoice || 'Direct Payment',
                party: currentPaymentData.party,
                amount: amount,
                mode: mode,
                bankAccountId: bankAccountId || null,
                bankAccountName: selectedBank ? selectedBank.name : null,
                bankAccountNumber: selectedBank ? selectedBank.account : null,
                paidThrough: paidThrough,
                remarks: remarks,
                date: paymentDate
            };
            
            // Add entity information for ledger payments
            if (currentPaymentData.type === 'ledger_payment' || currentPaymentData.type === 'ledger_receipt') {
                paymentRecord.entityType = currentPaymentData.entityType;
                paymentRecord.entityId = currentPaymentData.entityId;
            }
            
            appData.payments.push(paymentRecord);
            
            saveData();
            
            // Update UI immediately before closing modal
            updatePurchaseHistory();
            updateSalesHistory();
            updateDashboard();
            
            // If we're on the ledger page, regenerate it to show the new entry immediately
            if (typeof generateLedger === 'function') {
                generateLedger();
            }
            
            // Close modal and show alert after UI updates
            setTimeout(() => {
                closePaymentModal();
                alert('Payment recorded successfully!');
            }, 50);
        }

        function deletePurchase(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;
            
            // Step 1: Block if any sale is explicitly linked to this purchase (process: Purchase first -> Sale of that purchase)
            const salesLinkedToThisPurchase = (appData.sales || []).filter(function(sale) {
                return sale.linkedPurchases && sale.linkedPurchases.some(function(lp) { return String(lp.purchaseId) === String(purchaseId); });
            });
            if (salesLinkedToThisPurchase.length > 0) {
                var uniqueInvoices = Array.from(new Set(salesLinkedToThisPurchase.map(function(s) {
                    return s.invoice || ('Sale #' + s.id);
                })));
                var invoiceList = uniqueInvoices.join(', ');
                alert('Cannot delete this purchase because it is linked to the following sale(s):\n\n' + invoiceList + '\n\nRemove this purchase from linked list in those sales (Edit Sale -> Link to Purchase), or delete those sales first.');
                return;
            }
            
            if (confirm('Are you sure you want to delete this purchase? This will also update inventory and remove all related transactions.')) {
                // Reverse inventory changes (using gross weight)
                if (purchase.items) {
                    purchase.items.forEach(item => {
                        if (appData.inventory[item.itemId]) {
                            appData.inventory[item.itemId].quantity -= item.grossWeight;
                            appData.inventory[item.itemId].totalCost -= ((parseFloat(item.total) || 0) + (parseFloat(item.coldStorageCost) || 0));
                            
                            // Remove inventory entry if quantity becomes 0 or negative
                            if (appData.inventory[item.itemId].quantity <= 0) {
                                delete appData.inventory[item.itemId];
                            }
                        }
                    });
                }
                
                // Remove related payments
                appData.payments = appData.payments.filter(payment => 
                    !(payment.type === 'purchase' && payment.invoiceId === purchaseId)
                );
                
                // Remove related brokerage entries
                appData.brokerage = appData.brokerage.filter(entry => 
                    entry.reference !== purchase.invoice
                );
                
                // Remove the purchase
                appData.purchases = appData.purchases.filter(p => p.id !== purchaseId);
                rebuildInventoryFromTransactions();
                
                saveData();
                updatePurchaseHistory();
                updateBrokerageHistory();
                updateDashboard();
                refreshInventory();
                alert('Purchase and all related transactions deleted successfully!');
            }
        }

        function deleteSale(saleId) {
            if (confirm('Are you sure you want to delete this sale? This will also update inventory and remove all related transactions.')) {
                const sale = appData.sales.find(s => s.id === saleId);
                if (sale) {
                    // Reverse inventory changes (using gross weight)
                    if (sale.items) {
                        sale.items.forEach(item => {
                            if (!appData.inventory[item.itemId]) {
                                appData.inventory[item.itemId] = { quantity: 0, totalCost: 0 };
                            }
                            appData.inventory[item.itemId].quantity += item.grossWeight;
                            const prevQty = appData.inventory[item.itemId].quantity - item.grossWeight;
                            const avgCost = prevQty > 0 ? appData.inventory[item.itemId].totalCost / prevQty : 0;
                            appData.inventory[item.itemId].totalCost += (avgCost * item.grossWeight);
                        });
                    }
                    
                    // Remove related payments
                    appData.payments = appData.payments.filter(payment => 
                        !(payment.type === 'sale' && payment.invoiceId === saleId)
                    );
                    
                    // Remove related deductions
                    appData.deductions = appData.deductions.filter(deduction => 
                        deduction.invoice !== sale.invoice
                    );
                    
                    // Remove related brokerage entries
                    appData.brokerage = appData.brokerage.filter(entry => 
                        entry.reference !== sale.invoice
                    );
                }
                
                // Remove the sale
                appData.sales = appData.sales.filter(s => s.id !== saleId);
                
                saveData();
                updateSalesHistory();
                updateDeductionsHistory();
                updateBrokerageHistory();
                updateDashboard();
                populateDropdowns();
                alert('Sale and all related transactions deleted successfully!');
            }
        }

        // Ledger payment functions
        function payFromLedger() {
            if (!window.currentLedgerData) return;
            
            const ledgerData = window.currentLedgerData;
            currentPaymentData = {
                type: 'ledger_payment',
                entityType: ledgerData.type,
                entityId: ledgerData.entityId,
                party: ledgerData.entityName,
                balance: ledgerData.balance
            };
            
            document.getElementById('paymentModalTitle').textContent = `Pay ${ledgerData.entityName}`;
            document.getElementById('balanceDisplay').textContent = `Balance: ${RU}${ledgerData.balance.toFixed(2)}`;
            document.getElementById('paymentAmount').value = ledgerData.balance;
            document.getElementById('paymentMode').value = '';
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) paymentModeEl.onchange = onPaymentModeChange;
            populatePaymentBankAccounts();
            const paymentBankAccountEl = document.getElementById('paymentBankAccount');
            if (paymentBankAccountEl) paymentBankAccountEl.value = '';
            onPaymentModeChange();
            document.getElementById('paidThrough').value = '';
            document.getElementById('paymentRemarks').value = '';
            setPaymentModalDefaultDate();
            
            document.getElementById('paymentModal').classList.remove('hidden');
        }

        function receiveFromLedger() {
            if (!window.currentLedgerData) return;
            
            const ledgerData = window.currentLedgerData;
            currentPaymentData = {
                type: 'ledger_receipt',
                entityType: ledgerData.type,
                entityId: ledgerData.entityId,
                party: ledgerData.entityName,
                balance: ledgerData.balance
            };
            
            document.getElementById('paymentModalTitle').textContent = `Receive from ${ledgerData.entityName}`;
            document.getElementById('balanceDisplay').textContent = `Balance: ${RU}${ledgerData.balance.toFixed(2)}`;
            document.getElementById('paymentAmount').value = ledgerData.balance;
            document.getElementById('paymentMode').value = '';
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) paymentModeEl.onchange = onPaymentModeChange;
            populatePaymentBankAccounts();
            const paymentBankAccountEl = document.getElementById('paymentBankAccount');
            if (paymentBankAccountEl) paymentBankAccountEl.value = '';
            onPaymentModeChange();
            document.getElementById('paidThrough').value = '';
            document.getElementById('paymentRemarks').value = '';
            setPaymentModalDefaultDate();
            
            document.getElementById('paymentModal').classList.remove('hidden');
        }

function exportLedgerStatement() {
            if (!window.currentLedgerData) {
                alert('Please generate a ledger first.');
                return;
            }
            var ledgerData = window.currentLedgerData;
            var tbody = document.getElementById('ledgerEntries');
            if (!tbody) {
                alert('Ledger table not found. Please generate the ledger again.');
                return;
            }
            var rows = tbody.querySelectorAll('tr');
            
            var csv = '\uFEFFLedger Statement\n';
            csv += 'Generated on,' + new Date().toLocaleDateString() + '\n';
            csv += 'Entity Type,' + (ledgerData.type ? ledgerData.type.charAt(0).toUpperCase() + ledgerData.type.slice(1) : '') + '\n';
            csv += 'Entity Name,' + (ledgerData.entityName || '') + '\n';
            csv += 'Current Balance,' + (ledgerData.balance != null ? ledgerData.balance.toFixed(2) : '0') + '\n\n';
            csv += 'Date,Description,Invoice,Debit,Credit,Balance\n';
            for (var r = 0; r < rows.length; r++) {
                var cols = rows[r].querySelectorAll('td');
                if (cols.length >= 6) {
                    var rowData = [
                        (cols[0].textContent || '').trim(),
                        (cols[1].textContent || '').trim(),
                        (cols[2].textContent || '').trim(),
                        (cols[3].textContent || '').trim().replace(RU, '').replace(/,/g, ''),
                        (cols[4].textContent || '').trim().replace(RU, '').replace(/,/g, ''),
                        (cols[5].textContent || '').trim().replace(RU, '').replace(/,/g, '')
                    ].join(',');
                    csv += rowData + '\n';
                }
            }
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'Ledger_' + (ledgerData.entityName || 'export').replace(/[^a-zA-Z0-9]/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Payment Tracking page: get all payment rows (from appData.payments or derived from purchases/sales)
        function getPaymentsListForTracking() {
            var payments = appData.payments || [];
            if (payments.length > 0) return payments.slice();
            // Fallback: derive from purchase paid amounts and sale received amounts (for older data or when no central payments)
            var derived = [];
            (appData.purchases || []).forEach(function(p) {
                var paid = parseFloat(p.paid) || 0;
                if (paid > 0) {
                    derived.push({
                        type: 'purchase',
                        date: p.date || '',
                        party: p.supplierName || '-',
                        invoice: p.invoice || '-',
                        amount: paid,
                        mode: '-',
                        remarks: 'From purchase record'
                    });
                }
            });
            (appData.sales || []).forEach(function(s) {
                var received = parseFloat(s.received) || 0;
                if (received > 0) {
                    derived.push({
                        type: 'sale',
                        date: s.date || '',
                        party: s.customerName || '-',
                        invoice: s.invoice || '-',
                        amount: received,
                        mode: '-',
                        remarks: 'From sale record'
                    });
                }
            });
            return derived;
        }
        function loadPaymentsTracking() {
            var typeEl = document.getElementById('paymentsFilterType');
            var fromEl = document.getElementById('paymentsDateFrom');
            var toEl = document.getElementById('paymentsDateTo');
            var tbody = document.getElementById('paymentsTableBody');
            var summaryEl = document.getElementById('paymentsSummary');
            if (!tbody) return;
            // Outstanding payables & receivables (same logic as dashboard)
            var totalPurchases = (appData.purchases || []).reduce(function(s, p) { return s + (p.grandTotal || p.total || 0); }, 0);
            var openingPayables = (appData.openingBalances || []).filter(function(ob) { return ob.type === 'payable'; }).reduce(function(s, ob) { return s + (ob.amount || 0); }, 0);
            var supplierPayments = (appData.payments || []).filter(function(pm) { return pm.type === 'purchase' || (pm.type === 'ledger_payment' && pm.entityType === 'supplier'); }).reduce(function(s, pm) { return s + (pm.amount || 0); }, 0);
            var netPayables = Math.max(0, totalPurchases + openingPayables - supplierPayments);
            var totalSales = (appData.sales || []).reduce(function(s, sale) { return s + (sale.grandTotal || sale.total || 0); }, 0);
            var openingReceivables = (appData.openingBalances || []).filter(function(ob) { return ob.type === 'receivable'; }).reduce(function(s, ob) { return s + (ob.amount || 0); }, 0);
            var totalDeductions = (appData.deductions || []).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
            var customerPayments = (appData.payments || []).filter(function(pm) { return pm.type === 'sale' || (pm.type === 'ledger_receipt' && pm.entityType === 'customer'); }).reduce(function(s, pm) { return s + (pm.amount || 0); }, 0);
            var netReceivables = Math.max(0, totalSales + openingReceivables - totalDeductions - customerPayments);
            var payablesEl = document.getElementById('paymentsOutstandingPayables');
            var receivablesEl = document.getElementById('paymentsOutstandingReceivables');
            if (payablesEl) payablesEl.textContent = RU + (netPayables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            if (receivablesEl) receivablesEl.textContent = RU + (netReceivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
            var typeFilter = typeEl ? typeEl.value : '';
            var fromVal = fromEl ? fromEl.value : '';
            var toVal = toEl ? toEl.value : '';
            var searchEl = document.getElementById('paymentsSearch');
            var searchTerm = (searchEl && searchEl.value) ? String(searchEl.value).trim().toLowerCase() : '';
            var list = getPaymentsListForTracking().sort(function(a, b) {
                var dA = (a.date || '').replace(/-/g, '');
                var dB = (b.date || '').replace(/-/g, '');
                return dB.localeCompare(dA);
            });
            if (typeFilter === 'purchase_payments') list = list.filter(function(p) { return p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier'); });
            if (typeFilter === 'sales_payments') list = list.filter(function(p) { return p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer'); });
            if (fromVal) list = list.filter(function(p) { return (p.date || '') >= fromVal; });
            if (toVal) list = list.filter(function(p) { return (p.date || '') <= toVal; });
            if (searchTerm) {
                list = list.filter(function(p) {
                    var party = (p.party || '').toLowerCase();
                    var invoice = (p.invoice || '').toLowerCase();
                    var mode = (p.mode || '').toLowerCase();
                    var bankAccount = (p.bankAccountName || p.bankAccountNumber || '').toLowerCase();
                    var remarks = (p.remarks != null ? String(p.remarks) : '').toLowerCase();
                    var amountStr = (p.amount != null ? String(p.amount) : '');
                    return party.indexOf(searchTerm) >= 0 || invoice.indexOf(searchTerm) >= 0 || mode.indexOf(searchTerm) >= 0 || bankAccount.indexOf(searchTerm) >= 0 || remarks.indexOf(searchTerm) >= 0 || amountStr.indexOf(searchTerm) >= 0;
                });
            }
            var totalAmount = list.reduce(function(s, p) { return s + (parseFloat(p.amount) || 0); }, 0);
            var pageSize = paginationState.payments.pageSize;
            var totalPages = Math.max(1, Math.ceil(list.length / pageSize));
            if (paginationState.payments.currentPage > totalPages) {
                paginationState.payments.currentPage = 1;
            }
            var currentPage = paginationState.payments.currentPage;
            var pageList = getPaginatedData(list, currentPage, pageSize);
            function getPaymentDisplayType(p) {
                if (p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier')) return 'Purchase payment';
                if (p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer')) return 'Sales payment';
                return p.type || 'Other';
            }
            if (list.length === 0) {
                var msg = searchTerm ? 'No payments match your search. Try clearing the search or changing filters.' : 'No payments found. Try <strong>Type: All</strong> or leave date range empty to see all payments.';
                tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-500">' + msg + '</td></tr>';
            } else {
                tbody.innerHTML = pageList.map(function(p) {
                    var amt = parseFloat(p.amount) || 0;
                    var typeLabel = getPaymentDisplayType(p);
                    var bankLabel = p.bankAccountName || p.bankAccountNumber || '-';
                    return '<tr class="border-b border-slate-200 hover:bg-slate-50">' +
                        '<td class="px-4 py-3">' + escapeHtml(p.date || '-') + '</td>' +
                        '<td class="px-4 py-3">' + escapeHtml(typeLabel) + '</td>' +
                        '<td class="px-4 py-3">' + escapeHtml(p.party || '-') + '</td>' +
                        '<td class="px-4 py-3">' + escapeHtml(p.invoice || '-') + '</td>' +
                        '<td class="px-4 py-3 text-right font-semibold">' + RU + (amt.toFixed(2)) + '</td>' +
                        '<td class="px-4 py-3">' + escapeHtml(p.mode || '-') + '</td>' +
                        '<td class="px-4 py-3">' + escapeHtml(bankLabel) + '</td>' +
                        '<td class="px-4 py-3 text-slate-600">' + escapeHtml((p.remarks || '-').toString().slice(0, 50)) + '</td>' +
                        '</tr>';
                }).join('');
            }
            if (summaryEl) summaryEl.textContent = 'Total: ' + list.length + ' payment(s) | Amount: ' + RU + totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 });
            renderPagination('paymentsPagination', list.length, currentPage, pageSize, 'changePaymentsPage', 'changePaymentsPageSize');
        }
        function exportPaymentsToCsv() {
            var typeEl = document.getElementById('paymentsFilterType');
            var fromEl = document.getElementById('paymentsDateFrom');
            var toEl = document.getElementById('paymentsDateTo');
            var searchEl = document.getElementById('paymentsSearch');
            var typeFilter = typeEl ? typeEl.value : '';
            var fromVal = fromEl ? fromEl.value : '';
            var toVal = toEl ? toEl.value : '';
            var searchTerm = (searchEl && searchEl.value) ? String(searchEl.value).trim().toLowerCase() : '';
            var list = getPaymentsListForTracking().sort(function(a, b) {
                var dA = (a.date || '').replace(/-/g, '');
                var dB = (b.date || '').replace(/-/g, '');
                return dB.localeCompare(dA);
            });
            if (typeFilter === 'purchase_payments') list = list.filter(function(p) { return p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier'); });
            if (typeFilter === 'sales_payments') list = list.filter(function(p) { return p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer'); });
            if (fromVal) list = list.filter(function(p) { return (p.date || '') >= fromVal; });
            if (toVal) list = list.filter(function(p) { return (p.date || '') <= toVal; });
            if (searchTerm) {
                list = list.filter(function(p) {
                    var party = (p.party || '').toLowerCase();
                    var invoice = (p.invoice || '').toLowerCase();
                    var mode = (p.mode || '').toLowerCase();
                    var bankAccount = (p.bankAccountName || p.bankAccountNumber || '').toLowerCase();
                    var remarks = (p.remarks != null ? String(p.remarks) : '').toLowerCase();
                    var amountStr = (p.amount != null ? String(p.amount) : '');
                    return party.indexOf(searchTerm) >= 0 || invoice.indexOf(searchTerm) >= 0 || mode.indexOf(searchTerm) >= 0 || bankAccount.indexOf(searchTerm) >= 0 || remarks.indexOf(searchTerm) >= 0 || amountStr.indexOf(searchTerm) >= 0;
                });
            }
            function getPaymentDisplayTypeExport(p) {
                if (p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier')) return 'Purchase payment';
                if (p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer')) return 'Sales payment';
                return p.type || 'Other';
            }
            var csv = '\uFEFFDate,Type,Party,Invoice/Ref,Amount,Mode,Bank Account,Remarks\n';
            list.forEach(function(p) {
                var amt = (parseFloat(p.amount) || 0).toFixed(2);
                var typeLabel = getPaymentDisplayTypeExport(p);
                var bankLabel = (p.bankAccountName || p.bankAccountNumber || '-').toString().replace(/"/g, '""');
                csv += '"' + (p.date || '') + '","' + typeLabel + '","' + (p.party || '').replace(/"/g, '""') + '","' + (p.invoice || '').replace(/"/g, '""') + '",' + amt + ',"' + (p.mode || '').replace(/"/g, '""') + '","' + bankLabel + '","' + (p.remarks || '').toString().replace(/"/g, '""').slice(0, 100) + '"\n';
            });
            var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'Payment_Tracking_' + new Date().toISOString().slice(0, 10) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // Delete ledger entry function
   function deleteLedgerEntry(entryId, entryType, sourceId) {
            if (!confirm('Are you sure you want to delete this ledger entry? This will also delete the original transaction and all related data.')) {
                return;
            }
            
            try {
                console.log('Deleting entry:', { entryId, entryType, sourceId });
                
                let deleted = false;
                
                if (entryType === 'purchase') {
                    // Use the comprehensive delete function
                    const purchase = appData.purchases.find(p => p.id === sourceId);
                    if (purchase) {
                        deletePurchase(sourceId);
                        deleted = true;
                        // Don't call saveData here - deletePurchase already does it
                        return; // Exit early since deletePurchase handles everything
                    }
                } else if (entryType === 'sale') {
                    // Use the comprehensive delete function
                    const sale = appData.sales.find(s => s.id === sourceId);
                    if (sale) {
                        deleteSale(sourceId);
                        deleted = true;
                        // Don't call saveData here - deleteSale already does it
                        return; // Exit early since deleteSale handles everything
                    }
                } else if (entryType === 'brokerage') {
                    // Delete from brokerage array
                    const originalLength = appData.brokerage.length;
                    appData.brokerage = appData.brokerage.filter(b => b.id !== sourceId);
                    deleted = appData.brokerage.length !== originalLength;
                } else if (entryType === 'deduction') {
                    // Use the comprehensive delete function
                    deleteDeduction(sourceId);
                    deleted = true;
                    // Don't call saveData here - deleteDeduction already does it
                    return; // Exit early since deleteDeduction handles everything
                } else if (entryType === 'adjustment') {
                    // Delete adjustment entry
                    if (appData.adjustments) {
                        const originalLength = appData.adjustments.length;
                        appData.adjustments = appData.adjustments.filter(adj => adj.id !== sourceId);
                        deleted = appData.adjustments.length !== originalLength;
                    }
                } else if (entryType === 'payment') {
                    // Handle direct ledger payments/receipts
                    // First, find the payment and reverse it from purchase/sale if applicable
                    const payment = appData.payments.find(p => p.id === sourceId);
                    if (payment) {
                        // If this payment was linked to a purchase or sale, reverse it
                        if (payment.type === 'purchase' && payment.invoiceId) {
                            const purchase = appData.purchases.find(p => p.id === payment.invoiceId);
                            if (purchase) {
                                purchase.paid = (purchase.paid || 0) - payment.amount;
                                purchase.balance = (purchase.balance || 0) + payment.amount;
                            }
                        } else if (payment.type === 'sale' && payment.invoiceId) {
                            const sale = appData.sales.find(s => s.id === payment.invoiceId);
                            if (sale) {
                                sale.received = (sale.received || 0) - payment.amount;
                                sale.balance = (sale.balance || 0) + payment.amount;
                            }
                        }
                    }
                    
                    const originalLength = appData.payments.length;
                    appData.payments = appData.payments.filter(p => p.id !== sourceId);
                    deleted = appData.payments.length !== originalLength;
                } else if (entryType === 'opening') {
                    // Handle opening balance deletions
                    deleteOpeningBalance(sourceId);
                    deleted = true;
                    // Don't call saveData here - deleteOpeningBalance already does it
                    return; // Exit early since deleteOpeningBalance handles everything
                }
                
                if (deleted) {
                    saveData();
                    generateLedger(); // Refresh the ledger display
                    updatePurchaseHistory(); // Update purchase history to reflect balance changes
                    updateSalesHistory(); // Update sales history to reflect balance changes
                    updateDashboard();
                    alert('Entry deleted successfully!');
                } else {
                    alert('Entry not found or could not be deleted.');
                }
            } catch (error) {
                alert('Error deleting entry. Please try again.');
                console.error('Delete error:', error);
            }
        }
      
        // Edit deduction function
        function editDeduction(deductionId) {
            const deduction = appData.deductions.find(d => d.id === deductionId);
            if (!deduction) return;
            
            // Fill the form with existing data
            document.getElementById('deductionDate').value = deduction.date;
            document.getElementById('deductionCustomer').value = deduction.customerId;
            document.getElementById('deductionInvoice').value = deduction.invoice;
            document.getElementById('deductionAmount').value = deduction.amount;
            document.getElementById('deductionReason').value = deduction.reason;
            document.getElementById('adjustmentType').value = deduction.adjustmentType || '';
            
            // Show adjustment fields if needed
            if (deduction.adjustmentType === 'Supplier' || deduction.adjustmentType === 'Broker') {
                showAdjustmentFields();
                setTimeout(() => {
                    document.getElementById('adjustmentEntity').value = deduction.adjustmentEntityId || '';
                    document.getElementById('adjustmentAmount').value = deduction.adjustmentAmount || '';
                }, 100);
            } else if (deduction.adjustmentType === 'Split' && deduction.splitAdjustments) {
                showAdjustmentFields();
                setTimeout(() => {
                    document.getElementById('splitBroker').value = deduction.splitAdjustments.broker.id || '';
                    document.getElementById('splitBrokerAmount').value = deduction.splitAdjustments.broker.amount || '';
                    document.getElementById('splitSupplier').value = deduction.splitAdjustments.supplier.id || '';
                    document.getElementById('splitSupplierAmount').value = deduction.splitAdjustments.supplier.amount || '';
                }, 100);
            }
            
            // Remove the old deduction and related adjustments
            appData.deductions = appData.deductions.filter(d => d.id !== deductionId);
            if (appData.adjustments) {
                appData.adjustments = appData.adjustments.filter(adj => adj.deductionId !== deductionId);
            }
            
            updateDeductionsHistory();
            showPage('deductions');
            
            alert('Deduction loaded for editing. Make changes and save to update.');
        }

        // Delete deduction function
        function deleteDeduction(deductionId) {
            if (confirm('Are you sure you want to delete this deduction entry?')) {
                // Remove related adjustments first
                if (appData.adjustments) {
                    appData.adjustments = appData.adjustments.filter(adj => adj.deductionId !== deductionId);
                }
                
                // Remove the deduction
                appData.deductions = appData.deductions.filter(d => d.id !== deductionId);
                
                saveData();
                updateDeductionsHistory();
                updateDashboard();
                alert('Deduction deleted successfully!');
            }
        }

        // Opening Balance Functions
        function populateOpeningBalanceDropdowns() {
            const receivableCustomer = document.getElementById('receivableCustomer');
            const payableSupplier = document.getElementById('payableSupplier');
            
            if (receivableCustomer) {
                receivableCustomer.innerHTML = '<option value="">Select Customer</option>';
                (appData.customers || []).filter(function(c){ return c.active !== false; }).forEach(customer => {
                    receivableCustomer.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                });
            }
            
            if (payableSupplier) {
                payableSupplier.innerHTML = '<option value="">Select Supplier</option>';
                (appData.suppliers || []).filter(function(s){ return s.active !== false; }).forEach(supplier => {
                    payableSupplier.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
                });
            }
        }

        function updateOpeningBalanceHistory() {
            const tbody = document.getElementById('openingBalanceHistory');
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            // Ensure openingBalances array exists
            if (!appData.openingBalances) {
                appData.openingBalances = [];
            }
            
            if (!Array.isArray(appData.openingBalances) || appData.openingBalances.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="px-6 py-8 text-center text-slate-500">
                            No opening balance entries yet. Add your first entry above.
                        </td>
                    </tr>
                `;
                const paginationContainer = document.getElementById('openingBalancePagination');
                if (paginationContainer) paginationContainer.innerHTML = '';
                return;
            }
            
            // Sort by date (newest first)
            const sortedBalances = [...appData.openingBalances].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Get paginated data
            const { currentPage, pageSize } = paginationState.openingBalance;
            const paginatedBalances = getPaginatedData(sortedBalances, currentPage, pageSize);
            
            paginatedBalances.forEach(entry => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                
                const typeClass = entry.type === 'receivable' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
                const typeText = entry.type === 'receivable' ? 'Receivable' : 'Payable';
                
                row.innerHTML = `
                    <td class="px-6 py-4 text-sm text-slate-700">${entry.date}</td>
                    <td class="px-6 py-4">
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${typeClass}">${typeText}</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-700">${entry.entityName}</td>
                    <td class="px-6 py-4 text-sm font-semibold text-gray-900">${RU}${entry.amount.toFixed(2)}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">${entry.reference || '-'}</td>
                    <td class="px-6 py-4 text-sm text-slate-600">${entry.description || '-'}</td>
                    <td class="px-6 py-4">
                        <button onclick="deleteOpeningBalance('${entry.id}')" class="action-btn action-delete" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            // Render pagination
            renderPagination(
                'openingBalancePagination',
                appData.openingBalances.length,
                currentPage,
                pageSize,
                'changeOpeningBalancePage',
                'changeOpeningBalancePageSize'
            );
        }

        // Handle receivable form submission
        document.addEventListener('DOMContentLoaded', function() {
            const receivableForm = document.getElementById('receivableForm');
            if (receivableForm) {
                receivableForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const date = document.getElementById('receivableDate').value;
                    const customerId = document.getElementById('receivableCustomer').value;
                    const amount = parseFloat(document.getElementById('receivableAmount').value);
                    const reference = document.getElementById('receivableReference').value;
                    const description = document.getElementById('receivableDescription').value;
                    
                    if (!date || !customerId || !amount || amount <= 0) {
                        alert('Please fill all required fields with valid values');
                        return;
                    }
                    
                    const customer = appData.customers.find(c => c.id == customerId);
                    if (!customer) {
                        alert('Customer not found');
                        return;
                    }
                    
                    // Create opening balance entry
                    const openingBalance = {
                        id: 'OB_' + Date.now(),
                        type: 'receivable',
                        date: date,
                        entityType: 'customer',
                        entityId: customerId,
                        entityName: customer.name,
                        amount: amount,
                        reference: reference,
                        description: description,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Initialize array if it doesn't exist
                    if (!appData.openingBalances) {
                        appData.openingBalances = [];
                    }
                    
                    appData.openingBalances.push(openingBalance);
                    
                    // Opening balance is now tracked in openingBalances array
                    // It will appear in ledger via the generateLedger function
                    // No need to add to payments array
                    
                    saveData();
                    updateOpeningBalanceHistory();
                    updateDashboard();
                    
                    // Regenerate ledger if on ledger page to show new entry immediately
                    if (typeof generateLedger === 'function') {
                        generateLedger();
                    }
                    
                    // Clear form
                    receivableForm.reset();
                    document.getElementById('receivableDate').value = new Date().toISOString().split('T')[0];
                    
                    alert('Opening receivable balance added successfully!');
                });
            }
            
            // Handle payable form submission
            const payableForm = document.getElementById('payableForm');
            if (payableForm) {
                payableForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const date = document.getElementById('payableDate').value;
                    const supplierId = document.getElementById('payableSupplier').value;
                    const amount = parseFloat(document.getElementById('payableAmount').value);
                    const reference = document.getElementById('payableReference').value;
                    const description = document.getElementById('payableDescription').value;
                    
                    if (!date || !supplierId || !amount || amount <= 0) {
                        alert('Please fill all required fields with valid values');
                        return;
                    }
                    
                    const supplier = appData.suppliers.find(s => s.id == supplierId);
                    if (!supplier) {
                        alert('Supplier not found');
                        return;
                    }
                    
                    // Create opening balance entry
                    const openingBalance = {
                        id: 'OB_' + Date.now(),
                        type: 'payable',
                        date: date,
                        entityType: 'supplier',
                        entityId: supplierId,
                        entityName: supplier.name,
                        amount: amount,
                        reference: reference,
                        description: description,
                        createdAt: new Date().toISOString()
                    };
                    
                    // Initialize array if it doesn't exist
                    if (!appData.openingBalances) {
                        appData.openingBalances = [];
                    }
                    
                    appData.openingBalances.push(openingBalance);
                    
                    // Opening balance is now tracked in openingBalances array
                    // It will appear in ledger via the generateLedger function
                    // No need to add to payments array
                    
                    saveData();
                    updateOpeningBalanceHistory();
                    updateDashboard();
                    
                    // Regenerate ledger if on ledger page to show new entry immediately
                    if (typeof generateLedger === 'function') {
                        generateLedger();
                    }
                    
                    // Clear form
                    payableForm.reset();
                    document.getElementById('payableDate').value = new Date().toISOString().split('T')[0];
                    
                    alert('Opening payable balance added successfully!');
                });
            }
        });

        function deleteOpeningBalance(id) {
            if (!confirm('Are you sure you want to delete this opening balance entry?')) {
                return;
            }
            
            // Ensure openingBalances array exists
            if (!appData.openingBalances) {
                appData.openingBalances = [];
                alert('No opening balances to delete');
                return;
            }
            
            const entry = appData.openingBalances.find(ob => ob.id === id);
            if (!entry) {
                alert('Entry not found');
                return;
            }
            
            console.log('Deleting opening balance:', entry);
            console.log('Before delete - count:', appData.openingBalances.length);
            
            // Remove from openingBalances
            appData.openingBalances = appData.openingBalances.filter(ob => ob.id !== id);
            
            console.log('After delete - count:', appData.openingBalances.length);
            
            // Force save to Firebase immediately
            SHARED_DOC_REF.set({
                data: appData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('âœ… Opening balance deleted and saved to Firebase');
                updateOpeningBalanceHistory();
                updateDashboard();
                alert('Opening balance entry deleted successfully!');
            }).catch((error) => {
                console.error('âŒ Error saving after delete:', error);
                alert('Deleted from screen but there was an error saving. Please click Save button.');
                updateOpeningBalanceHistory();
                updateDashboard();
            });
        }

        // Initialize app
        document.addEventListener('DOMContentLoaded', function() {
            loadData();
            initRowActionMenuHandlers();
            initLedgerSummaryDrilldownModal();
            showPage('home');
            updateItemsList();
            updateSuppliersList();
            updateCustomersList();
            updateBrokersList();
            updateColdStoragesList();
            updatePurchaseHistory();
            updateSalesHistory();
            updateBrokerageHistory();
            updateDeductionsHistory();
            populateOpeningBalanceDropdowns();
            updateOpeningBalanceHistory();
            populatePaymentBankAccounts();
            onPaymentModeChange();

            // Ensure payment mode toggle always works (in addition to inline onchange attribute)
            var paymentModeEl = document.getElementById('paymentMode');
            if (paymentModeEl) {
                paymentModeEl.addEventListener('change', function() {
                    if (typeof onPaymentModeChange === 'function') onPaymentModeChange();
                });
            }
            
            // Set default dates to today
            const today = new Date().toISOString().split('T')[0];
            const dateInputs = ['purchaseDate', 'saleDate', 'brokerageDate', 'deductionDate', 'receivableDate', 'payableDate'];
            dateInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = today;
            });
            initializePurchaseOthersRows();
            initializeSaleOthersRows();

            // Add event listeners for real-time calculations
            const purchaseInputs = ['purchaseQuantity', 'purchaseBags', 'purchaseDiscountQty', 'purchaseRate', 'purchaseAmount', 'purchaseHammali', 'purchaseAdvance', 'purchaseOthersAmount'];
            purchaseInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', function() {
                        if (id === 'purchaseHammali' || id === 'purchaseAdvance' || id === 'purchaseOthersAmount') {
                            calculatePurchaseTotals();
                        } else {
                            calculatePurchaseItemTotal();
                        }
                    });
                }
            });
            
            // Add event listener for Others operation change
            const purchaseOthersOperation = document.getElementById('purchaseOthersOperation');
            if (purchaseOthersOperation) {
                purchaseOthersOperation.addEventListener('change', calculatePurchaseTotals);
            }

            const saleInputs = ['saleQuantity', 'saleBags', 'saleDiscountQty', 'saleRate', 'saleHammali', 'saleAdvance', 'saleOthersAmount'];
            saleInputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', function() {
                        if (id === 'saleHammali' || id === 'saleAdvance' || id === 'saleOthersAmount') {
                            calculateSaleTotals();
                        } else {
                            calculateSaleItemTotal();
                        }
                    });
                }
            });
            
            // Add event listener for Others operation change
            const saleOthersOperation = document.getElementById('saleOthersOperation');
            if (saleOthersOperation) {
                saleOthersOperation.addEventListener('change', calculateSaleTotals);
            }

            if (typeof renderLedgerSummaryCards === 'function') {
                renderLedgerSummaryCards();
            }
        });
