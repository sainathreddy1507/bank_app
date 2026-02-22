import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAccount, getBalance, getTransactions } from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('balance')
  const [balanceVisible, setBalanceVisible] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user) return
      setLoading(true)
      setError('')
      try {
        const [acc, bal, txns] = await Promise.all([
          getAccount(user),
          getBalance(user),
          getTransactions(user),
        ])
        setAccount(acc)
        setBalance(bal)
        setTransactions(txns)
      } catch (err) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount ?? 0)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading && !account) {
    return (
      <div className="dashboard-loading">
        <div className="loader" />
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <h1 className="logo">LetsBank</h1>
          <span className="user-badge">{account?.fullName || user?.fullName}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        <nav className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'balance' ? 'active' : ''}`}
            onClick={() => setActiveTab('balance')}
          >
            Check Balance
          </button>
          <button
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transaction History
          </button>
          <button
            className={`tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account Details
          </button>
        </nav>

        <div className="dashboard-content">
          {activeTab === 'balance' && (
            <section className="balance-section">
              <div className="balance-card">
                <p className="balance-label">Available Balance</p>
                <p className="balance-amount">
                  {balanceVisible ? formatCurrency(balance) : '••••••••'}
                </p>
                <button
                  type="button"
                  className="balance-toggle"
                  onClick={() => setBalanceVisible((v) => !v)}
                  aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                >
                  {balanceVisible ? 'Hide' : 'Show'} balance
                </button>
                <p className="balance-note">As of {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </section>
          )}

          {activeTab === 'transactions' && (
            <section className="transactions-section">
              <h2>Transaction History</h2>
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet</p>
                  <span>Your transactions will appear here</span>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map((tx) => (
                    <div key={tx._id || tx.timestamp} className="transaction-item">
                      <div className="tx-info">
                        <span className="tx-type">{tx.type || 'Transaction'}</span>
                        <span className="tx-desc">{tx.description || '—'}</span>
                        <span className="tx-date">{formatDate(tx.timestamp)}</span>
                      </div>
                      <span className={`tx-amount ${(tx.amount || 0) >= 0 ? 'credit' : 'debit'}`}>
                        {balanceVisible
                          ? `${(tx.amount || 0) >= 0 ? '+' : ''}${formatCurrency(tx.amount)}`
                          : '••••••'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'account' && (
            <section className="account-section">
              <h2>Account Details</h2>
              <div className="account-details">
                <div className="detail-row">
                  <span className="detail-label">Account Holder</span>
                  <span className="detail-value">{account?.fullName || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Account ID</span>
                  <span className="detail-value mono">{account?.accountId || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{account?.email || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Member Since</span>
                  <span className="detail-value">
                    {account?.createdAt
                      ? new Date(account.createdAt).toLocaleDateString('en-IN', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
