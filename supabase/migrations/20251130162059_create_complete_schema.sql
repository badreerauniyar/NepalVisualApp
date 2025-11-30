-- ============================================
-- Complete Schema for Nepal Voter Data
-- ============================================
-- This schema creates the complete administrative structure:
-- Country → Province → District → Municipality → Ward → Polling Center → Voters
--
-- Usage: Run this migration to create all tables from scratch
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COUNTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,              -- ISO code: "NP" or "NEP"
    nepali_name VARCHAR(100) NOT NULL,             -- "नेपाल"
    english_name VARCHAR(100) NOT NULL,             -- "Nepal"
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT countries_code_unique UNIQUE (code)
);

-- Indexes for countries
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);

-- ============================================
-- 2. PROVINCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS provinces (
    id SERIAL PRIMARY KEY,
    country_id INT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
    province_code VARCHAR(10) UNIQUE,                -- "1", "2", "3" (Koshi, Madhesh, Bagmati...)
    nepali_name VARCHAR(100) NOT NULL,              -- "मधेश"
    english_name VARCHAR(100) NOT NULL,              -- "Madhesh"
    
    -- Optional geographic data
    center_latitude DECIMAL(10, 8),                 -- For map centering
    center_longitude DECIMAL(11, 8),                -- For map centering
    area_sq_km DECIMAL(12, 2),                     -- Area in square kilometers
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT provinces_code_unique UNIQUE (province_code),
    CONSTRAINT provinces_country_province_unique UNIQUE (country_id, province_code)
);

-- Indexes for provinces
CREATE INDEX IF NOT EXISTS idx_provinces_country_id ON provinces(country_id);
CREATE INDEX IF NOT EXISTS idx_provinces_code ON provinces(province_code);
CREATE INDEX IF NOT EXISTS idx_provinces_active ON provinces(is_active);
CREATE INDEX IF NOT EXISTS idx_provinces_name_nepali ON provinces(nepali_name);
CREATE INDEX IF NOT EXISTS idx_provinces_name_english ON provinces(english_name);

-- ============================================
-- 3. DISTRICTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    province_id INT NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
    district_code VARCHAR(10),                      -- Official district code
    nepali_name VARCHAR(100) NOT NULL,              -- "सप्तरी"
    english_name VARCHAR(100) NOT NULL,             -- "Saptari"
    
    -- Optional geographic data
    center_latitude DECIMAL(10, 8),                 -- For map centering
    center_longitude DECIMAL(11, 8),                -- For map centering
    area_sq_km DECIMAL(12, 2),                     -- Area in square kilometers
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT districts_province_district_unique UNIQUE (province_id, district_code)
);

-- Indexes for districts
CREATE INDEX IF NOT EXISTS idx_districts_province_id ON districts(province_id);
CREATE INDEX IF NOT EXISTS idx_districts_code ON districts(district_code);
CREATE INDEX IF NOT EXISTS idx_districts_active ON districts(is_active);
CREATE INDEX IF NOT EXISTS idx_districts_name_nepali ON districts(nepali_name);
CREATE INDEX IF NOT EXISTS idx_districts_name_english ON districts(english_name);

-- ============================================
-- 4. MUNICIPALITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS municipalities (
    id SERIAL PRIMARY KEY,
    district_id INT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    municipality_code VARCHAR(10),                  -- Official municipality code
    nepali_name VARCHAR(150) NOT NULL,               -- "कञ्चनरुप नगरपालिका"
    english_name VARCHAR(150) NOT NULL,              -- "Kanchanrup Municipality"
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'Metropolitan',
        'Sub-Metropolitan',
        'Municipality',
        'Rural Municipality'
    )),
    
    -- Optional geographic data
    center_latitude DECIMAL(10, 8),                 -- For map centering
    center_longitude DECIMAL(11, 8),                -- For map centering
    area_sq_km DECIMAL(12, 2),                     -- Area in square kilometers
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT municipalities_district_municipality_unique UNIQUE (district_id, municipality_code)
);

-- Indexes for municipalities
CREATE INDEX IF NOT EXISTS idx_municipalities_district_id ON municipalities(district_id);
CREATE INDEX IF NOT EXISTS idx_municipalities_code ON municipalities(municipality_code);
CREATE INDEX IF NOT EXISTS idx_municipalities_type ON municipalities(type);
CREATE INDEX IF NOT EXISTS idx_municipalities_active ON municipalities(is_active);
CREATE INDEX IF NOT EXISTS idx_municipalities_name_nepali ON municipalities(nepali_name);
CREATE INDEX IF NOT EXISTS idx_municipalities_name_english ON municipalities(english_name);

-- ============================================
-- 5. WARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wards (
    id SERIAL PRIMARY KEY,
    municipality_id INT NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
    ward_number INT NOT NULL,                        -- Ward number: 1, 2, 3...
    nepali_name VARCHAR(100),                       -- Optional (most are just numbers)
    english_name VARCHAR(100),                       -- Optional
    
    -- Constituency information
    house_of_representatives_constituency INT,       -- HoR constituency number
    provincial_assembly_constituency INT,            -- Provincial assembly constituency number
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wards_municipality_ward_unique UNIQUE (municipality_id, ward_number),
    CONSTRAINT wards_ward_number_positive CHECK (ward_number > 0)
);

-- Indexes for wards
CREATE INDEX IF NOT EXISTS idx_wards_municipality_id ON wards(municipality_id);
CREATE INDEX IF NOT EXISTS idx_wards_ward_number ON wards(ward_number);
CREATE INDEX IF NOT EXISTS idx_wards_house_constituency ON wards(house_of_representatives_constituency);
CREATE INDEX IF NOT EXISTS idx_wards_provincial_constituency ON wards(provincial_assembly_constituency);
CREATE INDEX IF NOT EXISTS idx_wards_active ON wards(is_active);

-- ============================================
-- 6. POLLING CENTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS polling_centers (
    id SERIAL PRIMARY KEY,
    ward_id INT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    
    -- Polling center information (bilingual)
    nepali_name VARCHAR(200) NOT NULL,              -- "म.मा.वि. वलुवा, सितापुर"
    english_name VARCHAR(200),                      -- English translation (optional)
    
    -- Optional additional information
    address TEXT,                                    -- Detailed address if available
    code VARCHAR(50),                                -- Official polling center code (optional)
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT polling_centers_ward_name_unique UNIQUE (ward_id, nepali_name)
);

-- Indexes for polling centers
CREATE INDEX IF NOT EXISTS idx_polling_centers_ward_id ON polling_centers(ward_id);
CREATE INDEX IF NOT EXISTS idx_polling_centers_name_nepali ON polling_centers(nepali_name);
CREATE INDEX IF NOT EXISTS idx_polling_centers_active ON polling_centers(is_active);

-- ============================================
-- 7. VOTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS voters (
    -- Primary identification
    id SERIAL PRIMARY KEY,
    voter_id VARCHAR(50) UNIQUE NOT NULL,              -- Official voter number: "30176212"
    
    -- Location (via polling center)
    polling_center_id INT NOT NULL REFERENCES polling_centers(id) ON DELETE CASCADE,
    serial_number INT,                                 -- Position in polling center list: 1, 2, 3...
    
    -- Personal information (stored in Nepali - original source)
    full_name VARCHAR(150) NOT NULL,                   -- Nepali: "अकबर मोहमद"
    full_name_english VARCHAR(150),                    -- English transliteration (optional, for search)
    
    -- Demographics
    gender VARCHAR(20),                                 -- Nepali: "पुरुष" or "महिला"
    gender_english VARCHAR(20),                        -- English: "Male" or "Female" (optional)
    
    -- Age/Date of Birth
    date_of_birth DATE,                                -- If available from PDF
    age INT,                                           -- Age in years (if DOB not available)
    
    -- Family information
    spouse_name VARCHAR(150),                          -- Nepali: "रुवीना" (can be NULL)
    spouse_name_english VARCHAR(150),                  -- English transliteration (optional)
    father_mother_name VARCHAR(200),                   -- Nepali: "सहिद मियाँ/ हदिशा" (combined)
    father_mother_name_english VARCHAR(200),           -- English transliteration (optional)
    
    -- Additional identification
    citizen_number VARCHAR(50),                        -- Citizenship certificate number (optional)
    address TEXT,                                      -- Detailed address (optional)
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT voters_voter_id_unique UNIQUE (voter_id),
    CONSTRAINT voters_polling_center_serial_unique UNIQUE (polling_center_id, serial_number),
    CONSTRAINT voters_age_positive CHECK (age IS NULL OR age >= 0),
    CONSTRAINT voters_serial_positive CHECK (serial_number IS NULL OR serial_number > 0)
);

-- Indexes for voters
CREATE INDEX IF NOT EXISTS idx_voters_voter_id ON voters(voter_id);
CREATE INDEX IF NOT EXISTS idx_voters_polling_center_id ON voters(polling_center_id);
CREATE INDEX IF NOT EXISTS idx_voters_polling_center_serial ON voters(polling_center_id, serial_number);
CREATE INDEX IF NOT EXISTS idx_voters_full_name ON voters(full_name);
CREATE INDEX IF NOT EXISTS idx_voters_full_name_english ON voters(full_name_english) 
WHERE full_name_english IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_gender ON voters(gender);
CREATE INDEX IF NOT EXISTS idx_voters_age ON voters(age) WHERE age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_date_of_birth ON voters(date_of_birth) 
WHERE date_of_birth IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_voters_polling_center_gender ON voters(polling_center_id, gender);

-- ============================================
-- 8. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_countries_updated_at 
    BEFORE UPDATE ON countries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provinces_updated_at 
    BEFORE UPDATE ON provinces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_districts_updated_at 
    BEFORE UPDATE ON districts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_municipalities_updated_at 
    BEFORE UPDATE ON municipalities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wards_updated_at 
    BEFORE UPDATE ON wards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polling_centers_updated_at 
    BEFORE UPDATE ON polling_centers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voters_updated_at 
    BEFORE UPDATE ON voters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. HELPER VIEWS
-- ============================================

-- View: Complete administrative hierarchy
CREATE OR REPLACE VIEW administrative_hierarchy AS
SELECT 
    c.id AS country_id,
    c.code AS country_code,
    c.nepali_name AS country_nepali,
    c.english_name AS country_english,
    
    p.id AS province_id,
    p.province_code,
    p.nepali_name AS province_nepali,
    p.english_name AS province_english,
    
    d.id AS district_id,
    d.district_code,
    d.nepali_name AS district_nepali,
    d.english_name AS district_english,
    
    m.id AS municipality_id,
    m.municipality_code,
    m.nepali_name AS municipality_nepali,
    m.english_name AS municipality_english,
    m.type AS municipality_type,
    
    w.id AS ward_id,
    w.ward_number,
    w.nepali_name AS ward_nepali,
    w.english_name AS ward_english,
    w.house_of_representatives_constituency,
    w.provincial_assembly_constituency,
    
    pc.id AS polling_center_id,
    pc.nepali_name AS polling_center_nepali,
    pc.english_name AS polling_center_english
    
FROM countries c
JOIN provinces p ON c.id = p.country_id
JOIN districts d ON p.id = d.province_id
JOIN municipalities m ON d.id = m.district_id
JOIN wards w ON m.id = w.municipality_id
JOIN polling_centers pc ON w.id = pc.ward_id
WHERE c.is_active = TRUE 
  AND p.is_active = TRUE 
  AND d.is_active = TRUE 
  AND m.is_active = TRUE 
  AND w.is_active = TRUE 
  AND pc.is_active = TRUE;

-- View: Ward with full location path (for easy queries)
CREATE OR REPLACE VIEW wards_with_location AS
SELECT 
    w.id,
    w.ward_number,
    w.nepali_name AS ward_nepali,
    w.english_name AS ward_english,
    w.house_of_representatives_constituency,
    w.provincial_assembly_constituency,
    
    -- Full location path
    CONCAT(
        c.nepali_name, ' → ',
        p.nepali_name, ' → ',
        d.nepali_name, ' → ',
        m.nepali_name, ' → ',
        'वडा ', w.ward_number
    ) AS location_path_nepali,
    
    CONCAT(
        c.english_name, ' → ',
        p.english_name, ' → ',
        d.english_name, ' → ',
        m.english_name, ' → ',
        'Ward ', w.ward_number
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
    
FROM wards w
JOIN municipalities m ON w.municipality_id = m.id
JOIN districts d ON m.district_id = d.id
JOIN provinces p ON d.province_id = p.id
JOIN countries c ON p.country_id = c.id
WHERE w.is_active = TRUE;

-- View: Voters with full location information
CREATE OR REPLACE VIEW voters_with_location AS
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

-- ============================================
-- 10. HELPER FUNCTIONS
-- ============================================

-- Function: Search voters by name (supports Nepali text)
CREATE OR REPLACE FUNCTION search_voters_by_name(
    search_term TEXT,
    result_limit INT DEFAULT 100
)
RETURNS TABLE (
    id INT,
    voter_id VARCHAR(50),
    full_name VARCHAR(150),
    age INT,
    gender VARCHAR(20),
    ward_number INT,
    polling_center_nepali TEXT,
    location_path_nepali TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.voter_id,
        v.full_name,
        v.age,
        v.gender,
        w.ward_number,
        pc.nepali_name AS polling_center_nepali,
        CONCAT(
            c.nepali_name, ' → ',
            p.nepali_name, ' → ',
            d.nepali_name, ' → ',
            m.nepali_name, ' → ',
            'वडा ', w.ward_number, ' → ',
            pc.nepali_name
        ) AS location_path_nepali
    FROM voters v
    JOIN polling_centers pc ON v.polling_center_id = pc.id
    JOIN wards w ON pc.ward_id = w.id
    JOIN municipalities m ON w.municipality_id = m.id
    JOIN districts d ON m.district_id = d.id
    JOIN provinces p ON d.province_id = p.id
    JOIN countries c ON p.country_id = c.id
    WHERE v.full_name ILIKE '%' || search_term || '%'
       OR v.voter_id = search_term
       OR (v.full_name_english IS NOT NULL AND v.full_name_english ILIKE '%' || search_term || '%')
    ORDER BY v.full_name
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: Get voters by polling center
CREATE OR REPLACE FUNCTION get_voters_by_polling_center(
    p_polling_center_id INT,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id INT,
    voter_id VARCHAR(50),
    full_name VARCHAR(150),
    serial_number INT,
    age INT,
    gender VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.voter_id,
        v.full_name,
        v.serial_number,
        v.age,
        v.gender
    FROM voters v
    WHERE v.polling_center_id = p_polling_center_id
    ORDER BY v.serial_number ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Get voters by ward (through polling centers)
CREATE OR REPLACE FUNCTION get_voters_by_ward(
    p_ward_id INT,
    p_limit INT DEFAULT 100,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id INT,
    voter_id VARCHAR(50),
    full_name VARCHAR(150),
    serial_number INT,
    age INT,
    gender VARCHAR(20),
    polling_center_nepali VARCHAR(200)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.voter_id,
        v.full_name,
        v.serial_number,
        v.age,
        v.gender,
        pc.nepali_name AS polling_center_nepali
    FROM voters v
    JOIN polling_centers pc ON v.polling_center_id = pc.id
    WHERE pc.ward_id = p_ward_id
    ORDER BY pc.nepali_name, v.serial_number ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function: Get polling center statistics
CREATE OR REPLACE FUNCTION get_polling_center_statistics(p_polling_center_id INT)
RETURNS TABLE (
    total_voters BIGINT,
    male_count BIGINT,
    female_count BIGINT,
    average_age NUMERIC,
    min_age INT,
    max_age INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS total_voters,
        COUNT(*) FILTER (WHERE gender = 'पुरुष' OR gender_english = 'Male')::BIGINT AS male_count,
        COUNT(*) FILTER (WHERE gender = 'महिला' OR gender_english = 'Female')::BIGINT AS female_count,
        ROUND(AVG(age)::NUMERIC, 2) AS average_age,
        MIN(age)::INT AS min_age,
        MAX(age)::INT AS max_age
    FROM voters
    WHERE polling_center_id = p_polling_center_id
      AND age IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Get ward statistics (aggregated from all polling centers in ward)
CREATE OR REPLACE FUNCTION get_ward_statistics(p_ward_id INT)
RETURNS TABLE (
    total_voters BIGINT,
    total_polling_centers BIGINT,
    male_count BIGINT,
    female_count BIGINT,
    average_age NUMERIC,
    min_age INT,
    max_age INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(v.id)::BIGINT AS total_voters,
        COUNT(DISTINCT v.polling_center_id)::BIGINT AS total_polling_centers,
        COUNT(*) FILTER (WHERE v.gender = 'पुरुष' OR v.gender_english = 'Male')::BIGINT AS male_count,
        COUNT(*) FILTER (WHERE v.gender = 'महिला' OR v.gender_english = 'Female')::BIGINT AS female_count,
        ROUND(AVG(v.age)::NUMERIC, 2) AS average_age,
        MIN(v.age)::INT AS min_age,
        MAX(v.age)::INT AS max_age
    FROM voters v
    JOIN polling_centers pc ON v.polling_center_id = pc.id
    WHERE pc.ward_id = p_ward_id
      AND v.age IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Complete hierarchy: Country → Province → District → Municipality → Ward → Polling Center → Voters
-- 2. Voters link ONLY to polling_center_id (not ward_id)
-- 3. Structure: voters → polling_centers → wards
-- 4. All foreign keys have ON DELETE CASCADE
-- 5. Unique constraints prevent duplicates
-- 6. Indexes created for fast queries
-- 7. Views provide easy querying with full location paths
-- 8. Functions support common operations (search, get by location, statistics)
--
-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Check all tables were created:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('countries', 'provinces', 'districts', 'municipalities', 'wards', 'polling_centers', 'voters')
-- ORDER BY table_name;
--
-- Check foreign key relationships:
-- SELECT
--     tc.table_name, 
--     kcu.column_name, 
--     ccu.table_name AS foreign_table_name
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- ORDER BY tc.table_name;

