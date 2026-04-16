function computeBankAudit(appData) {
  const payments = (appData && appData.payments) ? appData.payments : [];
  const result = {};
  const exceptions = [];
  let supplierCredit = 0;
  let customerDebit = 0;

  function getBankLabel(p) {
    return p.bankAccountName || p.bankAccountNumber || p.bankAccountId || "Unknown/Not Captured";
  }

  payments.forEach(p => {
    const amount = parseFloat(p.amount) || 0;
    const mode = (p.mode || "").toLowerCase();
    const needsBank = mode === "bank" || mode === "upi";
    const hasBank = !!(p.bankAccountId || p.bankAccountName || p.bankAccountNumber);
    const bankLabel = getBankLabel(p);

    if (!result[bankLabel]) {
      result[bankLabel] = {
        bank: bankLabel,
        supplierCredit: 0,
        customerDebit: 0
      };
    }

    const isSupplierPayment = p.type === "purchase" || (p.type === "ledger_payment" && p.entityType === "supplier");
    const isCustomerReceipt = p.type === "sale" || (p.type === "ledger_receipt" && p.entityType === "customer");

    if (isSupplierPayment) {
      result[bankLabel].supplierCredit += amount;
      supplierCredit += amount;
    }
    if (isCustomerReceipt) {
      result[bankLabel].customerDebit += amount;
      customerDebit += amount;
    }

    if (needsBank && !hasBank) {
      exceptions.push({
        date: p.date || "-",
        type: p.type || "-",
        party: p.party || "-",
        mode: p.mode || "-",
        issue: "Bank/UPI mode used but bank account not captured"
      });
    }
  });

  const rows = Object.values(result).map(r => ({
    bank: r.bank,
    supplierCredit: r.supplierCredit,
    customerDebit: r.customerDebit,
    netMovement: r.customerDebit - r.supplierCredit
  }));

  return {
    summary: {
      totalPayments: payments.length,
      totalSupplierCredit: supplierCredit,
      totalCustomerDebit: customerDebit,
      totalNetMovement: customerDebit - supplierCredit,
      uniqueBankAccounts: rows.length
    },
    checks: [
      {
        name: "Bank capture for Bank/UPI",
        status: exceptions.length === 0 ? "PASS" : "FAIL",
        detail: exceptions.length === 0 ? "All bank/UPI entries have bank account captured" : `${exceptions.length} entries missing bank account`
      }
    ],
    bankRows: rows,
    exceptions: exceptions
  };
}
