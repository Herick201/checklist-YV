export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { clientEmail, sections } = body;
  if (!clientEmail || !sections) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  const htmlBody = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F7F6F2;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E2DFD6;">

        <!-- Header -->
        <tr>
          <td style="background:#1D9E75;padding:32px 40px;text-align:center;">
            <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.2);border-radius:12px;line-height:48px;font-size:24px;margin-bottom:16px;">✅</div>
            <h1 style="margin:0;color:white;font-size:22px;font-weight:600;">¡Tu tienda está lista!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Configuración completada el ${dateStr}</p>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding:32px 40px 24px;">
            <p style="margin:0;color:#1A1916;font-size:15px;line-height:1.7;">Hola,</p>
            <p style="margin:12px 0 0;color:#4A4845;font-size:15px;line-height:1.7;">Nos complace informarte que la configuración de tu tienda fue revisada y completada por nuestro equipo. A continuación encontrarás el resumen de todo lo que fue configurado.</p>
          </td>
        </tr>

        <!-- Sections -->
        ${sections.map(sec => `
        <tr>
          <td style="padding:0 40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F2;border-radius:10px;overflow:hidden;border:1px solid #E2DFD6;">
              <tr>
                <td style="padding:12px 20px;background:#F0EEE8;border-bottom:1px solid #E2DFD6;">
                  <span style="font-size:13px;font-weight:600;color:#1A1916;text-transform:uppercase;letter-spacing:0.06em;">${sec.name}</span>
                </td>
              </tr>
              ${sec.items.map(item => `
              <tr>
                <td style="padding:10px 20px;border-bottom:1px solid #E2DFD6;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:22px;vertical-align:top;padding-top:1px;">
                      <div style="width:18px;height:18px;background:#1D9E75;border-radius:4px;text-align:center;line-height:18px;color:white;font-size:11px;font-weight:700;">✓</div>
                    </td>
                    <td style="font-size:14px;color:#4A4845;line-height:1.5;padding-left:8px;">${item}</td>
                  </tr></table>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>`).join('')}

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 36px;">
            <p style="margin:0;color:#4A4845;font-size:15px;line-height:1.7;">Tu vendedor ya está listo para atender a tus clientes. Si tienes alguna duda, no dudes en contactarnos.</p>
            <p style="margin:20px 0 0;color:#1A1916;font-size:14px;font-weight:600;">Saludos,<br><span style="color:#1D9E75;">Equipo de Customer Success · Yavendio</span></p>
          </td>
        </tr>

        <!-- Bottom bar -->
        <tr>
          <td style="background:#F0EEE8;padding:16px 40px;text-align:center;border-top:1px solid #E2DFD6;">
            <p style="margin:0;font-size:12px;color:#8A877E;">Este mensaje fue enviado automáticamente por el equipo de Yavendio.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Yavendio CS <yago@yavendio.com>',
      to: [clientEmail],
      subject: '✅ Tu tienda está lista — Resumen de configuración',
      html: htmlBody
    })
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/send-email' };
