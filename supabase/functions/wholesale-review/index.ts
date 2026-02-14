// Supabase Edge Function: aprobar o rechazar solicitud mayorista.
// Requiere: Authorization Bearer (JWT del admin). Emails: Resend. Idempotencia: 409 si ya revisada.
// DISABLE_SUPABASE_INVITES=true evita inviteUserByEmail (testing / rate limits).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, Authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const jsonHeaders = () => ({ ...cors, "Content-Type": "application/json" });

type ResendResult = { ok: boolean; error?: string };

function sendEmailResend(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<ResendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set – email not sent");
    return Promise.resolve({ ok: false, error: "RESEND_API_KEY not set" });
  }
  if (!from) {
    console.warn("RESEND_FROM_EMAIL not set – email not sent");
    return Promise.resolve({ ok: false, error: "RESEND_FROM_EMAIL not set" });
  }

  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data as { message?: string })?.message ??
          (data as { error?: string })?.error ??
          String(res.status);
        console.error("Resend error", res.status, msg);
        return { ok: false, error: msg };
      }

      // Log sin exponer datos sensibles
      console.log(
        "Email sent to",
        opts.to.replace(/(.{2}).*(@.*)/, "$1***$2"),
        "subject:",
        opts.subject
      );
      return { ok: true };
    })
    .catch((e) => {
      console.error("Resend exception", String(e));
      return { ok: false, error: String(e) };
    });
}

Deno.serve(async (req) => {
  const authRaw = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const authHeaderPresent = Boolean(authRaw && authRaw.trim().length > 0);
  console.log("FUNC_START_OK", { method: req.method, authHeaderPresent });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ pong: true, authHeaderPresent }), {
      status: 200,
      headers: jsonHeaders(),
    });
  }

  try {
    // --- Auth header ---
    const authHeader = authRaw ?? null;
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "No autorizado", message: "Falta token" }),
        { status: 401, headers: jsonHeaders() }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Falta token" }),
        { status: 401, headers: jsonHeaders() }
      );
    }

    // --- Supabase env ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // --- Validate user token ---
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: userError?.message ?? "Token inválido",
        }),
        { status: 401, headers: jsonHeaders() }
      );
    }

    // --- Admin client ---
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // --- Check admin ---
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";
    if (!isAdmin) {
      const { data: adminRow } = await admin
        .from("admins")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!adminRow) {
        return new Response(
          JSON.stringify({ error: "Forbidden", message: "Solo administradores" }),
          { status: 403, headers: jsonHeaders() }
        );
      }
    }

    // --- Parse body ---
    const body = await req.json();
    const { application_id, decision, plan } = body;

    if (!application_id || !decision || !["approve", "reject"].includes(decision)) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "application_id y decision (approve|reject) requeridos",
        }),
        { status: 400, headers: jsonHeaders() }
      );
    }
    if (decision === "approve" && !["A", "B"].includes(plan)) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "plan A o B requerido al aprobar",
        }),
        { status: 400, headers: jsonHeaders() }
      );
    }

    // --- Load application ---
    const { data: app, error: appError } = await admin
      .from("wholesale_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: "Not found", message: "Solicitud no encontrada" }),
        { status: 404, headers: jsonHeaders() }
      );
    }

    // --- Idempotencia ---
    if (app.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "La solicitud ya fue revisada. No se reenvían emails.",
        }),
        { status: 409, headers: jsonHeaders() }
      );
    }

    const reviewedAt = new Date().toISOString();

    // Base URL sin slash final (evita //acceso)
    const rawSiteUrl =
      Deno.env.get("SITE_URL") ?? Deno.env.get("VITE_SITE_URL") ?? "http://localhost:5173";
    const siteUrl = rawSiteUrl.replace(/\/$/, "");

    const disableInvites = Deno.env.get("DISABLE_SUPABASE_INVITES") === "true";

    // --- Resend “test mode”: si está seteado, manda siempre al mismo email (tu email) ---
    const resendTestTo = Deno.env.get("RESEND_TEST_TO_EMAIL")?.trim() || "";
    const resolveEmailTo = (realTo: string) => (resendTestTo ? resendTestTo : realTo);
    const withTestPrefix = (subject: string, realTo: string) =>
      resendTestTo ? `[TEST to=${realTo}] ${subject}` : subject;

    // Helper: manda email respetando test mode
    async function sendResendToApplicant(opts: { realTo: string; subject: string; html: string }) {
      return sendEmailResend({
        to: resolveEmailTo(opts.realTo),
        subject: withTestPrefix(opts.subject, opts.realTo),
        html: opts.html,
      });
    }

    // --- Reject ---
    if (decision === "reject") {
      await admin
        .from("wholesale_applications")
        .update({
          status: "rejected",
          reviewed_at: reviewedAt,
          reviewed_by: user.id,
        })
        .eq("id", application_id);

      const rejectHtml = `
        <p>Hola ${(app.full_name || "").trim() || "revendedor/a"},</p>
        <p>Te informamos que tu solicitud al programa mayorista de Solution no ha sido aprobada en esta oportunidad.</p>
        <p>Si tenés dudas, podés contactarnos.</p>
        <p>Saludos,<br/>Solution</p>
      `;

      const emailResult = await sendResendToApplicant({
        realTo: app.email,
        subject: "Solicitud rechazada – Programa mayorista Solution",
        html: rejectHtml,
      });

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Solicitud rechazada",
          emailSent: emailResult.ok,
          emailError: emailResult.ok ? undefined : emailResult.error,
        }),
        { status: 200, headers: jsonHeaders() }
      );
    }

    // --- Approve (DB first) ---
    await admin
      .from("wholesale_applications")
      .update({
        status: "approved",
        reviewed_at: reviewedAt,
        reviewed_by: user.id,
        wholesale_plan: plan,
      })
      .eq("id", application_id);

    const loginLink = `${siteUrl}/acceso`;
    const programaLink = `${siteUrl}/programa-mayorista`;
    const planLabel = plan === "B" ? "Revendedor Premium (Plan B)" : "Revendedor Inicial (Plan A)";

    const approveHtml = `
      <p>Hola ${(app.full_name || "").trim() || "revendedor/a"},</p>
      <p>Tu solicitud al programa mayorista de Solution fue <strong>aprobada</strong>.</p>
      <p>Plan asignado: <strong>${planLabel}</strong>.</p>
      <p>Podés acceder al portal e iniciar sesión aquí:</p>
      <p>
        <a href="${loginLink}" style="display:inline-block;padding:10px 20px;background:#0ff;color:#000;text-decoration:none;border-radius:4px;">
          Acceder al portal mayorista
        </a>
      </p>
      <p>Si el botón no funciona, copiá en tu navegador: ${loginLink}</p>
      <p>Página del programa: <a href="${programaLink}">${programaLink}</a></p>
      <p>Saludos,<br/>Solution</p>
    `;

    // --- Test mode: sin invites para evitar rate limit Supabase ---
    if (disableInvites) {
      const emailResult = await sendResendToApplicant({
        realTo: app.email,
        subject: "Solicitud aprobada – Programa mayorista Solution",
        html: approveHtml,
      });

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Solicitud aprobada (modo test: sin invite Supabase)",
          mode: "no_invite",
          emailSent: emailResult.ok,
          emailError: emailResult.ok ? undefined : emailResult.error,
        }),
        { status: 200, headers: jsonHeaders() }
      );
    }

    // --- Prod mode: invite + upsert profile + email ---
    const redirectTo = `${siteUrl}/acceso`;

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      app.email,
      {
        data: { full_name: app.full_name, wholesale_plan: plan },
        redirectTo,
      }
    );

    if (inviteError) {
      // Usuario ya existe: intentar encontrarlo y upsert profile
      if (
        inviteError.message?.includes("already been registered") ||
        inviteError.message?.includes("already exists")
      ) {
        const { data: list } = await admin.auth.admin.listUsers();
        const existing = list?.users?.find(
          (u) => u.email?.toLowerCase() === app.email?.toLowerCase()
        );

        if (existing) {
          await admin.from("profiles").upsert(
            {
              id: existing.id,
              email: existing.email,
              full_name: app.full_name,
              role: "wholesale",
              wholesale_status: "approved",
              wholesale_plan: plan,
              updated_at: reviewedAt,
            },
            { onConflict: "id" }
          );
          await admin.from("wholesale_applications").update({ user_id: existing.id }).eq("id", application_id);
        }
      } else {
        return new Response(
          JSON.stringify({ error: "Invite failed", message: inviteError.message }),
          { status: 500, headers: jsonHeaders() }
        );
      }
    } else if (inviteData?.user) {
      const userId = inviteData.user.id;
      await admin.from("profiles").upsert(
        {
          id: userId,
          email: app.email,
          full_name: app.full_name,
          role: "wholesale",
          wholesale_status: "approved",
          wholesale_plan: plan,
          updated_at: reviewedAt,
        },
        { onConflict: "id" }
      );
      await admin.from("wholesale_applications").update({ user_id: userId }).eq("id", application_id);
    }

    const emailResult = await sendResendToApplicant({
      realTo: app.email,
      subject: "Solicitud aprobada – Programa mayorista Solution",
      html: approveHtml,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Solicitud aprobada; invitación y email enviados",
        emailSent: emailResult.ok,
        emailError: emailResult.ok ? undefined : emailResult.error,
      }),
      { status: 200, headers: jsonHeaders() }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Internal error", message: String(e) }),
      { status: 500, headers: jsonHeaders() }
    );
  }
});
