insert into public.profiles (id, full_name, email, phone, role)
values
  ('00000000-0000-0000-0000-000000000001', 'Maya Johnson', 'maya@example.com', '+12025550112', 'customer'),
  ('00000000-0000-0000-0000-000000000002', 'Andre Lewis', 'andre@fademasters.example', '+12025550100', 'business_owner'),
  ('00000000-0000-0000-0000-000000000003', 'Ava Chen', 'admin@lineup.example', null, 'admin')
on conflict (id) do nothing;

insert into public.businesses
  (id, owner_id, name, category, plan, plan_status, fast_pass_mode, fast_pass_price_cents, monthly_customer_limit)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Fade Masters', 'Barbershop', 'professional', 'active', 'limited', 1200, null),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'CityCare Clinic', 'Clinic', 'enterprise', 'active', 'disabled', 0, null)
on conflict (id) do nothing;

insert into public.business_memberships (business_id, user_id, role)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'business_owner'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'business_owner')
on conflict (business_id, user_id) do nothing;

insert into public.locations
  (id, business_id, name, address, timezone, phone, business_hours)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Greenbelt',
    '7500 Greenway Center Dr, Greenbelt, MD',
    'America/New_York',
    '+13015550100',
    '[{"day":1,"open":"09:00","close":"19:00"},{"day":2,"open":"09:00","close":"19:00"},{"day":3,"open":"09:00","close":"19:00"},{"day":4,"open":"09:00","close":"19:00"},{"day":5,"open":"09:00","close":"19:00"},{"day":6,"open":"09:00","close":"18:00"}]'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Bowie',
    '15500 Annapolis Rd, Bowie, MD',
    'America/New_York',
    '+13015550101',
    '[{"day":1,"open":"09:00","close":"19:00"},{"day":2,"open":"09:00","close":"19:00"},{"day":3,"open":"09:00","close":"19:00"},{"day":4,"open":"09:00","close":"19:00"},{"day":5,"open":"09:00","close":"19:00"},{"day":6,"open":"09:00","close":"18:00"}]'
  )
on conflict (id) do nothing;

insert into public.queues
  (id, location_id, name, status, average_service_minutes, active_staff, current_demand, sms_enabled)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Walk-ins', 'open', 16, 2, 'heavy', true),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Walk-ins', 'open', 14, 1, 'normal', true)
on conflict (id) do nothing;

insert into public.staff_members (location_id, display_name, title, active)
values
  ('20000000-0000-0000-0000-000000000001', 'Andre', 'Master barber', true),
  ('20000000-0000-0000-0000-000000000001', 'Nia', 'Stylist', true);

insert into public.queue_entries
  (id, queue_id, customer_id, customer_name, customer_phone, customer_email, status, position, party_size, fast_pass, quoted_wait_minutes, notification_channels, joined_at)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', null, 'John Carter', '+12025550113', 'john@example.com', 'serving', 0, 1, false, 0, array['push','sms','email']::public.notification_channel[], now() - interval '42 minutes'),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', null, 'Sarah Miles', '+12025550114', 'sarah@example.com', 'waiting', 1, 1, false, 8, array['push','sms']::public.notification_channel[], now() - interval '28 minutes'),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', null, 'Mike Evans', '+12025550115', 'mike@example.com', 'waiting', 2, 1, false, 16, array['push']::public.notification_channel[], now() - interval '24 minutes'),
  ('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Maya Johnson', '+12025550112', 'maya@example.com', 'waiting', 3, 1, false, 24, array['push','sms','email']::public.notification_channel[], now() - interval '18 minutes')
on conflict (id) do nothing;
