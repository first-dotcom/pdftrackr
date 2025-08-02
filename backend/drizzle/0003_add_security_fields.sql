-- Migration to add security tracking fields to existing tables

-- Add security fields to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS ip_address varchar(45),
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS file_hash varchar(64),
ADD COLUMN IF NOT EXISTS scan_status varchar(20) DEFAULT 'passed',
ADD COLUMN IF NOT EXISTS security_flags json;

-- Add indexes for security monitoring
CREATE INDEX IF NOT EXISTS files_hash_idx ON files (file_hash);
CREATE INDEX IF NOT EXISTS files_ip_idx ON files (ip_address);

-- Add security fields to view_sessions table
ALTER TABLE view_sessions 
ADD COLUMN IF NOT EXISTS suspicious_flags json,
ADD COLUMN IF NOT EXISTS risk_score integer DEFAULT 0;

-- Add indexes for security monitoring
CREATE INDEX IF NOT EXISTS view_sessions_ip_idx ON view_sessions (ip_address);
CREATE INDEX IF NOT EXISTS view_sessions_risk_idx ON view_sessions (risk_score);

-- Create security events table for monitoring
CREATE TABLE IF NOT EXISTS security_events (
  id serial PRIMARY KEY NOT NULL,
  event_type varchar(50) NOT NULL,
  severity varchar(20) NOT NULL DEFAULT 'low', -- low, medium, high, critical
  user_id varchar(255), -- Clerk user ID if applicable
  ip_address varchar(45),
  user_agent text,
  description text NOT NULL,
  metadata json,
  resolved boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Indexes for security events
CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events (event_type);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON security_events (severity);
CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events (user_id);
CREATE INDEX IF NOT EXISTS security_events_ip_idx ON security_events (ip_address);
CREATE INDEX IF NOT EXISTS security_events_created_at_idx ON security_events (created_at);
CREATE INDEX IF NOT EXISTS security_events_resolved_idx ON security_events (resolved);

-- Create failed_attempts table for brute force detection
CREATE TABLE IF NOT EXISTS failed_attempts (
  id serial PRIMARY KEY NOT NULL,
  ip_address varchar(45) NOT NULL,
  user_id varchar(255), -- Clerk user ID if known
  attempt_type varchar(50) NOT NULL, -- login, upload, api_call
  endpoint varchar(255),
  user_agent text,
  blocked_until timestamp,
  attempt_count integer DEFAULT 1 NOT NULL,
  first_attempt timestamp DEFAULT now() NOT NULL,
  last_attempt timestamp DEFAULT now() NOT NULL
);

-- Indexes for failed attempts
CREATE UNIQUE INDEX IF NOT EXISTS failed_attempts_ip_type_idx ON failed_attempts (ip_address, attempt_type);
CREATE INDEX IF NOT EXISTS failed_attempts_user_idx ON failed_attempts (user_id);
CREATE INDEX IF NOT EXISTS failed_attempts_blocked_until_idx ON failed_attempts (blocked_until);
CREATE INDEX IF NOT EXISTS failed_attempts_last_attempt_idx ON failed_attempts (last_attempt);