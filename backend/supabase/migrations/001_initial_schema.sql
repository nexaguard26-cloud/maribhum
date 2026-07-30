-- ============================================
-- Marib Humanitarian Management System
-- Database Schema v1.0
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    type VARCHAR(50) CHECK (type IN ('charity', 'medical', 'relief', 'development', 'social', 'coordination')),
    registration_number VARCHAR(50),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    province VARCHAR(50) DEFAULT 'Ma''rib',
    district VARCHAR(50),
    logo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    telegram_group_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF TABLE (Users/Coordinators)
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    telegram_id BIGINT,
    telegram_username VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    role VARCHAR(50) DEFAULT 'coordinator' CHECK (role IN ('admin', 'director', 'coordinator', 'supervisor', 'field_officer', 'data_entry')),
    email VARCHAR(100),
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    province VARCHAR(50),
    district VARCHAR(50),
    profile_image VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VOLUNTEERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alt_phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    
    -- Location
    province VARCHAR(50) DEFAULT 'Ma''rib',
    district VARCHAR(50),
    address TEXT,
    
    -- Professional Info
    skills TEXT[] DEFAULT '{}',
    education_level VARCHAR(50),
    occupation VARCHAR(100),
    languages TEXT[] DEFAULT ARRAY['ar'],
    
    -- Availability
    availability VARCHAR(20) DEFAULT 'part_time' CHECK (availability IN ('full_time', 'part_time', 'weekends', 'on_call')),
    preferred_hours VARCHAR(20),
    
    -- Resources
    has_vehicle BOOLEAN DEFAULT FALSE,
    vehicle_type VARCHAR(50),
    has_driver_license BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification', 'blacklisted')),
    current_task_id UUID,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    
    -- Metadata
    registration_source VARCHAR(50) DEFAULT 'telegram',
    notes TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    -- Basic Info
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN (
        'medical', 'relief', 'distribution', 'shelter', 
        'water_sanitation', 'education', 'protection',
        'logistics', 'coordination', 'awareness', 'general', 'other'
    )),
    
    -- Priority & Status
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('critical', 'high', 'normal', 'low')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'assigned', 'in_progress', 
        'completed', 'cancelled', 'on_hold'
    )),
    
    -- Timing
    start_date DATE,
    end_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    
    -- Location
    province VARCHAR(50),
    district VARCHAR(50),
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    target_community VARCHAR(255),
    
    -- Beneficiaries
    target_beneficiaries INTEGER,
    actual_beneficiaries INTEGER,
    beneficiary_type VARCHAR(50),
    
    -- Required Resources
    required_skills TEXT[],
    required_volunteers INTEGER DEFAULT 1,
    required_materials TEXT[],
    
    -- Funding
    budget DECIMAL(12, 2),
    funding_source VARCHAR(255),
    
    -- Tags & Recurrence
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    parent_task_id UUID REFERENCES tasks(id),
    
    -- Assignments
    assigned_to UUID REFERENCES volunteers(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Attachments
    attachments TEXT[],
    
    -- Outcome
    outcome TEXT,
    outcome_ar TEXT,
    lessons_learned TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- FIELD REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS field_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    
    -- Report Type
    report_type VARCHAR(50) DEFAULT 'progress' CHECK (report_type IN (
        'progress', 'completion', 'issue', 'emergency', 
        'checkpoint', 'incident', 'need_assessment'
    )),
    
    -- Content
    title VARCHAR(255),
    description TEXT NOT NULL,
    
    -- Location & Time
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    report_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Beneficiaries
    families_affected INTEGER,
    individuals_affected INTEGER,
    
    -- Photos
    photos TEXT[],
    photo_count INTEGER DEFAULT 0,
    
    -- Status
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    
    -- Review
    reviewed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_telegram_id BIGINT,
    user_type VARCHAR(20) CHECK (user_type IN ('staff', 'volunteer')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN (
        'task_assigned', 'task_completed', 'task_cancelled', 'task_updated',
        'new_volunteer', 'new_report', 'emergency',
        'reminder', 'approval_needed', 'system', 'info'
    )),
    
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    priority VARCHAR(20) DEFAULT 'normal',
    send_telegram BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    entity_type VARCHAR(50),
    entity_id UUID,
    
    action VARCHAR(50),
    
    actor_type VARCHAR(20),
    actor_id UUID,
    actor_name VARCHAR(255),
    
    changes JSONB,
    metadata JSONB DEFAULT '{}',
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_province ON organizations(province);

CREATE INDEX IF NOT EXISTS idx_staff_org ON staff(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_telegram ON staff(telegram_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);

CREATE INDEX IF NOT EXISTS idx_volunteers_org ON volunteers(organization_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_telegram ON volunteers(telegram_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_district ON volunteers(district);
CREATE INDEX IF NOT EXISTS idx_volunteers_province ON volunteers(province);

CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_province ON tasks(province);
CREATE INDEX IF NOT EXISTS idx_tasks_district ON tasks(district);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reports_task ON field_reports(task_id);
CREATE INDEX IF NOT EXISTS idx_reports_volunteer ON field_reports(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON field_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date ON field_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON field_reports(severity) WHERE severity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_telegram ON notifications(user_telegram_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_org ON activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_log(actor_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_timestamp
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_staff_timestamp
    BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_volunteers_timestamp
    BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_timestamp
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reports_timestamp
    BEFORE UPDATE ON field_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default organization
INSERT INTO organizations (name, name_ar, type, contact_person, contact_phone, province, status)
VALUES (
    'الوحدة التنفيذية لمأرب',
    'الوحدة التنفيذية لمأرب',
    'coordination',
    'مدير الوحدة',
    '+9671234567',
    'Ma''rib',
    'active'
);

-- Insert admin user (password: admin123)
INSERT INTO staff (organization_id, full_name, role, email, phone, password_hash, province, is_active)
SELECT 
    id,
    'المدير العام',
    'admin',
    'admin@marib.gov.ye',
    '+9670000000',
    '$2a$10$rOzJqQZQKG6p3WGZ7W8Y5.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'Ma''rib',
    TRUE
FROM organizations WHERE type = 'coordination' LIMIT 1;

-- Insert sample volunteers
INSERT INTO volunteers (full_name, phone, telegram_id, province, district, skills, has_vehicle, status)
VALUES 
    ('أحمد محمد علي', '+9677111111', 111111111, 'Ma''rib', 'City Center', ARRAY['distribution', 'logistics'], true, 'active'),
    ('فاطمة خالد', '+9677222222', 222222222, 'Ma''rib', 'Al-Mashajah', ARRAY['medical', 'first_aid'], false, 'active'),
    ('محمد عبدالله', '+9677333333', 333333333, 'Ma''rib', 'Rabwah', ARRAY['distribution', 'awareness'], true, 'active');

-- Insert sample tasks
INSERT INTO tasks (title, title_ar, description, category, priority, status, province, district, location_text, target_beneficiaries, assigned_to)
SELECT 
    'توزيع مواد إغاثية',
    'توزيع مواد إغاثية',
    'توزيع سلال غذائية على الأسر المتضررة',
    'distribution',
    'high',
    'assigned',
    'Ma''rib',
    'City Center',
    'حي السوق القديم',
    50,
    v.id
FROM volunteers v WHERE v.full_name LIKE 'أحمد%' LIMIT 1;

INSERT INTO tasks (title, title_ar, description, category, priority, status, province, district, location_text, target_beneficiaries)
VALUES 
    ('مخيم طبي', 'مخيم طبي خيري', 'إقامة مخيم طبي للفحص والعلاج', 'medical', 'critical', 'pending', 'Ma''rib', 'Al-Mashajah', 'مدرسة الرازي', 200),
    ('حملة توعية', 'حملة توعية صحية', 'توعية مجتمعية حول النظافة والصحة', 'awareness', 'normal', 'pending', 'Ma''rib', 'Rabwah', 'مركز صحي الروضة', 100);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their org data
CREATE POLICY "Allow read for authenticated users" ON organizations
    FOR SELECT USING (auth.role() = 'authenticated');

-- (Add more RLS policies as needed for production)
