import httpx

from app.core.config import settings


class EmailSendError(RuntimeError):
    pass


def send_email(to: str, subject: str, html: str, text: str | None = None) -> bool:
    if not settings.email_enabled or not settings.brevo_api_key or not settings.sender_email:
        return False

    payload = {
        "sender": {"name": settings.sender_name, "email": settings.sender_email},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": html,
        "textContent": text or _plain_text_from_html(html),
    }
    headers = {
        "api-key": settings.brevo_api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    try:
        response = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            json=payload,
            headers=headers,
            timeout=12,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 401:
            raise EmailSendError("Brevo API key is invalid. Check your API key.") from exc
        raise EmailSendError("Could not send verification email. Please try again.") from exc
    except httpx.RequestError as exc:
        raise EmailSendError("Email service is not reachable right now. Please try again.") from exc

    return True


def send_verification_email(recipient_email: str, full_name: str, verification_code: str) -> bool:
    html = (
        f"""
        <html>
          <body style="margin:0;background:#fbf6ec;padding:32px;font-family:Arial,sans-serif;color:#1f2a44;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center">
                  <table role="presentation" width="100%" style="max-width:520px;background:#fffaf2;border:1px solid #dfd5c7;border-radius:18px;padding:28px;">
                    <tr>
                      <td>
                        <h1 style="margin:0 0 10px;font-size:24px;color:#1f2a44;">Verify your FinTrack AI account</h1>
                        <p style="margin:0 0 22px;color:#6a4c56;">Hi {full_name}, use this OTP to continue securely.</p>
                        <div style="display:inline-block;padding:14px 18px;border-radius:12px;background:#f4dce6;color:#b0305c;font-size:30px;font-weight:800;letter-spacing:8px;">
                          {verification_code}
                        </div>
                        <p style="margin:22px 0 0;color:#6a4c56;">This code is valid for {settings.otp_ttl_minutes} minutes.</p>
                        <p style="margin:10px 0 0;color:#6a4c56;">If you did not request it, you can ignore this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """
    )
    text = "\n".join(
        [
            f"Hi {full_name},",
            "",
            "Use this OTP to verify your FinTrack AI account:",
            verification_code,
            "",
            f"This code is valid for {settings.otp_ttl_minutes} minutes.",
        ]
    )
    return send_email(recipient_email, "Verify your FinTrack AI account", html, text)


def _smtp_is_configured() -> bool:
    return all(
        [
            settings.email_enabled,
            settings.brevo_smtp_host,
            settings.brevo_smtp_port,
            settings.brevo_smtp_user,
            settings.brevo_smtp_pass,
            settings.sender_email,
        ]
    )


def _plain_text_from_html(html: str) -> str:
    return " ".join(html.replace("<", " <").split())
