
import { Partner, Transaction, Settlement, PartnerBalance, SettlementSuggestion } from './types';

export function calculateBalances(
  partners: Partner[],
  transactions: Transaction[],
  settlements: Settlement[]
): PartnerBalance[] {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amountUSD, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amountUSD, 0);
  const totalProfit = totalIncome - totalExpense;

  const results: PartnerBalance[] = partners.map((partner) => {
    const shouldReceive = totalProfit * (partner.sharePercentage / 100);

    const partnerIncome = transactions
      .filter((t) => t.type === 'income' && t.handledBy === partner.id)
      .reduce((sum, t) => sum + t.amountUSD, 0);
    const partnerExpense = transactions
      .filter((t) => t.type === 'expense' && t.handledBy === partner.id)
      .reduce((sum, t) => sum + t.amountUSD, 0);

    const handledNet = partnerIncome - partnerExpense;

    // Initial balance before settlements
    let balance = handledNet - shouldReceive;

    // Adjust for settlements
    // If partner pays another partner, their held "extra" decreases
    const paidOut = settlements
      .filter((s) => s.fromPartnerId === partner.id)
      .reduce((sum, s) => sum + s.amountUSD, 0);
    const received = settlements
      .filter((s) => s.toPartnerId === partner.id)
      .reduce((sum, s) => sum + s.amountUSD, 0);

    balance = balance - paidOut + received;

    return {
      partnerId: partner.id,
      name: partner.name,
      shouldReceive,
      handledNet,
      balance,
    };
  });

  return results;
}

export function simplifySettlements(balances: PartnerBalance[]): SettlementSuggestion[] {
  // Creditors are those with balance > 0 (they hold extra money, they OWE the pool)
  // Debtors are those with balance < 0 (they are owed money)
  // In our context: Transfers are from those who have "extra" (balance > 0) to those who are "short" (balance < 0)

  const creditors = balances
    .filter((b) => b.balance > 0.01)
    .map((b) => ({ id: b.partnerId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const debtors = balances
    .filter((b) => b.balance < -0.01)
    .map((b) => ({ id: b.partnerId, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const suggestions: SettlementSuggestion[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const payAmount = Math.min(creditors[i].amount, debtors[j].amount);

    if (payAmount > 0.01) {
      suggestions.push({
        from: creditors[i].id,
        to: debtors[j].id,
        amount: payAmount,
      });
    }

    creditors[i].amount -= payAmount;
    debtors[j].amount -= payAmount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return suggestions;
}
