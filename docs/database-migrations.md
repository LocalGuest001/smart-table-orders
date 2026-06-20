# Database Migrations

This project uses **Lovable Cloud** (Supabase Postgres) for its database. All
schema changes — tables, columns, indexes, RLS policies, functions, triggers,
enums — are tracked as timestamped SQL files under `supabase/migrations/`.

> ⚠️ Migrations are for **schema** only. To insert, update, or delete rows in
> existing tables, use a one-off data script, not a migration.

---

## 1. Folder layout

```
supabase/
├── config.toml              # project-level config (auto-managed)
└── migrations/
    ├── 20260425193535_xxx.sql
    ├── 20260425193601_xxx.sql
    ├── 20260425194817_xxx.sql
    └── 20260601110925_xxx.sql
```

- File name pattern: `YYYYMMDDHHMMSS_<slug>.sql`
- Files are applied in **lexicographic order** (the timestamp prefix guarantees
  this matches creation order).
- Once a migration has been applied to the cloud database, **never edit it**.
  Create a new migration that alters or fixes the previous change.

---

## 2. The required 4-step structure for a new table

Supabase's Data API (PostgREST) does **not** grant default privileges on the
`public` schema. RLS alone is not enough — without `GRANT`s the API returns a
permission error and the app cannot reach the table.

Every new public-schema table must follow this exact order, **in the same
migration**:

```sql
-- 1. CREATE the table
CREATE TABLE public.notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  content     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. GRANT to the roles your policies allow
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
-- GRANT SELECT ON public.notes TO anon;  -- only if a policy allows anon reads

-- 3. Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 4. Create policies
CREATE POLICY "Users manage their own notes"
  ON public.notes
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### When to grant each role

| Role            | Grant when…                                                    |
| --------------- | -------------------------------------------------------------- |
| `authenticated` | Logged-in users read/write the table via the client.           |
| `anon`          | The table is fully public (e.g. published menu items).         |
| `service_role`  | Edge functions, server functions, or admin code touch the table. **Always include this.** |

---

## 3. Standard columns & helpers

### Timestamps with auto-update

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

### Linking rows to users

- ✅ Reference `auth.users(id)` for ownership FKs.
- ❌ Do **not** add columns or triggers inside the `auth` schema.
- For user-facing fields (display name, avatar), store them on a
  `public.profiles` table keyed by `user_id`.

---

## 4. User roles (security pattern)

Roles must live in a **separate table** — never on `profiles` or any
user-editable table, otherwise users can self-promote to admin.

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'chef');

CREATE TABLE public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL    ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER avoids recursive RLS when checked from a policy
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;
```

Use the function inside any policy that depends on a role:

```sql
CREATE POLICY "Admins read everything"
  ON public.orders
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## 5. Validation: triggers, not CHECK constraints

Postgres `CHECK` constraints must be **immutable**, so anything time-dependent
(`expire_at > now()`) or referencing other rows will break or fail on restore.
Use a `BEFORE INSERT OR UPDATE` trigger instead.

```sql
CREATE OR REPLACE FUNCTION public.validate_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.total < 0 THEN
    RAISE EXCEPTION 'Order total cannot be negative';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_trg
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.validate_order();
```

---

## 6. Altering an existing table

Always create a **new** migration file. Example: adding a `food_type` enum
column to `menu_items`.

```sql
CREATE TYPE public.food_type AS ENUM ('veg', 'non_veg', 'jain');

ALTER TABLE public.menu_items
  ADD COLUMN food_type public.food_type NOT NULL DEFAULT 'veg';
```

Things to remember:

- Provide a `DEFAULT` for `NOT NULL` columns so existing rows keep working.
- If you change a column type, back-fill the data in the same migration.
- After a schema change, the generated TypeScript types
  (`src/integrations/supabase/types.ts`) are refreshed automatically — update
  any code that depends on the new shape.

---

## 7. Forbidden statements

These will fail or are blocked in Lovable Cloud:

- `ALTER DATABASE postgres ...` — rejected.
- Any DDL inside the `auth`, `storage`, `realtime`, `supabase_functions`, or
  `vault` schemas.
- Triggers on tables in the schemas above.

---

## 8. Workflow inside Lovable

1. Describe the schema change in chat (e.g. *"add a `tags` column to
   `menu_items`"*).
2. Lovable proposes a migration — review the SQL carefully.
3. Approve to apply it to the cloud database.
4. Generated types refresh automatically; update calling code.
5. The migration file is committed under `supabase/migrations/`.

> 🚫 Do **not** apply migrations manually from `psql`, the Supabase dashboard,
> or `supabase db push`. The Lovable workflow is the single source of truth.

---

## 9. Data changes (INSERT / UPDATE / DELETE)

Data edits do **not** belong in migration files. Use a one-off SQL script
through Lovable's data tool, for example:

```sql
UPDATE public.menu_items
SET    is_available = false
WHERE  restaurant_id = '…' AND name ILIKE '%seasonal%';
```

---

## 10. Quick checklist before approving a migration

- [ ] New tables follow the 4-step structure (CREATE → GRANT → RLS → POLICY).
- [ ] `service_role` is granted on every new public table.
- [ ] RLS policies scope rows to `auth.uid()` (or `has_role(...)`).
- [ ] Roles are stored only in `public.user_roles`.
- [ ] Time-dependent rules use triggers, not `CHECK`.
- [ ] `NOT NULL` columns have sensible defaults.
- [ ] `updated_at` has an update trigger if the table is mutable.
- [ ] No edits to existing migration files.
- [ ] No DDL inside `auth` / `storage` / `realtime` / `vault`.
