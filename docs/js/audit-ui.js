let auditAppData = null;
let auditResultCache = null;

function formatINR(value) {
  return "\u20b9" + (parseFloat(value) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setStatus(text) {
  const el = document.getElementById("statusText");
  if (el) el.textContent = text;
}

function renderAudit(result) {
  auditResultCache = result;
  const summaryEl = document.getElementById("summaryList");
  const checksEl = document.getElementById("checksList");
  const bankBody = document.getElementById("bankAuditTableBody");
  const exBody = document.getElementById("exceptionsTableBody");

  if (summaryEl) {
    summaryEl.innerHTML = `
      <p>Total Payments: <strong>${result.summary.totalPayments}</strong></p>
      <p>Supplier Credit (Outflow): <strong>${formatINR(result.summary.totalSupplierCredit)}</strong></p>
      <p>Customer Debit (Inflow): <strong>${formatINR(result.summary.totalCustomerDebit)}</strong></p>
      <p>Net Movement: <strong>${formatINR(result.summary.totalNetMovement)}</strong></p>
      <p>Unique Bank Accounts: <strong>${result.summary.uniqueBankAccounts}</strong></p>
    `;
  }

  if (checksEl) {
    checksEl.innerHTML = result.checks.map(c => `<li><strong>${c.status}</strong> - ${c.name}: ${c.detail}</li>`).join("");
  }

  if (bankBody) {
    if (!result.bankRows.length) {
      bankBody.innerHTML = '<tr><td colspan="4" class="empty">No bank movement data found.</td></tr>';
    } else {
      bankBody.innerHTML = result.bankRows.map(r => `
        <tr>
          <td>${r.bank}</td>
          <td class="num">${formatINR(r.supplierCredit)}</td>
          <td class="num">${formatINR(r.customerDebit)}</td>
          <td class="num">${formatINR(r.netMovement)}</td>
        </tr>
      `).join("");
    }
  }

  if (exBody) {
    if (!result.exceptions.length) {
      exBody.innerHTML = '<tr><td colspan="5" class="empty">No exceptions.</td></tr>';
    } else {
      exBody.innerHTML = result.exceptions.map(e => `
        <tr>
          <td>${e.date}</td>
          <td>${e.type}</td>
          <td>${e.party}</td>
          <td>${e.mode}</td>
          <td>${e.issue}</td>
        </tr>
      `).join("");
    }
  }
}

function runAudit() {
  if (!auditAppData) {
    setStatus("No data loaded.");
    return;
  }
  const result = computeBankAudit(auditAppData);
  renderAudit(result);
  setStatus("Audit generated successfully.");
}

function loadFromParentWindow() {
  try {
    if (window.opener && window.opener.appData) {
      auditAppData = JSON.parse(JSON.stringify(window.opener.appData));
      setStatus("Loaded live data from main app window.");
      runAudit();
      return;
    }
    setStatus("Main app live data not found. Use JSON backup load.");
  } catch (e) {
    setStatus("Failed to load live data. Use JSON backup load.");
  }
}

function handleJsonUpload(evt) {
  const file = evt.target.files && evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      auditAppData = JSON.parse(e.target.result);
      setStatus("Loaded data from JSON backup.");
      runAudit();
    } catch (err) {
      setStatus("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", function() {
  const loadBtn = document.getElementById("loadFromParentBtn");
  const fileInput = document.getElementById("jsonFileInput");
  if (loadBtn) loadBtn.addEventListener("click", loadFromParentWindow);
  if (fileInput) fileInput.addEventListener("change", handleJsonUpload);
});
