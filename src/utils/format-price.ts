export function formatPrice(amount: number | bigint): string {
  return new Intl.NumberFormat("en-UK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(amount);
}
