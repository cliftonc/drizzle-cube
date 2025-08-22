-- Database initialization script
-- This runs when the PostgreSQL container starts for the first time

-- Create additional extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- You can add any other initialization SQL here
-- For now, we'll let Drizzle handle table creation via migrations