-- Allow restaurant owners to bootstrap their own owner role row
CREATE POLICY "owner self-bootstrap role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'owner'::app_role
  AND EXISTS (
    SELECT 1 FROM public.restaurants r
    WHERE r.id = user_roles.restaurant_id AND r.owner_id = auth.uid()
  )
);