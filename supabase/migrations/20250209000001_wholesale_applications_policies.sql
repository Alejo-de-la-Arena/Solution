-- Permite que cualquiera (anon) envíe una solicitud mayorista sin estar logueado.
DROP POLICY IF EXISTS "allow_anon_insert_wholesale_applications" ON public.wholesale_applications;
CREATE POLICY "allow_anon_insert_wholesale_applications"
ON public.wholesale_applications
FOR INSERT
TO anon
WITH CHECK (status = 'pending');

-- Permite que admins (tabla admins o profiles.role = 'admin') lean todas las solicitudes.
DROP POLICY IF EXISTS "allow_admin_select_wholesale_applications" ON public.wholesale_applications;
CREATE POLICY "allow_admin_select_wholesale_applications"
ON public.wholesale_applications
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
