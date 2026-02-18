ALTER TABLE eth_withdrawal
    ADD COLUMN IF NOT EXISTS signed_raw_tx TEXT;
