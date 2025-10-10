-- Migration to add sentiment analysis fields to the business_ideas table

ALTER TABLE business_ideas
ADD COLUMN sentiment VARCHAR(50),
ADD COLUMN emotion VARCHAR(50),
ADD COLUMN pain_score DECIMAL(4, 2);

COMMENT ON COLUMN business_ideas.sentiment IS 'The overall sentiment of the source text (e.g., Positive, Neutral, Negative).';
COMMENT ON COLUMN business_ideas.emotion IS 'The primary emotion detected in the source text (e.g., Frustration, Hopeful).';
COMMENT ON COLUMN business_ideas.pain_score IS 'A calculated score representing the intensity of the user pain point.';
