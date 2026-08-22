-- Shopping Events: year-round sale directories (admin-enabled landing pages)
create table if not exists shopping_events (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  tagline text,
  description text,
  emoji text default '🎉',
  hero_image text,
  theme_color text default '#246BFF',
  start_date date,
  end_date date,
  is_active boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 0,
  keywords text default '',
  seo_title text,
  seo_description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists event_products (
  id uuid primary key,
  event_id uuid not null references shopping_events(id) on delete cascade,
  product_id text not null references product_reviews(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);
create unique index if not exists idx_event_products_unique on event_products(event_id, product_id);
create index if not exists idx_event_products_event on event_products(event_id);

insert into shopping_events (id, name, slug, tagline, description, emoji, theme_color, start_date, end_date, is_active, featured, sort_order, keywords) values
  (gen_random_uuid(), 'New Year Sales', 'new-year-sales', 'Fresh year, fresh deals', 'Kick off the year with clearance steals across every department.', '🎉', '#246BFF', '2026-12-26', '2027-01-15', false, true, 10, 'fitness,health-wellness,home-kitchen'),
  (gen_random_uuid(), 'Super Bowl Deals', 'super-bowl-deals', 'Big game, bigger savings', 'TVs, projectors, snack makers and party gear before kickoff.', '🏈', '#0A1F44', '2027-01-25', '2027-02-10', false, false, 20, 'electronics,sports-outdoors,home-kitchen'),
  (gen_random_uuid(), 'Valentine''s Day', 'valentines-day', 'Gifts they will actually love', 'Beauty sets, fragrances and romantic picks.', '💝', '#E11D6F', '2027-01-28', '2027-02-14', false, true, 30, 'beauty-personal-care,fashion-clothing,body-scrubs-treatments'),
  (gen_random_uuid(), 'Spring Sale', 'spring-sale', 'Refresh everything for spring', 'Home refreshes, cleaning bundles and garden-ready gear.', '🌸', '#10B981', '2027-03-10', '2027-04-05', false, false, 40, 'cleaning-home,home-kitchen,lifestyle'),
  (gen_random_uuid(), 'Easter Deals', 'easter-deals', 'Basket fillers & family fun', 'Candy, toys, crafts and spring outfits for the family.', '🐣', '#F59E0B', '2027-03-15', '2027-03-30', false, false, 50, 'toys-games,baby-products,art-craft-supplies'),
  (gen_random_uuid(), 'Mother''s Day', 'mothers-day', 'Show mom she matters', 'Skincare heroes, cozy home upgrades and heartfelt gifts.', '💐', '#EC4899', '2027-04-20', '2027-05-09', false, true, 60, 'beauty-personal-care,home-kitchen,fashion-clothing'),
  (gen_random_uuid(), 'Memorial Day Sales', 'memorial-day-sales', 'Honoring with hot deals', 'Mattresses, grills, outdoors and big-ticket markdowns.', '🇺🇸', '#3B82F6', '2027-05-22', '2027-06-01', false, false, 70, 'sports-outdoors,home-kitchen,lifestyle'),
  (gen_random_uuid(), 'Father''s Day', 'fathers-day', 'Gear dad will brag about', 'Tools, tech, automotive care and grill season essentials.', '👔', '#6366F1', '2027-06-01', '2027-06-20', false, false, 80, 'electronics,automotive,sports-outdoors'),
  (gen_random_uuid(), 'Prime Day', 'prime-day', 'Amazon''s biggest deals event', 'Site-wide lightning deals tracked live by our editors.', '⚡', '#FF9900', '2027-07-12', '2027-07-16', false, true, 90, 'electronics,gaming,computer-accessories'),
  (gen_random_uuid(), 'Back to School', 'back-to-school', 'Ace the semester for less', 'Supplies, laptops, dorm gear and budget-friendly essentials.', '🎒', '#8B5CF6', '2027-07-15', '2027-09-10', true, true, 5, 'school-office-supplies,office-productivity,computer-accessories,bags-backpacks'),
  (gen_random_uuid(), 'Labor Day Sales', 'labor-day-sales', 'Summer''s last big blowout', 'Appliances, furniture and end-of-season outdoor gear.', '🛠️', '#EF4444', '2026-08-28', '2026-09-08', true, false, 8, 'home-kitchen,sports-outdoors,cleaning-home'),
  (gen_random_uuid(), 'Halloween', 'halloween', 'Spooky season savings', 'Costumes, decor, candy-making and party supplies.', '🎃', '#7C3AED', '2026-10-01', '2026-10-31', true, false, 12, 'toys-games,art-craft-supplies,cleaning-home'),
  (gen_random_uuid(), 'Black Friday', 'black-friday', 'The deal event of the year', 'Lowest prices of the year, verified live by our price tracker.', '🖤', '#111827', '2026-11-20', '2026-11-28', true, true, 1, 'electronics,gaming,computer-accessories,home-kitchen,toys-games'),
  (gen_random_uuid(), 'Cyber Monday', 'cyber-monday', 'Online-only tech steals', 'Laptops, headphones, smart home and everything digital.', '🤖', '#0EA5E9', '2026-11-29', '2026-12-02', true, true, 2, 'electronics,gaming,computer-accessories,ai-software-tools'),
  (gen_random_uuid(), 'Christmas & Holiday', 'christmas-holiday', 'Gift guides for everyone', 'Editor-picked gifts across toys, beauty, tech and home.', '🎁', '#DC2626', '2026-12-01', '2026-12-25', true, true, 3, 'toys-games,beauty-personal-care,electronics,books-reading')
on conflict (slug) do nothing;
