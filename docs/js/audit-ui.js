// In-app Auto Audit UI (CA-ready)
var autoAuditResultCache = null;
var autoAuditSelectedLedgerKeys = {}; // key: ledgerType|accountId -> true/false

function formatAuditINR(value) {
  var n = parseFloat(value) || 0;
  var currency = (typeof RU !== 'undefined') ? RU : '\u20b9';
  return currency + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function __isoToday() {
  return new Date().toISOString().split('T')[0];
}

function __setFinancialYearDefaults() {
  var today = new Date();
  var month = today.getMonth(); // 0-11
  var year = today.getFullYear();

  // FY: Apr (month=3) to Mar (month=2)
  var fyStartYear;
  if (month < 3) {
    fyStartYear = year - 1;
  } else {
    fyStartYear = year;
  }
  var fromDate = fyStartYear + '-04-01';
  var toDate = __isoToday();

  var fromEl = document.getElementById('auditFromDate');
  var toEl = document.getElementById('auditToDate');
  if (fromEl) fromEl.value = fromDate;
  if (toEl) toEl.value = toDate;
}

function __readAuditDateRangeFromUI() {
  var fromEl = document.getElementById('auditFromDate');
  var toEl = document.getElementById('auditToDate');
  var presetEl = document.getElementById('auditPeriodPreset');

  if (presetEl && presetEl.value === 'fy') {
    __setFinancialYearDefaults();
  }

  return {
    fromDateStr: fromEl ? fromEl.value : '',
    toDateStr: toEl ? toEl.value : ''
  };
}

function toggleSelectAllAuditAccounts(checked) {
  autoAuditSelectedLedgerKeys = {};
  var body = document.getElementById('auditLedgerAccountsBody');
  if (!body) return;

  if (checked && autoAuditResultCache && autoAuditResultCache.ledgerAccounts) {
    (autoAuditResultCache.ledgerAccounts || []).forEach(function(a) {
      var key = a.ledgerType + '|' + a.accountId;
      autoAuditSelectedLedgerKeys[key] = true;
    });
  }

  var inputs = body.querySelectorAll('input[type="checkbox"][data-audit-account-key]');
  inputs.forEach(function(cb) {
    cb.checked = checked;
  });
  updateSelectedAccountsCount();
}

function updateSelectedAccountsCount() {
  var countEl = document.getElementById('auditSelectedAccountsCount');
  if (!countEl) return;
  var count = 0;
  Object.keys(autoAuditSelectedLedgerKeys).forEach(function(k) {
    if (autoAuditSelectedLedgerKeys[k]) count++;
  });
  countEl.textContent = count;
}

function renderAuditLedgerAccountsList() {
  var body = document.getElementById('auditLedgerAccountsBody');
  if (!body) return;
  if (!autoAuditResultCache || !autoAuditResultCache.ledgerAccounts) {
    body.innerHTML = '<div class="audit-empty">Run audit to load ledger accounts.</div>';
    return;
  }

  var searchEl = document.getElementById('auditLedgerSearch');
  var q = (searchEl && searchEl.value) ? String(searchEl.value).trim().toLowerCase() : '';

  var accounts = autoAuditResultCache.ledgerAccounts || [];
  if (q) {
    accounts = accounts.filter(function(a) {
      return String(a.accountName || '').toLowerCase().indexOf(q) >= 0 || String(a.ledgerType || '').toLowerCase().indexOf(q) >= 0;
    });
  }

  if (!accounts.length) {
    body.innerHTML = '<div class="audit-empty">No ledger accounts match your search.</div>';
    return;
  }

  body.innerHTML = accounts.map(function(a) {
    var key = a.ledgerType + '|' + a.accountId;
    var checked = !!autoAuditSelectedLedgerKeys[key];
    var closing = formatAuditINR(a.closingBalance);
    var bucketTotal = formatAuditINR(a.bucketTotal);
    return '' +
      '<div class="border-b border-slate-200 px-3 py-2 flex items-start gap-3">' +
      '<label class="flex items-start gap-3 flex-1 cursor-pointer">' +
      '<input type="checkbox" class="mt-1" data-audit-account-key="' + escapeHtml(key) + '" ' + (checked ? 'checked' : '') + ' onclick="onAuditLedgerAccountCheckboxToggle(this)"/>' +
      '<div class="flex-1">' +
      '<div class="text-sm font-semibold text-slate-800">' + escapeHtml(a.accountName) + ' <span class="text-xs font-normal text-slate-500">(' + escapeHtml(a.ledgerType) + ')</span></div>' +
      '<div class="text-xs text-slate-600">Closing Balance: <strong>' + closing + '</strong></div>' +
      '<div class="text-xs text-slate-500">Outstanding Buckets Total: ' + bucketTotal + '</div>' +
      '</div>' +
      '</label>' +
      '</div>';
  }).join('');

  updateSelectedAccountsCount();
}

function onAuditLedgerAccountCheckboxToggle(cb) {
  var key = cb.getAttribute('data-audit-account-key');
  autoAuditSelectedLedgerKeys[key] = cb.checked;
  updateSelectedAccountsCount();
}

function runAutoAudit() {
  var statusEl = document.getElementById('auditStatusText');
  if (!statusEl) return;
  try {
    autoAuditSelectedLedgerKeys = {};
    var dates = __readAuditDateRangeFromUI();

    autoAuditResultCache = computeAutoAuditCA(appData || {}, dates.fromDateStr, dates.toDateStr);

    var summaryList = document.getElementById('auditSummaryList');
    var checksList = document.getElementById('auditChecksList');
    var bankBody = document.getElementById('auditBankTableBody');
    var exBody = document.getElementById('auditExceptionsTableBody');

    var mismatchBody = document.getElementById('auditMismatchTableBody');
    var periodSummaryEl = document.getElementById('auditPeriodSummary');
    var ledgerReconEl = document.getElementById('auditLedgerReconciliation');
    var agingBody = document.getElementById('auditAgingTableBody');

    // Summary
    if (summaryList) {
      var bank = autoAuditResultCache.bankAudit;
      var ps = autoAuditResultCache.periodSummary;
      summaryList.innerHTML =
        '<div><strong>Bank Payments (outflow):</strong> ' + formatAuditINR(bank.summary.totalSupplierCredit) + '</div>' +
        '<div><strong>Customer Receipts (inflow):</strong> ' + formatAuditINR(bank.summary.totalCustomerDebit) + '</div>' +
        '<div><strong>Net Movement:</strong> ' + formatAuditINR(bank.summary.totalNetMovement) + '</div>' +
        '<div><strong>Purchases Created:</strong> ' + formatAuditINR(ps.totalPurchases) + '</div>' +
        '<div><strong>Sales Created:</strong> ' + formatAuditINR(ps.totalSales) + '</div>' +
        '<div><strong>Net Profit/Loss (approx):</strong> ' + formatAuditINR(ps.netProfitLike) + '</div>';
    }

    // Checks
    if (checksList) {
      checksList.innerHTML = (autoAuditResultCache.checks || []).map(function(c) {
        return '<li><strong>' + escapeHtml(c.status) + '</strong> - ' + escapeHtml(c.name) + ': ' + escapeHtml(c.detail) + '</li>';
      }).join('');
    }

    // Bank table
    if (bankBody) {
      if (!autoAuditResultCache.bankAudit.bankRows.length) {
        bankBody.innerHTML = '<tr><td colspan="4" class="audit-empty">No bank movement data found.</td></tr>';
      } else {
        bankBody.innerHTML = autoAuditResultCache.bankAudit.bankRows.map(function(r) {
          return '<tr>' +
            '<td>' + escapeHtml(r.bank) + '</td>' +
            '<td class="num">' + formatAuditINR(r.supplierCredit) + '</td>' +
            '<td class="num">' + formatAuditINR(r.customerDebit) + '</td>' +
            '<td class="num">' + formatAuditINR(r.netMovement) + '</td>' +
            '</tr>';
        }).join('');
      }
    }

    // Exceptions table
    if (exBody) {
      if (!autoAuditResultCache.bankAudit.exceptions.length) {
        exBody.innerHTML = '<tr><td colspan="5" class="audit-empty">No exceptions found.</td></tr>';
      } else {
        exBody.innerHTML = autoAuditResultCache.bankAudit.exceptions.map(function(e) {
          return '<tr>' +
            '<td>' + escapeHtml(e.date) + '</td>' +
            '<td>' + escapeHtml(e.type) + '</td>' +
            '<td>' + escapeHtml(e.party) + '</td>' +
            '<td>' + escapeHtml(e.mode) + '</td>' +
            '<td>' + escapeHtml(e.issue) + '</td>' +
            '</tr>';
        }).join('');
      }
    }

    // Mismatch table
    if (mismatchBody) {
      if (!autoAuditResultCache.mismatchExceptions.length) {
        mismatchBody.innerHTML = '<tr><td colspan="7" class="audit-empty">No invoice mismatch exceptions found.</td></tr>';
      } else {
        mismatchBody.innerHTML = autoAuditResultCache.mismatchExceptions.map(function(m) {
          return '<tr>' +
            '<td>' + escapeHtml(m.date) + '</td>' +
            '<td>' + escapeHtml(m.type) + '</td>' +
            '<td>' + escapeHtml(m.invoice) + '</td>' +
            '<td class="num">' + formatAuditINR(m.expected) + '</td>' +
            '<td class="num">' + formatAuditINR(m.captured) + '</td>' +
            '<td>' + escapeHtml(m.issue) + '</td>' +
            '</tr>';
        }).join('');
      }
    }

    // Period summary
    if (periodSummaryEl) {
      var ps2 = autoAuditResultCache.periodSummary;
      periodSummaryEl.innerHTML =
        '<div><strong>Total Purchases:</strong> ' + formatAuditINR(ps2.totalPurchases) + '</div>' +
        '<div><strong>Total Sales:</strong> ' + formatAuditINR(ps2.totalSales) + '</div>' +
        '<div><strong>Total Brokerage:</strong> ' + formatAuditINR(ps2.totalBrokerage) + '</div>' +
        '<div><strong>Total Deductions:</strong> ' + formatAuditINR(ps2.totalDeductions) + '</div>' +
        '<div><strong>Net Profit/Loss (approx):</strong> ' + formatAuditINR(ps2.netProfitLike) + '</div>' +
        '<div><strong>Supplier Payments Outflow:</strong> ' + formatAuditINR(ps2.supplierPaymentOutflow) + '</div>' +
        '<div><strong>Customer Receipts Inflow:</strong> ' + formatAuditINR(ps2.customerReceiptInflow) + '</div>';
    }

    // Ledger reconciliation (high-level)
    if (ledgerReconEl) {
      var ledgerAccounts = autoAuditResultCache.ledgerAccounts || [];
      var sumSup = 0, sumCus = 0, sumBr = 0;
      ledgerAccounts.forEach(function(a) {
        if (a.ledgerType === 'supplier') sumSup += parseFloat(a.closingBalance) || 0;
        if (a.ledgerType === 'customer') sumCus += parseFloat(a.closingBalance) || 0;
        if (a.ledgerType === 'broker') sumBr += parseFloat(a.closingBalance) || 0;
      });
      ledgerReconEl.innerHTML =
        '<div><strong>As-of Date:</strong> ' + escapeHtml(autoAuditResultCache.asOfDateStr) + '</div>' +
        '<div><strong>Supplier Ledgers:</strong> ' + ledgerAccounts.filter(function(x){return x.ledgerType==='supplier';}).length + '</div>' +
        '<div><strong>Customer Ledgers:</strong> ' + ledgerAccounts.filter(function(x){return x.ledgerType==='customer';}).length + '</div>' +
        '<div><strong>Broker Ledgers:</strong> ' + ledgerAccounts.filter(function(x){return x.ledgerType==='broker';}).length + '</div>' +
        '<div><strong>Total Supplier Closing:</strong> ' + formatAuditINR(sumSup) + '</div>' +
        '<div><strong>Total Customer Closing:</strong> ' + formatAuditINR(sumCus) + '</div>' +
        '<div><strong>Total Broker Closing:</strong> ' + formatAuditINR(sumBr) + '</div>';
    }

    // Aging table
    if (agingBody) {
      if (!autoAuditResultCache.agingRows.length) {
        agingBody.innerHTML = '<tr><td colspan="7" class="audit-empty">No ageing outstanding found.</td></tr>';
      } else {
        agingBody.innerHTML = autoAuditResultCache.agingRows.map(function(r) {
          return '<tr>' +
            '<td>' + escapeHtml(r.party) + '</td>' +
            '<td>' + escapeHtml(r.type) + '</td>' +
            '<td class="num">' + formatAuditINR(r.b0) + '</td>' +
            '<td class="num">' + formatAuditINR(r.b1) + '</td>' +
            '<td class="num">' + formatAuditINR(r.b2) + '</td>' +
            '<td class="num">' + formatAuditINR(r.b3) + '</td>' +
            '<td class="num">' + formatAuditINR(r.total) + '</td>' +
            '</tr>';
        }).join('');
      }
    }

    // Ledger accounts picker
    var selectAll = document.getElementById('auditSelectAllAccounts');
    renderAuditLedgerAccountsList();
    // Default selection: export all ledger accounts unless user unchecks.
    if (selectAll) {
      selectAll.checked = true;
      toggleSelectAllAuditAccounts(true);
    }

    statusEl.textContent = 'Audit generated successfully.';
  } catch (e) {
    console.error('Auto audit failed:', e);
    statusEl.textContent = 'Auto audit failed. Check console for details.';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Default dates on audit page load.
  var preset = document.getElementById('auditPeriodPreset');
  if (preset && preset.value === 'fy') {
    __setFinancialYearDefaults();
  } else if (preset) {
    // If custom, still ensure inputs exist.
    __setFinancialYearDefaults();
  }

  var presetEl = document.getElementById('auditPeriodPreset');
  if (presetEl) {
    presetEl.addEventListener('change', function() {
      if (presetEl.value === 'fy') __setFinancialYearDefaults();
    });
  }
});

