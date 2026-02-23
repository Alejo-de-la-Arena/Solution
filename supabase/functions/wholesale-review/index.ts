// Supabase Edge Function: aprobar o rechazar solicitud mayorista.
// Requiere: Authorization Bearer (JWT del admin).
// Emails: Resend (con modo test via RESEND_TEST_TO_EMAIL).
// Idempotencia: 409 si ya revisada.
// DISABLE_SUPABASE_INVITES=true evita inviteUserByEmail (testing / rate limits).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, Authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const jsonHeaders = () => ({ ...cors, "Content-Type": "application/json" });

type ResendResult = { ok: boolean; error?: string; status?: number };

function obfuscateEmail(email: string) {
  return email?.replace(/(.{2}).*(@.*)/, "$1***$2") ?? "";
}

async function sendEmailResend(
  opts: { to: string; subject: string; html: string }
): Promise<ResendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("RESEND_FROM_EMAIL")?.trim();

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set – email not sent");
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  if (!from) {
    console.warn("RESEND_FROM_EMAIL not set – email not sent");
    return { ok: false, error: "RESEND_FROM_EMAIL not set" };
  }

  // Test routing opcional: si existe RESEND_TEST_TO_EMAIL, mandamos TODO a ese email.
  // En prod no lo seteás y listo.
  const resendTestTo = (Deno.env.get("RESEND_TEST_TO_EMAIL") ?? "").trim();
  const finalTo = resendTestTo || opts.to;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: finalTo,
        subject: opts.subject,
        html: opts.html,
      }),
    });

    const data = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg = (data as any)?.message ?? `Resend ${res.status}`;
      console.error("Resend error", res.status, msg);
      return { ok: false, error: msg, status: res.status };
    }

    // Si estás en modo test, loguea a quién iba originalmente
    if (resendTestTo) {
      console.log(
        "Email sent (TEST ROUTE) to",
        obfuscateEmail(resendTestTo),
        "originalTo:",
        obfuscateEmail(opts.to),
        "subject:",
        opts.subject
      );
    } else {
      console.log("Email sent to", obfuscateEmail(opts.to), "subject:", opts.subject);
    }

    return { ok: true };
  } catch (e) {
    console.error("Resend exception", String(e));
    return { ok: false, error: String(e) };
  }
}


function mustEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

async function assertOk<T>(label: string, p: Promise<{ data: T; error: any }>) {
  const { data, error } = await p;
  if (error) {
    console.error(`${label} error:`, error?.message ?? error);
    throw new Error(`${label}: ${error?.message ?? "unknown error"}`);
  }
  return data;
}

Deno.serve(async (req) => {
  const authRaw = req.headers.get("Authorization") ?? req.headers.get("authorization");
  const authHeaderPresent = Boolean(authRaw && authRaw.trim().length > 0);

  console.log("FUNC_START_OK", { method: req.method, authHeaderPresent });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  if (req.method === "GET") {
    return new Response(JSON.stringify({ pong: true, authHeaderPresent }), {
      status: 200,
      headers: jsonHeaders(),
    });
  }

  try {
    // --- Auth header ---
    if (!authRaw?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Falta token" }), {
        status: 401,
        headers: jsonHeaders(),
      });
    }

    const token = authRaw.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Falta token" }), {
        status: 401,
        headers: jsonHeaders(),
      });
    }

    // --- Supabase clients ---
    const supabaseUrl = mustEnv("SUPABASE_URL");
    const supabaseAnonKey = mustEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate token -> user
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: userError?.message ?? "Token inválido" }), {
        status: 401,
        headers: jsonHeaders(),
      });
    }

    // Admin check
    const profile = await assertOk("select profiles(role)", admin.from("profiles").select("role").eq("id", user.id).single());
    const isAdmin = (profile as any)?.role === "admin";

    if (!isAdmin) {
      const adminRow = await assertOk(
        "select admins(user_id)",
        admin.from("admins").select("user_id").eq("user_id", user.id).maybeSingle()
      );
      if (!adminRow) {
        return new Response(JSON.stringify({ error: "Forbidden", message: "Solo administradores" }), {
          status: 403,
          headers: jsonHeaders(),
        });
      }
    }

    // Body
    const body = await req.json().catch(() => ({}));
    const { application_id, decision, plan } = body;

    if (!application_id || !decision || !["approve", "reject"].includes(decision)) {
      return new Response(
        JSON.stringify({ error: "Bad request", message: "application_id y decision (approve|reject) requeridos" }),
        { status: 400, headers: jsonHeaders() }
      );
    }
    if (decision === "approve" && !["A", "B"].includes(plan)) {
      return new Response(JSON.stringify({ error: "Bad request", message: "plan A o B requerido al aprobar" }), {
        status: 400,
        headers: jsonHeaders(),
      });
    }

    // Fetch application
    const app = await assertOk(
      "select wholesale_applications(*)",
      admin.from("wholesale_applications").select("*").eq("id", application_id).single()
    );

    if (!app) {
      return new Response(JSON.stringify({ error: "Not found", message: "Solicitud no encontrada" }), {
        status: 404,
        headers: jsonHeaders(),
      });
    }

    if ((app as any).status !== "pending") {
      return new Response(JSON.stringify({ error: "Conflict", message: "La solicitud ya fue revisada. No se reenvían emails." }), {
        status: 409,
        headers: jsonHeaders(),
      });
    }

    const reviewedAt = new Date().toISOString();
    const siteUrl = (Deno.env.get("SITE_URL") ?? Deno.env.get("VITE_SITE_URL") ?? "http://localhost:5173").replace(/\/$/, "");
    const disableInvites = Deno.env.get("DISABLE_SUPABASE_INVITES") === "true";

    // Resend test routing:
    const resendTestTo = (Deno.env.get("RESEND_TEST_TO_EMAIL") ?? "").trim();
    const resolveEmailTo = (realTo: string) => (resendTestTo ? resendTestTo : realTo);
    const withTestPrefix = (subject: string, realTo: string) => (resendTestTo ? `[TEST to=${realTo}] ${subject}` : subject);

    const sendApplicantEmail = (realTo: string, subject: string, html: string) => {
      const safeRealTo = (realTo ?? "").trim();
      return sendEmailResend({
        to: resolveEmailTo(safeRealTo),
        subject: withTestPrefix(subject, safeRealTo),
        html,
      });
    };


    // Common email bits
    const realTo = (app as any).email as string;
    const fullName = ((app as any).full_name || "").trim() || "revendedor/a";

    if (decision === "reject") {
      // Update status -> rejected
      await assertOk(
        "update wholesale_applications(rejected)",
        admin
          .from("wholesale_applications")
          .update({ status: "rejected", reviewed_at: reviewedAt, reviewed_by: user.id })
          .eq("id", application_id)
          .select("id")
          .single()
      );

      const rejectHtml = `
        <p>Hola ${fullName},</p>
        <p>Te informamos que tu solicitud al programa mayorista de Solution <strong>no ha sido aprobada</strong> en esta oportunidad.</p>
        <p>Si tenés dudas, podés contactarnos.</p>
        <p>Saludos,<br/>Solution</p>
      `;

      const emailResult = await sendApplicantEmail(
        realTo,
        "Solicitud rechazada – Programa mayorista Solution",
        rejectHtml
      );

      return new Response(JSON.stringify({ ok: true, message: "Solicitud rechazada", emailSent: emailResult.ok, emailError: emailResult.error }), {
        status: 200,
        headers: jsonHeaders(),
      });
    }

    const planLabel = plan === "B" ? "Revendedor Premium (Plan B)" : "Revendedor Inicial (Plan A)";
    const loginLink = `${siteUrl}/programa-mayorista`;   // ✅ importante
    const mayoristaLink = `${siteUrl}/mayorista`;
    const programaLink = `${siteUrl}/programa-mayorista`;

    // update approved (igual)
    await assertOk(
      "update wholesale_applications(approved)",
      admin
        .from("wholesale_applications")
        .update({ status: "approved", reviewed_at: reviewedAt, reviewed_by: user.id, wholesale_plan: plan })
        .eq("id", application_id)
        .select("id,status,wholesale_plan")
        .single()
    );

    if (disableInvites) {
      // ✅ En test no hay invite => NO existe usuario Auth, no hay password.
      // Este mail sirve para notificar + dirigir al login/registro.
      const approveHtml = `
    <p>Hola ${fullName},</p>
    <p>Tu solicitud al programa mayorista de Solution fue <strong>aprobada</strong>.</p>
    <p>Plan asignado: <strong>${planLabel}</strong>.</p>
    <p><strong>Beneficios:</strong> acceso al portal mayorista, precios según tu plan, y compra por volumen.</p>
    <p>Ingresar / Registrarte: <a href="${loginLink}">${loginLink}</a></p>
    <p>Portal mayorista: <a href="${mayoristaLink}">${mayoristaLink}</a></p>
    <p>Página del programa: <a href="${programaLink}">${programaLink}</a></p>
    <p style="color:#999;font-size:12px;margin-top:14px;">
      Nota (modo test): la creación de contraseña se habilita cuando activamos las invitaciones de Supabase.
    </p>
    <p>Saludos,<br/>Solution</p>
  `;

      const emailResult = await sendApplicantEmail(
        realTo,
        "Solicitud aprobada – Programa mayorista Solution",
        approveHtml
      );


      return new Response(
        JSON.stringify({
          ok: true,
          message: "Solicitud aprobada (modo test: sin invite Supabase)",
          mode: "no_invite",
          emailSent: emailResult.ok,
          emailError: emailResult.error,
        }),
        { status: 200, headers: jsonHeaders() }
      );
    }

    // --- PROD mode: invite ---
    const redirectTo = `${siteUrl}/set-password`;
    // --- PROD mode: generate invite link (no SMTP Supabase) ---
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "invite",
      email: realTo,
      options: {
        redirectTo: `${siteUrl}/set-password`,
        data: { full_name: (app as any).full_name, wholesale_plan: plan },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      throw new Error(`generateLink(invite): ${linkError?.message ?? "missing action_link"}`);
    }

    const actionLink = linkData.properties.action_link;
    const invitedUserId = linkData.user?.id;

    // Si tenemos userId, upsert profile + linkear application
    if (invitedUserId) {
      await assertOk(
        "upsert profiles(invite link)",
        admin
          .from("profiles")
          .upsert(
            {
              id: invitedUserId,
              email: realTo,
              full_name: (app as any).full_name,
              role: "wholesale",
              wholesale_status: "approved",
              wholesale_plan: plan,
              updated_at: reviewedAt,
            },
            { onConflict: "id" }
          )
          .select("id")
          .single()
      );

      await assertOk(
        "update wholesale_applications(user_id from link)",
        admin
          .from("wholesale_applications")
          .update({ user_id: invitedUserId })
          .eq("id", application_id)
          .select("id")
          .single()
      );
    }

    // Email de aprobación con link real de activación
    const approveHtml = `
  <p>Hola ${fullName},</p>
  <p>Tu solicitud al programa mayorista de Solution fue <strong>aprobada</strong>.</p>
  <p>Plan asignado: <strong>${planLabel}</strong>.</p>
  <p>Para activar tu cuenta y crear tu contraseña, hacé click acá:</p>
  <p><a href="${actionLink}">Crear contraseña / Activar cuenta</a></p>
  <p>Luego podés ingresar desde: <a href="${siteUrl}/programa-mayorista">${siteUrl}/programa-mayorista</a></p>
  <p>Saludos,<br/>Solution</p>
`;

    const emailResult = await sendApplicantEmail(
      realTo,
      "Solicitud aprobada – Programa mayorista Solution",
      approveHtml
    );

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Solicitud aprobada; link de activación generado y email enviado",
        emailSent: emailResult.ok,
        emailError: emailResult.error,
      }),
      { status: 200, headers: jsonHeaders() }
    );
  } catch (e) {
    console.error("FUNCTION_ERROR", String(e));
    return new Response(JSON.stringify({ error: "Internal error", message: String(e) }), {
      status: 500,
      headers: jsonHeaders(),
    });
  }
});
