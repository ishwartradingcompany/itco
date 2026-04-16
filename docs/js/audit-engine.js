// Bank-aware audit engine (CA-ready checks)
// Uses appData.payments as the source of truth.
function computeAutoAuditBank(data) {
  var payments = (data && data.payments) ? data.payments : [];
  var resultByBank = {};
  var exceptions = [];
  var supplierCreditTotal = 0;
  var customerDebitTotal = 0;

  function bankLabel(p) {
    return p.bankAccountName || p.bankAccountNumber || p.bankAccountId || 'Unknown/Not Captured';
  }

  payments.forEach(function(p) {
    var amount = parseFloat(p.amount) || 0;
    var mode = (p.mode || '').toLowerCase();

    var needsBankAccount = (mode === 'bank' || mode === 'upi');
    var hasBankAccount = !!(p.bankAccountId || p.bankAccountName || p.bankAccountNumber);

    var isSupplierPayment = p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier');
    var isCustomerReceipt = p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer');

    var label = bankLabel(p);
    if (!resultByBank[label]) resultByBank[label] = { bank: label, supplierCredit: 0, customerDebit: 0 };

    if (isSupplierPayment) {
      resultByBank[label].supplierCredit += amount;
      supplierCreditTotal += amount;
    }

    if (isCustomerReceipt) {
      resultByBank[label].customerDebit += amount;
      customerDebitTotal += amount;
    }

    if (needsBankAccount && !hasBankAccount) {
      exceptions.push({
        date: p.date || '-',
        type: p.type || '-',
        party: p.party || '-',
        mode: p.mode || '-',
        issue: 'Bank/UPI mode used but bank account not captured'
      });
    }
  });

  var bankRows = Object.keys(resultByBank).map(function(k) {
    var r = resultByBank[k];
    return {
      bank: r.bank,
      supplierCredit: r.supplierCredit,
      customerDebit: r.customerDebit,
      netMovement: r.customerDebit - r.supplierCredit
    };
  });

  return {
    summary: {
      totalPayments: payments.length,
      totalSupplierCredit: supplierCreditTotal,
      totalCustomerDebit: customerDebitTotal,
      totalNetMovement: customerDebitTotal - supplierCreditTotal,
      uniqueBankAccounts: bankRows.length
    },
    checks: [
      {
        name: 'Bank capture for Bank/UPI',
        status: exceptions.length === 0 ? 'PASS' : 'FAIL',
        detail: exceptions.length === 0
          ? 'All bank/UPI entries have bank account captured'
          : exceptions.length + ' entries missing bank account'
      }
    ],
    bankRows: bankRows,
    exceptions: exceptions
  };
}

