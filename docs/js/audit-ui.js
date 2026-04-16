// In-app Auto Audit UI
var autoAuditResultCache = null;

function formatAuditINR(value) {
  var n = parseFloat(value) || 0;
  var currency = (typeof RU !== 'undefined') ? RU : '\u20b9';
  return currency + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function runAutoAudit() {
  var statusEl = document.getElementById('auditStatusText');
  if (!statusEl) return;
  try {
    autoAuditResultCache = computeAutoAuditBank(appData || {});

    var summaryList = document.getElementById('auditSummaryList');
    var checksList = document.getElementById('auditChecksList');
    var bankBody = document.getElementById('auditBankTableBody');
    var exBody = document.getElementById('auditExceptionsTableBody');

    if (summaryList) {
      summaryList.innerHTML =
        '<div><strong>Total Payments:</strong> ' + autoAuditResultCache.summary.totalPayments + '</div>' +
        '<div><strong>Supplier Payments (Credit):</strong> ' + formatAuditINR(autoAuditResultCache.summary.totalSupplierCredit) + '</div>' +
        '<div><strong>Customer Receipts (Debit):</strong> ' + formatAuditINR(autoAuditResultCache.summary.totalCustomerDebit) + '</div>' +
        '<div><strong>Net Movement:</strong> ' + formatAuditINR(autoAuditResultCache.summary.totalNetMovement) + '</div>' +
        '<div><strong>Unique Banks:</strong> ' + autoAuditResultCache.summary.uniqueBankAccounts + '</div>';
    }

    if (checksList) {
      checksList.innerHTML = autoAuditResultCache.checks.map(function(c) {
        var status = escapeHtml(c.status);
        var name = escapeHtml(c.name);
        var detail = escapeHtml(c.detail);
        return '<li><strong>' + status + '</strong> - ' + name + ': ' + detail + '</li>';
      }).join('');
    }

    if (bankBody) {
      if (!autoAuditResultCache.bankRows.length) {
        bankBody.innerHTML = '<tr><td colspan="4" class="audit-empty">No bank movement data found.</td></tr>';
      } else {
        bankBody.innerHTML = autoAuditResultCache.bankRows.map(function(r) {
          return '<tr>' +
            '<td>' + escapeHtml(r.bank) + '</td>' +
            '<td class="num">' + formatAuditINR(r.supplierCredit) + '</td>' +
            '<td class="num">' + formatAuditINR(r.customerDebit) + '</td>' +
            '<td class="num">' + formatAuditINR(r.netMovement) + '</td>' +
            '</tr>';
        }).join('');
      }
    }

    if (exBody) {
      if (!autoAuditResultCache.exceptions.length) {
        exBody.innerHTML = '<tr><td colspan="5" class="audit-empty">No exceptions found.</td></tr>';
      } else {
        exBody.innerHTML = autoAuditResultCache.exceptions.map(function(e) {
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

    statusEl.textContent = 'Audit generated successfully.';
  } catch (e) {
    console.error('Auto audit failed:', e);
    statusEl.textContent = 'Auto audit failed. Check console for details.';
  }
}

