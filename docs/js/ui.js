/**
 * UI utilities: date/time, sidebar toggle, page titles
 */
function updateDateTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    const dateEl = document.getElementById("headerDate");
    const timeEl = document.getElementById("headerTime");
    if (dateEl) dateEl.textContent = formattedDate;
    if (timeEl) timeEl.textContent = formattedTime;
}

if (typeof setInterval !== 'undefined') {
    setInterval(updateDateTime, 1000);
    updateDateTime();
}

function updateRecordsCount() {
    if (typeof appData === 'undefined') return;
    const total = (appData.purchases?.length || 0) +
        (appData.sales?.length || 0) +
        (appData.brokerage?.length || 0) +
        (appData.deductions?.length || 0);
    const el = document.getElementById('totalRecords');
    if (el) el.textContent = total;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.getElementById('mainContent');
    const expandBtn = document.getElementById('sidebarExpandBtn');

    sidebar.classList.toggle('collapsed');
    mainWrapper.classList.toggle('sidebar-collapsed');

    if (sidebar.classList.contains('collapsed')) {
        expandBtn.style.display = 'flex';
    } else {
        expandBtn.style.display = 'none';
    }
}

const pageTitles = {
    'home': 'Dashboard',
    'purchase': 'Purchase Management',
    'sales': 'Sales Management',
    'inventory': 'Inventory Management',
    'broker': 'Broker Management',
    'deductions': 'Deductions Management',
    'payments': 'Payment Tracking',
    'opening': 'Opening Balance',
    'pnl': 'Profit & Loss Statement',
    'ledger': 'Ledger Management',
    'reports': 'Reports & Analytics',
    'master': 'Master Data'
};
