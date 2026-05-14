import { getTemplate } from '../configs/templates.config.js';

const layout = ({ body, ctaLabel, ctaUrl }) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>EventHub</title>
  <style>
    @media only screen and (max-width: 600px) {
      .wrap { width: 100% !important; border-radius: 0 !important; }
      .pad  { padding: 20px !important; }
      .cta  { display: block !important; width: 100% !important; box-sizing: border-box; }
      .h1   { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" class="wrap" width="100%" cellpadding="0" cellspacing="0"
             style="width:100%;max-width:600px;background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#0F1B3D;padding:24px;color:#ffffff;font-weight:700;font-size:20px;letter-spacing:0.02em;">
          Event<span style="color:#FF5A1F;">Hub</span>
        </td></tr>
        <tr><td class="pad" style="padding:32px;color:#111827;line-height:1.6;font-size:15px;">
          ${body}
          ${ctaUrl ? `<p style="margin:24px 0 0;">
            <a href="${ctaUrl}" class="cta"
               style="background:#FF5A1F;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-weight:600;display:inline-block;text-align:center;">
              ${ctaLabel}
            </a>
          </p>` : ''}
        </td></tr>
        <tr><td style="background:#0F1B3D;padding:16px 24px;color:#9CA3AF;font-size:12px;text-align:center;">
          You received this because you have an account on EventHub.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

export const populateTemplate = (type, payload) => {
  const built = getTemplate(type)(payload);
  return {
    subject:     built.subject,
    html:        layout({ body: built.body, ctaLabel: built.ctaLabel, ctaUrl: built.ctaUrl }),
    attachments: built.attachments ?? [],
  };
};
