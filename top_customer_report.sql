create or replace function top_customer_report(year integer)
returns table (
  customer_name text,
  month text,
  product_name text,
  total_qty numeric
)
language sql
as $$
  select
    c.name as customer_name,
    to_char(o.created_at, 'Month') as month,
    p.name as product_name,
    sum(oi.qty) as total_qty
  from orders o
  join customers c on o.customer_id = c.id
  join order_items oi on oi.order_id = o.id
  join products p on oi.product_id = p.id
  where extract(year from o.created_at) = year
  group by c.name, to_char(o.created_at, 'Month'), p.name
  order by c.name, month, p.name;
$$;
