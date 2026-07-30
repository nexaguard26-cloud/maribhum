-- ============================================
-- Marib Humanitarian Management System
-- Database Setup - Run in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    type VARCHAR(50),
    registration_number VARCHAR(50),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    province VARCHAR(50) DEFAULT 'Ma''rib',
    district VARCHAR(50),
    logo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    telegram_group_id BIGINT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF TABLE
-- ============================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    telegram_id BIGINT,
    telegram_username VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    full_name_ar VARCHAR(255),
    role VARCHAR(50) DEFAULT 'coordinator',
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
CREATE TABLE volunteers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alt_phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    province VARCHAR(50) DEFAULT 'Ma''rib',
    district VARCHAR(50),
    address TEXT,
    skills TEXT[] DEFAULT '{}',
    education_level VARCHAR(50),
    occupation VARCHAR(100),
    languages TEXT[] DEFAULT ARRAY['ar'],
    availability VARCHAR(20) DEFAULT 'part_time',
    preferred_hours VARCHAR(20),
    has_vehicle BOOLEAN DEFAULT FALSE,
    vehicle_type VARCHAR(50),
    has_driver_license BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending',
    current_task_id UUID,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    registration_source VARCHAR(50) DEFAULT 'telegram',
    notes TEXT,
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    province VARCHAR(50),
    district VARCHAR(50),
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    target_community VARCHAR(255),
    target_beneficiaries INTEGER,
    actual_beneficiaries INTEGER,
    beneficiary_type VARCHAR(50),
    required_skills TEXT[],
    required_volunteers INTEGER DEFAULT 1,
    required_materials TEXT[],
    budget DECIMAL(12, 2),
    funding_source VARCHAR(255),
    tags TEXT[],
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),
    parent_task_id UUID REFERENCES tasks(id),
    assigned_to UUID REFERENCES volunteers(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    attachments TEXT[],
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
CREATE TABLE field_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    volunteer_id UUID REFERENCES volunteers(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    report_type VARCHAR(50) DEFAULT 'progress',
    title VARCHAR(255),
    description TEXT NOT NULL,
    location_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    report_date TIMESTAMPTZ DEFAULT NOW(),
    families_affected INTEGER,
    individuals_affected INTEGER,
    photos TEXT[],
    photo_count INTEGER DEFAULT 0,
    severity VARCHAR(20),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    reviewed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_telegram_id BIGINT,
    user_type VARCHAR(20),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'info',
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
CREATE TABLE activity_log (
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
CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_volunteers_org ON volunteers(organization_id);
CREATE INDEX idx_volunteers_status ON volunteers(status);
CREATE INDEX idx_volunteers_telegram ON volunteers(telegram_id);
CREATE INDEX idx_reports_task ON field_reports(task_id);
CREATE INDEX idx_reports_volunteer ON field_reports(volunteer_id);
CREATE INDEX idx_notifications_user ON notifications(user_telegram_id, is_read);

-- ============================================
-- AUTO UPDATE TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_timestamp BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_volunteers_timestamp BEFORE UPDATE ON volunteers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tasks_timestamp BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Create admin user (password: admin123)
-- Note: Run this separately after tables are created
-- INSERT INTO staff (full_name, phone, password_hash, role, province, is_active)
-- VALUES ('مدير النظام', '+9670000000', '$2a$10$rOzJqQZQKG6p3WGZ7W8Y5.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'admin', 'Ma''rib', TRUE);

-- Insert sample organization
INSERT INTO organizations (name, name_ar, type, contact_person, contact_phone, province, status)
VALUES ('الوحدة التنفيذية لمأرب', 'الوحدة التنفيذية لمأرب', 'coordination', 'مدير الوحدة', '+9671234567', 'Ma''rib', 'active');

-- Insert sample volunteers
INSERT INTO volunteers (full_name, phone, telegram_id, province, district, skills, has_vehicle, status)
VALUES 
    ('أحمد محمد علي', '+9677111111', 111111111, 'Ma''rib', 'City Center', ARRAY['distribution', 'logistics'], true, 'active'),
    ('فاطمة خالد', '+9677222222', 222222222, 'Ma''rib', 'Al-Mashajah', ARRAY['medical', 'first_aid'], false, 'active'),
    ('محمد عبدالله', '+9677333333', 333333333, 'Ma''rib', 'Rabwah', ARRAY['distribution', 'awareness'], true, 'active');

-- Insert sample tasks
INSERT INTO tasks (title, title_ar, description, category, priority, status, province, district, location_text, target_beneficiaries)
VALUES 
    ('توزيع مواد إغاثية', 'توزيع مواد إغاثية', 'توزيع سلال غذائية على الأسر المتضررة', 'distribution', 'high', 'pending', 'Ma''rib', 'City Center', 'حي السوق القديم', 50),
    ('مخيم طبي', 'مخيم طبي خيري', 'إقامة مخيم طبي للفحص والعلاج', 'medical', 'critical', 'pending', 'Ma''rib', 'Al-Mashajah', 'مدرسة الرازي', 200),
    ('حملة توعية', 'حملة توعية صحية', 'توعية مجتمعية حول النظافة والصحة', 'awareness', 'normal', 'pending', 'Ma''rib', 'Rabwah', 'مركز صحي الروضة', 100);

-- ============================================
-- DISABLE RLS (For Development)
-- ============================================
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE field_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;

-- ============================================
-- DONE!
-- ============================================
-- Now run this to create admin user:
-- INSERT INTO staff (full_name, phone, password_hash, role, province, is_active)
-- VALUES ('مدير النظام', '0770000000', '$2a$10$rOzJqQZQKG6p3WGZ7W8Y5.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'admin', 'Ma''rib', TRUE);
