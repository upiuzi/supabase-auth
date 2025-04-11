CREATE TABLE pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Prospect',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_pipeline_customer_id ON pipeline(customer_id);
CREATE INDEX idx_pipeline_product_id ON pipeline(product_id);
CREATE INDEX idx_pipeline_status ON pipeline(status);
