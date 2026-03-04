
'use client';

import { useEffect, useState } from 'react';
import { Navigation, MobileNav } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { calculateBalances, simplifySettlements } from '@/lib/calculations';
import { Agency, Transaction, Settlement, PartnerBalance, SettlementSuggestion } from '@/lib/types';
import { ArrowUpRight, ArrowDownRight, Wallet, Plus, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getAgency, getTransactions, getSettlements } from '@/lib/mock-db';

export default function DashboardPage() {
  const [data, setData] = useState<{
    agency: Agency;
    transactions: Transaction[];
    settlements: Settlement[];
  } | null>(null);

  const [balances, setBalances] = useState<PartnerBalance[]>([]);
  const [suggestions, setSuggestions] = useState<SettlementSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      console.log('Dashboard: Starting data load...');
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Firebase timeout')), 10000)
        );

        const fetchDataPromise = Promise.all([
          getAgency(),
          getTransactions(),
          getSettlements(),
        ]);

        console.log('Dashboard: Fetching from Firestore...');
        const [agency, transactions, settlements] = await Promise.race([
          fetchDataPromise,
          timeoutPromise
        ]) as [Agency, Transaction[], Settlement[]];

        console.log('Dashboard: Data received', { agency, transactionsCount: transactions.length });

        const dbData = { agency, transactions, settlements };
        setData(dbData);
        const calculated = calculateBalances(agency.partners, transactions, settlements);
        setBalances(calculated);
        setSuggestions(simplifySettlements(calculated));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
  if (!data) return null;

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = totalIncome - totalExpense;

  const getPartnerName = (id: string) =>
    data.agency.partners.find((p) => p.id === id)?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex flex-col md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-card px-4 md:px-8">
          <h1 className="text-xl font-bold">Dashboard</h1>
        </header>

        <main className="flex-1 space-y-8 p-4 md:p-8 pb-24 md:pb-8">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalIncome.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Collected by partners</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <ArrowDownRight className="h-4 w-4 text-rose-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalExpense.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Paid by partners</p>
              </CardContent>
            </Card>
            <Card className="bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-primary-foreground/80">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalProfit.toLocaleString()}</div>
                <p className="text-xs text-primary-foreground/60">Distributed by share %</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-7">
            {/* Partner Balances */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Partner Balances</CardTitle>
                <CardDescription>Breakdown of who owes what to the agency pool.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Should Receive</TableHead>
                      <TableHead>Handled Net</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((b) => (
                      <TableRow key={b.partnerId}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>${b.shouldReceive.toLocaleString()}</TableCell>
                        <TableCell>${b.handledNet.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={b.balance > 0 ? 'destructive' : 'secondary'}>
                            {b.balance > 0
                              ? `Pay Out $${b.balance.toLocaleString()}`
                              : `Collect $${Math.abs(b.balance).toLocaleString()}`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Suggested Settlements */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Suggested Settlements</CardTitle>
                <CardDescription>Minimal transfers to zero out balances.</CardDescription>
              </CardHeader>
              <CardContent>
                {suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Wallet className="mb-2 h-8 w-8 opacity-20" />
                    <p>All settled! Everyone has their fair share.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-muted-foreground uppercase">From</span>
                          <span className="font-bold">{getPartnerName(s.from)}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <span className="text-lg font-bold text-primary">${s.amount.toLocaleString()}</span>
                          <div className="h-px w-8 bg-border" />
                        </div>
                        <div className="flex flex-col text-right">
                          <span className="text-xs font-medium text-muted-foreground uppercase">To</span>
                          <span className="font-bold">{getPartnerName(s.to)}</span>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" asChild>
                      <a href="/settlements">Record a Settlement</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
