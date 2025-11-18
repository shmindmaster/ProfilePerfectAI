-- Azure PostgreSQL Schema for ProfilePerfect AI
-- This script creates all required tables for the migrated application

-- Enable UUID extension for unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (for future authentication implementation)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create credits table
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Using string user_id for compatibility with mock auth
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generation_jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'profileperfect',
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    model_id VARCHAR(255), -- Renamed from modelId for PostgreSQL compatibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploaded_photos table
CREATE TABLE IF NOT EXISTS uploaded_photos (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    uri VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create images table for generated results
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    is_favorited BOOLEAN DEFAULT FALSE,
    style_preset VARCHAR(100),
    background_preset VARCHAR(100),
    source VARCHAR(100) DEFAULT 'generated',
    parent_image_id INTEGER REFERENCES images(id), -- For retouch operations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_images_model_id ON images(model_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_photos_model_id ON uploaded_photos(model_id);

-- Insert mock user data for testing
INSERT INTO credits (user_id, credits) 
VALUES ('mock-user-id', 10) 
ON CONFLICT (user_id) DO UPDATE SET credits = 10;

-- Insert sample generation job for testing
INSERT INTO generation_jobs (user_id, name, type, status, model_id) 
VALUES ('mock-user-id', 'Sample Model', 'profileperfect', 'completed', 'sample_model_001')
ON CONFLICT DO NOTHING;

-- Get the ID of the sample job
DO $$
DECLARE
    sample_job_id INTEGER;
BEGIN
    SELECT id INTO sample_job_id FROM generation_jobs WHERE user_id = 'mock-user-id' AND name = 'Sample Model';
    
    -- Insert sample uploaded photos
    INSERT INTO uploaded_photos (model_id, uri) 
    VALUES 
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample1.jpg'),
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample2.jpg'),
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/sample3.jpg')
    ON CONFLICT DO NOTHING;
    
    -- Insert sample generated images
    INSERT INTO images (model_id, url, is_favorited, style_preset, background_preset, source) 
    VALUES 
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated1.jpg', FALSE, 'corporate', 'office', 'profileperfect-ai'),
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated2.jpg', TRUE, 'startup', 'creative', 'profileperfect-ai'),
        (sample_job_id, 'https://stmahumsharedapps.blob.core.windows.net/profileperfect-ai/generated3.jpg', FALSE, 'corporate', 'studio', 'profileperfect-ai')
    ON CONFLICT DO NOTHING;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON generation_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your Azure PostgreSQL setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pgadmin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pgadmin;

COMMIT;
