
export async function getUSDToBDTRate(): Promise<number> {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        return data.rates.BDT || 120.0; // Fallback to 120 if API fails
    } catch (error) {
        console.error('Error fetching FX rate:', error);
        return 120.0; // Default fallback
    }
}

export function convertToUSD(amount: number, currency: 'USD' | 'BDT', rate: number): number {
    if (currency === 'USD') return amount;
    return amount / rate;
}

export function convertToBDT(amountUSD: number, rate: number): number {
    return amountUSD * rate;
}
