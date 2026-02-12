// Supabase Edge Function: aprobar o rechazar solicitud mayorista.
// Requiere: Authorization Bearer (JWT del admin). No usar service_role en el cliente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Diagnóstico: solo "(present)" o "(missing)", nunca el token. Si no ves FUNC_START_OK en Logs, el 401 viene del gateway.
  const authRaw = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const authHeaderPresent = Boolean(authRaw && authRaw.trim().length > 0);
  console.log("FUNC_START_OK", { method: req.method, authHeaderPresent });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Ping para debug: GET sin auth (verify_jwt=false -> 200; verify_jwt=true -> 401 del gateway)
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ pong: true, authHeaderPresent }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = authRaw ?? null;
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado", message: "Falta token" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'Falta token' }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user) {
      const msg = userError?.message || 'Token inválido';
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: msg }),
        { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';
    if (!isAdmin) {
      const { data: adminRow } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
      if (!adminRow) {
        return new Response(
          JSON.stringify({ error: 'Forbidden', message: 'Solo administradores' }),
          { status: 403, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json();
    const { application_id, decision, plan } = body;
    if (!application_id || !decision || !['approve', 'reject'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'Bad request', message: 'application_id y decision (approve|reject) requeridos' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    if (decision === 'approve' && !['A', 'B'].includes(plan)) {
      return new Response(
        JSON.stringify({ error: 'Bad request', message: 'plan A o B requerido al aprobar' }),
        { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const { data: app, error: appError } = await admin
      .from('wholesale_applications')
      .select('*')
      .eq('id', application_id)
      .single();
    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: 'Not found', message: 'Solicitud no encontrada' }),
        { status: 404, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
    if (app.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Conflict', message: 'La solicitud ya fue revisada' }),
        { status: 409, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    const reviewedAt = new Date().toISOString();

    if (decision === 'reject') {
      await admin
        .from('wholesale_applications')
        .update({
          status: 'rejected',
          reviewed_at: reviewedAt,
          reviewed_by: user.id,
        })
        .eq('id', application_id);

      // TODO: enviar email de rechazo (Resend/SendGrid o similar)
      // sendRejectionEmail(app.email, app.full_name);

      return new Response(
        JSON.stringify({ ok: true, message: 'Solicitud rechazada' }),
        { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }

    // Aprobar: actualizar aplicación, invitar usuario, perfil se crea con trigger al aceptar invitación
    await admin
      .from('wholesale_applications')
      .update({
        status: 'approved',
        reviewed_at: reviewedAt,
        reviewed_by: user.id,
        wholesale_plan: plan,
      })
      .eq('id', application_id);

    const siteUrl = Deno.env.get('VITE_SITE_URL') || 'http://localhost:5175';
    const redirectTo = `${siteUrl}/acceso`;

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(app.email, {
      data: {
        full_name: app.full_name,
        wholesale_plan: plan,
      },
      redirectTo,
    });

    if (inviteError) {
      // Si el usuario ya existe, actualizar perfil y no fallar
      if (inviteError.message?.includes('already been registered') || inviteError.message?.includes('already exists')) {
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email?.toLowerCase() === app.email?.toLowerCase());
        if (existing) {
          await admin.from('profiles').upsert(
            {
              id: existing.id,
              email: existing.email,
              full_name: app.full_name,
              role: 'wholesale',
              wholesale_status: 'approved',
              wholesale_plan: plan,
              updated_at: reviewedAt,
            },
            { onConflict: 'id' }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Invite failed', message: inviteError.message }),
          { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
        );
      }
    } else if (inviteData?.user) {
      const userId = inviteData.user.id;
      await admin.from('profiles').upsert(
        {
          id: userId,
          email: app.email,
          full_name: app.full_name,
          role: 'wholesale',
          wholesale_status: 'approved',
          wholesale_plan: plan,
          updated_at: reviewedAt,
        },
        { onConflict: 'id' }
      );
      await admin.from('wholesale_applications').update({ user_id: userId }).eq('id', application_id);
    }

    return new Response(
      JSON.stringify({ ok: true, message: 'Solicitud aprobada; invitación enviada por email' }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(e) }),
      { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
    );
  }
});
