function exportAutoAuditCsv() {
  if (!autoAuditResultCache) {
    alert('Run Auto Audit first.');
    return;
  }

  var ledgerAccounts = autoAuditResultCache.ledgerAccounts || [];
  var selectedKeys = (typeof autoAuditSelectedLedgerKeys !== 'undefined' && autoAuditSelectedLedgerKeys)
    ? autoAuditSelectedLedgerKeys
    : {};

  var selectedAccounts = ledgerAccounts.filter(function(a) {
    var key = a.ledgerType + '|' + a.accountId;
    return !!selectedKeys[key];
  });

  // If nothing is explicitly selected, export all (safe default).
  if (selectedAccounts.length === 0) selectedAccounts = ledgerAccounts;

  var pack = {
    meta: {
      generatedAt: new Date().toISOString(),
      fromDate: autoAuditResultCache.fromDateStr || '',
      toDate: autoAuditResultCache.toDateStr || '',
      asOfDate: autoAuditResultCache.asOfDateStr || ''
    },
    periodSummary: autoAuditResultCache.periodSummary || {},
    bankAudit: autoAuditResultCache.bankAudit || {},
    checks: autoAuditResultCache.checks || [],
    invoiceMismatchExceptions: autoAuditResultCache.mismatchExceptions || [],
    agingRows: autoAuditResultCache.agingRows || [],
    selectedLedgerAccounts: selectedAccounts
  };

  var today = new Date().toISOString().slice(0, 10);

  // JSON pack
  var jsonBlob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json;charset=utf-8' });
  var jsonUrl = window.URL.createObjectURL(jsonBlob);
  var jsonA = document.createElement('a');
  jsonA.href = jsonUrl;
  jsonA.download = 'CA_AutoAudit_Pack_' + today + '.json';
  document.body.appendChild(jsonA);
  jsonA.click();
  document.body.removeChild(jsonA);
  window.URL.revokeObjectURL(jsonUrl);

  // Ledger accounts CSV
  var csv = "\uFEFFLedgerType,AccountId,AccountName,ClosingBalance,b0_0_30,b1_31_60,b2_61_90,b3_90_plus,TotalOutstanding\n";
  selectedAccounts.forEach(function(a) {
    csv += '"' + String(a.ledgerType || '').replace(/"/g, '""') + '",' +
      '"' + String(a.accountId || '').replace(/"/g, '""') + '",' +
      '"' + String(a.accountName || '').replace(/"/g, '""') + '",' +
      (parseFloat(a.closingBalance) || 0).toFixed(2) + ',' +
      (parseFloat(a.b0) || 0).toFixed(2) + ',' +
      (parseFloat(a.b1) || 0).toFixed(2) + ',' +
      (parseFloat(a.b2) || 0).toFixed(2) + ',' +
      (parseFloat(a.b3) || 0).toFixed(2) + ',' +
      (parseFloat(a.bucketTotal) || parseFloat(a.total) || 0).toFixed(2) + '\n';
  });

  var csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  var csvUrl = window.URL.createObjectURL(csvBlob);
  var csvA = document.createElement('a');
  csvA.href = csvUrl;
  csvA.download = 'CA_AutoAudit_LedgerAccounts_' + today + '.csv';
  document.body.appendChild(csvA);
  csvA.click();
  document.body.removeChild(csvA);
  window.URL.revokeObjectURL(csvUrl);
}

