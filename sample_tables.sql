-- Table: samples
create table if not exists samples (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  status varchar(20) not null check (status in ('Request', 'Send', 'Reject', 'Approve')),
  expedition text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger to update updated_at on row update
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on samples;
create trigger set_timestamp
before update on samples
for each row
execute procedure update_updated_at_column();

-- Table: sample_items
create table if not exists sample_items (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid references samples(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  qty numeric not null,
  price numeric not null
);
