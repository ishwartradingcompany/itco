// Bank-aware audit engine (CA-ready checks)
// Uses appData.payments / purchases / sales as the source of truth.

function __auditToTs(dateStr) {
  if (!dateStr) return null;
  // Treat as local date to avoid timezone shift.
  return new Date(dateStr + 'T00:00:00').getTime();
}

function __auditInRange(dateStr, fromTs, toTs) {
  var t = __auditToTs(dateStr);
  if (t == null) return false;
  if (fromTs != null && t < fromTs) return false;
  if (toTs != null && t > toTs) return false;
  return true;
}

function __auditDaysDiff(refDateStr, targetDateStr) {
  var refTs = __auditToTs(refDateStr);
  var tarTs = __auditToTs(targetDateStr);
  if (refTs == null || tarTs == null) return 0;
  var ms = refTs - tarTs;
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function __auditBucket(days) {
  if (days <= 30) return 'b0';
  if (days <= 60) return 'b1';
  if (days <= 90) return 'b2';
  return 'b3';
}

function __auditBankLabel(p) {
  return p.bankAccountName || p.bankAccountNumber || p.bankAccountId || 'Unknown/Not Captured';
}

function computeAutoAuditBank(data, fromDateStr, toDateStr) {
  var payments = (data && data.payments) ? data.payments : [];
  var fromTs = __auditToTs(fromDateStr);
  var toTs = __auditToTs(toDateStr);

  var resultByBank = {};
  var exceptions = [];
  var supplierCreditTotal = 0;
  var customerDebitTotal = 0;

  payments.forEach(function(p) {
    // Optional date filter for period-wise bank audit.
    if (fromTs != null || toTs != null) {
      if (!__auditInRange(p.date, fromTs, toTs)) return;
    }

    var amount = parseFloat(p.amount) || 0;
    var mode = (p.mode || '').toLowerCase();

    var needsBankAccount = (mode === 'bank' || mode === 'upi');
    var hasBankAccount = !!(p.bankAccountId || p.bankAccountName || p.bankAccountNumber);

    var isSupplierPayment = p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier');
    var isCustomerReceipt = p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer');

    var label = __auditBankLabel(p);
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

function computeInvoiceMismatchChecks(data, fromDateStr, toDateStr) {
  var purchases = (data && data.purchases) ? data.purchases : [];
  var sales = (data && data.sales) ? data.sales : [];
  var payments = (data && data.payments) ? data.payments : [];
  var fromTs = __auditToTs(fromDateStr);
  var toTs = __auditToTs(toDateStr);
  var tolerance = 0.05;

  function sumPaymentsForInvoice(type, invoiceId) {
    var sum = 0;
    payments.forEach(function(p) {
      if (p.type !== type) return;
      if ((p.invoiceId || null) !== invoiceId) return;
      sum += (parseFloat(p.amount) || 0);
    });
    return sum;
  }

  var mismatch = [];

  purchases.forEach(function(p) {
    // Limit by purchase date if a range is provided.
    if (fromTs != null || toTs != null) {
      if (!__auditInRange(p.date, fromTs, toTs)) return;
    }
    var expected = parseFloat(p.paid) || 0;
    var captured = sumPaymentsForInvoice('purchase', p.id);
    if (Math.abs(expected - captured) > tolerance) {
      mismatch.push({
        date: p.date || '-',
        type: 'Purchase',
        invoice: p.invoice || '-',
        expected: expected,
        captured: captured,
        issue: 'Paid amount mismatch vs captured payments'
      });
    }
    // Balance math check
    var computedBalance = (parseFloat(p.grandTotal) || 0) - (parseFloat(p.paid) || 0);
    var storedBalance = parseFloat(p.balance) || 0;
    if (Math.abs(computedBalance - storedBalance) > tolerance) {
      mismatch.push({
        date: p.date || '-',
        type: 'Purchase',
        invoice: p.invoice || '-',
        expected: computedBalance,
        captured: storedBalance,
        issue: 'Balance math mismatch'
      });
    }
  });

  sales.forEach(function(s) {
    if (fromTs != null || toTs != null) {
      if (!__auditInRange(s.date, fromTs, toTs)) return;
    }
    var expected = parseFloat(s.received) || 0;
    var captured = sumPaymentsForInvoice('sale', s.id);
    if (Math.abs(expected - captured) > tolerance) {
      mismatch.push({
        date: s.date || '-',
        type: 'Sale',
        invoice: s.invoice || '-',
        expected: expected,
        captured: captured,
        issue: 'Received amount mismatch vs captured receipts'
      });
    }
    // Balance math check
    var computedBalance = (parseFloat(s.grandTotal) || 0) - (parseFloat(s.received) || 0);
    var storedBalance = parseFloat(s.balance) || 0;
    if (Math.abs(computedBalance - storedBalance) > tolerance) {
      mismatch.push({
        date: s.date || '-',
        type: 'Sale',
        invoice: s.invoice || '-',
        expected: computedBalance,
        captured: storedBalance,
        issue: 'Balance math mismatch'
      });
    }
  });

  return mismatch;
}

function computePartywiseAging(data, refDateStr) {
  var purchases = (data && data.purchases) ? data.purchases : [];
  var sales = (data && data.sales) ? data.sales : [];
  var buckets = function() { return { b0: 0, b1: 0, b2: 0, b3: 0, total: 0 }; };

  var refTs = __auditToTs(refDateStr);
  if (refTs == null) return [];

  var payablesByParty = {};
  purchases.forEach(function(p) {
    var pTs = __auditToTs(p.date);
    if (pTs == null || pTs > refTs) return;
    var bal = (parseFloat(p.grandTotal) || 0) - (parseFloat(p.paid) || 0);
    if (bal <= 0) return;
    var name = p.supplierName || 'Unknown';
    if (!payablesByParty[name]) payablesByParty[name] = buckets();
    var days = __auditDaysDiff(refDateStr, p.date);
    var b = __auditBucket(days);
    payablesByParty[name][b] += bal;
    payablesByParty[name].total += bal;
  });

  var receivablesByParty = {};
  sales.forEach(function(s) {
    var sTs = __auditToTs(s.date);
    if (sTs == null || sTs > refTs) return;
    var bal = (parseFloat(s.grandTotal) || 0) - (parseFloat(s.received) || 0);
    if (bal <= 0) return;
    var name = s.customerName || 'Unknown';
    if (!receivablesByParty[name]) receivablesByParty[name] = buckets();
    var days = __auditDaysDiff(refDateStr, s.date);
    var b = __auditBucket(days);
    receivablesByParty[name][b] += bal;
    receivablesByParty[name].total += bal;
  });

  var rows = [];
  Object.keys(payablesByParty).forEach(function(name) {
    var o = payablesByParty[name];
    rows.push({ party: name, type: 'Payable', b0: o.b0, b1: o.b1, b2: o.b2, b3: o.b3, total: o.total });
  });
  Object.keys(receivablesByParty).forEach(function(name) {
    var o = receivablesByParty[name];
    rows.push({ party: name, type: 'Receivable', b0: o.b0, b1: o.b1, b2: o.b2, b3: o.b3, total: o.total });
  });

  // Sort by total desc.
  rows.sort(function(a, b) { return (b.total || 0) - (a.total || 0); });
  return rows;
}

function computePeriodSummary(data, fromDateStr, toDateStr) {
  var purchases = (data && data.purchases) ? data.purchases : [];
  var sales = (data && data.sales) ? data.sales : [];
  var payments = (data && data.payments) ? data.payments : [];
  var deductions = (data && data.deductions) ? data.deductions : [];
  var brokerage = (data && data.brokerage) ? data.brokerage : [];

  var fromTs = __auditToTs(fromDateStr);
  var toTs = __auditToTs(toDateStr);

  function inPeriod(dateStr) {
    return __auditInRange(dateStr, fromTs, toTs);
  }

  var totalPurchases = 0;
  purchases.forEach(function(p) {
    if (!inPeriod(p.date)) return;
    // Exclude invoice-level advance from P&L-style audit totals.
    totalPurchases += (parseFloat(p.grandTotal) || 0) + (parseFloat(p.advance) || 0);
  });

  var totalSales = 0;
  sales.forEach(function(s) {
    if (!inPeriod(s.date)) return;
    // Keep truckAdvance excluded, and add invoice advance back to avoid advance-adjusted profit.
    totalSales += (parseFloat(s.grandTotal) || 0) - (parseFloat(s.truckAdvance) || 0) + (parseFloat(s.advance) || 0);
  });

  var totalBrokerage = 0;
  brokerage.forEach(function(b) {
    if (!inPeriod(b.date)) return;
    totalBrokerage += (parseFloat(b.amount) || 0);
  });

  var totalDeductions = 0;
  deductions.forEach(function(d) {
    if (!inPeriod(d.date)) return;
    totalDeductions += (parseFloat(d.amount) || 0);
  });

  var supplierPaymentOutflow = 0;
  var customerReceiptInflow = 0;
  payments.forEach(function(p) {
    if (!inPeriod(p.date)) return;
    var amt = parseFloat(p.amount) || 0;
    if (p.type === 'purchase' || (p.type === 'ledger_payment' && p.entityType === 'supplier')) supplierPaymentOutflow += amt;
    if (p.type === 'sale' || (p.type === 'ledger_receipt' && p.entityType === 'customer')) customerReceiptInflow += amt;
  });

  var netProfitLike = totalSales - totalPurchases - totalBrokerage - totalDeductions;

  return {
    totalPurchases: totalPurchases,
    totalSales: totalSales,
    totalBrokerage: totalBrokerage,
    totalDeductions: totalDeductions,
    netProfitLike: netProfitLike,
    supplierPaymentOutflow: supplierPaymentOutflow,
    customerReceiptInflow: customerReceiptInflow
  };
}

function computeLedgerAccounts(data, asOfDateStr) {
  var suppliers = (data && data.suppliers) ? data.suppliers : [];
  var customers = (data && data.customers) ? data.customers : [];
  var brokers = (data && data.brokers) ? data.brokers : [];
  var purchases = (data && data.purchases) ? data.purchases : [];
  var sales = (data && data.sales) ? data.sales : [];
  var payments = (data && data.payments) ? data.payments : [];
  var openingBalances = (data && data.openingBalances) ? data.openingBalances : [];
  var adjustments = (data && data.adjustments) ? data.adjustments : [];
  var brokerage = (data && data.brokerage) ? data.brokerage : [];

  var refTs = __auditToTs(asOfDateStr);
  if (refTs == null) return [];

  function closingSupplier(supplierId) {
    var bal = 0;
    openingBalances.forEach(function(ob) {
      if (ob.entityType !== 'supplier') return;
      if (String(ob.entityId) !== String(supplierId)) return;
      if (!__auditToTs(ob.date) || __auditToTs(ob.date) > refTs) return;
      bal += parseFloat(ob.amount) || 0;
    });
    purchases.forEach(function(p) {
      if (String(p.supplierId) !== String(supplierId)) return;
      if (!__auditToTs(p.date) || __auditToTs(p.date) > refTs) return;
      bal += parseFloat(p.grandTotal) || parseFloat(p.total) || 0;
    });
    payments.forEach(function(pay) {
      if (pay.type === 'purchase') {
        var purchase = (purchases || []).find(function(px) { return px.id === pay.invoiceId; });
        if (!purchase) return;
        if (String(purchase.supplierId) !== String(supplierId)) return;
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= parseFloat(pay.amount) || 0;
      } else if (pay.type === 'ledger_payment' && pay.entityType === 'supplier' && String(pay.entityId) === String(supplierId)) {
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= parseFloat(pay.amount) || 0;
      }
    });
    adjustments.forEach(function(adj) {
      if (adj.type !== 'supplier_adjustment') return;
      if (String(adj.entityId) !== String(supplierId)) return;
      if (!__auditToTs(adj.date) || __auditToTs(adj.date) > refTs) return;
      bal -= parseFloat(adj.amount) || 0;
    });
    return bal;
  }

  function closingCustomer(customerId) {
    var bal = 0;
    openingBalances.forEach(function(ob) {
      if (ob.entityType !== 'customer') return;
      if (String(ob.entityId) !== String(customerId)) return;
      if (!__auditToTs(ob.date) || __auditToTs(ob.date) > refTs) return;
      bal += parseFloat(ob.amount) || 0;
    });
    sales.forEach(function(s) {
      if (String(s.customerId) !== String(customerId)) return;
      if (!__auditToTs(s.date) || __auditToTs(s.date) > refTs) return;
      bal += parseFloat(s.grandTotal) || parseFloat(s.total) || 0;
    });
    payments.forEach(function(pay) {
      if (pay.type === 'sale') {
        var sale = (sales || []).find(function(sx) { return sx.id === pay.invoiceId; });
        if (!sale) return;
        if (String(sale.customerId) !== String(customerId)) return;
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= Math.abs(parseFloat(pay.amount) || 0);
      } else if (pay.type === 'ledger_receipt' && pay.entityType === 'customer' && String(pay.entityId) === String(customerId)) {
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= Math.abs(parseFloat(pay.amount) || 0);
      }
    });
    // deductions
    (data.deductions || []).forEach(function(d) {
      if (String(d.customerId) !== String(customerId)) return;
      if (!__auditToTs(d.date) || __auditToTs(d.date) > refTs) return;
      bal -= parseFloat(d.amount) || 0;
    });
    adjustments.forEach(function(adj) {
      if (adj.type !== 'customer_adjustment') return;
      if (String(adj.entityId) !== String(customerId)) return;
      if (!__auditToTs(adj.date) || __auditToTs(adj.date) > refTs) return;
      bal -= parseFloat(adj.amount) || 0;
    });
    return bal;
  }

  function closingBroker(brokerId) {
    var bal = 0;
    brokerage.forEach(function(b) {
      if (String(b.brokerId) !== String(brokerId)) return;
      if (!__auditToTs(b.date) || __auditToTs(b.date) > refTs) return;
      bal += parseFloat(b.amount) || 0;
    });
    adjustments.forEach(function(adj) {
      if (adj.type !== 'broker_adjustment') return;
      if (String(adj.entityId) !== String(brokerId)) return;
      if (!__auditToTs(adj.date) || __auditToTs(adj.date) > refTs) return;
      bal -= parseFloat(adj.amount) || 0;
    });
    payments.forEach(function(pay) {
      if (pay.type === 'brokerage') {
        var br = (brokerage || []).find(function(x) { return x.id === pay.invoiceId; });
        if (!br) return;
        if (String(br.brokerId) !== String(brokerId)) return;
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= parseFloat(pay.amount) || 0;
      } else if (pay.type === 'ledger_payment' && pay.entityType === 'broker' && String(pay.entityId) === String(brokerId)) {
        if (!__auditToTs(pay.date) || __auditToTs(pay.date) > refTs) return;
        bal -= parseFloat(pay.amount) || 0;
      }
    });
    return bal;
  }

  var accounts = [];
  suppliers.forEach(function(s) {
    accounts.push({
      accountId: String(s.id),
      ledgerType: 'supplier',
      accountName: s.name,
      closingBalance: closingSupplier(s.id)
    });
  });
  customers.forEach(function(c) {
    accounts.push({
      accountId: String(c.id),
      ledgerType: 'customer',
      accountName: c.name,
      closingBalance: closingCustomer(c.id)
    });
  });
  brokers.forEach(function(b) {
    accounts.push({
      accountId: String(b.id),
      ledgerType: 'broker',
      accountName: b.name,
      closingBalance: closingBroker(b.id)
    });
  });

  // Attach bucket totals for suppliers/customers (from ageing logic).
  var agingRows = computePartywiseAging(data, asOfDateStr);
  var agingIndex = {};
  agingRows.forEach(function(r) {
    var key = r.party + '|' + r.type;
    agingIndex[key] = r;
  });

  accounts.forEach(function(a) {
    if (a.ledgerType === 'supplier') {
      var key = a.accountName + '|Payable';
      var r = agingIndex[key];
      a.b0 = r ? r.b0 : 0;
      a.b1 = r ? r.b1 : 0;
      a.b2 = r ? r.b2 : 0;
      a.b3 = r ? r.b3 : 0;
      a.bucketTotal = r ? r.total : 0;
    } else if (a.ledgerType === 'customer') {
      var key2 = a.accountName + '|Receivable';
      var r2 = agingIndex[key2];
      a.b0 = r2 ? r2.b0 : 0;
      a.b1 = r2 ? r2.b1 : 0;
      a.b2 = r2 ? r2.b2 : 0;
      a.b3 = r2 ? r2.b3 : 0;
      a.bucketTotal = r2 ? r2.total : 0;
    } else {
      a.b0 = 0; a.b1 = 0; a.b2 = 0; a.b3 = 0; a.bucketTotal = 0;
    }
  });

  // Sort for UI: closing balance desc by absolute value.
  accounts.sort(function(x, y) { return Math.abs(y.closingBalance || 0) - Math.abs(x.closingBalance || 0); });
  return accounts;
}

function computeAutoAuditCA(data, fromDateStr, toDateStr) {
  var now = new Date();
  // If range inputs are missing, try to keep UI stable.
  var fromTs = __auditToTs(fromDateStr);
  var toTs = __auditToTs(toDateStr);
  var refDateStr = toDateStr || now.toISOString().split('T')[0];

  var bankAudit = computeAutoAuditBank(data, fromDateStr, toDateStr);
  var mismatchExceptions = computeInvoiceMismatchChecks(data, fromDateStr, toDateStr);
  var periodSummary = computePeriodSummary(data, fromDateStr || refDateStr, toDateStr || refDateStr);
  var agingRows = computePartywiseAging(data, refDateStr);
  var ledgerAccounts = computeLedgerAccounts(data, refDateStr);

  // Basic check set
  var checks = [];
  checks = checks.concat(bankAudit.checks || []);
  checks.push({
    name: 'Invoice totals consistency (Paid/Received vs Payments)',
    status: mismatchExceptions.length === 0 ? 'PASS' : 'FAIL',
    detail: mismatchExceptions.length === 0
      ? 'No invoice mismatch exceptions found in selected period'
      : mismatchExceptions.length + ' mismatch/balance exceptions found'
  });

  return {
    fromDateStr: fromDateStr,
    toDateStr: toDateStr,
    asOfDateStr: refDateStr,
    bankAudit: bankAudit,
    mismatchExceptions: mismatchExceptions,
    periodSummary: periodSummary,
    agingRows: agingRows,
    ledgerAccounts: ledgerAccounts,
    checks: checks
  };
}

