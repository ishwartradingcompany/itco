function exportBankAuditCsv() {
  if (!auditResultCache) {
    alert("Generate audit first.");
    return;
  }
  let csv = "\uFEFFBank Account,Supplier Credit,Customer Debit,Net Movement\n";
  auditResultCache.bankRows.forEach(r => {
    csv += `"${(r.bank || "").replace(/"/g, '""')}",${(r.supplierCredit || 0).toFixed(2)},${(r.customerDebit || 0).toFixed(2)},${(r.netMovement || 0).toFixed(2)}\n`;
  });
  csv += "\nExceptions\nDate,Type,Party,Mode,Issue\n";
  auditResultCache.exceptions.forEach(e => {
    csv += `"${(e.date || "").replace(/"/g, '""')}","${(e.type || "").replace(/"/g, '""')}","${(e.party || "").replace(/"/g, '""')}","${(e.mode || "").replace(/"/g, '""')}","${(e.issue || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "CA_Bank_Audit_" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", function() {
  const btn = document.getElementById("exportCsvBtn");
  if (btn) btn.addEventListener("click", exportBankAuditCsv);
});
