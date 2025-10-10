-- Create business_ideas table
CREATE TABLE business_ideas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category VARCHAR(100),
  date DATE NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 0.00,
  source VARCHAR(100),
  market_opportunity TEXT,
  target_audience TEXT,
  revenue_model TEXT,
  key_challenges TEXT,
  generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_business_ideas_date ON business_ideas(date);
CREATE INDEX idx_business_ideas_category ON business_ideas(category);
CREATE INDEX idx_business_ideas_relevance ON business_ideas(relevance_score DESC);

-- Optional: Create categories table for future use
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7), -- HEX color code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create user_interactions table for future analytics
CREATE TABLE user_interactions (
  id SERIAL PRIMARY KEY,
  idea_id INTEGER REFERENCES business_ideas(id),
  interaction_type VARCHAR(50), -- 'copy', 'view', 'favorite', 'share'
  user_id UUID, -- For authenticated users
  session_id VARCHAR(255), -- For anonymous users
  metadata JSONB, -- Additional data about the interaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user interactions
CREATE INDEX idx_user_interactions_idea_id ON user_interactions(idea_id);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);

-- Create users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for users
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_email ON users(email);

-- Create mock_ideas table for demo purposes
CREATE TABLE mock_ideas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for mock_ideas
CREATE INDEX idx_mock_ideas_category ON mock_ideas(category);

-- Insert sample mock ideas for demo
INSERT INTO mock_ideas (title, description, category) VALUES
('AI Recipe Generator', 'An app that creates personalized recipes based on available ingredients and dietary preferences using AI.', 'Tech'),
('Virtual Co-Working Spaces', 'A platform connecting remote workers with virtual co-working communities and productivity tools.', 'Startup'),
('Eco-Friendly Subscription Box', 'Monthly delivery of sustainable household products and zero-waste alternatives.', 'E-commerce'),
('Pet Care Concierge', 'On-demand pet sitting, walking, and grooming services with real-time GPS tracking.', 'Service'),
('Code Review Automation', 'AI-powered tool that automatically reviews code for bugs, security issues, and best practices.', 'Vibe Coding'),
('Freelance Gig Finder', 'Platform connecting skilled workers with quick freelance opportunities in their local area.', 'Quick Money'),
('Community Skill Sharing', 'App that connects volunteers with community members needing help with basic skills and tasks.', 'Social Impact'),
('Remote Team Building Platform', 'Virtual team building activities and icebreakers designed specifically for distributed teams.', 'Remote Work'),
('Mental Health Tracker', 'Mobile app that monitors daily mood patterns and provides personalized wellness recommendations.', 'Health & Wellness'),
('Language Learning VR', 'Immersive virtual reality environment for learning new languages through real-life scenarios.', 'Education');

-- Migration: Add missing columns to existing business_ideas table
-- Run these commands on your Supabase database if the table already exists:
-- ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS market_opportunity TEXT;
-- ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS target_audience TEXT;
-- ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS revenue_model TEXT;
-- ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS key_challenges TEXT;
-- ALTER TABLE business_ideas ADD COLUMN IF NOT EXISTS generated BOOLEAN DEFAULT FALSE;
