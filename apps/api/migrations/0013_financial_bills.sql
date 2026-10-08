CREATE TABLE IF NOT EXISTS financial_bills (
  id TEXT PRIMARY KEY,
  wechat_nickname TEXT NOT NULL,
  email TEXT NOT NULL,
  normalized_email TEXT NOT NULL,
  paid_amount_cents INTEGER NOT NULL CHECK (paid_amount_cents >= 0),
  paid_at_ms INTEGER NOT NULL,
  billing_month TEXT NOT NULL,
  is_refunded INTEGER NOT NULL DEFAULT 0 CHECK (is_refunded IN (0, 1)),
  refund_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (refund_amount_cents >= 0),
  note TEXT,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_bills_billing_month_paid_at
ON financial_bills(billing_month, paid_at_ms DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_financial_bills_normalized_email
ON financial_bills(normalized_email);
