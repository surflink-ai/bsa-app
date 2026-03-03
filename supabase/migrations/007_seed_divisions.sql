-- Seed standard BSA competition divisions
insert into comp_divisions (name, short_name, sort_order) values
  ('Open Men', 'OM', 1),
  ('Open Women', 'OW', 2),
  ('Under 18 Boys', 'U18B', 3),
  ('Under 18 Girls', 'U18G', 4),
  ('Under 16 Boys', 'U16B', 5),
  ('Under 16 Girls', 'U16G', 6),
  ('Under 14 Boys', 'U14B', 7),
  ('Under 14 Girls', 'U14G', 8),
  ('Under 12', 'U12', 9),
  ('Longboard Open', 'LB', 10),
  ('Bodyboard Open', 'BB', 11),
  ('Masters', 'MST', 12),
  ('Grand Masters', 'GM', 13)
on conflict (name) do nothing;

-- Create 2026 SOTY season
insert into comp_seasons (name, year, points_system) values
  ('2026 SOTY Series', 2026, '{"1":1000,"2":800,"3":650,"4":500,"5":400,"6":300,"7":200,"8":100}')
on conflict do nothing;
