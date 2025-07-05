-- Create the database
CREATE DATABASE meda_plus_academy
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the database
\c meda_plus_academy

-- Create specialties table
CREATE TABLE specialties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admins table
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_sessions table
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_token)
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    specialty_id INTEGER NOT NULL REFERENCES specialties(id),
    instractor_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- انشاء جدول  course_registrations
CREATE TABLE IF NOT EXISTS course_registrations (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, course_id)
);

-- إنشاء جدول workshops
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT NOT NULL,
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء جدول workshop_registrations
CREATE TABLE IF NOT EXISTS workshop_registrations (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, workshop_id)
);

-- إضافة indexes لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_workshops_event_date ON workshops(event_date);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_user_id ON workshop_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_workshop_registrations_workshop_id ON workshop_registrations(workshop_id);

-- Create course_categories table
CREATE TABLE course_categories (
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, category_id)
);

-- Create course_parts table
CREATE TABLE course_parts (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    part_type VARCHAR(20) NOT NULL CHECK (part_type IN ('midterm', 'final')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create chapters table
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    course_part_id INTEGER NOT NULL REFERENCES course_parts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create video_views table
CREATE TABLE video_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_view UNIQUE (user_id, video_id, viewed_at)
);

-- Create completed_videos table
CREATE TABLE completed_videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_completion UNIQUE (user_id, video_id)
);

-- Create comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create comment_replies table
CREATE TABLE comment_replies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_video_views_user_id ON video_views(user_id);
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_completed_videos_user_id ON completed_videos(user_id);
CREATE INDEX idx_completed_videos_video_id ON completed_videos(video_id);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comment_replies_comment_id ON comment_replies(comment_id);
CREATE INDEX idx_videos_identifier ON videos(identifier);




# 1. إنشاء جدول instructors
psql -U postgres -d meda_plus_academy -c "
CREATE TABLE public.instructors (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    specialization character varying(255) NOT NULL,
    avatar character varying(255),
    bio text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT instructors_pkey PRIMARY KEY (id),
    CONSTRAINT instructors_name_key UNIQUE (name)
);"

# 2. إنشاء sequence لـ instructors.id
psql -U postgres -d meda_plus_academy -c "
CREATE SEQUENCE public.instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.instructors_id_seq OWNED BY public.instructors.id;
ALTER TABLE ONLY public.instructors ALTER COLUMN id SET DEFAULT nextval('public.instructors_id_seq'::regclass);"

# 3. إضافة عمود instructor_id إلى جدول courses
psql -U postgres -d meda_plus_academy -c "
ALTER TABLE public.courses
    ADD COLUMN instructor_id integer;"

# 4. إضافة foreign key constraint لـ instructor_id
psql -U postgres -d meda_plus_academy -c "
ALTER TABLE courses ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL;"

# 5. نقل بيانات instractor_name إلى جدول instructors
psql -U postgres -d meda_plus_academy -c "
INSERT INTO public.instructors (name, specialization, avatar, bio)
SELECT DISTINCT instractor_name, 'Unknown Specialization', NULL, NULL
FROM public.courses
WHERE instractor_name IS NOT NULL;"

# 6. تحديث instructor_id في جدول courses بناءً على instractor_name
psql -U postgres -d meda_plus_academy -c "
UPDATE public.courses
SET instructor_id = (SELECT id FROM public.instructors WHERE name = courses.instractor_name);"

# 7. حذف عمود instractor_name من جدول courses
psql -U postgres -d meda_plus_academy -c "
ALTER TABLE public.courses
    DROP COLUMN instractor_name;"