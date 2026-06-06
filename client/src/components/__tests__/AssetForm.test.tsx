import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AssetForm from '../AssetForm'

// AssetForm (and AssetSearch) read the Clerk token for live pricing; stub it.
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: async () => 'test-token' }),
}))

describe('AssetForm', () => {
  it('shows the bank account-type field for bank and hides quantity', () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByText('Account type')).toBeInTheDocument()
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument()
  })

  it('shows quantity for crypto and hides account type', async () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByDisplayValue('Bank'), 'crypto')
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    expect(screen.queryByText('Account type')).not.toBeInTheDocument()
  })

  it('shows demat and shares fields for stock', async () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByDisplayValue('Bank'), 'stock')
    expect(screen.getByText('Demat / broker')).toBeInTheDocument()
    expect(screen.getByText('Shares')).toBeInTheDocument()
  })

  it('collapses to just an amount field for cash', async () => {
    render(<AssetForm onSubmit={vi.fn()} onClose={vi.fn()} />)
    await userEvent.selectOptions(screen.getByDisplayValue('Bank'), 'cash')
    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.queryByText('Account type')).not.toBeInTheDocument()
    expect(screen.queryByText('Quantity')).not.toBeInTheDocument()
  })
})
