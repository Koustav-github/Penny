/**
 * Current-month net worth (single source of truth for the whole app):
 *
 *   net worth = non-loan assets + monthly salary − this month's expenses − total EMIs
 *
 * Loans are excluded from `assetTotal` by the backend; their monthly EMI is the
 * decrement. Salary is the monthly increment.
 */
export function computeNetWorth(input: {
  assetTotal: number
  salary: number
  monthExpenses: number
  emiTotal: number
}): number {
  return input.assetTotal + input.salary - input.monthExpenses - input.emiTotal
}
