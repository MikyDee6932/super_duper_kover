-- Add missing subscription tracking columns to profiles
-- These are written by syncSubscriptionStatus() in purchases.ts

alter table profiles
  add column if not exists subscription_product text,
  add column if not exists subscription_expires_at timestamptz;
