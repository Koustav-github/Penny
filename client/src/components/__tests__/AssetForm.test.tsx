import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import AssetForm from '../AssetForm'

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
})
