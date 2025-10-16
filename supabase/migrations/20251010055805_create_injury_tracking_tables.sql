/*
  # Labour Injury Tracking System Database Schema

  ## Overview
  Creates a comprehensive database structure for tracking workplace injuries, 
  preventive actions, and generating analytics.

  ## New Tables

  ### 1. `departments`
  Stores department information for organizational structure.
  - `id` (uuid, primary key) - Unique department identifier
  - `name` (text) - Department name
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `employees`
  Stores employee information.
  - `id` (uuid, primary key) - Unique employee identifier
  - `user_id` (uuid, foreign key to auth.users) - Link to authenticated user
  - `full_name` (text) - Employee full name
  - `department_id` (uuid, foreign key to departments) - Department assignment
  - `employee_number` (text) - Unique employee number
  - `position` (text) - Job position
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `is_active` (boolean) - Whether employee is active
  - `last_login` (timestamptz) - Last login timestamp

  ### 3. `injury_reports`
  Main table for storing injury incident reports.
  - `id` (uuid, primary key) - Unique report identifier
  - `employee_id` (uuid, foreign key to employees) - Injured employee
  - `reported_by` (uuid, foreign key to auth.users) - User who submitted report
  - `incident_date` (date) - Date of incident
  - `incident_time` (time) - Time of incident
  - `location` (text) - Where incident occurred
  - `description` (text) - Detailed description of incident
  - `severity` (text) - Severity level: minor, major, fatal
  - `injury_type` (text) - Type: slip, fall, equipment, chemical, cut, burn, strain, other
  - `body_part_affected` (text) - Which body part was injured
  - `witnesses` (text) - Names of witnesses
  - `immediate_action_taken` (text) - First aid or immediate response
  - `medical_treatment_required` (boolean) - Whether medical treatment was needed
  - `work_days_lost` (integer) - Number of work days lost
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. `preventive_actions`
  Tracks safety measures and actions taken after incidents.
  - `id` (uuid, primary key) - Unique action identifier
  - `injury_report_id` (uuid, foreign key to injury_reports) - Related injury report
  - `action_type` (text) - Type: training, equipment_check, hazard_removal, policy_update, other
  - `description` (text) - Detailed action description
  - `responsible_person` (text) - Person responsible for action
  - `due_date` (date) - Action due date
  - `completion_date` (date) - When action was completed
  - `status` (text) - Status: pending, in_progress, completed
  - `notes` (text) - Additional notes
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Authenticated users can read all records
  - Authenticated users can create injury reports and preventive actions
  - Users can update their own reports and assigned preventive actions
*/
/*
  # Labour Injury Tracking System Database Schema
  Complete migration with all tables, RLS policies, and sample data
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create employees table with all required columns
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  department_id uuid REFERENCES departments(id),
  employee_number text UNIQUE NOT NULL,
  position text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  last_login timestamptz
);

-- Create injury_reports table
CREATE TABLE IF NOT EXISTS injury_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id),
  reported_by uuid REFERENCES auth.users(id),
  incident_date date NOT NULL,
  incident_time time NOT NULL,
  location text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('minor', 'major', 'fatal')),
  injury_type text NOT NULL CHECK (injury_type IN ('slip', 'fall', 'equipment', 'chemical', 'cut', 'burn', 'strain', 'other')),
  body_part_affected text,
  witnesses text,
  immediate_action_taken text,
  medical_treatment_required boolean DEFAULT false,
  work_days_lost integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create preventive_actions table
CREATE TABLE IF NOT EXISTS preventive_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  injury_report_id uuid REFERENCES injury_reports(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('training', 'equipment_check', 'hazard_removal', 'policy_update', 'other')),
  description text NOT NULL,
  responsible_person text,
  due_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers for updated_at
CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_injury_reports_updated_at 
    BEFORE UPDATE ON injury_reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Authenticated users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create departments"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for employees
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own employee record"
  ON employees FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for injury_reports
CREATE POLICY "Authenticated users can view injury reports"
  ON injury_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create injury reports"
  ON injury_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update injury reports they created"
  ON injury_reports FOR UPDATE
  TO authenticated
  USING (reported_by = auth.uid())
  WITH CHECK (reported_by = auth.uid());

-- RLS Policies for preventive_actions
CREATE POLICY "Authenticated users can view preventive actions"
  ON preventive_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create preventive actions"
  ON preventive_actions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update preventive actions"
  ON preventive_actions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_injury_reports_employee ON injury_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_injury_reports_date ON injury_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_injury_reports_severity ON injury_reports(severity);
CREATE INDEX IF NOT EXISTS idx_injury_reports_type ON injury_reports(injury_type);
CREATE INDEX IF NOT EXISTS idx_preventive_actions_report ON preventive_actions(injury_report_id);
CREATE INDEX IF NOT EXISTS idx_preventive_actions_status ON preventive_actions(status);
CREATE INDEX IF NOT EXISTS idx_preventive_actions_due_date ON preventive_actions(due_date);

-- Insert sample departments
INSERT INTO departments (name) VALUES
  ('Construction'),
  ('Manufacturing'),
  ('Warehouse'),
  ('Maintenance'),
  ('Administration')
ON CONFLICT DO NOTHING;