CREATE TYPE public.food_type AS ENUM ('veg', 'non_veg', 'jain');
ALTER TABLE public.menu_items ADD COLUMN food_type public.food_type NOT NULL DEFAULT 'veg';