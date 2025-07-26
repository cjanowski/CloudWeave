-- Drop the cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_blacklisted_tokens();

-- Drop the token blacklist table
DROP TABLE IF EXISTS token_blacklist;