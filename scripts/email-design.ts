// Reusable FreeSerp email design, adapted from the frontend's thank-you email.
// Produces a full, email-client-safe HTML document (blue hero + waves + white
// body + pill CTA + blue footer). Images are referenced as {{assetBase}}/email/*
// so the platform fills assetBase at send time. {{firstName}} and
// {{unsubscribeUrl}} are filled per-recipient by the platform too.

const SITE = "https://freeserp.com";

export interface Feature {
  icon: string; // filename in /email, e.g. "ic-mail.png"
  title: string;
  text: string;
}

export interface EmailOpts {
  topRight: string; // small text top-right of hero
  heading: string; // big hero word(s)
  subtitle: string; // hero subtitle line
  illustration: string; // filename in /email
  body: string[]; // white-body paragraphs (first gray, rest bold black)
  features?: Feature[]; // optional 3-up feature row
  ctaText: string;
  ctaUrl: string;
  footerHeading: string;
  footerText: string; // may include <br/>
}

export function buildEmail(o: EmailOpts): string {
  const img = (name: string) => `{{assetBase}}/email/${name}`;

  const bodyHtml = o.body
    .map((p, i) =>
      i === 0
        ? `<p class="archivo" style="margin:0 0 16px 0;font-size:16px;line-height:26px;color:#3a3a42;font-weight:400;">${p}</p>`
        : `<p class="archivo" style="margin:0 0 6px 0;font-size:18px;line-height:27px;color:#000;font-weight:700;letter-spacing:-0.01em;">${p}</p>`
    )
    .join("");

  const featuresHtml = o.features
    ? `<tr><td class="px" style="background:#fff;padding:26px 36px 6px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      ${o.features
        .map(
          (f, i) =>
            `<td class="col" valign="top" width="33%" align="center" style="padding:0 8px;${i === 1 ? "border-left:1px solid #eaeaea;border-right:1px solid #eaeaea;" : ""}">
          <img src="${img(f.icon)}" width="56" height="56" alt="" style="width:56px;height:56px;margin:0 auto 12px auto;" />
          <p class="archivo" style="margin:0 0 5px 0;font-size:15px;font-weight:700;color:#000;">${f.title}</p>
          <p class="archivo" style="margin:0;font-size:13px;line-height:19px;color:#6d6d6d;">${f.text}</p></td>`
        )
        .join("")}
      </tr></table></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" /><meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" />
<title>FreeSerp</title>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
 body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
 table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
 img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block}
 body{margin:0;padding:0;width:100%!important;background:#eef1f6}
 a{text-decoration:none}
 .archivo{font-family:'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif}
 @media only screen and (max-width:600px){
  .container{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}
  .hero{font-size:52px!important;line-height:54px!important}
  .col{display:block!important;width:100%!important;padding:0 0 24px 0!important;border:0!important}
  .footcol{display:block!important;width:100%!important;text-align:left!important}}
</style>
</head>
<body class="archivo" style="margin:0;padding:0;background:#eef1f6;font-family:'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef1f6;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#fff;border-radius:22px;overflow:hidden;">

 <!-- HERO -->
 <tr><td bgcolor="#0454ff" class="px" style="background-color:#0454ff;background-image:linear-gradient(160deg,#2f7bff 0%,#0454ff 52%,#0246d6 100%);padding:34px 40px 0 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
   <td align="left" valign="middle" class="archivo" style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#fff;">
    <img src="${img("logo-freeserp.png")}" width="26" height="26" alt="" style="width:26px;height:26px;vertical-align:middle;display:inline-block;" />
    <span style="vertical-align:middle;padding-left:8px;">FreeSerp</span></td>
   <td align="right" valign="middle" class="archivo" style="font-size:13px;font-weight:500;color:rgba(255,255,255,.92);">${o.topRight}</td>
  </tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
   <td align="left" valign="middle" class="hero archivo" style="padding:24px 0 0 0;font-size:64px;line-height:64px;font-weight:800;letter-spacing:-0.04em;color:#fff;">${o.heading}</td>
   <td align="right" valign="middle" width="80" style="padding:24px 0 0 0;"><img src="${img("heart-outline.png")}" width="60" height="56" alt="" style="width:60px;height:auto;display:inline-block;" /></td>
  </tr></table>
  <p class="archivo" style="margin:12px 0 0 0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#fff;">${o.subtitle}</p>
  <div style="width:120px;height:3px;background:rgba(255,255,255,.85);border-radius:3px;margin:16px 0 0 0;"></div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
   <td align="center" style="padding:18px 0 0 0;"><img src="${img(o.illustration)}" width="460" alt="" style="width:460px;max-width:100%;height:auto;" /></td>
  </tr></table>
 </td></tr>

 <!-- wave blue->white -->
 <tr><td bgcolor="#0246d6" style="background-color:#0246d6;font-size:0;line-height:0;"><img src="${img("wave-white.png")}" width="600" alt="" style="width:100%;height:auto;" /></td></tr>

 <!-- BODY -->
 <tr><td class="px" align="center" style="background:#fff;padding:8px 44px 0 44px;">${bodyHtml}</td></tr>
 ${featuresHtml}

 <!-- CTA -->
 <tr><td align="center" style="background:#fff;padding:28px 40px 34px 40px;">
  <a href="${o.ctaUrl}" class="archivo" style="display:inline-block;background:#0454ff;color:#fff;font-size:17px;font-weight:700;letter-spacing:-0.01em;text-decoration:none;padding:16px 42px;border-radius:100px;box-shadow:0 12px 26px rgba(4,84,255,.32);">${o.ctaText}&nbsp;&nbsp;→</a>
 </td></tr>

 <!-- wave white->blue -->
 <tr><td bgcolor="#fff" style="background-color:#fff;font-size:0;line-height:0;"><img src="${img("wave-blue.png")}" width="600" alt="" style="width:100%;height:auto;" /></td></tr>

 <!-- FOOTER -->
 <tr><td bgcolor="#0454ff" class="px" style="background-color:#0454ff;background-image:linear-gradient(160deg,#0a57ee 0%,#0454ff 50%,#0246d6 100%);padding:6px 40px 30px 40px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
   <td class="footcol" valign="top" width="58%">
    <p class="archivo" style="margin:0;font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#fff;">${o.footerHeading}</p>
    <p class="archivo" style="margin:10px 0 0 0;font-size:14px;line-height:21px;color:rgba(255,255,255,.85);">${o.footerText}</p></td>
   <td class="footcol" valign="top" width="42%" align="right">
    <p class="archivo" style="margin:2px 0 12px 0;font-size:15px;font-weight:700;color:#fff;">Follow us</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>
     <td style="padding-left:8px;"><a href="${SITE}"><img src="${img("so-ig.png")}" width="36" height="36" alt="Instagram" style="width:36px;height:36px;" /></a></td>
     <td style="padding-left:8px;"><a href="${SITE}"><img src="${img("so-fb.png")}" width="36" height="36" alt="Facebook" style="width:36px;height:36px;" /></a></td>
     <td style="padding-left:8px;"><a href="${SITE}"><img src="${img("so-x.png")}" width="36" height="36" alt="X" style="width:36px;height:36px;" /></a></td>
     <td style="padding-left:8px;"><a href="${SITE}"><img src="${img("so-li.png")}" width="36" height="36" alt="LinkedIn" style="width:36px;height:36px;" /></a></td>
    </tr></table></td>
  </tr></table>
  <div style="border-top:1px solid rgba(255,255,255,.18);margin:22px 0 0 0;padding-top:16px;">
   <p class="archivo" style="margin:0;font-size:11.5px;line-height:18px;color:rgba(255,255,255,.6);">
    You're receiving this because you created an account at FreeSerp.<br/>
    <a href="{{unsubscribeUrl}}" style="color:rgba(255,255,255,.85);text-decoration:underline;">Unsubscribe</a>
    &nbsp;·&nbsp;<a href="${SITE}" style="color:rgba(255,255,255,.85);text-decoration:underline;">Visit website</a>
   </p></div>
 </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
