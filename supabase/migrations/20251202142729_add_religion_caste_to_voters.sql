-- ============================================
-- Add religion and caste columns to voters table
-- ============================================
-- This migration adds predicted religion and caste fields
-- based on name analysis patterns

-- Add religion column
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS religion VARCHAR(50);

-- Add caste column
ALTER TABLE voters 
ADD COLUMN IF NOT EXISTS caste VARCHAR(50);

-- Add indexes for filtering and statistics
CREATE INDEX IF NOT EXISTS idx_voters_religion ON voters(religion) WHERE religion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_caste ON voters(caste) WHERE caste IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_polling_center_religion ON voters(polling_center_id, religion) WHERE religion IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_polling_center_caste ON voters(polling_center_id, caste) WHERE caste IS NOT NULL;

-- Update the voters_with_location view to include religion and caste
-- Drop the view first to avoid column name conflicts
DROP VIEW IF EXISTS voters_with_location;

CREATE VIEW voters_with_location AS
SELECT 
    -- Voter fields (explicitly list to avoid duplicate polling_center_id)
    v.id,
    v.voter_id,
    v.serial_number,
    v.full_name,
    v.full_name_english,
    v.gender,
    v.gender_english,
    v.date_of_birth,
    v.age,
    v.spouse_name,
    v.spouse_name_english,
    v.father_mother_name,
    v.father_mother_name_english,
    v.citizen_number,
    v.address,
    v.religion,
    v.caste,
    v.created_at,
    v.updated_at,
    
    -- Polling center information
    v.polling_center_id,
    pc.nepali_name AS polling_center_nepali,
    pc.english_name AS polling_center_english,
    
    -- Ward information
    w.id AS ward_id,
    w.ward_number,
    w.house_of_representatives_constituency,
    w.provincial_assembly_constituency,
    
    -- Full location path
    CONCAT(
        c.nepali_name, ' → ',
        p.nepali_name, ' → ',
        d.nepali_name, ' → ',
        m.nepali_name, ' → ',
        'वडा ', w.ward_number, ' → ',
        pc.nepali_name
    ) AS location_path_nepali,
    
    CONCAT(
        c.english_name, ' → ',
        p.english_name, ' → ',
        d.english_name, ' → ',
        m.english_name, ' → ',
        'Ward ', w.ward_number, ' → ',
        COALESCE(pc.english_name, pc.nepali_name)
    ) AS location_path_english,
    
    -- Individual location components
    c.id AS country_id,
    c.nepali_name AS country_nepali,
    c.english_name AS country_english,
    
    p.id AS province_id,
    p.province_code,
    p.nepali_name AS province_nepali,
    p.english_name AS province_english,
    
    d.id AS district_id,
    d.nepali_name AS district_nepali,
    d.english_name AS district_english,
    
    m.id AS municipality_id,
    m.type AS municipality_type,
    m.nepali_name AS municipality_nepali,
    m.english_name AS municipality_english
    
FROM voters v
JOIN polling_centers pc ON v.polling_center_id = pc.id
JOIN wards w ON pc.ward_id = w.id
JOIN municipalities m ON w.municipality_id = m.id
JOIN districts d ON m.district_id = d.id
JOIN provinces p ON d.province_id = p.id
JOIN countries c ON p.country_id = c.id
WHERE v.id IS NOT NULL;

