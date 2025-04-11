CREATE TABLE exhibitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  address TEXT,
  date_event DATE,
  country VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_exhibitions_date_event ON exhibitions(date_event);
CREATE INDEX idx_exhibitions_country ON exhibitions(country);
