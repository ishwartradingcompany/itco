function exportAutoAuditCsv() {
  if (!autoAuditResultCache) {
    alert('Run Auto Audit first.');
    return;
  }

  var csv = "\uFEFFBank Account,Supplier Payments (Credit),Customer Receipts (Debit),Net Movement\n";
  autoAuditResultCache.bankRows.forEach(function(r) {
    csv += '"' + String(r.bank || '').replace(/"/g, '""') + '",' +
      (parseFloat(r.supplierCredit) || 0).toFixed(2) + ',' +
      (parseFloat(r.customerDebit) || 0).toFixed(2) + ',' +
      (parseFloat(r.netMovement) || 0).toFixed(2) + '\n';
  });

  csv += "\nExceptions\nDate,Type,Party,Mode,Issue\n";
  autoAuditResultCache.exceptions.forEach(function(e) {
    csv += '"' + String(e.date || '').replace(/"/g, '""') + '",' +
      '"' + String(e.type || '').replace(/"/g, '""') + '",' +
      '"' + String(e.party || '').replace(/"/g, '""') + '",' +
      '"' + String(e.mode || '').replace(/"/g, '""') + '",' +
      '"' + String(e.issue || '').replace(/"/g, '""') + '"\n';
  });

  var blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = "CA_Auto_Audit_Bank_" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

