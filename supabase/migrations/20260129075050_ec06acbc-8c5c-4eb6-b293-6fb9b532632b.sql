-- Add category-specific top banner placements
INSERT INTO ad_placements (name, slug, description, dimensions, credit_cost, is_active)
VALUES 
  ('Baner Górny (Kategoria: Wiadomości)', 'category-top-wiadomosci', 'Baner górny dla kategorii Wiadomości', '1200x200', 45, true),
  ('Baner Górny (Kategoria: Świat)', 'category-top-swiat', 'Baner górny dla kategorii Świat', '1200x200', 45, true),
  ('Baner Górny (Kategoria: Biznes)', 'category-top-biznes', 'Baner górny dla kategorii Biznes', '1200x200', 50, true),
  ('Baner Górny (Kategoria: Finanse)', 'category-top-finanse', 'Baner górny dla kategorii Finanse', '1200x200', 50, true),
  ('Baner Górny (Kategoria: Prawo)', 'category-top-prawo', 'Baner górny dla kategorii Prawo', '1200x200', 45, true),
  ('Baner Górny (Kategoria: Tech & Nauka)', 'category-top-tech-nauka', 'Baner górny dla kategorii Tech & Nauka', '1200x200', 55, true),
  ('Baner Górny (Kategoria: Motoryzacja)', 'category-top-motoryzacja', 'Baner górny dla kategorii Motoryzacja', '1200x200', 50, true),
  ('Baner Górny (Kategoria: Sport)', 'category-top-sport', 'Baner górny dla kategorii Sport', '1200x200', 55, true),
  ('Baner Górny (Kategoria: Kultura)', 'category-top-kultura', 'Baner górny dla kategorii Kultura', '1200x200', 40, true),
  ('Baner Górny (Kategoria: Lifestyle)', 'category-top-lifestyle', 'Baner górny dla kategorii Lifestyle', '1200x200', 45, true)
ON CONFLICT (slug) DO NOTHING;