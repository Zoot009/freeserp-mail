// Clean, self-contained FreeSerp email design. No external images, no emoji —
// a professional gradient hero + body + button + footer, drawn entirely with
// HTML/CSS so it renders perfectly in every inbox and never breaks.
// {{ firstName }} and {{ unsubscribeUrl }} are filled per-recipient at send time.

export interface EmailOpts {
  label: string; // small uppercase label, top-right of the hero
  heading: string; // big hero heading
  subtitle: string; // hero subtitle line
  body: string[]; // body paragraphs (first is muted, the rest are bold)
  ctaText: string;
  ctaUrl: string;
  footerText: string; // may contain <br/>
}

const SITE = "https://freeserp.com";

export function buildEmail(o: EmailOpts): string {
  const bodyHtml = o.body
    .map((p, i) =>
      i === 0
        ? `<p style="margin:0 0 14px;font-size:16px;line-height:26px;color:#475569;">${p}</p>`
        : `<p style="margin:0;font-size:19px;line-height:28px;color:#0f172a;font-weight:700;letter-spacing:-.01em;">${p}</p>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge"/><meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light"/><meta name="supported-color-schemes" content="light"/>
<title>FreeSerp</title>
</head>
<body style="margin:0;padding:0;background:#eef1f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;"><tr><td align="center" style="padding:30px 14px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 34px rgba(2,70,214,.08);">

  <!-- HERO -->
  <tr><td style="background:#0454ff;background-image:linear-gradient(160deg,#2f7bff 0%,#0454ff 55%,#0246d6 100%);padding:38px 46px 42px;">
    <table role="presentation" width="100%"><tr>
      <td style="font-size:19px;font-weight:800;letter-spacing:-.01em;"><a href="${SITE}" style="color:#ffffff;text-decoration:none;">FreeSerp</a></td>
      <td align="right" style="font-size:11px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;color:rgba(255,255,255,.82);">${o.label}</td>
    </tr></table>
    <div style="font-size:50px;line-height:54px;font-weight:800;letter-spacing:-.03em;color:#ffffff;padding-top:26px;">${o.heading}</div>
    <p style="margin:12px 0 0;font-size:20px;font-weight:600;letter-spacing:-.01em;color:rgba(255,255,255,.95);">${o.subtitle}</p>
    <div style="width:54px;height:4px;background:rgba(255,255,255,.9);border-radius:4px;margin-top:22px;"></div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:38px 50px 12px;text-align:center;">${bodyHtml}</td></tr>

  <!-- CTA -->
  <tr><td align="center" style="padding:30px 40px 40px;">
    <a href="${o.ctaUrl}" style="display:inline-block;background:#0454ff;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-.01em;text-decoration:none;padding:15px 44px;border-radius:10px;">${o.ctaText}</a>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #eef0f3;padding:26px 46px 30px;text-align:center;">
    <p style="margin:0;font-size:14px;line-height:21px;color:#475569;">${o.footerText}</p>
    <p style="margin:16px 0 0;font-size:11.5px;line-height:18px;color:#94a3b8;">You're receiving this because you created an account at FreeSerp.<br/>
    <a href="{{ unsubscribeUrl }}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp; <a href="${SITE}" style="color:#64748b;text-decoration:underline;">Visit website</a></p>
  </td></tr>

</table></td></tr></table>
</body>
</html>`;
}
