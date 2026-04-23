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
            purchases: [],
            sales: [],
            inventory: {},
            brokerage: [],
            deductions: [],
            payments: [],
            adjustments: [],
            openingBalances: []
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
    pnl: { currentPage: 1, pageSize: 10 },
    ledger: { currentPage: 1, pageSize: 10 },
    openingBalance: { currentPage: 1, pageSize: 10 }
};

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
let currentLedgerData = [];

function renderPnLWithCurrentData() {
    renderPnLTable(currentPnLData);
}

function renderLedgerWithCurrentData() {
    renderLedgerTable(currentLedgerData);
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
                appData.settings = appData.settings || {};

                // Refresh ALL UI sections now that data is loaded
                updateDashboard();
                populateDropdowns();
                updateItemsList();
                updateSuppliersList();
                updateCustomersList();
                updateBrokersList();
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
                appData.purchases = appData.purchases || [];
                appData.sales = appData.sales || [];
                appData.brokerages = appData.brokerages || [];
                appData.deductions = appData.deductions || [];
                appData.adjustments = appData.adjustments || [];
                appData.payments = appData.payments || [];
                appData.settings = appData.settings || {};
                appData.inventory = appData.inventory || {};
                (appData.items || []).forEach(function(i){ if (i.active === undefined) i.active = true; });
                (appData.suppliers || []).forEach(function(s){ if (s.active === undefined) s.active = true; });
                (appData.customers || []).forEach(function(c){ if (c.active === undefined) c.active = true; });
                (appData.brokers || []).forEach(function(b){ if (b.active === undefined) b.active = true; });
                // Save to Firebase
                saveData();
                
                // Refresh all displays
                updateItemsList();
                updateSuppliersList();
                updateCustomersList();
                updateBrokersList();
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
        if (msgEl) msgEl.textContent = 'This will permanently delete all master data: Items, Suppliers, Customers, Brokers, and Company details. Records (transactions) will remain. This cannot be undone. Enter password to confirm.';
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
    appData.company = {};
    saveData();
    populateDropdowns();
    updateItemsList();
    updateSuppliersList();
    updateCustomersList();
    updateBrokersList();
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
            // Auto-generate invoice number
            document.getElementById('purchaseInvoice').value = generatePurchaseInvoiceNumber();
            onPurchaseChargeModeChange();
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
            // Auto-generate invoice number
            document.getElementById('saleInvoice').value = generateSaleInvoiceNumber();
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
        function addSupplier() {
            var rawName = document.getElementById('supplierName').value;
            const name = rawName ? String(rawName).trim() : '';
            const mobile = (document.getElementById('supplierMobile').value || '').trim();
            const address = (document.getElementById('supplierAddress').value || '').trim();
            const account = (document.getElementById('supplierAccount').value || '').trim();
            const ifsc = (document.getElementById('supplierIFSC').value || '').trim();
            var gstinEl = document.getElementById('supplierGSTIN');
            const gstin = gstinEl ? (gstinEl.value || '').trim() : '';
            if (name && address) {
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
                alert('Please fill in Name and Address');
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
            if (name && address) {
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
                alert('Please fill in Name and Address');
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
            if (name && details) {
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
                alert('Please fill in Name and Details');
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
                    if (item && appData.inventory[itemId].quantity > 0) {
                        saleItem.innerHTML += `<option value="${item.id}">${item.name} (Available: ${appData.inventory[itemId].quantity})</option>`;
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
            syncPurchaseSupplierDisplay();
            syncSaleCustomerDisplay();
            initPurchaseSupplierSearch();
            initSaleCustomerSearch();
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
            var address = (document.getElementById('quickSupplierAddress').value || '').trim();
            if (!name || !address) { alert('Name and Address are required.'); return; }
            if (isDuplicateSupplierName(name)) { alert('Supplier with this name already exists (including with different spaces).'); return; }
            var supplier = {
                id: Date.now(),
                name: name,
                mobile: (document.getElementById('quickSupplierMobile').value || '').trim(),
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
            var address = (document.getElementById('quickCustomerAddress').value || '').trim();
            if (!name || !address) { alert('Name and Address are required.'); return; }
            if (isDuplicateCustomerName(name)) { alert('Customer with this name already exists (including with different spaces).'); return; }
            var customer = {
                id: Date.now(),
                name: name,
                mobile: (document.getElementById('quickCustomerMobile').value || '').trim(),
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
                        grossLabel.textContent = 'Gross Quantity';
                        document.getElementById('purchaseQuantity').placeholder = 'Gross Quantity';
                        netLabel.textContent = 'Net Quantity';
                        document.getElementById('purchaseNetWeight').placeholder = 'Net Quantity';
                        netHelp.textContent = 'Auto-calculated (Gross - Discount)';
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
                        
                        grossLabel.textContent = 'Gross Weight (kg)';
                        document.getElementById('purchaseQuantity').placeholder = 'Gross Weight';
                        netLabel.textContent = 'Net Weight';
                        document.getElementById('purchaseNetWeight').placeholder = 'Net Weight';
                        netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
                    } else {
                        rateContainer.style.display = 'block';
                        amountContainer.style.display = 'none';
                        bagsContainer.style.display = 'block';
                        if (discountContainer) discountContainer.style.display = 'block';
                        discountQtyContainer.style.display = 'none';
                        document.getElementById('purchaseDiscountQty').value = '0';
                        
                        grossLabel.textContent = 'Gross Weight (kg)';
                        document.getElementById('purchaseQuantity').placeholder = 'Gross Weight';
                        netLabel.textContent = 'Net Weight';
                        document.getElementById('purchaseNetWeight').placeholder = 'Net Weight';
                        netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
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
                grossLabel.textContent = 'Gross Weight (kg)';
                document.getElementById('purchaseQuantity').placeholder = 'Gross Weight';
                netLabel.textContent = 'Net Weight';
                document.getElementById('purchaseNetWeight').placeholder = 'Net Weight';
                netHelp.textContent = 'Auto-calculated (Gross - Discount); you can edit';
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

        function addItemToPurchase() {
            const itemId = document.getElementById('purchaseItem').value;
            const supplierId = document.getElementById('purchaseSupplier').value;
            const grossWeight = parseFloat(document.getElementById('purchaseQuantity').value);
            const bags = parseFloat(document.getElementById('purchaseBags').value) || 0;
            const discountQty = parseFloat(document.getElementById('purchaseDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('purchaseRate').value) || 0;
            const amount = parseFloat(document.getElementById('purchaseAmount').value) || 0;
            
            if (!supplierId || !itemId || !grossWeight) {
                alert('Please select supplier, item and enter gross weight');
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
            
            const purchaseItem = {
                id: Date.now(),
                supplierId: supplierId,
                supplierName: supplier.name,
                itemId: itemId,
                itemName: item.name,
                grossWeight: grossWeight,
                bags: bags,
                netWeight: netWeight,
                discountQty: discountQty, // Store discount for reference
                rate: rate,
                total: total, // Invoice amount = rate x net quantity
                isCoconut: item.name.toLowerCase().includes('coconut') // Flag for special handling
            };
            
            currentPurchaseItems.push(purchaseItem);
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
            document.getElementById('purchaseDiscountQtyContainer').style.display = 'none';
            document.getElementById('purchaseBagsContainer').style.display = 'block';
        }

        function updateCurrentPurchaseItemsDisplay() {
            const tbody = document.getElementById('currentPurchaseItems');
            tbody.innerHTML = '';
            
            if (currentPurchaseItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No items added yet</td></tr>';
                return;
            }
            
            const discountVal = (gross, net) => (gross != null && net != null && !isNaN(gross) && !isNaN(net)) ? (gross - net) : '';
            
            currentPurchaseItems.forEach((item, index) => {
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-200';
                const bagsDisplay = item.isCoconut ? (item.discountQty || 0) : (item.bags ?? '');
                const discountDisplay = discountVal(item.grossWeight, item.netWeight);
                
                row.innerHTML = `
                    <td class="px-4 py-3">${item.supplierName || '-'}</td>
                    <td class="px-4 py-3">${item.itemName}</td>
                    <td class="px-4 py-3">${item.grossWeight}</td>
                    <td class="px-4 py-3">${bagsDisplay}</td>
                    <td class="px-4 py-3">${discountDisplay}</td>
                    <td class="px-4 py-3">${item.netWeight}</td>
                    <td class="px-4 py-3">${RU}${item.rate}</td>
                    <td class="px-4 py-3">${RU}${item.total.toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <button onclick="removeItemFromPurchase(${index})" class="text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
            renderPurchaseSupplierChargeRows();
        }

        function removeItemFromPurchase(index) {
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
            const catSelect = newRow.querySelector('.purchase-others-category');
            const otherWrap = newRow.querySelector('.purchase-others-other-reason-wrap');
            if (catSelect && otherWrap) {
                catSelect.addEventListener('change', function() {
                    otherWrap.style.display = this.value === 'Other' ? 'block' : 'none';
                    calculatePurchaseTotals();
                });
            }
            const inputs = newRow.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('input', calculatePurchaseTotals);
                input.addEventListener('change', calculatePurchaseTotals);
            });
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
            
            if (!date || !invoice || currentPurchaseItems.length === 0) {
                alert('Please fill in all required fields and add at least one item');
                return;
            }

            const purchaseGroups = Object.values(getCurrentPurchaseSupplierGroups());
            if (purchaseGroups.length === 0) {
                alert('Please select supplier for each item before saving.');
                return;
            }

            if (editingPurchaseId) {
                const hammali = parseFloat(document.getElementById('purchaseHammali').value) || 0;
                const advance = parseFloat(document.getElementById('purchaseAdvance').value) || 0;
                const othersEntries = getPurchaseOthersEntries();
                const itemsTotal = currentPurchaseItems.reduce((sum, item) => sum + item.total, 0);
                let grandTotal = itemsTotal + hammali - advance;
                othersEntries.forEach(entry => {
                    if (entry.operation === 'add') grandTotal += entry.amount;
                    else grandTotal -= entry.amount;
                });

                const invoiceTrim = (invoice || '').trim().toUpperCase();
                const duplicatePurchase = appData.purchases.find(p => (p.invoice || '').trim().toUpperCase() === invoiceTrim && p.id !== editingPurchaseId);
                if (duplicatePurchase) {
                    alert('This Purchase invoice number is already used. Please use a unique invoice number.');
                    return;
                }
                const supplier = appData.suppliers.find(s => s.id == supplierId);
                if (!supplier) {
                    alert('Selected supplier not found');
                    return;
                }

                // Editing existing purchase
                const existingPurchase = appData.purchases.find(p => p.id === editingPurchaseId);
                if (existingPurchase) {
                    // Reverse old inventory changes (using gross weight)
                    if (existingPurchase.items) {
                        existingPurchase.items.forEach(item => {
                            if (appData.inventory[item.itemId]) {
                                appData.inventory[item.itemId].quantity -= item.grossWeight;
                                appData.inventory[item.itemId].totalCost -= item.total;
                                if (appData.inventory[item.itemId].quantity <= 0) {
                                    delete appData.inventory[item.itemId];
                                }
                            }
                        });
                    }
                    
                    // Update purchase with new data
                    existingPurchase.date = date;
                    existingPurchase.invoice = invoice;
                    existingPurchase.supplierId = supplierId;
                    existingPurchase.supplierName = supplier.name;
                    existingPurchase.truck = truck;
                    existingPurchase.lrNumber = lrNumber;
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
                        appData.inventory[item.itemId].totalCost += item.total;
                    });
                }
                editingPurchaseId = null;
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

                const reservedInvoices = new Set();
                const singleSupplierEntry = allocatedGroups.length === 1;
                let createdCount = 0;
                allocatedGroups.forEach((group, idx) => {
                    const groupInvoice = singleSupplierEntry && idx === 0
                        ? invoice
                        : generateNextPurchaseInvoiceNumber(reservedInvoices);
                    const invoiceTrim = (groupInvoice || '').trim().toUpperCase();
                    const duplicatePurchase = appData.purchases.find(p => (p.invoice || '').trim().toUpperCase() === invoiceTrim);
                    if (duplicatePurchase) return;
                    reservedInvoices.add(groupInvoice);

                    const purchase = {
                        id: Date.now() + idx,
                        date: date,
                        invoice: groupInvoice,
                        supplierId: group.supplierId,
                        supplierName: group.supplierName,
                        truck: truck,
                        lrNumber: lrNumber,
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
                    createdCount++;
                });

                if (createdCount === 0) {
                    alert('Could not save purchase invoices due to invoice number conflicts. Please try again.');
                    return;
                }

                currentPurchaseItems.forEach(item => {
                    if (!appData.inventory[item.itemId]) {
                        appData.inventory[item.itemId] = { quantity: 0, totalCost: 0 };
                    }
                    appData.inventory[item.itemId].quantity += item.grossWeight;
                    appData.inventory[item.itemId].totalCost += item.total;
                });
            }
            
            saveData();
            updatePurchaseHistory();
            updateDashboard();
            
            // Regenerate ledger only if type and entity are already selected (avoid "Please select ledger type and entity" alert)
            const ledgerTypeEl = document.getElementById('ledgerType');
            const ledgerEntityEl = document.getElementById('ledgerEntity');
            if (typeof generateLedger === 'function' && ledgerTypeEl && ledgerEntityEl && ledgerTypeEl.value && ledgerEntityEl.value) {
                generateLedger();
            }
            
            // Hide cancel button
            document.getElementById('cancelPurchaseEdit').classList.add('hidden');
            
            // Clear form and return to history view
            clearPurchaseForm();
            const wasEditing = editingPurchaseId !== null;
            editingPurchaseId = null;
            alert(wasEditing ? 'Purchase updated successfully!' : 'Purchase invoice(s) saved successfully!');
            
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
            document.getElementById('purchaseHammali').value = '';
            document.getElementById('purchaseAdvance').value = '';
            var pdEl = document.getElementById('purchaseDiscount');
            if (pdEl) pdEl.value = '0';
            
            // Clear all Others rows except the first one
            const container = document.getElementById('purchaseOthersContainer');
            container.innerHTML = `
                <div class="purchase-others-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-3" data-index="0">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-2">Reason/Description</label>
                        <input type="text" class="purchase-others-reason w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter reason (e.g., Transport, Commission)">
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
            purchaseOthersIndex = 1;
            
            currentPurchaseItems = [];
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
            if (appData.purchases.some(p => (p.invoice || '').trim().toUpperCase() === invoiceTrim)) {
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
            tbody.innerHTML = '';
            
            if (filteredPurchases.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-4 py-12 text-center">
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
                var linkedSales = (appData.sales || []).filter(function(s) {
                    return s.linkedPurchases && s.linkedPurchases.some(function(lp) {
                        return String(lp.purchaseId) === String(purchase.id);
                    });
                });
                var linkedBadge = linkedSales.length > 0 ? ' <span class="inline-block ml-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title="Linked to sale(s): ' + escapeHtml(linkedSales.map(function(s){ return s.invoice || s.id; }).join(', ')) + '">Linked</span>' : '';
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-blue-50/50 transition-colors';
                row.innerHTML = `
                    <td class="px-4 py-3 text-sm">
                        <span class="text-slate-600">${purchase.date}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">${purchase.invoice}</span>${linkedBadge}
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-medium text-slate-700 text-sm">${escapeHtml(purchase.supplierName)}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-500">${purchase.truck || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            ${itemsText}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-semibold text-slate-800">${RU}${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="text-green-600 font-medium">${RU}${paid.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${currentBalance > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                            ${currentBalance > 0 ? RU + currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : 'Paid ' + CHECK}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="viewPurchase(${purchase.id})" class="action-btn action-view" title="View"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg></button>
                            <button onclick="printPurchaseInvoice(${purchase.id})" class="action-btn action-print" title="Print"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg></button>
                            <button onclick="editPurchase(${purchase.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="payPurchase(${purchase.id})" class="action-btn action-pay" title="Pay"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2H6V3zm0 4h12v2h-4.5c-.83 2.07-2.6 3.56-4.74 3.94L14 21h-2.5l-5.24-8H6v-2h4.5c1.38 0 2.56-.8 3.12-1.94L6 9V7z"/></svg></button>
                            <button onclick="deletePurchase(${purchase.id})" class="action-btn action-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg></button>
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
            
            if (!itemId || !quantity) {
                document.getElementById('purchaseTotal').textContent = '0';
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
            
            document.getElementById('purchaseTotal').textContent = total.toFixed(2);
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
        // Stock movement filtered data
        let filteredStockMovements = [];
        let allStockMovements = [];
        
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
            // Collect all stock movements from purchases and sales
            allStockMovements = [];
            
            // Add purchase movements
            appData.purchases.forEach(purchase => {
                if (purchase.items) {
                    purchase.items.forEach(item => {
                        allStockMovements.push({
                            date: purchase.date,
                            itemName: item.itemName,
                            itemId: item.itemId,
                            type: 'Purchase',
                            quantity: item.grossWeight,
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
                        allStockMovements.push({
                            date: sale.date,
                            itemName: item.itemName,
                            itemId: item.itemId,
                            type: 'Sale',
                            quantity: -item.grossWeight,
                            invoice: sale.invoice,
                            reference: sale.customerName,
                            unit: item.unit || 'kg'
                        });
                    });
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
                if (search && !m.itemName.toLowerCase().includes(search) && !m.reference.toLowerCase().includes(search)) return false;
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
                        <td colspan="6" class="px-4 py-12 text-center text-slate-500">
                            <svg class="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                            No stock movements found
                        </td>
                    </tr>
                `;
                document.getElementById('stockMovementPagination').innerHTML = '';
                return;
            }
            
            // Calculate running balances per item
            const balances = {};
            const movementsWithBalance = filteredStockMovements.map(m => {
                if (!balances[m.itemName]) balances[m.itemName] = 0;
                balances[m.itemName] += m.quantity;
                return { ...m, balance: balances[m.itemName] };
            });
            
            // Paginate
            const { currentPage, pageSize } = paginationState.stockMovement;
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedMovements = movementsWithBalance.slice(startIndex, startIndex + pageSize);
            
            paginatedMovements.forEach(m => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
                tr.innerHTML = `
                    <td class="px-4 py-3">
                        <span class="text-sm font-medium text-slate-700">${m.date}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-semibold text-slate-800">${m.itemName}</span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                            <span class="w-6 h-6 rounded-full flex items-center justify-center ${m.type === 'Purchase' ? 'bg-green-100' : 'bg-red-100'}">
                                <svg class="w-3 h-3 ${m.type === 'Purchase' ? 'text-green-600' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${m.type === 'Purchase' ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'}"/>
                                </svg>
                            </span>
                            <span class="px-2 py-1 rounded-full text-xs font-semibold ${m.type === 'Purchase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                ${m.type === 'Purchase' ? 'IN' : 'OUT'}
                            </span>
                        </div>
                    </td>
                    <td class="px-4 py-3">
                        <div class="text-xs">
                            <span class="font-medium text-slate-700">${m.invoice}</span>
                            <span class="text-slate-400 block">${m.reference}</span>
                        </div>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${m.quantity > 0 ? '+' : ''}${m.quantity.toLocaleString('en-IN', {minimumFractionDigits: 2})} ${m.unit}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded">
                            ${m.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})} ${m.unit}
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
            
            if (itemId && appData.inventory[itemId]) {
                const item = appData.items.find(i => i.id == itemId);
                availableStockElement.textContent = `Available: ${appData.inventory[itemId].quantity} ${item.unit}`;
                
                // Special handling for coconut products
                if (item.name.toLowerCase().includes('coconut')) {
                    bagsContainer.style.display = 'none';
                    discountQtyContainer.style.display = 'block';
                    
                    // Update labels for coconut
                    grossLabel.textContent = 'Gross Quantity (kg)';
                    document.getElementById('saleQuantity').placeholder = 'Gross Quantity';
                    netLabel.textContent = 'Net Quantity';
                    document.getElementById('saleNetWeight').placeholder = 'Net Quantity';
                    netHelp.textContent = 'Auto-calculated (Gross - Discount)';
                    
                    // Clear bags value for coconut
                    document.getElementById('saleBags').value = '0';
                } else {
                    bagsContainer.style.display = 'block';
                    discountQtyContainer.style.display = 'none';
                    document.getElementById('saleDiscountQty').value = '0';
                    
                    // Reset labels
                    grossLabel.textContent = 'Gross Weight (kg)';
                    document.getElementById('saleQuantity').placeholder = 'Gross Weight';
                    netLabel.textContent = 'Net Weight';
                    document.getElementById('saleNetWeight').placeholder = 'Net Weight';
                    netHelp.textContent = 'Auto-calculated (Gross - Bags)';
                }
            } else {
                availableStockElement.textContent = 'Available: 0';
                bagsContainer.style.display = 'block';
                discountQtyContainer.style.display = 'none';
                
                // Reset labels
                if (grossLabel) {
                    grossLabel.textContent = 'Gross Weight (kg)';
                    document.getElementById('saleQuantity').placeholder = 'Gross Weight';
                    netLabel.textContent = 'Net Weight';
                    document.getElementById('saleNetWeight').placeholder = 'Net Weight';
                    netHelp.textContent = 'Auto-calculated (Gross - Bags)';
                }
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
            const grossWeight = parseFloat(document.getElementById('saleQuantity').value);
            const bags = parseFloat(document.getElementById('saleBags').value) || 0;
            const discountQty = parseFloat(document.getElementById('saleDiscountQty').value) || 0;
            const rate = parseFloat(document.getElementById('saleRate').value);
            
            if (!itemId || !grossWeight || !rate) {
                alert('Please select item, enter gross weight and rate');
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
            let effectiveAvailable = (appData.inventory[itemId] && appData.inventory[itemId].quantity) || 0;
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
            // Discount typically flows from bags (non-coconut); default to bags value.
            document.getElementById('saleDiscount').value = item.isCoconut ? 0 : (item.bags || 0);
            document.getElementById('saleDiscountQty').value = item.discountQty || 0;
            document.getElementById('saleRate').value = item.rate || '';

            // Let the shared auto-calc compute Net Weight & Item Total (same as new entry).
            calculateSaleItemTotal();
            
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
            tbody.innerHTML = '';
            
            if (currentSaleItems.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No items added yet</td></tr>';
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
                    <td class="px-4 py-3">${item.itemName}</td>
                    <td class="px-4 py-3">${item.grossWeight}</td>
                    ${middleColumn}
                    <td class="px-4 py-3">${item.netWeight}</td>
                    <td class="px-4 py-3">${RU}${item.rate}</td>
                    <td class="px-4 py-3">${RU}${item.total.toFixed(2)}</td>
                    <td class="px-4 py-3">${actionCell}</td>
                `;
                tbody.appendChild(row);
            });
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
            
            // Add event listeners for real-time calculation
            const inputs = newRow.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('input', calculateSaleTotals);
                input.addEventListener('change', calculateSaleTotals);
            });
            
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
            
            if (!date || !invoice || !customerId || currentSaleItems.length === 0) {
                alert('Please fill in all required fields and add at least one item');
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
                    existingSale.truck = truck;
                    existingSale.lrNumber = lrNumber;
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
                    
                    // Deduct new inventory for updated sale (using gross weight)
                    adjustInventoryForSaleItems(currentSaleItems, -1);
                }
                resetSaleEditSessionState();
                editingSaleId = null;
            } else {
                // Creating new sale
                const sale = {
                    id: Date.now(),
                    date: date,
                    invoice: invoice,
                    customerId: customerId,
                    customerName: customer.name,
                    truck: truck,
                    lrNumber: lrNumber,
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
                
                // Update inventory for new sale (using gross weight)
                adjustInventoryForSaleItems(currentSaleItems, -1);
            }
            
            saveData();
            updateSalesHistory();
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
            saleOthersIndex = 1;
            
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

        // Purchase Linking Functions
        function showPurchaseLinkingModal() {
            // Reset temporary linked purchases to current state
            tempLinkedPurchases = JSON.parse(JSON.stringify(linkedPurchases));
            
            // Populate available purchases
            const container = document.getElementById('availablePurchasesList');
            container.innerHTML = '';
            
            if (appData.purchases.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-center py-4">No purchase invoices available</p>';
            } else {
                appData.purchases.forEach(purchase => {
                    const isLinked = tempLinkedPurchases.some(lp => String(lp.purchaseId) === String(purchase.id));
                    
                    const div = document.createElement('div');
                    div.className = 'border border-slate-300 rounded-lg p-4 ' + (isLinked ? 'bg-blue-50 border-blue-400' : 'bg-white');
                    
                    // Calculate available quantity for this purchase
                    const totalPurchased = purchase.items ? purchase.items.reduce((sum, item) => sum + item.grossWeight, 0) : 0;
                    const alreadyLinked = appData.sales ? appData.sales.reduce((sum, sale) => {
                        if (sale.linkedPurchases && sale.id !== editingSaleId) {
                            const linked = sale.linkedPurchases.find(lp => String(lp.purchaseId) === String(purchase.id));
                            return sum + (linked ? linked.quantityUsed : 0);
                        }
                        return sum;
                    }, 0) : 0;
                    const currentlyLinked = tempLinkedPurchases.find(lp => String(lp.purchaseId) === String(purchase.id));
                    const currentLinkedQty = currentlyLinked ? currentlyLinked.quantityUsed : 0;
                    const availableQty = totalPurchased - alreadyLinked + currentLinkedQty;
                    
                    div.innerHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex-1">
                                <div class="font-semibold text-slate-800">Invoice: ${purchase.invoice}</div>
                                <div class="text-sm text-slate-600">Date: ${purchase.date} | Supplier: ${purchase.supplierName}</div>
                                <div class="text-sm text-slate-600">Total Amount: ${RU}${(purchase.grandTotal || purchase.total || 0).toFixed(2)}</div>
                                <div class="text-sm font-medium ${availableQty > 0 ? 'text-green-600' : 'text-red-600'}">
                                    Available Quantity: ${availableQty.toFixed(2)} kg
                                </div>
                            </div>
                            <label class="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" 
                                       id="purchase_${purchase.id}" 
                                       ${isLinked ? 'checked' : ''}
                                       ${availableQty <= 0 && !isLinked ? 'disabled' : ''}
                                       onchange="togglePurchaseLink(${purchase.id})"
                                       class="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                <span class="text-sm font-medium">Link</span>
                            </label>
                        </div>
                        <div id="quantity_container_${purchase.id}" class="${isLinked ? '' : 'hidden'} mt-3 pt-3 border-t border-slate-200">
                            <label class="block text-sm font-medium text-slate-700 mb-2">Quantity to use from this purchase (kg):</label>
                            <input type="number" 
                                   id="quantity_${purchase.id}" 
                                   value="${currentLinkedQty}"
                                   max="${availableQty}"
                                   step="0.01"
                                   class="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                   placeholder="Enter quantity">
                        </div>
                    `;
                    container.appendChild(div);
                });
            }
            
            document.getElementById('purchaseLinkingModal').classList.remove('hidden');
        }

        function togglePurchaseLink(purchaseId) {
            const checkbox = document.getElementById(`purchase_${purchaseId}`);
            const quantityContainer = document.getElementById(`quantity_container_${purchaseId}`);
            
            if (checkbox.checked) {
                quantityContainer.classList.remove('hidden');
                // Add to temp linked purchases if not already there
                if (!tempLinkedPurchases.some(lp => String(lp.purchaseId) === String(purchaseId))) {
                    tempLinkedPurchases.push({
                        purchaseId: purchaseId,
                        quantityUsed: 0
                    });
                }
            } else {
                quantityContainer.classList.add('hidden');
                // Remove from temp linked purchases
                tempLinkedPurchases = tempLinkedPurchases.filter(lp => String(lp.purchaseId) !== String(purchaseId));
            }
        }

        function confirmPurchaseLinking() {
            // Validate and collect quantities
            const validatedLinks = [];
            let hasError = false;
            
            for (const link of tempLinkedPurchases) {
                const quantityInput = document.getElementById(`quantity_${link.purchaseId}`);
                const quantity = parseFloat(quantityInput.value) || 0;
                
                if (quantity <= 0) {
                    alert('Please enter a valid quantity for all linked purchases');
                    hasError = true;
                    break;
                }
                
                validatedLinks.push({
                    purchaseId: link.purchaseId,
                    quantityUsed: quantity
                });
            }
            
            if (!hasError) {
                linkedPurchases = validatedLinks;
                updateLinkedPurchasesDisplay();
                closePurchaseLinkingModal();
            }
        }

        function updateLinkedPurchasesDisplay() {
            const container = document.getElementById('linkedPurchasesList');
            
            if (linkedPurchases.length === 0) {
                container.innerHTML = '<p class="text-slate-500 text-sm italic">No purchases linked yet. Click "Link Purchase" to add.</p>';
            } else {
                container.innerHTML = '';
                linkedPurchases.forEach(link => {
                    const purchase = appData.purchases.find(p => String(p.id) === String(link.purchaseId));
                    if (purchase) {
                        const div = document.createElement('div');
                        div.className = 'flex justify-between items-center p-3 bg-white border border-blue-300 rounded-lg';
                        div.innerHTML = `
                            <div class="flex-1">
                                <div class="font-medium text-slate-800">ðŸ“„ Invoice: ${purchase.invoice} | Supplier: ${purchase.supplierName}</div>
                                <div class="text-sm text-slate-600">Quantity: ${link.quantityUsed} kg | Amount: ${RU}${(purchase.grandTotal || purchase.total || 0).toFixed(2)}</div>
                            </div>
                            <button onclick="removePurchaseLink(${link.purchaseId})" class="text-red-600 hover:text-red-800 font-bold">\u2716</button>
                        `;
                        container.appendChild(div);
                    }
                });
            }
        }

        function removePurchaseLink(purchaseId) {
            linkedPurchases = linkedPurchases.filter(lp => String(lp.purchaseId) !== String(purchaseId));
            updateLinkedPurchasesDisplay();
        }

        function closePurchaseLinkingModal() {
            document.getElementById('purchaseLinkingModal').classList.add('hidden');
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
                if (!appData.inventory[itemId] || appData.inventory[itemId].quantity < quantity) {
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
            tbody.innerHTML = '';
            
            if (filteredSales.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="px-4 py-12 text-center">
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
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-green-50/50 transition-colors';
                row.innerHTML = `
                    <td class="px-4 py-3 text-sm">
                        <span class="text-slate-600">${sale.date}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-mono text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">${sale.invoice}</span>
                    </td>
                    <td class="px-4 py-3">
                        <span class="font-medium text-slate-700 text-sm">${escapeHtml(sale.customerName)}</span>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-500">${sale.truck || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            ${itemsText}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="font-semibold text-slate-800">${RU}${grandTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="text-green-600 font-medium">${RU}${received.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </td>
                    <td class="px-4 py-3 text-right">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${currentBalance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}">
                            ${currentBalance > 0 ? RU + currentBalance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : 'Received ' + CHECK}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex items-center justify-center gap-1">
                            <button onclick="viewSale(${sale.id})" class="action-btn action-view" title="View"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/><path fill-rule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg></button>
                            <button onclick="printSaleInvoice(${sale.id})" class="action-btn action-print" title="Print Invoice"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"/></svg></button>
                            <button onclick="printDeliveryChallan(${sale.id})" class="action-btn" title="Delivery Challan"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/><path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/></svg></button>
                            <button onclick="editSale(${sale.id})" class="action-btn action-edit" title="Edit"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg></button>
                            <button onclick="receiveSale(${sale.id})" class="action-btn action-pay" title="Receive Payment"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v2H6V3zm0 4h12v2h-4.5c-.83 2.07-2.6 3.56-4.74 3.94L14 21h-2.5l-5.24-8H6v-2h4.5c1.38 0 2.56-.8 3.12-1.94L6 9V7z"/></svg></button>
                            <button onclick="deleteSale(${sale.id})" class="action-btn action-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clip-rule="evenodd"/></svg></button>
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
            const totalCosts = filteredPurchases.reduce((sum, purchase) => {
                const purchaseTotal = (purchase.grandTotal || purchase.total || 0);
                const invoiceAdvance = parseFloat(purchase.advance) || 0;
                return sum + purchaseTotal + invoiceAdvance; // add invoice advance back to exclude from P&L
            }, 0);
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
                            const purchaseTotalForPnL = purchaseTotalRaw + purchaseInvoiceAdvance; // exclude invoice advance from P&L
                            const proportionalPurchaseCost = totalPurchaseQty > 0 ? (purchaseTotalForPnL / totalPurchaseQty) * link.quantityUsed : 0;
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
                        linkedPurchaseIds.add(link.purchaseId);
                    });
                }
            });
            
            filteredPurchases.forEach(purchase => {
                if (!linkedPurchaseIds.has(purchase.id)) {
                    const purchaseTotal = (purchase.grandTotal || purchase.total || 0) + (parseFloat(purchase.advance) || 0); // exclude invoice advance from P&L
                    const purchaseBrokerage = getBrokerageForPurchase(purchase);
                    pnlRows.push({
                        purchaseDate: purchase.date,
                        purchaseInvoice: purchase.invoice,
                        purchaseSupplier: purchase.supplierName,
                        purchaseTotal: purchaseTotal,
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
            paginationState.pnl.currentPage = 1; // Reset to first page
            
            // Render the table with pagination
            renderPnLTable(pnlRows);
            
            // Show export button after generating report
            document.getElementById('exportPnLBtn').style.display = 'block';
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
            
            // Get paginated data
            const { currentPage, pageSize } = paginationState.pnl;
            const paginatedRows = getPaginatedData(pnlRows, currentPage, pageSize);
            
            paginatedRows.forEach(row => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-200 hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseDate || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseInvoice || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30">${row.purchaseSupplier || '-'}</td>
                    <td class="px-4 py-3 bg-blue-50/30 border-r-2 border-r-slate-300">${row.purchaseTotal > 0 ? `${RU}${row.purchaseTotal.toFixed(2)}` : '-'}</td>
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
            const totalCosts = pnlRows.reduce((sum, row) => sum + (row.purchaseTotal || 0), 0);
            const totalRevenue = pnlRows.reduce((sum, row) => sum + (row.saleTotal || 0), 0);
            const totalDeductionsInRows = pnlRows.reduce((sum, row) => sum + (row.deductionsAmount || 0), 0);
            const netProfit = pnlRows.reduce((sum, row) => sum + (row.profitLoss || 0), 0);
            
            // Add grand total row only on last page
            const totalPages = Math.ceil(pnlRows.length / pageSize);
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
                pnlRows.length,
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
            var totalRevenue = totalRevenueEl ? (totalRevenueEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var totalCosts = totalCostsEl ? (totalCostsEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            var netProfit = netProfitEl ? (netProfitEl.textContent || '').replace(RU, '').replace(/,/g, '') : '0';
            csv += 'SUMMARY\n';
            csv += 'Total Revenue,' + totalRevenue + '\n';
            csv += 'Total Costs,' + totalCosts + '\n';
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
            
            entitySelect.innerHTML = '<option value="">Select Entity</option>';
            
            if (type === 'supplier') {
                appData.suppliers.forEach(supplier => {
                    entitySelect.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
                });
            } else if (type === 'customer') {
                appData.customers.forEach(customer => {
                    entitySelect.innerHTML += `<option value="${customer.id}">${customer.name}</option>`;
                });
            } else if (type === 'broker') {
                appData.brokers.forEach(broker => {
                    entitySelect.innerHTML += `<option value="${broker.id}">${broker.name}</option>`;
                });
            }
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
            }
            
            // Sort entries by date
            entries.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calculate running balance after sorting
            balance = 0;
            entries.forEach(entry => {
                balance += entry.debit - entry.credit;
                entry.balance = balance;
            });
            
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
            
            // Store entries for pagination
            currentLedgerData = entries;
            paginationState.ledger.currentPage = 1; // Reset to first page
            
            // Render the table with pagination
            renderLedgerTable(entries);
            
            var printLedgerBtn = document.getElementById('printLedgerBtn');
            if (entries.length === 0) {
                balanceSection.style.display = 'none';
                document.getElementById('exportLedgerBtn').style.display = 'none';
                if (printLedgerBtn) printLedgerBtn.style.display = 'none';
            } else {
                document.getElementById('exportLedgerBtn').style.display = 'block';
                if (printLedgerBtn) printLedgerBtn.style.display = 'block';
            }
        }
        
        function printLedgerStatement() {
            const entries = typeof currentLedgerData !== 'undefined' && Array.isArray(currentLedgerData) ? currentLedgerData : [];
            const meta = window.currentLedgerData || {};
            const company = appData.company || {};
            const entityName = meta.entityName || document.getElementById('ledgerEntityName').textContent || 'Ledger';
            const balance = meta.balance != null ? meta.balance : 0;
            const ledgerType = meta.type || 'ledger';
            const typeLabel = ledgerType === 'supplier' ? 'Supplier' : ledgerType === 'customer' ? 'Customer' : 'Broker';
            const fromEl = document.getElementById('ledgerFromDate');
            const toEl = document.getElementById('ledgerToDate');
            const fromDate = fromEl && fromEl.value ? fromEl.value : '';
            const toDate = toEl && toEl.value ? toEl.value : '';
            const dateRangeText = (fromDate || toDate) ? ('Period: ' + (fromDate || '...') + ' to ' + (toDate || '...')) : 'All entries';
            let rowsHtml = entries.map(e => 
                '<tr><td class="inv-td">' + e.date + '</td><td class="inv-td">' + escapeHtml(e.description) + '</td><td class="inv-td">' + escapeHtml(e.invoice || '') + '</td><td class="inv-td text-right">' + (e.debit ? RU + e.debit.toFixed(2) : '-') + '</td><td class="inv-td text-right">' + (e.credit ? RU + e.credit.toFixed(2) : '-') + '</td><td class="inv-td text-right">' + RU + (e.balance || 0).toFixed(2) + '</td></tr>'
            ).join('');
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
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
            `);
            printWindow.document.close();
            printWindow.print();
        }
        
        function renderLedgerTable(entries) {
            const tbody = document.getElementById('ledgerEntries');
            tbody.innerHTML = '';
            
            if (entries.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No entries found for selected entity</td></tr>';
                document.getElementById('ledgerPagination').innerHTML = '';
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
                            (p.type === 'ledger_payment' && p.entityType === 'customer' && String(p.entityId) === String(customerId)))
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

        function printPurchaseInvoice(purchaseId) {
            const purchase = appData.purchases.find(p => p.id === purchaseId);
            if (!purchase) return;
            
            const printWindow = window.open('', '_blank');
            const company = appData.company;
            
            let itemsHtml = '';
            if (purchase.items) {
                purchase.items.forEach((item) => {
                    const bagsDisplay = item.isCoconut ? (item.discountQty || 0) : (item.bags ?? '');
                    const discountDisplay = (item.grossWeight != null && item.netWeight != null && !isNaN(item.grossWeight) && !isNaN(item.netWeight)) ? (item.grossWeight - item.netWeight) : '';
                    itemsHtml += `
                        <tr>
                            <td class="inv-td">${item.itemName}</td>
                            <td class="inv-td text-center">${item.grossWeight}</td>
                            <td class="inv-td text-center">${bagsDisplay}</td>
                            <td class="inv-td text-center">${discountDisplay}</td>
                            <td class="inv-td text-center">${item.netWeight}</td>
                            <td class="inv-td text-right">${RU}${item.rate}</td>
                            <td class="inv-td text-right">${RU}${item.total.toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
            
            const supplier = appData.suppliers.find(s => s.id == purchase.supplierId);
            
            // Calculate ledger balance with detailed breakdown
            let ledgerBalance = 0;
            let openingTotal = 0;
            let purchasesTotal = 0;
            let paymentsTotal = 0;
            
            // Count opening balances - ensure array exists and is not null
            if (appData.openingBalances && Array.isArray(appData.openingBalances) && appData.openingBalances.length > 0) {
                appData.openingBalances
                    .filter(ob => ob.entityType === 'supplier' && String(ob.entityId) === String(purchase.supplierId))
                    .forEach(opening => {
                        openingTotal += opening.amount || 0;
                    });
            }
            
            // Count purchases
            if (appData.purchases && Array.isArray(appData.purchases)) {
                appData.purchases
                    .filter(p => String(p.supplierId) === String(purchase.supplierId))
                    .forEach(p => {
                        purchasesTotal += p.grandTotal || p.total || 0;
                    });
            }
            
            // Count payments
            if (appData.payments && Array.isArray(appData.payments)) {
                appData.payments
                    .filter(p => (p.type === 'purchase' && appData.purchases.find(pur => pur.id === p.invoiceId && String(pur.supplierId) === String(purchase.supplierId))) || 
                                (p.type === 'ledger_payment' && p.entityType === 'supplier' && String(p.entityId) === String(purchase.supplierId)))
                    .forEach(payment => {
                        paymentsTotal += payment.amount || 0;
                    });
            }
            
            ledgerBalance = openingTotal + purchasesTotal - paymentsTotal;
            
            const amountInWords = numberToWords(purchase.grandTotal || purchase.total || 0);
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Purchase Invoice - ${purchase.invoice}</title>
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
                            <div><strong>Invoice No:</strong> ${purchase.invoice}</div>
                            <div><strong>Date:</strong> ${purchase.date}</div>
                            <div><strong>Truck No:</strong> ${purchase.truck || '—'}</div>
                            <div><strong>LR Number:</strong> ${purchase.lrNumber || '—'}</div>
                        </div>
                    </div>
                    <table class="inv-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th class="text-center">Gross Wt</th>
                                <th class="text-center">Bag/Quantity</th>
                                <th class="text-center">Discount</th>
                                <th class="text-center">Net Wt</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Amount</th>
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
            `);
            
            printWindow.document.close();
            printWindow.print();
        }

        function printSaleInvoice(saleId) {
            const sale = appData.sales.find(s => s.id === saleId);
            if (!sale) return;
            
            const printWindow = window.open('', '_blank');
            const company = appData.company;
            
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
                            <td class="border px-2 py-1 text-center">${item.grossWeight}</td>
                            ${middleColumn}
                            <td class="border px-2 py-1 text-center">${item.netWeight}</td>
                            <td class="border px-2 py-1 text-right">${RU}${item.rate}</td>
                            <td class="border px-2 py-1 text-right">${RU}${item.total.toFixed(2)}</td>
                        </tr>
                    `;
                });
            }
            
            const customer = appData.customers.find(c => c.id == sale.customerId);
            
            // DEBUG: Log opening balances data
            console.log('=== INVOICE PRINT DEBUG ===');
            console.log('Customer ID:', sale.customerId);
            console.log('appData.openingBalances:', appData.openingBalances);
            console.log('Is Array?:', Array.isArray(appData.openingBalances));
            console.log('Length:', appData.openingBalances ? appData.openingBalances.length : 'undefined');
            
            // Calculate ledger balance with detailed breakdown
            let ledgerBalance = 0;
            let openingTotal = 0;
            let salesTotal = 0;
            let paymentsTotal = 0;
            let deductionsTotal = 0;
            
            // Count opening balances - ensure array exists and is not null
            if (appData.openingBalances && Array.isArray(appData.openingBalances) && appData.openingBalances.length > 0) {
                const filteredOpenings = appData.openingBalances.filter(ob => ob.entityType === 'customer' && String(ob.entityId) === String(sale.customerId));
                console.log('Filtered openings for this customer:', filteredOpenings);
                
                filteredOpenings.forEach(opening => {
                    openingTotal += opening.amount || 0;
                    console.log('Adding opening balance:', opening.amount, 'Total now:', openingTotal);
                });
            } else {
                console.log('No opening balances found or array is empty');
            }
            
            console.log('Final openingTotal:', openingTotal);
            console.log('===========================');
            
            // Count sales
            if (appData.sales && Array.isArray(appData.sales)) {
                appData.sales
                    .filter(s => String(s.customerId) === String(sale.customerId))
                    .forEach(s => {
                        salesTotal += s.grandTotal || s.total || 0;
                    });
            }
            
            // Count payments
            if (appData.payments && Array.isArray(appData.payments)) {
                appData.payments
                    .filter(p => (p.type === 'sale' && appData.sales.find(s => s.id === p.invoiceId && String(s.customerId) === String(sale.customerId))) || 
                                (p.type === 'ledger_payment' && p.entityType === 'customer' && String(p.entityId) === String(sale.customerId)))
                    .forEach(payment => {
                        paymentsTotal += Math.abs(payment.amount) || 0;
                    });
            }
            
            // Count deductions
            if (appData.deductions && Array.isArray(appData.deductions)) {
                appData.deductions
                    .filter(d => String(d.customerId) === String(sale.customerId))
                    .forEach(deduction => {
                        deductionsTotal += deduction.amount || 0;
                    });
            }
            
            ledgerBalance = openingTotal + salesTotal - paymentsTotal - deductionsTotal;
            
            const amountInWords = numberToWords(sale.grandTotal || sale.total || 0);
            
            printWindow.document.write(`
                <html>
                <head>
                    <title>Sale Invoice - ${sale.invoice}</title>
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
                                <strong>Invoice No:</strong> ${sale.invoice}<br>
                                <strong>Date:</strong> ${sale.date}<br>
                                <strong>Truck No:</strong> ${sale.truck || 'N/A'}<br>
                                <strong>LR Number:</strong> ${sale.lrNumber || 'N/A'}
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
                                <th class="border px-2 py-1">Gross Weight</th>
                                <th class="border px-2 py-1">Bags/Discount</th>
                                <th class="border px-2 py-1">Net Weight</th>
                                <th class="border px-2 py-1">Rate</th>
                                <th class="border px-2 py-1">Amount</th>
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
            `);
            
            printWindow.document.close();
            printWindow.print();
        }

        function printDeliveryChallan(saleId) {
            var sale = appData.sales.find(function(s) { return s.id === saleId; });
            if (!sale) return;
            var company = appData.company || {};
            var customer = appData.customers.find(function(c) { return c.id == sale.customerId; });
            var custName = (customer && customer.name) ? customer.name : (sale.customerName || 'Customer');
            var challanNo = 'DC-' + (sale.date || '').replace(/-/g, '') + '-' + (sale.invoice || sale.id || '');
            var itemsRows = '';
            if (sale.items && sale.items.length) {
                sale.items.forEach(function(item) {
                    itemsRows += '<tr><td style="border:1px solid #000;padding:6px;">' + escapeHtml(item.itemName) + '</td><td style="border:1px solid #000;padding:6px;text-align:right;">' + (item.netWeight || item.grossWeight || '-') + '</td><td style="border:1px solid #000;padding:6px;">kg</td></tr>';
                });
            } else {
                itemsRows = '<tr><td colspan="3" style="border:1px solid #000;padding:8px;text-align:center;">No items</td></tr>';
            }
            var win = window.open('', '_blank');
            win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Delivery Challan - ' + escapeHtml(challanNo) + '</title><style>body{font-family:Arial,sans-serif;margin:20px;} .header{text-align:center;margin-bottom:20px;} table{width:100%;border-collapse:collapse;} .sig{ margin-top:40px; border:1px solid #000; padding:30px; width:220px; text-align:center;}</style></head><body>' +
                '<div class="header"><h1>' + escapeHtml(company.name || 'ITCO') + '</h1><h2>DELIVERY CHALLAN</h2></div>' +
                '<p><strong>Challan No:</strong> ' + escapeHtml(challanNo) + ' &nbsp; <strong>Date:</strong> ' + escapeHtml(sale.date || '') + ' &nbsp; <strong>Invoice Ref:</strong> ' + escapeHtml(sale.invoice || '') + '</p>' +
                '<p><strong>Customer:</strong> ' + escapeHtml(custName) + '</p>' +
                '<p><strong>Vehicle / Truck:</strong> ' + escapeHtml(sale.truck || '') + '</p>' +
                '<table><thead><tr style="background:#f0f0f0;"><th style="border:1px solid #000;padding:8px;">Item</th><th style="border:1px solid #000;padding:8px;">Quantity</th><th style="border:1px solid #000;padding:8px;">Unit</th></tr></thead><tbody>' + itemsRows + '</tbody></table>' +
                '<p style="margin-top:16px;"><strong>Remarks:</strong> _________________________________________</p>' +
                '<div style="margin-top:40px;display:flex;justify-content:space-between;">' +
                '<div class="sig">Receiver Signature<br/><br/><br/></div>' +
                '<div class="sig">Authorised Signature</div>' +
                '</div></body></html>');
            win.document.close();
            win.focus();
            setTimeout(function() { win.print(); }, 250);
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
                                        <td class="border border-slate-300 px-3 py-2 text-sm">${entry.description}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-center text-sm">${entry.operation}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${entry.amount.toFixed(2)}</td>
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
                        <p class="text-sm text-slate-600">Invoice No: ${purchase.invoice}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded">
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                            <p class="font-semibold text-slate-900">${purchase.date}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Supplier</p>
                            <p class="font-semibold text-slate-900">${purchase.supplierName}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Truck No</p>
                            <p class="font-semibold text-slate-900">${purchase.truck || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">LR Number</p>
                            <p class="font-semibold text-slate-900">${purchase.lrNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Invoice No</p>
                            <p class="font-semibold text-slate-900">${purchase.invoice}</p>
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
            
            // Fill the form with existing data
            document.getElementById('purchaseDate').value = purchase.date;
            document.getElementById('purchaseInvoice').value = purchase.invoice;
            document.getElementById('purchaseSupplier').value = purchase.supplierId;
            syncPurchaseSupplierDisplay();
            document.getElementById('purchaseTruck').value = purchase.truck || '';
            var plrEl = document.getElementById('purchaseLRNumber');
            if (plrEl) plrEl.value = purchase.lrNumber || '';
            document.getElementById('purchaseHammali').value = purchase.hammali || 0;
            document.getElementById('purchaseAdvance').value = purchase.advance || 0;
            const totalModeRadio = document.getElementById('purchaseChargeModeTotal');
            if (totalModeRadio) totalModeRadio.checked = true;
            
            // Load items into current items array
            currentPurchaseItems = purchase.items ? [...purchase.items] : [];
            updateCurrentPurchaseItemsDisplay();
            onPurchaseChargeModeChange();
            calculatePurchaseTotals();
            
            // Show the purchase form
            showPurchaseForm();
            
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
            document.getElementById('purchaseHammali').value = '';
            document.getElementById('purchaseAdvance').value = '';
            var pdEl = document.getElementById('purchaseDiscount');
            if (pdEl) pdEl.value = '0';
            
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
            
            // Clear current items
            currentPurchaseItems = [];
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
                                        <td class="border border-slate-300 px-3 py-2 text-sm">${entry.description}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-center text-sm">${entry.operation}</td>
                                        <td class="border border-slate-300 px-3 py-2 text-right text-sm">${RU}${entry.amount.toFixed(2)}</td>
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
                        <p class="text-sm text-slate-600">Invoice No: ${sale.invoice}</p>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4 bg-slate-50 p-4 rounded">
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Date</p>
                            <p class="font-semibold text-slate-900">${sale.date}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Customer</p>
                            <p class="font-semibold text-slate-900">${sale.customerName}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Truck No</p>
                            <p class="font-semibold text-slate-900">${sale.truck || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-slate-500 uppercase tracking-wide">Invoice No</p>
                            <p class="font-semibold text-slate-900">${sale.invoice}</p>
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
            
            // Fill the form with existing data
            document.getElementById('saleDate').value = sale.date;
            document.getElementById('saleInvoice').value = sale.invoice;
            document.getElementById('saleCustomer').value = sale.customerId;
            syncSaleCustomerDisplay();
            document.getElementById('saleTruck').value = sale.truck || '';
            document.getElementById('saleHammali').value = sale.hammali || 0;
            document.getElementById('saleAdvance').value = sale.advance || 0;
            
            // Load items into current items array
            currentSaleItems = sale.items ? [...sale.items] : [];
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            
            // Load linked purchases
            linkedPurchases = sale.linkedPurchases ? [...sale.linkedPurchases] : [];
            updateLinkedPurchasesDisplay();
            
            // Show the sales form
            showSalesForm();
            
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
            document.getElementById('saleDate').value = '';
            document.getElementById('saleInvoice').value = '';
            document.getElementById('saleCustomer').value = '';
            var sci = document.getElementById('saleCustomerInput');
            if (sci) sci.value = '';
            var scd = document.getElementById('saleCustomerDropdown');
            if (scd) scd.classList.add('hidden');
            document.getElementById('saleTruck').value = '';
            document.getElementById('saleLRNumber').value = '';
            document.getElementById('saleHammali').value = '';
            document.getElementById('saleAdvance').value = '';
            document.getElementById('saleTruckAdvance').value = '';
            var sdEl = document.getElementById('saleDiscount');
            if (sdEl) sdEl.value = '0';
            
            // Clear Others fields
            const othersContainer = document.getElementById('saleOthersContainer');
            if (othersContainer) {
                othersContainer.innerHTML = `
                    <div class="sale-others-row grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
            
            // Clear current items
            currentSaleItems = [];
            updateCurrentSaleItemsDisplay();
            calculateSaleTotals();
            editingSaleId = null;
            editingSaleItemIndex = -1;
            resetSaleItemFormMode();
            resetSaleEditSessionState();
        }

        let currentPaymentData = null;

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
            var dateStr = d.toLocaleDateString('en-IN');
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
                date: new Date().toISOString().split('T')[0]
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
                var invoiceList = salesLinkedToThisPurchase.map(function(s) { return s.invoice || ('Sale #' + s.id); }).join(', ');
                alert('Cannot delete this purchase because it is linked to the following sale(s):\n\n' + invoiceList + '\n\nProcess: Purchase is first, then sale of that purchase. Remove this purchase from the linked list in those sales (Edit sale → Link to Purchase), or delete those sales first, then delete this purchase.');
                return;
            }
            
            // Check if any items from this purchase have been sold (extra safety for any sale using same items)
            let soldItems = [];
            if (purchase.items) {
                purchase.items.forEach(purchaseItem => {
                    // Check if this item has been sold
                    const salesWithThisItem = appData.sales.filter(sale => {
                        if (sale.items) {
                            return sale.items.some(saleItem => saleItem.itemId == purchaseItem.itemId);
                        }
                        return sale.itemId == purchaseItem.itemId;
                    });
                    
                    if (salesWithThisItem.length > 0) {
                        soldItems.push({
                            itemName: purchaseItem.itemName,
                            sales: salesWithThisItem.map(s => s.invoice).join(', ')
                        });
                    }
                });
            }
            
            if (soldItems.length > 0) {
                let message = 'Cannot delete this purchase because the following items have been sold:\n\n';
                soldItems.forEach(item => {
                    message += `${BULLET} ${item.itemName} (sold in: ${item.sales})\n`;
                });
                message += '\nPlease delete the related sales entries first, then try deleting this purchase.';
                alert(message);
                return;
            }
            
            if (confirm('Are you sure you want to delete this purchase? This will also update inventory and remove all related transactions.')) {
                // Reverse inventory changes (using gross weight)
                if (purchase.items) {
                    purchase.items.forEach(item => {
                        if (appData.inventory[item.itemId]) {
                            appData.inventory[item.itemId].quantity -= item.grossWeight;
                            appData.inventory[item.itemId].totalCost -= item.total;
                            
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
            showPage('home');
            updateItemsList();
            updateSuppliersList();
            updateCustomersList();
            updateBrokersList();
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
        });
