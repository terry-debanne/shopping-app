-- Créer les tables dans Supabase (SQL Editor)

create table categories (
  id serial primary key,
  name text not null,
  emoji text not null default '🛒'
);

create table items (
  id serial primary key,
  name text not null,
  category_id integer references categories(id) on delete set null,
  needed boolean not null default false
);

-- Accès public (Row Level Security désactivé pour usage perso)
alter table categories enable row level security;
alter table items enable row level security;

create policy "Public access" on categories for all using (true) with check (true);
create policy "Public access" on items for all using (true) with check (true);

-- Données de démarrage (optionnel)
insert into categories (name, emoji) values
  ('Fruits & Légumes', '🥦'),
  ('Viandes & Poissons', '🥩'),
  ('Produits laitiers', '🧀'),
  ('Épicerie', '🥫'),
  ('Boissons', '🥤'),
  ('Hygiène', '🧴'),
  ('Surgelés', '🧊');
